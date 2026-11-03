// Part Two, Chapter 3 — "The Trial".
// The jury's leaning is a counter ('jury'). Good questions, honest answers
// and people who stand up for you raise it; lies and mistakes lower it.
// The verdict is delivered in the next chapter.

const jury = (add) => ({ count: { id: 'jury', add } });
const proto = { flag: 'ending_prototype' };

// Cross-examining Detective Ruiz: each question can be asked once.
const ruizQuestions = [
  {
    text: 'When did the anonymous tip naming me arrive?',
    when: [{ flag: 'knows_early_tip' }, { notFlag: 'q_tip' }],
    effects: [{ setFlag: 'q_tip' }, jury(2)],
    next: 'r_tip',
  },
  {
    text: 'Where is my own police radio right now, Detective?',
    when: [{ found: 'doc_p2_scene' }, { notFlag: 'q_radio' }],
    effects: [{ setFlag: 'q_radio' }, jury(2)],
    next: 'r_radio',
  },
  {
    text: 'Did I resist arrest?',
    when: [{ flag: 'went_quietly' }, { notFlag: 'q_quiet' }],
    effects: [{ setFlag: 'q_quiet' }, jury(1)],
    next: 'r_quiet',
  },
  {
    text: 'You worked beside me for three years. Did I ever give you a reason to think I could do this?',
    when: { notFlag: 'q_partner' },
    effects: [{ setFlag: 'q_partner' }, jury(1)],
    next: 'r_partner',
  },
  { text: 'No further questions.', next: 'lane_called' },
];

// The defence calls its witnesses: everyone you persuaded in Chapter 2.
const defenceCalls = [
  { text: 'Call Dr. Emily Carter', when: [{ flag: 'witness_emily' }, { notFlag: 'called_emily' }], effects: [{ setFlag: 'called_emily' }, jury(3)], next: 'w_emily' },
  { text: 'Call Daniel', when: [{ flag: 'witness_daniel' }, { notFlag: 'called_daniel' }], effects: [{ setFlag: 'called_daniel' }, jury(3)], next: 'w_daniel' },
  { text: 'Call Marcus Hale', when: [{ flag: 'witness_marcus' }, { notFlag: 'called_marcus' }], effects: [{ setFlag: 'called_marcus' }, jury(3)], next: 'w_marcus' },
  { text: 'Call Theo, the night guard', when: [{ flag: 'witness_theo' }, { notFlag: 'called_theo' }], effects: [{ setFlag: 'called_theo' }, jury(2)], next: 'w_theo' },
  { text: 'Call Sarah Quinn', when: [{ flag: 'witness_sarah' }, { notFlag: 'called_sarah' }], effects: [{ setFlag: 'called_sarah' }, jury(2)], next: 'w_sarah' },
  { text: 'Call Priya', when: [{ flag: 'witness_priya' }, { notFlag: 'called_priya' }], effects: [{ setFlag: 'called_priya' }, jury(2)], next: 'w_priya' },
  { text: 'Call Ana', when: [{ flag: 'witness_ana' }, { notFlag: 'called_ana' }], effects: [{ setFlag: 'called_ana' }, jury(1)], next: 'w_ana' },
  { text: 'The defence rests.', next: 'testify_choice' },
];

// After each witness, back to choosing who to call next.
const backToCalls = { choices: defenceCalls };

