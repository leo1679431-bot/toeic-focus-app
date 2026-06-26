import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getGrammarChoiceUsage } from "../src/lib/grammar-usage.js";

test("grammar usage explains a wrong verb form with a correct example", () => {
  const usage = getGrammarChoiceUsage("submitted");
  assert.match(usage.zh, /過去式／過去分詞/);
  assert.match(usage.zh, /已提交／被提交/);
  assert.match(usage.zh, /正確例子：The form was submitted yesterday\./);
  assert.match(usage.ja, /過去形・過去分詞/);
});

test("grammar usage explains functional grammar choices", () => {
  const usage = getGrammarChoiceUsage("during");
  assert.match(usage.zh, /介系詞/);
  assert.match(usage.zh, /正確例子：Please turn off phones during the meeting\./);
  assert.match(usage.ja, /前置詞/);
});

test("all seed grammar choices have concrete usage examples", () => {
  const bank = JSON.parse(readFileSync("src/data/questions.json", "utf8"));
  const choices = [...new Set(bank.grammar.flatMap((question) => question.choices))];
  for (const choice of choices) {
    const usage = getGrammarChoiceUsage(choice);
    assert.doesNotMatch(usage.zh, /Please check the correct use/);
    assert.match(usage.zh, /正確例子：/);
    assert.match(usage.ja, /正しい例：/);
  }
});
