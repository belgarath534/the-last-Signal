// Part Two, Chapter 1 — "Summons".
// Months after Part One. The opening depends on which ending you reached;
// then you are arrested for a murder you did not commit.
// Decided by Claude at the creator's request (see the story bible, Part Two).

const romance = { flag: 'ending_romance' };
const restored = { flag: 'ending_restored' };
const proto = { flag: 'ending_prototype' };
const revenge = { flag: 'ending_revenge' };
const alone = { any: [{ flag: 'ending_lost' }, { flag: 'ending_abandon' }] };
const emilyHere = [{ flag: 'emily_awake' }, { emilyAlive: true }];

const rooms = {
  apartment: {
    id: 'apartment',
    name: 'Your apartment',
    zone: 'city',
    soundscape: 'apartment',
    description: [
      { when: romance, text: 'Your small apartment smells of garlic and something burning slightly. Emily is at the stove on your left, laughing at Daniel, who is setting your table on the right with great care and too many forks. On the kitchen table ahead, where you always keep it, the old facility radio. By the front door behind you, your coat.' },
      { when: proto, text: 'Your small apartment. On your right, 001 is standing at your stove, stirring a pot with enormous care, the way it does everything now. When it speaks, it speaks with Daniel’s voice. On the kitchen table ahead, the old facility radio. The front door is behind you.' },
      { text: 'Your small apartment, quiet except for the fridge. A TV on your left. On the kitchen table ahead, where you always keep it, the old facility radio. You have never been able to throw it away. The front door is behind you.' },
    ],
    revisit: 'Your apartment. The radio on the table ahead, the front door behind you.',
    listen: {
      text: [
        { when: romance, text: 'Two voices, laughing at the stove. A pan sizzling. Rain on the window.' },
        { when: proto, text: 'A wooden spoon on a pot, slow and careful. A soft whir. Rain on the window.' },
        { text: 'The fridge hums. Rain on the window. Your own breathing.' },
      ],
    },
    objects: [
      {
        id: 'radio',
        name: 'Old facility radio',
        position: 'ahead',
        actions: [
          {
            id: 'examine',
            label: 'Examine',
            text: 'The handheld radio from the reception desk, months ago. The battery should have died long ago. Its little light is on.',
          },
        ],
      },
      {
        id: 'tv',
        name: 'TV',
        position: 'left',
        when: { not: { any: [romance, proto] } },
        actions: [
          {
            id: 'watch',
            label: 'Turn up the news',
            text: [
              { when: revenge, text: 'News anchor: Police are investigating the death of Dr. Alan Pryce, a former director of a private research company, found at his home tonight. He is the fourth former board member of the company to die this year. Police are not commenting on a possible connection.' },
              { text: 'News anchor: Police are investigating the death of Dr. Alan Pryce, a former director of a private research company, found at his home tonight. A source close to the investigation says a police radio was found at the scene.' },
            ],
            effects: [{ setFlag: 'heard_pryce_news' }],
          },
        ],
      },
      {
        id: 'couple',
        name: 'Emily and Daniel',
        position: 'left',
        when: romance,
        actions: [{ id: 'talk', label: 'Talk to them', effects: [{ startDialogue: 'p2_couple' }] }],
      },
      {
        id: 'daniel_001',
        name: 'Daniel, in 001’s body',
        position: 'right',
        when: proto,
        actions: [{ id: 'talk', label: 'Talk to Daniel', effects: [{ startDialogue: 'p2_proto_talk' }] }],
      },
    ],
    exits: [
      {
        id: 'door',
        dir: 'out',
        to: 'apartment',
        label: 'Front door',
        when: { notFlag: 'p2c2_started' },
        locked: true,
        lockedText: 'You reach for the handle, and someone on the other side knocks first. Three hard knocks.',
      },
    ],
  },

  interview_room: {
    id: 'interview_room',
    name: 'Interview room, police station',
    zone: 'city',
    soundscape: 'station',
    description: 'A grey room you have sat in a hundred times, always on the other side of the table. A metal table ahead, bolted down. A long mirror on your left that is not a mirror. The camera light in the corner is red.',
    revisit: 'The interview room. The table ahead, the mirror on your left.',
    listen: { text: 'Fluorescent lights buzzing. Through the door, phones ringing and people you used to work with, talking quietly about you.' },
    objects: [
      {
        id: 'mirror',
        name: 'Mirror',
        position: 'left',
        actions: [{ id: 'examine', label: 'Examine', text: 'Your own face, tired. Somewhere behind it, people are watching you the way you used to watch suspects.' }],
      },
    ],
    exits: [],
  },

  holding_cell: {
    id: 'holding_cell',
    name: 'Holding cell',
    zone: 'city',
    soundscape: 'cell',
    description: 'A narrow cell. A steel cot on your right. Bars ahead, and a corridor light beyond them. On your left, low on the wall, an air vent.',
    revisit: 'The holding cell. The cot on the right, the vent on the left, the bars ahead.',
    listen: {
      text: 'A tap drips somewhere down the corridor. A drunk two cells over is singing to himself.',
      details: [{ when: { notFlag: 'heard_vent' }, text: 'And from the vent on your left, very faintly, someone tapping on a pipe. Three short. One long.' }],
      effects: [{ setFlag: 'heard_vent' }],
    },
    objects: [
      {
        id: 'vent',
        name: 'Air vent',
        position: 'left',
        actions: [{ id: 'listen', label: 'Put your ear to the vent', effects: [{ setFlag: 'heard_vent' }] }],
      },
      {
        id: 'cot',
        name: 'Steel cot',
        position: 'right',
        actions: [{ id: 'sit', label: 'Sit down', text: 'The steel is cold through your clothes. You think about everyone you ever put in a cell like this, and wonder how many of them were telling the truth.' }],
      },
    ],
    exits: [],
  },
};

