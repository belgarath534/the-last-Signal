// Chapter 5 — "Relocated". Back up to the surface, into the chained stairwell.

const knowsWay = { any: [{ flag: 'emily_told_way' }, { found: 'doc_isolation_order' }] };

export const rooms = {
  stairwell: {
    id: 'stairwell',
    name: 'East stairwell',
    zone: 'surface',
    soundscape: 'stairwell',
    description:
      'Concrete stairs going down into the dark, between the surface and Sublevel 1. Your flashlight finds footprints in the dust on every step, going down and coming back up. Some of them are fresh. Halfway down, on a landing, a heavy steel door with a keypad. Stencilled on it: ISOLATION.',
    revisit: 'The east stairwell. The isolation door on the landing below, the corridor behind you.',
    listen: {
      text: 'Your own breathing, loud in the stairwell. From behind the isolation door, a soft, steady whir. You have heard that whir before, on the other end of the radio, every time Daniel went quiet.',
      details: [
        { when: { notFlag: 'heard_humming' }, text: 'And under the whir, very faintly, someone humming. A slow tune you do not know. Then it stops, as if it has heard you.' },
      ],
      effects: [{ setFlag: 'heard_humming' }, { secret: 'humming' }],
    },
    objects: [
      {
        id: 'footprints',
        name: 'Footprints in the dust',
        position: 'ahead',
        actions: [
          {
            id: 'examine',
            label: 'Examine',
            text: 'Two sets. One set is old and blurred, many trips over a long time. The other is sharp and recent: hard-soled shoes, someone who walked down to the isolation door, stood there a while, and walked back up. Not tonight. But not long ago.',
            effects: [{ setFlag: 'saw_footprints' }],
          },
        ],
      },
      {
        id: 'isolation_door',
        name: 'Isolation door',
        position: 'ahead',
        actions: [
          {
            id: 'examine',
            label: 'Examine',
            text: 'Steel, cold, and very thick. A keypad with a single button marked ENTER, and a small speaker grille. The keypad does not want numbers: its label says RHYTHM CODE.',
          },
          {
            id: 'knock',
            label: 'Knock on the door',
            text: 'You knock. The whir behind the door stops. Nothing answers. After a long moment, the whir starts again.',
          },
          {
            id: 'tap',
            label: 'Tap the signal on the keypad: three short, one long',
            cue: 'signal',
            effects: [{ startDialogue: 'ch5_door' }],
          },
        ],
      },
    ],
    exits: [{ id: 'up', dir: 'up', to: 'main_corridor', label: 'Back up to the main corridor', sound: 'footsteps' }],
  },
};

// Things added to rooms from earlier chapters.
export const roomAdditions = {
  storage: {
    objects: [
      {
        id: 'tool_crate',
        name: 'Tool crate',
        position: 'left',
        when: { flag: 'ch5_started' },
        actions: [
          {
            id: 'search',
            label: 'Search the tool crate',
            when: { notHas: 'bolt_cutters' },
            cue: 'latch',
            text: 'Spanners, cable, a dead drill. And at the bottom, heavy and long-handled, a pair of bolt cutters.',
            effects: [{ give: 'bolt_cutters' }, { objective: { id: 'get_cutters', status: 'done' } }],
          },
        ],
      },
    ],
  },
  b1_landing: {
    objects: [
      {
        id: 'elevator_controls',
        name: 'Elevator controls',
        position: 'behind',
        when: { flag: 'ch5_started' },
        actions: [
          {
            id: 'examine',
            label: 'Examine',
            text: 'The call panel by the elevator doors. The car is waiting here, doors open, but the surface button inside does nothing.',
          },
          {
            id: 'trick',
            label: 'Hold the door-open and B1 buttons together',
            when: [knowsWay, { notFlag: 'elevator_up' }],
            cue: 'card.accept',
            time: 1,
            text: 'You step inside and hold both buttons down. One second. Three. Five. The panel blinks, clicks, and the surface button lights up.',
            effects: [{ setFlag: 'elevator_up' }, { objective: { id: 'go_up', status: 'done' } }],
          },
        ],
      },
    ],
    exits: [
      {
        id: 'up',
        dir: 'up',
        to: 'main_corridor',
        label: 'Elevator up to the surface',
        when: { flag: 'elevator_up' },
        sound: 'elevator.open',
        time: 3,
        text: 'The car climbs. The red lights of the surface floor slide down into view.',
      },
    ],
  },
  main_corridor: {
    objects: [
      {
        id: 'chain',
        name: 'Chained stairwell door',
        position: 'right',
        when: [{ flag: 'ch5_started' }, { notFlag: 'chain_cut' }],
        actions: [
          {
            id: 'examine',
            label: 'Examine',
            text: 'A heavy new chain through both handles, and a padlock with a plastic tag: PROPERTY OF THE PROJECT BOARD. DO NOT REMOVE.',
            effects: [{ addDocument: 'doc_padlock_tag' }],
          },
          {
            id: 'cut',
            label: 'Cut the chain with the bolt cutters',
            when: { has: 'bolt_cutters' },
            cue: 'locker',
            text: 'You set the jaws on a link and lean on the handles until your arms shake. The link bites, then snaps with a crack that echoes down the whole corridor. The chain slithers to the floor.',
            effects: [{ setFlag: 'chain_cut' }, { startDialogue: 'ch5_chain' }],
          },
        ],
      },
    ],
    exits: [
      { id: 'stairs', dir: 'east', to: 'stairwell', label: 'East stairwell', when: { flag: 'chain_cut' }, sound: 'door.heavy' },
    ],
  },
  elevator_car: {
    exits: [
      { id: 'down', dir: 'down', to: 'b1_landing', label: 'Back down to Sublevel 1', when: { flag: 'elevator_up' }, sound: 'elevator.open', time: 3 },
    ],
  },
  records_room: {
    objects: [
      {
        id: 'board_safe',
        name: 'Open wall safe',
        position: 'left',
        when: { flag: 'ch5_started' },
        actions: [
          {
            id: 'read',
            label: 'Read the papers inside',
            once: true,
            text: 'You had not noticed the safe before, behind the filing cabinets. Its door is open a crack, as if someone left in a hurry.',
            afterText: 'The isolation order is in your journal.',
            effects: [{ addDocument: 'doc_isolation_order' }, { objective: { id: 'find_isolation', status: 'done' } }, { objective: 'go_up' }],
          },
        ],
      },
    ],
  },
};