const rooms = {
  courtroom: {
    id: 'courtroom',
    name: 'Courtroom 4',
    zone: 'city',
    soundscape: 'courtroom',
    description: 'Wood panelling and bad air conditioning. The judge’s bench ahead, high and far away. The jury box on your right: twelve strangers deciding the rest of your life. The prosecutor’s table on your left. Behind you, the gallery, and every face you persuaded to come.',
    revisit: 'Courtroom 4. The judge ahead, the jury on your right, the prosecution on your left, your people behind you.',
    listen: { text: 'Paper. Coughs. The air conditioning rattling. Twelve people breathing on your right. And somewhere in the walls, very faint, a speaker system hissing as if it is waiting for something.' },
    objects: [],
    exits: [{ id: 'out', dir: 'out', to: 'court_hallway', label: 'Out to the hallway', when: { flag: 'in_recess' } }],
  },
  court_hallway: {
    id: 'court_hallway',
    name: 'Courthouse hallway',
    zone: 'city',
    soundscape: 'hallway',
    description: 'A long marble hallway outside Courtroom 4, echoing with footsteps and whispered phone calls. Sarah sits on a bench on your left with her laptop. Okafor paces ahead, near a vending machine. The courtroom doors are behind you.',
    revisit: 'The hallway. Sarah on the bench on your left, Okafor ahead, the courtroom behind you.',
    listen: { text: 'Heels on marble. A vending machine humming. Sarah’s keyboard, fast. And below the floor, a lift motor running when no lift has been called.' },
    objects: [
      { id: 'sarah', name: 'Sarah', position: 'left', actions: [{ id: 'talk', label: 'Talk to Sarah', effects: [{ startDialogue: 'recess_sarah' }] }] },
      { id: 'okafor', name: 'Okafor', position: 'ahead', actions: [{ id: 'talk', label: 'Talk to Okafor', effects: [{ startDialogue: 'recess_okafor' }] }] },
    ],
    exits: [{ id: 'in', dir: 'in', to: 'courtroom', label: 'Back into the courtroom', sound: 'door.heavy' }],
  },
};