const dialogues = {
  p2_open: {
    start: [
      { when: romance, node: 'romance' },
      { when: restored, node: 'restored' },
      { when: proto, node: 'proto' },
      { when: revenge, node: 'revenge' },
      { node: 'alone' },
    ],
    nodes: {
      romance: {
        speaker: 'emily',
        lines: [
          { narration: 'Months have passed. Daniel walks with a cane now, and hates it, and uses it anyway because Emily makes him.' },
          'Sit down. You’re a guest in your own home tonight. That’s an order.',
          { speaker: 'daniel', text: 'She orders everyone around now. I think the capsule made her worse.' },
          { narration: 'Emily throws a dish towel at him. He catches it, slowly, carefully, and does not drop it, and looks at his own hand for a moment as if it is a small miracle. It is.' },
        ],
        next: 'romance2',
      },
      romance2: {
        speaker: 'daniel',
        lines: [
          { narration: 'Halfway through dinner, he puts his fork down.' },
          'I never said it. Eleven years, two years in a box and on a wall, and I never once said it out loud.',
          { narration: 'He turns to Emily.' },
          'I love you, Em.',
          { speaker: 'emily', text: 'I know. I came back to that building to tell you the same thing. It took me a while to get there.' },
          { speaker: 'emily', text: 'I love you too.' },
          { narration: 'Nobody says anything for a while. The rain keeps on at the window. Daniel reaches across the table, and this time his hand closes around hers without shaking.' },
        ],
        effects: [{ setFlag: 'p2_love_said' }],
        next: 'settle',
      },
      restored: {
        speaker: 'daniel',
        lines: [
          { narration: 'Months have passed. Your phone rings. You know the number.' },
          'It’s me. I walked to the end of the street today. On my own legs.',
          'I wanted to tell someone who would understand what that means. You’re the only one.',
        ],
        next: 'settle',
      },
      proto: {
        speaker: 'daniel',
        lines: [
          { narration: 'Months have passed. Daniel, in the body he designed, has decided that you do not eat properly and is fixing it.' },
          'Sit. I have been practising soup for three weeks. Emily says it is the best soup a machine has ever made.',
          { when: { flag: 'emily_awake' }, text: 'She’ll be here later. She is bringing bread. Two loaves. One of them is a mistake.' },
        ],
        next: 'settle',
      },
      revenge: {
        lines: [
          { narration: 'Months have passed. You have not heard from Daniel since he walked out into the rain. You have heard about him, though. Every time the news mentions the board, you turn the volume up.' },
        ],
        next: 'settle',
      },
      alone: {
        lines: [
          { narration: 'Months have passed. You went back to work. You do not talk about the facility. Some nights you take the old radio out of the drawer and set it on the kitchen table, and listen to the static, and wait.' },
          { narration: 'Tonight, for the first time, the radio clicks on by itself. Three short tones. One long.' },
        ],
        effects: [{ sound: 'signal' }],
        next: 'settle',
      },
      settle: {
        lines: [],
        effects: [{ schedule: { event: 'p2_knock', in: 3 } }, { objective: 'p2_evening' }],
        end: true,
      },
    },
  },

  p2_couple: {
    start: 'only',
    nodes: {
      only: {
        speaker: 'emily',
        lines: [
          { when: { flag: 'p2_love_said' }, text: 'Don’t look at us like that. We’re allowed to be happy. You of all people made sure of it.' },
          { speaker: 'daniel', text: 'Two coffees tomorrow. Neither of them a mistake.' },
        ],
        end: true,
      },
    },
  },

  p2_proto_talk: {
    start: 'only',
    nodes: {
      only: {
        speaker: 'daniel',
        lines: ['The radio on your table. It has been doing something strange today. Clicking. I can hear it from here.', 'I do not like it.'],
        end: true,
      },
    },
  },

  arrest: {
    start: 'open',
    nodes: {
      open: {
        speaker: 'ruiz',
        lines: [
          { narration: 'Three hard knocks on the front door. Before you can answer it, it opens. Detective Ruiz, who sat across from you in a patrol car for three years, stands in your doorway with two uniformed officers behind her. She does not look happy to see you.' },
          'Evening.',
          'You need to come with me. You’re under arrest for the murder of Dr. Alan Pryce.',
          { when: romance, speaker: 'emily', text: 'What? No. They’ve been here with us all night.' },
          { when: proto, speaker: 'daniel', text: 'This is wrong. I have been here with them all evening.' },
        ],
        choices: [
          { text: 'Go quietly.', effects: [{ setFlag: 'went_quietly' }], next: 'cuffs' },
          { text: 'This is a mistake, Ruiz. I’ve never heard of Alan Pryce.', next: 'mistake' },
          { text: 'Is this about the facility?', next: 'facility' },
        ],
      },
      mistake: {
        speaker: 'ruiz',
        lines: ['Then you’ll have no trouble explaining why your badge number was written on a note in his hand.'],
        next: 'cuffs',
      },
      facility: {
        speaker: 'ruiz',
        lines: [{ narration: 'Something flickers in her face.' }, 'Funny you should bring that up. Turn around, please.'],
        next: 'cuffs',
      },
      cuffs: {
        speaker: 'ruiz',
        lines: [
          'You have the right to remain silent. You know the rest.',
          { narration: 'The cuffs are colder than you remember. On the kitchen table, the old radio clicks once, and goes quiet.' },
        ],
        effects: [
          { objective: { id: 'p2_evening', status: 'done' } },
          { setClock: { hour: 23, minute: 40 } },
          { moveTo: 'interview_room' },
          { startDialogue: 'interrogation' },
        ],
      },
    },
  },

  interrogation: {
    start: 'open',
    nodes: {
      open: {
        speaker: 'ruiz',
        lines: [
          { narration: 'Ruiz sits across the table and lays a folder down between you. She does not open it yet.' },
          'Alan Pryce. Former director at a research company that shut down two years ago. Found dead in his study at eleven tonight.',
          'On his desk, a police radio, playing a recording on a loop. Three short tones and one long. In his hand, a note with your badge number on it. And in his drawer, a page torn from that company’s visitor log, with your name on it, dated the night of that emergency call you answered.',
        ],
        effects: [{ sound: 'stinger.soft' }, { addDocument: 'doc_p2_charge' }, { addDocument: 'doc_p2_scene' }],
        choices: [
          { text: 'I want a lawyer.', effects: [{ setFlag: 'asked_lawyer' }], next: 'lawyer' },
          { text: 'I was at that facility. I’ll tell you everything.', effects: [{ setFlag: 'told_ruiz_story' }], next: 'story' },
          {
            text: 'I was never anywhere near that facility.',
            effects: [{ setFlag: 'denied_facility' }, { lie: { id: 'facility_denial', about: 'ever being at the facility' } }],
            next: 'denied',
          },
        ],
      },
      lawyer: {
        speaker: 'ruiz',
        lines: ['Smart. You always were.', { narration: 'She closes the folder. At the door she stops.' }, 'For what it’s worth, the tip that gave us your name came in anonymously at three this morning, hours before anyone found the body. Whoever called played that sound down the phone before they hung up. Three short, one long.'],
        effects: [{ setFlag: 'knows_early_tip' }],
        next: 'phone',
      },
      story: {
        speaker: 'ruiz',
        lines: [
          { narration: 'You tell her. The signal. Daniel. The capsules. The machine with a man inside it. She listens without interrupting, the way you were both trained to.' },
          { when: { any: [romance, restored] }, text: 'And this Daniel. He’s alive. Walking around. He’ll say all this under oath?' },
          { when: proto, text: 'And the man in the robot is cooking soup in your kitchen. You understand how that sounds.' },
          { when: { any: [revenge, { flag: 'ending_lost' }, { flag: 'ending_abandon' }] }, text: 'And there’s nobody who can back any of this up.' },
          'Where were you between ten and midnight tonight?',
        ],
        choices: [
          { text: 'At home, with Emily and Daniel.', when: [romance], effects: [{ setFlag: 'alibi_friends' }], next: 'alibi' },
          { text: 'At home. Daniel was there. In 001’s body.', when: [proto], effects: [{ setFlag: 'alibi_machine' }], next: 'alibi_machine' },
          { text: 'At home. On the phone with Daniel for part of it.', when: [restored], effects: [{ setFlag: 'alibi_phone' }], next: 'alibi' },
          { text: 'At home. Alone.', when: { not: { any: [romance, proto] } }, effects: [{ setFlag: 'no_alibi' }], next: 'alone' },
        ],
      },
      alibi: {
        speaker: 'ruiz',
        lines: ['We’ll talk to them.', { narration: 'She writes it down. She does not look convinced, but she does not look certain either.' }, 'The tip that gave us your name came in at three this morning. Hours before anyone found him. Whoever called played that sound down the phone.'],
        effects: [{ setFlag: 'knows_early_tip' }],
        next: 'phone',
      },
      alibi_machine: {
        speaker: 'ruiz',
        lines: ['A robot is your alibi.', { narration: 'She rubs her eyes.' }, 'I’ll be honest with you. I don’t know if a jury will even let it testify. But the tip with your name came in at three this morning, hours before anyone found the body. That bothers me.'],
        effects: [{ setFlag: 'knows_early_tip' }],
        next: 'phone',
      },
      alone: {
        speaker: 'ruiz',
        lines: ['Alone.', { narration: 'She writes it down slowly.' }, 'That’s going to hurt you.'],
        next: 'phone',
      },
      denied: {
        speaker: 'ruiz',
        lines: [
          { narration: 'She opens the folder and slides a printout across the table: a dispatch log. Unit 14. Signal call. Your call sign, your voice, timestamped at the facility gate.' },
          'Try again.',
        ],
        effects: [{ exposeLie: { id: 'facility_denial', penalty: 0, reason: 'lied to the police' } }, { setFlag: 'caught_lying_to_ruiz' }],
        choices: [
          { text: 'All right. I was there. I want a lawyer.', effects: [{ setFlag: 'asked_lawyer' }], next: 'lawyer' },
        ],
      },
      phone: {
        lines: [{ narration: 'An officer brings a phone to the table and sets it down in front of you. One call.' }],
        effects: [{ setClock: { hour: 0, minute: 30 } }],
        choices: [
          { text: 'Call Emily', when: emilyHere, next: 'call_emily' },
          { text: 'Call Daniel', when: { any: [romance, restored] }, next: 'call_daniel' },
          { text: 'Call your own apartment, where Daniel is', when: proto, next: 'call_proto' },
          { text: 'Call the number Daniel left you, before he disappeared', when: revenge, next: 'call_revenge' },
          { text: 'Call the public defender’s night line', next: 'call_lawyer' },
        ],
      },
      call_emily: {
        speaker: 'emily',
        lines: ['Don’t say another word to anyone. I’m finding you a lawyer. A good one, not a tired one.', 'And listen. Whoever did this knows about the signal. Not many people do.'],
        effects: [{ setFlag: 'help_emily' }],
        next: 'to_cell',
      },
      call_daniel: {
        speaker: 'daniel',
        lines: ['Three short, one long? At the scene?', { narration: 'A long silence.' }, 'Someone is using my voice. My heartbeat. I am going to find out who.'],
        effects: [{ setFlag: 'help_daniel' }],
        next: 'to_cell',
      },
      call_proto: {
        speaker: 'daniel',
        lines: ['I am here. The radio on your table started playing it again the moment they took you. Three short, one long. Over and over.', 'It is not me. I am going to find out what it is.'],
        effects: [{ setFlag: 'help_daniel' }],
        next: 'to_cell',
      },
      call_revenge: {
        speaker: 'daniel',
        lines: [{ narration: 'It rings for a long time. Then a click, and breathing that is almost, but not quite, right.' }, 'It wasn’t me.', { narration: 'The line goes dead.' }],
        effects: [{ setFlag: 'daniel_denied_pryce' }],
        next: 'to_cell',
      },
      call_lawyer: {
        speaker: 'okafor',
        lines: ['Public defender’s office, Okafor speaking. Murder? Then here is my advice, free of charge: stop talking. To everyone. I’ll see you at the arraignment in the morning.'],
        effects: [{ setFlag: 'lawyer_called' }],
        next: 'to_cell',
      },
      to_cell: {
        lines: [{ narration: 'They take you down a corridor you have walked a thousand times, and lock you in.' }],
        effects: [{ moveTo: 'holding_cell' }, { objective: 'p2_night' }, { schedule: { event: 'p2_vent', in: 5 } }],
        end: true,
      },
    },
  },

  whisper: {
    start: 'only',
    nodes: {
      only: {
        speaker: 'unknown',
        lines: [
          { narration: 'You put your ear to the vent. The tapping stops. Then a voice, low and distorted, as if spoken through something that changes it.' },
          'You opened the door. You should have left it closed.',
          'Tomorrow they’ll ask you what you did at that facility. Every answer you give, I already have a copy of.',
          { narration: 'Then, faint and deliberate, tapped on the pipe: three short, one long. Footsteps, walking away above you.' },
        ],
        effects: [
          { objective: { id: 'p2_night', status: 'done' } },
          {
            endChapter: {
              title: 'End of Part Two, Chapter 1',
              text: 'You sit on the steel cot until morning, listening. Someone out there knows the signal. Someone knows what happened in that building, and has decided you are going to pay for it. The arraignment is at nine.',
            },
          },
        ],
        end: true,
      },
    },
  },
};

