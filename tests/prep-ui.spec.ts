import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { prepBank, prepById } from "../src/prep/bank";
import type { PrepFormat, PrepQuestion } from "../src/prep/types";
import type { PrepRun } from "../src/prep/session";

const RUN_KEY = "wordtrail.prep-session.v1";
const PREP_KEY = "wordtrail.prep.v1";
const formats: PrepFormat[] = [
  "tc1",
  "tc2",
  "tc3",
  "se",
  "rc-single",
  "rc-multi",
  "rc-sentence",
];
const launchNames: Record<PrepFormat, string> = {
  tc1: "Configure Text Completion: 1 blank",
  tc2: "Configure Text Completion: 2 blanks",
  tc3: "Configure Text Completion: 3 blanks",
  se: "Configure Sentence Equivalence: Choose Two Answer Choices",
  "rc-single": "Configure Reading Comprehension: Select One Answer Choice",
  "rc-multi":
    "Configure Reading Comprehension: Select One or More Answer Choices",
  "rc-sentence": "Configure Reading Comprehension: Select-in-Passage",
};

async function hub(page: Page) {
  await expect(
    page.getByRole("navigation", {
      name: "Main navigation",
      exact: true,
      includeHidden: true,
    }),
  ).toBeAttached();
  if (await page.locator(".prep-runner").isVisible()) return;
  if (await page.getByRole("heading", { name: "Verbal Reasoning" }).isVisible())
    return;
  const mobile = await page
    .getByRole("navigation", { name: "Mobile navigation", exact: true })
    .isVisible();
  await page
    .getByRole("navigation", {
      name: mobile ? "Mobile navigation" : "Main navigation",
      exact: true,
    })
    .getByRole("button", { name: "Practice", exact: true })
    .click();
}

async function runState(page: Page): Promise<PrepRun> {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    RUN_KEY,
  );
}

async function currentQuestion(page: Page): Promise<PrepQuestion> {
  const run = await runState(page);
  const question = prepById.get(
    run.sections[run.sectionIndex].questionIds[run.questionIndex],
  );
  expect(question).toBeTruthy();
  return question!;
}

async function focused(page: Page, format: PrepFormat, difficulty = "all") {
  await hub(page);
  await page
    .getByRole("button", { name: launchNames[format], exact: true })
    .click();
  await expect(page.locator(".prep-session-builder")).toBeFocused();
  await expect(page.getByLabel("Verbal question format")).toHaveValue(format);
  await expect(page.getByLabel("Verbal question type")).toHaveValue(
    format.startsWith("tc") ? "tc" : format === "se" ? "se" : "rc",
  );
  await page.getByLabel("Verbal difficulty").selectOption(difficulty);
  await page.getByLabel("Verbal session length").selectOption("5");
  await page.getByRole("button", { name: "Start focused drill" }).click();
  await expect(
    page.getByRole("dialog", { name: "GRE practice session", exact: true }),
  ).toBeVisible();
  return currentQuestion(page);
}

async function correctAnswer(page: Page, q: PrepQuestion) {
  const question = page.locator(".prep-question");
  if (q.blanks) {
    for (let index = 0; index < q.blanks.length; index++) {
      await question
        .getByRole("group", { name: `Blank ${index + 1}`, exact: true })
        .getByRole("radio")
        .nth(q.blanks[index].answer)
        .check();
    }
  } else if (q.format === "rc-sentence") {
    await question.locator(".prep-sentence").nth(q.sentenceAnswer!).click();
  } else {
    for (const index of q.answers!)
      await question
        .getByRole(
          q.format === "se" || q.format === "rc-multi" ? "checkbox" : "radio",
        )
        .nth(index)
        .check();
  }
}

async function leave(page: Page) {
  await page.getByRole("button", { name: "Leave GRE practice" }).click();
  await page.getByRole("button", { name: "Leave & save" }).click();
  await expect(page.locator(".prep-runner")).toHaveCount(0);
}

async function settings(page: Page) {
  const mobile = await page
    .getByRole("navigation", { name: "Mobile navigation", exact: true })
    .isVisible();
  await page
    .getByRole("button", {
      name: mobile ? "Settings" : "Make it yours",
      exact: true,
    })
    .click();
}

