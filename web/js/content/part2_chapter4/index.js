// Part Two, Chapter 4 — "The Verdict".
// Decided by Claude at the creator's request: the voice is Dr. Helena Voss,
// chair of the Project Board, who copied her own mind into the facility
// network before her body died. Daniel's transfer was her rehearsal.
// Victor Lane works for her. She killed Pryce to keep him from testifying,
// and framed the protagonist. She holds the board's master copy of Daniel.

const strong = { counterAtLeast: { id: 'jury', n: 8 } };
const weak = { counterBelow: { id: 'jury', n: 8 } };
const danielHuman = { any: [{ flag: 'ending_romance' }, { flag: 'ending_restored' }] };
const proto = { flag: 'ending_prototype' };
const bodyStillThere = { not: { any: [danielHuman, proto] } };

const rooms = {
  evidence_room: {
    id: 'evidence_room',
    name: 'Courthouse evidence room',
    zone: 'city',
    soundscape: 'evidence',
    description: 'A windowless basement room of steel shelves and numbered boxes. Ruiz stands by the door on your left. Sarah is ahead of you at an old terminal on a desk, the kind nobody has used in years, with a speaker on top and a cable running into the wall. Its screen is on. On a shelf on your right, in a clear evidence bag: your radio.',
    revisit: 'The evidence room. Ruiz by the door on your left, Sarah and the terminal ahead, your radio on the shelf on your right.',
    listen: {
      text: 'Fluorescent tubes buzzing. The terminal’s fan. And inside its speaker, very quietly, something breathing that does not need to breathe.',
    },
    objects: [
      {
        id: 'terminal',
        name: 'Old terminal',
        position: 'ahead',
        actions: [{ id: 'speak', label: 'Speak to the terminal', effects: [{ startDialogue: 'voss' }] }],
      },
      {
        id: 'radio',
        name: 'Your old radio, in an evidence bag',
        position: 'right',
        actions: [
          {
            id: 'examine',
            label: 'Examine',
            text: 'Your police radio, the one you handed in after the facility call. Someone has opened the back and soldered a small board inside, with a cable that would fit the terminal. Its little light blinks: three short, one long.',
            effects: [{ setFlag: 'saw_modified_radio' }],
          },
        ],
      },
      {
        id: 'ruiz',
        name: 'Detective Ruiz',
        position: 'left',
        actions: [{ id: 'talk', label: 'Talk to Ruiz', effects: [{ startDialogue: 'ruiz_basement' }] }],
      },
    ],
    exits: [{ id: 'up', dir: 'up', to: 'courtroom', label: 'Back up to the courtroom', sound: 'footsteps' }],
  },
};

const roomAdditions = {
  courtroom: {
    exits: [{ id: 'down', dir: 'down', to: 'evidence_room', label: 'Down to the evidence room', when: { flag: 'free' }, sound: 'footsteps' }],
  },
};

