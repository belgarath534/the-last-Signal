// The game engine: owns the state, wires the systems together and exposes
// a small API to the UI. It never touches the DOM or audio directly;
// it emits events ("cue", "room:entered", "trust:changed"...) instead,
// so the whole engine runs headless in tests.
//
// Every player action returns a "beat": the lines of text that action
// produced, in order. The UI shows a beat as one block of narration.

import { evaluate } from './conditions.js';
import { createEffects } from './effects.js';
import { createInitialState, cloneState, clockLabel } from './state.js';
import { installWorld } from '../systems/world.js';
import { installDialogue } from '../systems/dialogue.js';
import { installTrust, trustLevel } from '../systems/trust.js';
import { installJournal } from '../systems/journal.js';
import { installWard } from '../systems/ward.js';
import { installStalker } from '../systems/stalker.js';

export function createGame({ content, bus }) {
  let state = null;
  let output = [];
  const effects = createEffects();

  const ctx = {
    get state() {
      return state;
    },
    content,
    bus,
    effects,
    say(text, opts = {}) {
      if (!text) return;
      output.push({ text, kind: opts.kind || 'narration', speaker: opts.speaker, speakerId: opts.speakerId });
    },
    cue(name, opts = {}) {
      bus.emit('cue', { name, ...opts });
    },
    // Time moves one minute at a time so systems such as Emily's life
    // support react at exactly the right moment.
    advanceTime(minutes) {
      for (let i = 0; i < minutes; i++) {
        state.time.minutes += 1;
        for (const hook of tickHooks) hook(ctx);
      }
    },
    onTick(fn) {
      tickHooks.push(fn);
    },
    onListen(fn) {
      listenHooks.push(fn);
    },
    runListenHooks() {
      for (const fn of listenHooks) fn(ctx);
    },
    // Ask the UI to save a checkpoint once this action finishes.
    requestCheckpoint() {
      checkpoint = true;
    },
  };
  const tickHooks = [];
  const listenHooks = [];
  let checkpoint = false;

  installCoreEffects(ctx);
  const world = installWorld(ctx);
  const dialogue = installDialogue(ctx);
  const trust = installTrust(ctx);
  const journal = installJournal(ctx);
  const ward = installWard(ctx);
  installStalker(ctx);

  // Scheduled events and triggers run between player actions, never in
  // the middle of a conversation.
  function runPending() {
    for (let guard = 0; guard < 20 && !state.dialogue.active && !state.gameOver; guard++) {
      const now = state.time.minutes;
      state.timers.sort((a, b) => a.at - b.at);
      const due = state.timers.find((t) => t.at <= now);
      if (due) {
        state.timers = state.timers.filter((t) => t !== due);
        const ev = content.events[due.event];
        if (!ev) throw new Error(`Unknown event "${due.event}"`);
        if (evaluate(ev.when, state)) effects.apply(ev.effects, ctx);
        continue;
      }
      const trig = content.triggers.find(
        (t) => !state.firedTriggers[t.id] && evaluate(t.when, state),
      );
      if (!trig) break;
      if (trig.once !== false) state.firedTriggers[trig.id] = true;
      effects.apply(trig.effects, ctx);
    }
  }

  function run(fn) {
    if (!state) throw new Error('No game in progress');
    output = [];
    checkpoint = false;
    fn();
    runPending();
    state.stats.actions += 1;
    bus.emit('state:changed', { state });
    return { lines: output, checkpoint };
  }

  function roomActions() {
    const list = [
      { id: 'look', label: 'Look around' },
      { id: 'listen', label: 'Listen' },
    ];
    for (const a of content.globalActions || []) {
      if (evaluate(a.when, state)) list.push({ id: a.id, label: a.label });
    }
    return list;
  }

  function mode() {
    if (state.gameOver) return 'gameOver';
    if (state.ended) return 'chapterEnd';
    if (state.dialogue.active) return 'dialogue';
    return 'explore';
  }

  return {
    ctx,
    get state() {
      return state;
    },

    newGame() {
      state = createInitialState({ startRoom: content.start.room });
      state.inventory = [...(content.start.inventory || [])];
      return run(() => {
        for (const line of content.start.intro) ctx.say(line);
        effects.apply(content.start.effects, ctx);
        world.enterRoom(content.start.room);
      });
    },

    loadState(saved) {
      state = cloneState(saved);
      bus.emit('room:entered', { room: world.room() });
      bus.emit('state:changed', { state });
    },

    snapshot: () => cloneState(state),

    saveMeta() {
      return {
        room: world.room().name,
        chapter: state.chapter,
        clock: clockLabel(state.time.minutes),
      };
    },

    view() {
      const m = mode();
      const room = world.room();
      return {
        mode: m,
        room: { id: room.id, name: room.name, zone: room.zone },
        clock: clockLabel(state.time.minutes),
        roomActions: m === 'explore' ? roomActions() : [],
        objects:
          m === 'explore'
            ? world.visibleObjects().map((o) => ({ id: o.id, name: o.name, position: o.position }))
            : [],
        exits:
          m === 'explore'
            ? world.visibleExits().map((e) => ({
                id: e.id,
                dir: e.dir,
                label: world.exitLabel(e),
                lockedKnown: world.lockedKnown(e),
              }))
            : [],
        choices: m === 'dialogue' ? dialogue.choices() : [],
        ended: state.ended || null,
        gameOver: state.gameOver || null,
      };
    },

    objectActions: (id) => world.objectActions(id).map((a) => ({ id: a.id, label: a.label })),
    objectInfo: (id) => world.visibleObjects().find((o) => o.id === id) || null,

    // Text shown after loading a save or returning to the game.
    resume: () =>
      run(() => {
        if (state.ended) return;
        if (state.dialogue.active) {
          ctx.say('You are in the middle of a conversation.', { kind: 'system' });
          dialogue.replay();
        } else {
          world.describeHere();
        }
      }),

    look: () => run(() => world.look()),
    listen: () => run(() => world.listen()),
    go: (exitId) => run(() => world.go(exitId)),
    act: (objectId, actionId) => run(() => world.act(objectId, actionId)),
    choose: (index) => run(() => dialogue.choose(index)),
    roomAction(id) {
      if (id === 'look') return this.look();
      if (id === 'listen') return this.listen();
      const a = (content.globalActions || []).find((x) => x.id === id);
      if (!a || !evaluate(a.when, state)) return run(() => ctx.say('You cannot do that now.', { kind: 'system' }));
      return run(() => effects.apply(a.effects, ctx));
    },
    hasNextChapter: () => !!content.chapters[state.chapter + 1],

    startNextChapter() {
      return run(() => {
        const n = state.chapter + 1;
        const ch = content.chapters[n];
        // Saves made before endings were recorded as flags still know their ending.
        const reached = state.ended?.ending;
        if (reached && !state.flags[`ending_${reached}`]) state.flags[`ending_${reached}`] = true;
        state.chapter = n;
        state.ended = null;
        for (const line of ch.start.intro) ctx.say(line);
        effects.apply(ch.start.effects, ctx);
        world.enterRoom(ch.start.room);
      });
    },

    // Progress counts for the chapter summary, covering every chapter so far.
    chapterSummary() {
      const upTo = (list) => Object.values(list).filter((d) => (d.chapter || 1) <= state.chapter).length;
      let secrets = 0;
      for (let n = 1; n <= state.chapter; n++) secrets += content.chapters[n]?.secrets || 0;
      return {
        documents: [state.journal.documents.length, upTo(content.documents)],
        recordings: [state.journal.recordings.length, upTo(content.recordings)],
        secrets: [state.stats.secretsFound, secrets],
      };
    },

    wardReport: () => ward.report(),

    continueAfterChapter() {
      return run(() => {
        const after = content.chapters[state.chapter]?.afterEnd || {};
        state.ended = null;
        for (const id of after.resetTriggers || []) delete state.firedTriggers[id];
        effects.apply(after.effects, ctx);
      });
    },

    markRead: (id) => journal.markRead(id),
    objectives: (status) => journal.objectivesByStatus(status),
    trustLevel: () => trustLevel(state.trust.daniel.value),
    speakerName: (id) => dialogue.speakerName(id),
  };
}

