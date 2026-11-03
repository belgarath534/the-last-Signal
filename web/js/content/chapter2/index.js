// Chapter 2 wiring.

import { rooms } from './rooms.js';
import { items, documents, recordings, objectives } from './journal.js';
import { dialogues } from './dialogues.js';

const notInLab = { not: { at: 'preservation_lab' } };

export const chapter2 = {
  number: 2,
  title: 'Chapter 2: Preservation',
  secrets: 2,

  start: {
    room: 'b1_landing',
    intro: [
      'THE LAST SIGNAL. Chapter 2: Preservation.',
      'The elevator falls for longer than one floor should take. When it stops, the silence is different down here: thicker, colder, closer.',
    ],
    effects: [{ startDialogue: 'b1_arrival' }],
  },

  // What the chapter-end screen says about your choices.
  summary: [
    { when: [{ flag: 'found_emily' }, { emilyAlive: true }, { emilyIn: 'ward' }], text: 'Emily Carter is alive, asleep in the medical ward.' },
    { when: [{ flag: 'found_emily' }, { emilyAlive: true }, { emilyIn: 'capsule' }], text: 'Emily Carter is alive, still in her capsule in the preservation lab.' },
    { when: { emilyAlive: false }, text: 'Emily Carter died.' },
    { when: { flag: 'told_daniel_emily' }, text: 'You told Daniel that Emily is alive.' },
    { when: { flag: 'records_sent' }, text: 'You sent Daniel the preservation records.' },
    { when: { flag: 'agreed_activate_001' }, text: 'You agreed to wake Prototype 001.' },
    { when: { flag: 'refused_001_for_now' }, text: 'You refused to wake Prototype 001. For now.' },
  ],

  // Not resetting the end trigger here: its conditions stay true, so it
  // would fire again at once.
  afterEnd: {
    effects: [{ say: 'You stand in the quiet a while longer. There is still time to look around, and Emily still needs looking after.' }],
  },

  rooms,
  items,
  documents,
  recordings,
  objectives,
  speakers: {},
  dialogues,
  events: {},

  triggers: [
    {
      id: 'ch2_transfer_suite',
      when: [{ at: 'transfer_suite' }, { flag: 'daniel_contacted' }],
      effects: [{ startDialogue: 'daniel_transfer_suite' }],
    },
    {
      id: 'ch2_power_ward_objective',
      when: [{ flag: 'found_emily' }, { notFlag: 'ward_door_powered' }],
      effects: [{ objective: 'power_ward' }],
    },
    {
      id: 'ch2_found_emily',
      when: [{ flag: ['found_emily', 'daniel_contacted'] }, notInLab],
      effects: [{ startDialogue: 'daniel_found_emily' }],
    },
    {
      id: 'ch2_records',
      when: [{ flag: ['records_sent', 'emily_conversation_done'] }],
      effects: [{ startDialogue: 'daniel_records' }],
    },
    {
      id: 'ch2_alarm_heard',
      when: [{ flag: ['ward_alarm_heard', 'emily_conversation_done'] }, { not: { lieExposed: 'emily' } }],
      effects: [{ startDialogue: 'daniel_hears_alarm' }],
    },
    {
      id: 'ch2_emily_died_capsule',
      when: [{ emilyAlive: false }, { objective: { id: 'save_emily', status: 'active' } }],
      effects: [{ objective: { id: 'save_emily', status: 'failed' } }],
    },
    {
      id: 'ch2_emily_died_ward',
      when: [{ emilyAlive: false }, { objective: { id: 'keep_emily_alive', status: 'active' } }],
      effects: [{ objective: { id: 'keep_emily_alive', status: 'failed' } }],
    },
    {
      id: 'chapter2_end',
      when: [
        { flag: 'saw_001' },
        { any: [{ all: [{ emilyIn: 'ward' }, { flag: 'checked_emily' }] }, { emilyAlive: false }] },
      ],
      effects: [{ startDialogue: 'daniel_001_request' }],
    },
  ],

  globalActions: [
    {
      id: 'emily_monitor',
      label: 'Check Emily’s monitor on the radio',
      when: [{ flag: 'found_emily' }, { has: 'facility_radio' }],
      effects: [{ wardReport: true }],
    },
  ],
};
