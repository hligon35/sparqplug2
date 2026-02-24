const MEET_URL_RE = /https?:\/\/meet\.google\.com\/[\w-]+(?:\?[\w\W]*)?/i;

export function extractGoogleMeetUrl(text?: string | null): string | null {
  const raw = String(text ?? "");
  const m = raw.match(MEET_URL_RE);
  return m?.[0] ?? null;
}

export function extractGoogleMeetUrlFromItem(item: any): string | null {
  if (!item) return null;

  const direct =
    extractGoogleMeetUrl(item?.source_url) ||
    extractGoogleMeetUrl(item?.description) ||
    extractGoogleMeetUrl(item?.title);

  if (direct) return direct;

  // Sometimes the platform field is used as a URL.
  const platform = String(item?.platform ?? "").trim();
  if (platform && platform.startsWith("http")) return extractGoogleMeetUrl(platform);

  return null;
}

export function getUpcomingMeetWithinMinutes(
  items: any[],
  nowMs: number,
  windowMinutes: number = 15
): { item: any; url: string; minutes: number } | null {
  const windowMs = windowMinutes * 60 * 1000;

  const candidates = (items ?? [])
    .map((it) => {
      const url = extractGoogleMeetUrlFromItem(it);
      if (!url) return null;

      const scheduledAt = it?.scheduled_at ? new Date(String(it.scheduled_at)) : null;
      const startMs = scheduledAt && !Number.isNaN(scheduledAt.getTime()) ? scheduledAt.getTime() : null;
      if (startMs == null) return null;

      const diffMs = startMs - nowMs;
      if (diffMs < 0 || diffMs > windowMs) return null;

      const minutes = Math.max(0, Math.round(diffMs / 60000));
      return { item: it, url, startMs, minutes };
    })
    .filter(Boolean) as Array<{ item: any; url: string; startMs: number; minutes: number }>;

  if (!candidates.length) return null;

  candidates.sort((a, b) => a.startMs - b.startMs);
  const best = candidates[0];
  return best ? { item: best.item, url: best.url, minutes: best.minutes } : null;
}
