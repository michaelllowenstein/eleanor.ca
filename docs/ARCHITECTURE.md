 Browser / Electron shell
 ┌──────────────────────────────────────────────┐
 │ Angular app (Vercel, static)                 │
 │   signals · router · WebRTC · Web Audio      │──── WebRTC media + data channel ────┐
 │   React island: voice orb (props only)       │                                     │
 └───────────────┬──────────────────────────────┘                                     │
                 │ same-origin /api/* (Vercel rewrite)                                 │
                 ▼                                                                     ▼
 ┌──────────────────────────────────────────────┐   SDP offer/answer   ┌─────────────────────────┐
 │ Eleanor API (Railway, Node/Express)          │─────────────────────▶│ OpenAI Realtime API     │
 │   OIDC client · sessions · CSRF · passkeys   │   user's own key     └─────────────────────────┘
 │   credential vault (AES-256-GCM) · profiles  │
 │   rate limiting                              │──── OIDC ───▶ Identity provider
 └───────┬───────────────────────┬──────────────┘
         ▼                       ▼
   PostgreSQL 17             Redis 7
   users, profiles,          sessions (opaque id → JSON),
   passkeys, encrypted       rate-limit counters
   provider keys
