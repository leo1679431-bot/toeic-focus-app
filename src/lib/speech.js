export const speechButtonLabels = {
  ready: "聽讀音",
  loading: "播放中...",
  unsupported: "不支援讀音",
  error: "播放失敗，再按一次"
};

export function canUseSpeech(env = globalThis) {
  return Boolean(env?.speechSynthesis && env?.SpeechSynthesisUtterance);
}

export function pickEnglishVoice(voices = []) {
  const normalized = voices.filter((voice) => typeof voice?.lang === "string");
  return normalized.find((voice) => voice.lang.toLowerCase() === "en-us")
    || normalized.find((voice) => voice.lang.toLowerCase().startsWith("en-"))
    || normalized.find((voice) => voice.lang.toLowerCase().startsWith("en"))
    || null;
}

export function createWordUtterance(word, UtteranceCtor, voice = null) {
  const utterance = new UtteranceCtor(word);
  utterance.lang = "en-US";
  utterance.rate = 0.85;
  utterance.pitch = 1;
  if (voice) utterance.voice = voice;
  return utterance;
}

export function primeSpeechSynthesis(env = globalThis) {
  if (!canUseSpeech(env)) return false;
  const synthesis = env.speechSynthesis;
  try {
    synthesis.getVoices?.();
    if (typeof synthesis.addEventListener === "function") {
      synthesis.addEventListener("voiceschanged", () => synthesis.getVoices?.(), { once: true });
    } else if ("onvoiceschanged" in synthesis && !synthesis.onvoiceschanged) {
      synthesis.onvoiceschanged = () => synthesis.getVoices?.();
    }
    return true;
  } catch {
    return false;
  }
}

export function speakEnglishWord(word, env = globalThis, options = {}) {
  const {
    onStatus = () => {},
    retryDelayMs = 250,
    maxPlaybackMs = 2400
  } = options;

  if (!word) return { ok: false, reason: "missing-word" };
  if (!canUseSpeech(env)) {
    onStatus("unsupported");
    return { ok: false, reason: "unsupported" };
  }

  const synthesis = env.speechSynthesis;
  let started = false;
  let finished = false;
  let lastUtterance = null;

  const getVoices = () => {
    try {
      return typeof synthesis.getVoices === "function" ? synthesis.getVoices() : [];
    } catch {
      return [];
    }
  };

  const speakOnce = () => {
    const utterance = createWordUtterance(
      word,
      env.SpeechSynthesisUtterance,
      pickEnglishVoice(getVoices())
    );
    utterance.onstart = () => {
      started = true;
      onStatus("playing");
    };
    utterance.onend = () => {
      finished = true;
      onStatus("ended");
    };
    utterance.onerror = () => {
      finished = true;
      onStatus("error");
    };
    synthesis.cancel?.();
    synthesis.speak(utterance);
    lastUtterance = utterance;
    return utterance;
  };

  try {
    onStatus("loading");
    speakOnce();
  } catch {
    onStatus("error");
    return { ok: false, reason: "speak-failed" };
  }

  env.setTimeout?.(() => {
    if (!started && !finished && !synthesis.speaking) {
      try {
        speakOnce();
      } catch {
        finished = true;
        onStatus("error");
      }
    }
  }, retryDelayMs);

  env.setTimeout?.(() => {
    if (!finished) {
      finished = true;
      onStatus(started ? "ended" : "error");
    }
  }, maxPlaybackMs);

  return { ok: true, utterance: lastUtterance };
}
