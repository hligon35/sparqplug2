export function isProbablyOfflineError(e: any): boolean {
  const msg = String(e?.message ?? "");
  const code = String(e?.code ?? "");
  const status = e?.response?.status;

  // If the server responded, we are not offline.
  if (typeof status === "number") return false;

  // Axios / network layer signals
  if (code === "ECONNABORTED") return true;

  // Common fetch/axios network messages
  if (/network error/i.test(msg)) return true;
  if (/timeout/i.test(msg)) return true;
  if (/failed to fetch/i.test(msg)) return true;

  return false;
}
