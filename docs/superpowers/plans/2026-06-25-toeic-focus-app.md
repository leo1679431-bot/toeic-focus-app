# TOEIC Focus App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a focused online PWA-style TOEIC study app for iPhone and iPad, targeting TOEIC 800+ with daily 20-30 minute practice and 7-day difficulty adjustment.

**Architecture:** Use a static, dependency-light web app with ES modules, JSON question data, pure logic modules for content selection and scoring, and a small browser controller for rendering and local progress. The app is online-first but uses PWA metadata and a service worker for a home-screen app feel and stable shell caching.

**Tech Stack:** HTML, CSS, vanilla JavaScript ES modules, JSON, Node.js built-in test runner, localStorage, Web App Manifest, Service Worker.

## Global Constraints

- The first screen must be the usable Today screen, not a landing page.
- The app is online-first, but practice must use Focus Mode: no social links, no external links during practice, no unnecessary buttons, one question or task step at a time.
- Version 1 has no account login.
- Progress is saved in the same browser using localStorage.
- iPhone and iPad progress can be separate in version 1.
- Daily task target: 10 vocabulary items, 8 Part 5 grammar questions, 1 short reading passage with 2 questions.
- Weekly cycle: Day 1-6 normal practice, Day 7 weekly check and summary.
- Difficulty rule: 80%+ average accuracy increases difficulty; 60-79% keeps difficulty and increases weakest category; below 60% reduces difficulty and rebuilds basics.
- Explanations must include Traditional Chinese, and Japanese keyword or gloss where useful.
- Initial content must support at least 7 days of daily tasks.
- Target score line shown in app: TOEIC 800+ / Listening 430+ / Reading 370+.
- Avoid distracting visual treatment; the UI should feel like a clean study desk.

---

## File Structure

Create these files:

- `package.json` - project scripts and Node ESM setting.
- `index.html` - PWA entry point and app root.
- `manifest.webmanifest` - iPhone/iPad home-screen metadata.
- `service-worker.js` - online-first app shell cache.
- `scripts/serve.mjs` - local static server for manual testing.
- `src/styles.css` - responsive visual system and Focus Mode layout.
- `src/app.js` - browser controller, routing, event handling, localStorage wiring.
- `src/data/questions.json` - tagged TOEIC vocabulary, grammar, and reading content.
- `src/lib/content.js` - question validation, daily task building, tagged selection.
- `src/lib/progress.js` - progress state shape, attempt recording, mistake handling, persistence helpers.
- `src/lib/scoring.js` - accuracy calculation, weak-category summary, 7-day difficulty recommendation.
- `src/lib/views.js` - pure HTML render functions for Today, Focus Practice, Practice, Mistakes, and Progress.
- `tests/content.test.js` - schema, count, duplicate-id, and daily task tests.
- `tests/scoring.test.js` - weekly recommendation and weak-category tests.
- `tests/progress.test.js` - attempt recording, mistake mastery, and storage tests.
- `tests/views.test.js` - render-output tests for core screens.

No external npm packages are required for version 1.

---

### Task 1: Static PWA Scaffold

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `manifest.webmanifest`
- Create: `service-worker.js`
- Create: `scripts/serve.mjs`
- Create: `src/styles.css`
- Test: `tests/scaffold.test.js`

**Interfaces:**
- Produces: Browser entry point with `<div id="app"></div>`.
- Produces: `npm test` command using Node's built-in test runner.
- Produces: `npm run serve` command serving the repo at `http://localhost:4173`.

- [ ] **Step 1: Write the scaffold test**

Create `tests/scaffold.test.js`:

```js
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("index.html has PWA metadata and app root", () => {
  const html = readFileSync("index.html", "utf8");
  assert.match(html, /<main id="app"/);
  assert.match(html, /manifest\.webmanifest/);
  assert.match(html, /src\/app\.js/);
});

test("manifest has required mobile app fields", () => {
  const manifest = JSON.parse(readFileSync("manifest.webmanifest", "utf8"));
  assert.equal(manifest.name, "TOEIC 800+ Focus");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "./");
  assert.equal(manifest.theme_color, "#2f7d6b");
});

test("service worker uses named app shell cache", () => {
  const sw = readFileSync("service-worker.js", "utf8");
  assert.match(sw, /toeic-focus-shell-v1/);
  assert.match(sw, /install/);
  assert.match(sw, /fetch/);
});
```

- [ ] **Step 2: Run the failing scaffold test**

Run: `npm test -- tests/scaffold.test.js`

Expected: command fails because `package.json` and scaffold files do not exist.

- [ ] **Step 3: Create `package.json`**

```json
{
  "name": "toeic-focus-app",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test",
    "serve": "node scripts/serve.mjs"
  }
}
```

- [ ] **Step 4: Create `index.html`**

```html
<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="theme-color" content="#2f7d6b">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-title" content="TOEIC Focus">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <title>TOEIC 800+ Focus</title>
    <link rel="manifest" href="manifest.webmanifest">
    <link rel="stylesheet" href="src/styles.css">
  </head>
  <body>
    <main id="app" aria-live="polite"></main>
    <script type="module" src="src/app.js"></script>
  </body>
</html>
```

- [ ] **Step 5: Create `manifest.webmanifest`**

```json
{
  "name": "TOEIC 800+ Focus",
  "short_name": "TOEIC Focus",
  "start_url": "./",
  "display": "standalone",
  "background_color": "#f6f3eb",
  "theme_color": "#2f7d6b",
  "icons": [
    {
      "src": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'%3E%3Crect width='192' height='192' rx='42' fill='%232f7d6b'/%3E%3Ctext x='96' y='112' text-anchor='middle' font-size='56' font-family='Arial' fill='white' font-weight='700'%3ETO%3C/text%3E%3C/svg%3E",
      "sizes": "192x192",
      "type": "image/svg+xml",
      "purpose": "any"
    }
  ]
}
```

- [ ] **Step 6: Create `service-worker.js`**

```js
const CACHE_NAME = "toeic-focus-shell-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./src/styles.css",
  "./src/app.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
```

- [ ] **Step 7: Create `scripts/serve.mjs`**

```js
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const root = process.cwd();
const port = Number(process.env.PORT || 4173);
const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8"
};

function resolvePath(url) {
  const pathname = decodeURIComponent(new URL(url, `http://localhost:${port}`).pathname);
  const safePath = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(root, safePath === "/" ? "index.html" : safePath);
  if (!filePath.startsWith(root)) return join(root, "index.html");
  if (existsSync(filePath) && statSync(filePath).isDirectory()) return join(filePath, "index.html");
  return filePath;
}

createServer((request, response) => {
  const filePath = resolvePath(request.url || "/");
  if (!existsSync(filePath)) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }
  response.writeHead(200, { "content-type": types[extname(filePath)] || "application/octet-stream" });
  createReadStream(filePath).pipe(response);
}).listen(port, "127.0.0.1", () => {
  console.log(`TOEIC Focus app running at http://127.0.0.1:${port}`);
});
```

- [ ] **Step 8: Create initial `src/styles.css`**

```css
:root {
  color-scheme: light;
  --bg: #f6f3eb;
  --panel: #ffffff;
  --ink: #1f2422;
  --muted: #64706b;
  --line: #e1ddd4;
  --accent: #2f7d6b;
  --accent-soft: #dce9e4;
  --danger: #b54848;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  background: var(--bg);
  color: var(--ink);
}

button {
  min-height: 44px;
  border: 0;
  border-radius: 8px;
  background: var(--accent);
  color: white;
  font: inherit;
  font-weight: 700;
  padding: 0 16px;
}

button.secondary {
  background: var(--accent-soft);
  color: var(--accent);
}

.app-shell {
  max-width: 1040px;
  min-height: 100vh;
  margin: 0 auto;
  padding: 18px 16px 88px;
}