const dialogues = {
  trial_open: {
    start: 'open',
    nodes: {
      open: {
        speaker: 'judge',
        lines: [
          { narration: 'All rise. Judge Amara Bell takes the bench. She looks at you the way people look at a difficult crossword.' },
          'Be seated. The People against the accused, on the charge of murder in the first degree. Mr. Holloway, your opening.',
        ],
        next: 'holloway_open',
      },
      holloway_open: {
        speaker: 'holloway',
        lines: [
          { narration: 'Prosecutor Grant Holloway is tall, silver-haired, and very calm.' },
          'Ladies and gentlemen. The accused wore a badge. The accused found something in an abandoned building one night, and became obsessed with the people who once ran it. Alan Pryce was one of those people. Now he is dead, with the accused’s badge number in his hand.',
          { when: { flag: 'caught_lying_to_ruiz' }, text: 'And when the accused was arrested, the accused lied to the police. You will see the tape.' },
        ],
        next: 'ruiz_on_stand',
      },
      ruiz_on_stand: {
        speaker: 'ruiz',
        lines: [
          { narration: 'Holloway calls Detective Ruiz. She lays out the evidence exactly as she laid it out to you: the radio, the note, the torn page. She does not look at you once.' },
          { narration: 'Okafor leans over: Your turn. Ask what matters.' },
        ],
        choices: ruizQuestions,
      },
      r_tip: {
        speaker: 'ruiz',
        lines: ['At 3:02 in the morning.', { narration: 'A pause.' }, 'Eight hours before the body was found.', { narration: 'A murmur goes through the jury box.' }],
        choices: ruizQuestions,
      },
      r_radio: {
        speaker: 'ruiz',
        lines: ['Your radio was logged into our evidence room after the facility call.', { narration: 'She hesitates.' }, 'It is no longer there. We don’t know who signed it out.'],
        effects: [{ setFlag: 'radio_missing_on_record' }],
        choices: ruizQuestions,
      },
      r_quiet: {
        speaker: 'ruiz',
        lines: ['No. You turned around and put your hands behind your back before I asked.'],
        choices: ruizQuestions,
      },
      r_partner: {
        speaker: 'holloway',
        lines: [
          'Objection. Calls for speculation.',
          { speaker: 'judge', text: 'I’ll allow it. Briefly.' },
          { speaker: 'ruiz', text: 'No. Never. That’s why I didn’t sleep the night I arrested you.' },
        ],
        choices: ruizQuestions,
      },
      lane_called: {
        speaker: 'holloway',
        lines: [
          'The People call Victor Lane.',
          { narration: 'A heavy man in a good suit takes the stand. He says he was walking his dog past Pryce’s house that night and saw you at the door. He is very sure. He smiles at the jury too much.' },
        ],
        effects: [jury(-3)],
        choices: [
          {
            text: 'Mr. Lane, what did you do for a living before you retired?',
            when: { flag: 'witness_theo' },
            effects: [{ setFlag: 'lane_exposed' }, jury(4)],
            next: 'lane_exposed',
          },
          {
            text: 'What breed is your dog, Mr. Lane?',
            effects: [jury(1)],
            next: 'lane_dog',
          },
          { text: 'No questions.', next: 'recess' },
        ],
      },
      lane_exposed: {
        speaker: 'lane',
        lines: [
          'Private security. Consulting.',
          { narration: 'In the gallery behind you, Theo stands up so fast his chair falls over.' },
          { speaker: 'theo', text: 'That’s him. That’s the man who answered the number on the board. The one we were told to call instead of the police.' },
          { speaker: 'judge', text: 'Sit down, sir. Now. Counsel, approach.' },
          { narration: 'Lane’s smile does not move, but his hands go very still on the rail.' },
        ],
        next: 'recess',
      },
      lane_dog: {
        speaker: 'lane',
        lines: [{ narration: 'He blinks.' }, 'A... spaniel.', { narration: 'He says it like a man choosing a word off a list. One or two jurors notice.' }],
        next: 'recess',
      },
      recess: {
        speaker: 'judge',
        lines: ['We’ll take a short recess. Twenty minutes.'],
        effects: [{ setFlag: 'in_recess' }, { objective: 'recess' }],
        end: true,
      },
    },
  },

  recess_sarah: {
    start: 'only',
    nodes: {
      only: {
        speaker: 'sarah',
        lines: [
          { narration: 'Sarah turns the laptop toward you without a word.' },
          'The signal from this morning. I traced it inside the building. It came from the basement: the courthouse evidence room.',
          { when: { flag: 'radio_missing_on_record' }, text: 'Where things go missing from. Like your radio.' },
          { when: { flag: 'lane_exposed' }, text: 'And Lane. Theo’s right. I found his name on the facility’s old security contract. He had keys to everything.' },
          { when: { flag: 'sarah_spark' }, narration: 'She squeezes your hand once, quickly, as if she is not sure she is allowed to. Then she lets go.' },
          'Go back in there. Tell them who you are.',
        ],
        effects: [{ setFlag: 'evidence_room_lead' }],
        end: true,
      },
    },
  },

  recess_okafor: {
    start: 'only',
    nodes: {
      only: {
        speaker: 'okafor',
        lines: [
          { when: { counterAtLeast: { id: 'jury', n: 4 } }, text: 'That went better than I hoped. Don’t get comfortable.' },
          { when: { counterBelow: { id: 'jury', n: 4 } }, text: 'We’re behind. Our witnesses have to carry this.' },
          'After the break, it’s our turn. We call our people. Then you decide whether to testify yourself. I can’t make that choice for you.',
        ],
        end: true,
      },
    },
  },

  trial_defence: {
    start: 'open',
    nodes: {
      open: {
        speaker: 'okafor',
        lines: [{ narration: 'The jury files back in. Okafor stands and buttons her jacket.' }, 'The defence calls its first witness.'],
        choices: defenceCalls,
      },
      w_emily: {
        speaker: 'emily',
        lines: [
          { narration: 'Emily walks to the stand slowly. She is still thinner than she should be.' },
          'For two years I was kept in a preservation capsule by the company Alan Pryce helped run. The accused found me. The accused kept me alive, alone, in the dark, with alarms going off and a machine hunting the building.',
          'That is who you are judging.',
        ],
        ...backToCalls,
      },
      w_daniel: {
        speaker: 'daniel',
        lines: [
          { narration: 'Daniel leans on his cane to reach the stand. Holloway asks him, with some amusement, to explain himself. He does. The room goes quiet. Nobody is amused by the end.' },
          'The signal was mine. Three short, one long. The first sound a machine I built ever made. Someone has stolen it to frame the one person who answered it.',
        ],
        ...backToCalls,
      },
      w_marcus: {
        speaker: 'marcus',
        lines: [
          { narration: 'Marcus is brought in from custody. He testifies against the board for an hour, flatly, as if reading minutes.' },
          'Alan Pryce was going to testify against the rest of us in two weeks. Somebody on that board had every reason to want him silent. The accused had none.',
        ],
        effects: [{ setFlag: 'motive_on_record' }],
        ...backToCalls,
      },
      w_theo: {
        speaker: 'theo',
        lines: [
          'I worked nights at that facility. The board told us: anything strange, don’t call the police, call this number. I called it once.',
          { when: { flag: 'lane_exposed' }, text: 'The man who answered was sitting in that witness chair this morning.' },
          { when: { notFlag: 'lane_exposed' }, text: 'The man who answered had a voice I’ll never forget.' },
        ],
        ...backToCalls,
      },
      w_sarah: {
        speaker: 'sarah',
        lines: [
          'I ran the facility’s communications. The anonymous call naming the accused did not come from any phone. It came through that facility’s private exchange, which only a handful of people could still access.',
          { when: { flag: 'evidence_room_lead' }, text: 'And this morning that same system transmitted from inside this courthouse. From the evidence room downstairs.' },
          { narration: 'Holloway objects. The judge overrules him, and looks, for the first time, very interested.' },
        ],
        ...backToCalls,
      },
      w_priya: {
        speaker: 'priya',
        lines: [{ narration: 'Priya’s voice shakes the whole time. She does not stop.' }, 'When my mother was dying, the accused covered my shifts for a month and never once said I owed them. That company would have fired me. The accused is not one of them. The accused is the opposite of them.'],
        ...backToCalls,
      },
      w_ana: {
        speaker: 'ana',
        lines: ['Every time it rained, the accused walked me to my car. Every time. You don’t do that for two years and then walk into a man’s house and kill him.'],
        ...backToCalls,
      },
      testify_choice: {
        speaker: 'okafor',
        lines: [{ narration: 'Okafor sits down beside you and speaks very quietly.' }, 'Last decision. Do you take the stand? If you do, Holloway gets to ask you anything.'],
        choices: [
          { text: 'I’ll testify.', effects: [{ setFlag: 'testified' }], next: 'you_stand' },
          { text: 'No. Our witnesses said it better than I can.', next: 'closing' },
        ],
      },
      you_stand: {
        speaker: 'holloway',
        lines: [{ narration: 'You take the oath. Holloway walks up to the stand slowly.' }, 'Were you at that facility on the night of the emergency call?'],
        choices: [
          {
            text: 'Yes. I answered the call, and I stayed until morning.',
            effects: [{ honest: true }, jury(1)],
            next: [
              { when: { flag: 'caught_lying_to_ruiz' }, node: 'lie_raised' },
              { node: 'did_you_know' },
            ],
          },
        ],
      },
      lie_raised: {
        speaker: 'holloway',
        lines: ['Odd. When you were arrested, you told Detective Ruiz you had never been anywhere near it.'],
        choices: [
          { text: 'I lied. I was scared. I’m not lying now.', effects: [{ honest: true }, jury(1)], next: 'did_you_know' },
          { text: 'I was confused. I misspoke.', effects: [jury(-2)], next: 'did_you_know' },
        ],
      },
      did_you_know: {
        speaker: 'holloway',
        lines: ['Did you know Alan Pryce?'],
        choices: [
          { text: 'No. I never met him.', effects: [{ honest: true }], next: 'why_name' },
        ],
      },
      why_name: {
        speaker: 'holloway',
        lines: ['Then why was your name in his drawer?'],
        choices: [
          { text: 'Because someone who did know him put it there. Someone with keys to that facility and to your evidence room.', when: { any: [{ flag: 'evidence_room_lead' }, { flag: 'lane_exposed' }] }, effects: [jury(2)], next: 'last_q' },
          { text: 'I don’t know.', effects: [{ honest: true }], next: 'last_q' },
        ],
      },
      last_q: {
        speaker: 'holloway',
        lines: ['Last question. Did you kill Alan Pryce?'],
        choices: [
          { text: 'No.', effects: [jury(1)], next: 'closing' },
          { text: 'No. I have never hurt anyone who didn’t try to hurt someone else first. Ask anyone in this room who knows me.', effects: [jury(2)], next: 'closing' },
        ],
      },
      closing: {
        speaker: 'okafor',
        lines: [{ narration: 'Closing arguments. Holloway is smooth and short. Then Okafor stands, and looks at you, and you realise she is asking what you want her to say.' }],
        choices: [
          { text: 'Tell them about the signal. Someone stole it to frame me.', effects: [jury(1)], next: 'close_signal' },
          { text: 'Tell them who I am. Let my people speak for me.', when: { countAtLeast: { flags: ['called_emily', 'called_daniel', 'called_marcus', 'called_theo', 'called_sarah', 'called_priya', 'called_ana'], n: 3 } }, effects: [jury(2)], next: 'close_people' },
          { text: 'Tell them about the missing radio.', when: { flag: 'radio_missing_on_record' }, effects: [jury(2)], next: 'close_radio' },
        ],
      },
      close_signal: { speaker: 'okafor', lines: ['Three short tones and one long. A sound that meant help, once. Someone in this city turned it into a weapon, and pointed it at the one person who answered it.'], next: 'deliberate' },
      close_people: { speaker: 'okafor', lines: ['You heard from the people who know the accused. Not a single one of them hesitated. When people tell you who someone is, believe them.'], next: 'deliberate' },
      close_radio: { speaker: 'okafor', lines: ['The accused’s radio was locked in a police evidence room. It walked out of that room on its own, and turned up on a dead man’s desk. Ask yourselves who has the keys.'], next: 'deliberate' },
      deliberate: {
        speaker: 'judge',
        lines: [
          'The jury will now retire to consider its verdict.',
          { narration: 'The twelve strangers on your right stand up and file out. The door closes behind them.' },
          { narration: 'Then every light in Courtroom 4 goes out.' },
          { narration: 'In the dark, the courtroom speakers crackle. Three short tones. One long. And the voice from the vent, filling the whole room:' },
          { speaker: 'unknown', text: 'Guilty or not, it doesn’t matter. I kept a copy of everything. Including him.' },
          { narration: 'The lights come back. The speakers go quiet. Somewhere below the floor, a lift motor stops.' },
        ],
        effects: [
          {
            endChapter: {
              title: 'End of Part Two, Chapter 3',
              text: 'The jury is still out. Everyone you love is in the gallery behind you, white-faced. And someone just told the whole courtroom that they kept a copy of everything. Including him.',
            },
          },
        ],
        end: true,
      },
    },
  },
};

