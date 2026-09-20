import { Router } from "express";
import type { RequestHandler } from "express";

import {
  requireAuthentication,
  requireCsrf,
} from "../../middleware/auth.js";
import { CredentialService } from "../credentials/service.js";
import {
  DEFAULT_PROFILE_METRIC,
  decodeProfileMetric,
} from "../profile/metric.js";
import type { AssistantProfileRepository } from "../profile/repository.js";
import { createOpenAIRealtimeProvider } from "./provider.js";

export function createRealtimeRouter(
  profiles: AssistantProfileRepository,
  credentials: CredentialService,
  rateLimit: RequestHandler,
): Router {
  const router = Router();

  router.post(
    "/session",
    requireAuthentication(),
    requireCsrf(),
    rateLimit,
    async (request, response) => {
      if (
        typeof request.body !== "string" ||
        !request.body.trim().startsWith("v=0")
      ) {
        response.status(400).json({
          error: "A valid SDP offer is required.",
        });
        return;
      }

      const userId = request.eleanorSession!.data.user!.id;
      const credential =
        await credentials.getProviderSecret(userId);

      if (!credential) {
        response.status(409).json({
          error: "Configure an API provider before activating Eleanor.",
          code: "PROVIDER_CREDENTIAL_REQUIRED",
        });
        return;
      }

      try {
        const requestedMetric =
          request.header("x-eleanor-profile-metric");

        const stored = requestedMetric
          ? null
          : await profiles.find(userId);

        const profile = decodeProfileMetric(
          requestedMetric ??
          stored?.metric ??
          DEFAULT_PROFILE_METRIC,
        );

        const provider =
          createOpenAIRealtimeProvider(credential.apiKey);

        response
          .set("Cache-Control", "no-store")
          .type("application/sdp")
          .send(
            await provider.createCall({
              sdp: request.body,
              userId,
              profile,
            }),
          );
      } catch (error) {
        console.error("Realtime bootstrap failed:", error);

        response.status(502).json({
          error: "Unable to establish the realtime session.",
          code: "REALTIME_BOOTSTRAP_FAILED",
        });
      }
    },
  );

  return router;
}
