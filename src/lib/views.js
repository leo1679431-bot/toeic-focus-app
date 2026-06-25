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

function formatPrompt(value) {
  return escapeHtml(value).replaceAll("\n", "<br>");
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

export function renderPractice() {
  return `
    <section>
      <h1>練習</h1>
      <div class="practice-grid">
        <button type="button" class="panel practice-card" data-action="start-focus">單字</button>
        <button type="button" class="panel practice-card" data-action="start-focus">Part 5 文法</button>
        <button type="button" class="panel practice-card" data-action="start-focus">短文閱讀</button>
      </div>
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
          <h1>${formatPrompt(prompt)}</h1>
          <div class="choice-list">
            ${choices.map((choice, index) => `
              <button type="button" class="choice ${session.selected === index ? "is-selected" : ""}" data-choice-index="${index}">${String.fromCharCode(65 + index)}. ${escapeHtml(choice)}</button>
            `).join("")}
          </div>
        </article>
        ${session.answered ? `
          <aside class="panel">
            <h2>${session.isCorrect ? "正解" : "再看一次"}</h2>
            <p>${escapeHtml(session.explanationZh || "")}</p>
            <p class="muted">${escapeHtml(session.explanationJa || "")}</p>
            <p class="tag">${escapeHtml(item.category || item.section)}</p>
          </aside>
        ` : ""}
      </div>
      ${session.answered ? '<button type="button" data-action="next-question">下一題</button>' : ""}
    </section>
  `;
}

export function renderProgress(summary, recommendation) {
  return `
    <section class="progress">
      <h1>7 日統計</h1>
      <div class="panel stat-panel">
        <p>總正確率：<strong>${pct(summary.accuracy)}</strong></p>
        <p>單字：${pct(summary.sectionAccuracy.vocabulary)}</p>
        <p>文法：${pct(summary.sectionAccuracy.grammar)}</p>
        <p>閱讀：${pct(summary.sectionAccuracy.reading)}</p>
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
      <div class="panel mistake-list">
        ${active.map((mistake) => `<button type="button" class="choice" data-review-id="${escapeHtml(mistake.questionId)}">${escapeHtml(mistake.questionId)} · ${escapeHtml(mistake.category)}</button>`).join("")}
      </div>
    </section>
  `;
}
