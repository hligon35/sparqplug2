export function digitsOnly(input: string): string {
  return String(input ?? "").replace(/\D+/g, "");
}

// Basic US/CA-ish formatting: (555) 555-0101
// Keeps partial input usable while typing.
export function formatPhoneInput(input: string): string {
  const digits = digitsOnly(input);
  if (!digits) return "";

  // Handle leading country code 1.
  const normalized = digits.length > 10 && digits.startsWith("1") ? digits.slice(1) : digits;
  const a = normalized.slice(0, 3);
  const b = normalized.slice(3, 6);
  const c = normalized.slice(6, 10);

  if (normalized.length <= 3) return a;
  if (normalized.length <= 6) return `(${a}) ${b}`;
  return `(${a}) ${b}-${c}`;
}

export function stripUrlWhitespace(input: string): string {
  return String(input ?? "").replace(/\s+/g, "");
}

// While typing: keep it minimal, only normalize obvious cases like leading www.
export function formatUrlInput(input: string): string {
  const s = stripUrlWhitespace(input);
  if (!s) return "";

  if (/^https?:\/\//i.test(s)) return s;
  if (/^www\./i.test(s)) return `https://${s}`;
  return s;
}

// On blur / on submit: if it looks like a domain, ensure a scheme.
export function normalizeUrlForLinking(input: string): string {
  const s = stripUrlWhitespace(input);
  if (!s) return "";

  if (/^https?:\/\//i.test(s)) return s;
  if (/^mailto:/i.test(s) || /^tel:/i.test(s)) return s;

  // If it contains a dot and no spaces, treat it like a host.
  if (/[.]/.test(s)) return `https://${s}`;

  return s;
}
