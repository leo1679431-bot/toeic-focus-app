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
