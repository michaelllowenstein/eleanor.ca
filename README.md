# ELEANOR

> **A realtime, voice-first AI assistant built for natural conversation.**

ELEANOR is an experimental MVP exploring what a modern personal AI assistant can feel like when conversation becomes the primary interface.

It combines realtime speech, low-latency WebRTC communication, configurable assistant behavior, live audio visualization, and a deliberately hybrid frontend architecture built with **Angular 20 + React Islands**.

Think less *chat window* and more *ambient digital assistant*.

---

## ✦ What ELEANOR Does

ELEANOR can listen through the user's microphone, understand natural conversation, respond with streamed speech, react visually to both human and AI audio, and adjust its conversational behavior during an active session.

The MVP currently includes:

* Realtime voice conversations
* WebRTC-based audio transport
* Natural turn detection and interruption
* Session-aware conversational context
* Live microphone energy visualization
* Live assistant speech visualization
* Animated AI voice orb
* Angular 20 standalone architecture
* Zoneless Angular change detection
* React visual islands embedded inside Angular
* Tailwind CSS theming
* Runtime assistant settings
* Configurable personality, verbosity, formality, humor, initiative, voice, speech speed, and turn-taking behavior
* Server-side OpenAI session initialization
* Protected API credentials

---

## Architecture

```text
                            ELEANOR

                     ┌───────────────────┐
                     │       User        │
                     │    Microphone     │
                     └─────────┬─────────┘
                               │
                               ▼
                     ┌───────────────────┐
                     │     Angular 20    │
                     │                   │
                     │ Signals / State   │
                     │ WebRTC            │
                     │ Settings          │
                     │ Routing           │
                     │ Audio Analysis    │
                     └──────┬───────┬────┘
                            │       │
                props       │       │ HTTPS
                            ▼       ▼
                   ┌────────────┐  ┌──────────────┐
                   │   React    │  │   Node API   │
                   │   Island   │  │     BFF      │
                   │            │  └──────┬───────┘
                   │ Voice Orb  │         │
                   └────────────┘         │
                                         ▼
                                  ┌──────────────┐
                                  │ OpenAI       │
                                  │ Realtime API │
                                  └──────┬───────┘
                                         ▲
                                         │
                                  WebRTC │ audio
                                         │
                                         └──────── Browser
```

Angular owns the application.

React owns pixels.

That boundary is intentional.

---

## Why Angular + React Islands?

ELEANOR uses Angular for the application architecture while allowing React to power isolated visual experiences.

Angular owns:

```text
routing
dependency injection
WebRTC
session state
settings
authentication
tool orchestration
signals
application lifecycle
```

React is restricted to leaf-level UI components such as:

```text
VoiceOrb
future visualizers
specialized interactive graphics
```

The React island receives a small typed contract:

```ts
interface VoiceOrbProps {
  state: VoiceConnectionState;
  inputLevel: number;
  outputLevel: number;
}
```

This prevents React from becoming a second application runtime with duplicate state management.

```text
Angular Signal
      │
      ▼
Serializable Props
      │
      ▼
 React Island
      │
      ▼
 Visual Output
```

---

## Voice Orb

The voice orb is not driven by fake animation timers alone.

ELEANOR measures real audio energy from both sides of the conversation.

```text
User microphone
      │
      ▼
MediaStream
      │
      ▼
Web Audio API
      │
      ▼
AnalyserNode
      │
      ▼
inputLevel 0 ───────────── 1
      │
      ▼
Outer orb response
```

The assistant follows the same pattern:

```text
Realtime remote audio
      │
      ▼
MediaStream
      │
      ├────────► Speakers
      │
      ▼
AnalyserNode
      │
      ▼
outputLevel 0 ──────────── 1
      │
      ▼
Orb core + glow
```

The result is a visual system that actually responds to conversation.

---

## Assistant States

ELEANOR models voice interaction as explicit state rather than a single `connected` boolean.

```ts
type VoiceConnectionState =
  | "offline"
  | "connecting"
  | "listening"
  | "thinking"
  | "speaking"
  | "error";
```

Each state affects both application behavior and the React orb visualization.

```text
OFFLINE
   │
   ▼
CONNECTING
   │
   ▼
LISTENING
   │
   ├──────── user stops speaking
   ▼
THINKING
   │
   ▼
SPEAKING
   │
   └──────── response completed
            │
            ▼
        LISTENING
```

---

## Session Settings

ELEANOR's behavior can be tuned while a conversation is active.

Current controls include:

| Setting      | Purpose                              |
| ------------ | ------------------------------------ |
| Personality  | Professional, warm, witty, or direct |
| Verbosity    | Brief, balanced, or detailed         |
| Formality    | Casual, neutral, or formal           |
| Initiative   | Reactive, balanced, or proactive     |
| Humor        | Controls how readily humor appears   |
| Turn-taking  | Controls how patiently ELEANOR waits  |
| Speech speed | Adjusts generated speech pacing      |
| Voice        | Selects the assistant voice          |

Most settings are translated into realtime session updates.

```text
Settings UI
     │
     ▼
AssistantSettingsService
     │
     ▼
Angular computed configuration
     │
     ▼
RealtimeVoiceService
     │
     ▼
RTCDataChannel
     │
     ▼
session.update
```

Settings change the assistant's **presentation and interaction style**, not application permissions or security policy.

---

## Technology

```text
Frontend
├── Angular 20
├── Standalone Components
├── Zoneless Change Detection
├── Angular Signals
├── Angular Router
├── React 19
├── ReactDOM createRoot()
└── Tailwind CSS 4

Realtime
├── WebRTC
├── RTCDataChannel
├── MediaStream
├── Web Audio API
└── AnalyserNode

Backend
├── Node.js
├── TypeScript
└── Express

AI
└── OpenAI Realtime API
```

