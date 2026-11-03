// Everything the game "says" goes through here.
//
// Two channels:
//   notify(text)  short status messages ("Game saved"). Sent to an ARIA live
//                 region, or to the native screen reader through the
//                 Capacitor ScreenReader plugin when the game runs as an
//                 iOS app (live regions are unreliable in iOS web views).
//   narrate(text) the main story text. With a screen reader the UI moves
//                 focus to the text instead (see ui/game-screen.js), so this
//                 only speaks in self-voicing mode.
//
// Self-voicing uses the browser's speech synthesis, for players who want
// the game read aloud but do not use a screen reader.

export function createAnnouncer({ settings, politeEl, assertiveEl }) {
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  let flip = false;

  const nativeScreenReader = () => window.Capacitor?.Plugins?.ScreenReader || null;

  function pickVoice() {
    if (!synth) return null;
    const name = settings.get('voiceName');
    const voices = synth.getVoices();
    return voices.find((v) => v.name === name) || voices.find((v) => v.lang?.startsWith('en')) || null;
  }

  function speak(text, { interrupt = true } = {}) {
    if (!synth || !text) return;
    if (interrupt) synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = settings.get('voiceRate');
    const voice = pickVoice();
    if (voice) u.voice = voice;
    synth.speak(u);
  }

  function toLiveRegion(text, assertive) {
    const el = assertive ? assertiveEl : politeEl;
    if (!el) return;
    // Clearing first and alternating a trailing marker makes repeated
    // identical messages get announced again.
    el.textContent = '';
    flip = !flip;
    setTimeout(() => {
      el.textContent = text + (flip ? '' : ' ');
    }, 60);
  }

  return {
    notify(text, { assertive = false } = {}) {
      const mode = settings.get('speechMode');
      if (mode === 'selfvoice') {
        speak(text, { interrupt: assertive });
        return;
      }
      const native = nativeScreenReader();
      if (mode === 'screenreader' && native?.speak) {
        native.speak({ value: text }).catch(() => toLiveRegion(text, assertive));
        return;
      }
      toLiveRegion(text, assertive);
    },

    narrate(text) {
      if (settings.get('speechMode') === 'selfvoice') speak(text);
    },

    // Self-voicing: read the control the player just moved to.
    focused(text) {
      if (settings.get('speechMode') === 'selfvoice') speak(text);
    },

    stop() {
      synth?.cancel();
    },

    voices: () => (synth ? synth.getVoices() : []),
    hasSpeechSynthesis: () => !!synth,
  };
}
