// Looping room ambience. Each room names one of these. Ambience is quiet
// on purpose: it must never cover speech from a screen reader.
// `powered` is true once emergency power is restored, which adds the
// electrical hum players learn to associate with a live building.

function every(scene, minMs, maxMs, fn) {
  let id;
  const schedule = () => {
    id = setTimeout(() => {
      fn();
      schedule();
    }, minMs + Math.random() * (maxMs - minMs));
    scene.timers.push(id);
  };
  schedule();
}

const keep = (scene, node) => node && scene.nodes.push(node);

// A recorded sound somewhere far off: random side, muffled, quiet.
function distant(api, bus, scene, names, minMs, maxMs, gain = 0.25) {
  every(scene, minMs, maxMs, () =>
    api.oneShot(names[Math.floor(Math.random() * names.length)], {
      bus, gain, lowpass: 900 + Math.random() * 800, pan: Math.random() * 1.6 - 0.8, rate: 0.85 + Math.random() * 0.2,
    }),
  );
}

// Recorded loop if it has loaded, otherwise the synthesised fallback.
function bed(api, bus, scene, sample, opts, fallback) {
  const node = api.loopSample(sample, opts, bus);
  if (node) keep(scene, node);
  else fallback();
}

function powerHum(api, bus, scene, gain, freq) {
  bed(api, bus, scene, 'amb-generator', { gain, lowpass: 900 }, () =>
    keep(scene, api.loopTone({ freq, gain: 0.012 }, bus)),
  );
}

