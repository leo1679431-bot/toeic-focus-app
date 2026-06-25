function accuracy(correct, total) {
  return total === 0 ? 0 : correct / total;
}

export function summarizeWeek(progress, weekNumber) {
  const attempts = progress.attempts.filter((attempt) => attempt.weekNumber === weekNumber);
  const correct = attempts.filter((attempt) => attempt.isCorrect).length;
  const categoryMisses = new Map();
  for (const attempt of attempts) {
    if (!attempt.isCorrect) {
      categoryMisses.set(attempt.category, (categoryMisses.get(attempt.category) || 0) + 1);
    }
  }
  const weakestCategory =
    [...categoryMisses.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ||
    "none";

  return {
    weekNumber,
    total: attempts.length,
    correct,
    accuracy: accuracy(correct, attempts.length),
    sectionAccuracy: {
      vocabulary: sectionAccuracy(attempts, "vocabulary"),
      grammar: sectionAccuracy(attempts, "grammar"),
      reading: sectionAccuracy(attempts, "reading")
    },
    weakestCategory
  };
}

function sectionAccuracy(attempts, section) {
  const sectionAttempts = attempts.filter((attempt) => attempt.section === section);
  return accuracy(sectionAttempts.filter((attempt) => attempt.isCorrect).length, sectionAttempts.length);
}

export function recommendDifficulty(summary) {
  if (summary.accuracy >= 0.8) {
    return {
      action: "increase",
      nextDifficultyDelta: 1,
      focusCategory: summary.weakestCategory,
      messageZh: "今週正確率達到 80% 以上，下週可以加難度。",
      messageJa: "80%以上なので、次の週は少し難しくします。"
    };
  }
  if (summary.accuracy >= 0.6) {
    return {
      action: "keep",
      nextDifficultyDelta: 0,
      focusCategory: summary.weakestCategory,
      messageZh: "正確率在 60-79%，下週維持難度並集中補弱點。",
      messageJa: "難易度は維持して、弱い分野を多めにします。"
    };
  }
  return {
    action: "reduce",
    nextDifficultyDelta: -1,
    focusCategory: summary.weakestCategory,
    messageZh: "正確率低於 60%，下週先回補基本文法和高頻單字。",
    messageJa: "基礎に戻って、文法と単語を立て直します。"
  };
}
