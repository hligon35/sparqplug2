export function formatClientId(value: unknown, digits: number = 4): string {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return "0000";
  return String(Math.trunc(n)).padStart(digits, "0");
}
