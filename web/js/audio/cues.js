// The game's sound vocabulary. Each cue is short and distinct so blind
// players can learn what it means: UI sounds are high and clean, world
// sounds are filtered noise, story sounds (the signal, trust) are tonal.
// `o.pan` (-1 left .. 1 right) places a sound in space.

const softer = (a, v) => (a.reduceStartles() ? v * 0.4 : v);

export const CUES = {
  // ---- interface ---------------------------------------------------------
  'ui.move': (a, o) => a.tone(1100, 0.03, { gain: 0.05, pan: o.pan }),
  'ui.select': (a) => {
    a.tone(660, 0.05, { gain: 0.08 });
    a.tone(990, 0.06, { gain: 0.08, at: 0.05 });
  },
  'ui.back': (a) => a.tone(700, 0.12, { gain: 0.07, slideTo: 440 }),
  'ui.error': (a) => {
    a.tone(220, 0.08, { type: 'square', gain: 0.04, lowpass: 900 });
    a.tone(196, 0.12, { type: 'square', gain: 0.04, lowpass: 900, at: 0.1 });
  },
  saved: (a) => {
    a.tone(784, 0.07, { gain: 0.06 });
    a.tone(1047, 0.1, { gain: 0.06, at: 0.08 });
  },

  // ---- world -------------------------------------------------------------
  door: (a, o) => {
    a.noise(0.3, { freq: 500, gain: 0.12, pan: o.pan });
    a.tone(80, 0.15, { gain: 0.15, pan: o.pan, at: 0.22 });
  },
  'door.glass': (a, o) => {
    a.noise(0.35, { filter: 'highpass', freq: 2500, gain: 0.05, pan: o.pan });
    a.tone(1250, 0.25, { gain: 0.02, pan: o.pan });
    a.tone(90, 0.12, { gain: 0.1, pan: o.pan, at: 0.3 });
  },
  'car.door': (a) => {
    a.noise(0.15, { freq: 350, gain: 0.2 });
    a.tone(60, 0.18, { gain: 0.25, at: 0.05 });
  },
  footsteps: (a, o) => {
    for (let i = 0; i < 4; i++) a.noise(0.08, { freq: 600, gain: 0.12, pan: o.pan, at: i * 0.32 });
  },
  locked: (a, o) => {
    a.noise(0.06, { filter: 'bandpass', freq: 900, Q: 3, gain: 0.15, pan: o.pan });
    a.noise(0.06, { filter: 'bandpass', freq: 800, Q: 3, gain: 0.15, pan: o.pan, at: 0.12 });
    a.tone(110, 0.1, { gain: 0.1, pan: o.pan, at: 0.12 });
  },
  latch: (a, o) => {
    a.noise(0.05, { filter: 'highpass', freq: 3000, gain: 0.1, pan: o.pan });
    a.tone(300, 0.05, { gain: 0.06, pan: o.pan, at: 0.04 });
  },
  pickup: (a) => a.tone(520, 0.14, { gain: 0.08, slideTo: 780 }),
  document: (a) => {
    a.noise(0.12, { filter: 'bandpass', freq: 3200, Q: 1.5, gain: 0.06 });
    a.noise(0.1, { filter: 'bandpass', freq: 2600, Q: 1.5, gain: 0.05, at: 0.15 });
  },
  locker: (a, o) => {
    a.noise(0.6, { filter: 'bandpass', freq: 1200, sweepTo: 2600, Q: 6, gain: softer(a, 0.12), pan: o.pan });
    a.tone(70, 0.2, { gain: softer(a, 0.2), pan: o.pan, at: 0.55 });
  },
  tape: (a, o) => {
    a.tone(1900, 0.5, { gain: 0.015, pan: o.pan });
    a.noise(0.6, { freq: 400, gain: 0.04, pan: o.pan });
  },
  'card.accept': (a, o) => {
    a.tone(1320, 0.08, { gain: 0.07, pan: o.pan });
    a.tone(1760, 0.14, { gain: 0.07, pan: o.pan, at: 0.09 });
  },
  'elevator.open': (a) => {
    a.tone(523, 0.6, { gain: 0.05 });
    a.noise(0.9, { freq: 300, gain: 0.06, at: 0.2 });
  },
  listen: (a) => a.tone(220, 0.4, { gain: 0.02, attack: 0.15 }),
  'power.on': (a) => {
    a.tone(40, 1.8, { type: 'sawtooth', slideTo: 120, lowpass: 400, gain: softer(a, 0.18), attack: 0.4 });
    a.tone(55, 0.3, { gain: softer(a, 0.3), at: 1.7 });
  },
  'deep.machine': (a) => {
    a.tone(45, 1.2, { type: 'sawtooth', lowpass: 200, gain: 0.12, attack: 0.3, slideTo: 52 });
    a.tone(45, 0.9, { type: 'sawtooth', lowpass: 200, gain: 0.1, attack: 0.3, at: 1.6, slideTo: 40 });
  },

  // ---- voices and radio --------------------------------------------------
  'radio.on': (a) => {
    a.tone(1400, 0.06, { gain: 0.05 });
    a.noise(0.25, { filter: 'bandpass', freq: 1800, gain: 0.05, at: 0.05 });
  },
  'radio.static': (a) => {
    a.noise(0.35, { filter: 'bandpass', freq: 1800, Q: 1, gain: 0.06 });
    a.tone(1450, 0.06, { gain: 0.035, at: 0.35 });
  },
  'speaker.hum': (a) => {
    a.noise(0.15, { filter: 'bandpass', freq: 900, gain: softer(a, 0.12) });
    a.tone(60, 0.8, { gain: softer(a, 0.08), attack: 0.1 });
    a.tone(120, 0.8, { gain: softer(a, 0.04), attack: 0.1 });
  },

  // ---- story -------------------------------------------------------------
  // The signal motif: three short, one long.
  signal: (a) => {
    for (let i = 0; i < 3; i++) a.tone(1000, 0.12, { gain: 0.05, at: i * 0.22 });
    a.tone(1000, 0.6, { gain: 0.05, at: 0.75 });
  },
  objective: (a) => {
    a.tone(523, 0.12, { gain: 0.05 });
    a.tone(659, 0.18, { gain: 0.05, at: 0.12 });
  },
  'objective.done': (a) => {
    a.tone(523, 0.1, { gain: 0.05 });
    a.tone(659, 0.1, { gain: 0.05, at: 0.1 });
    a.tone(784, 0.25, { gain: 0.05, at: 0.2 });
  },
  'trust.up': (a) => {
    a.tone(440, 0.25, { gain: 0.04, attack: 0.05 });
    a.tone(554, 0.35, { gain: 0.04, attack: 0.05, at: 0.18 });
  },
  'trust.down': (a) => {
    a.tone(330, 0.3, { gain: 0.045, attack: 0.05 });
    a.tone(311, 0.45, { gain: 0.045, attack: 0.05, at: 0.2 });
  },
  secret: (a) => {
    [784, 988, 1175].forEach((f, i) => a.tone(f, 0.15, { gain: 0.04, at: i * 0.09 }));
  },
  'door.heavy': (a, o) => {
    a.noise(0.6, { freq: 300, gain: 0.12, pan: o.pan, attack: 0.1 });
    a.tone(55, 0.3, { gain: 0.18, pan: o.pan, at: 0.5 });
  },
  cart: (a) => {
    for (let i = 0; i < 6; i++) a.noise(0.25, { filter: 'bandpass', freq: 700, Q: 2, gain: 0.05, at: i * 0.3 });
  },
  tarp: (a, o) => a.noise(0.5, { filter: 'bandpass', freq: 1500, Q: 0.8, gain: 0.05, pan: o.pan, attack: 0.1 }),

  // ---- Emily's monitor ---------------------------------------------------
  monitor: (a, o) => {
    a.tone(1000, 0.08, { gain: 0.04, pan: o.pan });
    a.tone(1000, 0.08, { gain: 0.04, pan: o.pan, at: 1 });
  },
  alarm: (a) => {
    [880, 660, 880, 660].forEach((f, i) => a.tone(f, 0.15, { type: 'triangle', gain: 0.06, at: i * 0.18 }));
  },
  'alarm.critical': (a) => {
    for (let i = 0; i < 6; i++) a.tone(1200, 0.08, { type: 'square', lowpass: 2500, gain: softer(a, 0.05), at: i * 0.12 });
  },
  flatline: (a) => a.tone(1000, 3, { gain: 0.05, attack: 0.01 }),

  // ---- Prototype 001 -----------------------------------------------------
  'footsteps.heavy': (a, o) => {
    for (let i = 0; i < 3; i++) {
      a.tone(55, 0.18, { gain: softer(a, 0.22), pan: o.pan, at: i * 0.55 });
      a.noise(0.12, { freq: 400, gain: softer(a, 0.1), pan: o.pan, at: i * 0.55 });
      a.tone(420, 0.2, { slideTo: 380, type: 'sawtooth', lowpass: 900, gain: 0.015, pan: o.pan, at: i * 0.55 + 0.1 });
    }
  },
  'footsteps.far': (a, o) => {
    for (let i = 0; i < 3; i++) a.tone(50, 0.15, { gain: 0.07, pan: o.pan, lowpass: 200, at: i * 0.6 });
  },
  hit: (a) => {
    a.noise(0.25, { freq: 900, gain: softer(a, 0.3) });
    a.tone(70, 0.4, { gain: softer(a, 0.3) });
  },

  'chapter.end': (a) => {
    a.tone(55, 3, { type: 'sawtooth', lowpass: 300, gain: 0.12, attack: 0.8 });
    [392, 349, 311].forEach((f, i) => a.tone(f, 0.7, { gain: 0.04, attack: 0.1, at: 0.6 + i * 0.6 }));
  },
};