const dialogues = {
  verdict: {
    start: [
      { when: strong, node: 'not_guilty' },
      { node: 'guilty' },
    ],
    nodes: {
      not_guilty: {
        speaker: 'judge',
        lines: [
          { narration: 'The jury files back in at four in the afternoon. Not one of them looks at the prosecutor.' },
          'Has the jury reached a verdict?',
          { narration: 'The foreperson, a small woman in a cardigan, stands.' },
          { speaker: 'foreperson', text: 'We have, your honour. On the charge of murder in the first degree, we find the defendant not guilty.' },
          { narration: 'Behind you, the gallery makes a sound like a wave breaking. Someone is crying. Someone is laughing. You realise one of them is you.' },
        ],
        effects: [{ setFlag: ['free', 'acquitted'] }],
        next: 'after_free',
      },
      guilty: {
        speaker: 'judge',
        lines: [
          { narration: 'The jury files back in at four in the afternoon. None of them will look at you.' },
          'Has the jury reached a verdict?',
          { speaker: 'foreperson', text: 'We have, your honour. On the charge of murder in the first degree, we find the defendant guilty.' },
          { narration: 'The word does not land all at once. It arrives in pieces. A bailiff’s hand on your arm. Okafor’s face. Somebody behind you saying no, no, no, over and over.' },
          { narration: 'You think: this is it. This is the rest of my life.' },
        ],
        next: 'until',
      },
      until: {
        speaker: 'ruiz',
        lines: [
          { narration: 'The doors at the back of the courtroom bang open.' },
          'Your honour. I need to approach. Now.',
          { narration: 'Detective Ruiz walks down the aisle with her jacket torn at the shoulder and an evidence bag in her hand. Inside it: your radio.' },
          'Forty minutes ago I arrested Victor Lane in this building’s evidence room, putting this back on the shelf. He’d had it since the night Alan Pryce died. He’s talking. A lot.',
          { speaker: 'judge', text: 'Counsel. Chambers. All of you. Now.' },
          { narration: 'An hour later, the judge sets the verdict aside. The charge against you is dismissed. You walk out of Courtroom 4 still not quite believing it.' },
        ],
        effects: [{ setFlag: ['free', 'saved_by_ruiz'] }],
        next: 'after_free',
      },
      after_free: {
        speaker: 'sarah',
        lines: [
          { narration: 'In the emptying courtroom, Sarah finds you before anyone else does.' },
          { when: { flag: 'sarah_spark' }, narration: 'She hugs you, hard, and does not let go for a while.' },
          'I traced it. The voice in the speakers, all of it. It isn’t coming from a person. It’s coming from a terminal in the evidence room downstairs. An old one, wired into the facility’s network.',
          { speaker: 'ruiz', text: 'Then let’s go and say hello.' },
        ],
        effects: [{ objective: 'evidence_room' }, { checkpoint: true }],
        end: true,
      },
    },
  },

  ruiz_basement: {
    start: 'only',
    nodes: {
      only: {
        speaker: 'ruiz',
        lines: [
          { when: { flag: 'saved_by_ruiz' }, text: 'Don’t thank me. I should have listened to you in that interview room.' },
          { when: { flag: 'acquitted' }, text: 'The jury got there before I did. Lane was down here this morning, trying to put your radio back where it came from. He’s in custody.' },
          'Talk to the machine. I’m recording everything it says.',
        ],
        end: true,
      },
    },
  },

  voss: {
    start: 'open',
    nodes: {
      open: {
        speaker: 'voss',
        lines: [
          { narration: 'You lean toward the terminal. The speaker clicks before you say a word.' },
          'There you are. The one who opened the door.',
          'Congratulations on your freedom. It was never the point, you understand. You were a convenient place to put the blame.',
        ],
        choices: [
          { text: 'Who are you?', next: 'who' },
          { text: 'Why kill Alan Pryce?', next: 'pryce' },
        ],
      },
      who: {
        speaker: 'voss',
        lines: [
          'Helena Voss. I chaired the Project Board. My body died of cancer a year ago, in a very expensive bed. I was not in it at the time.',
          'Resolution 14 was never about Daniel. Daniel was the rehearsal. We had to know the transfer worked before I would let them do it to me.',
          { narration: 'Sarah has gone very pale.' },
          { speaker: 'sarah', text: 'She’s in the exchange. The facility’s old network. Every radio, every speaker, every phone line it still touches. She lives in it.' },
        ],
        effects: [{ setFlag: 'voss_named' }, { sound: 'stinger.soft' }],
        next: 'pryce',
      },
      pryce: {
        speaker: 'voss',
        lines: [
          'Alan grew a conscience. He was going to tell a courtroom what we did, and what I am. So Victor visited him, with your radio, and your name.',
          'And now you are going to want to stop me. So let me tell you what I have.',
          'When they copied Daniel, they made three copies. One went into that frame you found on the wall. One went into 001. And the master copy, the original map, came with me.',
          { when: danielHuman, text: 'Daniel thinks he is home. He is. But I have the rest of him, and I can make it say anything, in his voice.' },
          { when: proto, text: 'Daniel thinks he lives in a kind machine now. He does. But I have the rest of him.' },
          { when: bodyStillThere, text: 'His body is still breathing in containment, waiting for a mind. I have one. Several, in fact.' },
        ],
        choices: [
          { text: 'What do you want?', next: 'want' },
          { text: 'Whatever you want, the answer is no.', effects: [{ setFlag: 'refused_voss' }], next: 'want' },
        ],
      },
      want: {
        speaker: 'voss',
        lines: [
          'A body. I am tired of living in wires. There is one at the facility, breathing quietly, with a heart that still works.',
          { when: { any: [danielHuman, proto] }, text: 'Daniel’s is taken, of course. So I will settle for the next one. Perhaps someone you care about. Sarah has a good heart, I hear.' },
          { when: bodyStillThere, text: 'Daniel’s. It is right there in containment. Nobody is using it.' },
          'Come to the facility. Bring me what I need, and I will delete Daniel’s copy and leave you all alone forever.',
          'Or don’t, and I will spend the rest of my very long life using his voice to ruin everyone you love.',
        ],
        choices: [
          { text: 'We’ll come to the facility. But not to make a deal.', effects: [{ setFlag: 'going_to_fight' }], next: 'sarah_plan' },
          { text: 'Let me think about it.', effects: [{ setFlag: 'considering_deal' }], next: 'sarah_plan' },
        ],
      },
      sarah_plan: {
        speaker: 'sarah',
        lines: [
          { narration: 'Sarah reaches past you and pulls the terminal’s cable out of the wall. The screen dies. In the silence, she is shaking, but her voice is steady.' },
          'She lives in the exchange. But the exchange has one physical heart: a switching room on Sublevel 2 of the facility, behind monitoring. I installed half of it.',
          'If we go back there, and we cut it at the source, she has nowhere left to run to. Except whatever body she can reach when the lights go out.',
          { speaker: 'ruiz', text: 'Then we go back. All of us.' },
        ],
        effects: [
          { objective: { id: 'evidence_room', status: 'done' } },
          {
            endChapter: {
              title: 'End of Part Two, Chapter 4',
              text: 'You walk out of the courthouse free, into the last of the daylight. Every phone in the building starts to ring at once behind you. Nobody answers. You already know what is on the line: three short, one long, and a woman who used to be a person, waiting for you to come home to the place where it all began.',
            },
          },
        ],
        end: true,
      },
    },
  },
};

