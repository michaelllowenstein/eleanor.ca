import {
  TestBed,
} from "@angular/core/testing";

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  AssistantProfileStorageService,
} from "../../src/app/core/services/storage";

import {
  AssistantSettingsService,
} from "../../src/app/core/services/settings";

import type {
  PersistedAssistantProfiles,
} from "../../src/app/core/schema/models/settings";

interface StorageMock {
  load:
    ReturnType<typeof vi.fn>;

  save:
    ReturnType<typeof vi.fn>;

  clear:
    ReturnType<typeof vi.fn>;
}

describe(
  "AssistantSettingsService",
  () => {
    let service:
      AssistantSettingsService;

    let storage:
      StorageMock;

    beforeEach(() => {
      storage = {
        load: vi.fn(
          () => null,
        ),

        save: vi.fn(),

        clear: vi.fn()
      };

      TestBed.configureTestingModule({
        providers: [
          {
            provide:
              AssistantProfileStorageService,
            useValue: storage
          }
        ]
      });

      service =
        TestBed.inject(
          AssistantSettingsService,
        );
    });

    it(
      "starts with a usable default profile",
      () => {
        expect(
          service.profiles(),
        ).toHaveLength(1);

        expect(
          service.activeProfile().name,
        ).toBe("Default");

        expect(
          service.settings().voice,
        ).toBe("marin");

        expect(
          service.settings().personality,
        ).toBe("professional");
      },
    );

    it(
      "creates a new profile from the current profile and activates it",
      () => {
        service.updatePersonality(
          "warm",
        );

        const profileId =
          service.createProfile(
            "Home",
          );

        expect(
          service.activeProfileId(),
        ).toBe(profileId);

        expect(
          service.activeProfile().name,
        ).toBe("Home");

        expect(
          service.settings().personality,
        ).toBe("warm");

        expect(
          service.profiles(),
        ).toHaveLength(2);

        expect(
          storage.save,
        ).toHaveBeenCalled();
      },
    );

    it(
      "keeps settings isolated between profiles",
      () => {
        service.updatePersonality(
          "warm",
        );

        const defaultProfileId =
          service.activeProfileId();

        const workProfileId =
          service.createProfile(
            "Work",
          );

        service.updatePersonality(
          "direct",
        );

        expect(
          service.settings().personality,
        ).toBe("direct");

        service.selectProfile(
          defaultProfileId,
        );

        expect(
          service.settings().personality,
        ).toBe("warm");

        service.selectProfile(
          workProfileId,
        );

        expect(
          service.settings().personality,
        ).toBe("direct");
      },
    );

    it(
      "persists each active-profile setting mutation",
      () => {
        storage.save.mockClear();

        service.updateVerbosity(
          "detailed",
        );

        expect(
          storage.save,
        ).toHaveBeenCalledTimes(1);

        const persisted =
          storage.save.mock
            .calls[0][0] as
              PersistedAssistantProfiles;

        const active =
          persisted.profiles.find(
            (profile) =>
              profile.id ===
              persisted.activeProfileId,
          );

        expect(
          active?.settings.verbosity,
        ).toBe("detailed");
      },
    );

    it(
      "changes computed instructions when personality changes",
      () => {
        service.updatePersonality(
          "direct",
        );

        expect(
          service.instructions(),
        ).toContain(
          "Lead with the answer.",
        );

        expect(
          service.instructions(),
        ).toContain(
          "Minimize social filler.",
        );
      },
    );

    it(
      "maps turn-taking preference to semantic VAD eagerness",
      () => {
        service.updateTurnTaking(
          "patient",
        );

        expect(
          service.vadEagerness(),
        ).toBe("low");

        service.updateTurnTaking(
          "balanced",
        );

        expect(
          service.vadEagerness(),
        ).toBe("medium");

        service.updateTurnTaking(
          "quick",
        );

        expect(
          service.vadEagerness(),
        ).toBe("high");
      },
    );

    it(
      "maps verbosity to bounded response-token budgets",
      () => {
        service.updateVerbosity(
          "brief",
        );

        expect(
          service.maxOutputTokens(),
        ).toBe(220);

        service.updateVerbosity(
          "balanced",
        );

        expect(
          service.maxOutputTokens(),
        ).toBe(600);

        service.updateVerbosity(
          "detailed",
        );

        expect(
          service.maxOutputTokens(),
        ).toBe(1400);
      },
    );

    it(
      "clamps numeric settings to supported UI ranges",
      () => {
        service.updateHumor(99);

        expect(
          service.settings().humor,
        ).toBe(3);

        service.updateHumor(-20);

        expect(
          service.settings().humor,
        ).toBe(0);

        service.updateSpeechSpeed(
          999,
        );

        expect(
          service.settings()
            .speechSpeed,
        ).toBe(1.3);

        service.updateSpeechSpeed(
          0,
        );

        expect(
          service.settings()
            .speechSpeed,
        ).toBe(0.75);
      },
    );

    it(
      "refuses to delete the final profile",
      () => {
        const deleted =
          service.deleteProfile(
            service.activeProfileId(),
          );

        expect(deleted).toBe(false);

        expect(
          service.profiles(),
        ).toHaveLength(1);
      },
    );

    it(
      "selects another profile when the active profile is deleted",
      () => {
        const defaultId =
          service.activeProfileId();

        const workId =
          service.createProfile(
            "Work",
          );

        expect(
          service.activeProfileId(),
        ).toBe(workId);

        expect(
          service.deleteProfile(
            workId,
          ),
        ).toBe(true);

        expect(
          service.activeProfileId(),
        ).toBe(defaultId);

        expect(
          service.activeProfile().name,
        ).toBe("Default");
      },
    );

    it(
      "loads an existing profile document during initialization",
      () => {
        TestBed.resetTestingModule();

        const persisted:
          PersistedAssistantProfiles = {
            version: 1,
            activeProfileId: "focus",
            profiles: [
              {
                id: "focus",
                name: "Focus",
                settings: {
                  personality: "direct",
                  verbosity: "brief",
                  formality: "neutral",
                  initiative: "reactive",
                  turnTaking: "quick",
                  humor: 0,
                  speechSpeed: 1.1,
                  voice: "cedar"
                },
                createdAt:
                  "2026-08-17T12:00:00.000Z",
                updatedAt:
                  "2026-08-17T12:00:00.000Z"
              }
            ]
          };

        const existingStorage = {
          load: vi.fn(
            () => persisted,
          ),
          save: vi.fn(),
          clear: vi.fn()
        };

        TestBed.configureTestingModule({
          providers: [
            {
              provide:
                AssistantProfileStorageService,
              useValue:
                existingStorage
            }
          ]
        });

        const restored =
          TestBed.inject(
            AssistantSettingsService,
          );

        expect(
          restored.activeProfile().name,
        ).toBe("Focus");

        expect(
          restored.settings().voice,
        ).toBe("cedar");

        expect(
          restored.settings()
            .speechSpeed,
        ).toBe(1.1);
      },
    );
  },
);