const REQUIRED_BANK_KEYS = ["vocabulary", "grammar", "reading"];

export function validateQuestionBank(bank) {
  const errors = [];
  for (const key of REQUIRED_BANK_KEYS) {
    if (!Array.isArray(bank[key])) errors.push(`${key} must be an array`);
  }
  if (errors.length > 0) return { valid: false, errors };

  const ids = new Set();
  for (const section of REQUIRED_BANK_KEYS) {
    for (const item of bank[section]) {
      if (!item.id) errors.push(`${section} item is missing id`);
      if (ids.has(item.id)) errors.push(`duplicate id: ${item.id}`);
      ids.add(item.id);
      if (!Number.isInteger(item.level)) errors.push(`${item.id} is missing numeric level`);
      if (!Array.isArray(item.tags) || item.tags.length === 0) errors.push(`${item.id} is missing tags`);
    }
  }

  for (const item of bank.vocabulary) {
    for (const field of ["word", "zh", "ja", "example"]) {
      if (!item[field]) errors.push(`${item.id} is missing ${field}`);
    }
  }

  for (const item of bank.grammar) {
    for (const field of ["prompt", "choices", "explanationZh", "explanationJa", "category"]) {
      if (!item[field]) errors.push(`${item.id} is missing ${field}`);
    }
    if (!Number.isInteger(item.answer)) errors.push(`${item.id} is missing answer`);
    if (item.choices && item.choices.length !== 4) errors.push(`${item.id} must have 4 choices`);
  }

  for (const item of bank.reading) {
    if (!item.passage) errors.push(`${item.id} is missing passage`);
    if (!Array.isArray(item.questions) || item.questions.length !== 2) {
      errors.push(`${item.id} must have exactly 2 reading questions`);
    }
  }

  return { valid: errors.length === 0, errors };
}

function rotate(items, count, dayNumber, difficulty) {
  const pool = items.filter((item) => item.level <= difficulty + 1);
  const usable = pool.length >= count ? pool : items;
  const start = ((dayNumber - 1) * count) % usable.length;
  const doubled = [...usable, ...usable];
  return doubled.slice(start, start + count);
}

export function buildDailyTask(bank, progress = {}, dayNumber = 1) {
  const difficulty = Number(progress.preferredDifficulty || 1);
  return {
    dayNumber,
    targetMinutes: 25,
    vocabulary: rotate(bank.vocabulary, 10, dayNumber, difficulty),
    grammar: rotate(bank.grammar, 8, dayNumber, difficulty),
    reading: rotate(bank.reading, 1, dayNumber, difficulty)
  };
}

export function getQuestionById(bank, id) {
  return [...bank.vocabulary, ...bank.grammar, ...bank.reading].find((item) => item.id === id);
}
