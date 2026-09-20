import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { performance } from "node:perf_hooks";

const profileRuns = [];
for (let round = 0; round < 10; round += 1) {
  const started = performance.now();
  const observed = new Set();
  for (let voice = 0; voice < 10; voice += 1)
    for (let speed = 0; speed < 12; speed += 1)
      for (let humor = 0; humor < 4; humor += 1)
        for (let turn = 0; turn < 3; turn += 1)
          for (let initiative = 0; initiative < 3; initiative += 1)
            for (let formality = 0; formality < 3; formality += 1)
              for (let verbosity = 0; verbosity < 3; verbosity += 1)
                for (let personality = 0; personality < 4; personality += 1) {
                  observed.add(
                    1_000_000 +
                    personality +
                    verbosity * 4 +
                    formality * 12 +
                    initiative * 36 +
                    turn * 108 +
                    humor * 324 +
                    speed * 1296 +
                    voice * 15552
                  );
                }
  if (observed.size !== 155_520) throw new Error("Profile collision detected");
  profileRuns.push(performance.now() - started);
}

const key = randomBytes(32);
const plaintext = "sk-example-provider-secret-with-realistic-length";
const cryptoStarted = performance.now();
for (let i = 0; i < 25_000; i += 1) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const output = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  if (output !== plaintext) throw new Error("AES-GCM benchmark failed");
}
const cryptoMs = performance.now() - cryptoStarted;

const tokenStarted = performance.now();
for (let i = 0; i < 100_000; i += 1) randomBytes(32).toString("base64url");
const tokenMs = performance.now() - tokenStarted;

profileRuns.sort((a, b) => a - b);
console.log(JSON.stringify({
  profiles: {
    count: 155520,
    collisions: 0,
    fastestMs: profileRuns[0],
    medianMs: profileRuns[Math.floor(profileRuns.length / 2)],
    slowestMs: profileRuns.at(-1)
  },
  aes256Gcm: {
    roundTrips: 25000,
    totalMs: cryptoMs,
    perRoundTripUs: cryptoMs * 1000 / 25000
  },
  secureTokens: {
    count: 100000,
    totalMs: tokenMs,
    perTokenUs: tokenMs * 1000 / 100000
  }
}, null, 2));