function installCoreEffects(ctx) {
  const { effects } = ctx;
  const list = (v) => (Array.isArray(v) ? v : [v]);

  effects.register('setFlag', (v, c) => list(v).forEach((f) => (c.state.flags[f] = true)));
  effects.register('clearFlag', (v, c) => list(v).forEach((f) => delete c.state.flags[f]));
  effects.register('say', (v, c) => list(v).forEach((t) => c.say(t)));
  effects.register('sound', (v, c) => c.cue(typeof v === 'string' ? v : v.name, typeof v === 'object' ? v : {}));
  effects.register('advanceTime', (v, c) => c.advanceTime(v));

  // { schedule: { event: 'id', in: 10 } }  -- fires after 10 in-game minutes.
  effects.register('schedule', (v, c) => {
    c.state.timers = c.state.timers.filter((t) => t.event !== v.event);
    c.state.timers.push({ event: v.event, at: c.state.time.minutes + v.in });
  });
  effects.register('cancelTimer', (v, c) => {
    c.state.timers = c.state.timers.filter((t) => t.event !== v);
  });

  effects.register('secret', (v, c) => {
    const key = `secret:${v}`;
    if (c.state.flags[key]) return;
    c.state.flags[key] = true;
    c.state.stats.secretsFound += 1;
    c.cue('secret');
    c.say('You found something hidden.', { kind: 'system' });
  });

  effects.register('checkpoint', (v, c) => c.requestCheckpoint());

  // { count: { id: 'jury', add: 2 } } adds to a named counter.
  effects.register('count', (v, c) => {
    c.state.counters ||= {};
    c.state.counters[v.id] = (c.state.counters[v.id] ?? 0) + v.add;
  });

  // Jump the clock forward to a time of day, e.g. { hour: 19, minute: 30 }.
  // Only ever forward, so timers and systems stay consistent.
  effects.register('setClock', (v, c) => {
    const start = 1 * 60 + 47;
    const now = (start + c.state.time.minutes) % 1440;
    const target = v.hour * 60 + (v.minute || 0);
    c.state.time.minutes += (target - now + 1440) % 1440;
  });

  effects.register('endChapter', (v, c) => {
    c.state.flags[`chapter_${c.state.chapter}_complete`] = true;
    c.state.ended = { chapter: c.state.chapter, title: v.title, text: v.text, ending: v.ending || null };
    // Remember which ending this playthrough reached: later parts start from it.
    if (v.ending) {
      for (const k of Object.keys(c.state.flags)) if (k.startsWith('ending_')) delete c.state.flags[k];
      c.state.flags[`ending_${v.ending}`] = true;
    }
    c.cue('chapter.end');
    c.say(v.text);
    c.say(v.title, { kind: 'heading' });
  });
}
