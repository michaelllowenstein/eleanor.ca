export interface AppConfig {
  readonly production: boolean;
  readonly port: number;
  readonly databaseUrl: string;
  readonly redisUrl: string;
  readonly publicOrigin: string;
  readonly oidcIssuer: string;
  readonly oidcClientId: string;
  readonly oidcClientSecret: string;
  readonly webauthnRpId: string;
  readonly webauthnRpName: string;
  readonly credentialEncryptionKey: string;
  readonly sessionTtlSeconds: number;
  readonly stepUpTtlSeconds: number;
  readonly passkeyEnrollmentMaxOidcAgeSeconds: number;
  readonly realtimeSessionRateLimitPerMinute: number;
}

function required(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

function positiveInteger(name: string, fallback: number): number {
  const raw = process.env[name];

  if (!raw) {
    return fallback;
  }

  const value = Number(raw);

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }

  return value;
}

export function loadConfig(): AppConfig {
  return {
    production: process.env.NODE_ENV === "production",
    port: positiveInteger("PORT", 3000),
    databaseUrl: required("DATABASE_URL"),
    redisUrl: required("REDIS_URL"),
    publicOrigin: required("PUBLIC_ORIGIN"),
    oidcIssuer: required("OIDC_ISSUER"),
    oidcClientId: required("OIDC_CLIENT_ID"),
    oidcClientSecret: required("OIDC_CLIENT_SECRET"),
    webauthnRpId: required("WEBAUTHN_RP_ID"),
    webauthnRpName: required("WEBAUTHN_RP_NAME"),
    credentialEncryptionKey: required("CREDENTIAL_ENCRYPTION_KEY"),
    sessionTtlSeconds: positiveInteger("SESSION_TTL_SECONDS", 28_800),
    stepUpTtlSeconds: positiveInteger("STEP_UP_TTL_SECONDS", 300),
    passkeyEnrollmentMaxOidcAgeSeconds: positiveInteger(
      "PASSKEY_ENROLLMENT_MAX_OIDC_AGE_SECONDS",
      600,
    ),
    realtimeSessionRateLimitPerMinute: positiveInteger(
      "REALTIME_SESSION_RATE_LIMIT_PER_MINUTE",
      20,
    ),
  };
}
