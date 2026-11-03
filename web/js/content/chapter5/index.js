// Chapter 5 wiring.

import { rooms, roomAdditions } from './rooms.js';
import { items, documents, recordings, objectives } from './journal.js';
import { dialogues } from './dialogues.js';

export const chapter5 = {
  number: 5,
  title: 'Chapter 5: Relocated',
  secrets: 1,

  start: {
    room: 'medical_ward',
    intro: [
      'THE LAST SIGNAL. Chapter 5: Relocated.',
      'You ride back up from Sublevel 2. Somewhere above you, Daniel is listening. Somewhere, the rest of him is waiting.',
    ],
    effects: [{ setFlag: 'ch5_started' }, { checkpoint: true }, { startDialogue: 'ch5_open' }],
  },

  summary: [
    { when: { flag: 'emily_confided' }, text: 'Emily told you something she never told Daniel. You kept it.' },
    { when: { has: 'emily_badge' }, text: 'You are carrying Emily’s lanyard for Daniel.' },
    { when: { flag: 'told_coming' }, text: 'You told Daniel you were coming, against his wishes.' },
    { when: { flag: 'saw_footprints' }, text: 'Someone from the board has visited the isolation door recently.' },
    { text: 'You found Daniel.' },
  ],

  afterEnd: {
    effects: [
      { say: 'You stand in the doorway. Behind you, the stairwell. In front of you, Daniel. Nothing has to happen yet.' },
    ],
  },

  rooms,
  roomAdditions,
  items,
  documents,
  recordings,
  objectives,
  speakers: {},
  dialogues,
  events: {},
  triggers: [],
  globalActions: [],
};
