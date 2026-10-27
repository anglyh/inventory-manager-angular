import { Component, DestroyRef, ElementRef, effect, inject, input, output, signal, untracked, viewChild } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerBolt, tablerBoltOff, tablerCameraOff, tablerCameraRotate, tablerKeyboard, tablerX } from '@ng-icons/tabler-icons';
import type { BarcodeFormat, DetectedBarcode } from 'barcode-detector/ponyfill';

import { Modal } from '@/shared/components/modal/modal';
import { Button } from '@/shared/components/button/button';
import { expandUpcE, isValidGtin } from '@/features/products/utils/gtin';

/** Retail product codes only: QR and other formats are ignored. */
const FORMATS: BarcodeFormat[] = ['ean_13', 'ean_8', 'upc_a', 'upc_e'];
const DETECT_INTERVAL_MS = 200;
const MAX_DETECT_FAILURES = 5;
const CAMERA_STORAGE_KEY = 'barcode-scanner.camera';
/** Continuous mode: the same code is ignored until it has been out of view this long. */
const REPEAT_COOLDOWN_MS = 2000;

type Detector = { detect(source: HTMLVideoElement): Promise<DetectedBarcode[]> };
type DetectorClass = {
  new (options: { formats: BarcodeFormat[] }): Detector;
  getSupportedFormats(): Promise<readonly BarcodeFormat[]>;
};
type ScannerStatus = 'idle' | 'starting' | 'scanning' | 'error';

/** Lo que el padre informa en modo continuo: cuántos productos sumó y qué pasó con el último código. */
export interface ScanFeedback {
  added: number;
  message: string;
  tone: 'ok' | 'error';
}
// Image-capture extensions (Chrome Android) missing from the DOM typings.
type CameraCapabilities = MediaTrackCapabilities & {
  torch?: boolean;
  focusMode?: string[];
};

const MESSAGES = {
  insecure: 'La cámara solo funciona con https o en localhost',
  denied: 'No diste permiso para usar la cámara. Actívalo en el navegador y vuelve a intentar.',
  noCamera: 'No encontramos una cámara en este equipo.',
  generic: 'No se pudo abrir la cámara. Cierra otras apps que la usen y vuelve a intentar.',
  reader: 'No se pudo iniciar el lector de códigos.',
};

/**
 * Lector de códigos de barras con la cámara, dentro de su propio diálogo.
 * Usa el BarcodeDetector nativo si lee EAN-13; si no, carga el ponyfill (zxing-wasm) bajo demanda.
 * Acepta un código cuando se lee igual dos veces seguidas y su dígito verificador es válido.
 * Con `continuous` la cámara sigue abierta y emite cada código (útil en la caja para vender varios).
 */
@Component({
  selector: 'barcode-scanner',
  imports: [Modal, Button, NgIcon],
  viewProviders: [provideIcons({ tablerBolt, tablerBoltOff, tablerCameraOff, tablerCameraRotate, tablerKeyboard, tablerX })],
  templateUrl: './barcode-scanner.html',
})
export class BarcodeScanner {
  open = input(false);
  /**
   * Modo continuo: no se cierra al leer, emite cada código y no repite el mismo
   * hasta que pasen ~2 s sin verlo. Por defecto lee uno y se cierra.
   */
  continuous = input(false);
  /** Respuesta del padre a cada lectura (solo modo continuo): contador y último resultado. */
  feedback = input<ScanFeedback | null>(null);
  /** Código leído (GTIN válido). En modo normal el diálogo ya se está cerrando. */
  scanned = output<string>();
  /** La persona prefiere escribir el código. El diálogo ya se está cerrando. */
  manualRequested = output<void>();
  /** El diálogo terminó de cerrarse: el padre debe poner `open` en false. */
  closed = output<void>();

  status = signal<ScannerStatus>('idle');
  errorMessage = signal('');
  canRetry = signal(true);
  torchAvailable = signal(false);
  torchOn = signal(false);
  /** Back cameras (phones have several lenses; some can't focus up close). */
  cameraCount = signal(0);
  cameraIndex = signal(0);

  private cameras: string[] = [];
  private modal = viewChild.required(Modal);
  // Optional: the first effect run may happen before the view queries resolve.
  private video = viewChild<ElementRef<HTMLVideoElement>>('video');

