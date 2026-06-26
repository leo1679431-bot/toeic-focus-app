import { buildDailyTask, validateQuestionBank } from "./lib/content.js";
import { getGrammarChoiceUsage } from "./lib/grammar-usage.js";
import { completeDailyTask, loadProgress, recordAttempt, saveProgress } from "./lib/progress.js";
import { recommendDifficulty, summarizeWeek } from "./lib/scoring.js";
import { primeSpeechSynthesis, speakEnglishWord, speechButtonLabels } from "./lib/speech.js";
import { getVocabularyFamily, getVocabularyParts } from "./lib/vocabulary-meta.js";
import {
  renderAppShell,
  renderFocusQuestion,
  renderMistakes,
  renderPractice,
  renderProgress,
  renderToday
} from "./lib/views.js";

const app = document.querySelector("#app");
let bank = null;
let progress = loadProgress(window.localStorage);
let route = "today";
let focusSession = null;

const GRAMMAR_WRONG_REASONS = {
  "word-form": {
    zh: "詞性／字形不合空格位置。睇空格前後的字，先判斷要名詞、動詞、形容詞定副詞。",
    ja: "語形・品詞が空欄の位置に合いません。前後の語を見て必要な品詞を判断します。"
  },
  tense: {
    zh: "時態或被動語態不合句子線索。留意時間字、主詞係做動作定被做。",
    ja: "時制、または受け身の形が文の手がかりに合いません。"
  },
  preposition: {
    zh: "介系詞配搭不合。留意後面係時間、地點、名詞，或者係固定配搭。",
    ja: "前置詞の組み合わせが合いません。後ろの名詞・時間・固定表現を確認します。"
  },
  comparison: {
    zh: "比較結構不合。見到 than 通常要比較級；most / the most 先係最高級線索。",
    ja: "比較の形が合いません。than があれば比較級を意識します。"
  },
  conjunction: {
    zh: "連接詞意思或後面文法結構不合。要睇後面係完整句子、名詞，定固定片語。",
    ja: "接続詞の意味、または後ろに続く形が合いません。"
  },
  "relative-pronoun": {
    zh: "關係代名詞不合先行詞。先睇前面講人、物、地方、時間，定係所有格。",
    ja: "関係代名詞が先行詞に合いません。人・物・場所・時間・所有を確認します。"
  }
};

async function init() {
  try {
    const response = await fetch("./src/data/questions.json", { cache: "no-cache" });
    bank = await response.json();
    const validation = validateQuestionBank(bank);
    if (!validation.valid) throw new Error(validation.errors.join(", "));
    bindEvents();
    render();
    registerServiceWorker();
  } catch (error) {
    app.innerHTML = `
      <section class="app-shell">
        <div class="panel">
          <h1>題庫載入失敗</h1>
          <p>${error.message}</p>
          <button type="button" data-action="reload">重試</button>
        </div>
      </section>
    `;
  }
}

function bindEvents() {
  app.addEventListener("click", (event) => {
    const routeButton = event.target.closest("[data-route]");
    if (routeButton) {
      route = routeButton.dataset.route;
      render();
      return;
    }

    const action = event.target.closest("[data-action]")?.dataset.action;
    if (action === "start-focus") startFocus();
    if (action === "next-question") nextQuestion();
    if (action === "speak-word") {
      const button = event.target.closest("[data-word]");
      speakWord(button?.dataset.word, button);
    }
    if (action === "reload") window.location.reload();

    const choice = event.target.closest("[data-choice-index]");
    if (choice) answerCurrentQuestion(Number(choice.dataset.choiceIndex));
  });
}

function setSpeakButtonStatus(button, status) {
  if (!button) return;
  if (status === "loading" || status === "playing") {
    button.textContent = speechButtonLabels.loading;
    button.disabled = true;
    return;
  }
  if (status === "unsupported") {
    button.textContent = speechButtonLabels.unsupported;
    button.disabled = true;
    return;
  }
  if (status === "error") {
    button.textContent = speechButtonLabels.error;
    button.disabled = false;
    window.setTimeout(() => {
      button.textContent = speechButtonLabels.ready;
    }, 1400);
    return;
  }
  button.textContent = speechButtonLabels.ready;
  button.disabled = false;
}

function speakWord(word, button) {
  speakEnglishWord(word, window, {
    onStatus: (status) => setSpeakButtonStatus(button, status)
  });
}

function startFocus() {
  const task = buildDailyTask(bank, progress, progress.currentDay);
  const items = [
    ...task.vocabulary.map((item, index) => makeVocabularyQuestion(item, index)),
    ...task.grammar.map((item) => withChoiceExplanations({ ...item, section: "grammar" })),
    ...task.reading.flatMap((passage) =>
      passage.questions.map((question, index) => withChoiceExplanations({
        ...question,
        id: `${passage.id}-q${index + 1}`,
        section: "reading",
        category: "reading-detail",
        passage: passage.passage,
        prompt: `${passage.passage}\n\n${question.prompt}`,
        tags: passage.tags,
        level: passage.level
      }))
    )
  ];
  focusSession = { index: 0, items, answered: false, selected: null, isCorrect: false };
  renderFocus();
}

