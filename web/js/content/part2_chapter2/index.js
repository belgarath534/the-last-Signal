// Part Two, Chapter 2 — "Witnesses".
// Out on bail with three days until trial. Meet Sarah, who knew you when
// you never knew her. Find the people from the facility who will stand up
// for you. Decided with the creator: Sarah is new, she had a quiet crush on
// you for a year, Emily and Daniel knew her, and you never noticed her.

const WITNESSES = ['witness_ana', 'witness_theo', 'witness_priya', 'witness_marcus', 'witness_emily', 'witness_daniel'];
const emilyHere = [{ flag: 'emily_awake' }, { emilyAlive: true }];
const danielHuman = { any: [{ flag: 'ending_romance' }, { flag: 'ending_restored' }] };
const proto = { flag: 'ending_prototype' };
const enough = { countAtLeast: { flags: WITNESSES, n: 2 } };

const rooms = {
  street: {
    id: 'street',
    name: 'Downtown, in the rain',
    zone: 'city',
    soundscape: 'street',
    description:
      'A wet downtown street, morning traffic hissing past. Ahead, the stairs up to your lawyer’s office. On your right, a small cafe with steamed-up windows. On your left, the all-night diner where the facility’s old night shift still gathers. Behind you, the way home.',
    revisit: 'The street. The lawyer’s office ahead, the cafe on the right, the diner on the left, home behind you.',
    listen: { text: 'Tyres on wet tarmac. A bus sighing at its stop. Somebody’s radio in a parked car, and for a horrible second you listen for three short, one long. It is only music.' },
    objects: [],
    exits: [
      { id: 'north', dir: 'north', to: 'okafor_office', label: 'Lawyer’s office', sound: 'footsteps' },
      { id: 'east', dir: 'east', to: 'cafe', label: 'Cafe', sound: 'door.glass' },
      { id: 'west', dir: 'west', to: 'diner', label: 'Night shift diner', sound: 'door.glass' },
      { id: 'south', dir: 'south', to: 'apartment', label: 'Home' },
      { id: 'emily', dir: 'in', to: 'emily_place', label: 'Taxi to Emily’s place', when: emilyHere, sound: 'car.door' },
      { id: 'jail', dir: 'out', to: 'county_jail', label: 'Bus to the county jail', when: { flag: 'marcus_arrested' }, sound: 'footsteps' },
    ],
  },

  okafor_office: {
    id: 'okafor_office',
    name: 'Okafor’s office',
    zone: 'city',
    soundscape: 'office_city',
    description: 'A cramped office above a laundromat. Files stacked on every surface. Nadia Okafor sits behind a desk ahead, reading glasses pushed up into her hair.',
    revisit: 'Okafor’s office. Okafor at her desk ahead.',
    listen: { text: 'The laundromat below rumbles. Okafor’s pen scratches. She is humming, slightly off key.' },
    objects: [
      { id: 'okafor', name: 'Nadia Okafor', position: 'ahead', actions: [{ id: 'talk', label: 'Talk to Okafor', effects: [{ startDialogue: 'okafor' }] }] },
    ],
    exits: [{ id: 'south', dir: 'south', to: 'street', label: 'Back down to the street', sound: 'footsteps' }],
  },

  cafe: {
    id: 'cafe',
    name: 'Cafe',
    zone: 'city',
    soundscape: 'cafe',
    description: [
      { when: { notFlag: 'sarah_met' }, text: 'Warm, loud, smelling of coffee. Every table is taken except one by the window, where a woman with a laptop is sitting. As you come in, she looks up, straight at you, as if she has been waiting.' },
      { text: 'Warm, loud, smelling of coffee. Sarah’s table by the window, her laptop open.' },
    ],
    revisit: 'The cafe. Sarah’s table by the window.',
    listen: { text: 'The espresso machine screaming. Cups. Somebody laughing. And from the window table, a laptop fan, and very soft keyboard clicks.' },
    objects: [
      {
        id: 'sarah',
        name: 'Sarah',
        position: 'right',
        when: { flag: 'sarah_met' },
        actions: [{ id: 'talk', label: 'Talk to Sarah', effects: [{ startDialogue: 'sarah_again' }] }],
      },
    ],
    exits: [{ id: 'west', dir: 'west', to: 'street', label: 'Back out to the street', sound: 'door.glass' }],
  },

  diner: {
    id: 'diner',
    name: 'Night shift diner',
    zone: 'city',
    soundscape: 'diner',
    description: 'Red booths and bad coffee. The facility closed two years ago, but its night shift never stopped coming here. In a booth on your left, Ana from accounts. At the counter ahead, Theo, the old night security guard. In the corner on your right, Priya from the labs, pretending not to see you.',
    revisit: 'The diner. Ana on the left, Theo at the counter ahead, Priya in the corner on the right.',
    listen: { text: 'A grill hissing. A jukebox nobody fed. Three conversations go quiet when you walk in, and then, slowly, start again.' },
    objects: [
      { id: 'ana', name: 'Ana', position: 'left', actions: [{ id: 'talk', label: 'Talk to Ana', effects: [{ startDialogue: 'ana' }] }] },
      { id: 'theo', name: 'Theo', position: 'ahead', actions: [{ id: 'talk', label: 'Talk to Theo', effects: [{ startDialogue: 'theo' }] }] },
      { id: 'priya', name: 'Priya', position: 'right', actions: [{ id: 'talk', label: 'Talk to Priya', effects: [{ startDialogue: 'priya' }] }] },
    ],
    exits: [{ id: 'east', dir: 'east', to: 'street', label: 'Back out to the street', sound: 'door.glass' }],
  },

  emily_place: {
    id: 'emily_place',
    name: 'Emily’s place',
    zone: 'city',
    soundscape: 'apartment',
    description: [
      { when: danielHuman, text: 'Emily and Daniel’s flat, full of books and half-built machines. Emily is at the kitchen table ahead. Daniel is in the armchair on your right, his cane against the wall.' },
      { text: 'Emily’s flat, full of books and half-built machines. Emily is at the kitchen table ahead.' },
    ],
    revisit: 'Emily’s place.',
    listen: { text: 'A kettle starting to sing. Rain on the skylight.' },
    objects: [
      { id: 'emily', name: 'Emily', position: 'ahead', actions: [{ id: 'talk', label: 'Talk to Emily', effects: [{ startDialogue: 'emily_p2' }] }] },
      { id: 'daniel', name: 'Daniel', position: 'right', when: danielHuman, actions: [{ id: 'talk', label: 'Talk to Daniel', effects: [{ startDialogue: 'daniel_p2' }] }] },
    ],
    exits: [{ id: 'out', dir: 'out', to: 'street', label: 'Taxi back downtown', sound: 'car.door' }],
  },

  county_jail: {
    id: 'county_jail',
    name: 'County jail, visiting room',
    zone: 'city',
    soundscape: 'station',
    description: 'A long table divided by glass. On the other side, in an orange jumpsuit that makes him look even older, Marcus Hale.',
    revisit: 'The visiting room. Marcus behind the glass.',
    listen: { text: 'A buzzer. Keys. Marcus breathing on the other side of the glass.' },
    objects: [
      { id: 'marcus', name: 'Marcus', position: 'ahead', actions: [{ id: 'talk', label: 'Talk to Marcus', effects: [{ startDialogue: 'marcus_p2' }] }] },
    ],
    exits: [{ id: 'out', dir: 'out', to: 'street', label: 'Bus back downtown', sound: 'footsteps' }],
  },
};

