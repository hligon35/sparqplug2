import { placeholderExtractor } from "../utils/placeholderExtractor";

export function renderContractTemplate(
  templateBody: string,
  values: Record<string, string | number | null | undefined>
): string {
  const keys = placeholderExtractor(templateBody);
  let out = templateBody ?? "";

  for (const key of keys) {
    const raw = values[key];
    const replacement = raw === null || raw === undefined ? "" : String(raw);
    const re = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g");
    out = out.replace(re, replacement);
  }

  return out;
}
