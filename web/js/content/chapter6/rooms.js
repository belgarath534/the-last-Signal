// Chapter 6 — "The Board".

export const rooms = {
  isolation: {
    id: 'isolation',
    name: 'Isolation',
    zone: 'surface',
    soundscape: 'isolation',
    description:
      'A small dark room inside the stairwell wall. Cables hang from the ceiling. Against the far wall, held upright by clamps at the wrists, the chest and the throat, stands Daniel: tall, steel and grey composite, a face built to look gentle. His amber eyes follow you.',
    revisit: 'Isolation. Daniel, clamped to the far wall, watching you.',
    listen: {
      text: 'The soft whir of Daniel’s body, close enough to touch. When he is not speaking, it slows, like breathing. Somewhere inside his chest, very faint: three short, one long.',
    },
    objects: [
      {
        id: 'daniel',
        name: 'Daniel',
        position: 'ahead',
        actions: [
          { id: 'talk', label: 'Talk to Daniel', effects: [{ startDialogue: 'daniel_in_person' }] },
          {
            id: 'badge',
            label: 'Give Daniel Emily’s lanyard',
            when: { has: 'emily_badge' },
            effects: [{ remove: 'emily_badge' }, { setFlag: 'badge_given' }, { startDialogue: 'daniel_badge' }],
          },
        ],
      },
      {
        id: 'clamps',
        name: 'Clamps',
        position: 'ahead',
        actions: [
          {
            id: 'examine',
            label: 'Examine',
            text: 'Heavy steel, bolted through the wall. No keyhole, no release lever. A small receiver on each clamp, with a red light. They answer to a remote, and you do not have it.',
          },
        ],
      },
    ],
    exits: [{ id: 'out', dir: 'out', to: 'stairwell', label: 'Back out to the stairwell' }],
  },
};

export const roomAdditions = {
  stairwell: {
    exits: [{ id: 'in', dir: 'in', to: 'isolation', label: 'Into the isolation room', when: { flag: 'isolation_open' }, sound: 'door.heavy' }],
  },
  storage: {
    objects: [
      {
        id: 'restore_001',
        name: 'Prototype 001, docked and recharging',
        position: 'ahead',
        when: [{ stalkerIn: 'storage' }, { stalkerRecharging: true }, { has: 'core_001' }, { flag: 'ch6_started' }],
        actions: [
          {
            id: 'install',
            label: 'Install 001’s original core',
            cue: 'power.on',
            text: 'You open its back panel again. Beside the empty key clip, a slot the same size as the amber core. You slide the core in until it clicks. The charging whine stops. Every light on 001 goes out.',
            effects: [{ stalkerStop: true }, { setFlag: 'restored_001' }, { remove: 'core_001' }, { startDialogue: 'restore_001' }],
          },
        ],
      },
    ],
  },
  reception: {
    objects: [
      {
        id: 'marcus',
        name: 'Marcus',
        position: 'ahead',
        when: [{ flag: 'marcus_met' }, { notFlag: 'marcus_gone' }],
        actions: [{ id: 'talk', label: 'Talk to Marcus', effects: [{ startDialogue: 'marcus_after' }] }],
      },
    ],
  },
};
