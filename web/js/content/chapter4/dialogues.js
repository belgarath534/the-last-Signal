// Conversations for Chapter 4.
// The turning point from the brief: Emily and Daniel speak over the radio.
// It raises Daniel's trust a lot, but nothing here makes it permanent.

const knowsEmily = { any: [{ flag: 'told_daniel_emily' }, { lieExposed: 'emily' }] };
const emilyNeedsCare = [{ emilyIn: 'ward' }, { emilyAlive: true }];

const watchChoices = [
  {
    text: 'Yes. Watch her for me.',
    effects: [{ setFlag: 'daniel_watching' }, { trust: { amount: 3, reason: 'trusted him to watch Emily' } }],
    next: 'watch_yes',
  },
  {
    text: 'No. I’ll look after her myself.',
    effects: [{ setFlag: 'refused_watch' }],
    next: 'watch_no',
  },
];

export const dialogues = {
  ch4_arrival: {
    start: 'open',
    nodes: {
      open: {
        speaker: 'daniel',
        via: 'speaker',
        lines: [
          'Sublevel 2.',
          'They never turned anything off down here. They couldn’t afford to.',
          'Records are on the left. Emily’s revival codes will be in her file. Containment is straight ahead.',
          { narration: 'A pause.' },
          'What you find in containment is the reason I asked you to come. Go when you’re ready. Not before.',
        ],
        next: [
          { when: [knowsEmily, { trustAtLeast: 20 }, emilyNeedsCare], node: 'offer' },
          { node: 'close' },
        ],
      },
      offer: {
        speaker: 'daniel',
        via: 'speaker',
        lines: [
          'One more thing. From here I can reach the ward’s systems. I can’t hold her hand, but I can adjust her oxygen and fluids, and I can watch her monitor.',
          'If you want, I’ll watch her while you work. I’ll tell you if anything changes.',
        ],
        choices: [
          ...watchChoices,
          { text: 'Why would you?', next: 'why' },
        ],
      },
      why: {
        speaker: 'daniel', via: 'speaker',
        lines: ['Because I owe her two years.'],
        choices: watchChoices,
      },
      watch_yes: {
        speaker: 'daniel', via: 'speaker',
        lines: ['Thank you.', 'She won’t slip while I’m watching. Not as fast, anyway. Her power is still on you.'],
        next: 'close',
      },
      watch_no: {
        speaker: 'daniel', via: 'speaker',
        lines: ['I understand.', 'There’s a medical link in the monitoring room, on your right. It’s not the same as being there. It’s something.'],
        next: 'close',
      },
      close: {
        speaker: 'daniel', via: 'speaker',
        lines: [{ narration: 'The speaker clicks off. The machines go on humming.' }],
        effects: [{ objective: 'find_daniel' }, { objective: 'find_codes' }],
        end: true,
      },
    },
  },

  daniel_body: {
    start: 'open',
    nodes: {
      open: {
        speaker: 'daniel',
        via: 'speaker',
        lines: [
          { narration: 'The containment speaker clicks on. For a while there is only the ventilator.' },
          'You found it.',
          'Tell me. Is it still breathing?',
        ],
        choices: [
          {
            text: 'Yes. Machines are keeping it alive.',
            effects: [{ honest: true }, { trust: { amount: 5, reason: 'told him the truth about his body' } }, { setFlag: 'told_body_alive' }],
            next: 'alive',
          },
          {
            text: 'No. I’m sorry, Daniel. It’s gone.',
            effects: [{ lie: { id: 'body', about: 'his body' } }],
            next: 'gone',
          },
          {
            text: 'Do you want to come back to it?',
            when: { notFlag: 'asked_come_back' },
            effects: [{ setFlag: 'asked_come_back' }],
            next: 'come_back',
          },
        ],
      },
      come_back: {
        speaker: 'daniel', via: 'speaker',
        lines: ['Every hour. And never.', 'Is it breathing?'],
        choices: [
          {
            text: 'Yes. Machines are keeping it alive.',
            effects: [{ honest: true }, { trust: { amount: 5, reason: 'told him the truth about his body' } }, { setFlag: 'told_body_alive' }],
            next: 'alive',
          },
          {
            text: 'No. I’m sorry, Daniel. It’s gone.',
            effects: [{ lie: { id: 'body', about: 'his body' } }],
            next: 'gone',
          },
        ],
      },
      alive: {
        speaker: 'daniel', via: 'speaker',
        lines: [
          'Then they kept it. Of course they kept it.',
          'The chart will say why. I already know the word they used.',
        ],
        next: 'rest',
      },
      gone: {
        speaker: 'daniel', via: 'speaker',
        lines: [{ narration: 'A long silence.' }, 'Thank you for telling me.', { narration: 'He sounds almost relieved.' }],
        next: 'rest',
      },
      rest: {
        speaker: 'daniel', via: 'speaker',
        lines: [
          'That is what’s left of me. The rest of me is somewhere else.',
          'Don’t ask me where. Not yet.',
        ],
        end: true,
      },
    },
  },

  emily_wakes: {
    start: 'open',
    nodes: {
      open: {
        speaker: 'emily',
        lines: [
          { narration: 'Emily’s eyes open. She drags in a breath like someone coming up from deep water, and grabs the edge of the capsule.' },
          'Where... where am I? Who are you?',
        ],
        choices: [
          { text: 'You’re safe. You’re in the medical ward. Breathe.', effects: [{ setFlag: 'calm_wake' }], next: 'calmer' },
          { text: 'I’m a police officer. I used to work here.', next: 'officer' },
          { text: 'Daniel sent me.', next: 'daniel' },
        ],
      },
      calmer: {
        speaker: 'emily',
        lines: [{ narration: 'She does. Slowly, her grip loosens.' }, 'The ward. They put me in... they put me in that thing.', 'How long?'],
        next: 'how_long',
      },
      officer: {
        speaker: 'emily',
        lines: ['Police.', { narration: 'She studies your face.' }, 'I think I remember you. From before. Everything is so far away.', 'How long was I in there?'],
        next: 'how_long',
      },
      daniel: {
        speaker: 'emily',
        lines: [{ narration: 'Her head snaps toward you.' }, 'Daniel? Daniel is alive?', 'How long was I in there?'],
        next: 'how_long',
      },
      how_long: {
        speaker: 'emily',
        lines: [{ narration: 'You tell her you don’t know. A long time. She closes her eyes.' }, 'Daniel. Is he...?'],
        choices: [
          { text: 'He’s alive. In a way. He’s been talking to me all night, on the radio.', next: 'offer_call' },
          { text: 'I think he should tell you himself.', next: 'offer_call' },
        ],
      },
      offer_call: {
        speaker: 'emily',
        lines: ['Can I talk to him?'],
        choices: [
          { text: 'Hold out the radio and call Daniel', when: { has: 'facility_radio' }, next: 'call', echo: false },
          { text: 'Not yet. Rest first.', effects: [{ setFlag: 'call_later' }], next: 'later' },
        ],
      },
      later: {
        speaker: 'emily',
        lines: ['All right.', { narration: 'She lies back, but she doesn’t close her eyes.' }, 'Don’t make me wait too long.'],
        end: true,
      },
      call: {
        lines: [],
        effects: [{ startDialogue: 'emily_daniel' }],
        end: false,
      },
    },
  },

  emily_talk: {
    start: [
      { when: { notFlag: 'emily_daniel_talked' }, node: 'ask' },
      { node: 'after' },
    ],
    nodes: {
      ask: {
        speaker: 'emily',
        lines: ['Is it time? Can I talk to him now?'],
        choices: [
          { text: 'Hold out the radio and call Daniel', when: { has: 'facility_radio' }, echo: false, next: 'call' },
          { text: 'Soon. Rest a little longer.', end: true },
        ],
      },
      call: {
        lines: [],
        effects: [{ startDialogue: 'emily_daniel' }],
      },
      after: {
        speaker: 'emily',
        lines: [
          { when: { flag: 'saw_body' }, text: 'You found him, didn’t you. Down there. His body.' },
          'I’m not strong enough to walk yet. Go. Do what he needs. Come back for me.',
        ],
        end: true,
      },
    },
  },

  emily_daniel: {
    start: 'open',
    nodes: {
      open: {
        speaker: 'daniel',
        via: 'radio',
        lines: [
          { narration: 'You hold the radio between you and press transmit. Static. Then nothing, for so long that Emily reaches for the radio herself.' },
          'Em?',
        ],
        next: 'emily1',
      },
      emily1: {
        speaker: 'emily',
        lines: [
          { narration: 'She makes a sound that is half a laugh and half something else.' },
          'Daniel. They wouldn’t tell me where you were. I came to find you. I came to find you and they...',
        ],
        next: 'daniel1',
      },
      daniel1: {
        speaker: 'daniel',
        via: 'radio',
        lines: [
          'I know. I know now. They told me you’d left. That you didn’t want to see me.',
          'I believed them. I’m sorry. I’m so sorry.',
        ],
        next: 'emily2',
      },
      emily2: {
        speaker: 'emily',
        lines: ['Your voice is different.'],
        next: 'daniel2',
      },
      daniel2: {
        speaker: 'daniel',
        via: 'radio',
        lines: ['A lot of me is different.'],
        next: 'emily3',
      },
      emily3: {
        speaker: 'emily',
        lines: ['Where are you?'],
        next: 'daniel3',
      },
      daniel3: {
        speaker: 'daniel',
        via: 'radio',
        lines: [{ narration: 'A long pause.' }, 'I can’t tell you that yet. Not even you.'],
        next: [
          { when: [{ lied: 'emily' }, { not: { lieExposed: 'emily' } }], node: 'lie_found' },
          { node: 'emily_asks' },
        ],
      },
      lie_found: {
        speaker: 'daniel',
        via: 'radio',
        lines: [
          { narration: 'Then his voice changes, and it is aimed at you.' },
          'You stood in that lab and told me there was nothing in it. She was in it.',
        ],
        effects: [{ exposeLie: { id: 'emily', penalty: 25, reason: 'lied about finding Emily' } }],
        next: 'emily_asks',
      },
      emily_asks: {
        speaker: 'emily',
        lines: [{ narration: 'Emily lowers the radio and looks at you.' }, 'Can we trust him?'],
        choices: [
          { text: 'He’s helped me all night. I think so.', next: 'end' },
          { text: 'I don’t know yet.', next: 'end' },
          { text: 'I trust him more than the people who did this.', next: 'end' },
        ],
      },
      end: {
        speaker: 'daniel',
        via: 'radio',
        lines: [
          'Whatever happens next.',
          'Thank you. For her.',
        ],
        effects: [{ setFlag: 'emily_daniel_talked' }, { trust: { amount: 15, reason: 'arranged for him to speak with Emily' } }, { checkpoint: true }],
        end: true,
      },
    },
  },

  daniel_ch4_end: {
    start: 'open',
    nodes: {
      open: {
        speaker: 'daniel',
        via: 'speaker',
        lines: [
          { when: { flag: 'emily_daniel_talked' }, text: 'I heard her voice. Two years, and I heard her voice.' },
          { when: { emilyAlive: false }, text: 'I keep thinking about the last thing she said to me. I don’t remember it. I didn’t know it would be the last.' },
          'You’ve seen what they left of me. There’s one more thing you need to see, and it isn’t on this floor.',
          'Rest, if you can. Then come back to the radio.',
        ],
        effects: [
          {
            endChapter: {
              title: 'End of Chapter 4',
              text: 'Below the floor where 001 walks its rounds, a ventilator breathes for a man who is somewhere else. Beside his bed, a steel frame stands empty, its clamps open, labelled with one word: relocated. Wherever the rest of Daniel is, it is listening to you breathe.',
            },
          },
        ],
        end: true,
      },
    },
  },
};
