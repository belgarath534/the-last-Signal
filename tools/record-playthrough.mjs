// Plays the original JavaScript engine automatically and records every action
// with the text it produced, so the Swift engine can be checked against it.
// Usage: node tools/record-playthrough.mjs SEED STEPS OUT.json
import { writeFileSync } from 'node:fs';
import { content } from '../web/js/content/index.js';
import { createGame } from '../web/js/core/game.js';
import { createEventBus } from '../web/js/core/events.js';

const [seed = 1, steps = 2000, out = 'playthrough.json'] = process.argv.slice(2);
let r = Number(seed) || 1;
const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;

const bus = createEventBus();
const cues = [];
bus.on('cue', (c) => cues.push(c.name + (c.pan != null ? '@' + c.pan : '')));
const game = createGame({ content, bus });
const tried = new Map();
const record = [];
const viewOf = () => {
  const v = game.view();
  return { mode: v.mode, room: v.room.id, clock: v.clock, actions: v.roomActions.map((a) => a.id), objects: v.objects.map((o) => o.id),
    exits: v.exits.map((e) => e.id + (e.lockedKnown ? '!' : '')), choices: v.choices.map((c) => c.index + ':' + c.text) };
};
function step(action, fn) {
  cues.length = 0;
  const beat = fn();
  record.push({ action, lines: beat.lines.map((l) => [l.kind, l.speaker || '', l.text]), checkpoint: beat.checkpoint, cues: [...cues], view: viewOf() });
}
const pickLeast = (key, list) => {
  list = list.map((x) => [x, (tried.get(key + x) || 0) + rnd() * 0.9]).sort((a, b) => a[1] - b[1]);
  const choice = rnd() < 0.85 ? list[0][0] : list[Math.floor(rnd() * list.length)][0];
  tried.set(key + choice, (tried.get(key + choice) || 0) + 1);
  return choice;
};

step(['new'], () => game.newGame());
let checkpoint = game.snapshot();
for (let i = 0; i < Number(steps); i++) {
  const v = game.view();
  if (record[record.length - 1].checkpoint) checkpoint = game.snapshot();
  if (v.mode === 'gameOver') {
    game.loadState(checkpoint);
    step(['resume'], () => game.resume());
    continue;
  }
  if (v.mode === 'chapterEnd') {
    if (game.hasNextChapter()) step(['next'], () => game.startNextChapter());
    else break;
    continue;
  }
  if (v.mode === 'dialogue') {
    const c = pickLeast('d' + game.state.dialogue.active.id + game.state.dialogue.active.node, v.choices.map((c) => c.index));
    step(['choose', c], () => game.choose(c));
    continue;
  }
  // occasionally read an unread journal entry (some have onRead effects)
  const unread = [...game.state.journal.documents, ...game.state.journal.recordings].filter((d) => !game.state.journal.read[d]);
  if (unread.length && rnd() < 0.3) {
    game.markRead(unread[0]);
    record.push({ action: ['read', unread[0]], lines: [], cues: [], view: viewOf() });
    continue;
  }
  const opts = [...v.roomActions.map((a) => 'a:' + a.id), ...v.objects.flatMap((o) => game.objectActions(o.id).map((a) => 'o:' + o.id + ':' + a.id)), ...v.exits.map((e) => 'e:' + e.id)];
  const c = pickLeast(v.room, opts);
  const [kind, x, y] = c.split(':');
  if (kind === 'a') step(['room', x], () => game.roomAction(x));
  else if (kind === 'o') step(['act', x, y], () => game.act(x, y));
  else step(['go', x], () => game.go(x));
}
writeFileSync(out, JSON.stringify(record));
const chapters = [...new Set(record.map((s) => s.view.room))].length;
console.log('steps', record.length, 'rooms', chapters, 'chapter', game.state.chapter, 'mode', game.view().mode, 'ended', JSON.stringify(game.state.ended?.title || ''), 'ending flags', Object.keys(game.state.flags).filter((f) => f.startsWith('ending_')));
