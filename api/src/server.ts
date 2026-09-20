import "dotenv/config";

import express from "express";
import helmet from "helmet";

import { attachSession } from "./middleware/auth.js";
import { createAuthRouter } from "./modules/auth/routes.js";
import { OidcService } from "./modules/auth/oidc/service.js";
import { SessionService } from "./modules/auth/session/service.js";
import { loadConfig } from "./core/config.js";
import { CredentialCryptoService } from "./modules/credentials/crypto/service.js";
import { createCredentialRepository } from "./modules/credentials/repository.js";
import { createCredentialRouter } from "./modules/credentials/routes.js";
import { CredentialService } from "./modules/credentials/service.js";
import { createDatabase } from "./core/database.js";
import { createPasskeyRepository } from "./modules/passkey/repository.js";
import { createPasskeyRouter } from "./modules/passkey/routes.js";
import { PasskeyService } from "./modules/passkey/service.js";
import { createAssistantProfileRepository } from "./modules/profile/repository.js";
import { createProfileRouter } from "./modules/profile/routes.js";
import { createRedisRateLimitMiddleware } from "./middleware/rate-limit.js";
import { createRealtimeRouter } from "./modules/realtime/routes.js";
import { createRedis } from "./core/redis.js";

const config = loadConfig();
const database = createDatabase(config.databaseUrl);
const redis = await createRedis(config.redisUrl);

const sessions = new SessionService(redis, {
  production: config.production,
  ttlSeconds: config.sessionTtlSeconds,
});

const oidc = await OidcService.create({
  issuer: config.oidcIssuer,
  clientId: config.oidcClientId,
  clientSecret: config.oidcClientSecret,
  publicApiOrigin: config.publicOrigin,
  publicAppOrigin: ""
});

const profiles =
  createAssistantProfileRepository(database);

const credentials = new CredentialService(
  createCredentialRepository(database),
  new CredentialCryptoService(
    config.credentialEncryptionKey,
  ),
);

const passkeys = new PasskeyService(
  createPasskeyRepository(database),
  sessions,
  {
    rpId: config.webauthnRpId,
    rpName: config.webauthnRpName,
    expectedOrigin: config.publicOrigin,
    enrollmentMaxOidcAgeSeconds:
      config.passkeyEnrollmentMaxOidcAgeSeconds,
  },
);

const realtimeRateLimit =
  createRedisRateLimitMiddleware(
    redis,
    config.realtimeSessionRateLimitPerMinute,
  );

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
  }),
);

app.use(express.json({ limit: "64kb" }));
app.use(
  express.text({
    type: ["application/sdp"],
    limit: "128kb",
  }),
);
app.use(attachSession(sessions));

app.get("/api/health", async (_request, response) => {
  try {
    await Promise.all([
      database.query("SELECT 1"),
      redis.ping(),
    ]);

    response.json({
      status: "ok",
      database: "ok",
      redis: "ok",
    });
  } catch {
    response.status(503).json({
      status: "degraded",
    });
  }
});

app.use(
  "/api/auth",
  createAuthRouter(
    sessions,
    oidc,
    config.publicOrigin,
  ),
);

app.use(
  "/api/passkeys",
  createPasskeyRouter(passkeys),
);

app.use(
  "/api/provider-credentials",
  createCredentialRouter(
    credentials,
    config.stepUpTtlSeconds,
  ),
);

app.use(
  "/api/assistant-profile",
  createProfileRouter(profiles),
);

app.use(
  "/api/realtime",
  createRealtimeRouter(
    profiles,
    credentials,
    realtimeRateLimit,
  ),
);

app.use((_request, response) => {
  response.status(404).json({
    error: "Route not found.",
  });
});

app.use(
  (
    error: unknown,
    _request: express.Request,
    response: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error("Unhandled Eleanor API error:", error);
    response.status(500).json({
      error: "Internal server error.",
    });
  },
);

const server = app.listen(config.port, () => {
  console.log(`Eleanor API listening on ${config.port}`);
});

async function shutdown(): Promise<void> {
  server.close();
  await Promise.allSettled([
    database.end(),
    redis.quit(),
  ]);
}

process.on("SIGTERM", () => void shutdown());
process.on("SIGINT", () => void shutdown());