  private stream: MediaStream | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  /** Each start gets a new session; stale async work from an older one is discarded. */
  private session = 0;
  private lastRead: string | null = null;
  private failures = 0;
  /** Continuous mode: last emitted code and when it was last seen in the frame. */
  private lastEmitted: string | null = null;
  private lastEmittedSeenAt = 0;

  constructor() {
    effect(() => {
      const isOpen = this.open();
      untracked(() => (isOpen ? void this.start() : this.stop()));
    });
    inject(DestroyRef).onDestroy(() => this.stop());
  }

  close() {
    this.stop();
    this.modal().close();
  }

  requestManual() {
    this.close();
    this.manualRequested.emit();
  }

  async start() {
    this.stop();
    const session = ++this.session;
    this.status.set('starting');
    this.errorMessage.set('');

    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      this.fail(MESSAGES.insecure, false);
      return;
    }

    try {
      const stream = await openCamera(readSavedCamera());
      if (session !== this.session) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      this.stream = stream;

      const video = this.video()?.nativeElement;
      if (!video) throw new Error('Video element not ready');
      video.srcObject = stream;
      await video.play().catch(() => undefined);

      const track = stream.getVideoTracks()[0];
      const capabilities = (track?.getCapabilities?.() ?? {}) as CameraCapabilities;
      this.torchAvailable.set(Boolean(capabilities.torch));
      if (track) {
        await enableContinuousFocus(track, capabilities);
        await this.loadCameras(track);
      }
    } catch (error) {
      if (session === this.session) this.fail(cameraErrorMessage(error));
      return;
    }

    let detector: Detector;
    try {
      detector = await createDetector();
    } catch {
      if (session === this.session) this.fail(MESSAGES.reader);
      return;
    }
    if (session !== this.session) return;

    this.status.set('scanning');
    this.scheduleDetect(session, detector);
  }

  /** Moves to the next back camera and remembers it for the next scan. */
  switchCamera() {
    if (this.cameras.length < 2) return;
    const next = this.cameras[(this.cameraIndex() + 1) % this.cameras.length];
    saveCamera(next);
    void this.start();
  }

  /** Device labels are only readable after the permission is granted, so this runs once the stream is open. */
  private async loadCameras(track: MediaStreamTrack) {
    const devices = await navigator.mediaDevices.enumerateDevices().catch(() => []);
    const videos = devices.filter(device => device.kind === 'videoinput');
    const back = videos.filter(device => /back|rear|environment|trasera/i.test(device.label));
    this.cameras = (back.length ? back : videos).map(device => device.deviceId);
    this.cameraCount.set(this.cameras.length);
    this.cameraIndex.set(Math.max(0, this.cameras.indexOf(track.getSettings().deviceId ?? '')));
  }

  async toggleTorch() {
    const track = this.stream?.getVideoTracks()[0];
    if (!track) return;
    const next = !this.torchOn();
    try {
      await track.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] });
      this.torchOn.set(next);
    } catch {
      this.torchAvailable.set(false);
    }
  }

  private scheduleDetect(session: number, detector: Detector) {
    this.timer = setTimeout(async () => {
      if (session !== this.session) return;
      const video = this.video()?.nativeElement;

      if (video && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        try {
          const results = await detector.detect(video);
          this.failures = 0;
          if (session !== this.session) return;
          if (this.accept(results)) return;
        } catch {
          // The wasm reader may fail to load (offline CDN) or a frame may not be ready.
          if (++this.failures >= MAX_DETECT_FAILURES) {
            if (session === this.session) this.fail(MESSAGES.reader);
            return;
          }
        }
      }

      if (session === this.session) this.scheduleDetect(session, detector);
    }, DETECT_INTERVAL_MS);
  }

  /** Returns true when a code was accepted and emitted. */
  private accept(results: DetectedBarcode[]): boolean {
    const result = results[0];
    if (!result) return false;

    const raw = result.rawValue.trim();
    const code = result.format === 'upc_e' ? expandUpcE(raw) : raw;
    if (!code || !isValidGtin(code)) {
      this.lastRead = null;
      return false;
    }
    if (code !== this.lastRead) {
      this.lastRead = code;
      return false;
    }

    if (this.continuous()) {
      this.emitContinuous(code);
      return false;
    }

    navigator.vibrate?.(60);
    this.close();
    this.scanned.emit(code);
    return true;
  }

  /**
   * Keeps the camera open. A product left in front of the camera is read every few frames,
   * so the same code only counts again after it has been out of view for REPEAT_COOLDOWN_MS.
   */
  private emitContinuous(code: string) {
    const now = Date.now();
    const repeated = code === this.lastEmitted && now - this.lastEmittedSeenAt < REPEAT_COOLDOWN_MS;
    this.lastEmittedSeenAt = now;
    if (repeated) return;

    this.lastEmitted = code;
    this.lastRead = null;
    navigator.vibrate?.(60);
    this.scanned.emit(code);
  }

  private fail(message: string, canRetry = true) {
    this.stop();
    this.errorMessage.set(message);
    this.canRetry.set(canRetry);
    this.status.set('error');
  }

  private stop() {
    this.session++;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.stream?.getTracks().forEach(track => track.stop());
    this.stream = null;
    const video = this.video()?.nativeElement;
    if (video) video.srcObject = null;
    this.torchAvailable.set(false);
    this.torchOn.set(false);
    this.lastRead = null;
    this.lastEmitted = null;
    this.lastEmittedSeenAt = 0;
    this.failures = 0;
    if (this.status() !== 'error') this.status.set('idle');
  }
}

