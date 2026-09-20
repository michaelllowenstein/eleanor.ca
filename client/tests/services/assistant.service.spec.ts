import {
  TestBed,
} from "@angular/core/testing";

import {
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import {
  AssistantProfileStorageService,
} from "./assistant-profile-storage.service";

import type {
  PersistedAssistantProfiles,
} from "./assistant-settings.types";

const STORAGE_KEY =
  "eleanor.assistant-profiles.v1";

function createPersistedState():
  PersistedAssistantProfiles {
  return {
    version: 1,
    activeProfileId: "work",
    profiles: [
      {
        id: "work",
        name: "Work",
        settings: {
          personality: "professional",
          verbosity: "brief",
          formality: "formal",
          initiative: "reactive",
          turnTaking: "patient",
          humor: 0,
          speechSpeed: 1,
          voice: "marin"
        },
        createdAt:
          "2026-08-17T12:00:00.000Z",
        updatedAt:
          "2026-08-17T12:00:00.000Z"
      }
    ]
  };
}

describe(
  "AssistantProfileStorageService",
  () => {
    let service:
      AssistantProfileStorageService;

    beforeEach(() => {
      localStorage.clear();

      TestBed.configureTestingModule({});

      service =
        TestBed.inject(
          AssistantProfileStorageService,
        );
    });

    it(
      "returns null when no profiles have been stored",
      () => {
        expect(service.load()).toBeNull();
      },
    );

    it(
      "persists and restores a valid profile document",
      () => {
        const state =
          createPersistedState();

        service.save(state);

        expect(service.load()).toEqual(
          state,
        );
      },
    );

    it(
      "rejects corrupted JSON instead of crashing application startup",
      () => {
        localStorage.setItem(
          STORAGE_KEY,
          "{ definitely-not-json",
        );

        expect(
          service.load(),
        ).toBeNull();
      },
    );

    it(
      "rejects an unsupported schema version",
      () => {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            ...createPersistedState(),
            version: 999
          }),
        );

        expect(
          service.load(),
        ).toBeNull();
      },
    );

    it(
      "rejects persisted state whose active profile does not exist",
      () => {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            ...createPersistedState(),
            activeProfileId:
              "missing-profile"
          }),
        );

        expect(
          service.load(),
        ).toBeNull();
      },
    );

    it(
      "removes persisted profiles",
      () => {
        service.save(
          createPersistedState(),
        );

        service.clear();

        expect(
          localStorage.getItem(
            STORAGE_KEY,
          ),
        ).toBeNull();

        expect(service.load()).toBeNull();
      },
    );
  },
);