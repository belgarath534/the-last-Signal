// Conversations for Chapter 1.
// Trust numbers are deliberately small: this chapter is first contact.
// Daniel does not give his name freely. He gives it if trust is high
// enough, or the player works it out from his office.

const named = { flag: 'daniel_named' };
const notNamed = { notFlag: 'daniel_named' };

export const speakers = {
  daniel: {
    names: [{ when: named, name: 'Daniel' }, { name: 'Unknown voice' }],
  },
  dispatch: { names: [{ name: 'Dispatch' }] },
};

export const dialogues = {
  daniel_first_contact: {
    start: 'open',
    nodes: {
      open: {
        speaker: 'daniel',
        via: 'radio',
        lines: [
          { narration: 'The radio in your hand clicks. Someone on the other end has pressed transmit. You hear breathing that is almost, but not quite, right. Then a man’s voice, low and careful.' },
          'You picked it up. Good. I was starting to think no one ever would.',
          'Who sent you?',
        ],
        choices: [
          {
            text: 'Police. Dispatch picked up a signal from this place.',
            effects: [{ honest: true }, { trust: { amount: 5, reason: 'told the truth about being police' } }, { setFlag: 'told_police' }],
            next: 'police',
          },
          {
            text: 'I used to work here. A long time ago.',
            effects: [{ honest: true }, { trust: { amount: 8, reason: 'admitted they used to work here' } }, { setFlag: 'told_former_employee' }],
            next: 'former',
          },
          {
            text: 'Just a maintenance contractor. Checking the power.',
            effects: [{ lie: { id: 'identity', about: 'who you are' } }, { setFlag: 'claimed_contractor' }],
            next: 'contractor',
          },
          {
            text: 'Say nothing.',
            echo: false,
            effects: [
              { say: 'You keep your thumb off the transmit button.' },
              { trust: { amount: -5, reason: 'refused to answer' } },
            ],
            next: 'silence',
          },
        ],
      },
      police: {
        speaker: 'daniel',
        via: 'radio',
        lines: ['Police. So someone finally heard it.', 'Fine. Better you than one of them.'],
        next: 'instructions',
      },
      former: {
        speaker: 'daniel',
        via: 'radio',
        lines: [
          { narration: 'A long pause. Long enough that you check the radio is still on.' },
          'Then you know what this place is. Or you think you do.',
          'You came back. Most people who leave here don’t.',
        ],
        next: 'instructions',
      },
      contractor: {
        speaker: 'daniel',
        via: 'radio',
        lines: ['A contractor. At two in the morning. In the rain.', 'All right. Let’s say I believe you.'],
        next: 'instructions',
      },
      silence: {
        speaker: 'daniel',
        via: 'radio',
        lines: ['Careful. I understand careful.', 'But I can hear the rain on your coat, so don’t pretend you’re not there.'],
        next: 'instructions',
      },
      instructions: {
        speaker: 'daniel',
        via: 'radio',
        lines: [
          { when: { notFlag: 'power_on' }, text: 'There is a security office off the lobby. Emergency power. Turn it on and I won’t need this toy radio to talk to you.' },
          { when: { flag: 'power_on' }, text: 'You already turned the emergency power on. That’s how I found you. Keep the radio anyway.' },
        ],
        choices: [
          {
            text: 'Who are you?',
            next: 'who',
          },
          {
            text: 'Why should I trust you?',
            next: 'why_trust',
          },
          {
            text: 'All right. I’m on it.',
            next: 'close',
          },
        ],
      },
      who: {
        speaker: 'daniel',
        via: 'radio',
        lines: ['Someone who used to matter here.', 'Turn the power on. Then we’ll see how much I tell you.'],
        next: 'close',
      },
      why_trust: {
        speaker: 'daniel',
        via: 'radio',
        lines: ['You shouldn’t. I don’t trust you either.', 'That makes us even. It’s a place to start.'],
        next: 'close',
      },
      close: {
        speaker: 'daniel',
        via: 'radio',
        lines: [{ narration: 'The channel clicks closed. The lobby is quiet again, except for the rain.' }],
        effects: [
          { setFlag: 'daniel_contacted' },
          { objective: 'restore_power' },
          { schedule: { event: 'dispatch_checkin', in: 12 } },
        ],
        end: true,
      },
    },
  },

  daniel_power: {
    start: 'open',
    nodes: {
      open: {
        speaker: 'daniel',
        via: 'speaker',
        lines: [
          { narration: 'Every speaker in the building pops at once. The voice from the radio fills the corridors, too loud, then adjusts.' },
          'There. Better. Now I can hear the whole building again.',
          'The elevator to the lower levels has its own lock. I can open it, if I decide to.',
        ],
        choices: [
          {
            text: 'I’m here to help. Whatever happened down there, I want to know.',
            effects: [{ honest: true }, { trust: { amount: 5, reason: 'said they came to help' } }],
            next: 'help',
          },
          {
            text: 'Tell me who you are first.',
            next: 'deflect',
          },
          {
            text: 'If you’re hiding something down there, I’ll find it with or without you.',
            effects: [{ trust: { amount: -6, reason: 'threatened him' } }, { setFlag: 'threatened_daniel' }],
            next: 'threat',
          },
        ],
      },
      help: {
        speaker: 'daniel',
        via: 'speaker',
        lines: ['Everyone who came here said that once.', 'We’ll see. Call me on the radio when you want something.'],
        next: 'close',
      },
      deflect: {
        speaker: 'daniel',
        via: 'speaker',
        lines: ['No. Not yet.', 'Look around. This building talks, if you listen. Call me on the radio when you want something.'],
        next: 'close',
      },
      threat: {
        speaker: 'daniel',
        via: 'speaker',
        lines: ['With or without me.', 'You’d be surprised how much of this building is me.'],
        next: 'close',
      },
      close: {
        speaker: 'daniel',
        via: 'speaker',
        lines: [{ narration: 'The speakers hiss, then settle into a low electrical hum.' }],
        effects: [{ objective: 'find_way_down' }],
        end: true,
      },
    },
  },

  daniel_radio: {
    start: 'hub',
    nodes: {
      hub: {
        speaker: 'daniel',
        via: 'radio',
        lines: [
          { when: { trustBelow: -10 }, text: 'What now.' },
          { when: [{ trustAtLeast: -10 }, { trustBelow: 20 }], text: 'I’m listening.' },
          { when: { trustAtLeast: 20 }, text: 'Go ahead. I’m here.' },
        ],
        choices: [
          { text: 'Who are you?', when: notNamed, next: [{ when: { trustAtLeast: 12 }, node: 'name_given' }, { node: 'name_refused' }] },
          { text: 'Daniel. Is that you?', when: [notNamed, { flag: 'knows_daniel_name' }], next: 'name_guessed' },
          { text: 'Who is Dr. Carter?', when: [{ any: [{ flag: 'saw_carter_label' }, { found: 'doc_visitor_log' }, { flag: 'saw_photo' }] }, { notFlag: 'asked_carter' }], effects: [{ setFlag: 'asked_carter' }], next: 'carter' },
          { text: 'What happened here?', next: [{ when: { trustAtLeast: 18 }, node: 'what_open' }, { node: 'what_closed' }] },
          {
            text: 'Can you open the elevator?',
            when: [{ flag: 'power_on' }, { notFlag: 'elevator_unlocked' }],
            next: [
              { when: { lieExposed: 'identity' }, node: 'elevator_liar' },
              { when: { trustAtLeast: 12 }, node: 'elevator_yes' },
              { node: 'elevator_no' },
            ],
          },
          { text: 'Signing off.', end: true },
        ],
      },
      name_refused: {
        speaker: 'daniel', via: 'radio',
        lines: ['Someone who stayed when everyone else left.', 'Ask me again when I know you better.'],
        next: 'hub',
      },
      name_given: {
        speaker: 'daniel', via: 'radio',
        lines: [{ narration: 'A long silence.' }, 'My name was Daniel.', 'It still is. I think.'],
        effects: [{ setFlag: 'daniel_named' }, { trust: { amount: 3, reason: 'he chose to tell them his name' } }],
        next: 'hub',
      },
      name_guessed: {
        speaker: 'daniel', via: 'radio',
        lines: [{ narration: 'The channel stays open, but nobody speaks. You can hear something whirring, very softly, on his end.' }, '...You’ve been in my office.'],
        effects: [{ setFlag: 'daniel_named' }],
        choices: [
          {
            text: 'The door was open. I read your proposal.',
            effects: [{ honest: true }, { trust: { amount: 6, reason: 'was honest about reading his proposal' } }],
            next: 'name_proposal',
          },
          {
            text: 'Lucky guess.',
            effects: [{ lie: { id: 'office', about: 'searching his office' } }, { trust: { amount: -2, reason: 'brushed him off' } }],
            next: 'name_lucky',
          },
        ],
      },
      name_proposal: {
        speaker: 'daniel', via: 'radio',
        lines: ['Then you’ve read what I wanted to build.', 'Remember it. You’ll need to, when you see what they built instead.'],
        next: 'hub',
      },
      name_lucky: {
        speaker: 'daniel', via: 'radio',
        lines: ['There is coffee on the cover of that proposal, and your fingerprints in the dust next to it.', 'Don’t do that again.'],
        effects: [{ exposeLie: { id: 'office', penalty: 8, reason: 'lied about reading his office papers' } }],
        next: 'hub',
      },
      carter: {
        speaker: 'daniel', via: 'radio',
        lines: [{ narration: 'The breathing on the line stops.' }, 'Where did you hear that name?', { narration: 'Before you can answer, he does.' }, 'Not on the radio. Never on the radio. Ask me something else.'],
        next: 'hub',
      },
      what_closed: {
        speaker: 'daniel', via: 'radio',
        lines: ['Not over the radio. Not yet.'],
        next: 'hub',
      },
      what_open: {
        speaker: 'daniel', via: 'radio',
        lines: ['They took my work. Then they took the rest of me.', 'That’s all you get tonight.'],
        next: 'hub',
      },
      elevator_yes: {
        speaker: 'daniel', via: 'radio',
        lines: [{ narration: 'A pause. Somewhere in the corridor, a card reader chimes.' }, 'It’s open. Call it.', 'Don’t make me regret it.'],
        effects: [
          { setFlag: ['elevator_unlocked', 'daniel_opened_elevator'] },
          { objective: { id: 'find_way_down', status: 'done' } },
        ],
        next: 'hub',
      },
      elevator_no: {
        speaker: 'daniel', via: 'radio',
        lines: ['No.', 'I don’t open doors for people I don’t know.'],
        next: 'hub',
      },
      elevator_liar: {
        speaker: 'daniel', via: 'radio',
        lines: ['For a contractor with a police call sign?', 'Find your own way down.'],
        next: 'hub',
      },
    },
  },

  daniel_silent: {
    start: 'only',
    nodes: {
      only: {
        lines: [{ narration: 'You press transmit and wait. Only static answers. He is there. He has decided not to speak to you.' }],
        end: true,
      },
    },
  },

  daniel_override_reaction: {
    start: 'only',
    nodes: {
      only: {
        speaker: 'daniel', via: 'speaker',
        lines: ['A red card. I wondered who kept that.', 'Resourceful. Remember that the lower levels don’t care how you got in.'],
        end: true,
      },
    },
  },

  dispatch_checkin: {
    start: 'call',
    nodes: {
      call: {
        speaker: 'dispatch',
        via: 'dispatch',
        lines: [{ narration: 'Your shoulder radio crackles, loud in the silence.' }, 'Unit 14, dispatch. Status check on the signal call, over.'],
        choices: [
          {
            text: 'Unit 14. On scene, investigating. All okay for now.',
            effects: [{ setFlag: 'reported_in' }],
            next: 'ack',
          },
          {
            text: 'Unit 14. Requesting backup at the facility.',
            effects: [{ setFlag: 'requested_backup' }],
            next: 'backup',
          },
          {
            text: 'Ignore the call.',
            echo: false,
            effects: [{ setFlag: 'ignored_dispatch' }, { say: 'You turn the volume down and let it ring out.' }],
            next: 'ignored',
          },
        ],
      },
      ack: {
        speaker: 'dispatch', via: 'dispatch',
        lines: ['Copy, Unit 14. Check in again in thirty.'],
        next: 'daniel_hears',
      },
      backup: {
        speaker: 'dispatch', via: 'dispatch',
        lines: ['Negative, Unit 14. Nearest unit is forty minutes out on the flood detour. Keep us posted.'],
        next: 'daniel_hears',
      },
      ignored: {
        speaker: 'dispatch', via: 'dispatch',
        lines: ['Unit 14, if you can hear us, check in when able. Dispatch out.'],
        next: 'daniel_hears',
      },
      daniel_hears: {
        speaker: 'daniel',
        via: 'radio',
        lines: [{ narration: 'A second later, the facility radio on your belt clicks. He has been listening.' }],
        next: [
          { when: { lied: 'identity' }, node: 'caught' },
          { when: { flag: 'requested_backup' }, node: 'backup_reaction' },
          { when: { flag: 'told_police' }, node: 'confirmed' },
          { node: 'cop_now' },
        ],
      },
      caught: {
        speaker: 'daniel', via: 'radio',
        lines: ['Unit 14.', 'A contractor with a police call sign. You lied to me in the first minute.'],
        effects: [{ exposeLie: { id: 'identity', penalty: 20, reason: 'caught lying about being a contractor' } }],
        end: true,
      },
      backup_reaction: {
        speaker: 'daniel', via: 'radio',
        lines: ['Bring an army if you like.', 'They won’t find the way down. You barely have.'],
        effects: [{ trust: { amount: -3, reason: 'called for backup' } }],
        end: true,
      },
      confirmed: {
        speaker: 'daniel', via: 'radio',
        lines: ['Police, like you said. At least you didn’t lie about that.'],
        effects: [{ trust: { amount: 3, reason: 'their story checked out' } }],
        end: true,
      },
      cop_now: {
        speaker: 'daniel', via: 'radio',
        lines: [
          { when: { flag: 'told_former_employee' }, text: 'A police officer now. Funny where people end up.' },
          { when: { notFlag: 'told_former_employee' }, text: 'So you’re police. You could have just said.' },
        ],
        end: true,
      },
    },
  },
};
