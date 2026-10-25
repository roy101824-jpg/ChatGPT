import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { practiceQuestions } from "../src/data/practice";

const isMobile = (page: Page) => (page.viewportSize()?.width || 1440) < 768;
async function navigate(
  page: Page,
  destination: "Today" | "Practice" | "Library" | "Progress" | "My trail",
) {
  const mobileNavigation = await page
    .getByRole("navigation", { name: "Mobile navigation", exact: true })
    .isVisible();
  const navigation = page.getByRole("navigation", {
    name: mobileNavigation ? "Mobile navigation" : "Main navigation",
    exact: true,
  });
  const name =
    destination === "Library" && !mobileNavigation
      ? "Word library"
      : destination;
  await navigation.getByRole("button", { name, exact: true }).click();
}
async function settings(page: Page) {
  await page
    .getByRole("button", {
      name: isMobile(page) ? "Settings" : "Make it yours",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Make your trail your own." }),
  ).toBeVisible();
}
async function meaningMatch(page: Page) {
  if (
    !(await page.locator(".prep-vocabulary-tools").getAttribute("open")) &&
    !(await page.getByRole("button", { name: /Meaning match/ }).isVisible())
  )
    await page.locator(".prep-vocabulary-tools summary").click();
  await page.getByRole("button", { name: /Meaning match/ }).click();
}

async function writingStudio(page: Page) {
  await settings(page);
  await page
    .getByRole("button", { name: "Open writing studio", exact: true })
    .click();
}

async function assertNoHorizontalOverflow(page: Page) {
  const size = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(size.document, JSON.stringify(size)).toBeLessThanOrEqual(
    size.viewport + 1,
  );
  expect(size.body, JSON.stringify(size)).toBeLessThanOrEqual(
    size.viewport + 1,
  );
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "A little practice. A bigger vocabulary.",
    }),
  ).toBeVisible();
});

