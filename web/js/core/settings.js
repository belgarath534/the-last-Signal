// Player preferences, stored separately from save games so they apply
// to every save and survive starting a new game.

export const DEFAULT_SETTINGS = {
  firstRunDone: false,
  // 'screenreader': rely on VoiceOver/TalkBack/NVDA. Focus moves to new text.
  // 'selfvoice':    the game reads text and focused buttons aloud itself.
  // 'text':         no speech from the game; read the screen yourself.
  speechMode: 'screenreader',
  voiceRate: 1,
  voiceName: '',
  masterVolume: 0.8,
  ambienceVolume: 0.6,
  musicVolume: 0.45,
  explorationMusic: true,
  effectsVolume: 0.8,
  monoAudio: false,
  // How Daniel's trust changes are communicated: 'off', 'sound', 'speech'.
  trustFeedback: 'sound',
  reduceStartles: false,
  textSize: 'normal',
  highContrast: false,
  shortcuts: true,
};

const KEY = 'tls.settings';

export function createSettings(storage) {
  let values = { ...DEFAULT_SETTINGS };
  try {
    const raw = storage?.getItem(KEY);
    if (raw) values = { ...values, ...JSON.parse(raw) };
  } catch {
    /* unreadable settings: fall back to defaults */
  }

  const listeners = new Set();

  return {
    get: (k) => values[k],
    all: () => ({ ...values }),
    set(k, v) {
      values[k] = v;
      try {
        storage?.setItem(KEY, JSON.stringify(values));
      } catch {
        /* storage full or blocked: keep in memory */
      }
      for (const fn of listeners) fn(k, v);
    },
    reset() {
      const keepFirstRun = values.firstRunDone;
      values = { ...DEFAULT_SETTINGS, firstRunDone: keepFirstRun };
      try {
        storage?.setItem(KEY, JSON.stringify(values));
      } catch {
        /* ignore */
      }
      for (const fn of listeners) fn('*', null);
    },
    onChange(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}