export const part2chapter1 = {
  number: 8,
  part: 2,
  title: 'Part Two, Chapter 1: Summons',
  secrets: 0,

  start: {
    room: 'apartment',
    intro: ['THE LAST SIGNAL. Part Two. Chapter 1: Summons.'],
    effects: [
      { stalkerStop: true },
      { setFlag: ['p2_started', 'daniel_named'] },
      { setClock: { hour: 19, minute: 30 } },
      { checkpoint: true },
      { startDialogue: 'p2_open' },
    ],
  },

  summary: [
    { when: { flag: 'p2_love_said' }, text: 'Emily and Daniel finally said it.' },
    { when: { flag: 'asked_lawyer' }, text: 'You asked for a lawyer.' },
    { when: { flag: 'told_ruiz_story' }, text: 'You told Detective Ruiz everything about the facility.' },
    { when: { flag: 'caught_lying_to_ruiz' }, text: 'You lied to Detective Ruiz, and she caught it.' },
    { when: { flag: 'alibi_friends' }, text: 'Emily and Daniel are your alibi.' },
    { when: { flag: 'alibi_machine' }, text: 'Your alibi is a man in a machine.' },
    { when: { flag: 'no_alibi' }, text: 'You have no alibi.' },
    { when: { flag: 'knows_early_tip' }, text: 'The tip with your name came in hours before the body was found.' },
    { when: { flag: 'daniel_denied_pryce' }, text: 'Daniel says it wasn’t him.' },
  ],

  afterEnd: { effects: [{ say: 'The cell is quiet. Morning is a long way off.' }] },

  rooms,
  items: {},
  documents: {
    doc_p2_charge: {
      title: 'Charge sheet',
      text: ['Charge: murder of Dr. Alan Pryce.', 'Arresting officer: Detective A. Ruiz.', 'Basis: physical evidence at the scene; anonymous information received 3:02 AM.'],
    },
    doc_p2_scene: {
      title: 'Scene report, Pryce residence',
      text: [
        'Victim found in his study, 11:04 PM.',
        'On the desk: a police-issue radio, playing a looping recording: three short tones, one long.',
        'In the victim’s hand: a note bearing the badge number of the accused.',
        'In the desk drawer: a page torn from a visitor log, bearing the accused’s name and the date of the facility call.',
        'Note: the radio is the same model issued to the accused. The accused’s own radio was handed in after the facility call and logged into evidence. It is no longer in the evidence room.',
      ],
    },
  },
  recordings: {},
  objectives: {
    p2_evening: { text: 'A quiet evening at home. For once.' },
    p2_night: { text: 'Get through the night in the holding cell.' },
  },
  speakers: {
    ruiz: { names: [{ name: 'Detective Ruiz' }] },
    okafor: { names: [{ name: 'Okafor, public defender' }] },
    unknown: { names: [{ name: 'A voice in the vent' }] },
  },
  dialogues,
  events: {
    p2_knock: { effects: [{ startDialogue: 'arrest' }] },
    p2_vent: { when: { notFlag: 'heard_vent' }, effects: [{ say: 'From the vent on your left, someone starts tapping on a pipe. Three short. One long.' }, { sound: 'signal' }, { setFlag: 'heard_vent' }] },
  },
  triggers: [
    { id: 'p2_whisper', when: [{ at: 'holding_cell' }, { flag: 'heard_vent' }], effects: [{ startDialogue: 'whisper' }] },
  ],
  globalActions: [],
};
