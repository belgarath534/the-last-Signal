// Chapter 4 — "Remains". Sublevel 2.

const emilyAsleep = [{ emilyIn: 'ward' }, { emilyAlive: true }, { notFlag: 'emily_awake' }];

export const rooms = {
  b2_lift: {
    id: 'b2_lift',
    name: 'Sublevel 2, freight lift',
    shortName: 'freight lift on Sublevel 2',
    zone: 'sublevel2',
    soundscape: 'b2',
    description:
      'The lift cage opens onto a wide concrete bay. It is warm down here, almost humid, and the air tastes of hot metal. Machines are running somewhere, and from the sound of them they have never once been switched off. A hall leads straight ahead.',
    revisit: 'The freight lift bay. The hall ahead, the lift up to storage behind you.',
    listen: {
      text: 'A deep, even hum from every direction. Pumps. Fans. And, faint and slow, something that might be a ventilator, breathing for someone.',
    },
    objects: [],
    exits: [
      { id: 'north', dir: 'north', to: 'b2_hall', label: 'Main hall', sound: 'footsteps' },
      { id: 'up', dir: 'up', to: 'storage', label: 'Freight lift up to storage', sound: 'elevator.open', time: 3, text: 'You turn 001’s key. The cage shudders upward.' },
    ],
  },

  b2_hall: {
    id: 'b2_hall',
    name: 'Sublevel 2, main hall',
    shortName: 'main hall',
    zone: 'sublevel2',
    soundscape: 'b2',
    description:
      'A long hall with clean walls and good lighting, as if this floor was never abandoned at all. On your left, a door marked RECORDS. On your right, a glass room full of screens: MONITORING. Straight ahead, a heavy pressure door with a small window, stencilled CONTAINMENT.',
    revisit: 'The main hall. Records on the left, monitoring on the right, containment ahead.',
    listen: {
      text: 'The hum is louder straight ahead, behind the containment door, and under it, slow and mechanical, the ventilator. In and out. In and out.',
    },
    objects: [],
    exits: [
      { id: 'south', dir: 'south', to: 'b2_lift', label: 'Freight lift bay', sound: 'footsteps' },
      { id: 'west', dir: 'west', to: 'records_room', label: 'Records' },
      { id: 'east', dir: 'east', to: 'monitoring', label: 'Monitoring' },
      { id: 'north', dir: 'north', to: 'containment', label: 'Containment', sound: 'door.heavy' },
    ],
  },

  records_room: {
    id: 'records_room',
    name: 'Records room',
    zone: 'sublevel2',
    soundscape: 'b2_quiet',
    description:
      'Rows of grey filing cabinets, and a reading table under a lamp that is still on. On the table, a folder left open. Against the far wall on your right, a steel archive shelf with numbered boxes.',
    revisit: 'The records room. Filing cabinets, the reading table ahead, the archive shelf on your right.',
    listen: {
      text: 'Paper and silence. The lamp buzzes.',
      details: [
        { when: { notFlag: 'heard_core' }, text: 'And from the archive shelf on your right, very faint, an electronic hum that does not belong to paper. Something in one of the boxes is still powered.' },
      ],
      effects: [{ setFlag: 'heard_core' }],
    },
    objects: [
      {
        id: 'folder',
        name: 'Open folder on the table',
        position: 'ahead',
        actions: [
          {
            id: 'read',
            label: 'Read the folder',
            once: true,
            text: 'Board minutes. Someone was reading them recently enough that the lamp is still on.',
            afterText: 'The board minutes are in your journal.',
            effects: [{ addDocument: 'doc_board_minutes' }],
          },
        ],
      },
      {
        id: 'cabinets',
        name: 'Filing cabinets',
        position: 'left',
        actions: [
          {
            id: 'search',
            label: 'Search for Emily’s file',
            once: true,
            text: 'You go drawer by drawer. C. CARTER, E. Inside her file, an envelope marked REVIVAL, CAPSULE 3. Inside that, a printed sheet of codes.',
            afterText: 'You already have the revival codes.',
            effects: [{ give: 'revival_codes' }, { addDocument: 'doc_revival_codes' }, { objective: { id: 'find_codes', status: 'done' } }, { objective: 'wake_emily' }, { checkpoint: true }],
          },
        ],
      },
      {
        id: 'archive_core',
        name: 'Humming archive box',
        position: 'right',
        when: { flag: 'heard_core' },
        actions: [
          {
            id: 'open',
            label: 'Open the box',
            once: true,
            text: 'Box 001. Inside, nested in foam, a small rectangular core module with a status light pulsing amber, the same amber 001’s eyes were before they turned white. The label: 001. ORIGINAL BEHAVIOURAL LAYER. ARCHIVED.',
            afterText: 'The empty foam of box 001.',
            effects: [{ give: 'core_001' }, { secret: 'core_001' }],
          },
        ],
      },
    ],
    exits: [{ id: 'east', dir: 'east', to: 'b2_hall', label: 'Main hall' }],
  },

  monitoring: {
    id: 'monitoring',
    name: 'Monitoring station',
    zone: 'sublevel2',
    soundscape: 'b2_screens',
    description:
      'A glass room walled with screens. Most show empty corridors. One, on your left, shows a dot labelled 001 moving slowly across a floor plan of Sublevel 1. Ahead, a desk with a terminal marked MEDICAL LINK: WARD 1.',
    revisit: 'Monitoring. The medical link terminal ahead, the floor plan screen on the left.',
    listen: {
      text: 'Cooling fans, and the soft tick of screens refreshing.',
    },
    objects: [
      {
        id: 'floor_plan',
        name: 'Floor plan screen',
        position: 'left',
        actions: [
          {
            id: 'examine',
            label: 'Examine',
            text: [
              { when: { stalkerActive: true }, text: 'A floor plan of Sublevel 1. A small dot labelled 001 walks its rounds: landing, corridor, labs, ward, storage. It never varies.' },
              { text: 'A floor plan of Sublevel 1. Nothing moves on it.' },
            ],
          },
        ],
      },
      {
        id: 'med_link',
        name: 'Medical link terminal',
        position: 'ahead',
        actions: [
          {
            id: 'vitals',
            label: 'Read Emily’s vitals',
            time: 0,
            when: { flag: 'found_emily' },
            effects: [{ wardReport: true }],
          },
          {
            id: 'mains',
            label: 'Route Sublevel 2 power to the ward',
            when: [{ notFlag: 'ward_mains' }, { emilyIn: 'ward' }],
            cue: 'power.on',
            text: 'You find the ward on the power map and drag a line from Sublevel 2’s supply to it. The screen asks twice whether you are sure. You are.',
            effects: [{ setFlag: 'ward_mains' }, { wardAddPower: 100 }, { say: 'Emily’s ward now draws power from Sublevel 2. Her power will hold on its own.' }],
          },
          {
            id: 'remote_check',
            label: 'Run a remote check on Emily',
            when: emilyAsleep,
            time: 2,
            cue: 'monitor',
            text: 'You walk the ward’s machines through their checks from here: oxygen, temperature, fluids. It helps, but a screen cannot do what hands can.',
            effects: [{ wardStabilize: 70 }],
          },
        ],
      },
    ],
    exits: [{ id: 'west', dir: 'west', to: 'b2_hall', label: 'Main hall' }],
  },

  containment: {
    id: 'containment',
    name: 'Containment',
    zone: 'sublevel2',
    soundscape: 'containment',
    description:
      'A sealed white room, warmer than anywhere else. In the centre, under a glass canopy, a medical bed surrounded by machines. Someone is lying in it. A ventilator breathes for them, slow and steady. On your left, a chart on a clipboard. On your right, against the wall, a tall empty frame with clamps for something the size of a person.',
    revisit: 'Containment. The bed under its canopy ahead, the chart on the left, the empty frame on the right.',
    listen: {
      text: 'The ventilator, in and out. A heart monitor, slower and lower than Emily’s. Nothing else. No movement from the bed. There has not been any for a long time.',
    },
    objects: [
      {
        id: 'bed',
        name: 'Bed under the glass canopy',
        position: 'ahead',
        actions: [
          {
            id: 'examine',
            label: 'Look through the canopy',
            once: true,
            text: 'A man in his forties, thinner than he should be, his hair grown long. Tubes, wires, a ventilator mask. His eyes are closed. His hands lie on the sheet, and there is still ink on his fingers, faded almost to nothing. You know this face from the photo in his office. It is Daniel.',
            afterText: 'Daniel’s body, breathing because a machine tells it to.',
            effects: [{ sound: 'stinger.soft' }, { setFlag: 'saw_body' }, { objective: { id: 'find_daniel', status: 'done' } }, { startDialogue: 'daniel_body' }],
          },
        ],
      },
      {
        id: 'chart',
        name: 'Chart on a clipboard',
        position: 'left',
        actions: [
          {
            id: 'read',
            label: 'Read the chart',
            once: true,
            text: 'Neat, clinical handwriting, updated every day for a very long time. The last entry is recent.',
            afterText: 'The chart is in your journal.',
            effects: [{ addDocument: 'doc_body_chart' }],
          },
        ],
      },
      {
        id: 'frame',
        name: 'Empty frame',
        position: 'right',
        actions: [
          {
            id: 'examine',
            label: 'Examine',
            text: 'A standing cradle of steel and cable, built to hold a body upright: not a human one. The clamps are open. Whatever stood here is gone. A plate on the frame: TRANSFER RECIPIENT. Under it, a strip of tape with one word written in marker: RELOCATED.',
            effects: [{ setFlag: 'saw_frame' }],
          },
        ],
      },
    ],
    exits: [{ id: 'south', dir: 'south', to: 'b2_hall', label: 'Main hall', sound: 'door.heavy' }],
  },
};