async function noOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
    runner: document.querySelector(".prep-runner")?.scrollWidth,
  }));
  expect(dimensions.document, JSON.stringify(dimensions)).toBeLessThanOrEqual(
    dimensions.width + 1,
  );
  expect(dimensions.body, JSON.stringify(dimensions)).toBeLessThanOrEqual(
    dimensions.width + 1,
  );
  if (dimensions.runner)
    expect(dimensions.runner).toBeLessThanOrEqual(dimensions.width + 1);
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await hub(page);
});

for (const format of formats) {
  test(`${format}: correct full response is controlled, explained, and saved once`, async ({
    page,
  }) => {
    const q = await focused(page, format);
    const check = page.getByRole("button", { name: "Check reasoning" });
    await expect(check).toBeDisabled();
    await expect(
      page.getByRole("status", { name: "Answer and explanation" }),
    ).toHaveCount(0);
    await expect(page.locator(".prep-correct")).toHaveCount(0);
    if (q.blanks && q.blanks.length > 1) {
      await page
        .getByRole("group", { name: "Blank 1", exact: true })
        .getByRole("radio")
        .nth(q.blanks[0].answer)
        .check();
      await expect(check).toBeDisabled();
      await page.reload();
      await hub(page);
      await expect(
        page
          .getByRole("group", { name: "Blank 1", exact: true })
          .getByRole("radio")
          .nth(q.blanks[0].answer),
      ).toBeChecked();
      await expect(check).toBeDisabled();
    }
    if (format === "se") {
      await page
        .locator(".prep-question")
        .getByRole("checkbox")
        .nth(q.answers![0])
        .check();
      await expect(check).toBeDisabled();
    }
    if (format === "rc-sentence") {
      await expect(page.locator(".prep-selectable-passage")).toHaveCount(1);
      const sentence = page.locator(".prep-sentence").nth(q.sentenceAnswer!);
      await sentence.focus();
      await page.keyboard.press("Space");
      await expect(sentence).toHaveAttribute("aria-pressed", "true");
    }
    await correctAnswer(page, q);
    await expect(check).toBeEnabled();
    if (format === "se") {
      await expect(page.locator(".prep-question input:checked")).toHaveCount(2);
      for (let index = 0; index < q.choices!.length; index++) {
        if (!q.answers!.includes(index))
          await expect(
            page.locator(".prep-question").getByRole("checkbox").nth(index),
          ).toBeDisabled();
      }
      await page
        .locator(".prep-question")
        .getByRole("checkbox")
        .nth(q.answers![0])
        .uncheck();
      await expect(check).toBeDisabled();
      await page
        .locator(".prep-question")
        .getByRole("checkbox")
        .nth(q.answers![0])
        .check();
    }
    if (["tc3", "se", "rc-sentence"].includes(format)) {
      await page
        .getByRole("button", { name: "Mark for review", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Confident", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Clear answer", exact: true })
        .click();
      await expect(page.locator(".prep-question-stem")).toBeFocused();
      await expect(page.locator(".prep-response-summary")).toContainText(
        "Not answered",
      );
      await expect(check).toBeDisabled();
      await expect(
        page.getByRole("button", { name: "Clear answer", exact: true }),
      ).toBeDisabled();
      await expect(
        page.getByRole("button", { name: "Flagged", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Confident", exact: true }),
      ).toHaveAttribute("aria-pressed", "true");
      expect((await runState(page)).answers[q.id]).toEqual({});
      await correctAnswer(page, q);
    }
    await check.click();
    await expect(page.locator(".prep-solution h3")).toBeFocused();
    await expect(
      page.getByRole("button", { name: "Clear answer", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("status", { name: "Answer and explanation" }),
    ).toContainText("You got it.");
    await expect(
      page.getByRole("status", { name: "Answer and explanation" }),
    ).toContainText(q.explanation);
    await expect(
      page.getByRole("status", { name: "Answer and explanation" }),
    ).toContainText(q.trap);
    const attempts = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).attempts,
      PREP_KEY,
    );
    expect(attempts).toHaveLength(1);
    expect(attempts[0]).toMatchObject({ questionId: q.id, correct: true });
    await page.reload();
    await hub(page);
    await expect(
      page.getByRole("status", { name: "Answer and explanation" }),
    ).toContainText("You got it.");
    expect(
      await page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key)!).attempts.length,
        PREP_KEY,
      ),
    ).toBe(1);
    await noOverflow(page);
  });
}

