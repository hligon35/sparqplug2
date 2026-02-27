export const APP_NAME: string;
export const APP_VERSION: string;

export const ROLES: Readonly<{ ADMIN: string; USER: string }>;

export const FEATURE_FLAGS: Readonly<{
  BILLING_ENABLED: boolean;
  AI_ENABLED: boolean;
}>;

export const validation: Record<string, unknown>;
export const types: Record<string, unknown>;
