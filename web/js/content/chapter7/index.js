// Chapter 7 — "The Last Signal". The finale of Part One.
//
// Which endings you can reach depends on the whole game:
//   Restored  - bring Daniel back to his own body (needs Emily awake or
//               Marcus helping, 001's copy, and enough trust)
//   Romance   - Restored, plus Emily alive and awake, her lanyard given
//               without inventing her words, and deep trust
//   Lost      - he refuses at the last moment (low trust), or you switch
//               him off
//   Abandon   - you walk away
//   Revenge   - you open his clamps and let him go after the board
//   Prototype - the secret connection: Daniel goes into 001, the body he
//               designed to be kind

const emilyAwake = [{ flag: 'emily_awake' }, { emilyAlive: true }];
const helper = { any: [{ flag: 'marcus_helping' }, { all: emilyAwake }] };
const copyReachable = { any: [{ flag: 'ally_001' }, { flag: 'knows_copy' }] };
const romance = [
  ...emilyAwake,
  { flag: 'badge_given' },
  { notFlag: 'invented_message' },
  { trustAtLeast: 50 },
];

const choices = [
  { text: 'What do you want, Daniel?', when: { notFlag: 'asked_want' }, effects: [{ setFlag: 'asked_want' }], next: 'want' },
  {
    text: 'Let’s bring you home. Back to your own body.',
    when: [helper, copyReachable],
    next: [
      { when: { trustBelow: 30 }, node: 'refuses' },
      { node: 'transfer' },
    ],
  },
  {
    text: '001 is what you were trying to build. Go into it.',
    when: [{ flag: 'ally_001' }, { flag: 'knows_copy' }],
    next: 'prototype',
  },
  { text: 'Open the clamps. Go and find the rest of them.', when: { has: 'marcus_remote' }, next: 'revenge' },
  { text: 'Press the red button.', when: { has: 'marcus_remote' }, next: 'switch_off' },
  { text: 'I can’t do this. I’m leaving.', next: 'abandon' },
  { text: 'Not yet. I need to do something first.', echo: false, next: 'not_yet' },
];

const ending = (id, title, text) => ({
  lines: [],
  effects: [{ endChapter: { title: `Ending: ${title}`, ending: id, text } }],
  end: true,
});

