import { buildDailyTask, validateQuestionBank } from "./lib/content.js";
import { completeDailyTask, loadProgress, recordAttempt, saveProgress } from "./lib/progress.js";
import { recommendDifficulty, summarizeWeek } from "./lib/scoring.js";
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
    if (action === "reload") window.location.reload();

    const choice = event.target.closest("[data-choice-index]");
    if (choice) answerCurrentQuestion(Number(choice.dataset.choiceIndex));
  });
}

function startFocus() {
  const task = buildDailyTask(bank, progress, progress.currentDay);
  const items = [
    ...task.vocabulary.map((item, index) => makeVocabularyQuestion(item, index)),
    ...task.grammar.map((item) => ({ ...item, section: "grammar" })),
    ...task.reading.flatMap((passage) =>
      passage.questions.map((question, index) => ({
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
  const distractors = bank.vocabulary
    .filter((candidate) => candidate.id !== item.id)
    .slice(index + 1, index + 4)
    .map((candidate) => candidate.zh);
  const paddedDistractors = [...distractors, "日程；安排", "部門；部署", "設備；器材"].slice(0, 3);
  const correctSlot = index % 4;
  const choices = [...paddedDistractors];
  choices.splice(correctSlot, 0, item.zh);
  return {
    ...item,
    section: "vocabulary",
    prompt: item.word,
    choices,
    answer: correctSlot,
    category: "vocabulary",
    explanationZh: `${item.word} = ${item.zh}`,
    explanationJa: item.ja
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
}

init();
