let enabled = false;

type SentryExpo = typeof import("sentry-expo");
let sentry: SentryExpo | null = null;

function getSentry(): SentryExpo | null {
  if (sentry) return sentry;
  try {
    // Lazy import so a broken/partial native environment can't prevent app bootstrap.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    sentry = require("sentry-expo");
    return sentry;
  } catch {
    return null;
  }
}

export function initTelemetry() {
  const safeMode = process.env.EXPO_PUBLIC_SAFE_MODE === "1";
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  const enableInDev = process.env.EXPO_PUBLIC_SENTRY_ENABLE_IN_DEV === "1";

  if (safeMode) return;
  if (!dsn) return;
  if (__DEV__ && !enableInDev) return;

  const Sentry = getSentry();
  if (!Sentry) return;

  try {
    Sentry.init({
      dsn: String(dsn),
      enableInExpoDevelopment: enableInDev,
      debug: __DEV__,
      environment: process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT,
      release: process.env.EXPO_PUBLIC_SENTRY_RELEASE,
    });
    enabled = true;
  } catch {
    enabled = false;
  }
}

type Tags = Record<string, string | number | boolean | null | undefined>;

export function captureException(error: unknown, tags?: Tags, extras?: Record<string, unknown>) {
  if (!enabled) return;

  const Sentry = getSentry();
  if (!Sentry) return;

  try {
    Sentry.Native?.withScope?.((scope: any) => {
      if (tags) {
        for (const [k, v] of Object.entries(tags)) {
          if (v === undefined) continue;
          if (v === null) continue;
          scope.setTag(k, String(v));
        }
      }
      if (extras) {
        for (const [k, v] of Object.entries(extras)) {
          scope.setExtra(k, v);
        }
      }
      Sentry.Native?.captureException?.(error);
    });
  } catch {
    // Never crash the app due to telemetry.
  }
}
