// Conversations for Chapter 5.
// The romance stays quiet: Emily never quite says it, and Daniel never asks.

const emilyAwake = [{ flag: 'emily_awake' }, { emilyAlive: true }];

export const dialogues = {
  ch5_open: {
    start: [
      { when: emilyAwake, node: 'emily' },
      { node: 'alone' },
    ],
    nodes: {
      alone: {
        lines: [
          { narration: 'Emily’s capsule is silent. You stand beside it longer than you mean to.' },
          { narration: 'Daniel said the rest of him is somewhere else. The board kept records of everything. If they put him somewhere, they wrote it down.' },
        ],
        effects: [{ objective: 'find_isolation' }],
        end: true,
      },
      emily: {
        speaker: 'emily',
        lines: [
          { narration: 'Emily is sitting up in the bed beside her open capsule, a blanket around her shoulders. She is still pale, but her eyes are sharp now.' },
          'He won’t tell you where he is. Will he.',
        ],
        choices: [
          { text: 'He says not yet.', next: 'knows' },
          { text: 'Do you know?', next: 'knows' },
        ],
      },
      knows: {
        speaker: 'emily',
        lines: [
          'The board had a room for people who became a problem. They called it isolation. Nobody who went in there came back to work.',
          'It’s in the east stairwell, between the surface and this floor. If they put him anywhere, it’s there.',
          'The stairwell door is on the surface. The elevator will take you up if you hold the door-open button and B1 together for five seconds. Maintenance used to do it when the board locked the floors.',
        ],
        effects: [{ setFlag: 'emily_told_way' }, { objective: { id: 'find_isolation', status: 'done' } }, { objective: 'go_up' }, { objective: 'get_cutters' }],
        choices: [
          { text: 'What is he to you?', next: 'what' },
          { text: 'I’ll find him.', next: 'badge' },
        ],
      },
      what: {
        speaker: 'emily',
        lines: [
          { narration: 'She glances up at the speaker grille in the ceiling, and lowers her voice.' },
          'We built things together for eleven years. He used to bring two coffees in every morning and pretend one of them was a mistake.',
          { narration: 'She almost smiles.' },
          'I was going to tell him something. The night they took me. I came in to find his files, and I was going to find him, and tell him.',
          'I never did.',
        ],
        effects: [{ setFlag: 'emily_confided' }],
        next: 'badge',
      },
      badge: {
        speaker: 'emily',
        lines: [
          { narration: 'She takes the lanyard from around her neck, the one in the photo in his office, and presses it into your hand.' },
          'Give him this. He’ll know what it means.',
          { when: { flag: 'emily_confided' }, text: 'And don’t tell him what I said. That’s mine to say.' },
        ],
        effects: [{ give: 'emily_badge' }],
        end: true,
      },
    },
  },

  ch5_chain: {
    start: 'open',
    nodes: {
      open: {
        speaker: 'daniel',
        via: 'speaker',
        lines: [
          { narration: 'The echo has barely died when every speaker in the corridor clicks on at once.' },
          'Stop.',
          'I told you. Not yet. Don’t go down there.',
        ],
        choices: [
          {
            text: 'I’m coming, Daniel. Whether you want me to or not.',
            effects: [{ honest: true }, { setFlag: 'told_coming' }],
            next: 'honest',
          },
          {
            text: 'I’m only checking the stairwell.',
            effects: [{ lie: { id: 'coming', about: 'going to find him' } }],
            next: 'lie',
          },
          {
            text: 'Emily asked me to bring you something.',
            when: { has: 'emily_badge' },
            effects: [{ setFlag: 'told_badge' }, { trust: { amount: 4, reason: 'came on Emily’s behalf' } }],
            next: 'emily',
          },
        ],
      },
      honest: {
        speaker: 'daniel', via: 'speaker',
        lines: ['Then come.', 'But you won’t like what you find. Remember I asked you not to.'],
        end: true,
      },
      lie: {
        speaker: 'daniel', via: 'speaker',
        lines: ['Checking.', { narration: 'A long pause.' }, 'I can hear your feet on the stairs. I’ll know where you go.'],
        end: true,
      },
      emily: {
        speaker: 'daniel', via: 'speaker',
        lines: [{ narration: 'Silence. Then, very quietly:' }, 'What did she send?', { narration: 'You don’t answer. After a while, the speakers click off without another word.' }],
        end: true,
      },
    },
  },

  ch5_door: {
    start: 'open',
    nodes: {
      open: {
        lines: [
          { narration: 'You tap it out on the keypad: three short, one long. The heartbeat of a machine that was built to be kind.' },
          { narration: 'The keypad chirps. Deep inside the door, bolts draw back one after another, slow and heavy.' },
          { narration: 'Behind it, the whir stops.' },
        ],
        choices: [
          { text: 'Open the door', echo: false, next: 'open_it' },
          { text: 'Not yet. Step back.', echo: false, next: 'wait' },
        ],
      },
      wait: {
        lines: [{ narration: 'You take your hand off the handle. On the other side of the steel, the whir starts again, slower now. Waiting.' }],
        end: true,
      },
      open_it: {
        lines: [],
        effects: [
          { setFlag: 'isolation_open' },
          { sound: 'stinger.soft' },
          {
            endChapter: {
              title: 'End of Chapter 5',
              text: 'The door swings inward on a small, dark room. Cables hang from the ceiling like vines. Against the far wall, held upright by clamps at its wrists, its chest and its throat, stands a tall figure of steel and grey composite, a face that was built to look gentle and almost does. Its head lifts. Its eyes light, a soft and familiar amber. And a voice you have heard all night over radios and speakers speaks for the first time from right in front of you. You came anyway.',
            },
          },
        ],
        end: true,
      },
    },
  },
};