const dialogues = {
  finale: {
    start: 'open',
    nodes: {
      open: {
        speaker: 'daniel',
        lines: [
          { narration: 'Daniel’s amber eyes find yours. The lanyard on his wrist, if you gave it, catches the light.' },
          'So. Here we are.',
          { when: { has: 'marcus_remote' }, text: 'You have the remote. You can open these clamps, or you can switch me off. I won’t pretend I don’t know that.' },
          { when: helper, text: 'And there is a way home, if I want it. A chair I swore I would never sit in again.' },
          'Whatever you choose, I would rather you chose it than anyone else.',
        ],
        choices,
      },
      want: {
        speaker: 'daniel',
        lines: [
          { when: { all: emilyAwake }, text: 'I want to hold a cup of coffee and not break it. I want to give it to her. That’s all. That’s everything.' },
          { when: { emilyAlive: false }, text: 'I wanted her to be alive. I don’t know what I want now. Maybe to stop.' },
          { when: [{ flag: 'found_emily' }, { emilyAlive: true }, { notFlag: 'emily_awake' }], text: 'I want her to wake up and see me as I was.' },
        ],
        choices,
      },
      not_yet: {
        speaker: 'daniel',
        lines: ['I’ve waited two years. Go. Tell me when you’re ready.'],
        end: true,
      },
      refuses: {
        speaker: 'daniel',
        lines: [
          { narration: 'You walk him through the plan: the copy in 001, the chair, his body breathing below.' },
          'And you’ll be the one at the controls. You.',
          'No. Not after tonight. I don’t trust you with my body. I don’t trust anyone with it.',
          { narration: 'Before you can answer, his eyes dim. One by one, the lights across his chest go out. He has switched himself off. The whir stops.' },
        ],
        next: 'lost_end',
      },
      transfer: {
        lines: [
          { narration: 'It takes the rest of the night. You open the clamps with Marcus’s remote, or with your own hands and a crowbar. Daniel walks down the stairwell on legs that were never his.' },
          { when: { flag: 'ally_001' }, narration: '001 walks beside him, close, like a shadow that has finally found what it belongs to.' },
          { when: { all: emilyAwake }, narration: 'Emily sits at the transfer suite’s controls in a blanket, her hands sure on the keys she wrote eleven years ago.' },
          { when: [{ flag: 'marcus_helping' }, { not: { all: emilyAwake } }], narration: 'Marcus works the controls with his cuffed hands, reading from a manual he clearly knows by heart.' },
          { narration: 'His body is wheeled up from Sublevel 2, still breathing. The chair. This time, nobody straps him down.' },
          { narration: 'A long tone. Then the monitor beside the bed changes its rhythm. In, out. In, out. Not the machine. Him.' },
        ],
        next: [
          { when: romance, node: 'romance_end' },
          { node: 'restored_end' },
        ],
      },
      romance_end: ending(
        'romance',
        'Two Coffees',
        'Daniel opens his eyes in his own body, and the first thing he sees is Emily, asleep in the chair beside him with her hand on his. Weeks later, the doctors say he will walk again. Months later, he does. Every morning he brings two coffees, and one of them is never a mistake. She tells him, finally, the thing she came to say that night. He already knew. On the last night before the facility is sealed for good, the old facility radio on your kitchen table clicks on by itself. Three short tones. One long. Not his.',
      ),
      restored_end: ending(
        'restored',
        'Home',
        'Daniel wakes in his own body, weak and thin and himself. He can barely lift a cup. He laughs about it, and it is the first time you have heard him laugh. The facility is sealed. The board is investigated. His hands heal slowly. Some nights, he says, he still listens for the whir of a body that is not there anymore. One night months later, your phone rings from an unknown number. Three short tones. One long.',
      ),
      lost_end: ending(
        'lost',
        'Silence',
        'Daniel is gone. You stand in the dark room until the rain stops. Below you, a ventilator keeps breathing for a body that has nobody to come home to it. You walk out of the facility at dawn and do not look back, again. But for years afterward, whenever a radio crackles, you wait for three short tones and one long. They never come.',
      ),
      switch_off: {
        lines: [
          { narration: 'Your thumb finds the red button.' },
        ],
        choices: [
          { text: 'Press it', echo: false, next: 'switched' },
          { text: 'Take your thumb away', echo: false, next: 'open' },
        ],
      },
      switched: {
        speaker: 'daniel',
        lines: [
          'I understand.',
          'Tell her...',
          { narration: 'The lights in his eyes go out mid-word. The whir stops. The room is completely silent for the first time all night.' },
        ],
        next: 'lost_end',
      },
      revenge: {
        speaker: 'daniel',
        lines: [
          { narration: 'You press the release. The clamps open one by one, wrists, chest, throat. Daniel steps down off the wall and stands to his full height, and looks at his free hands for a long time.' },
          { when: { flag: 'revenge_marcus' }, text: 'Marcus was the first. He won’t be the last.' },
          'They scattered. I have their names. I have two years of listening.',
        ],
        next: 'revenge_end',
      },
      revenge_end: ending(
        'revenge',
        'Names',
        'He walks out of the stairwell, through the lobby, and out into the rain without looking back. You report the facility in the morning. Over the following year, one by one, the names on the Project Board stop answering their phones. Nobody can explain how. Every case file has the same strange detail: a recording found at the scene, three short tones and one long. You keep your own copy of the report in a drawer, and you never decide whether you did the right thing.',
      ),
      prototype: {
        speaker: 'daniel',
        lines: [
          { narration: 'He goes very quiet.' },
          'The body I designed. The one with the hands.',
          'It already carries a copy of me. And the part of it that was mine, the part that was kind, you gave back to it.',
          'Yes. Yes. That is where I belong.',
        ],
        next: 'prototype_end',
      },
      prototype_end: ending(
        'prototype',
        'The First of Its Kind',
        'The transfer is quiet. When it is done, the frame on the wall is empty, and 001 opens its amber eyes and says hello in Daniel’s voice, gentle and slightly too slow, like someone reading aloud for a child. The body that was built to hold a cup without breaking it holds yours, very carefully, and shakes it. It is the helper he always meant to build, and it has his mind, and his kindness, and nothing the board ever wrote. Some say the secret of the whole experiment was always in 001. They are right. Months later, three short tones and one long come over every police radio in the county. Then: Hello. I am here to help.',
      ),
      abandon: {
        lines: [
          { narration: 'You step back from him.' },
        ],
        next: [
          { when: { trustAtLeast: 30 }, node: 'abandon_warm' },
          { node: 'abandon_cold' },
        ],
      },
      abandon_warm: {
        speaker: 'daniel',
        lines: ['I understand. It was never your job.', 'Thank you for coming. Nobody else did.'],
        next: 'abandon_end',
      },
      abandon_cold: {
        speaker: 'daniel',
        lines: ['Of course.', 'Everyone leaves this place in the end.'],
        next: 'abandon_end',
      },
      abandon_end: ending(
        'abandon',
        'Code Four',
        'You walk up the stairwell, through the lobby, out past the cut padlock to your patrol car. The rain has stopped. You key your radio. Unit 14. Signal call resolved. Nothing here. Code four. You drive away. Behind you, in a small dark room, a voice that has nobody to talk to starts humming, very quietly, a tune you will never be able to forget.',
      ),
    },
  },
};

export const chapter7 = {
  number: 7,
  title: 'Chapter 7: The Last Signal',
  secrets: 0,

  start: {
    room: 'isolation',
    intro: [
      'THE LAST SIGNAL. Chapter 7: The Last Signal.',
      'You come back down the stairwell. The door is open. He is waiting.',
    ],
    effects: [{ setFlag: 'ch7_started' }, { checkpoint: true }, { startDialogue: 'finale' }],
  },

  summary: [],
  afterEnd: { effects: [] },

  roomAdditions: {
    isolation: {
      objects: [
        {
          id: 'decide',
          name: 'Daniel, waiting for your decision',
          position: 'ahead',
          when: [{ flag: 'ch7_started' }, { not: { inDialogue: true } }],
          actions: [{ id: 'ready', label: 'Tell Daniel you are ready to decide', effects: [{ checkpoint: true }, { startDialogue: 'finale' }] }],
        },
      ],
    },
  },

  endings: {
    romance: { name: 'Two Coffees', blurb: 'Daniel restored to his own body, and Emily beside him.' },
    restored: { name: 'Home', blurb: 'Daniel restored to his own body.' },
    lost: { name: 'Silence', blurb: 'Daniel is gone.' },
    abandon: { name: 'Code Four', blurb: 'You walked away.' },
    revenge: { name: 'Names', blurb: 'You set Daniel free to hunt the board.' },
    prototype: { name: 'The First of Its Kind', blurb: 'The secret of the experiment: Daniel in the body he designed.' },
  },

  rooms: {},
  items: {},
  documents: {},
  recordings: {},
  objectives: {},
  speakers: {},
  dialogues,
  events: {},
  triggers: [],
  globalActions: [],
};
