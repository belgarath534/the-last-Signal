// Chapter 6 wiring.

import { rooms, roomAdditions } from './rooms.js';
import { items, documents, recordings, objectives } from './journal.js';
import { dialogues } from './dialogues.js';

export const chapter6 = {
  number: 6,
  title: 'Chapter 6: The Board',
  secrets: 0,

  start: {
    room: 'isolation',
    intro: [
      'THE LAST SIGNAL. Chapter 6: The Board.',
      'You step into the isolation room. The door stays open behind you. You make sure of that.',
    ],
    effects: [{ setFlag: ['ch6_started', 'isolation_open'] }, { checkpoint: true }, { startDialogue: 'daniel_in_person' }],
  },

  summary: [
    { when: { flag: 'badge_given' }, text: 'You gave Daniel Emily’s lanyard.' },
    { when: { flag: 'kept_confidence' }, text: 'You kept Emily’s secret for her to tell.' },
    { when: { flag: 'invented_message' }, text: 'You told Daniel something Emily never said.' },
    { when: { flag: 'restored_001' }, text: 'You gave 001 back the core Daniel wrote. It remembered Emily.' },
    { when: { flag: 'knows_copy' }, text: 'You learned that 001 carries a copy of Daniel’s mind.' },
    { when: [{ flag: 'marcus_arrested' }, { notFlag: 'marcus_helping' }], text: 'You arrested Marcus Hale.' },
    { when: { flag: 'marcus_helping' }, text: 'Marcus Hale agreed to help undo what he signed, and then answer for it.' },
    { when: { flag: 'revenge_marcus' }, text: 'You let Daniel have his revenge on Marcus.' },
  ],

  afterEnd: { effects: [{ say: 'You take a breath. The rain keeps falling.' }] },

  rooms,
  roomAdditions,
  items,
  documents,
  recordings,
  objectives,
  speakers: {
    marcus: { names: [{ when: { flag: 'marcus_named' }, name: 'Marcus' }, { name: 'Man in a raincoat' }] },
  },
  dialogues,
  events: {},

  triggers: [
    {
      id: 'ch6_marcus',
      when: [{ flag: 'ch6_started' }, { objective: { id: 'meet_marcus', status: 'active' } }, { at: 'reception' }],
      effects: [{ startDialogue: 'marcus' }],
    },
  ],
  globalActions: [],
};
