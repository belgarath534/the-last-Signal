// Conversations for Chapter 2.
// The big choice: whether to tell Daniel that Emily is alive.
// What Daniel knew about her capture before tonight is left open on purpose
// (see the story bible); his lines never settle it.

export const dialogues = {
  b1_arrival: {
    start: 'open',
    nodes: {
      open: {
        speaker: 'daniel',
        via: 'speaker',
        lines: [
          'Sublevel one.',
          'I haven’t heard footsteps down here in a long time.',
          'At the end of the laboratory corridor there is a preservation lab, with a terminal. It holds the records of what they did here. My speakers don’t reach that room. They made sure of that.',
          'Bring me what’s on it.',
        ],
        choices: [
          { text: 'What will you do with the records?', next: 'why' },
          { text: 'What happened to the person who worked down here?', next: 'who' },
          { text: 'On my way.', next: 'close' },
        ],
      },
      why: {
        speaker: 'daniel', via: 'speaker',
        lines: ['Understand them. That’s all I have left to want.'],
        next: 'close',
      },
      who: {
        speaker: 'daniel', via: 'speaker',
        lines: ['Everyone worked down here, in the end.', 'Go.'],
        next: 'close',
      },
      close: {
        speaker: 'daniel', via: 'speaker',
        lines: [{ narration: 'The speakers click off. The ventilation breathes.' }],
        effects: [{ objective: 'retrieve_records' }],
        end: true,
      },
    },
  },

  daniel_transfer_suite: {
    start: 'only',
    nodes: {
      only: {
        speaker: 'daniel', via: 'speaker',
        lines: [{ narration: 'The speaker in the corridor crackles. For a moment there is only breathing that isn’t quite right.' }, 'Don’t stay in there long.'],
        end: true,
      },
    },
  },

  daniel_found_emily: {
    start: 'open',
    nodes: {
      open: {
        speaker: 'daniel',
        via: 'radio',
        lines: ['You went quiet in there. My speakers don’t reach that room.', 'What did you find?'],
        choices: [
          {
            text: 'Emily Carter. She’s alive, in a preservation capsule.',
            effects: [{ honest: true }, { setFlag: 'told_daniel_emily' }, { trust: { amount: 10, reason: 'told him Emily is alive' } }],
            next: 'told',
          },
          {
            text: 'There’s a woman in a capsule. The label says Carter.',
            effects: [{ honest: true }, { setFlag: 'told_daniel_emily' }, { trust: { amount: 8, reason: 'told him about the woman in the capsule' } }],
            next: 'told',
          },
          {
            text: 'Old equipment. Nothing that matters.',
            effects: [{ lie: { id: 'emily', about: 'finding Emily' } }],
            next: 'lied',
          },
          {
            text: 'I’ll tell you when you tell me what they did to you.',
            when: { notFlag: 'bargained_emily' },
            effects: [{ setFlag: 'bargained_emily' }, { trust: { amount: -4, reason: 'tried to bargain' } }],
            next: 'bargain',
          },
        ],
      },
      bargain: {
        speaker: 'daniel', via: 'radio',
        lines: ['Not like this. Not as a trade.', 'What did you find?'],
        choices: [
          { text: 'Emily Carter. She’s alive, in a preservation capsule.', effects: [{ honest: true }, { setFlag: 'told_daniel_emily' }, { trust: { amount: 8, reason: 'told him Emily is alive, eventually' } }], next: 'told' },
          { text: 'Old equipment. Nothing that matters.', effects: [{ lie: { id: 'emily', about: 'finding Emily' } }], next: 'lied' },
        ],
      },
      told: {
        speaker: 'daniel', via: 'radio',
        lines: [
          { narration: 'Nothing. The channel stays open. You can hear the faint whir on his end, and then it stops, as if whatever makes it has been told to be still.' },
          'Alive.',
          { narration: 'Another long silence.' },
          'Get her out of there. The medical ward has its own power. Get her there. Whatever else happens tonight, whatever you think of me, do that.',
        ],
        choices: [
          { text: 'I will.', next: 'close' },
          { text: 'Who is she to you?', next: 'who_is_she' },
        ],
      },
      who_is_she: {
        speaker: 'daniel', via: 'radio',
        lines: ['She was the only one who argued for me.', 'Go.'],
        next: 'close',
      },
      lied: {
        speaker: 'daniel', via: 'radio',
        lines: ['Nothing.', 'All right. The records, then. When you can.'],
        next: 'close',
      },
      close: {
        speaker: 'daniel', via: 'radio',
        lines: [{ narration: 'The radio clicks off.' }],
        effects: [{ setFlag: 'emily_conversation_done' }],
        end: true,
      },
    },
  },

  daniel_records: {
    start: [
      { when: { lied: 'emily' }, node: 'caught' },
      { node: 'read' },
    ],
    nodes: {
      caught: {
        speaker: 'daniel', via: 'radio',
        lines: [
          { narration: 'The facility radio clicks on.' },
          'Capsule 3. Occupant: Carter, E.',
          'You told me there was nothing in that room.',
        ],
        effects: [{ exposeLie: { id: 'emily', penalty: 25, reason: 'lied about finding Emily' } }],
        end: true,
      },
      read: {
        speaker: 'daniel', via: 'radio',
        lines: [
          { narration: 'The facility radio clicks on.' },
          'Attempted access to sealed records. That’s what they called it.',
          'She went looking. For my files. For me.',
          'Thank you for sending them. You didn’t have to.',
        ],
        effects: [{ trust: { amount: 4, reason: 'sent him the records' } }],
        end: true,
      },
    },
  },

  daniel_hears_alarm: {
    start: [
      { when: { lied: 'emily' }, node: 'caught' },
      { node: 'told' },
    ],
    nodes: {
      caught: {
        speaker: 'daniel', via: 'radio',
        lines: [
          'Emily’s power. That alarm is on the facility channel. I can hear every word of it.',
          'Old equipment. Nothing that matters. That’s what you said.',
        ],
        effects: [{ exposeLie: { id: 'emily', penalty: 25, reason: 'lied about finding Emily' } }],
        end: true,
      },
      told: {
        speaker: 'daniel', via: 'radio',
        lines: ['That’s her monitor. I can hear it on the facility channel. Move.'],
        end: true,
      },
    },
  },

  daniel_001_request: {
    start: 'open',
    nodes: {
      open: {
        speaker: 'daniel',
        via: 'speaker',
        lines: [
          { when: [{ emilyAlive: true }, { flag: 'told_daniel_emily' }], text: 'I can hear her monitor through the ward speaker. Steady.' },
          { when: [{ emilyAlive: true }, { flag: 'told_daniel_emily' }], text: 'Thank you.' },
          { when: [{ emilyAlive: false }, { any: [{ flag: 'told_daniel_emily' }, { lieExposed: 'emily' }] }], text: 'I heard her monitor stop.' },
          { when: [{ emilyAlive: false }, { any: [{ flag: 'told_daniel_emily' }, { lieExposed: 'emily' }] }], narration: 'He does not say anything else for a long time.' },
          'There is something in storage. You’ve seen it.',
          '001. The first one. I built it to help people. They changed it, after they took me off the project.',
          'It remembers things I don’t. Things they took out of me. I need you to wake it up.',
        ],
        choices: [
          { text: 'Why can’t you wake it yourself?', when: { notFlag: 'asked_why_001' }, effects: [{ setFlag: 'asked_why_001' }], next: 'why' },
          { text: 'The crate says it should never be activated.', when: { notFlag: 'asked_crate_001' }, effects: [{ setFlag: 'asked_crate_001' }], next: 'crate' },
          {
            text: 'I’ll wake it.',
            effects: [{ setFlag: 'agreed_activate_001' }, { trust: { amount: 3, reason: 'agreed to wake 001' } }],
            next: 'agree',
          },
          {
            text: 'Not yet. Not until you tell me where you are.',
            effects: [{ setFlag: 'refused_001_for_now' }, { trust: { amount: -2, reason: 'refused to wake 001 for now' } }],
            next: 'refuse',
          },
        ],
      },
      why: {
        speaker: 'daniel', via: 'speaker',
        lines: ['Because I can’t reach it. Not from where I am.'],
        choices: [
          { text: 'Why can’t you wake it yourself?', when: { notFlag: 'asked_why_001' }, effects: [{ setFlag: 'asked_why_001' }], next: 'why' },
          { text: 'The crate says it should never be activated.', when: { notFlag: 'asked_crate_001' }, effects: [{ setFlag: 'asked_crate_001' }], next: 'crate' },
          { text: 'I’ll wake it.', effects: [{ setFlag: 'agreed_activate_001' }, { trust: { amount: 3, reason: 'agreed to wake 001' } }], next: 'agree' },
          { text: 'Not yet. Not until you tell me where you are.', effects: [{ setFlag: 'refused_001_for_now' }, { trust: { amount: -2, reason: 'refused to wake 001 for now' } }], next: 'refuse' },
        ],
      },
      crate: {
        speaker: 'daniel', via: 'speaker',
        lines: ['The board stencilled that. The same board that put Emily in a box and me in this.'],
        choices: [
          { text: 'Why can’t you wake it yourself?', when: { notFlag: 'asked_why_001' }, effects: [{ setFlag: 'asked_why_001' }], next: 'why' },
          { text: 'The crate says it should never be activated.', when: { notFlag: 'asked_crate_001' }, effects: [{ setFlag: 'asked_crate_001' }], next: 'crate' },
          { text: 'I’ll wake it.', effects: [{ setFlag: 'agreed_activate_001' }, { trust: { amount: 3, reason: 'agreed to wake 001' } }], next: 'agree' },
          { text: 'Not yet. Not until you tell me where you are.', effects: [{ setFlag: 'refused_001_for_now' }, { trust: { amount: -2, reason: 'refused to wake 001 for now' } }], next: 'refuse' },
        ],
      },
      agree: {
        speaker: 'daniel', via: 'speaker',
        lines: ['Good.', 'Be gentle with it. It was built to be gentle with you.'],
        next: 'end',
      },
      refuse: {
        speaker: 'daniel', via: 'speaker',
        lines: ['Then we’re both waiting.', 'It isn’t going anywhere. Neither am I.'],
        next: 'end',
      },
      end: {
        lines: [],
        effects: [
          {
            endChapter: {
              title: 'End of Chapter 2',
              text: 'In the storage room, under a grey tarp, a hand that was built to hold someone waits to be woken. In the ward, a monitor keeps its slow time. And somewhere in the walls of this place, Daniel is listening.',
            },
          },
        ],
        end: true,
      },
    },
  },
};