---

## Project Structure

```text
aurora/
│
├── apps/
│   │
│   ├── api/
│   │   └── src/
│   │       └── server.ts
│   │
│   └── web/
│       └── src/
│           └── app/
│               │
│               ├── core/
│               │   ├── audio/
│               │   │   └── audio-levels.service.ts
│               │   │
│               │   ├── realtime/
│               │   │   ├── realtime.types.ts
│               │   │   └── realtime-voice.service.ts
│               │   │
│               │   └── settings/
│               │       ├── assistant-settings.types.ts
│               │       └── assistant-settings.service.ts
│               │
│               └── features/
│                   │
│                   ├── assistant/
│                   │   ├── assistant-page.component.ts
│                   │   ├── voice-orb-island.component.ts
│                   │   └── voice-orb.react.ts
│                   │
│                   └── settings/
│                       └── settings-page.component.ts
│
├── package.json
└── .env
```

---

## Getting Started

### Requirements

```text
Node.js 22+
npm
modern Chromium / Firefox / Safari browser
microphone
OpenAI API key
```

### Install

```bash
git clone <your-repository-url>

cd aurora

npm install
```

Create your environment configuration:

```bash
cp .env.example .env
```

Add your API key:

```env
OPENAI_API_KEY=sk-...
PORT=3000
```

Run the development environment:

```bash
npm run dev
```

Open:

```text
http://localhost:4200
```

Select **Activate**, grant microphone access, and start talking.

---

## Security Model

The browser never receives the permanent OpenAI API key.

```text
Browser
   │
   │ SDP offer
   ▼
ELEANOR API
   │
   │ authenticated OpenAI request
   ▼
OpenAI
```

After negotiation, realtime media communication occurs through WebRTC.

Production versions should additionally place authentication, rate limiting, entitlement checks, usage limits, and tool authorization in front of session creation.

```text
request
   │
   ▼
authentication
   │
   ▼
rate limit
   │
   ▼
entitlement
   │
   ▼
session creation
```

---

## Testing Strategy

Realtime voice applications require more than conventional unit tests.

ELEANOR should eventually be tested at several boundaries.

```text
                 Live AI smoke tests
                         ▲
                         │
                 Browser/WebRTC E2E
                         ▲
                         │
                Integration tests
                         ▲
                         │
                  Unit tests
```

Unit tests should cover deterministic logic such as:

```text
settings
signals
event parsing
state transitions
tool policies
audio normalization
React prop rendering
```

Real-browser tests should cover:

```text
microphone permissions
RTCPeerConnection negotiation
MediaStream behavior
audio playback
device changes
reconnection
interruptions
```

CI should not depend entirely on live AI requests.

Prefer:

```text
Pull Request
     │
     ▼
Fake realtime adapter

Release / Nightly
     │
     ▼
Live OpenAI smoke test
```

---

## Observability

Voice applications have a different definition of performance.

The most important experience metric is:

```text
user finishes speaking
          │
          ▼
       latency
          │
          ▼
assistant begins speaking
```

Useful production metrics include:

```text
session_creation_ms
webrtc_connect_ms
turn_response_latency
first_audio_latency
session_duration
connection_failure_rate
reconnect_count
tool_call_duration
tool_failure_rate
cost_per_session
```

Track percentiles.

```text
p50
p95
p99
```

An average alone can hide a terrible conversational experience.

---

## Where This Is Going

ELEANOR is intentionally an MVP.

The architecture leaves room for capabilities such as:

```text
Persistent Memory
       │
       ├── user preferences
       ├── projects
       ├── relationships
       └── previous conversations

Tools
       │
       ├── calendar
       ├── weather
       ├── search
       ├── email
       ├── smart home
       └── computer control

Perception
       │
       ├── camera
       ├── screen awareness
       └── environmental context

Proactive Intelligence
       │
       ├── reminders
       ├── briefings
       ├── background agents
       └── notifications
```

The long-term goal is not simply to build another chat interface.

It is to explore an assistant that feels **present, contextual, conversational, and useful**.

---

## Design Principles

**Voice first.**
Conversation should feel like conversation, not dictating text into a chatbot.

**Keep the realtime path short.**
Every unnecessary service between the user and the model adds latency.

**Angular owns application state.**
React islands remain small, isolated, and replaceable.

**Visuals should represent real state.**
The orb reacts to actual audio and session events.

**AI requests actions; trusted software performs them.**
Models should never bypass authorization or confirmation boundaries.

**Failure is part of the UX.**
Network changes, denied microphones, provider failures, and interruptions must be treated as normal application states.

---

## Status

```text
[✓] Angular 20 application shell
[✓] Standalone + zoneless architecture
[✓] React Island integration
[✓] Tailwind theming
[✓] Realtime WebRTC voice
[✓] Assistant state machine
[✓] Session settings
[✓] Microphone energy analysis
[✓] Assistant audio analysis
[✓] Reactive voice orb

[ ] Authentication
[ ] Persistent memory
[ ] Tool execution
[ ] Reconnection strategy
[ ] Playwright E2E
[ ] Realtime mock adapter
[ ] Observability
[ ] PWA / mobile shell
[ ] Wake-word support
```

---

## Disclaimer

ELEANOR is an experimental reference implementation and is not intended to replicate any fictional assistant exactly.

It is a practical exploration of the technologies and architectural patterns required to build a modern realtime AI assistant.

---

<div align="center">

### ELEANOR

**Listen. Understand. Respond.**

*An experiment in making software feel a little less like software.*

</div>
