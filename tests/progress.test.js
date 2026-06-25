import assert from "node:assert/strict";
import test from "node:test";
import {
  completeDailyTask,
  createInitialProgress,
  loadProgress,
  markMistakeReview,
  recordAttempt,
  saveProgress
} from "../src/lib/progress.js";

function fakeStorage() {
  const data = new Map();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value)
  };
}

test("initial progress has week 1 and difficulty 1", () => {
  const progress = createInitialProgress();
  assert.equal(progress.currentWeek, 1);
  assert.equal(progress.preferredDifficulty, 1);
  assert.deepEqual(progress.attempts, []);
  assert.deepEqual(progress.mistakes, []);
});

test("recordAttempt stores wrong answers in mistakes", () => {
  const progress = recordAttempt(createInitialProgress(), {
    questionId: "g001",
    section: "grammar",
    category: "word-form",
    selected: 1,
    correct: 0,
    isCorrect: false,
    weekNumber: 1,
    dayNumber: 1,
    answeredAt: "2026-06-25T00:00:00.000Z"
  });
  assert.equal(progress.attempts.length, 1);
  assert.equal(progress.mistakes.length, 1);
  assert.equal(progress.mistakes[0].questionId, "g001");
});

test("correct mistake reviews mark an item mastered after two correct reviews", () => {
  let progress = recordAttempt(createInitialProgress(), {
    questionId: "g001",
    section: "grammar",
    category: "word-form",
    selected: 1,
    correct: 0,
    isCorrect: false,
    weekNumber: 1,
    dayNumber: 1,
    answeredAt: "2026-06-25T00:00:00.000Z"
  });
  progress = markMistakeReview(progress, "g001", true);
  progress = markMistakeReview(progress, "g001", true);
  assert.equal(progress.mistakes[0].reviewCorrectCount, 2);
  assert.equal(progress.mistakes[0].mastered, true);
});

test("saveProgress and loadProgress round trip through storage", () => {
  const storage = fakeStorage();
  const progress = recordAttempt(createInitialProgress(), {
    questionId: "v001",
    section: "vocabulary",
    category: "vocabulary",
    selected: 0,
    correct: 0,
    isCorrect: true,
    weekNumber: 1,
    dayNumber: 1,
    answeredAt: "2026-06-25T00:00:00.000Z"
  });
  assert.equal(saveProgress(storage, progress), true);
  assert.deepEqual(loadProgress(storage), progress);
});

test("completeDailyTask advances day and stores weekly summary on day 7", () => {
  const progress = {
    ...createInitialProgress(),
    currentWeek: 1,
    currentDay: 7,
    preferredDifficulty: 1
  };
  const next = completeDailyTask(
    progress,
    { weekNumber: 1, accuracy: 0.82, weakestCategory: "preposition" },
    { action: "increase", nextDifficultyDelta: 1 }
  );
  assert.equal(next.currentWeek, 2);
  assert.equal(next.currentDay, 1);
  assert.equal(next.preferredDifficulty, 2);
  assert.equal(next.weeklySummaries.length, 1);
});
