// All game content. Chapters are merged into one world, so flags, trust,
// lies and Emily's fate carry from one chapter into the next.
import { chapter1 } from './chapter1/index.js';
import { chapter2 } from './chapter2/index.js';
import { chapter3 } from './chapter3/index.js';
import { chapter4 } from './chapter4/index.js';
import { chapter5 } from './chapter5/index.js';
import { chapter6 } from './chapter6/index.js';
import { chapter7 } from './chapter7/index.js';
import { part2chapter1 } from './part2_chapter1/index.js';
import { part2chapter2 } from './part2_chapter2/index.js';
import { part2chapter3 } from './part2_chapter3/index.js';
import { part2chapter4 } from './part2_chapter4/index.js';
import { part2chapter5 } from './part2_chapter5/index.js';

const CHAPTERS = [chapter1, chapter2, chapter3, chapter4, chapter5, chapter6, chapter7, part2chapter1, part2chapter2, part2chapter3, part2chapter4, part2chapter5];

const merge = (key, tag) =>
  Object.assign(
    {},
    ...CHAPTERS.map((c) =>
      tag ? Object.fromEntries(Object.entries(c[key] || {}).map(([id, v]) => [id, { chapter: c.number, ...v }])) : c[key] || {},
    ),
  );

// Later chapters can add objects and exits to rooms from earlier ones.
function withAdditions(rooms) {
  const out = Object.fromEntries(Object.entries(rooms).map(([id, r]) => [id, { ...r, objects: [...(r.objects || [])], exits: [...(r.exits || [])] }]));
  for (const c of CHAPTERS) {
    for (const [id, add] of Object.entries(c.roomAdditions || {})) {
      if (!out[id]) throw new Error(`roomAdditions: unknown room "${id}"`);
      out[id].objects.push(...(add.objects || []));
      out[id].exits.push(...(add.exits || []));
    }
  }
  return out;
}

export const content = {
  start: chapter1.start,
  chapters: Object.fromEntries(
    CHAPTERS.map((c) => [c.number, { title: c.title, part: c.part || 1, start: c.start, secrets: c.secrets, summary: c.summary || [], afterEnd: c.afterEnd }]),
  ),
  rooms: withAdditions(merge('rooms')),
  stalkerRoute: CHAPTERS.find((c) => c.stalkerRoute)?.stalkerRoute || [],
  items: merge('items'),
  documents: merge('documents', true),
  recordings: merge('recordings', true),
  objectives: merge('objectives'),
  speakers: merge('speakers'),
  dialogues: merge('dialogues'),
  events: merge('events'),
  triggers: CHAPTERS.flatMap((c) => c.triggers || []),
  endings: Object.assign({}, ...CHAPTERS.map((c) => c.endings || {})),
  globalActions: CHAPTERS.flatMap((c) => c.globalActions || []),
};
