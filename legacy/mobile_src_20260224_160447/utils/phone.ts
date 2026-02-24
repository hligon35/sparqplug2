export function digitsOnly(input: string): string {
  return String(input ?? "").replace(/\D/g, "");
}

// Formats a US phone number "as you type".
// Examples:
// - "1" -> "1"
// - "123" -> "123"
// - "1234" -> "(123) 4"
// - "1234567" -> "(123) 456-7"
// - "1234567890" -> "(123) 456-7890"
// - "11234567890" -> "1 (123) 456-7890"
export function formatPhoneAsYouType(input: string): string {
  const rawDigits = digitsOnly(input);
  if (!rawDigits) return "";

  let digits = rawDigits;
  let prefix = "";

  // Allow a leading US country code.
  if (digits.length > 10 && digits.startsWith("1")) {
    prefix = "1 ";
    digits = digits.slice(1);
  }

  digits = digits.slice(0, 10);

  const area = digits.slice(0, 3);
  const exchange = digits.slice(3, 6);
  const subscriber = digits.slice(6, 10);

  if (digits.length <= 3) {
    return `${prefix}${area}`.trimEnd();
  }

  if (digits.length <= 6) {
    return `${prefix}(${area}) ${exchange}`.trimEnd();
  }

  return `${prefix}(${area}) ${exchange}-${subscriber}`.trimEnd();
}
