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

test("Focus question view marks wrong selected answer and correct answer", () => {
  const html = renderFocusQuestion({
    index: 0,
    total: 1,
    answered: true,
    selected: 0,
    isCorrect: false,
    explanationZh: "during 後面接名詞。",
    explanationJa: "during の後ろは名詞です。",
    item: {
      id: "g003",
      section: "grammar",
      category: "preposition",
      prompt: "All employees must wear their ID badges ___ the office.",
      choices: ["while", "during", "because", "although"],
      answer: 1
    }
  });
  assert.match(html, /不正解/);
  assert.match(html, /正解：B\. during/);
  assert.match(html, /class="choice is-selected is-wrong"/);
  assert.match(html, /class="choice is-correct"/);
  assert.match(html, /class="answer-key">during/);
});

test("Focus question view marks correct selected answer in green", () => {
  const html = renderFocusQuestion({
    index: 0,
    total: 1,
    answered: true,
    selected: 1,
    isCorrect: true,
    explanationZh: "during 後面接名詞。",
    explanationJa: "during の後ろは名詞です。",
    item: {
      id: "g003",
      section: "grammar",
      category: "preposition",
      prompt: "All employees must wear their ID badges ___ the office.",
      choices: ["while", "during", "because", "although"],
      answer: 1
    }
  });
  assert.match(html, /正解/);
  assert.match(html, /正解：B\. during/);
  assert.match(html, /class="choice is-selected is-correct"/);
  assert.doesNotMatch(html, /is-wrong/);
});

test("Focus vocabulary explanation shows word and part of speech", () => {
  const html = renderFocusQuestion({
    index: 0,
    total: 1,
    answered: true,
    selected: 0,
    isCorrect: true,
    explanationZh: "invoice = 請求書；發票",
    explanationJa: "請求書",
    item: {
      id: "v001",
      section: "vocabulary",
      category: "vocabulary",
      prompt: "invoice",
      choices: ["請求書；發票", "退款；返金", "確認", "提交；提出"],
      answer: 0,
      word: "invoice",
      partsOfSpeech: [
        { part: "noun", zh: "名詞", ja: "名詞" },
        { part: "verb", zh: "動詞", ja: "動詞" }
      ],
      wordFamily: [
        { part: "noun", zh: "名詞", ja: "名詞", form: "invoice" },
        { part: "verb", zh: "動詞", ja: "動詞", form: "invoice" },
        { part: "adjective", zh: "形容詞", ja: "形容詞", form: "-" },
        { part: "adverb", zh: "副詞", ja: "副詞", form: "-" }
      ]
    }
  });
  assert.match(html, /class="answer-key">invoice/);
  assert.match(html, /noun/);
  assert.match(html, /verb/);
  assert.match(html, /名詞 \/ 名詞/);
  assert.match(html, /Word family/);
  assert.match(html, /adjective/);
  assert.match(html, /adverb/);
  assert.match(html, /data-action="speak-word"/);
  assert.match(html, /data-word="invoice"/);
  assert.match(html, /聽讀音/);
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