test("one challenge per GRE question type exposes seven precise subtype controls", async ({
  page,
}) => {
  await expect(
    page.getByRole("heading", { name: "Choose your challenge", exact: true }),
  ).toHaveCount(1);
  for (const name of [
    "Text Completion",
    "Sentence Equivalence",
    "Reading Comprehension",
  ]) {
    await expect(page.getByRole("article", { name, exact: true })).toHaveCount(
      1,
    );
  }
  await expect(page.getByRole("button", { name: /^Configure / })).toHaveCount(
    7,
  );
  for (const name of Object.values(launchNames))
    await expect(page.getByRole("button", { name, exact: true })).toBeVisible();
  for (const name of [
    "Context clues",
    "Better together",
    "Read between the lines",
    "Make your case",
    "Vocabulary games & writing studio",
  ])
    await expect(page.getByRole("heading", { name, exact: true })).toHaveCount(
      0,
    );
  await expect(
    page.getByRole("button", { name: /Meaning match/ }),
  ).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Open writing studio", exact: true }),
  ).toHaveCount(0);
  await page.locator(".prep-vocabulary-tools summary").click();
  await expect(
    page.getByRole("button", { name: /Meaning match/ }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /Saved words/ })).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Missed words/ }),
  ).toBeVisible();
});

test("family practice and filter preferences survive reload and use the selected pool", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Mix Text Completion formats", exact: true })
    .click();
  await expect(page.getByLabel("Verbal question type")).toHaveValue("tc");
  await expect(page.getByLabel("Verbal question format")).toHaveValue("all");
  await page.getByLabel("Verbal difficulty").selectOption("Advanced");
  await page.getByLabel("Verbal session length").selectOption("15");
  await page.getByRole("tab", { name: "Strategies", exact: true }).click();
  await page.getByRole("tab", { name: "Practice", exact: true }).click();
  await page.reload();
  await hub(page);
  await expect(page.getByLabel("Verbal question type")).toHaveValue("tc");
  await expect(page.getByLabel("Verbal difficulty")).toHaveValue("Advanced");
  await expect(page.getByLabel("Verbal session length")).toHaveValue("15");
  await page
    .getByRole("button", { name: "Start focused drill", exact: true })
    .click();
  const run = await runState(page);
  expect(run.sections[0].questionIds.length).toBeGreaterThan(0);
  expect(
    run.sections[0].questionIds.every(
      (id) =>
        prepById.get(id)!.format.startsWith("tc") &&
        prepById.get(id)!.difficulty === "Advanced",
    ),
  ).toBe(true);
});

