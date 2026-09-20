import { createHash } from "node:crypto";

import type {
  DecodedAssistantProfile,
} from "../profile/profile-metric.js";

export function createOpenAIRealtimeProvider(apiKey: string) {
  return {
    async createCall(request: {
      readonly sdp: string;
      readonly userId: string;
      readonly profile: DecodedAssistantProfile;
    }): Promise<string> {
      const session = {
        type: "realtime",
        model: "gpt-realtime-2.1",
        output_modalities: ["audio"],
        instructions: `
You are Eleanor, a realtime personal AI assistant.
Personality: ${request.profile.personality}.
Verbosity: ${request.profile.verbosity}.
Formality: ${request.profile.formality}.
Initiative: ${request.profile.initiative}.
Humor: ${request.profile.humor}/3.
Speak naturally, handle interruption gracefully, and never claim an external action
succeeded unless a trusted tool confirms it.
`.trim(),
        max_output_tokens:
          request.profile.verbosity === "brief"
            ? 220
            : request.profile.verbosity === "detailed"
              ? 1400
              : 600,
        reasoning: { effort: "low" },
        audio: {
          input: {
            noise_reduction: { type: "near_field" },
            turn_detection: {
              type: "semantic_vad",
              eagerness:
                request.profile.turnTaking === "patient"
                  ? "low"
                  : request.profile.turnTaking === "quick"
                    ? "high"
                    : "medium",
              create_response: true,
              interrupt_response: true,
            },
          },
          output: {
            voice: request.profile.voice,
            speed: request.profile.speechSpeed,
          },
        },
      };

      const form = new FormData();
      form.set("sdp", request.sdp);
      form.set("session", JSON.stringify(session));

      const upstream = await fetch(
        "https://api.openai.com/v1/realtime/calls",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "OpenAI-Safety-Identifier": createHash("sha256")
              .update(request.userId)
              .digest("hex"),
          },
          body: form,
          signal: AbortSignal.timeout(20_000),
        },
      );

      const answer = await upstream.text();

      if (!upstream.ok || !answer.trim().startsWith("v=0")) {
        throw new Error(
          `Realtime provider rejected session (${upstream.status}).`,
        );
      }

      return answer;
    },
  };
}