async function createDetector(): Promise<Detector> {
  const Native = (globalThis as { BarcodeDetector?: DetectorClass }).BarcodeDetector;
  if (Native) {
    try {
      const supported = await Native.getSupportedFormats();
      if (supported.includes('ean_13')) {
        return new Native({ formats: FORMATS.filter(format => supported.includes(format)) });
      }
    } catch {
      // Fall back to the ponyfill.
    }
  }
  // Dynamic import: the ponyfill (and its wasm) only loads when needed.
  const { BarcodeDetector, prepareZXingModule } = await import('barcode-detector/ponyfill');
  // The wasm is served by the app itself (angular.json copies it to /zxing), not by jsDelivr:
  // it works when the CDN is down or blocked and always matches the installed version.
  // Configured once: new overrides on every scan could make the library reload the module.
  if (!zxingConfigured) {
    prepareZXingModule({
      overrides: {
        locateFile: (path: string, prefix: string) =>
          path.endsWith('.wasm') ? new URL(`zxing/${path}`, document.baseURI).href : prefix + path,
      },
    });
    zxingConfigured = true;
  }
  return new BarcodeDetector({ formats: FORMATS });
}

let zxingConfigured = false;

/** Opens the saved camera; if it is gone (new phone, other browser), falls back to any back camera. */
async function openCamera(deviceId: string | null): Promise<MediaStream> {
  // Without a resolution the browser picks 640x480: too few pixels for thin bars.
  const resolution = { width: { ideal: 1920 }, height: { ideal: 1080 } };
  if (deviceId) {
    try {
      return await navigator.mediaDevices.getUserMedia({ video: { ...resolution, deviceId: { exact: deviceId } }, audio: false });
    } catch {
      saveCamera(null);
    }
  }
  return navigator.mediaDevices.getUserMedia({ video: { ...resolution, facingMode: { ideal: 'environment' } }, audio: false });
}

/** Optional: a camera that doesn't support it keeps its default focus. */
async function enableContinuousFocus(track: MediaStreamTrack, capabilities: CameraCapabilities): Promise<void> {
  if (!capabilities.focusMode?.includes('continuous')) return;
  await track.applyConstraints({ advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet] }).catch(() => undefined);
}

function readSavedCamera(): string | null {
  try {
    return localStorage.getItem(CAMERA_STORAGE_KEY);
  } catch {
    return null;
  }
}

function saveCamera(deviceId: string | null) {
  try {
    if (deviceId) localStorage.setItem(CAMERA_STORAGE_KEY, deviceId);
    else localStorage.removeItem(CAMERA_STORAGE_KEY);
  } catch {
    // Storage blocked: the choice just isn't remembered.
  }
}

function cameraErrorMessage(error: unknown): string {
  const name = error instanceof DOMException ? error.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') return MESSAGES.denied;
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return MESSAGES.noCamera;
  return MESSAGES.generic;
}