export const part2chapter3 = {
  number: 10,
  part: 2,
  title: 'Part Two, Chapter 3: The Trial',
  secrets: 0,

  start: {
    room: 'courtroom',
    intro: ['THE LAST SIGNAL. Part Two. Chapter 3: The Trial.', 'Three days later. Courtroom 4. Every seat in the gallery is taken.'],
    effects: [
      { setFlag: 'p2c3_started' },
      { setClock: { hour: 9, minute: 30 } },
      { count: { id: 'jury', add: 0 } },
      { checkpoint: true },
      { startDialogue: 'trial_open' },
    ],
  },

  summary: [
    { when: { flag: 'lane_exposed' }, text: 'Theo recognised the prosecution’s witness, Victor Lane, as the board’s private security.' },
    { when: { flag: 'radio_missing_on_record' }, text: 'Ruiz admitted your radio vanished from the evidence room.' },
    { when: { flag: 'motive_on_record' }, text: 'Marcus told the court that Pryce was about to testify against the board.' },
    { when: { flag: 'testified' }, text: 'You took the stand.' },
    { when: { counterAtLeast: { id: 'jury', n: 12 } }, text: 'Okafor thinks the jury is with you.' },
    { when: [{ counterAtLeast: { id: 'jury', n: 6 } }, { counterBelow: { id: 'jury', n: 12 } }], text: 'Okafor says it could go either way.' },
    { when: { counterBelow: { id: 'jury', n: 6 } }, text: 'Okafor will not meet your eyes.' },
    { text: 'Someone kept a copy of everything. Including him.' },
  ],

  afterEnd: { effects: [{ say: 'The courtroom is empty except for the people waiting with you.' }] },

  rooms,
  items: {},
  documents: {},
  recordings: {},
  objectives: {
    recess: { text: 'Recess. Talk to Sarah and Okafor in the hallway, then go back into the courtroom.' },
  },
  speakers: {
    judge: { names: [{ name: 'Judge Bell' }] },
    holloway: { names: [{ name: 'Prosecutor Holloway' }] },
    lane: { names: [{ name: 'Victor Lane' }] },
  },
  dialogues,
  events: {},
  triggers: [
    {
      id: 'p2c3_defence',
      when: [{ flag: 'in_recess' }, { at: 'courtroom' }, { visited: 'court_hallway' }],
      effects: [{ clearFlag: 'in_recess' }, { objective: { id: 'recess', status: 'done' } }, { startDialogue: 'trial_defence' }],
    },
  ],
  globalActions: [],
};