const roomAdditions = {
  apartment: {
    exits: [{ id: 'street', dir: 'out', to: 'street', label: 'Out to the street', when: { flag: 'p2c2_started' } }],
  },
  street: {},
};

const dialogues = {
  p2c2_open: {
    start: [
      { when: { flag: 'help_emily' }, node: 'emily_bail' },
      { when: { flag: 'help_daniel' }, node: 'daniel_bail' },
      { node: 'okafor_bail' },
    ],
    nodes: {
      emily_bail: {
        lines: [{ narration: 'At the arraignment you plead not guilty. Bail is set at an amount you could never pay. Emily pays it before the judge has finished speaking.' }],
        next: 'out',
      },
      daniel_bail: {
        lines: [{ narration: 'At the arraignment you plead not guilty. Bail is set at an amount you could never pay. Daniel pays it. You do not ask where the money came from.' }],
        next: 'out',
      },
      okafor_bail: {
        lines: [{ narration: 'At the arraignment you plead not guilty. A tired public defender named Okafor turns out to be not tired at all, and argues you out on bail in four minutes flat.' }],
        next: 'out',
      },
      out: {
        lines: [
          { narration: 'You walk out of the courthouse into the rain. Three days until trial.' },
          { narration: 'Okafor’s card is in your pocket. On the back, in pen: Come see me. Today.' },
        ],
        effects: [{ objective: 'see_okafor' }],
        end: true,
      },
    },
  },

  okafor: {
    start: [
      { when: { notFlag: 'okafor_briefed' }, node: 'brief' },
      { when: [enough, { flag: 'sarah_met' }], node: 'ready' },
      { node: 'progress' },
    ],
    nodes: {
      brief: {
        speaker: 'okafor',
        lines: [
          'Sit. Here is the prosecution’s case, as simply as I can put it.',
          'Your badge number in a dead man’s hand. Your name on a page from a place you’ve admitted you were. A police radio playing a sound that, apparently, only a handful of people in the world would recognise.',
          { when: { flag: 'caught_lying_to_ruiz' }, text: 'And you lied to the arresting detective. On camera. I would like you not to do that again.' },
          { when: { flag: 'no_alibi' }, text: 'And no alibi. I’m not going to pretend that’s nothing.' },
          'What they do not have is a reason you’d want him dead. And juries like reasons.',
          'So. We need people. People who knew you, who will stand up in that room and say who you are. And anyone who can tell us who else knew that sound.',
        ],
        effects: [{ setFlag: 'okafor_briefed' }, { objective: { id: 'see_okafor', status: 'done' } }, { objective: 'find_witnesses' }],
        end: true,
      },
      progress: {
        speaker: 'okafor',
        lines: [
          { when: { not: enough }, text: 'Not enough people yet. Two at the very least. Go and find the ones who knew you.' },
          { when: [enough, { notFlag: 'sarah_met' }], text: 'Good people. But we still don’t know who else knew that sound. Keep looking.' },
        ],
        end: true,
      },
      ready: {
        speaker: 'okafor',
        lines: [
          'Let me see who we have.',
          { when: { flag: 'witness_emily' }, text: 'Dr. Emily Carter. A woman the company locked in a capsule. She’ll be hard to ignore.' },
          { when: { flag: 'witness_daniel' }, text: 'Daniel. However we end up explaining him.' },
          { when: { flag: 'witness_marcus' }, text: 'Marcus Hale, a board member willing to testify against his own board. That is gold.' },
          { when: { flag: 'witness_theo' }, text: 'Theo, the night guard who wrote the last entry in their log.' },
          { when: { flag: 'witness_ana' }, text: 'Ana, who says you walked her to her car every time it rained. Small, but juries remember small.' },
          { when: { flag: 'witness_priya' }, text: 'Priya from the labs, who is terrified and coming anyway.' },
          'It’s a start. A real one.',
        ],
        next: 'sarah_arrives',
      },
      sarah_arrives: {
        speaker: 'sarah',
        lines: [
          { narration: 'The office door opens without a knock. Sarah, out of breath, rain in her hair, laptop held against her chest.' },
          'Sorry. Sorry. You need to see this.',
          { narration: 'She sets the laptop on Okafor’s desk. On the screen, a line of traffic from the facility’s old network, the one she never stopped watching.' },
          'The anonymous call that gave the police your name. It didn’t come from a phone. It came through the facility’s old exchange. Someone is still inside that network.',
          'And it just transmitted again. Ten minutes ago. Three short, one long. From an address downtown.',
          { narration: 'She turns the screen toward you. The address is the courthouse.' },
        ],
        next: 'sarah_moment',
      },
      sarah_moment: {
        speaker: 'sarah',
        lines: [
          { narration: 'Okafor goes to make calls. For a moment it is just you and Sarah, and the rain on the window.' },
          'I’ll testify too. About the network. About you.',
          'I noticed you, back then. You never noticed me. That’s all right. I just wanted you to know someone did.',
        ],
        effects: [{ setFlag: 'witness_sarah' }],
        choices: [
          { text: 'I’m noticing now.', effects: [{ setFlag: 'sarah_spark' }], next: 'spark' },
          { text: 'Thank you. I mean it. For all of it.', effects: [{ setFlag: 'sarah_friend' }], next: 'friend' },
          { text: 'Why me?', next: 'why' },
        ],
      },
      why: {
        speaker: 'sarah',
        lines: ['Because you were kind when nobody was watching. I was watching.', { narration: 'She laughs at herself, quietly.' }, 'That came out creepier than I meant it.'],
        choices: [
          { text: 'I’m noticing now.', effects: [{ setFlag: 'sarah_spark' }], next: 'spark' },
          { text: 'Thank you. I mean it. For all of it.', effects: [{ setFlag: 'sarah_friend' }], next: 'friend' },
        ],
      },
      spark: {
        speaker: 'sarah',
        lines: [{ narration: 'She looks at you for a long second, and then down at her laptop, and then, smiling, back at you.' }, 'Good. Took you long enough.'],
        next: 'end',
      },
      friend: {
        speaker: 'sarah',
        lines: ['Any time. I mean that too.'],
        next: 'end',
      },
      end: {
        lines: [],
        effects: [
          { objective: { id: 'find_witnesses', status: 'done' } },
          {
            endChapter: {
              title: 'End of Part Two, Chapter 2',
              text: 'Three days until trial. You have people now, people who remembered you when you had forgotten yourself. And somewhere inside the courthouse, someone with a copy of every answer you will give is tapping out three short, one long.',
            },
          },
        ],
        end: true,
      },
    },
  },

  sarah_meet: {
    start: 'open',
    nodes: {
      open: {
        speaker: 'sarah',
        lines: [
          'You’re late. I’ve been here since six.',
          { narration: 'She closes her laptop halfway, the way people do when there is something on the screen you should not see yet.' },
          'Sit down. Please. Before someone recognises you from the news.',
        ],
        choices: [
          { text: 'Who are you?', next: 'who' },
          { text: 'How do you know I was coming here?', effects: [{ setFlag: 'suspicious_sarah' }], next: 'how' },
        ],
      },
      who: {
        speaker: 'sarah',
        lines: [
          'Sarah. Sarah Quinn. I ran the audio and radio systems at the facility. The speakers. The handhelds. Every channel Daniel used to talk to you that night went through boxes I installed.',
          'We worked in the same building for a year. You don’t remember me.',
          { narration: 'It is not a question. And she is right. You don’t.' },
        ],
        effects: [{ setFlag: 'sarah_named' }],
        next: 'knows',
      },
      how: {
        speaker: 'sarah',
        lines: [
          { narration: 'She has the decency to look embarrassed.' },
          'Because I’ve been watching the facility’s network since the night you answered that signal. Every transmission. Every call. And you come here every Tuesday at ten. I’m sorry. That sounds terrible out loud.',
          'Sarah Quinn. I ran the audio and radio at the facility. You don’t remember me.',
        ],
        effects: [{ setFlag: 'sarah_named' }],
        next: 'knows',
      },
      knows: {
        speaker: 'sarah',
        lines: [
          'I know you didn’t kill Alan Pryce.',
          'I know because you’re the person who used to leave the last cup of coffee for the night shift and pretend you didn’t want it. Who walked Ana to her car every time it rained. Who quit the week they took Daniel off his project, when everyone else kept their heads down.',
          'You were the only one who quit.',
        ],
        choices: [
          { text: 'How do you know all that?', next: 'watching' },
          { text: 'If you’ve been watching the network, you know the signal. That makes you a suspect too.', effects: [{ setFlag: 'suspected_sarah' }], next: 'suspect' },
        ],
      },
      watching: {
        speaker: 'sarah',
        lines: ['I paid attention. To you, mostly.', { narration: 'She hears herself, and goes pink, and hurries on.' }, 'Anyway. Emily and Daniel know me. Ask them. I’ll be here.'],
        next: 'close',
      },
      suspect: {
        speaker: 'sarah',
        lines: ['Yes. It does. Good. You’re thinking like a cop again.', 'So check me. Ask Emily and Daniel who I am. Then come back, and I’ll show you what’s on this laptop.'],
        next: 'close',
      },
      close: {
        lines: [],
        effects: [{ setFlag: 'sarah_met' }, { objective: 'find_witnesses' }],
        end: true,
      },
    },
  },

  sarah_again: {
    start: 'only',
    nodes: {
      only: {
        speaker: 'sarah',
        lines: [
          { when: { not: enough }, text: 'Find your people first. Ana and Theo are at the diner most mornings. Priya too, if she hasn’t run off.' },
          { when: enough, text: 'Go and see Okafor. I’m nearly done with this. I’ll meet you there.' },
        ],
        end: true,
      },
    },
  },

  emily_p2: {
    start: 'open',
    nodes: {
      open: {
        speaker: 'emily',
        lines: [
          'Of course I’ll testify. I’d testify for you in front of God.',
          { when: { notFlag: 'sarah_met' }, text: 'And there’s someone you need to meet. She’s been asking about you for months. Try the cafe on your street.' },
          { when: { flag: 'sarah_met' }, narration: 'Then she sees your face.' },
          { when: { flag: 'sarah_met' }, text: 'You met Sarah. Oh, you met Sarah.' },
        ],
        effects: [{ setFlag: 'witness_emily' }],
        next: [
          { when: { flag: 'sarah_met' }, node: 'tease' },
          { node: 'close' },
        ],
      },
      tease: {
        speaker: 'emily',
        lines: [
          { narration: 'She is trying very hard not to laugh, and failing.' },
          'You really never noticed? She sat two desks from you for a year. She brought you a birthday card. You thanked the wrong person for it.',
          { when: danielHuman, speaker: 'daniel', text: 'She asked me once whether you took sugar. I told her I had no idea. She wrote it down anyway when she found out.' },
          'She’s one of the best people I know. If she says she knows who you are, believe her.',
        ],
        effects: [{ setFlag: 'emily_vouched_sarah' }],
        next: 'close',
      },
      close: { lines: [], end: true },
    },
  },

  daniel_p2: {
    start: 'only',
    nodes: {
      only: {
        speaker: 'daniel',
        lines: [
          'I will testify. Whatever they make of a man who used to be a machine.',
          'And I will tell them about the signal. It was mine. Someone is using it to hurt the person who answered it. I take that personally.',
        ],
        effects: [{ setFlag: 'witness_daniel' }],
        end: true,
      },
    },
  },

  ana: {
    start: [{ when: { flag: 'witness_ana' }, node: 'done' }, { node: 'open' }],
    nodes: {
      open: {
        speaker: 'ana',
        lines: ['I saw the news. I didn’t believe it for a second.', 'You walked me to my car every time it rained. Every time. Nobody else ever did.'],
        choices: [
          { text: 'Would you tell a court that?', effects: [{ setFlag: 'witness_ana' }], next: 'yes' },
          { text: 'I don’t even remember doing it.', next: 'remember' },
        ],
      },
      remember: {
        speaker: 'ana',
        lines: ['That’s the point, isn’t it. You didn’t do it so anyone would remember.', 'Ask me. Go on.'],
        choices: [{ text: 'Would you tell a court that?', effects: [{ setFlag: 'witness_ana' }], next: 'yes' }],
      },
      yes: { speaker: 'ana', lines: ['Try and stop me.'], end: true },
      done: { speaker: 'ana', lines: ['I’ll be there. I’ll wear a nice coat.'], end: true },
    },
  },

  theo: {
    start: [{ when: { flag: 'witness_theo' }, node: 'done' }, { node: 'open' }],
    nodes: {
      open: {
        speaker: 'theo',
        lines: [{ narration: 'Theo does not look up from his coffee.' }, 'I don’t do courts. Courts are where they make the guard take the blame.'],
        choices: [
          {
            text: 'You wrote the last entry in their logbook. Somebody is still talking on the radio.',
            when: { found: 'doc_security_log' },
            effects: [{ setFlag: 'witness_theo' }],
            next: 'logbook',
          },
          { text: 'I was framed, Theo. I need help.', next: 'framed' },
        ],
      },
      logbook: {
        speaker: 'theo',
        lines: [
          { narration: 'Now he looks up.' },
          'You read that. You were there.',
          'Nobody believed me. They told me to log it and leave it. And then they told me to call a number on the board instead of the police, and the man who answered that number was not a nice man.',
          'All right. I’ll come. I’ll tell them about the number.',
        ],
        end: true,
      },
      framed: {
        speaker: 'theo',
        lines: ['Everyone at the facility was framed for something. Most of us just never got arrested.', { narration: 'He goes back to his coffee.' }],
        choices: [
          { text: 'I was the one who answered that radio, Theo. The one you heard.', effects: [{ setFlag: 'witness_theo' }], next: 'logbook' },
          { text: 'All right. I understand.', end: true },
        ],
      },
      done: { speaker: 'theo', lines: ['I said I’d be there. I’ll be there.'], end: true },
    },
  },

  priya: {
    start: [
      { when: { flag: 'witness_priya' }, node: 'done' },
      { when: { flag: 'priya_refused' }, node: 'refused' },
      { node: 'open' },
    ],
    nodes: {
      open: {
        speaker: 'priya',
        lines: [{ narration: 'Priya grips her cup with both hands.' }, 'Please don’t ask me. If I testify, they’ll come for me next. You know they will.'],
        choices: [
          { text: 'I understand if you can’t. You don’t owe me anything.', next: 'kind' },
          { text: 'I covered your shifts for a month when your mother was sick. You owe me.', effects: [{ setFlag: 'priya_refused' }], next: 'owe' },
        ],
      },
      kind: {
        speaker: 'priya',
        lines: [{ narration: 'She stares at you.' }, 'You covered my shifts for a month when my mother was sick. You never once said that I owed you.', 'Damn it. Fine. I’ll come.'],
        effects: [{ setFlag: 'witness_priya' }],
        end: true,
      },
      owe: {
        speaker: 'priya',
        lines: ['That’s what they used to say. You owe us.', { narration: 'She gets up and leaves her coffee on the table.' }],
        end: true,
      },
      refused: { lines: [{ narration: 'Priya’s corner booth is empty. Her coffee has gone cold.' }], end: true },
      done: { speaker: 'priya', lines: ['Don’t thank me. I’ll be sick if you thank me.'], end: true },
    },
  },

  marcus_p2: {
    start: [{ when: { flag: 'witness_marcus' }, node: 'done' }, { node: 'open' }],
    nodes: {
      open: {
        speaker: 'marcus',
        lines: [
          'Officer. Or, I suppose, not any more.',
          'Alan Pryce. I signed things next to his name for eleven years. He was going to testify against the rest of the board. Did you know that? Two weeks from now. Somebody made sure he didn’t.',
          'I’ll testify. About the board. About the number Theo was told to call. About all of it.',
        ],
        effects: [{ setFlag: 'witness_marcus' }, { setFlag: 'knows_pryce_motive' }],
        end: true,
      },
      done: { speaker: 'marcus', lines: ['I’m not going anywhere.'], end: true },
    },
  },
};

