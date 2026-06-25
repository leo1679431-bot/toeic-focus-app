import assert from "node:assert/strict";
import test from "node:test";
import { createInitialProgress, recordAttempt } from "../src/lib/progress.js";
import { recommendDifficulty, summarizeWeek } from "../src/lib/scoring.js";

function progressWithAttempts(attempts) {
  return attempts.reduce((progress, attempt, index) => {
    return recordAttempt(progress, {
      questionId: `q${index}`,
      section: attempt.section,
      category: attempt.category,
      selected: attempt.isCorrect ? 0 : 1,
      correct: 0,
      isCorrect: attempt.isCorrect,
      weekNumber: 1,
      dayNumber: 1,
      answeredAt: "2026-06-25T00:00:00.000Z"
    });
  }, createInitialProgress());
}

test("summarizeWeek calculates section accuracy and weakest category", () => {
  const progress = progressWithAttempts([
    { section: "grammar", category: "word-form", isCorrect: false },
    { section: "grammar", category: "word-form", isCorrect: false },
    { section: "grammar", category: "preposition", isCorrect: true },
    { section: "vocabulary", category: "vocabulary", isCorrect: true }
  ]);
  const summary = summarizeWeek(progress, 1);
  assert.equal(summary.total, 4);
  assert.equal(summary.correct, 2);
  assert.equal(summary.accuracy, 0.5);
  assert.equal(summary.weakestCategory, "word-form");
});

test("recommendDifficulty increases level at 80 percent or more", () => {
  const recommendation = recommendDifficulty({ accuracy: 0.82, weakestCategory: "preposition" });
  assert.equal(recommendation.action, "increase");
  assert.equal(recommendation.nextDifficultyDelta, 1);
});

test("recommendDifficulty keeps level between 60 and 79 percent", () => {
  const recommendation = recommendDifficulty({ accuracy: 0.72, weakestCategory: "word-form" });
  assert.equal(recommendation.action, "keep");
  assert.equal(recommendation.focusCategory, "word-form");
});

test("recommendDifficulty reduces level below 60 percent", () => {
  const recommendation = recommendDifficulty({ accuracy: 0.41, weakestCategory: "tense" });
  assert.equal(recommendation.action, "reduce");
  assert.equal(recommendation.nextDifficultyDelta, -1);
});
