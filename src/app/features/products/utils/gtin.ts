/** Lengths of the GS1 codes printed on retail products: EAN-8, UPC-A, EAN-13 and GTIN-14. */
const GTIN_LENGTHS = [8, 12, 13, 14];

/** True when `code` is a GTIN with a valid GS1 check digit (same rule as the backend). */
export function isValidGtin(code: string): boolean {
  if (!/^\d+$/.test(code) || !GTIN_LENGTHS.includes(code.length)) return false;

  const digits = [...code].map(Number);
  const checkDigit = digits.pop()!;
  const sum = digits
    .reverse()
    .reduce((total, digit, index) => total + digit * (index % 2 === 0 ? 3 : 1), 0);

  return (10 - (sum % 10)) % 10 === checkDigit;
}

/**
 * Expands an 8-digit UPC-E code to its 12-digit UPC-A form, the one product databases use.
 * Returns null when the value is not a UPC-E code.
 */
export function expandUpcE(code: string): string | null {
  if (!/^[01]\d{7}$/.test(code)) return null;

  const [system, d1, d2, d3, d4, d5, d6, check] = [...code];
  let body: string;
  switch (d6) {
    case '0':
    case '1':
    case '2':
      body = `${d1}${d2}${d6}0000${d3}${d4}${d5}`;
      break;
    case '3':
      body = `${d1}${d2}${d3}00000${d4}${d5}`;
      break;
    case '4':
      body = `${d1}${d2}${d3}${d4}00000${d5}`;
      break;
    default:
      body = `${d1}${d2}${d3}${d4}${d5}0000${d6}`;
  }
  return `${system}${body}${check}`;
}
