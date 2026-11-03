// Audio engine. Two layers:
//   1. Procedural sounds synthesised with the Web Audio API. These always
//      work, even offline or before any file has loaded.
//   2. Recorded files (see library.js). Once loaded, a recording replaces
//      the synthesised cue of the same name, and room ambience switches to
//      recorded loops. Missing or failed files just fall back to layer 1.
//
// Spatial rule used everywhere: things on your left play in the left ear,
// things on your right in the right ear, things ahead in the centre.
// "Mono audio" setting collapses everything to the centre.

import { CUES } from './cues.js';
import { SOUNDSCAPES } from './soundscapes.js';
import { SAMPLE_FILES, MUSIC_FILES, CUE_SAMPLES, STARTLING } from './library.js';

export function createAudio({ settings }) {
  let ac = null;
  let master, sfxBus, ambBus, musicBus;
  let music = null; // { name, src, gain }
  let libraryLoading = null;
  let noiseBuffer = null;
  let current = null; // { id, powered, nodes: [], timers: [], gain }
  const samples = new Map();

  function ensure() {
    if (ac) return ac;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ac = new AC();
    master = ac.createGain();
    sfxBus = ac.createGain();
    ambBus = ac.createGain();
    musicBus = ac.createGain();
    sfxBus.connect(master);
    ambBus.connect(master);
    musicBus.connect(master);
    master.connect(ac.destination);
    noiseBuffer = makeNoise(ac, 3);
    applyVolumes();
    return ac;
  }

  function makeNoise(ctx, seconds) {
    const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  function applyVolumes() {
    if (!ac) return;
    master.gain.value = settings.get('masterVolume');
    sfxBus.gain.value = settings.get('effectsVolume');
    ambBus.gain.value = settings.get('ambienceVolume');
    musicBus.gain.value = settings.get('musicVolume') ?? 0.45;
  }

  function panner(pan = 0) {
    const p = settings.get('monoAudio') ? 0 : pan;
    if (ac.createStereoPanner) {
      const node = ac.createStereoPanner();
      node.pan.value = Math.max(-1, Math.min(1, p));
      return node;
    }
    return ac.createGain();
  }

  // ---- building blocks shared by cues and soundscapes -------------------
  const api = {
    get ctx() {
      return ac;
    },
    get now() {
      return ac.currentTime;
    },
    reduceStartles: () => settings.get('reduceStartles'),

    tone(freq, dur, o = {}) {
      const t = ac.currentTime + (o.at || 0);
      const osc = ac.createOscillator();
      osc.type = o.type || 'sine';
      osc.frequency.setValueAtTime(freq, t);
      if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(o.slideTo, t + dur);
      const env = envelope(t, dur, o);
      let out = osc;
      if (o.lowpass) {
        const f = ac.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.value = o.lowpass;
        osc.connect(f);
        out = f;
      }
      out.connect(env.input);
      env.output.connect(o.bus || sfxBus);
      osc.start(t);
      osc.stop(t + dur + 0.05);
      return osc;
    },

    noise(dur, o = {}) {
      const t = ac.currentTime + (o.at || 0);
      const src = ac.createBufferSource();
      src.buffer = noiseBuffer;
      src.loop = true;
      const f = ac.createBiquadFilter();
      f.type = o.filter || 'lowpass';
      f.frequency.setValueAtTime(o.freq || 1000, t);
      if (o.sweepTo) f.frequency.exponentialRampToValueAtTime(o.sweepTo, t + dur);
      f.Q.value = o.Q || 0.7;
      const env = envelope(t, dur, o);
      src.connect(f);
      f.connect(env.input);
      env.output.connect(o.bus || sfxBus);
      src.start(t, Math.random() * 2);
      src.stop(t + dur + 0.05);
      return src;
    },

    // Continuous layers for ambience; returned nodes are stopped on fade-out.
    loopNoise(o, bus) {
      const src = ac.createBufferSource();
      src.buffer = noiseBuffer;
      src.loop = true;
      const f = ac.createBiquadFilter();
      f.type = o.filter || 'lowpass';
      f.frequency.value = o.freq || 500;
      f.Q.value = o.Q || 0.7;
      const g = ac.createGain();
      g.gain.value = o.gain || 0.05;
      const p = panner(o.pan || 0);
      src.connect(f);
      f.connect(g);
      g.connect(p);
      p.connect(bus);
      src.start(0, Math.random() * 2);
      return src;
    },

    hasSample: (name) => samples.has(name),

    // A recorded one-shot inside a soundscape (a distant bang, a creak).
    // Does nothing if the file has not loaded.
    oneShot(name, o = {}) {
      const buf = samples.get(name);
      if (!buf) return;
      const src = ac.createBufferSource();
      src.buffer = buf;
      src.playbackRate.value = o.rate || 1;
      let node = src;
      if (o.lowpass) {
        const f = ac.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.value = o.lowpass;
        src.connect(f);
        node = f;
      }
      const g = ac.createGain();
      g.gain.value = o.gain ?? 0.3;
      const p = panner(o.pan || 0);
      node.connect(g);
      g.connect(p);
      p.connect(o.bus || sfxBus);
      src.start();
    },

    // A recorded ambience loop. Returns null if the file is not loaded yet,
    // so soundscapes can fall back to synthesised noise.
    loopSample(name, o, bus) {
      const buf = samples.get(name);
      if (!buf) return null;
      const src = ac.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      let node = src;
      if (o.lowpass) {
        const f = ac.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.value = o.lowpass;
        src.connect(f);
        node = f;
      }
      const g = ac.createGain();
      g.gain.value = o.gain ?? 0.5;
      const p = panner(o.pan || 0);
      node.connect(g);
      g.connect(p);
      p.connect(bus);
      src.start(0, Math.random() * Math.max(0, buf.duration - 1));
      return src;
    },

    loopTone(o, bus) {
      const osc = ac.createOscillator();
      osc.type = o.type || 'sine';
      osc.frequency.value = o.freq;
      const g = ac.createGain();
      g.gain.value = o.gain || 0.02;
      osc.connect(g);
      g.connect(bus);
      osc.start();
      return osc;
    },
  };

  function envelope(t, dur, o) {
    const g = ac.createGain();
    const peak = o.gain ?? 0.2;
    const attack = o.attack ?? 0.005;
    const release = o.release ?? Math.min(0.1, dur / 2);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + attack);
    g.gain.setValueAtTime(Math.max(peak, 0.0002), t + Math.max(attack, dur - release));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    if (o.pan !== undefined) {
      const p = panner(o.pan);
      g.connect(p);
      return { input: g, output: p };
    }
    return { input: g, output: g };
  }

  function playSample(name, o) {
    const buf = samples.get(name);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const g = ac.createGain();
    let gain = o.gain ?? 0.8;
    if (STARTLING.has(name) && settings.get('reduceStartles')) gain *= 0.35;
    g.gain.value = gain;
    const p = panner(o.pan || 0);
    src.connect(g);
    g.connect(p);
    p.connect(sfxBus);
    src.start();
  }

  async function loadOne(name, url) {
    if (samples.has(name)) return;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url}: ${res.status}`);
    const data = await res.arrayBuffer();
    // Safari's older decodeAudioData only supports callbacks.
    const buf = await new Promise((resolve, reject) => {
      const r = ac.decodeAudioData(data, resolve, reject);
      if (r?.then) r.then(resolve, reject);
    });
    samples.set(name, buf);
  }

  function loadLibrary() {
    if (libraryLoading || !ac) return libraryLoading;
    const entries = Object.entries(SAMPLE_FILES);
    libraryLoading = Promise.allSettled(entries.map(([name, url]) => loadOne(name, url))).then((results) => {
      results.forEach((r, i) => r.status === 'rejected' && console.warn('[audio] could not load', entries[i][0], r.reason));
      // Swap the current room's synthesised bed for the recorded one.
      if (current) {
        const { id, powered, key, state } = current;
        current.id = null;
        api_setSoundscape(id, { powered, key, state });
      }
    });
    return libraryLoading;
  }

  // Music tracks are large, so each is downloaded only when first needed.
  function startMusic(name, { loop = true, fade = 2, gain: level = 1 } = {}) {
    if (music?.name === name) return;
    stopMusic(fade);
    const buf = samples.get(name);
    if (!buf) {
      music = { name, pending: true };
      const url = MUSIC_FILES[name] || SAMPLE_FILES[name];
      if (!url) return;
      loadOne(name, url)
        .then(() => {
          if (music?.name === name && music.pending) {
            music = null;
            startMusic(name, { loop, fade, gain: level });
          }
        })
        .catch((err) => console.warn('[audio] music failed to load', name, err));
      return;
    }
    const src = ac.createBufferSource();
    src.buffer = buf;
    src.loop = loop;
    const gain = ac.createGain();
    gain.gain.setValueAtTime(0, ac.currentTime);
    gain.gain.linearRampToValueAtTime(level, ac.currentTime + fade);
    src.connect(gain);
    gain.connect(musicBus);
    src.start();
    src.onended = () => {
      if (music?.src === src) music = null;
    };
    music = { name, src, gain };
  }

  function stopMusic(fade = 1.5) {
    if (!music) return;
    const old = music;
    music = null;
    if (old.pending) return;
    const t = ac.currentTime;
    old.gain.gain.setValueAtTime(old.gain.gain.value, t);
    old.gain.gain.linearRampToValueAtTime(0, t + fade);
    setTimeout(() => {
      try {
        old.src.stop();
      } catch {
        /* already stopped */
      }
    }, fade * 1000 + 100);
  }

  // ---- ambience -------------------------------------------------------------
  function stopCurrent(fade = 1.2) {
    if (!current) return;
    const old = current;
    current = null;
    old.timers.forEach(clearInterval);
    old.timers.forEach(clearTimeout);
    const t = ac.currentTime;
    old.gain.gain.setValueAtTime(old.gain.gain.value, t);
    old.gain.gain.linearRampToValueAtTime(0, t + fade);
    setTimeout(() => {
      old.nodes.forEach((n) => {
        try {
          n.stop();
        } catch {
          /* already stopped */
        }
      });
      old.gain.disconnect();
    }, fade * 1000 + 100);
  }

  // `key` decides when the scene must be rebuilt (e.g. power restored,
  // Emily moved); `state` lets a soundscape react to the story.
  function api_setSoundscape(id, { powered = false, key = String(powered), state = null } = {}) {
    if (!ensure()) return;
    if (current && current.id === id && current.key === key) return;
    stopCurrent();
    const profile = SOUNDSCAPES[id];
    if (!profile) return;
    const gain = ac.createGain();
    gain.gain.value = 0;
    gain.connect(ambBus);
    gain.gain.linearRampToValueAtTime(1, ac.currentTime + 1.5);
    const scene = { id, powered, key, state, nodes: [], timers: [], gain };
    profile({ api, bus: gain, scene, powered, panner, state });
    current = scene;
  }

  return {
    unlock() {
      const ctx = ensure();
      if (ctx && ctx.state === 'suspended') ctx.resume();
      loadLibrary();
    },

    applyVolumes,

    cue(name, opts = {}) {
      if (!ensure()) return;
      const sample = CUE_SAMPLES[name];
      if (sample && samples.has(sample)) return playSample(sample, opts);
      if (samples.has(name)) return playSample(name, opts);
      const fn = CUES[name];
      if (!fn) return;
      try {
        fn(api, opts);
      } catch (err) {
        console.warn(`[audio] cue ${name} failed`, err);
      }
    },

    setSoundscape: api_setSoundscape,

    playMusic: (name, opts) => ensure() && startMusic(name, opts),
    stopMusic: (fade) => ac && stopMusic(fade),
    currentMusic: () => (music && !music.pending ? music.name : null),

    stopAmbience: () => ac && stopCurrent(0.5),

    // Replace a synthesised cue with a recorded file later on.
    async registerSample(name, url) {
      if (!ensure()) return;
      await loadOne(name, url);
    },

    loaded: () => [...samples.keys()],

    suspend: () => ac?.suspend(),
    resume: () => ac?.resume(),
  };
}
