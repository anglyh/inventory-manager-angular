import { Directive, ElementRef, inject, OnDestroy, OnInit, output } from '@angular/core';

@Directive({
  selector: '[appInfiniteScroll]',
})
export class InfiniteScrollDirective implements OnInit, OnDestroy {
  scrolled = output<void>()

  #element = inject(ElementRef);
  #observer: IntersectionObserver | undefined;

  ngOnInit(): void {
    const options = { root: null, rootMargin: '100px', threshold: 0 };

    this.#observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) this.scrolled.emit();
    }, options)

    this.#observer.observe(this.#element.nativeElement);
  }

  ngOnDestroy(): void {
    this.#observer?.disconnect()
  }
}
