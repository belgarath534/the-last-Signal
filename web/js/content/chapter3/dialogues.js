// Conversations for Chapter 3.
// Decisions made here (see the story bible):
//   - Daniel sent the signal, using 001's heartbeat: three short, one long.
//   - Daniel did not know Emily had been captured. He was told she resigned.
//   - Being caught by 001 once hurts you. Twice, before treatment, kills you.

const toldOrCaught = { any: [{ flag: 'told_daniel_emily' }, { lieExposed: 'emily' }] };

export const dialogues = {
  ch3_open: {
    start: 'open',
    nodes: {
      open: {
        speaker: 'daniel',
        via: 'speaker',
        lines: [
          { when: [{ emilyAlive: true }, { emilyIn: 'ward' }], text: 'Her monitor is steady. I keep listening to it.' },
          { when: { emilyAlive: false }, text: 'The revival codes don’t matter now. The rest still does.' },
          'Sublevel 2 is where they kept everything. The revival codes for Emily. Their records. And what’s left of me.',
          'The freight lift behind those shelves goes down there. It answers to one key, and that key is inside 001. They built it to carry their equipment.',
          { when: { flag: 'refused_001_for_now' }, text: 'I know you said not yet. There is no other way down. I looked. For two years, I looked.' },
        ],
        choices: [
          { text: 'How do I wake it?', next: 'how' },
          { text: 'What’s left of you, down there?', next: 'left' },
          {
            text: 'Did you know they had Emily?',
            when: toldOrCaught,
            effects: [{ setFlag: 'daniel_told_resigned' }],
            next: 'emily',
          },
          { text: 'Fine. Let’s do this.', next: 'close' },
        ],
      },
      how: {
        speaker: 'daniel', via: 'speaker',
        lines: ['Put your hand on its chest plate. It will know what to do. It always did.'],
        next: 'close',
      },
      left: {
        speaker: 'daniel', via: 'speaker',
        lines: ['You’ll see. I would rather you saw it than heard it from me.'],
        next: 'close',
      },
      emily: {
        speaker: 'daniel', via: 'speaker',
        lines: [
          'No.',
          'They told me she resigned. That she didn’t want to see what I had become.',
          'I believed them. That’s the part I can’t forgive. Not them. Me.',
        ],
        effects: [{ trust: { amount: 3, reason: 'he told them the truth about Emily' } }],
        next: 'close',
      },
      close: {
        speaker: 'daniel', via: 'speaker',
        lines: [{ narration: 'The speakers click off. The tarp waits.' }],
        effects: [{ objective: 'wake_001' }],
        end: true,
      },
    },
  },

  boot_001: {
    start: 'boot',
    nodes: {
      boot: {
        speaker: 'proto',
        lines: [
          { narration: 'Light blooms behind its eyes, a warm amber. Its head lifts. When it speaks, the voice is gentle, slightly too slow, like someone reading aloud for a child.' },
          'Hello.',
          'I am here to help.',
          { narration: 'Its head turns toward you. There is a tiny click, and the amber in its eyes goes white.' },
          'Correction.',
          'Intruder detected.',
          { narration: 'It steps down off the crate. It walks past you, close enough that you feel the air move, and out toward the landing. Its footsteps are slow and very heavy. It has not decided what to do about you. Yet.' },
        ],
        effects: [{ stalkerStart: { room: 'b1_landing' } }],
        next: 'daniel',
      },
      daniel: {
        speaker: 'daniel',
        via: 'speaker',
        lines: [
          'That sound. You heard it.',
          'Three short, one long. That was 001’s heartbeat. The first sound it ever made, the night we switched its core on for the first time. Emily cried.',
          'When I needed someone to come, it was the only voice I had left that was still mine. So I sent it out, over and over.',
        ],
        choices: [
          { text: 'You sent the signal.', next: 'sent' },
          { text: 'It called me an intruder.', next: 'intruder' },
        ],
      },
      sent: {
        speaker: 'daniel', via: 'speaker',
        lines: ['Yes. And you came.'],
        next: 'plan',
      },
      intruder: {
        speaker: 'daniel', via: 'speaker',
        lines: ['They taught it that word. Not me.'],
        next: 'plan',
      },
      plan: {
        speaker: 'daniel', via: 'speaker',
        lines: [
          'Listen for its footsteps. It walks the same rounds, again and again, and when it finishes it comes back here to recharge. While it charges, it can’t see you. That’s when you take the key from its back panel.',
          'And if it finds you, hide. It isn’t clever. It was never meant to hunt.',
        ],
        effects: [{ objective: 'get_key' }, { checkpoint: true }],
        end: true,
      },
    },
  },

  encounter_001: {
    start: 'meet',
    nodes: {
      meet: {
        speaker: 'proto',
        lines: [
          { narration: '001 is here, in the room with you. Its head turns with a soft whir, and stops, facing you.' },
          'Intruder.',
        ],
        choices: [
          { text: 'Hide behind the shelving', when: { at: 'storage' }, effects: [{ stalkerMoveOn: true }], next: 'hidden' },
          { text: 'Slide under a bed sheet', when: { at: 'medical_ward' }, effects: [{ stalkerMoveOn: true }], next: 'hidden' },
          { text: 'Slip behind the equipment racks', when: { at: 'transfer_suite' }, effects: [{ stalkerMoveOn: true }], next: 'hidden' },
          { text: 'Hide behind the empty capsules', when: { at: 'preservation_lab' }, effects: [{ stalkerMoveOn: true }], next: 'hidden' },
          {
            text: 'Hold completely still',
            echo: false,
            next: [
              { when: { stalkerAlertBelow: 2 }, node: 'still_ok' },
              { node: 'caught' },
            ],
          },
          { text: 'Back away the way you came', echo: false, when: { canFlee: true }, effects: [{ flee: true }], next: 'fled' },
          {
            text: 'Say: Daniel built you to be kind.',
            when: [{ any: [{ flag: 'saw_whiteboard_back' }, { read: 'doc_proposal' }] }, { notFlag: 'talked_001' }],
            effects: [{ setFlag: 'talked_001' }, { secret: 'talked_001' }, { stalkerMoveOn: true }],
            next: 'talked',
          },
        ],
      },
      hidden: {
        lines: [{ narration: 'You press yourself into the dark and stop breathing. It stands there for a long time, its head turning in small, exact steps. Then it walks on, and its footsteps fade.' }],
        end: true,
      },
      still_ok: {
        lines: [{ narration: 'You do not move. You do not breathe. It looks straight at you, and its attention slides off you, the way your eyes slide over furniture. It walks on.' }],
        effects: [{ stalkerAlert: 1 }, { stalkerMoveOn: true }],
        end: true,
      },
      fled: {
        lines: [{ narration: 'You back out of the room, one slow step at a time. It does not follow. Not this time.' }],
        end: true,
      },
      talked: {
        speaker: 'proto',
        lines: [
          { narration: 'It stops. The whir of its eyes goes quiet.' },
          'Kind.',
          'Kind... ness.',
          { narration: 'A long pause. Something inside it clicks, twice.' },
          'Kindness is not a requirement.',
          { narration: 'But it turns away from you, and walks on.' },
        ],
        end: true,
      },
      caught: {
        lines: [{ narration: 'Holding still does not work this time. It has seen you too often. It moves faster than anything that size should, and its hand closes on your side and lifts you, and throws you into the wall like something in its way.' }],
        effects: [{ stalkerAlert: -10 }, { caught: true }],
        end: true,
      },
    },
  },

  daniel_001_at_emily: {
    start: 'only',
    nodes: {
      only: {
        speaker: 'daniel',
        via: 'radio',
        lines: [
          'It stopped at Emily’s bed. I can hear it through the ward speaker.',
          'It’s just standing there. Looking at her.',
          { narration: 'A long pause.' },
          'It’s moving again.',
        ],
        end: true,
      },
    },
  },
};
