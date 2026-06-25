import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getVocabularyFamily, getVocabularyParts } from "../src/lib/vocabulary-meta.js";

const bank = JSON.parse(readFileSync("src/data/questions.json", "utf8"));

test("known multi-use vocabulary shows multiple parts of speech", () => {
  const invoice = bank.vocabulary.find((item) => item.id === "v001");
  const parts = getVocabularyParts(invoice);
  assert.deepEqual(parts.map((entry) => entry.part), ["noun", "verb"]);
});

test("all seed vocabulary items have configured parts of speech", () => {
  for (const item of bank.vocabulary) {
    const parts = getVocabularyParts(item);
    assert.ok(parts.length >= 1, `${item.id} should have a part of speech`);
    assert.notEqual(parts[0].part, "word", `${item.id} should use a configured part of speech`);
  }
});

test("word family returns noun verb adjective and adverb slots", () => {
  const reliable = bank.vocabulary.find((item) => item.id === "v033");
  const family = getVocabularyFamily(reliable);
  assert.deepEqual(family.map((entry) => entry.part), ["noun", "verb", "adjective", "adverb"]);
  assert.deepEqual(family.map((entry) => entry.form), ["reliability", "rely", "reliable", "reliably"]);
});

test("all seed vocabulary items have word-family rows", () => {
  for (const item of bank.vocabulary) {
    const family = getVocabularyFamily(item);
    assert.equal(family.length, 4, `${item.id} should have four word-family slots`);
    assert.ok(family.some((entry) => entry.form !== "-"), `${item.id} should have at least one known form`);
  }
});