function makeVocabularyQuestion(item, index) {
  const fallbackDistractors = [
    { id: "fallback-schedule", word: "schedule", zh: "日程；安排", ja: "予定" },
    { id: "fallback-department", word: "department", zh: "部門；部署", ja: "部署" },
    { id: "fallback-equipment", word: "equipment", zh: "設備；器材", ja: "設備" }
  ];
  const distractors = bank.vocabulary
    .filter((candidate) => candidate.id !== item.id)
    .slice(index + 1, index + 4)
    .concat(fallbackDistractors)
    .slice(0, 3);
  const correctSlot = index % 4;
  const choiceSources = [...distractors];
  choiceSources.splice(correctSlot, 0, item);
  const choices = choiceSources.map((source) => source.zh);
  return {
    ...item,
    section: "vocabulary",
    prompt: item.word,
    choices,
    answer: correctSlot,
    category: "vocabulary",
    partsOfSpeech: getVocabularyParts(item),
    wordFamily: getVocabularyFamily(item),
    choiceExplanations: choiceSources.map((source) => {
      if (source.id === item.id) {
        return {
          zh: `正解。${item.word} = ${item.zh}。`,
          ja: `正解です。${item.word} は「${item.ja || item.zh}」です。`
        };
      }
      return {
        zh: `「${source.zh}」其實係 ${source.word} 的意思，不是 ${item.word}。`,
        ja: `「${source.ja || source.zh}」は ${source.word} の意味で、${item.word} ではありません。`
      };
    }),
    explanationZh: `${item.word} = ${item.zh}`,
    explanationJa: item.ja
  };
}

function withChoiceExplanations(item) {
  if (Array.isArray(item.choiceExplanations) && item.choiceExplanations.length === item.choices?.length) {
    return item;
  }
  const choices = item.choices || [];
  return {
    ...item,
    choiceExplanations: choices.map((choice, index) => {
      if (index === item.answer) {
        return {
          zh: `正解。${item.explanationZh || "呢個選項符合題目要求。"}`,
          ja: `正解です。${item.explanationJa || "この選択肢が文脈に合います。"}`
        };
      }
      if (item.section === "reading") {
        return {
          zh: `「${choice}」唔啱：文章無呢個資訊，或者同題目問嘅重點不一致。定位句：${item.explanationZh || "請回到文章找同義表達。"}`,
          ja: `「${choice}」は不適切です。本文にその情報がないか、質問のポイントと一致しません。`
        };
      }
      const reason = GRAMMAR_WRONG_REASONS[item.category] || {
        zh: "呢個選項不合句子結構或意思。",
        ja: "この選択肢は文の構造、または意味に合いません。"
      };
      const usage = getGrammarChoiceUsage(choice);
      return {
        zh: `「${choice}」唔啱：${reason.zh} ${usage.zh}`,
        ja: `「${choice}」は不適切です。${reason.ja} ${usage.ja}`
      };
    })
  };
}

function answerCurrentQuestion(selected) {
  if (!focusSession || focusSession.answered) return;
  const item = focusSession.items[focusSession.index];
  const isCorrect = selected === item.answer;
  progress = recordAttempt(progress, {
    questionId: item.id,
    section: item.section,
    category: item.category,
    selected,
    correct: item.answer,
    isCorrect,
    weekNumber: progress.currentWeek,
    dayNumber: progress.currentDay,
    answeredAt: new Date().toISOString()
  });
  saveProgress(window.localStorage, progress);
  focusSession = { ...focusSession, answered: true, selected, isCorrect };
  renderFocus();
}

function nextQuestion() {
  if (!focusSession) return;
  if (focusSession.index + 1 >= focusSession.items.length) {
    const summary = summarizeWeek(progress, progress.currentWeek);
    const recommendation = recommendDifficulty(summary);
    progress = completeDailyTask(progress, summary, recommendation);
    saveProgress(window.localStorage, progress);
    focusSession = null;
    route = "progress";
    render();
    return;
  }
  focusSession = {
    ...focusSession,
    index: focusSession.index + 1,
    answered: false,
    selected: null,
    isCorrect: false
  };
  renderFocus();
}

function renderFocus() {
  const item = focusSession.items[focusSession.index];
  app.innerHTML = renderFocusQuestion({
    index: focusSession.index,
    total: focusSession.items.length,
    answered: focusSession.answered,
    selected: focusSession.selected,
    isCorrect: focusSession.isCorrect,
    item,
    explanationZh: item.explanationZh,
    explanationJa: item.explanationJa
  });
}

function render() {
  if (!bank) return;
  if (route === "today") {
    const task = buildDailyTask(bank, progress, progress.currentDay);
    app.innerHTML = renderAppShell("today", renderToday(task, progress));
  }
  if (route === "practice") {
    app.innerHTML = renderAppShell("practice", renderPractice());
  }
  if (route === "mistakes") {
    app.innerHTML = renderAppShell("mistakes", renderMistakes(progress.mistakes));
  }
  if (route === "progress") {
    const summary = summarizeWeek(progress, progress.currentWeek);
    app.innerHTML = renderAppShell("progress", renderProgress(summary, recommendDifficulty(summary)));
  }
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js");
  }
  primeSpeechSynthesis(window);
}

init();