.panel {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 16px;
}

.bottom-tabs {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  border-top: 1px solid var(--line);
  background: rgba(246, 243, 235, 0.96);
  padding: 8px 12px calc(8px + env(safe-area-inset-bottom));
}

.bottom-tabs button {
  min-height: 42px;
  background: transparent;
  color: var(--muted);
  font-size: 13px;
}

.bottom-tabs button[aria-current="page"] {
  background: var(--accent-soft);
  color: var(--accent);
}

.focus-layout {
  display: grid;
  gap: 12px;
}

.choice {
  width: 100%;
  min-height: 48px;
  border: 1px solid var(--line);
  background: white;
  color: var(--ink);
  text-align: left;
}

.choice.is-selected {
  border-color: var(--accent);
  background: var(--accent-soft);
}

@media (min-width: 760px) {
  .app-shell {
    padding-right: 24px;
    padding-left: 24px;
  }

  .focus-layout.has-answer {
    grid-template-columns: 1.05fr 0.85fr;
    align-items: start;
  }
}
```

- [ ] **Step 9: Create temporary `src/app.js` so the scaffold can load**

```js
const app = document.querySelector("#app");
app.innerHTML = `
  <section class="app-shell">
    <div class="panel">
      <p>TOEIC 800+ / Listening 430+ / Reading 370+</p>
      <h1>今日 25 分鐘</h1>
      <p>App scaffold ready.</p>
    </div>
  </section>
`;

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./service-worker.js");
}
```

- [ ] **Step 10: Run scaffold test and commit**

Run: `npm test -- tests/scaffold.test.js`

Expected: PASS.

Commit:

```bash
git add package.json index.html manifest.webmanifest service-worker.js scripts/serve.mjs src/styles.css src/app.js tests/scaffold.test.js
git commit -m "feat: add TOEIC app scaffold"
```

---

### Task 2: Question Content Model And Seed Content

**Files:**
- Create: `src/data/questions.json`
- Create: `src/lib/content.js`
- Test: `tests/content.test.js`

**Interfaces:**
- Produces: `validateQuestionBank(bank): { valid: boolean, errors: string[] }`
- Produces: `buildDailyTask(bank, progress, dayNumber): DailyTask`
- Produces: `getQuestionById(bank, id): Question | undefined`
- Consumes: JSON question data with `vocabulary`, `grammar`, and `reading` arrays.

- [ ] **Step 1: Write content tests**

Create `tests/content.test.js`:

```js
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
```

- [ ] **Step 2: Run the failing content tests**

Run: `npm test -- tests/content.test.js`

Expected: FAIL because `src/data/questions.json` and `src/lib/content.js` do not exist.

- [ ] **Step 3: Create `src/lib/content.js`**

```js
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
    for (const field of ["prompt", "choices", "answer", "explanationZh", "explanationJa", "category"]) {
      if (!item[field]) errors.push(`${item.id} is missing ${field}`);
    }
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
```

- [ ] **Step 4: Create `src/data/questions.json`**

Create valid JSON with this exact top-level shape:

```json
{
  "vocabulary": [],
  "grammar": [],
  "reading": []
}
```

Fill it with at least:

- 70 vocabulary items with ids `v001` through `v070`
- 56 grammar questions with ids `g001` through `g056`
- 7 reading passages with ids `r001` through `r007`

Each vocabulary item must use this object shape:

```json
{
  "id": "v001",
  "word": "invoice",
  "zh": "請求書；發票",
  "ja": "請求書",
  "example": "Please send the invoice by Friday.",
  "level": 1,
  "tags": ["business", "documents"]
}
```

Each grammar item must use this object shape:

```json
{
  "id": "g001",
  "prompt": "Please ___ the form by Friday.",
  "choices": ["submit", "submitted", "submission", "submitting"],
  "answer": 0,
  "explanationZh": "Please 後面接原形動詞，所以答案是 submit。",
  "explanationJa": "please の後ろは動詞の原形です。",
  "category": "word-form",
  "level": 1,
  "tags": ["part5", "word-form"]
}
```

Each reading item must use this object shape:

```json
{
  "id": "r001",
  "passage": "Dear Mr. Tanaka, Thank you for your order. One item is currently unavailable. We expect to receive more stock next week.",
  "questions": [
    {
      "prompt": "Why was Mr. Tanaka contacted?",
      "choices": ["To confirm a meeting", "To explain an item problem", "To request payment", "To cancel an account"],
      "answer": 1,
      "explanationZh": "文章說其中一件商品目前缺貨，所以是通知商品問題。",
      "explanationJa": "商品が在庫切れのため連絡しています。"
    },
    {
      "prompt": "When is more stock expected?",
      "choices": ["Today", "Tomorrow", "Next week", "Next month"],
      "answer": 2,
      "explanationZh": "文中寫 expect to receive more stock next week。",
      "explanationJa": "next week と書かれています。"
    }
  ],
  "level": 1,
  "tags": ["reading-detail", "order-message"]
}
```

Content distribution requirements:

- Grammar categories must include `word-form`, `tense`, `preposition`, `conjunction`, `relative-pronoun`, and `comparison`.
- Reading tags must include `business-email`, `notice`, and `order-message`.
- At least 45 vocabulary items should be level 1.
- At least 36 grammar questions should be level 1.
- No question should mention real companies or real personal data.

- [ ] **Step 5: Run content tests and commit**

Run: `npm test -- tests/content.test.js`

Expected: PASS.

Commit:

```bash
git add src/data/questions.json src/lib/content.js tests/content.test.js
git commit -m "feat: add TOEIC question bank"
```

---

### Task 3: Progress, Scoring, And 7-Day Recommendation

**Files:**
- Create: `src/lib/progress.js`
- Create: `src/lib/scoring.js`
- Test: `tests/progress.test.js`
- Test: `tests/scoring.test.js`

**Interfaces:**
- Produces: `createInitialProgress(): ProgressState`
- Produces: `recordAttempt(progress, attempt): ProgressState`
- Produces: `markMistakeReview(progress, questionId, isCorrect): ProgressState`
- Produces: `saveProgress(storage, progress): boolean`
- Produces: `loadProgress(storage): ProgressState`
- Produces: `summarizeWeek(progress, weekNumber): WeeklySummary`
- Produces: `recommendDifficulty(summary): DifficultyRecommendation`

- [ ] **Step 1: Write progress tests**

Create `tests/progress.test.js`:

```js
import assert from "node:assert/strict";
import test from "node:test";
import {
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
```

- [ ] **Step 2: Write scoring tests**

Create `tests/scoring.test.js`:

```js
import assert from "node:assert/strict";
import test from "node:test";
import { createInitialProgress, recordAttempt } from "../src/lib/progress.js";
import { recommendDifficulty, summarizeWeek } from "../src/lib/scoring.js";

function progressWithAttempts(attempts) {
  return attempts.reduce((progress, attempt, index) => {
    return recordAttempt(progress, {
      questionId: `q${index}`,
      section: attempt.section,
      category: attempt.category,
      selected: attempt.isCorrect ? 0 : 1,
      correct: 0,
      isCorrect: attempt.isCorrect,
      weekNumber: 1,
      dayNumber: 1,
      answeredAt: "2026-06-25T00:00:00.000Z"
    });
  }, createInitialProgress());
}

test("summarizeWeek calculates section accuracy and weakest category", () => {
  const progress = progressWithAttempts([
    { section: "grammar", category: "word-form", isCorrect: false },
    { section: "grammar", category: "word-form", isCorrect: false },
    { section: "grammar", category: "preposition", isCorrect: true },
    { section: "vocabulary", category: "vocabulary", isCorrect: true }
  ]);
  const summary = summarizeWeek(progress, 1);
  assert.equal(summary.total, 4);
  assert.equal(summary.correct, 2);
  assert.equal(summary.accuracy, 0.5);
  assert.equal(summary.weakestCategory, "word-form");
});

test("recommendDifficulty increases level at 80 percent or more", () => {
  const recommendation = recommendDifficulty({ accuracy: 0.82, weakestCategory: "preposition" });
  assert.equal(recommendation.action, "increase");
  assert.equal(recommendation.nextDifficultyDelta, 1);
});

test("recommendDifficulty keeps level between 60 and 79 percent", () => {
  const recommendation = recommendDifficulty({ accuracy: 0.72, weakestCategory: "word-form" });
  assert.equal(recommendation.action, "keep");
  assert.equal(recommendation.focusCategory, "word-form");
});

test("recommendDifficulty reduces level below 60 percent", () => {
  const recommendation = recommendDifficulty({ accuracy: 0.41, weakestCategory: "tense" });
  assert.equal(recommendation.action, "reduce");
  assert.equal(recommendation.nextDifficultyDelta, -1);
});
```

- [ ] **Step 3: Run failing progress and scoring tests**

Run: `npm test -- tests/progress.test.js tests/scoring.test.js`

Expected: FAIL because modules do not exist.

- [ ] **Step 4: Create `src/lib/progress.js`**

```js
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
```

- [ ] **Step 5: Create `src/lib/scoring.js`**

```js
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
```

- [ ] **Step 6: Run progress and scoring tests and commit**

Run: `npm test -- tests/progress.test.js tests/scoring.test.js`

Expected: PASS.

Commit:

```bash
git add src/lib/progress.js src/lib/scoring.js tests/progress.test.js tests/scoring.test.js
git commit -m "feat: add TOEIC progress scoring"
```

---

### Task 4: Pure View Rendering

**Files:**
- Create: `src/lib/views.js`
- Test: `tests/views.test.js`

**Interfaces:**
- Consumes: `DailyTask` from `buildDailyTask`.
- Consumes: `ProgressState` from `src/lib/progress.js`.
- Produces: `renderAppShell(activeTab, bodyHtml): string`
- Produces: `renderToday(task, progress): string`
- Produces: `renderFocusQuestion(session): string`
- Produces: `renderProgress(summary, recommendation): string`
- Produces: `renderMistakes(mistakes): string`

- [ ] **Step 1: Write view tests**

Create `tests/views.test.js`:

```js
import assert from "node:assert/strict";
import test from "node:test";
import {
  renderAppShell,
  renderFocusQuestion,
  renderMistakes,
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

test("App shell marks the active tab", () => {
  const html = renderAppShell("today", "<p>Body</p>");
  assert.match(html, /aria-current="page"/);
  assert.match(html, /Body/);
});
```

- [ ] **Step 2: Run failing view tests**

Run: `npm test -- tests/views.test.js`

Expected: FAIL because `src/lib/views.js` does not exist.

- [ ] **Step 3: Create `src/lib/views.js`**

```js
function pct(value) {
  return `${Math.round((value || 0) * 100)}%`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function renderAppShell(activeTab, bodyHtml) {
  const tabs = [
    ["today", "今日"],
    ["practice", "練習"],
    ["mistakes", "錯題"],
    ["progress", "進度"]
  ];
  return `
    <section class="app-shell">
      ${bodyHtml}
    </section>
    <nav class="bottom-tabs" aria-label="Main">
      ${tabs.map(([id, label]) => `
        <button type="button" data-route="${id}" ${activeTab === id ? 'aria-current="page"' : ""}>${label}</button>
      `).join("")}
    </nav>
  `;
}

export function renderToday(task, progress) {
  return `
    <section class="today">
      <p class="eyebrow">TOEIC 800+ / Listening 430+ / Reading 370+</p>
      <h1>今日 ${task.targetMinutes} 分鐘</h1>
      <p class="muted">Week ${progress.currentWeek} · Day ${task.dayNumber}</p>
      <div class="panel task-list">
        <div><span>單字</span><strong>${task.vocabulary.length}</strong></div>
        <div><span>Part 5 文法</span><strong>${task.grammar.length}</strong></div>
        <div><span>短文閱讀</span><strong>${task.reading[0].questions.length}</strong></div>
      </div>
      <button type="button" data-action="start-focus">開始專注練習</button>
    </section>
  `;
}

export function renderFocusQuestion(session) {
  const item = session.item;
  const answeredClass = session.answered ? "has-answer" : "";
  const prompt = item.prompt || item.word || item.passage;
  const choices = item.choices || [];
  return `
    <section class="app-shell focus-screen">
      <p class="eyebrow">Focus Mode · ${session.index + 1}/${session.total}</p>
      <div class="focus-layout ${answeredClass}">
        <article class="panel">
          <h1>${escapeHtml(prompt)}</h1>
          <div class="choice-list">
            ${choices.map((choice, index) => `
              <button type="button" class="choice" data-choice-index="${index}">${String.fromCharCode(65 + index)}. ${escapeHtml(choice)}</button>
            `).join("")}
          </div>
        </article>
        ${session.answered ? `
          <aside class="panel">
            <h2>${session.isCorrect ? "正解" : "再看一次"}</h2>
            <p>${escapeHtml(session.explanationZh || "")}</p>
            <p class="muted">${escapeHtml(session.explanationJa || "")}</p>
          </aside>
        ` : ""}
      </div>
    </section>
  `;
}

export function renderProgress(summary, recommendation) {
  return `
    <section class="progress">
      <h1>7 日統計</h1>
      <div class="panel">
        <p>總正確率：<strong>${pct(summary.accuracy)}</strong></p>
        <p>最弱類型：<strong>${escapeHtml(summary.weakestCategory)}</strong></p>
        <p>${escapeHtml(recommendation.messageZh)}</p>
        <p class="muted">${escapeHtml(recommendation.messageJa)}</p>
      </div>
    </section>
  `;
}

export function renderMistakes(mistakes) {
  const active = mistakes.filter((mistake) => !mistake.mastered);
  if (active.length === 0) {
    return `<section><h1>錯題</h1><div class="panel">目前沒有錯題。</div></section>`;
  }
  return `
    <section>
      <h1>錯題</h1>
      <div class="panel">
        ${active.map((mistake) => `<button type="button" class="choice" data-review-id="${escapeHtml(mistake.questionId)}">${escapeHtml(mistake.questionId)} · ${escapeHtml(mistake.category)}</button>`).join("")}
      </div>
    </section>
  `;
}
```

- [ ] **Step 4: Add missing CSS hooks used by the views**

Append to `src/styles.css`:

```css
.eyebrow {
  margin: 0 0 8px;
  color: var(--muted);
  font-size: 13px;
}

h1 {
  margin: 0 0 12px;
  font-size: 28px;
  line-height: 1.15;
  letter-spacing: 0;
}

h2 {
  margin: 0 0 10px;
  font-size: 20px;
  letter-spacing: 0;
}

.muted {
  color: var(--muted);
}

.task-list {
  display: grid;
  gap: 8px;
  margin: 16px 0;
}

.task-list > div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.choice-list {
  display: grid;
  gap: 8px;
}
```

- [ ] **Step 5: Run view tests and commit**

Run: `npm test -- tests/views.test.js`

Expected: PASS.

Commit:

```bash
git add src/lib/views.js src/styles.css tests/views.test.js
git commit -m "feat: add TOEIC app views"
```

---

### Task 5: Browser Controller And Study Flow

**Files:**
- Modify: `src/app.js`
- Modify: `src/styles.css`
- Test: run all existing tests

**Interfaces:**
- Consumes: `buildDailyTask`, `validateQuestionBank` from `src/lib/content.js`.
- Consumes: progress and scoring helpers.
- Consumes: view renderers.
- Produces: clickable Today, Focus Practice, Practice, Mistakes, and Progress flows.

- [ ] **Step 1: Replace temporary `src/app.js` with real browser controller**

Use this controller structure:

```js
import { buildDailyTask, validateQuestionBank } from "./lib/content.js";
import { createInitialProgress, loadProgress, recordAttempt, saveProgress } from "./lib/progress.js";
import { recommendDifficulty, summarizeWeek } from "./lib/scoring.js";
import { renderAppShell, renderFocusQuestion, renderMistakes, renderProgress, renderToday } from "./lib/views.js";

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
    app.innerHTML = `<section class="app-shell"><div class="panel"><h1>題庫載入失敗</h1><p>${error.message}</p><button type="button" data-action="reload">重試</button></div></section>`;
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
    ...task.vocabulary.map((item) => ({
      ...item,
      section: "vocabulary",
      prompt: item.word,
      choices: [item.zh, "提出；提交", "予定；日程", "部署；部門"],
      answer: 0,
      category: "vocabulary",
      explanationZh: `${item.word} = ${item.zh}`,
      explanationJa: item.ja
    })),
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
  focusSession = { index: 0, items, answered: false, selected: null };
  renderFocus();
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
    focusSession = null;
    route = "progress";
    render();
    return;
  }
  focusSession = { ...focusSession, index: focusSession.index + 1, answered: false, selected: null, isCorrect: false };
  renderFocus();
}

function renderFocus() {
  const item = focusSession.items[focusSession.index];
  const html = renderFocusQuestion({
    index: focusSession.index,
    total: focusSession.items.length,
    answered: focusSession.answered,
    selected: focusSession.selected,
    isCorrect: focusSession.isCorrect,
    item,
    explanationZh: item.explanationZh,
    explanationJa: item.explanationJa
  });
  app.innerHTML = focusSession.answered ? html.replace("</aside>", `</aside><button type="button" data-action="next-question">下一題</button>`) : html;
}

function render() {
  if (!bank) return;
  if (route === "today") {
    const task = buildDailyTask(bank, progress, progress.currentDay);
    app.innerHTML = renderAppShell("today", renderToday(task, progress));
  }
  if (route === "practice") {
    app.innerHTML = renderAppShell("practice", `<section><h1>練習</h1><div class="panel"><p>今日任務以外，可以重做單字、文法、短文。</p><button type="button" data-action="start-focus">開始一組練習</button></div></section>`);
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
```

- [ ] **Step 2: Improve answer explanation layout**

Modify `src/lib/views.js` so `renderFocusQuestion` shows passage prompts with preserved line breaks:

```js
function formatPrompt(value) {
  return escapeHtml(value).replaceAll("\n", "<br>");
}
```

Change the prompt line inside `renderFocusQuestion` to:

```js
<h1>${formatPrompt(prompt)}</h1>
```

- [ ] **Step 3: Add CSS for focus completion button and text wrapping**

Append to `src/styles.css`:

```css
.focus-screen {
  padding-bottom: 24px;
}

.focus-screen h1 {
  overflow-wrap: anywhere;
}

.focus-screen > button[data-action="next-question"] {
  width: 100%;
  margin-top: 12px;
}

.today > button[data-action="start-focus"] {
  width: 100%;
}
```

- [ ] **Step 4: Run all tests and commit**

Run: `npm test`

Expected: PASS.

Commit:

```bash
git add src/app.js src/lib/views.js src/styles.css
git commit -m "feat: connect TOEIC study flow"
```

---

### Task 6: Weekly Cycle Completion And Difficulty Update

**Files:**
- Modify: `src/lib/progress.js`
- Modify: `src/app.js`
- Test: `tests/progress.test.js`

**Interfaces:**
- Produces: `completeDailyTask(progress, summary, recommendation): ProgressState`
- Consumes: `summarizeWeek` and `recommendDifficulty`.

- [ ] **Step 1: Add a failing test for daily completion**

Append to `tests/progress.test.js`:

```js
import { completeDailyTask } from "../src/lib/progress.js";

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
```

- [ ] **Step 2: Run the failing completion test**

Run: `npm test -- tests/progress.test.js`

Expected: FAIL because `completeDailyTask` does not exist.

- [ ] **Step 3: Add `completeDailyTask` to `src/lib/progress.js`**

```js
export function completeDailyTask(progress, summary, recommendation) {
  const next = structuredClone(progress);
  next.completedDailyTasks.push({
    weekNumber: progress.currentWeek,
    dayNumber: progress.currentDay,
    completedAt: new Date().toISOString()
  });
  if (progress.currentDay >= 7) {
    next.weeklySummaries.push(summary);
    next.currentWeek += 1;
    next.currentDay = 1;
    next.preferredDifficulty = Math.max(
      1,
      Math.min(3, next.preferredDifficulty + recommendation.nextDifficultyDelta)
    );
  } else {
    next.currentDay += 1;
  }
  return next;
}
```

- [ ] **Step 4: Wire completion into `src/app.js`**

Import the function:

```js
import { completeDailyTask, loadProgress, recordAttempt, saveProgress } from "./lib/progress.js";
```

Change the final branch in `nextQuestion()` to:

```js
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
```

- [ ] **Step 5: Run tests and commit**

Run: `npm test`

Expected: PASS.

Commit:

```bash
git add src/lib/progress.js src/app.js tests/progress.test.js
git commit -m "feat: advance weekly TOEIC difficulty"
```

---

### Task 7: Responsive Polish And Manual Verification

**Files:**
- Modify: `src/styles.css`
- Modify: `README.md`
- Test: manual browser checks

**Interfaces:**
- Produces: `README.md` with local run and iPhone/iPad usage instructions.
- Produces: verified iPhone-width and iPad-width layouts.

- [ ] **Step 1: Add final responsive CSS**

Append to `src/styles.css`:

```css
@media (max-width: 380px) {
  h1 {
    font-size: 24px;
  }

  .app-shell {
    padding-right: 12px;
    padding-left: 12px;
  }

  .bottom-tabs {
    padding-right: 8px;
    padding-left: 8px;
  }
}

@media (min-width: 900px) {
  .today {
    max-width: 620px;
  }

  .progress {
    max-width: 760px;
  }
}
```

- [ ] **Step 2: Create `README.md`**

```markdown
# TOEIC 800+ Focus

Small online PWA-style TOEIC study app for iPhone and iPad.

## Run Locally

```bash
npm run serve
```

Open `http://127.0.0.1:4173`.

## Study Flow

- Today: 20-30 minute task
- Focus Practice: one question at a time
- Mistakes: wrong answers saved for review
- Progress: weekly accuracy and difficulty recommendation

## Target

- TOEIC 800+
- Listening 430+
- Reading 370+

## iPhone / iPad

Open the app in Safari and use Share > Add to Home Screen.
```

- [ ] **Step 3: Run automated tests**

Run: `npm test`

Expected: PASS.

- [ ] **Step 4: Start local server**

Run: `npm run serve`

Expected output includes:

```text
TOEIC Focus app running at http://127.0.0.1:4173
```

- [ ] **Step 5: Verify in desktop/iPad width**

Use a browser at `http://127.0.0.1:4173` with width 1024 and height 768.

Check:

- Today screen is visible first.
- Target line says `TOEIC 800+ / Listening 430+ / Reading 370+`.
- Start Focus Practice opens one-question mode.
- After answering, explanation appears on the side at iPad width.
- Bottom tabs are not visible inside Focus Practice.

- [ ] **Step 6: Verify in iPhone width**

Use a browser at `http://127.0.0.1:4173` with width 390 and height 844.

Check:

- No text overlaps.
- Today button is easy to tap.
- Choice buttons are at least 44px tall.
- Focus Practice is single column.
- Progress remains saved after page refresh.

- [ ] **Step 7: Commit responsive polish**

```bash
git add src/styles.css README.md
git commit -m "docs: add TOEIC app usage notes"
```
