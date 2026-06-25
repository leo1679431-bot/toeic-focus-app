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