export const SOUNDSCAPES = {
  // Inside the car the rain is muffled by the roof.
  car_rain({ api, bus, scene }) {
    bed(api, bus, scene, 'amb-rain', { gain: 0.7, lowpass: 1400 }, () => {
      keep(scene, api.loopNoise({ freq: 900, gain: 0.12 }, bus));
      keep(scene, api.loopNoise({ filter: 'bandpass', freq: 2600, Q: 0.8, gain: 0.025 }, bus));
    });
    every(scene, 6000, 14000, () => api.tone(1000, 0.12, { gain: 0.008, bus, pan: 0.6 }));
  },

  outdoor_rain({ api, bus, scene }) {
    bed(api, bus, scene, 'amb-rain', { gain: 0.6 }, () => {
      keep(scene, api.loopNoise({ freq: 3000, gain: 0.06 }, bus));
      keep(scene, api.loopNoise({ filter: 'bandpass', freq: 4500, Q: 2, gain: 0.02, pan: -0.6 }, bus));
    });
    every(scene, 9000, 20000, () =>
      api.tone(38, 2.5, { type: 'sawtooth', lowpass: 120, gain: 0.05, attack: 0.6, bus }),
    );
    distant(api, bus, scene, ['sfx-thunder'], 25000, 50000, 0.35);
  },

  lobby({ api, bus, scene, powered }) {
    bed(api, bus, scene, 'amb-facility', { gain: 0.35 }, () =>
      keep(scene, api.loopNoise({ freq: 300, gain: 0.04 }, bus)),
    );
    // Rain still audible through the front doors behind you.
    keep(scene, api.loopSample('amb-rain', { gain: 0.12, lowpass: 700 }, bus));
    if (powered) powerHum(api, bus, scene, 0.15, 60);
    // Dripping water on your left.
    every(scene, 2000, 5000, () =>
      api.tone(1800, 0.05, { slideTo: 1100, gain: 0.02, bus, pan: -0.6 }),
    );
  },

  office({ api, bus, scene, powered }) {
    distant(api, bus, scene, ['sfx-creak', 'sfx-crack'], 14000, 30000, 0.2);
    bed(api, bus, scene, 'amb-facility', { gain: 0.25, lowpass: 2000 }, () =>
      keep(scene, api.loopNoise({ freq: 250, gain: 0.03 }, bus)),
    );
    if (powered) {
      powerHum(api, bus, scene, 0.2, 120);
      keep(scene, api.loopNoise({ filter: 'highpass', freq: 6000, gain: 0.006 }, bus));
    }
  },

  corridor({ api, bus, scene, powered }) {
    distant(api, bus, scene, ['sfx-creak', 'sfx-far-clank'], 12000, 26000, 0.22);
    bed(api, bus, scene, 'amb-corridor', { gain: 0.45 }, () =>
      keep(scene, api.loopNoise({ freq: 180, gain: 0.045 }, bus)),
    );
    if (powered) powerHum(api, bus, scene, 0.12, 50);
    every(scene, 8000, 16000, () =>
      api.tone(90, 0.7, { slideTo: 70, gain: 0.03, attack: 0.2, bus, pan: Math.random() * 2 - 1 }),
    );
  },

  // Sublevel 1: the deep ambience track plus ventilation.
  sublevel({ api, bus, scene }) {
    distant(api, bus, scene, ['sfx-far-metal', 'sfx-far-clank', 'sfx-crack'], 9000, 22000, 0.25);
    bed(api, bus, scene, 'amb-sublevel', { gain: 0.3 }, () =>
      keep(scene, api.loopNoise({ freq: 160, gain: 0.05 }, bus)),
    );
    keep(scene, api.loopSample('amb-generator', { gain: 0.08, lowpass: 500 }, bus));
  },

  // The preservation lab: cold air, and Emily's monitor on the right while she is here.
  cold_lab({ api, bus, scene, state }) {
    keep(scene, api.loopNoise({ filter: 'highpass', freq: 3000, gain: 0.02 }, bus));
    bed(api, bus, scene, 'amb-corridor', { gain: 0.25, lowpass: 1200 }, () => {});
    const w = state?.ward;
    if (w?.emilyAlive && w.location === 'capsule') {
      every(scene, 1000, 1100, () => api.tone(1000, 0.07, { gain: 0.025, bus, pan: 0.6 }));
    }
  },

  // The medical ward: life support pump and monitor while Emily is here.
  ward({ api, bus, scene, state }) {
    powerHum(api, bus, scene, 0.15, 120);
    const w = state?.ward;
    if (w?.emilyAlive && w.location === 'ward') {
      every(scene, 1000, 1100, () => api.tone(1000, 0.07, { gain: 0.025, bus, pan: 0.6 }));
      every(scene, 3500, 3600, () => api.noise(1.2, { freq: 400, gain: 0.03, attack: 0.5, bus, pan: 0.6 }));
    }
  },

  transfer({ api, bus, scene }) {
    distant(api, bus, scene, ['sfx-chant'], 30000, 60000, 0.06);
    powerHum(api, bus, scene, 0.1, 100);
    every(scene, 3000, 9000, () =>
      api.noise(0.15, { filter: 'bandpass', freq: 3000, Q: 4, gain: 0.03, bus, pan: Math.random() * 2 - 1 }),
    );
  },

  storage({ api, bus, scene }) {
    distant(api, bus, scene, ['sfx-far-clank', 'sfx-creak'], 15000, 30000, 0.2);
    keep(scene, api.loopNoise({ freq: 200, gain: 0.025 }, bus));
    every(scene, 4000, 8000, () => api.tone(2400, 0.02, { gain: 0.01, bus, pan: 0.6 }));
  },

  // Sublevel 2: warm, everything still running.
  b2({ api, bus, scene }) {
    distant(api, bus, scene, ['sfx-far-metal', 'sfx-far-clank'], 15000, 30000, 0.2);
    powerHum(api, bus, scene, 0.3, 60);
    bed(api, bus, scene, 'amb-sublevel', { gain: 0.18, lowpass: 900 }, () => {});
    keep(scene, api.loopNoise({ freq: 350, gain: 0.03 }, bus));
  },

  b2_quiet({ api, bus, scene }) {
    powerHum(api, bus, scene, 0.1, 60);
    keep(scene, api.loopTone({ freq: 120, gain: 0.004 }, bus)); // the lamp
  },

  b2_screens({ api, bus, scene }) {
    powerHum(api, bus, scene, 0.15, 60);
    keep(scene, api.loopNoise({ filter: 'highpass', freq: 5000, gain: 0.008 }, bus));
    every(scene, 2000, 4000, () => api.tone(3000, 0.01, { gain: 0.006, bus, pan: Math.random() - 0.5 }));
  },

  // Daniel's body: a ventilator and a slow, low heart monitor, straight ahead.
  containment({ api, bus, scene }) {
    powerHum(api, bus, scene, 0.15, 60);
    every(scene, 1400, 1450, () => api.tone(700, 0.08, { gain: 0.025, bus }));
    every(scene, 4000, 4100, () => api.noise(1.6, { freq: 500, gain: 0.04, attack: 0.7, bus }));
  },

  // The stairwell: hollow concrete, and Daniel's whir behind the isolation door.
  stairwell({ api, bus, scene }) {
    distant(api, bus, scene, ['sfx-creak', 'sfx-crack', 'sfx-far-clank'], 10000, 22000, 0.25);
    bed(api, bus, scene, 'amb-corridor', { gain: 0.3, lowpass: 800 }, () => keep(scene, api.loopNoise({ freq: 150, gain: 0.04 }, bus)));
    every(scene, 5000, 9000, () => api.tone(420, 1.2, { slideTo: 380, type: 'sawtooth', lowpass: 700, gain: 0.012, attack: 0.3, bus }));
  },

  // Isolation: Daniel's own body, close. Its whir slows like breathing.
  isolation({ api, bus, scene }) {
    keep(scene, api.loopNoise({ freq: 120, gain: 0.02 }, bus));
    keep(scene, api.loopTone({ freq: 210, type: 'sawtooth', gain: 0.004 }, bus));
    every(scene, 6000, 6100, () => {
      [0, 0.25, 0.5].forEach((t) => api.tone(1000, 0.1, { gain: 0.012, at: t, bus }));
      api.tone(1000, 0.5, { gain: 0.012, at: 0.85, bus });
    });
  },

  // Part Two: the city.
  apartment({ api, bus, scene }) {
    bed(api, bus, scene, 'amb-rain', { gain: 0.25, lowpass: 900 }, () => {});
    keep(scene, api.loopTone({ freq: 100, gain: 0.006 }, bus)); // the fridge
  },

  station({ api, bus, scene }) {
    keep(scene, api.loopTone({ freq: 120, gain: 0.006 }, bus)); // fluorescent buzz
    keep(scene, api.loopNoise({ freq: 600, gain: 0.015 }, bus));
    every(scene, 7000, 15000, () => [0, 0.4].forEach((t) => api.tone(1400, 0.25, { gain: 0.01, at: t, bus, pan: 0.7 })));
  },

  cell({ api, bus, scene }) {
    keep(scene, api.loopNoise({ freq: 150, gain: 0.02 }, bus));
    every(scene, 2500, 4000, () => api.tone(1500, 0.05, { slideTo: 1000, gain: 0.015, bus, pan: 0.5 }));
  },

  street({ api, bus, scene }) {
    distant(api, bus, scene, ['sfx-thunder'], 30000, 60000, 0.25);
    bed(api, bus, scene, 'amb-rain', { gain: 0.45 }, () => keep(scene, api.loopNoise({ freq: 2500, gain: 0.04 }, bus)));
    every(scene, 3000, 7000, () => api.noise(1.5, { freq: 700, sweepTo: 300, gain: 0.03, attack: 0.5, bus, pan: Math.random() * 2 - 1 }));
  },

  office_city({ api, bus, scene }) {
    keep(scene, api.loopNoise({ freq: 90, gain: 0.03 }, bus)); // laundromat below
    bed(api, bus, scene, 'amb-rain', { gain: 0.1, lowpass: 600 }, () => {});
  },

  cafe({ api, bus, scene }) {
    keep(scene, api.loopNoise({ filter: 'bandpass', freq: 900, Q: 0.6, gain: 0.03 }, bus)); // chatter
    every(scene, 3000, 8000, () => api.tone(2200, 0.04, { gain: 0.01, bus, pan: Math.random() - 0.5 })); // cups
    every(scene, 15000, 25000, () => api.noise(2, { filter: 'highpass', freq: 3000, gain: 0.02, attack: 0.3, bus, pan: -0.6 })); // espresso
  },

  diner({ api, bus, scene }) {
    keep(scene, api.loopNoise({ filter: 'bandpass', freq: 3500, Q: 0.8, gain: 0.012, pan: 0.4 }, bus)); // grill
    keep(scene, api.loopNoise({ filter: 'bandpass', freq: 800, Q: 0.6, gain: 0.02 }, bus));
  },

  courtroom({ api, bus, scene }) {
    keep(scene, api.loopNoise({ freq: 400, gain: 0.02 }, bus)); // air conditioning
    keep(scene, api.loopNoise({ filter: 'highpass', freq: 5000, gain: 0.004 }, bus)); // speakers hissing
    every(scene, 6000, 14000, () => api.noise(0.2, { filter: 'bandpass', freq: 1200, gain: 0.02, bus, pan: 0.6 })); // a cough, jury side
  },

  hallway({ api, bus, scene }) {
    keep(scene, api.loopNoise({ freq: 700, gain: 0.015 }, bus));
    every(scene, 1500, 4000, () => api.tone(2600, 0.03, { gain: 0.008, bus, pan: Math.random() * 2 - 1 })); // heels on marble
  },

  // The basement evidence room: Voss is in the terminal's speaker.
  evidence({ api, bus, scene }) {
    keep(scene, api.loopTone({ freq: 120, gain: 0.006 }, bus));
    keep(scene, api.loopNoise({ filter: 'highpass', freq: 4000, gain: 0.006 }, bus));
    every(scene, 5000, 5100, () => api.noise(1.4, { freq: 600, gain: 0.015, attack: 0.6, bus })); // breathing it does not need
  },

  // The heart of the network: thousands of relays, and Voss all around you.
  switching({ api, bus, scene }) {
    distant(api, bus, scene, ['sfx-chant'], 12000, 25000, 0.1);
    powerHum(api, bus, scene, 0.2, 60);
    every(scene, 80, 300, () => api.noise(0.02, { filter: 'highpass', freq: 3000, gain: 0.012, bus, pan: Math.random() * 2 - 1 }));
    every(scene, 6000, 6100, () => api.noise(1.4, { freq: 600, gain: 0.02, attack: 0.6, bus }));
  },

  elevator({ api, bus, scene }) {
    powerHum(api, bus, scene, 0.3, 70);
    keep(scene, api.loopNoise({ freq: 400, gain: 0.03 }, bus));
  },
};
