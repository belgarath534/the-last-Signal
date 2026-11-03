// Chapter 2 — "Preservation". Sublevel 1.
// Same room format as chapter1/rooms.js.

const anyCell = { any: [{ has: 'power_cell_a' }, { has: 'power_cell_b' }, { has: 'power_cell_c' }] };
const useCell = { useOne: ['power_cell_a', 'power_cell_b', 'power_cell_c'] };
const emilyHere = { emilyIn: 'ward' };

export const rooms = {
  b1_landing: {
    id: 'b1_landing',
    name: 'Sublevel 1, elevator landing',
    shortName: 'elevator landing',
    zone: 'sublevel',
    soundscape: 'sublevel',
    description:
      'The elevator doors open onto a low concrete landing. The air is cold and smells of disinfectant, with something sweeter underneath. Strips of emergency light run along the floor. Painted signs: LABORATORIES straight ahead. MEDICAL WARD on your right. STORAGE on your left. The elevator is behind you.',
    revisit: 'The elevator landing. Laboratories ahead, medical ward on the right, storage on the left.',
    details: [
      { when: { notFlag: 'ward_door_powered' }, text: 'The medical ward door on your right is shut. The panel beside it is dark.' },
      { when: { flag: 'ward_door_powered' }, text: 'The medical ward door on your right stands open. Its panel glows green.' },
    ],
    listen: {
      text: 'A deep ventilation drone, slow, like breathing. From straight ahead, down the laboratory corridor, a faint, regular electronic beep.',
    },
    objects: [
      {
        id: 'ward_panel',
        name: 'Medical ward door panel',
        position: 'right',
        actions: [
          {
            id: 'examine',
            label: 'Examine',
            text: [
              { when: { notFlag: 'ward_door_powered' }, text: 'A dead keypad and, below it, an empty slot shaped for a portable power cell. A label: WARD EMERGENCY SUPPLY. INSERT CELL.' },
              { text: 'The panel glows green. A power cell sits in the emergency slot.' },
            ],
          },
          {
            id: 'insert',
            label: 'Insert a power cell',
            when: [anyCell, { notFlag: 'ward_door_powered' }],
            cue: 'card.accept',
            text: 'The cell slides in with a click. The panel lights, the lock thunks, and the ward door grinds open. Inside, machines begin to wake.',
            effects: [useCell, { setFlag: 'ward_door_powered' }, { objective: { id: 'power_ward', status: 'done' } }],
          },
        ],
      },
    ],
    exits: [
      {
        id: 'south',
        dir: 'south',
        to: 'b1_landing',
        label: 'Elevator',
        locked: true,
        lockedText: 'You press the call button. Nothing. The car will only come down; the emergency circuit you restored does not reach the surface call buttons.',
      },
      {
        id: 'north',
        dir: 'north',
        to: 'lab_corridor',
        label: 'Laboratory corridor',
        sound: 'footsteps',
        locked: { flag: 'corridor_sealed' },
        lockedText: 'A steel security shutter has come down across the corridor, floor to ceiling. You hit it with your fist. Somewhere on the other side, Sarah is hitting it too.',
      },
      {
        id: 'east',
        dir: 'east',
        to: 'medical_ward',
        label: 'Medical ward',
        locked: { notFlag: 'ward_door_powered' },
        lockedText: 'The medical ward door is sealed. The panel beside it is dark. There is an empty slot for a power cell.',
      },
      { id: 'west', dir: 'west', to: 'storage', label: 'Storage' },
    ],
  },

  lab_corridor: {
    id: 'lab_corridor',
    name: 'Laboratory corridor',
    zone: 'sublevel',
    soundscape: 'sublevel',
    description:
      'Glass-walled laboratories line both sides, most of them dark and empty. One wall of glass on your right has been smashed outward and lies across the floor. On your left, a door marked TRANSFER SUITE. Straight ahead, the corridor ends at a heavy insulated door: PRESERVATION. A speaker grille hangs above you.',
    revisit: 'The laboratory corridor. Transfer suite on the left, preservation lab ahead, the landing behind.',
    listen: {
      text: 'Glass shifts under your boots. Ahead, through the heavy door, a slow electronic beep, about once a second. A heart monitor.',
      effects: [{ sound: 'monitor' }],
    },
    objects: [
      {
        id: 'glass',
        name: 'Smashed glass wall',
        position: 'right',
        actions: [
          {
            id: 'examine',
            label: 'Examine',
            text: 'The glass was broken from inside the lab, outward into the corridor. Whatever did it was strong. Inside the lab, nothing but an empty workbench and a chair on its side.',
          },
        ],
      },
    ],
    exits: [
      { id: 'south', dir: 'south', to: 'b1_landing', label: 'Elevator landing', sound: 'footsteps' },
      { id: 'west', dir: 'west', to: 'transfer_suite', label: 'Transfer suite' },
      { id: 'north', dir: 'north', to: 'preservation_lab', label: 'Preservation lab', sound: 'door.heavy' },
    ],
  },

  transfer_suite: {
    id: 'transfer_suite',
    name: 'Transfer suite',
    zone: 'sublevel',
    soundscape: 'transfer',
    description:
      'A clean, white room that has not been cleaned in a long time. In the centre, a reclined chair with straps at the wrists, the ankles and the forehead. Behind it, racks of equipment cabled into the ceiling. On a trolley to your right, a portable recorder. On your left, a workbench and a sealed metal case.',
    revisit: 'The transfer suite. The chair in the centre, recorder on the right, workbench and case on the left.',
    listen: {
      text: 'The equipment racks tick as they cool, though nothing should be warm in here. A faint electrical crackle comes and goes, like a connection being tried and failing.',
    },
    objects: [
      {
        id: 'chair',
        name: 'Restraint chair',
        position: 'ahead',
        actions: [
          {
            id: 'examine',
            label: 'Examine',
            text: 'The straps are worn pale where someone pulled against them. On the right armrest, scratched into the vinyl again and again, as if with a fingernail: I DID NOT AGREE.',
            effects: [{ setFlag: 'saw_chair' }],
          },
        ],
      },
      {
        id: 'recorder',
        name: 'Portable recorder',
        position: 'right',
        actions: [
          {
            id: 'play',
            label: 'Play the recording',
            cue: 'tape',
            once: true,
            text: 'You press play. Two voices, close to the microphone. A third sound under them: someone breathing hard against a strap.',
            afterText: 'The transcript is in your journal. You do not want to hear it again.',
            effects: [{ addRecording: 'rec_transfer_log' }],
          },
        ],
      },
      {
        id: 'workbench',
        name: 'Workbench',
        position: 'left',
        actions: [
          {
            id: 'examine',
            label: 'Examine',
            text: [
              { when: { notFlag: 'took_cell_a' }, text: 'Tools, cable ties, a coffee cup furred with mould. At the back, still in its charger, a portable power cell. Its light is green.' },
              { text: 'Tools, cable ties, a coffee cup furred with mould, and an empty charger.' },
            ],
          },
          {
            id: 'take_cell',
            label: 'Take the power cell',
            when: { notFlag: 'took_cell_a' },
            effects: [{ give: 'power_cell_a' }, { setFlag: 'took_cell_a' }],
          },
        ],
      },
      {
        id: 'case',
        name: 'Sealed metal case',
        position: 'left',
        actions: [
          {
            id: 'examine',
            label: 'Examine',
            text: 'A heavy case with two latches. One latch is broken.',
          },
          {
            id: 'open',
            label: 'Work the broken latch open',
            once: true,
            cue: 'latch',
            text: 'It takes a while. When the lid finally lifts, there is only grey foam inside, cut to hold something small and rectangular. Whatever it was, it is gone. A label is stuck inside the lid.',
            afterText: 'Empty foam, and the label: TRANSFER. SECONDARY. The destination has been scratched out.',
            effects: [{ addDocument: 'doc_case_label' }, { secret: 'transfer_case' }],
          },
        ],
      },
    ],
    exits: [{ id: 'east', dir: 'east', to: 'lab_corridor', label: 'Laboratory corridor' }],
  },

  preservation_lab: {
    id: 'preservation_lab',
    name: 'Preservation lab',
    zone: 'sublevel',
    soundscape: 'cold_lab',
    description: [
      {
        when: { notFlag: 'found_emily' },
        text: 'Cold hits you like a wall. Your breath clouds. Along the wall on your right stands a row of tall glass capsules, frosted white. All of them are dark except one. That one glows a faint blue, and behind the frost there is a shape. On your left, a terminal screen glows.',
      },
      {
        when: { emilyIn: 'capsule' },
        text: 'The cold room. Emily’s capsule glows blue on your right, its monitor beeping. The terminal glows on your left.',
      },
      { text: 'The cold room. The row of capsules on your right, one of them empty now. The terminal glows on your left.' },
    ],
    listen: {
      text: [
        { when: { emilyAlive: false }, text: 'Only the hiss of the cooling system. Nothing else.' },
        { when: { notFlag: 'found_emily' }, text: 'A slow, steady beep from the glowing capsule on your right. Under it, the hiss of cold air. And something else: very faint, almost lost, the sound of someone breathing.' },
        { when: { emilyIn: 'capsule' }, text: 'Emily’s monitor beeps on your right. Her breathing is faint, but it is there.' },
        { text: 'The hiss of the cooling system around an empty capsule.' },
      ],
    },
    objects: [
      {
        id: 'capsule',
        name: 'Glowing capsule',
        position: 'right',
        when: { not: { emilyIn: 'ward' } },
        actions: [
          {
            id: 'examine',
            label: 'Examine',
            once: true,
            text: 'You wipe the frost from the glass with your sleeve. A woman lies inside, eyes closed, her hair pale with frost. The monitor above her beeps, slow, steady. A label on the capsule frame: CARTER, E. She is alive.',
            afterText: [
              { when: { emilyAlive: false }, text: 'Emily lies still behind the glass. The monitor is silent.' },
              { text: 'Emily Carter, asleep behind the glass. The capsule hums. The monitor beeps, slow and steady.' },
            ],
            effects: [
              { setFlag: 'found_emily' },
              { wardStart: { power: 60, stability: 70 } },
              { objective: 'save_emily' },
            ],
          },
          {
            id: 'status',
            label: 'Read the capsule status panel',
            when: [{ flag: 'found_emily' }, { emilyAlive: true }],
            time: 0,
            text: 'A small display on the capsule frame:',
            effects: [{ wardReport: true }],
          },
          {
            id: 'insert',
            label: 'Insert a power cell into the capsule',
            when: [{ emilyIn: 'capsule' }, anyCell],
            cue: 'card.accept',
            text: 'You slot the cell into the capsule’s backup bay. The blue glow brightens a little.',
            effects: [useCell, { wardAddPower: 35 }],
          },
          {
            id: 'clamps',
            label: 'Release the floor clamps',
            when: [{ emilyIn: 'capsule' }, { notFlag: 'clamps_released' }],
            cue: 'latch',
            text: 'You find the release lever at the capsule’s base and pull. Four clamps let go of the floor with a bang. The capsule rocks on its wheeled cradle. It can be moved now, but only somewhere with power to plug it into: the medical ward.',
            effects: [{ setFlag: 'clamps_released' }],
          },
          {
            id: 'move',
            label: 'Wheel the capsule to the medical ward',
            when: [{ emilyIn: 'capsule' }, { flag: ['clamps_released', 'ward_door_powered'] }],
            cue: 'cart',
            time: 4,
            text: 'You put your shoulder to the cradle. It moves, heavy and slow, out through the insulated door, down the corridor, glass crunching under its wheels, across the landing and into the ward. The monitor beeps the whole way. In the life support bay, you line the capsule up with the dock and push it home. Cables find their sockets. The ward takes over.',
            effects: [
              { wardMoveIn: { power: 40 } },
              { moveTo: 'medical_ward' },
              { objective: { id: 'save_emily', status: 'done' } },
              { objective: 'keep_emily_alive' },
            ],
          },
        ],
      },
      {
        id: 'terminal',
        name: 'Terminal',
        position: 'left',
        actions: [
          {
            id: 'read',
            label: 'Read the records',
            once: true,
            text: 'Most of the files are locked. One log is open, as if the last person here had been reading it.',
            afterText: 'The preservation log is in your journal.',
            effects: [{ addDocument: 'doc_preservation_log' }, { objective: { id: 'retrieve_records', status: 'done' } }],
          },
          {
            id: 'send',
            label: 'Send the open records to Daniel',
            when: [{ flag: 'daniel_contacted' }, { found: 'doc_preservation_log' }, { notFlag: 'records_sent' }],
            text: 'You find the transfer option and pick the facility network. A progress bar crawls across the screen, then fills. Sent.',
            effects: [{ setFlag: 'records_sent' }],
          },
        ],
      },
    ],
    exits: [{ id: 'south', dir: 'south', to: 'lab_corridor', label: 'Laboratory corridor', sound: 'door.heavy' }],
  },

  medical_ward: {
    id: 'medical_ward',
    name: 'Medical ward',
    zone: 'sublevel',
    soundscape: 'ward',
    description:
      'Rows of beds under plastic sheets. On your right, a life support bay with a docking cradle and a tangle of cables. On your left, a wall power bay with three slots. Ahead, a large status display.',
    revisit: 'The medical ward. Life support bay on the right, power bay on the left, display ahead.',
    details: [
      { when: [emilyHere, { emilyAlive: true }], text: 'Emily’s capsule is docked in the life support bay, its blue glow steady.' },
      { when: { all: [{ flag: 'found_emily' }, { emilyAlive: false }] }, text: 'The life support bay is silent.' },
    ],
    listen: {
      text: [
        { when: [emilyHere, { emilyAlive: true }], text: 'The soft pump of life support on your right, and Emily’s monitor beeping in time with it.' },
        { text: 'The hum of machines with nothing to do.' },
      ],
      details: [
        {
          when: { notFlag: 'heard_clipboard' },
          text: 'Paper flutters somewhere in the rows of beds, caught in the draft from a vent. Something has been left under one of the sheets.',
        },
      ],
      effects: [{ setFlag: 'heard_clipboard' }],
    },
    objects: [
      {
        id: 'emily',
        name: 'Emily’s capsule',
        position: 'right',
        when: emilyHere,
        actions: [
          {
            id: 'check',
            label: 'Check on Emily',
            when: { emilyAlive: true },
            time: 3,
            cue: 'monitor',
            text: [
              { when: { notFlag: 'checked_emily' }, text: 'You read the ward’s instructions taped to the bay and work through them slowly: oxygen mix, temperature, fluids. You wipe the frost from the glass. Her face is calm. Under your hand, the capsule is cold. The monitor’s rhythm evens out.' },
              { text: 'You go through the checks again: oxygen, temperature, fluids. Her breathing is steady. You stay a moment longer than you need to.' },
            ],
            effects: [{ wardStabilize: 100 }, { setFlag: 'checked_emily' }],
          },
          {
            id: 'examine_dead',
            label: 'Examine',
            when: { emilyAlive: false },
            text: 'Emily lies still behind the frosted glass. The monitor shows a flat line. You were too late.',
          },
        ],
      },
      {
        id: 'power_bay',
        name: 'Ward power bay',
        position: 'left',
        actions: [
          {
            id: 'examine',
            label: 'Examine',
            text: 'Three slots for portable power cells. Whatever is in them feeds the life support bay.',
          },
          {
            id: 'insert',
            label: 'Insert a power cell',
            when: [anyCell, emilyHere, { emilyAlive: true }],
            cue: 'card.accept',
            text: 'The cell clicks into a slot. The ward’s hum rises a little.',
            effects: [useCell, { wardAddPower: 35 }],
          },
        ],
      },
      {
        id: 'display',
        name: 'Status display',
        position: 'ahead',
        actions: [
          {
            id: 'read',
            label: 'Read the display',
            time: 0,
            text: [
              { when: emilyHere, text: 'The display shows one occupied bay.' },
              { text: 'The display shows every bay empty.' },
            ],
            effects: [{ wardReport: true }],
          },
        ],
      },
      {
        id: 'clipboard',
        name: 'Clipboard under a bed sheet',
        position: 'left',
        when: { flag: 'heard_clipboard' },
        actions: [
          {
            id: 'read',
            label: 'Read the clipboard',
            once: true,
            text: 'You lift the sheet. A clipboard, its pages soft with damp.',
            afterText: 'The revival protocol is in your journal.',
            effects: [{ addDocument: 'doc_revival_protocol' }, { secret: 'revival_protocol' }],
          },
        ],
      },
    ],
    exits: [{ id: 'west', dir: 'west', to: 'b1_landing', label: 'Elevator landing' }],
  },

  storage: {
    id: 'storage',
    name: 'Storage',
    zone: 'sublevel',
    soundscape: 'storage',
    description: [
      {
        when: { notFlag: 'woke_001' },
        text: 'Metal shelving to the ceiling, crowded with crates and parts. On your right, a charging rack with a few portable power cells. And in the middle of the floor ahead of you, standing on a low crate, something tall under a grey tarp.',
      },
      {
        when: { stalkerRecharging: true },
        text: 'Metal shelving to the ceiling. The charging rack on your right. Ahead, on its crate, Prototype 001 stands docked and still, whining softly as it charges. On your left, behind the shelves, the freight lift.',
      },
      {
        text: 'Metal shelving to the ceiling. The charging rack on your right. Ahead, the empty crate where 001 stood, its grey tarp in a heap on the floor. On your left, behind the shelves, the freight lift.',
      },
    ],
    revisit: [
      { when: { notFlag: 'woke_001' }, text: 'Storage. The charging rack on the right, the shape under the tarp ahead.' },
      { when: { stalkerRecharging: true }, text: 'Storage. 001 is docked ahead, charging. The freight lift on your left.' },
      { text: 'Storage. The empty crate ahead, the charging rack on the right, the freight lift on your left.' },
    ],
    listen: {
      text: [
        { when: { notFlag: 'woke_001' }, text: 'The charging rack clicks softly on your right. The shape under the tarp makes no sound at all. No fan, no hum, no standby tone. Complete silence, which is somehow worse.' },
        { when: { stalkerRecharging: true }, text: 'The rising whine of 001 charging, straight ahead. Under it, very softly, a heartbeat: three short, one long.' },
        { text: 'The charging rack clicks softly on your right. The crate ahead is empty and silent.' },
      ],
    },
    objects: [
      {
        id: 'rack',
        name: 'Charging rack',
        position: 'right',
        actions: [
          {
            id: 'examine',
            label: 'Examine',
            text: [
              { when: { notFlag: 'took_cells_bc' }, text: 'Most slots are empty or dead. Two cells still show a green light.' },
              { text: 'Every slot is empty or dead now.' },
            ],
          },
          {
            id: 'take',
            label: 'Take the two charged cells',
            when: { notFlag: 'took_cells_bc' },
            effects: [{ give: 'power_cell_b' }, { give: 'power_cell_c' }, { setFlag: 'took_cells_bc' }],
          },
        ],
      },
      {
        id: 'tarp',
        name: 'Shape under the tarp',
        position: 'ahead',
        when: { notFlag: 'ch3_started' },
        actions: [
          {
            id: 'examine',
            label: 'Lift the edge of the tarp',
            cue: 'tarp',
            text: [
              { when: { notFlag: 'saw_001' }, text: 'The shape is roughly human, and taller than you. You lift one corner of the tarp. A hand. Mechanical, beautifully made, the fingers half curled as if about to hold something. It does not move. No light, no hum. Stencilled on the crate beneath it: PROTOTYPE 001. DO NOT ACTIVATE. BOARD ORDER.' },
              { text: 'The mechanical hand, fingers half curled. PROTOTYPE 001. DO NOT ACTIVATE. It has not moved.' },
            ],
            effects: [{ setFlag: 'saw_001' }],
          },
        ],
      },
    ],
    exits: [{ id: 'east', dir: 'east', to: 'b1_landing', label: 'Elevator landing' }],
  },
};
