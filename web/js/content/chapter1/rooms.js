// Chapter 1 — "The Signal". Surface level of the facility.
//
// Room fields:
//   name, zone, soundscape         -- shown/announced on entry; drives ambience
//   description / revisit          -- full text on first visit / short text after
//   details: [{ when, text }]      -- extra lines that depend on state
//   listen: { text, details, effects }
//   objects: [{ id, name, position, when, actions: [{ id, label, text, afterText,
//              when, effects, once, hideAfter, cue, time }] }]
//   exits:   [{ id, dir, to, label, when, locked, lockedText, text, effects, time, sound }]
// Text fields accept a string or a list of { when, text } variants.

const powered = { flag: 'power_on' };
const dark = { notFlag: 'power_on' };

export const rooms = {
  patrol_car: {
    id: 'patrol_car',
    name: 'Patrol car, outside the facility',
    zone: 'outside',
    soundscape: 'car_rain',
    description:
      'You sit in the driver’s seat of your patrol car with the engine ticking as it cools. Rain drums on the roof. Through the windshield, the research facility is a dark block against a darker sky. Two years ago you walked out of that building and promised yourself you would not come back.',
    revisit: 'Your patrol car. Rain on the roof, the radio murmuring, the facility waiting outside.',
    listen: {
      text: 'Rain on the roof, heavy and even. The engine ticks. Under the hiss of your police radio, faint and patient, the signal repeats: three short tones, then one long one.',
      effects: [{ sound: 'signal' }],
    },
    objects: [
      {
        id: 'police_radio',
        name: 'Police radio',
        position: 'right',
        actions: [
          {
            id: 'listen',
            label: 'Listen to the radio',
            cue: 'radio.static',
            text: 'Dispatch is quiet tonight. Between transmissions you can hear it again: three short tones, one long. It has been repeating on an emergency band for six hours, and it is coming from the building in front of you.',
          },
          {
            id: 'notes',
            label: 'Review the call notes',
            once: true,
            text: 'You flip open the notepad clipped to the dash.',
            afterText: 'The call notes are in your journal.',
            effects: [{ addDocument: 'doc_dispatch_notes' }],
          },
        ],
      },
      {
        id: 'glovebox',
        name: 'Glovebox',
        position: 'right',
        actions: [
          {
            id: 'open',
            label: 'Open the glovebox',
            cue: 'latch',
            once: true,
            text: 'The latch sticks, then gives. Inside: registration papers, a dead lighter, and your flashlight. You test it. The beam is strong.',
            afterText: 'Registration papers and a dead lighter. Nothing else you need.',
            effects: [{ give: 'flashlight' }],
          },
        ],
      },
    ],
    exits: [
      {
        id: 'out',
        dir: 'out',
        to: 'front_gate',
        label: 'Step out into the rain',
        sound: 'car.door',
        text: 'You pull up your collar and step out. The rain finds you immediately.',
      },
    ],
  },

  front_gate: {
    id: 'front_gate',
    name: 'Front gate',
    zone: 'outside',
    soundscape: 'outdoor_rain',
    description:
      'A chain-link gate stands half open, its padlock hanging from a cut chain. Beside it, a small guard booth with a tin roof. Beyond, a short path leads to the glass doors of the main building. No lights anywhere.',
    revisit: 'The front gate. Rain on the guard booth’s roof. The building ahead, the car behind.',
    listen: {
      text: 'Rain on the guard booth’s tin roof, sharp and close on your left. Ahead, from inside the building, a thin pulse of static: the same pattern dispatch heard.',
      effects: [{ sound: 'signal' }],
    },
    objects: [
      {
        id: 'padlock',
        name: 'Cut padlock',
        position: 'ahead',
        actions: [
          {
            id: 'examine',
            label: 'Examine',
            text: 'The chain was cut cleanly, with bolt cutters. The cut ends are rusted. Whoever did this did it a long time ago.',
          },
        ],
      },
      {
        id: 'guard_booth',
        name: 'Guard booth',
        position: 'left',
        actions: [
          {
            id: 'search',
            label: 'Search the booth',
            once: true,
            text: 'The booth smells of wet paper. A clipboard hangs on a nail by the window: the visitor log.',
            afterText: 'An empty chair, a dead phone, and the nail where the visitor log hung.',
            effects: [{ addDocument: 'doc_visitor_log' }],
          },
        ],
      },
    ],
    exits: [
      { id: 'north', dir: 'north', to: 'reception', label: 'Main entrance', sound: 'door.glass' },
      { id: 'south', dir: 'south', to: 'patrol_car', label: 'Your patrol car', sound: 'car.door' },
    ],
  },

  reception: {
    id: 'reception',
    name: 'Reception lobby',
    zone: 'surface',
    soundscape: 'lobby',
    description: [
      {
        when: dark,
        text: 'The lobby is cold and smells of dust and old rain. Grey light from the doors behind you shows the shape of a long front desk ahead, a directory board on the wall to your left, and a staff photo board beside it. A doorway on your right is marked SECURITY. Straight ahead, past the desk, the main corridor disappears into total darkness.',
      },
      {
        when: powered,
        text: 'Emergency lights paint the lobby a dull red. The long front desk sits ahead, the directory board and staff photo board on your left, the security office door on your right. The main corridor ahead is lit now, faintly.',
      },
    ],
    revisit: 'The reception lobby. Front desk ahead, security on your right, the corridor straight on.',
    details: [
      {
        when: { notFlag: 'took_facility_radio' },
        text: 'Somewhere on the front desk, a small light is blinking. Three short, one long.',
      },
    ],
    listen: {
      text: [
        {
          when: { notFlag: 'took_facility_radio' },
          text: 'Water drips somewhere to your left. Ahead, on the front desk, a little speaker crackles in rhythm: three short tones, one long. The signal is coming from right here.',
        },
        { text: 'Water drips somewhere to your left. The building creaks as the wind leans on it. Nothing else answers.' },
      ],
    },
    objects: [
      {
        id: 'front_desk',
        name: 'Front desk',
        position: 'ahead',
        actions: [
          {
            id: 'examine',
            label: 'Examine',
            text: [
              {
                when: { notFlag: 'took_facility_radio' },
                text: 'Papers swollen with damp, a dead monitor, and a charging dock with one handheld facility radio still in it. Its status light blinks three short, one long. The radio’s speaker hisses in time with it.',
              },
              { text: 'Papers swollen with damp, a dead monitor, and an empty charging dock.' },
            ],
          },
          {
            id: 'take_radio',
            label: 'Take the facility radio',
            when: { notFlag: 'took_facility_radio' },
            cue: 'pickup',
            text: 'You lift the radio out of the dock. The blinking stops. The hiss stops. For a moment the lobby is completely silent.',
            effects: [
              { give: 'facility_radio' },
              { setFlag: 'took_facility_radio' },
              { objective: { id: 'find_signal', status: 'done' } },
            ],
          },
        ],
      },
      {
        id: 'directory',
        name: 'Directory board',
        position: 'left',
        actions: [
          {
            id: 'read',
            label: 'Read the directory',
            once: true,
            text: 'Plastic letters on felt, a few fallen to the floor.',
            afterText: 'The directory is copied into your journal.',
            effects: [{ addDocument: 'doc_directory' }],
          },
        ],
      },
      {
        id: 'staff_board',
        name: 'Staff photo board',
        position: 'left',
        actions: [
          {
            id: 'examine',
            label: 'Examine',
            once: true,
            text: 'Most of the photos have been taken down, leaving pale squares on the cork. A few remain, curling at the edges. One of them is you, two years younger, smiling for an ID camera. Beside your photo there is a gap. The name label under it still reads DR. E. CARTER.',
            afterText: 'Your old photo, and the empty space beside it labelled DR. E. CARTER.',
            effects: [{ setFlag: 'saw_carter_label' }],
          },
        ],
      },
    ],
    exits: [
      {
        id: 'north',
        dir: 'north',
        to: 'main_corridor',
        label: 'Main corridor',
        sound: 'footsteps',
        locked: { all: [{ notHas: 'flashlight' }, dark] },
        lockedText: 'You take one step into the corridor and stop. It is completely black in there. You would need a light. Your flashlight is in the patrol car’s glovebox.',
      },
      { id: 'east', dir: 'east', to: 'security_office', label: 'Security office' },
      { id: 'south', dir: 'south', to: 'front_gate', label: 'Front gate', sound: 'door.glass' },
    ],
  },

  security_office: {
    id: 'security_office',
    name: 'Security office',
    zone: 'surface',
    soundscape: 'office',
    description: [
      {
        when: dark,
        text: 'A cramped room. A bank of dead monitors covers the wall ahead. A desk with a logbook sits on your left. On your right, a grey breaker panel labelled EMERGENCY POWER, and beside it a row of staff lockers.',
      },
      {
        when: powered,
        text: 'The monitors ahead glow with nothing but static. Red emergency light falls across the desk and logbook on your left. The breaker panel on your right hums. Beside it, the row of staff lockers.',
      },
    ],
    revisit: 'The security office. Monitors ahead, logbook on the left, breaker panel and lockers on the right.',
    listen: {
      text: [
        { when: dark, text: 'Silence, mostly. The building settling. Your own breathing.' },
        { text: 'The breaker panel hums steadily on your right. The monitors whisper static.' },
      ],
      details: [
        {
          when: { notFlag: 'heard_locker' },
          text: 'And under it all, so soft you nearly miss it: a tiny electronic chirp, every few seconds, from low down among the lockers on your right. A low-battery warning.',
        },
      ],
      effects: [{ setFlag: 'heard_locker' }],
    },
    objects: [
      {
        id: 'logbook',
        name: 'Security logbook',
        position: 'left',
        actions: [
          {
            id: 'read',
            label: 'Read the logbook',
            once: true,
            text: 'The last pages are still legible.',
            afterText: 'The last logbook entries are in your journal.',
            effects: [{ addDocument: 'doc_security_log' }],
          },
        ],
      },
      {
        id: 'monitors',
        name: 'Monitors',
        position: 'ahead',
        actions: [
          {
            id: 'examine',
            label: 'Examine',
            text: [
              { when: dark, text: 'A dozen dead screens. Your flashlight shows your own reflection in each one.' },
              {
                text: 'Every screen shows static. One, bottom left, flickers for a moment into a grey image of a long corridor, then back to noise. The label under it reads SUBLEVEL.',
              },
            ],
          },
        ],
      },
      {
        id: 'breaker',
        name: 'Emergency power panel',
        position: 'right',
        actions: [
          {
            id: 'examine',
            label: 'Examine',
            text: [
              { when: dark, text: 'A heavy lever marked EMERGENCY POWER, currently down, and a row of smaller switches for each floor. The surface switch is labelled; the sublevel switches have been taped over.' },
              { text: 'The main lever is up and the panel hums. The sublevel switches are still taped over.' },
            ],
          },
          {
            id: 'restore',
            label: 'Pull the emergency power lever',
            when: dark,
            cue: 'power.on',
            text: 'You put your weight on the lever. It resists, then slams up. Somewhere deep in the walls, something heavy turns over. A rising whine. Then, one by one, red emergency lights come on along the ceiling.',
            effects: [{ setFlag: 'power_on' }, { objective: { id: 'restore_power', status: 'done' } }],
          },
        ],
      },
      {
        id: 'lockers',
        name: 'Staff lockers',
        position: 'right',
        actions: [
          {
            id: 'examine',
            label: 'Examine',
            text: [
              { when: { notFlag: 'heard_locker' }, text: 'A row of dented grey lockers, most hanging open and empty.' },
              { when: { notFlag: 'took_override' }, text: 'A row of dented grey lockers. The chirping is coming from the bottom one at the end. It is still shut, and dented as if someone kicked it closed.' },
              { text: 'A row of dented grey lockers, all open now.' },
            ],
          },
          {
            id: 'force',
            label: 'Force open the bottom locker',
            when: [{ flag: 'heard_locker' }, { notFlag: 'took_override' }],
            cue: 'locker',
            text: 'You wedge your fingers into the bent door and pull until it screeches open. Inside: a dead walkie-talkie, still chirping its battery warning, and taped to the back wall, a red keycard with a folded note.',
            effects: [
              { give: 'override_card' },
              { addDocument: 'doc_override_note' },
              { setFlag: 'took_override' },
              { secret: 'override_card' },
            ],
          },
        ],
      },
    ],
    exits: [{ id: 'west', dir: 'west', to: 'reception', label: 'Reception lobby' }],
  },

  main_corridor: {
    id: 'main_corridor',
    name: 'Main corridor',
    zone: 'surface',
    soundscape: 'corridor',
    description: [
      {
        when: dark,
        text: 'Your flashlight beam runs down a long corridor and does not find the end. Doors on either side. A noticeboard on your right. On your left, a door with a scraped nameplate. At the far end, the steel doors of an elevator, and beside them a stairwell door wrapped in chain. High on the wall above you, a speaker grille.',
      },
      {
        when: powered,
        text: 'Emergency lights run the length of the corridor in a dotted red line. The noticeboard is on your right, the office with the scraped nameplate on your left. At the far end, the elevator, and the chained stairwell door. The speaker grille above you has a small green light now.',
      },
    ],
    revisit: 'The main corridor. Office on the left, noticeboard on the right, elevator ahead, lobby behind.',
    listen: {
      text: 'The corridor swallows sound. Your footsteps come back to you late. And far below your feet, so faint it could be your imagination, something mechanical shifts. Stops. Shifts again.',
      effects: [{ sound: 'deep.machine' }],
    },
    objects: [
      {
        id: 'noticeboard',
        name: 'Noticeboard',
        position: 'right',
        actions: [
          {
            id: 'read',
            label: 'Read the memo pinned on top',
            once: true,
            text: 'One memo has been pinned over all the others, with four pins instead of one.',
            afterText: 'The memo is in your journal.',
            effects: [{ addDocument: 'doc_reassignment_memo' }],
          },
        ],
      },
      {
        id: 'speaker',
        name: 'Speaker grille',
        position: 'ahead',
        actions: [
          {
            id: 'examine',
            label: 'Examine',
            text: [
              { when: dark, text: 'A public address speaker, dead and dusty.' },
              { text: 'A public address speaker with a small green light. It is on. Someone could be listening through it, too.' },
            ],
          },
        ],
      },
      {
        id: 'elevator_panel',
        name: 'Elevator call panel',
        position: 'ahead',
        actions: [
          {
            id: 'examine',
            label: 'Examine',
            text: [
              { when: dark, text: 'A call button and a card reader. Both dead. There is no power.' },
              { when: { notFlag: 'elevator_unlocked' }, text: 'The panel is lit, but the card reader blinks red: RESTRICTED. AUTHORIZATION REQUIRED.' },
              { text: 'The card reader glows green. The elevator is ready.' },
            ],
          },
          {
            id: 'swipe',
            label: 'Swipe the red override card',
            when: [{ has: 'override_card' }, powered, { notFlag: 'elevator_unlocked' }],
            cue: 'card.accept',
            text: 'You swipe the red card. The reader thinks about it for a long second, then chimes and turns green. Behind the steel doors, cables begin to move.',
            effects: [
              { setFlag: ['elevator_unlocked', 'used_override'] },
              { objective: { id: 'find_way_down', status: 'done' } },
            ],
          },
        ],
      },
    ],
    exits: [
      {
        id: 'west',
        dir: 'west',
        to: 'robotics_office',
        label: 'Office with the scraped nameplate',
      },
      {
        id: 'north',
        dir: 'north',
        to: 'elevator_car',
        label: 'Elevator to the lower levels',
        sound: 'elevator.open',
        locked: { not: { all: [powered, { flag: 'elevator_unlocked' }] } },
        lockedText: [
          { when: dark, text: 'You press the call button. Nothing. The elevator has no power.' },
          { text: 'You press the call button. The card reader blinks red: RESTRICTED. AUTHORIZATION REQUIRED. You need clearance, or someone who can give it.' },
        ],
      },
      {
        id: 'east',
        dir: 'east',
        to: 'main_corridor',
        label: 'Chained stairwell door',
        when: { notFlag: 'chain_cut' },
        locked: true,
        lockedText: 'The chain is heavy and new, much newer than anything else here. It is not coming off without tools you do not have.',
      },
      { id: 'south', dir: 'south', to: 'reception', label: 'Reception lobby', sound: 'footsteps' },
    ],
  },

  robotics_office: {
    id: 'robotics_office',
    name: 'Robotics director’s office',
    zone: 'surface',
    soundscape: 'office',
    description:
      'A corner office that someone once loved. Shelves of mechanical parts and books. A desk ahead with a stack of papers and an old answering machine. A framed photo on the shelf to your left. On your right, a whiteboard covered in sketches of a hand: joints, tendons, a hundred small corrections.',
    revisit: 'The robotics director’s office. Desk ahead, photo on the left, whiteboard on the right.',
    listen: {
      text: 'It is quieter in here than in the corridor, as if the room is holding its breath. On the desk, the answering machine has a faint electrical whine. It still has power from somewhere.',
    },
    objects: [
      {
        id: 'desk',
        name: 'Desk',
        position: 'ahead',
        actions: [
          {
            id: 'read',
            label: 'Read the papers',
            once: true,
            text: 'Under the dust, a bound document with a coffee ring on the cover.',
            afterText: 'The project proposal is in your journal.',
            effects: [{ addDocument: 'doc_proposal' }],
          },
        ],
      },
      {
        id: 'answering_machine',
        name: 'Answering machine',
        position: 'ahead',
        actions: [
          {
            id: 'play',
            label: 'Play the message',
            cue: 'tape',
            once: true,
            text: 'A click, a whir, and a woman’s voice, quick and quiet, as if she is afraid of being overheard.',
            afterText: 'The tape is saved in your journal. The machine clicks and waits.',
            effects: [{ addRecording: 'rec_emily_voicemail' }],
          },
        ],
      },
      {
        id: 'photo',
        name: 'Framed photo',
        position: 'left',
        actions: [
          {
            id: 'examine',
            label: 'Examine',
            text: 'Two people at a robotics expo, laughing at something out of frame. A man in his forties with ink on his fingers, and a woman wearing a lanyard: DR. E. CARTER. Between them on the table, a robotic hand, posed mid-wave.',
            effects: [{ setFlag: 'saw_photo' }],
          },
        ],
      },
      {
        id: 'whiteboard',
        name: 'Whiteboard',
        position: 'right',
        actions: [
          {
            id: 'examine',
            label: 'Examine',
            text: 'Sketches of a hand, over and over, each one gentler than the last. In the corner, a number circled twice: 001.',
          },
          {
            id: 'turn',
            label: 'Look behind the whiteboard',
            once: true,
            text: 'You tilt the board away from the wall. On the back, in the same careful handwriting: “001. First of its kind. Teach it kindness before anything else.” Below, in a different hand, harder and slanted: “Kindness is not a requirement.”',
            afterText: '“Teach it kindness before anything else.” And below it: “Kindness is not a requirement.”',
            effects: [{ setFlag: 'saw_whiteboard_back' }, { secret: 'whiteboard' }],
          },
        ],
      },
    ],
    exits: [{ id: 'east', dir: 'east', to: 'main_corridor', label: 'Main corridor' }],
  },

  elevator_car: {
    id: 'elevator_car',
    name: 'Elevator',
    zone: 'surface',
    soundscape: 'elevator',
    description: 'You step into the elevator. The doors slide shut behind you. There is only one button that is not taped over. It is marked B1.',
    exits: [{ id: 'out', dir: 'out', to: 'main_corridor', label: 'Step back out', sound: 'elevator.open' }],
    objects: [],
  },
};
