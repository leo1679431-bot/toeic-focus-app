import assert from "node:assert/strict";
import test from "node:test";
import {
  renderAppShell,
  renderFocusQuestion,
  renderMistakes,
  renderPractice,
  renderProgress,
  renderToday
} from "../src/lib/views.js";

test("Today view includes the target score line and focus action", () => {
  const html = renderToday({
    dayNumber: 1,
    targetMinutes: 25,
    vocabulary: Array.from({ length: 10 }, (_, index) => ({ id: `v${index}` })),
    grammar: Array.from({ length: 8 }, (_, index) => ({ id: `g${index}` })),
    reading: [{ id: "r001", questions: [{}, {}] }]
  }, { currentWeek: 1 });
  assert.match(html, /TOEIC 800\+/);
  assert.match(html, /Listening 430\+/);
  assert.match(html, /Reading 370\+/);
  assert.match(html, /data-action="start-focus"/);
});

test("Focus question view hides bottom tabs and shows choices", () => {
  const html = renderFocusQuestion({
    index: 0,
    total: 1,
    answered: false,
    item: {
      id: "g001",
      section: "grammar",
      prompt: "Please ___ the form by Friday.",
      choices: ["submit", "submitted", "submission", "submitting"]
    }
  });
  assert.match(html, /focus-layout/);
  assert.match(html, /Please ___ the form/);
  assert.match(html, /data-choice-index="0"/);
  assert.doesNotMatch(html, /bottom-tabs/);
});

test("Progress view shows weekly recommendation", () => {
  const html = renderProgress(
    { accuracy: 0.72, weakestCategory: "word-form", sectionAccuracy: { vocabulary: 1, grammar: 0.5, reading: 0.5 } },
    { action: "keep", messageZh: "維持難度", messageJa: "難易度は維持" }
  );
  assert.match(html, /維持難度/);
  assert.match(html, /word-form/);
});

test("Mistakes view shows empty state when there are no active mistakes", () => {
  const html = renderMistakes([]);
  assert.match(html, /目前沒有錯題/);
});

test("Practice view shows optional free practice categories", () => {
  const html = renderPractice();
  assert.match(html, /單字/);
  assert.match(html, /Part 5/);
  assert.match(html, /短文閱讀/);
});

test("App shell marks the active tab", () => {
  const html = renderAppShell("today", "<p>Body</p>");
  assert.match(html, /aria-current="page"/);
  assert.match(html, /Body/);
});