test("content provenance and unresolved/reference filters are accurate", async ({
  page,
}) => {
  await navigate(page, "Library");
  const search = page.getByRole("textbox", {
    name: "Search words and meanings",
  });
  await search.fill("apt");
  const apt = page
    .locator(".word-row")
    .filter({ has: page.getByRole("heading", { name: "apt", exact: true }) });
  await apt.locator(".word-row-main").click();
  await expect(page.locator(".definition-attribution")).toHaveText(
    "Meaning from Wordtrail · original definition and example",
  );
  await expect(page.locator(".detail-definition")).toHaveText(
    "Well suited to a particular situation or purpose.",
  );
  await page.getByRole("button", { name: "Close dialog" }).click();
  await search.fill("");
  await page
    .getByRole("button", { name: "Needs a definition", exact: true })
    .click();
  await expect(page.locator(".word-row")).toHaveCount(2);
  await expect(
    page.getByRole("heading", { name: "heterogenous", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "obstrusive", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Reference index", exact: true })
    .click();
  await expect(page.getByText("4,005 words", { exact: true })).toBeVisible();
  await expect(page.getByText(/These 4,005 additional terms/)).toBeVisible();
  await search.fill("camera");
  const camera = page
    .locator(".word-row")
    .filter({
      has: page.getByRole("heading", { name: "camera", exact: true }),
    });
  await expect(camera).toHaveCount(1);
  await camera.locator(".word-row-main").click();
  await expect(page.locator(".source-tags")).toContainText(
    "TEST 14-1.pdf · p. 2",
  );
  await expect(page.locator(".detail-definition")).toContainText(
    "excluded from quizzes",
  );
});

test("home and primary screens fit the viewport with no horizontal scrolling", async ({
  page,
}, testInfo) => {
  await assertNoHorizontalOverflow(page);
  await page.screenshot({
    path: `work/${testInfo.project.name}.png`,
    fullPage: true,
  });
  for (const screen of [
    "My trail",
    "Practice",
    "Library",
    "Progress",
  ] as const) {
    await navigate(page, screen);
    await assertNoHorizontalOverflow(page);
  }
  await settings(page);
  await assertNoHorizontalOverflow(page);
  await page.getByRole("button", { name: "Close dialog" }).click();
});

test("a flashcard review persists after reload and appears in explored words", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Let’s learn some words" }).click();
  const word = (await page
    .getByRole("heading", { level: 1 })
    .textContent())!.trim();
  await page.getByRole("button", { name: "Reveal meaning" }).click();
  await expect(page.locator(".definition")).not.toBeEmpty();
  await page.getByRole("button", { name: "Good Got it", exact: true }).click();
  await page.getByRole("button", { name: "End session" }).click();
  await page.reload();
  await navigate(page, "Library");
  await page.getByRole("button", { name: "Explored", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Search words and meanings" })
    .fill(word);
  const row = page
    .locator(".word-row")
    .filter({ has: page.getByRole("heading", { name: word, exact: true }) });
  await expect(row).toHaveCount(1);
  // The active Explored filter is the user-facing evidence of persistence;
  // mobile intentionally omits the redundant status badge to save space.
  await expect(row).toBeVisible();
  await assertNoHorizontalOverflow(page);
});

test("an interrupted flashcard session resumes at the current revealed card", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Let’s learn some words" }).click();
  await page.getByRole("button", { name: "Reveal meaning" }).click();
  await page.getByRole("button", { name: "Good Got it", exact: true }).click();
  const currentWord = (await page
    .getByRole("heading", { level: 1 })
    .textContent())!.trim();
  await page.getByRole("button", { name: "Reveal meaning" }).click();
  await page.reload();
  await expect(
    page.getByRole("dialog", { name: "Vocabulary practice" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(currentWord);
  await expect(page.locator(".session-count")).toContainText("2 /");
  await expect(page.locator(".definition")).toBeVisible();
  await page.getByRole("button", { name: "End session" }).click();
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "A little practice. A bigger vocabulary.",
    }),
  ).toBeVisible();
});

test("a chosen quiz answer resumes without scoring twice on a rapid continue", async ({
  page,
}) => {
  await navigate(page, "Practice");
  await meaningMatch(page);
  const word = (await page
    .getByRole("heading", { level: 1 })
    .textContent())!.trim();
  await page.locator(".answer-option").first().click();
  await expect(page.getByRole("status")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(word);
  await expect(page.getByRole("status")).toBeVisible();
  await expect(page.locator(".session-count")).toContainText("1 /");
  await page
    .getByRole("button", { name: "Continue", exact: true })
    .evaluate((button: HTMLButtonElement) => {
      button.click();
      button.click();
    });
  await expect(page.locator(".session-count")).toContainText("2 /");
  await page.getByRole("button", { name: "End session" }).click();
  await navigate(page, "Progress");
  await expect(
    page
      .locator(".metric-row")
      .filter({ hasText: "Total vocabulary reviews" })
      .locator("strong"),
  ).toHaveText("1");
});

test("library bookmarks and personal notes survive reopening the app", async ({
  page,
}) => {
  await navigate(page, "Library");
  const first = page.locator(".word-row").first();
  const word = (await first
    .getByRole("heading", { level: 3 })
    .textContent())!.trim();
  await page
    .getByRole("textbox", { name: "Search words and meanings" })
    .fill(word);
  const row = page
    .locator(".word-row")
    .filter({ has: page.getByRole("heading", { name: word, exact: true }) });
  await row.getByRole("button", { name: `Save ${word}`, exact: true }).click();
  await row.locator(".word-row-main").click();
  await page
    .getByLabel(/Make it memorable/)
    .fill("My own connection: use it in a sentence after breakfast.");
  await expect(
    page.getByRole("button", { name: "Saved to your collection" }),
  ).toBeVisible();
  await assertNoHorizontalOverflow(page);
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.reload();
  await navigate(page, "Library");
  await page.getByRole("button", { name: "Saved", exact: true }).click();
  await expect(page.locator(".word-row")).toHaveCount(1);
  await page.locator(".word-row-main").click();
  await expect(page.getByLabel(/Make it memorable/)).toHaveValue(
    "My own connection: use it in a sentence after breakfast.",
  );
});

test("settings export and import round-trip while rejecting an invalid backup", async ({
  page,
}) => {
  await settings(page);
  await page.getByLabel("Daily review goal", { exact: true }).selectOption("5");
  await page.getByLabel("Words per session", { exact: true }).selectOption("5");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export", exact: true }).click();
  const download = await downloadPromise;
  const exported = await readFile((await download.path())!);
  expect(JSON.parse(exported.toString()).app).toBe("wordtrail");

  await page
    .getByLabel("Daily review goal", { exact: true })
    .selectOption("30");
  await page.locator("input[type=file]").setInputFiles({
    name: "invalid.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"version":99}'),
  });
  await expect(page.getByRole("status")).toContainText("Invalid backup");
  await expect(
    page.getByLabel("Daily review goal", { exact: true }),
  ).toHaveValue("30");
  await expect(
    page.getByText("Replace the progress on this device?", { exact: true }),
  ).toHaveCount(0);

  await page.locator("input[type=file]").setInputFiles({
    name: "wordtrail.json",
    mimeType: "application/json",
    buffer: exported,
  });
  await expect(
    page.getByText("Replace the progress on this device?", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Replace & import", exact: true })
    .click();
  await expect(
    page.getByLabel("Daily review goal", { exact: true }),
  ).toHaveValue("5");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.reload();
  await settings(page);
  await expect(
    page.getByLabel("Daily review goal", { exact: true }),
  ).toHaveValue("5");
  await expect(
    page.getByLabel("Words per session", { exact: true }),
  ).toHaveValue("5");
});

test("an older saved practice session still resumes after its launch card is retired", async ({
  page,
}) => {
  await navigate(page, "Practice");
  const questions = practiceQuestions
    .filter((question) => question.type === "equivalence")
    .slice(0, 2);
  expect(questions).toHaveLength(2);
  await page.evaluate(
    (snapshot) =>
      localStorage.setItem(
        "wordtrail.activePractice",
        JSON.stringify(snapshot),
      ),
    {
      version: 1,
      questionIds: questions.map((question) => question.id),
      title: "Better together",
      index: 0,
      selected: questions[0].answers,
      checked: true,
      score: 0,
    },
  );
  await page.reload();
  await expect(
    page.getByRole("dialog", { name: "Better together" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    questions[0].prompt,
  );
  await expect(page.getByRole("status")).toContainText(
    questions[0].explanation,
  );
  await expect(page.locator(".answer-option[aria-pressed=true]")).toHaveCount(
    2,
  );
  await expect(page.locator(".answer-option").first()).toBeDisabled();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.locator(".session-count")).toContainText("2 /");
  await page.getByRole("button", { name: "End practice" }).click();
  await page.reload();
  await expect(
    page.getByRole("dialog", { name: "Better together" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", {
      name: "Verbal Reasoning",
    }),
  ).toBeVisible();
});

test("writing studio saves a draft and offers a revision checklist", async ({
  page,
}) => {
  await navigate(page, "Practice");
  await writingStudio(page);
  const draft =
    "A policy should be judged by the circumstances in which it operates. For example, a local school may need flexibility to meet its students’ needs. A strong counterargument deserves serious consideration.";
  await page.getByLabel("YOUR ARGUMENT, YOUR VOICE").fill(draft);
  await expect(page.getByText(/Draft saved on this device/)).toBeVisible();
  await page.getByRole("button", { name: "Review my argument" }).click();
  await expect(
    page.getByRole("heading", { name: "A thoughtful self-check" }),
  ).toBeVisible();
  await page.getByRole("checkbox").first().check();
  await assertNoHorizontalOverflow(page);
  await page.reload();
  await navigate(page, "Practice");
  await writingStudio(page);
  await expect(page.getByLabel("YOUR ARGUMENT, YOUR VOICE")).toHaveValue(draft);
});

test("essay timer survives reload, pauses for later, and resets only after confirmation", async ({
  page,
}) => {
  await page.clock.install({ time: new Date() });
  await navigate(page, "Practice");
  await writingStudio(page);
  await page
    .getByLabel("YOUR ARGUMENT, YOUR VOICE")
    .fill("A measured position needs a clear example.");
  await page.getByRole("button", { name: "Start 30-minute practice" }).click();
  await page.clock.fastForward(6000);
  await expect(page.locator(".timer")).toHaveText("29:54");
  await page.reload();
  await navigate(page, "Practice");
  await writingStudio(page);
  await expect(page.getByRole("button", { name: "Pause timer" })).toBeVisible();
  await page.clock.fastForward(4000);
  await expect(page.locator(".timer")).toHaveText("29:50");
  await page.getByRole("button", { name: "Pause timer" }).click();
  await expect(
    page.getByRole("button", { name: "Resume timer" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close writing studio" }).click();
  await page.clock.fastForward(5000);
  await writingStudio(page);
  await expect(page.locator(".timer")).toHaveText("29:50");
  await expect(
    page.getByRole("button", { name: "Resume timer" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Start a new draft" }).click();
  await expect(
    page.getByRole("dialog", { name: "Make room for a new argument." }),
  ).toBeVisible();
  await expect(page.getByLabel("YOUR ARGUMENT, YOUR VOICE")).toHaveValue(
    "A measured position needs a clear example.",
  );
  await page.getByRole("button", { name: "Start fresh", exact: true }).click();
  await expect(page.getByLabel("YOUR ARGUMENT, YOUR VOICE")).toHaveValue("");
  await expect(page.locator(".timer")).toHaveText("30:00");
  await expect(
    page.getByRole("combobox", { name: "Choose essay prompt" }),
  ).toBeEnabled();
});

test("an invalid nested essay backup is rejected without replacing a saved draft", async ({
  page,
}) => {
  await navigate(page, "Practice");
  await writingStudio(page);
  await page
    .getByLabel("YOUR ARGUMENT, YOUR VOICE")
    .fill("A draft worth preserving.");
  await page.getByRole("button", { name: "Close writing studio" }).click();
  await settings(page);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export", exact: true }).click();
  const download = await downloadPromise;
  const backup = JSON.parse(
    (await readFile((await download.path())!)).toString(),
  );
  backup.essay = JSON.stringify({ promptIndex: 0, draft: { bad: true } });
  await page.locator("input[type=file]").setInputFiles({
    name: "invalid-essay.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await expect(page.getByRole("status")).toContainText(
    "The essay draft in this backup is invalid.",
  );
  await expect(
    page.getByText("Replace the progress on this device?", { exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Close dialog" }).click();
  await writingStudio(page);
  await expect(page.getByLabel("YOUR ARGUMENT, YOUR VOICE")).toHaveValue(
    "A draft worth preserving.",
  );
});

test("compact portrait and phone landscape remain usable without overflow", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "mobile",
    "Additional phone layout checks.",
  );
  for (const viewport of [
    { width: 320, height: 740 },
    { width: 852, height: 393 },
  ]) {
    await page.setViewportSize(viewport);
    for (const screen of [
      "Today",
      "Practice",
      "Library",
      "Progress",
    ] as const) {
      await navigate(page, screen);
      await assertNoHorizontalOverflow(page);
    }
    await navigate(page, "Practice");
    await meaningMatch(page);
    await expect(page.locator(".answer-option")).toHaveCount(4);
    await assertNoHorizontalOverflow(page);
    await page.getByRole("button", { name: "End session" }).click();
  }
});

test("production app reopens offline with its vocabulary and practice available", async ({
  page,
  context,
}) => {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() =>
      page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
    )
    .toBe(true);
  const offlineReady = await page.evaluate(async () => {
    const channel = new MessageChannel();
    return new Promise<boolean>((resolve) => {
      channel.port1.onmessage = (event) => resolve(Boolean(event.data.ready));
      navigator.serviceWorker.controller!.postMessage(
        { type: "GET_OFFLINE_STATUS" },
        [channel.port2],
      );
    });
  });
  expect(offlineReady).toBe(true);
  await context.setOffline(true);
  try {
    await page.reload();
    await expect(
      page.getByRole("heading", {
        name: "A little practice. A bigger vocabulary.",
      }),
    ).toBeVisible();
    await navigate(page, "Library");
    await expect(page.locator(".word-row").first()).toBeVisible();
    await navigate(page, "Practice");
    await meaningMatch(page);
    await expect(page.locator(".answer-option")).toHaveCount(4);
  } finally {
    await context.setOffline(false);
  }
});
