import {
  expect,
  test,
} from "@playwright/test";

test.beforeEach(
  async ({ page }) => {
    await page.goto("/settings");

    await page.evaluate(() => {
      localStorage.clear();
    });

    await page.reload();
  },
);

test(
  "creates a profile and restores it after a page reload",
  async ({ page }) => {
    await page
      .getByLabel("Create profile")
      .fill("Work");

    await page
      .getByRole(
        "button",
        {
          name: "Create from current"
        },
      )
      .click();

    await expect(
      page.getByLabel(
        "Active profile",
      ),
    ).toHaveValue(
      /.+/,
    );

    await expect(
      page.getByLabel(
        "Active profile",
      ),
    ).toContainText("Work");

    const personalityCard =
      page
        .locator("article")
        .filter({
          hasText: "Personality"
        });

    await personalityCard
      .locator("select")
      .selectOption("witty");

    await page.reload();

    await expect(
      page.getByLabel(
        "Active profile",
      ),
    ).toContainText("Work");

    await expect(
      personalityCard.locator(
        "select",
      ),
    ).toHaveValue("witty");
  },
);

test(
  "keeps settings isolated between profiles",
  async ({ page }) => {
    const personality =
      page
        .locator("article")
        .filter({
          hasText: "Personality"
        })
        .locator("select");

    await personality.selectOption(
      "warm",
    );

    await page
      .getByLabel("Create profile")
      .fill("Focused");

    await page
      .getByRole(
        "button",
        {
          name: "Create from current"
        },
      )
      .click();

    await personality.selectOption(
      "direct",
    );

    const profileSelector =
      page.getByLabel(
        "Active profile",
      );

    await profileSelector.selectOption(
      {
        label: "Default"
      },
    );

    await expect(
      personality,
    ).toHaveValue("warm");

    await profileSelector.selectOption(
      {
        label: "Focused"
      },
    );

    await expect(
      personality,
    ).toHaveValue("direct");
  },
);

test(
  "deleting the active profile falls back to the remaining profile",
  async ({ page }) => {
    await page
      .getByLabel("Create profile")
      .fill("Temporary");

    await page
      .getByRole(
        "button",
        {
          name: "Create from current"
        },
      )
      .click();

    await expect(
      page.getByLabel(
        "Active profile",
      ),
    ).toContainText("Temporary");

    await page
      .getByRole(
        "button",
        {
          name: "Delete profile"
        },
      )
      .click();

    await expect(
      page.getByLabel(
        "Active profile",
      ),
    ).toContainText("Default");

    await expect(
      page.getByRole(
        "button",
        {
          name: "Delete profile"
        },
      ),
    ).toBeDisabled();

    await page.reload();

    await expect(
      page.getByLabel(
        "Active profile",
      ),
    ).toContainText("Default");
  },
);

test(
  "navigates between settings and assistant without losing the active profile",
  async ({ page }) => {
    await page
      .getByLabel("Create profile")
      .fill("Home");

    await page
      .getByRole(
        "button",
        {
          name: "Create from current"
        },
      )
      .click();

    await page
      .getByRole(
        "link",
        {
          name: "Back"
        },
      )
      .click();

    await expect(
      page.getByRole(
        "heading",
        {
          name: "ELEANOR"
        },
      ),
    ).toBeVisible();

    await page
      .getByRole(
        "link",
        {
          name: "Settings"
        },
      )
      .click();

    await expect(
      page.getByLabel(
        "Active profile",
      ),
    ).toContainText("Home");
  },
);