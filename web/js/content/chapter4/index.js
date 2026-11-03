// Chapter 4 wiring.

import { rooms, roomAdditions } from './rooms.js';
import { items, documents, recordings, objectives } from './journal.js';
import { dialogues } from './dialogues.js';

export const chapter4 = {
  number: 4,
  title: 'Chapter 4: Remains',
  secrets: 1,

  start: {
    room: 'b2_lift',
    intro: [
      'THE LAST SIGNAL. Chapter 4: Remains.',
      'The lift settles at the bottom of its shaft with a long metal groan. Somewhere far above, 001’s footsteps keep their slow rounds.',
    ],
    effects: [{ setFlag: 'ch4_started' }, { checkpoint: true }, { startDialogue: 'ch4_arrival' }],
  },

  summary: [
    { when: { flag: 'daniel_watching' }, text: 'You let Daniel watch over Emily.' },
    { when: { flag: 'ward_mains' }, text: 'You wired Emily’s ward into Sublevel 2’s power.' },
    { when: { flag: 'told_body_alive' }, text: 'You told Daniel his body is still breathing.' },
    { when: { flag: 'emily_awake' }, text: 'You woke Emily.' },
    { when: { flag: 'emily_daniel_talked' }, text: 'Emily and Daniel spoke for the first time in two years.' },
    { when: { has: 'core_001' }, text: 'You are carrying 001’s original core, the one Daniel wrote.' },
  ],

  afterEnd: {
    effects: [{ say: 'The machines hum on. There is still time to look around.' }],
  },

  rooms,
  roomAdditions,
  items,
  documents,
  recordings,
  objectives,
  speakers: {
    emily: { names: [{ name: 'Emily' }] },
  },
  dialogues,
  events: {},

  triggers: [
    {
      id: 'ch4_end',
      when: [
        { flag: 'saw_body' },
        { any: [{ flag: 'emily_daniel_talked' }, { emilyAlive: false }] },
      ],
      effects: [{ startDialogue: 'daniel_ch4_end' }],
    },
    {
      id: 'ch4_emily_died',
      when: [{ emilyAlive: false }, { objective: { id: 'wake_emily', status: 'active' } }],
      effects: [{ objective: { id: 'wake_emily', status: 'failed' } }],
    },
  ],

  globalActions: [],
};
