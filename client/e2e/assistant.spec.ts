import {
  expect,
  test,
} from "@playwright/test";

test(
  "renders the assistant shell",
  async ({ page }) => {
    await page.goto("/assistant");

    await expect(
      page.getByRole(
        "heading",
        {
          name: "ELEANOR"
        },
      ),
    ).toBeVisible();

    await expect(
      page.getByRole(
        "button",
        {
          name: "Activate"
        },
      ),
    ).toBeEnabled();

    await expect(
      page.getByText(
        "Assistant offline",
      ),
    ).toBeVisible();
  },
);

test(
  "handles microphone permission failure without crashing",
  async ({ page }) => {
    await page.addInitScript(() => {
      const mediaDevices = {
        getUserMedia:
          async (): Promise<MediaStream> => {
            throw new DOMException(
              "Microphone permission denied",
              "NotAllowedError",
            );
          }
      };

      Object.defineProperty(
        navigator,
        "mediaDevices",
        {
          configurable: true,
          value: mediaDevices
        },
      );
    });

    await page.goto("/assistant");

    await page
      .getByRole(
        "button",
        {
          name: "Activate"
        },
      )
      .click();

    await expect(
      page.getByText(
        "Connection error",
      ),
    ).toBeVisible();

    await expect(
      page.getByText(
        "Microphone permission denied",
      ),
    ).toBeVisible();

    await expect(
      page.getByRole(
        "button",
        {
          name: "Activate"
        },
      ),
    ).toBeEnabled();
  },
);

test(
  "supports direct navigation to settings",
  async ({ page }) => {
    await page.goto("/settings");

    await expect(
      page.getByRole(
        "heading",
        {
          name: "Assistant Settings"
        },
      ),
    ).toBeVisible();

    await expect(
      page.getByLabel(
        "Active profile",
      ),
    ).toBeVisible();
  },
);