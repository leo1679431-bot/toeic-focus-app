const STORAGE_KEY = "toeic-focus-progress-v1";

export function createInitialProgress() {
  return {
    currentWeek: 1,
    currentDay: 1,
    preferredDifficulty: 1,
    completedDailyTasks: [],
    attempts: [],
    mistakes: [],
    weeklySummaries: []
  };
}

export function recordAttempt(progress, attempt) {
  const next = structuredClone(progress);
  next.attempts.push(attempt);
  if (!attempt.isCorrect) {
    const existing = next.mistakes.find((item) => item.questionId === attempt.questionId);
    if (existing) {
      existing.lastSelected = attempt.selected;
      existing.lastAttemptedAt = attempt.answeredAt;
      existing.mastered = false;
      existing.reviewCorrectCount = 0;
    } else {
      next.mistakes.push({
        questionId: attempt.questionId,
        section: attempt.section,
        category: attempt.category,
        lastSelected: attempt.selected,
        correct: attempt.correct,
        firstMissedAt: attempt.answeredAt,
        lastAttemptedAt: attempt.answeredAt,
        reviewCorrectCount: 0,
        mastered: false
      });
    }
  }
  return next;
}

export function markMistakeReview(progress, questionId, isCorrect) {
  const next = structuredClone(progress);
  const mistake = next.mistakes.find((item) => item.questionId === questionId);
  if (!mistake) return next;
  mistake.reviewCorrectCount = isCorrect ? mistake.reviewCorrectCount + 1 : 0;
  mistake.mastered = mistake.reviewCorrectCount >= 2;
  return next;
}

export function saveProgress(storage, progress) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}

export function loadProgress(storage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : createInitialProgress();
  } catch {
    return createInitialProgress();
  }
}
