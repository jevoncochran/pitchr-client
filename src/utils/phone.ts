/**
 * Formats a raw phone number string into (XXX) XXX-XXXX.
 * Returns the original string unchanged if it doesn't match a 10- or 11-digit pattern.
 */
export const formatPhone = (raw: string): string => {
  const digits = raw.replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("1")) {
    const d = digits.slice(1);
    return `+1 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  }

  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  return raw;
};

/**
 * Strips a phone number down to digits only for use in a tel: href.
 */
export const toTelHref = (raw: string): string =>
  `tel:+1${raw.replace(/\D/g, "").replace(/^1/, "")}`;
