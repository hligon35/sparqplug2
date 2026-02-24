export type MarketingModuleRoute =
  | "ClientSEOEngine"
  | "ClientSocialEngine"
  | "ClientAdsEngine"
  | "ClientEmailEngine"
  | "ClientRetentionEngine"
  | "ClientReporting";

export type MarketingModule = {
  key: "seo" | "social" | "ads" | "email" | "retention" | "reporting";
  label: string;
  route: MarketingModuleRoute;
};

const ALL_MODULES: MarketingModule[] = [
  { key: "seo", label: "SEO", route: "ClientSEOEngine" },
  { key: "social", label: "Social", route: "ClientSocialEngine" },
  { key: "ads", label: "Ads", route: "ClientAdsEngine" },
  { key: "email", label: "Email", route: "ClientEmailEngine" },
  { key: "retention", label: "Retention", route: "ClientRetentionEngine" },
  { key: "reporting", label: "Reporting", route: "ClientReporting" }
];

export function normalizeServiceLabel(label: string): string {
  const raw = String(label ?? "").trim();
  const s = raw.toLowerCase();

  if (s === "website dev & maintenance" || s === "website development & maintenance") return "Web dev & maintenance";
  if (s === "website development and maintenance" || s === "website dev and maintenance") return "Web dev & maintenance";

  return raw;
}

export function splitServiceList(raw: string): string[] {
  const s = String(raw ?? "").trim();
  if (!s) return [];
  return s
    .split(/,|\+|\||\//g)
    .map((x) => x.trim())
    .filter(Boolean);
}

export function getEnabledMarketingModules(serviceRaw: string): MarketingModule[] {
  const raw = String(serviceRaw ?? "").trim();
  if (!raw) return [];

  const lower = raw.toLowerCase();
  if (lower.includes("full marketing") || lower.includes("marketing engine") || lower.includes("ops os")) {
    return ALL_MODULES.slice();
  }

  const modules = new Map<MarketingModule["key"], MarketingModule>();

  const items = splitServiceList(raw);
  const haystack = [lower, ...items.map((x) => x.toLowerCase())].join(" ");

  if (haystack.includes("seo")) modules.set("seo", ALL_MODULES[0]);
  if (haystack.includes("social")) modules.set("social", ALL_MODULES[1]);

  if (
    haystack.includes("ads") ||
    haystack.includes("meta") ||
    haystack.includes("tiktok") ||
    haystack.includes("google ads") ||
    haystack.includes("paid")
  ) {
    modules.set("ads", ALL_MODULES[2]);
  }

  if (haystack.includes("email")) modules.set("email", ALL_MODULES[3]);
  if (haystack.includes("retention")) modules.set("retention", ALL_MODULES[4]);

  if (haystack.includes("report") || haystack.includes("reporting")) {
    modules.set("reporting", ALL_MODULES[5]);
  }

  return ALL_MODULES.filter((m) => modules.has(m.key));
}