// Things added to rooms from earlier chapters.
export const roomAdditions = {
  storage: {
    exits: [
      {
        id: 'down',
        dir: 'down',
        to: 'b2_lift',
        label: 'Freight lift down to Sublevel 2',
        when: { flag: 'ch4_started' },
        sound: 'elevator.open',
        time: 3,
        text: 'You turn 001’s key. The cage drops.',
      },
    ],
  },
  medical_ward: {
    objects: [
      {
        id: 'revive',
        name: 'Revival panel on Emily’s capsule',
        position: 'right',
        when: emilyAsleep,
        actions: [
          {
            id: 'enter',
            label: 'Enter the revival codes',
            when: { has: 'revival_codes' },
            cue: 'power.on',
            text: 'You type the codes one by one, checking each twice. The capsule thinks about it. Then it hisses. The frost on the glass turns to water and runs down in lines, and the lid unseals with a sigh.',
            effects: [{ wardEnd: true }, { objective: { id: 'wake_emily', status: 'done' } }, { objective: { id: 'keep_emily_alive', status: 'done' } }, { startDialogue: 'emily_wakes' }],
          },
          {
            id: 'examine',
            label: 'Examine',
            text: 'A small panel on the capsule frame: REVIVAL. ENTER AUTHORIZATION CODES.',
          },
        ],
      },
      {
        id: 'emily_person',
        name: 'Emily',
        position: 'right',
        when: [{ flag: 'emily_awake' }, { emilyAlive: true }],
        actions: [
          {
            id: 'talk',
            label: 'Talk to Emily',
            effects: [{ startDialogue: 'emily_talk' }],
          },
        ],
      },
    ],
  },
};
