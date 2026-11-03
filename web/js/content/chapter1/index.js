// Chapter 1 wiring: start position, scheduled events, triggers and the
// actions that are always available (like calling Daniel on the radio).

import { rooms } from './rooms.js';
import { items, documents, recordings, objectives } from './journal.js';
import { speakers, dialogues } from './dialogues.js';

export const chapter1 = {
  number: 1,
  title: 'Chapter 1: The Signal',
  secrets: 2,

  summary: [
    { when: { flag: 'daniel_named' }, text: 'You learned his name: Daniel.' },
    { when: { flag: 'daniel_opened_elevator' }, text: 'Daniel opened the way down for you.' },
    { when: [{ flag: 'used_override' }, { notFlag: 'daniel_opened_elevator' }], text: 'You found your own way down.' },
  ],

  start: {
    room: 'patrol_car',
    inventory: ['police_radio'],
    intro: [
      'THE LAST SIGNAL. Chapter 1: The Signal.',
      'Six hours ago, dispatch picked up a signal on an emergency band. Three short tones, one long, over and over. They traced it to a research facility on the north road. A place that has been dark for a long time.',
      'You used to work there. You left two years ago, became a police officer, and did not look back. Tonight, the call came to you.',
    ],
    effects: [{ objective: 'find_signal' }],
  },

  rooms,
  items,
  documents,
  recordings,
  objectives,
  speakers,
  dialogues,

  // Fired by scheduled timers: { schedule: { event, in: minutes } }
  events: {
    dispatch_checkin: {
      effects: [{ startDialogue: 'dispatch_checkin' }],
    },
  },

  // Checked after every action. Each fires once unless once: false.
  triggers: [
    {
      id: 'first_contact',
      when: { flag: 'took_facility_radio' },
      effects: [{ startDialogue: 'daniel_first_contact' }],
    },
    {
      id: 'power_without_contact',
      when: [{ flag: 'power_on' }, { notFlag: 'took_facility_radio' }],
      effects: [
        { sound: 'signal' },
        { say: 'As the power comes on, every speaker in the building wakes with the same sound: three short tones, one long. It is loudest back toward the lobby.' },
      ],
    },
    {
      id: 'daniel_power',
      when: [{ flag: ['power_on', 'daniel_contacted'] }],
      effects: [{ startDialogue: 'daniel_power' }],
    },
    {
      id: 'override_reaction',
      when: [{ flag: ['used_override', 'daniel_contacted'] }],
      effects: [{ startDialogue: 'daniel_override_reaction' }],
    },
    {
      id: 'chapter_end',
      when: { at: 'elevator_car' },
      effects: [
        {
          endChapter: {
            title: 'End of Chapter 1',
            text: 'You press B1. The doors stay shut a moment longer than they should, and then the car drops into the dark. The red lights of the surface floor slide away above you. Somewhere below, something has been waiting a very long time for the doors to open.',
          },
        },
      ],
    },
  ],

  // "Keep exploring" after the chapter-end screen.
  afterEnd: {
    resetTriggers: ['chapter_end'],
    effects: [
      { say: 'You hold the door open and step back out. The facility is still waiting. Take the elevator again when you are ready.' },
      { moveTo: 'main_corridor' },
    ],
  },

  globalActions: [
    {
      id: 'radio_daniel',
      label: 'Call on the facility radio',
      when: [{ has: 'facility_radio' }, { flag: 'daniel_contacted' }, { trustAtLeast: -40 }],
      effects: [{ sound: 'radio.on' }, { startDialogue: 'daniel_radio' }],
    },
    {
      id: 'radio_daniel_silent',
      label: 'Call on the facility radio',
      when: [{ has: 'facility_radio' }, { flag: 'daniel_contacted' }, { trustBelow: -40 }],
      effects: [{ sound: 'radio.on' }, { startDialogue: 'daniel_silent' }],
    },
  ],
};
