import assert from "node:assert/strict";
import test from "node:test";
import {
  canUseSpeech,
  createWordUtterance,
  pickEnglishVoice,
  speakEnglishWord
} from "../src/lib/speech.js";

class FakeUtterance {
  constructor(text) {
    this.text = text;
  }
}

test("pickEnglishVoice prefers en-US voices", () => {
  const voices = [
    { name: "Japanese", lang: "ja-JP" },
    { name: "English UK", lang: "en-GB" },
    { name: "English US", lang: "en-US" }
  ];
  assert.equal(pickEnglishVoice(voices).name, "English US");
});

test("createWordUtterance configures English pronunciation settings", () => {
  const voice = { name: "English US", lang: "en-US" };
  const utterance = createWordUtterance("invoice", FakeUtterance, voice);
  assert.equal(utterance.text, "invoice");
  assert.equal(utterance.lang, "en-US");
  assert.equal(utterance.rate, 0.85);
  assert.equal(utterance.voice, voice);
});

test("speakEnglishWord triggers speech synthesis with status updates", () => {
  const spoken = [];
  const statuses = [];
  const env = {
    SpeechSynthesisUtterance: FakeUtterance,
    speechSynthesis: {
      speaking: false,
      getVoices: () => [{ name: "English US", lang: "en-US" }],
      cancel: () => spoken.push("cancel"),
      speak: (utterance) => {
        spoken.push(utterance);
        utterance.onstart();
        utterance.onend();
      }
    },
    setTimeout: () => 0
  };
  const result = speakEnglishWord("invoice", env, { onStatus: (status) => statuses.push(status) });
  assert.equal(result.ok, true);
  assert.equal(spoken[0], "cancel");
  assert.equal(spoken[1].text, "invoice");
  assert.deepEqual(statuses, ["loading", "playing", "ended"]);
});

test("speakEnglishWord retries once when no playback starts", () => {
  const spoken = [];
  const callbacks = [];
  const env = {
    SpeechSynthesisUtterance: FakeUtterance,
    speechSynthesis: {
      speaking: false,
      getVoices: () => [],
      cancel: () => {},
      speak: (utterance) => spoken.push(utterance)
    },
    setTimeout: (callback) => {
      callbacks.push(callback);
      return callbacks.length;
    }
  };
  const result = speakEnglishWord("invoice", env);
  callbacks[0]();
  assert.equal(result.ok, true);
  assert.equal(spoken.length, 2);
});

test("speakEnglishWord reports unsupported browsers", () => {
  const statuses = [];
  const env = {};
  assert.equal(canUseSpeech(env), false);
  const result = speakEnglishWord("invoice", env, { onStatus: (status) => statuses.push(status) });
  assert.deepEqual(result, { ok: false, reason: "unsupported" });
  assert.deepEqual(statuses, ["unsupported"]);
});
