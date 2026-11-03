// Chapter 3 — "Awakening". Sublevel 1 again, now with Prototype 001 awake
// and on patrol. Its stealth rules live in systems/stalker.js.

import { dialogues } from './dialogues.js';

const ch3 = { flag: 'ch3_started' };

export const chapter3 = {
  number: 3,
  title: 'Chapter 3: Awakening',
  secrets: 1,

  start: {
    room: 'storage',
    intro: [
      'THE LAST SIGNAL. Chapter 3: Awakening.',
      'You come back to the storage room. The shape under the grey tarp has not moved. The speakers crackle before you can decide anything.',
    ],
    effects: [{ setFlag: 'ch3_started' }, { checkpoint: true }, { startDialogue: 'ch3_open' }],
  },

  summary: [
    { when: { flag: 'woke_001' }, text: 'You woke Prototype 001. It called you an intruder.' },
    { when: { flag: 'talked_001' }, text: 'You reminded 001 what it was built for. It hesitated.' },
    { when: { flag: 'took_001_key' }, text: 'You took the key from 001 while it slept.' },
    { when: { flag: 'injured' }, text: 'You are still hurt from 001’s grip.' },
    { when: { flag: 'daniel_told_resigned' }, text: 'Daniel admitted he had believed Emily left him.' },
  ],

  afterEnd: {
    effects: [{ say: 'You step back out of the lift cage. Somewhere on this floor, heavy footsteps keep their slow rounds.' }],
  },

  // 001's patrol, in order. Storage (step 0) is where it docks to recharge.
  stalkerRoute: [
    'storage', 'b1_landing', 'lab_corridor', 'preservation_lab', 'lab_corridor',
    'transfer_suite', 'lab_corridor', 'b1_landing', 'medical_ward', 'b1_landing',
  ],

  // New things in rooms that already exist.
  roomAdditions: {
    storage: {
      objects: [
        {
          id: 'wake_001',
          name: 'Prototype 001, under the tarp',
          position: 'ahead',
          when: [ch3, { notFlag: 'woke_001' }],
          actions: [
            {
              id: 'wake',
              label: 'Wake Prototype 001',
              cue: 'power.on',
              text: 'You pull the tarp away. It slides to the floor with a sigh. You put your palm flat against 001’s chest plate, the way Daniel said. It is cold. Then, under your hand, it is not. Something deep inside it turns over, and a sound comes out of its chest, soft and clear: three short tones, and one long one.',
              effects: [{ setFlag: 'woke_001' }, { sound: 'signal' }, { sound: 'stinger.soft' }, { objective: { id: 'wake_001', status: 'done' } }, { startDialogue: 'boot_001' }],
            },
          ],
        },
        {
          id: 'proto_001',
          name: 'Prototype 001, docked and recharging',
          position: 'ahead',
          when: [{ stalkerIn: 'storage' }, { stalkerRecharging: true }],
          actions: [
            {
              id: 'listen',
              label: 'Listen to its chest',
              text: 'You lean close. Under the charging whine, very softly, its heartbeat: three short, one long.',
            },
            {
              id: 'take_key',
              label: 'Reach into its back panel for the key',
              when: { notFlag: 'took_001_key' },
              cue: 'latch',
              text: 'You ease the back panel open. It does not stir. Inside, clipped beside a coil of cable, a heavy metal key on a tag. You slide it free and close the panel. The charging whine does not change.',
              effects: [
                { give: 'key_001' },
                { setFlag: 'took_001_key' },
                { addDocument: 'doc_001_tag' },
                { objective: { id: 'get_key', status: 'done' } },
                { objective: 'ride_lift' },
                { checkpoint: true },
              ],
            },
          ],
        },
        {
          id: 'freight_lift',
          name: 'Freight lift',
          position: 'left',
          when: ch3,
          actions: [
            {
              id: 'examine',
              label: 'Examine',
              text: 'A heavy cage lift behind the shelving, big enough for machinery. One key slot, stamped: 001 ONLY. Below it, a single destination: SUBLEVEL 2.',
            },
            {
              id: 'ride',
              label: 'Use 001’s key and ride the lift down',
              when: [{ has: 'key_001' }, { notFlag: 'ch4_started' }],
              cue: 'elevator.open',
              effects: [
                {
                  endChapter: {
                    title: 'End of Chapter 3',
                    text: 'The key turns. The cage shudders, and drops. The lights of Sublevel 1 slide away above you, and with them the slow, heavy footsteps. The air turns warmer as you go down, and it smells of machines that have never been switched off. Daniel’s voice comes through the lift speaker, very quietly: Sublevel 2. Whatever you see down here, remember what I wanted to build.',
                  },
                },
              ],
            },
          ],
        },
      ],
    },
    medical_ward: {
      objects: [
        {
          id: 'supplies',
          name: 'Medical supplies cabinet',
          position: 'left',
          when: ch3,
          actions: [
            {
              id: 'treat',
              label: 'Patch yourself up',
              when: { flag: 'injured' },
              time: 3,
              text: 'You find bandages, a cold pack and painkillers, and do what you can for your side. It still hurts to breathe deeply, but you can move properly again.',
              effects: [{ clearFlag: 'injured' }],
            },
            {
              id: 'examine',
              label: 'Examine',
              text: 'A glass-fronted cabinet: bandages, splints, cold packs, painkillers. Enough to patch up someone who has been hurt.',
            },
          ],
        },
      ],
    },
  },

  rooms: {},
  items: {
    key_001: { name: '001’s key', description: 'A heavy metal key on a tag stamped 001. It opens the freight lift to Sublevel 2.' },
  },
  documents: {
    doc_001_tag: {
      title: 'Tag on 001’s key',
      text: [
        'PROTOTYPE 001. Freight access, Sublevel 2.',
        'Behavioural layer revised by order of the Project Board. Original layer archived, Sublevel 2.',
        'Under the printed text, in small careful handwriting you have seen before: be gentle with it.',
      ],
    },
  },
  recordings: {},
  objectives: {
    wake_001: { text: 'Wake Prototype 001 in the storage room.' },
    get_key: { text: 'Take the key from 001’s back panel while it recharges in storage. Listen for it.' },
    ride_lift: { text: 'Ride the freight lift in storage down to Sublevel 2.' },
  },
  speakers: {
    proto: { names: [{ name: 'Prototype 001' }] },
  },
  dialogues,
  events: {},

  triggers: [
    {
      id: 'encounter_001',
      once: false,
      when: [{ stalkerHere: true }, { stalkerRecharging: false }],
      effects: [{ startDialogue: 'encounter_001' }],
    },
    {
      id: 'ch3_001_at_emily',
      when: [{ stalkerIn: 'medical_ward' }, { emilyIn: 'ward' }, { emilyAlive: true }, { not: { at: 'medical_ward' } }],
      effects: [{ startDialogue: 'daniel_001_at_emily' }],
    },
  ],

  globalActions: [],
};