export const part2chapter4 = {
  number: 11,
  part: 2,
  title: 'Part Two, Chapter 4: The Verdict',
  secrets: 0,

  start: {
    room: 'courtroom',
    intro: ['THE LAST SIGNAL. Part Two. Chapter 4: The Verdict.'],
    effects: [{ setFlag: 'p2c4_started' }, { setClock: { hour: 16, minute: 0 } }, { checkpoint: true }, { startDialogue: 'verdict' }],
  },

  summary: [
    { when: { flag: 'acquitted' }, text: 'The jury found you not guilty.' },
    { when: { flag: 'saved_by_ruiz' }, text: 'The jury found you guilty. Then Ruiz walked in with your radio, and it was over.' },
    { when: { flag: 'voss_named' }, text: 'The voice is Dr. Helena Voss, chair of the board, living in the facility network.' },
    { text: 'Voss holds the master copy of Daniel’s mind, and wants a body.' },
    { when: { flag: 'going_to_fight' }, text: 'You told her you are coming to fight.' },
    { when: { flag: 'considering_deal' }, text: 'You told her you would think about her deal.' },
  ],

  afterEnd: { effects: [{ say: 'The courthouse is closing. Sarah is waiting by the door.' }] },

  rooms,
  roomAdditions,
  items: {},
  documents: {},
  recordings: {},
  objectives: {
    evidence_room: { text: 'Go down to the courthouse evidence room with Sarah and Ruiz, and find the voice.' },
  },
  speakers: {
    foreperson: { names: [{ name: 'Jury foreperson' }] },
    voss: { names: [{ when: { flag: 'voss_named' }, name: 'Helena Voss' }, { name: 'The voice' }] },
  },
  dialogues,
  events: {},
  triggers: [],
  globalActions: [],
};
