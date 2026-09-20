import type {
  SessionContext,
} from "../modules/auth/session/types";

declare global {
  namespace Express {
    interface Request {
      eleanorSession?:
        SessionContext;
    }
  }
}

export {};