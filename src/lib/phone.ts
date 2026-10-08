/**
 * Normalizes Pakistani mobile numbers to `03XXXXXXXXX` (11 digits).
 * Accepts `+92 300 1234567`, `0300-1234567`, `923001234567`, `00923001234567`, `3001234567`.
 * Returns null when the input cannot be normalized to a valid mobile number.
 */
export function normalizePhone(input: string | null | undefined): string | null {
  if (!input) return null;
  let digits = String(input).replace(/\D/g, '');
  if (digits.startsWith('0092')) digits = digits.slice(4);
  else if (digits.startsWith('92') && digits.length === 12) digits = digits.slice(2);
  if (digits.length === 10 && digits.startsWith('3')) digits = `0${digits}`;
  return /^03\d{9}$/.test(digits) ? digits : null;
}

export function isValidPakPhone(input: string | null | undefined): boolean {
  return normalizePhone(input) !== null;
}

/** `0300 1234567` for display. */
export function formatPhone(phone: string): string {
  return /^03\d{9}$/.test(phone) ? `${phone.slice(0, 4)} ${phone.slice(4)}` : phone;
}