export const part2chapter2 = {
  number: 9,
  part: 2,
  title: 'Part Two, Chapter 2: Witnesses',
  secrets: 0,

  start: {
    room: 'street',
    intro: ['THE LAST SIGNAL. Part Two. Chapter 2: Witnesses.'],
    effects: [
      { setFlag: 'p2c2_started' },
      { setClock: { hour: 10, minute: 0 } },
      { checkpoint: true },
      { startDialogue: 'p2c2_open' },
    ],
  },

  summary: [
    { when: { flag: 'sarah_spark' }, text: 'You told Sarah you are noticing now.' },
    { when: { flag: 'sarah_friend' }, text: 'You and Sarah are friends. For now.' },
    { when: { flag: 'emily_vouched_sarah' }, text: 'Emily vouched for Sarah, and laughed at you.' },
    { when: { flag: 'witness_emily' }, text: 'Emily will testify.' },
    { when: { flag: 'witness_daniel' }, text: 'Daniel will testify.' },
    { when: { flag: 'witness_marcus' }, text: 'Marcus will testify against his own board.' },
    { when: { flag: 'witness_theo' }, text: 'Theo, the night guard, will testify.' },
    { when: { flag: 'witness_ana' }, text: 'Ana will testify.' },
    { when: { flag: 'witness_priya' }, text: 'Priya is terrified, and coming anyway.' },
    { when: { flag: 'priya_refused' }, text: 'Priya walked away.' },
    { when: { flag: 'knows_pryce_motive' }, text: 'Pryce was about to testify against the board.' },
    { text: 'The signal came from inside the courthouse.' },
  ],

  afterEnd: { effects: [{ say: 'Okafor is still on the phone. The rain has not stopped.' }] },

  rooms,
  roomAdditions,
  items: {},
  documents: {},
  recordings: {},
  objectives: {
    see_okafor: { text: 'Go and see your lawyer, Okafor. Her office is up the stairs ahead of you on the street.' },
    find_witnesses: { text: 'Find people who will testify for you: try the diner, Emily, and anyone else who knew you. Then go back to Okafor.' },
  },
  speakers: {
    sarah: { names: [{ when: { flag: 'sarah_named' }, name: 'Sarah' }, { name: 'A woman with a laptop' }] },
    ana: { names: [{ name: 'Ana' }] },
    theo: { names: [{ name: 'Theo' }] },
    priya: { names: [{ name: 'Priya' }] },
  },
  dialogues,
  events: {},
  triggers: [
    { id: 'p2c2_sarah', when: [{ at: 'cafe' }, { flag: 'p2c2_started' }, { notFlag: 'sarah_met' }], effects: [{ startDialogue: 'sarah_meet' }] },
  ],
  globalActions: [],
};
