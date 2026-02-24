const PLACEHOLDER_RE = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

export function placeholderExtractor(templateBody: string): string[] {
  const keys = new Set<string>();
  if (!templateBody) return [];

  let match: RegExpExecArray | null;
  while ((match = PLACEHOLDER_RE.exec(templateBody)) !== null) {
    const key = match[1];
    if (key) keys.add(key);
  }

  return Array.from(keys).sort();
}
