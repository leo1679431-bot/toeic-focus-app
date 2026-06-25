import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildDailyTask, getQuestionById, validateQuestionBank } from "../src/lib/content.js";

const bank = JSON.parse(readFileSync("src/data/questions.json", "utf8"));

test("question bank has enough seed content for 7 daily tasks", () => {
  const result = validateQuestionBank(bank);
  assert.deepEqual(result.errors, []);
  assert.equal(result.valid, true);
  assert.ok(bank.vocabulary.length >= 70);
  assert.ok(bank.grammar.length >= 56);
  assert.ok(bank.reading.length >= 7);
});

test("daily task contains the correct TOEIC practice mix", () => {
  const task = buildDailyTask(bank, { preferredDifficulty: 1, attempts: [] }, 1);
  assert.equal(task.vocabulary.length, 10);
  assert.equal(task.grammar.length, 8);
  assert.equal(task.reading.length, 1);
  assert.equal(task.reading[0].questions.length, 2);
});

test("daily tasks vary across the first week", () => {
  const day1 = buildDailyTask(bank, { preferredDifficulty: 1, attempts: [] }, 1);
  const day2 = buildDailyTask(bank, { preferredDifficulty: 1, attempts: [] }, 2);
  assert.notDeepEqual(day1.vocabulary.map((item) => item.id), day2.vocabulary.map((item) => item.id));
  assert.notDeepEqual(day1.grammar.map((item) => item.id), day2.grammar.map((item) => item.id));
});

test("question lookup returns a matching item by id", () => {
  const firstGrammar = bank.grammar[0];
  assert.deepEqual(getQuestionById(bank, firstGrammar.id), firstGrammar);
});
