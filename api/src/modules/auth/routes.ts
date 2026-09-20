import { Router } from "express";

import { requireAuthentication, requireCsrf } from "../../middleware/auth.js";
import { OidcService } from "./oidc/service.js";
import { SessionService } from "./session/service.js";

export function createAuthRouter(
  sessions: SessionService,
  oidc: OidcService,
  publicOrigin: string,
): Router {
  const router = Router();

  router.get("/session", async (request, response) => {
    const session = await sessions.ensure(request, response);

    response.set("Cache-Control", "no-store").json({
      authenticated: Boolean(session.data.user),
      user: session.data.user ?? null,
      csrfToken: session.data.csrfToken,
    });
  });

  router.get("/login", async (request, response) => {
    const session = await sessions.ensure(request, response);

    if (session.data.user) {
      response.redirect(new URL("/assistant", publicOrigin).href);
      return;
    }

    const returnTo =
      typeof request.query.returnTo === "string"
        ? request.query.returnTo
        : "/assistant";

    const flow = await oidc.begin(returnTo);

    await sessions.save({
      ...session,
      data: {
        ...session.data,
        oidc: flow.transaction,
      },
    });

    response.redirect(flow.authorizationUrl.href);
  });

  router.get("/callback", async (request, response) => {
    const session = request.eleanorSession;
    const transaction = session?.data.oidc;

    if (!session || !transaction) {
      response.status(400).send("Authentication transaction was not found.");
      return;
    }

    try {
      const completed = await oidc.complete(
        new URL(request.originalUrl, publicOrigin),
        transaction,
      );

      await sessions.rotate(session, response, {
        csrfToken: sessions.randomToken(),
        createdAt: Date.now(),
        authenticatedAt: Date.now(),
        user: completed.user,
        idTokenHint: completed.idTokenHint,
      });

      response.redirect(new URL(transaction.returnTo, publicOrigin).href);
    } catch (error) {
      console.error("OIDC callback failed:", error);
      response.status(401).send("Authentication could not be completed.");
    }
  });

  router.post(
    "/logout",
    requireAuthentication(),
    requireCsrf(),
    async (request, response) => {
      const session = request.eleanorSession!;
      const logoutUrl =
        oidc.logoutUrl(session.data.idTokenHint) ?? publicOrigin;

      await sessions.destroy(session, response);

      response.json({ logoutUrl });
    },
  );

  return router;
}