test("the Today Text Completion shortcut configures the modern one-blank session", async ({
  page,
}) => {
  const mobile = await page
    .getByRole("navigation", { name: "Mobile navigation", exact: true })
    .isVisible();
  await page
    .getByRole("navigation", {
      name: mobile ? "Mobile navigation" : "Main navigation",
      exact: true,
    })
    .getByRole("button", { name: "Today", exact: true })
    .click();
  await page.getByRole("button", { name: /^Text Completion/ }).click();
  await expect(
    page.getByRole("heading", { name: "Verbal Reasoning", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Verbal question format")).toHaveValue("tc1");
  await page
    .getByRole("button", { name: "Start focused drill", exact: true })
    .click();
  expect((await currentQuestion(page)).format).toBe("tc1");
  await expect(
    page.getByRole("dialog", { name: "Context clues", exact: true }),
  ).toHaveCount(0);
});

test("training tabs provide keyboard navigation and an associated panel", async ({
  page,
}) => {
  const practice = page.getByRole("tab", { name: "Practice", exact: true });
  await practice.focus();
  await page.keyboard.press("End");
  await expect(
    page.getByRole("tab", { name: "Official resources", exact: true }),
  ).toBeFocused();
  await expect(
    page.getByRole("tabpanel", { name: "Official resources", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Home");
  await expect(practice).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "Timed practice", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(
    page.getByRole("tabpanel", { name: "Timed practice", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("ArrowLeft");
  await expect(practice).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tablist").locator('[tabindex="0"]')).toHaveCount(
    1,
  );
});

test("empty unseen filters explain the limit and allow deliberate repeat practice", async ({
  page,
}) => {
  await focused(page, "rc-sentence");
  const run = await runState(page);
  for (let index = 0; index < run.sections[0].questionIds.length; index++) {
    await correctAnswer(page, await currentQuestion(page));
    await page
      .getByRole("button", { name: "Check reasoning", exact: true })
      .click();
    if (index < run.sections[0].questionIds.length - 1)
      await page.getByRole("button", { name: "Next", exact: true }).click();
  }
  await page
    .getByRole("button", { name: "Submit practice", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Submit section", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Back to my training", exact: true })
    .click();
  await page.getByRole("tab", { name: "Practice", exact: true }).click();
  const remaining =
    prepBank.filter((q) => q.format === "rc-sentence").length -
    run.sections[0].questionIds.length;
  if (remaining === 0) {
    await expect(
      page.getByRole("button", { name: "Start focused drill", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByText("No questions match these filters.", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", {
        name: "Include previously seen questions",
        exact: true,
      })
      .click();
    await expect(
      page.getByRole("button", { name: "Start focused drill", exact: true }),
    ).toBeEnabled();
  } else {
    // An expanded future bank must still keep only unseen items in the pool.
    await expect(
      page.getByRole("button", { name: "Start focused drill", exact: true }),
    ).toBeEnabled();
  }
  await page
    .getByRole("button", {
      name: "Practice all three question types",
      exact: true,
    })
    .click();
  await expect(page.getByLabel("Verbal question type")).toHaveValue("all");
  await expect(page.getByLabel("Verbal question format")).toHaveValue("all");
});

test("the section map distinguishes incomplete answers and navigates to marked or unanswered items", async ({
  page,
}) => {
  const first = await focused(page, "tc2");
  await page
    .getByRole("group", { name: "Blank 1", exact: true })
    .getByRole("radio")
    .nth(first.blanks![0].answer)
    .check();
  await expect(page.locator(".prep-response-summary")).toContainText(
    "Incomplete",
  );
  await page
    .getByRole("button", { name: "Mark for review", exact: true })
    .click();
  await page.getByRole("button", { name: "Skip for now", exact: true }).click();
  await correctAnswer(page, await currentQuestion(page));
  await page.locator(".prep-map summary").click();
  await expect(
    page.getByRole("button", {
      name: "Go to question 1, incomplete, flagged for review",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next marked", exact: true }).click();
  await expect(page.locator(".prep-question-stem")).toHaveText(first.stem);
  await page
    .getByRole("button", { name: "Next unanswered", exact: true })
    .click();
  expect((await runState(page)).questionIndex).toBe(2);
});

test("canceling a replacement keeps the unfinished session and traps keyboard focus", async ({
  page,
}) => {
  const question = await focused(page, "tc1");
  await correctAnswer(page, question);
  const existing = await runState(page);
  await leave(page);
  await expect(
    page.getByRole("button", { name: "Resume session", exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Practice", exact: true }).click();
  await page
    .getByRole("button", { name: launchNames["rc-single"], exact: true })
    .click();
  await page
    .getByRole("button", { name: "Start focused drill", exact: true })
    .click();
  const dialog = page.getByRole("alertdialog", {
    name: "You have an unfinished session.",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  for (let index = 0; index < 5; index++) {
    await page.keyboard.press("Tab");
    expect(
      await dialog.evaluate((el) => el.contains(document.activeElement)),
    ).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  expect((await runState(page)).id).toBe(existing.id);
  await page
    .getByRole("button", { name: "Resume session", exact: true })
    .click();
  await expect(page.locator(".prep-question-stem")).toHaveText(question.stem);
  await expect(page.locator(".prep-question input:checked")).toHaveCount(1);
});

test("reading passage jumps preserve focus and the runner scrolls by wheel or touch", async ({
  page,
  context,
}, testInfo) => {
  await page.setViewportSize({
    width: page.viewportSize()!.width,
    height: 500,
  });
  await focused(page, "rc-single");
  await page
    .getByRole("button", { name: "Go to question", exact: true })
    .click();
  await expect(page.locator(".prep-question-stem")).toBeFocused();
  await page
    .getByRole("button", { name: "Back to passage", exact: true })
    .click();
  await expect(page.locator(".prep-passage h3")).toBeFocused();
  await page.locator(".prep-runner").evaluate((el) => el.scrollTo(0, 0));
  const x = Math.round(page.viewportSize()!.width / 2);
  if (testInfo.project.name === "mobile") {
    const touch = await context.newCDPSession(page);
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y: 420 }],
    });
    for (let y = 360; y >= 120; y -= 60)
      await touch.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x, y }],
      });
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await touch.detach();
  } else {
    await page.mouse.move(x, 350);
    await page.mouse.wheel(0, 600);
  }
  await expect
    .poll(() => page.locator(".prep-runner").evaluate((el) => el.scrollTop))
    .toBeGreaterThan(50);
  await noOverflow(page);
});

for (const format of ["tc2", "tc3"] as const) {
  test(`${format}: one wrong blank earns no partial credit`, async ({
    page,
  }) => {
    const q = await focused(page, format);
    await correctAnswer(page, q);
    const last = q.blanks!.length - 1;
    const wrong = (q.blanks![last].answer + 1) % q.blanks![last].choices.length;
    await page
      .getByRole("group", { name: `Blank ${last + 1}`, exact: true })
      .getByRole("radio")
      .nth(wrong)
      .check();
    await page.getByRole("button", { name: "Check reasoning" }).click();
    await expect(
      page.getByRole("status", { name: "Answer and explanation" }),
    ).toContainText("Let’s work through it.");
    await expect(page.locator(".prep-choice.prep-incorrect")).toHaveCount(1);
    await expect(page.locator(".prep-choice.prep-correct")).toHaveCount(
      q.blanks!.length,
    );
    const attempts = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).attempts,
      PREP_KEY,
    );
    expect(attempts).toHaveLength(1);
    expect(attempts[0].correct).toBe(false);
  });
}

test("advanced filtered drills resume the answer and flagged question after leaving", async ({
  page,
}) => {
  const q = await focused(page, "tc3", "Advanced");
  const run = await runState(page);
  expect(
    run.sections[0].questionIds.every(
      (id) =>
        prepById.get(id)?.format === "tc3" &&
        prepById.get(id)?.difficulty === "Advanced",
    ),
  ).toBe(true);
  await correctAnswer(page, q);
  await page.getByRole("button", { name: "Mark for review" }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  const next = await currentQuestion(page);
  await leave(page);
  await page.reload();
  await hub(page);
  await expect(page.locator(".prep-question-stem")).toHaveText(next.stem);
  await page.getByRole("button", { name: "Previous", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Flagged", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".prep-question input:checked")).toHaveCount(3);
  await expect(
    page.getByRole("button", { name: "Check reasoning" }),
  ).toBeEnabled();
  await expect(
    page.getByRole("status", { name: "Answer and explanation" }),
  ).toHaveCount(0);
});

test("mistake notes survive reload and the global backup round trip rejects invalid prep", async ({
  page,
}) => {
  const q = await focused(page, "tc1");
  const wrong = (q.blanks![0].answer + 1) % q.blanks![0].choices.length;
  await page
    .getByRole("group", { name: "Blank 1", exact: true })
    .getByRole("radio")
    .nth(wrong)
    .check();
  await page.getByRole("button", { name: "Check reasoning" }).click();
  await expect(
    page.getByRole("status", { name: "Answer and explanation" }),
  ).toContainText("Let’s work through it.");
  await leave(page);
  await page.getByRole("tab", { name: "Review & insights", exact: true }).click();
  await page.locator(".prep-error-list summary").first().click();
  await page
    .getByLabel(`Error reason for ${q.id}`)
    .selectOption("Logic or evidence");
  await page
    .getByLabel(`Review note for ${q.id}`)
    .fill("Predict the contrast before checking the words.");
  await page.reload();
  await hub(page);
  await leave(page);
  await page.getByRole("tab", { name: "Review & insights", exact: true }).click();
  await page.locator(".prep-error-list summary").first().click();
  await expect(page.getByLabel(`Error reason for ${q.id}`)).toHaveValue(
    "Logic or evidence",
  );
  await expect(page.getByLabel(`Review note for ${q.id}`)).toHaveValue(
    "Predict the contrast before checking the words.",
  );
  await settings(page);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export", exact: true }).click();
  const download = await downloadPromise;
  const exported = await readFile((await download.path())!);
  const backup = JSON.parse(exported.toString());
  expect(backup.prep.progress.attempts[0]).toMatchObject({
    questionId: q.id,
    errorReason: "Logic or evidence",
    note: "Predict the contrast before checking the words.",
  });
  const invalid = structuredClone(backup);
  invalid.prep.progress.officialScores = [
    { date: "2026-10-24", verbal: 171, source: "ETS" },
  ];
  await page.locator("input[type=file]").setInputFiles({
    name: "bad-prep.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(invalid)),
  });
  await expect(page.getByRole("status")).toContainText("Invalid prep backup");
  await expect(
    page.getByText("Replace the progress on this device?", { exact: true }),
  ).toHaveCount(0);
  await page.evaluate(
    (keys) => {
      for (const key of keys) localStorage.removeItem(key);
    },
    [PREP_KEY, RUN_KEY],
  );
  await page.reload();
  await settings(page);
  await page.locator("input[type=file]").setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: exported,
  });
  await page
    .getByRole("button", { name: "Replace & import", exact: true })
    .click();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await hub(page);
  await page
    .getByRole("tab", { name: "Review & insights", exact: true })
    .click();
  await page.locator(".prep-error-list summary").first().click();
  await expect(page.getByLabel(`Review note for ${q.id}`)).toHaveValue(
    "Predict the contrast before checking the words.",
  );
  expect(
    await page.evaluate((key) => localStorage.getItem(key), RUN_KEY),
  ).toBeNull();
});

test("timed navigation keeps answers editable and section expiry records exactly 27 attempts", async ({
  page,
}) => {
  await page.clock.install();
  await page.getByRole("tab", { name: "Timed practice", exact: true }).click();
  await page
    .getByRole("button", { name: "Start 41-minute Verbal simulation" })
    .click();
  const q = await currentQuestion(page);
  await correctAnswer(page, q);
  await page.getByRole("button", { name: "Mark for review" }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Previous", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Flagged", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("status", { name: "Answer and explanation" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Check reasoning" }),
  ).toHaveCount(0);
  if (q.blanks) {
    await page
      .getByRole("group", { name: "Blank 1", exact: true })
      .getByRole("radio")
      .nth((q.blanks[0].answer + 1) % q.blanks[0].choices.length)
      .check();
    await correctAnswer(page, q);
  } else if (q.format === "rc-sentence") {
    await page
      .locator(".prep-sentence")
      .nth((q.sentenceAnswer! + 1) % q.passage!.sentences.length)
      .click();
    await correctAnswer(page, q);
  } else {
    const selected = page.locator(".prep-question input:checked").first();
    await expect(selected).toBeEnabled();
  }
  const original = await runState(page);
  await page.reload();
  await hub(page);
  expect((await runState(page)).deadline).toBe(original.deadline);
  await expect(
    page.getByRole("button", { name: "Flagged", exact: true }),
  ).toBeVisible();
  await page.clock.fastForward(18 * 60 * 1000 + 1000);
  await expect.poll(async () => (await runState(page)).sectionIndex).toBe(1);
  const second = await runState(page);
  expect(second.sections[1].questionIds).toHaveLength(15);
  expect(second.deadline! - second.sectionStartedAt).toBe(23 * 60 * 1000);
  expect(second.graded).toHaveLength(12);
  await expect(
    page.getByRole("status", { name: "Answer and explanation" }),
  ).toHaveCount(0);
  await page.clock.fastForward(23 * 60 * 1000 + 1000);
  await expect(
    page.getByRole("heading", { name: "Make this practice count." }),
  ).toBeVisible();
  await expect(page.locator(".prep-results>.prep-lead")).toContainText(
    "1 / 27 correct",
  );
  const attempts = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!).attempts,
    PREP_KEY,
  );
  expect(attempts).toHaveLength(27);
  expect(new Set(attempts.map((a: { id: string }) => a.id)).size).toBe(27);
  await page.reload();
  await hub(page);
  await expect(
    page.getByRole("heading", { name: "Make this practice count." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).attempts.length,
      PREP_KEY,
    ),
  ).toBe(27);
  await page
    .getByRole("button", { name: "Review question 1, correct", exact: true })
    .click();
  await expect(
    page.getByRole("status", { name: "Answer and explanation" }),
  ).toBeVisible();
});

test("official benchmark validation and authoritative resource links stay separate from app accuracy", async ({
  page,
}) => {
  await page
    .getByRole("tab", { name: "Review & insights", exact: true })
    .click();
  await page.getByLabel("Official Verbal score").fill("171");
  await page.getByRole("button", { name: "Save benchmark" }).click();
  await expect(page.locator(".prep-benchmark-row")).toHaveCount(0);
  await page.getByLabel("Official Verbal score").fill("169");
  await page.getByLabel("Official test date").fill("2026-10-20");
  await page.getByLabel("Official test name").fill("Timed POWERPREP 2");
  await page.getByRole("button", { name: "Save benchmark" }).click();
  await expect(page.locator(".prep-benchmark-row")).toContainText("Verbal 169");
  await page.reload();
  await hub(page);
  await page
    .getByRole("tab", { name: "Review & insights", exact: true })
    .click();
  await expect(page.locator(".prep-benchmark-row")).toContainText(
    "2026-10-20 · Timed POWERPREP 2",
  );
  await page
    .getByRole("tab", { name: "Official resources", exact: true })
    .click();
  await expect(page.locator(".prep-resource-grid>a")).toHaveCount(6);
  for (const link of await page.locator(".prep-resource-grid>a").all()) {
    const url = new URL((await link.getAttribute("href"))!);
    expect(url.protocol).toBe("https:");
    expect(url.hostname).toBe("www.ets.org");
    await expect(link).toHaveAttribute("target", "_blank");
  }
  await expect(page.locator(".prep-format-notice")).toContainText("2027");
  await expect(page.locator(".prep-hub")).not.toContainText(
    /Quantitative|170Q|Math foundations/,
  );
  await noOverflow(page);
});

test("a simulation suspended past both deadlines finishes on reopening without duplicate grades", async ({
  page,
}) => {
  await page.clock.install();
  await page.getByRole("tab", { name: "Timed practice", exact: true }).click();
  await page
    .getByRole("button", { name: "Start 41-minute Verbal simulation" })
    .click();
  const q = await currentQuestion(page);
  await correctAnswer(page, q);
  const run = await runState(page);
  // Changing wall time without running page timers represents a suspended phone.
  await page.clock.setSystemTime(
    new Date(run.sectionStartedAt + 42 * 60 * 1000),
  );
  await page.reload();
  await hub(page);
  await expect(
    page.getByRole("heading", { name: "Make this practice count." }),
  ).toBeVisible();
  await expect(page.locator(".prep-results>.prep-lead")).toContainText(
    "1 / 27 correct",
  );
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).attempts.length,
      PREP_KEY,
    ),
  ).toBe(27);
  await page.reload();
  await hub(page);
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).attempts.length,
      PREP_KEY,
    ),
  ).toBe(27);
});

test("failed section persistence is atomic and a retry saves the edited answers exactly once", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Start Verbal diagnostic" }).click();
  const q = await currentQuestion(page);
  await correctAnswer(page, q);
  await page.evaluate((key) => {
    const original = Storage.prototype.setItem;
    const state = { blocked: true, attemptCounts: [] as number[] };
    Object.defineProperty(window, "__prepPersistence", {
      configurable: true,
      value: state,
    });
    Storage.prototype.setItem = function (name, value) {
      if (name === key) {
        state.attemptCounts.push(JSON.parse(value).attempts.length);
        if (state.blocked)
          throw new DOMException("Storage is full", "QuotaExceededError");
      }
      return original.call(this, name, value);
    };
  }, PREP_KEY);
  await page.locator(".prep-map summary").click();
  await page
    .getByRole("button", { name: "Submit section now", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Submit section", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    /Your results? could not be saved/,
  );
  const blocked = await runState(page);
  expect(blocked.finished).toBe(false);
  expect(blocked.graded).toHaveLength(0);
  expect(
    await page.evaluate(
      (key) =>
        JSON.parse(localStorage.getItem(key) || '{"attempts":[]}').attempts
          .length,
      PREP_KEY,
    ),
  ).toBe(0);
  await expect(
    page.getByRole("heading", { name: "Make this practice count." }),
  ).toHaveCount(0);
  if (q.blanks) {
    await page
      .getByRole("group", { name: "Blank 1", exact: true })
      .getByRole("radio")
      .nth((q.blanks[0].answer + 1) % q.blanks[0].choices.length)
      .check();
  } else if (q.format === "rc-sentence") {
    await page
      .locator(".prep-sentence")
      .nth((q.sentenceAnswer! + 1) % q.passage!.sentences.length)
      .click();
  } else if (q.format === "se" || q.format === "rc-multi") {
    await page
      .locator(".prep-question")
      .getByRole("checkbox")
      .nth(q.answers![0])
      .uncheck();
    const wrong = q.choices!.findIndex(
      (_, index) => !q.answers!.includes(index),
    );
    if (wrong >= 0)
      await page
        .locator(".prep-question")
        .getByRole("checkbox")
        .nth(wrong)
        .check();
  } else {
    await page
      .locator(".prep-question")
      .getByRole("radio")
      .nth((q.answers![0] + 1) % q.choices!.length)
      .check();
  }
  const editedAnswer = (await runState(page)).answers[q.id];
  await page.evaluate(() => {
    (
      window as unknown as { __prepPersistence: { blocked: boolean } }
    ).__prepPersistence.blocked = false;
  });
  await page
    .getByRole("button", { name: "Submit section now", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Submit section", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Make this practice count." }),
  ).toBeVisible();
  await expect(page.locator(".prep-results>.prep-lead")).toContainText(
    "0 / 12 correct",
  );
  const attempts = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!).attempts,
    PREP_KEY,
  );
  expect(attempts).toHaveLength(12);
  expect(new Set(attempts.map((a: { id: string }) => a.id)).size).toBe(12);
  expect(
    attempts.find((a: { questionId: string }) => a.questionId === q.id),
  ).toMatchObject({ correct: false, answer: editedAnswer });
  expect(
    await page.evaluate(
      () =>
        (
          window as unknown as {
            __prepPersistence: { attemptCounts: number[] };
          }
        ).__prepPersistence.attemptCounts,
    ),
  ).toEqual([12, 12]);
  await page.reload();
  await hub(page);
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).attempts.length,
      PREP_KEY,
    ),
  ).toBe(12);
});

