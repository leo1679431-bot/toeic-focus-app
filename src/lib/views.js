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

function answerLabel(index, choices) {
  if (!Number.isInteger(index) || !choices[index]) return "";
  return `${String.fromCharCode(65 + index)}. ${choices[index]}`;
}

function normalizeReason(reason) {
  if (!reason) return { zh: "", ja: "" };
  if (typeof reason === "string") return { zh: reason, ja: "" };
  return {
    zh: reason.zh || "",
    ja: reason.ja || ""
  };
}

function getChoiceReason(item, index) {
  const reasons = Array.isArray(item.choiceExplanations) ? item.choiceExplanations : [];
  const reason = normalizeReason(reasons[index]);
  if (reason.zh || reason.ja) return reason;
  if (index === item.answer) {
    return {
      zh: item.explanationZh || "呢個選項符合句子或文章內容。",
      ja: item.explanationJa || "この選択肢が文脈に合います。"
    };
  }
  return {
    zh: "呢個選項不符合句子或文章內容。",
    ja: "この選択肢は文脈に合いません。"
  };
}

function choiceClass(session, index) {
  const classes = ["choice"];
  if (session.selected === index) classes.push("is-selected");
  if (session.answered && session.item.answer === index) classes.push("is-correct");
  if (session.answered && session.selected === index && session.selected !== session.item.answer) {
    classes.push("is-wrong");
  }
  return classes.join(" ");
}

function renderPartsOfSpeech(item) {
  if (!Array.isArray(item.partsOfSpeech) || item.partsOfSpeech.length === 0) return "";
  return `
    <div class="pos-list" aria-label="Part of speech">
      ${item.partsOfSpeech.map((entry) => `
        <p><span class="pos-badge">${escapeHtml(entry.part)}</span><span>${escapeHtml(entry.zh)} / ${escapeHtml(entry.ja)}</span></p>
      `).join("")}
    </div>
  `;
}

function renderWordFamily(item) {
  if (!Array.isArray(item.wordFamily) || item.wordFamily.length === 0) return "";
  return `
    <div class="word-family" aria-label="Word family">
      <p class="word-family-title">Word family</p>
      ${item.wordFamily.map((entry) => `
        <div class="word-family-row">
          <span class="pos-badge">${escapeHtml(entry.part)}</span>
          <strong>${escapeHtml(entry.form)}</strong>
          <span>${escapeHtml(entry.zh)} / ${escapeHtml(entry.ja)}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function renderPronunciationButton(item) {
  if (item.section !== "vocabulary" || !item.word) return "";
  return `<button type="button" class="speak-button secondary" data-action="speak-word" data-word="${escapeHtml(item.word)}">聽讀音</button>`;
}

function renderAnswerReason(session, choices) {
  const item = session.item;
  const selectedAnswer = answerLabel(session.selected, choices);
  const correctReason = getChoiceReason(item, item.answer);
  const selectedReason = getChoiceReason(item, session.selected);
  const title = session.isCorrect ? "解題重點" : "點解錯";
  const body = session.isCorrect ? correctReason : selectedReason;
  const selectedLine = !session.isCorrect && selectedAnswer
    ? `<p class="selected-answer-line">你揀咗：${escapeHtml(selectedAnswer)}</p>`
    : "";
  return `
    <div class="answer-reason ${session.isCorrect ? "is-correct" : "is-wrong"}">
      <p class="answer-reason-title">${title}</p>
      ${selectedLine}
      <p>${escapeHtml(body.zh)}</p>
      ${body.ja ? `<p class="muted">${escapeHtml(body.ja)}</p>` : ""}
    </div>
  `;
}

function renderOptionReasons(session, choices) {
  const item = session.item;
  if (!Array.isArray(choices) || choices.length === 0) return "";
  return `
    <div class="option-reasons" aria-label="Choice explanations">
      <p class="option-reasons-title">每個選項點解啱／唔啱</p>
      ${choices.map((choice, index) => {
        const reason = getChoiceReason(item, index);
        const isCorrect = index === item.answer;
        const isSelectedWrong = session.selected === index && !session.isCorrect;
        const stateLabel = isCorrect ? "正解" : isSelectedWrong ? "你揀咗" : "不適合";
        const rowClasses = ["option-reason-row"];
        if (isCorrect) rowClasses.push("is-correct");
        if (isSelectedWrong) rowClasses.push("is-selected-wrong");
        return `
          <div class="${rowClasses.join(" ")}">
            <div class="option-reason-head">
              <strong>${String.fromCharCode(65 + index)}</strong>
              <span>${escapeHtml(choice)}</span>
              <em>${stateLabel}</em>
            </div>
            <p>${escapeHtml(reason.zh)}</p>
            ${reason.ja ? `<p class="muted">${escapeHtml(reason.ja)}</p>` : ""}
          </div>
        `;
      }).join("")}
    </div>
  `;
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
  const correctAnswer = answerLabel(item.answer, choices);
  const keyAnswer = item.section === "vocabulary" ? item.word : choices[item.answer] || item.word || "";
  return `
    <section class="app-shell focus-screen">
      <p class="eyebrow">Focus Mode · ${session.index + 1}/${session.total}</p>
      <div class="focus-layout ${answeredClass}">
        <article class="panel">
          <h1>${formatPrompt(prompt)}</h1>
          <div class="choice-list">
            ${choices.map((choice, index) => `
              <button type="button" class="${choiceClass(session, index)}" data-choice-index="${index}">${String.fromCharCode(65 + index)}. ${escapeHtml(choice)}</button>
            `).join("")}
          </div>
        </article>
        ${session.answered ? `
          <aside class="panel">
            <h2>${session.isCorrect ? "正解" : "不正解"}</h2>
            <p class="correct-answer-line">正解：${escapeHtml(correctAnswer)}</p>
            <p class="answer-key">${escapeHtml(keyAnswer)}</p>
            ${renderPronunciationButton(item)}
            ${renderPartsOfSpeech(item)}
            ${renderWordFamily(item)}
            ${renderAnswerReason(session, choices)}
            ${renderOptionReasons(session, choices)}
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