test("Verbal hub and triple-blank practice fit a 320-pixel phone", async ({
  page,
}, testInfo) => {
  await page.screenshot({
    path: `work/verbal-${testInfo.project.name}.png`,
  });
  await page.screenshot({
    path: `docs/preview-verbal-${testInfo.project.name}.png`,
  });
  await noOverflow(page);
  await page.setViewportSize({ width: 320, height: 740 });
  for (const name of [
    "Practice",
    "Timed practice",
    "Review & insights",
    "Strategies",
    "Official resources",
  ]) {
    await page.getByRole("tab", { name, exact: true }).click();
    await noOverflow(page);
  }
  await page.getByRole("tab", { name: "Practice", exact: true }).click();
  const q = await focused(page, "tc3");
  await page.screenshot({
    path: `work/verbal-runner-${testInfo.project.name}.png`,
  });
  await correctAnswer(page, q);
  await noOverflow(page);
  await page.getByRole("button", { name: "Check reasoning" }).click();
  await noOverflow(page);
  const scroll = await page
    .locator(".prep-runner")
    .evaluate((el) => ({ height: el.clientHeight, scroll: el.scrollHeight }));
  expect(scroll.scroll).toBeGreaterThan(scroll.height);
  await page
    .locator(".prep-runner")
    .evaluate((el) => el.scrollTo({ top: el.scrollHeight }));
  await expect(
    page.getByRole("button", { name: "Next", exact: true }),
  ).toBeInViewport();
});

test("the production Verbal bank and explanations work after reopening offline", async ({
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
  await context.setOffline(true);
  try {
    await page.reload();
    await hub(page);
    const q = await focused(page, "rc-multi");
    await correctAnswer(page, q);
    await page.getByRole("button", { name: "Check reasoning" }).click();
    await expect(
      page.getByRole("status", { name: "Answer and explanation" }),
    ).toContainText(q.explanation);
    expect(prepBank.length).toBeGreaterThan(27);
  } finally {
    await context.setOffline(false);
  }
});
