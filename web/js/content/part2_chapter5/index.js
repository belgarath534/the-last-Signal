// Part Two, Chapter 5 — "Static". The finale of Part Two.
// The creator's idea: you and Sarah are separated in the facility; she is
// terrified of losing you and keeps talking on the radio, saying things
// that make you blush; the horror plays out around you.
// Voss imitates voices through the facility speakers. The real Sarah is
// only ever on your radio. Following a fake voice costs time ('lost_time');
// lose too much and Voss finishes moving into Sarah's body.

const lost = (n) => ({ count: { id: 'lost_time', add: n } });
const tooLate = { counterAtLeast: { id: 'lost_time', n: 2 } };
const warm = { any: [{ flag: 'sarah_spark' }, { flag: 'radio_flirt' }] };

const rooms = {
  switching_room: {
    id: 'switching_room',
    name: 'Switching room',
    zone: 'sublevel2',
    soundscape: 'switching',
    description: 'A narrow room behind monitoring, packed floor to ceiling with racks of old telephone switching gear, relays clicking like insects. Ahead, a master panel with a big red isolation lever and a smaller labelled breaker. Every speaker grille in the room is turned toward you.',
    revisit: 'The switching room. The master panel ahead.',
    listen: { text: 'Thousands of relays, clicking and settling, clicking and settling. Under it, a breath that has nowhere to come from. She is all around you.' },
    objects: [
      { id: 'panel', name: 'Master panel', position: 'ahead', actions: [{ id: 'use', label: 'Go to the master panel', effects: [{ startDialogue: 'switch' }] }] },
    ],
    exits: [{ id: 'west', dir: 'west', to: 'monitoring', label: 'Back to monitoring' }],
  },
};

const roomAdditions = {
  monitoring: {
    exits: [{ id: 'east', dir: 'east', to: 'switching_room', label: 'Switching room', when: { flag: 'p2c5_started' }, sound: 'door.heavy' }],
  },
};

const radioChoices = [
  { text: 'I’m coming for you. Keep talking to me.', next: 'keep' },
  { text: 'Your voice is the only thing keeping me sane down here.', effects: [{ setFlag: 'radio_flirt' }], next: 'blush' },
  { text: 'Tell me something only you would know. So I know it’s you.', when: { notFlag: 'verified_sarah' }, next: 'verify' },
];

const dialogues = {
  separation: {
    start: 'open',
    nodes: {
      open: {
        speaker: 'sarah',
        lines: [
          { narration: 'Midnight. The facility, again. Ruiz stays on the surface with her radio and her gun. You and Sarah ride the elevator down to Sublevel 1 together, her shoulder pressed against yours, both of you pretending that is an accident.' },
          'I used to come down here every day. I never noticed how quiet it is.',
          { narration: 'The doors open on the landing. You step out first.' },
          { narration: 'Every light on Sublevel 1 goes out at once.' },
          { narration: 'You hear Sarah stumble out behind you, toward the laboratory corridor, and then a sound like a guillotine: a steel security shutter slamming down out of the ceiling, between you.' },
          'No. No no no. I’m on the other side. I can’t see anything.',
          { narration: 'Her voice is muffled through the steel. Then it is suddenly clear, on your radio instead.' },
          'Can you hear me? Tell me you can hear me.',
        ],
        effects: [{ setFlag: 'corridor_sealed' }, { sound: 'stinger.soft' }],
        choices: [
          { text: 'I can hear you. I’m right here.', next: 'here' },
          { text: 'Sarah, stay calm. Where are you?', next: 'here' },
        ],
      },
      here: {
        speaker: 'sarah',
        lines: [
          'Okay. Okay. I’m feeling along the wall. There’s a door. It’s the transfer suite. Of course it’s the transfer suite.',
          { narration: 'A pause. When she speaks again, her voice is very small.' },
          'There’s a chair in here. With straps. And the machines just turned on by themselves.',
          { speaker: 'voss', via: 'speaker', text: 'Hello, Sarah. You have such a good heart.' },
          { speaker: 'sarah', text: 'She’s in here. She’s in the room with me. Get to the switching room. Behind monitoring, on Sublevel 2. Storage, the freight lift. Go. Please go.' },
        ],
        effects: [{ objective: 'reach_switching' }, { objective: 'trust_radio' }, { checkpoint: true }, { schedule: { event: 'fake_sarah', in: 2 } }],
        end: true,
      },
    },
  },

  // The real Sarah, on your radio.
  radio_sarah: {
    start: [
      { when: { at: ['b2_lift', 'b2_hall', 'monitoring', 'records_room', 'containment', 'switching_room'] }, node: 'deep' },
      { node: 'early' },
    ],
    nodes: {
      early: {
        speaker: 'sarah',
        via: 'radio',
        lines: [
          'I’m here. I’m sitting on the floor with my back against the door so she can’t open it. The chair keeps humming.',
          'Talk to me. Please. If you stop talking I’ll start listening to her.',
        ],
        choices: radioChoices,
      },
      deep: {
        speaker: 'sarah',
        via: 'radio',
        lines: [
          'You’re on Sublevel 2? I can hear the lift in the walls. That was you. Okay.',
          { when: { counterAtLeast: { id: 'lost_time', n: 1 } }, text: 'The chair is warmer now. She keeps telling me it won’t hurt. Hurry. Please hurry.' },
          'When this is over, I’m buying you a coffee. Not the last one in the pot. A first one.',
        ],
        choices: radioChoices,
      },
      keep: {
        speaker: 'sarah',
        via: 'radio',
        lines: ['Okay. I can do that. I’m good at talking to you. I practised for a year. You just weren’t there for most of it.'],
        end: true,
      },
      blush: {
        speaker: 'sarah',
        via: 'radio',
        lines: [
          { narration: 'A long silence. Then a shaky laugh.' },
          'Don’t say things like that when I can’t see your face.',
          'For the record, I used to listen for your footsteps in the corridor. I could tell yours from everyone else’s. You walk like you’re apologising to the floor.',
          { narration: 'Your face is suddenly very warm, alone in the dark.' },
        ],
        end: true,
      },
      verify: {
        speaker: 'sarah',
        via: 'radio',
        lines: [
          'Something only I’d know.',
          'I left a birthday card on your desk, the year before you quit. You thanked Priya for it. In front of me. I wanted to die.',
          { narration: 'It is her. Nobody else in the world would choose that story.' },
        ],
        effects: [{ setFlag: 'verified_sarah' }, { objective: { id: 'trust_radio', status: 'done' } }],
        end: true,
      },
    },
  },

  // Voss, using Sarah's voice, on Sublevel 1.
  fake_sarah: {
    start: 'open',
    nodes: {
      open: {
        speaker: 'sarah',
        via: 'speaker',
        lines: [
          { narration: 'The speaker grille above the landing crackles.' },
          'Help! I got out, I’m in the medical ward. Come to the ward, please, she’s coming!',
          { narration: 'It is Sarah’s voice. Exactly Sarah’s voice.' },
        ],
        choices: [
          { text: 'Run to the medical ward', echo: false, effects: [lost(1)], next: 'trap_ward' },
          { text: 'Check your radio first', echo: false, next: 'check' },
        ],
      },
      check: {
        speaker: 'sarah',
        via: 'radio',
        lines: [
          'What? No! I’m still in the transfer suite. I haven’t moved. That isn’t me. That isn’t me.',
          'She can make any voice she’s ever heard. Only trust me on this radio. Only here.',
        ],
        effects: [{ setFlag: 'resisted_fake_1' }],
        end: true,
      },
      trap_ward: {
        lines: [
          { narration: 'You run east into the medical ward. The door slams behind you. The ward is empty. The beds are empty. Every monitor in the room switches on at once and starts to beep: three short, one long.' },
          { speaker: 'daniel', via: 'speaker', text: 'You shouldn’t have come here. You should never have come here.' },
          { narration: 'It is Daniel’s voice. Daniel’s exact voice, saying words he would never say. It takes you long, terrible minutes to force the door.' },
          { speaker: 'sarah', via: 'radio', text: 'Where did you go? You went quiet. Please don’t go quiet on me.' },
        ],
        effects: [{ sound: 'stinger.soft' }, { advanceTime: 5 }],
        end: true,
      },
    },
  },

  // Voss, using Daniel's voice, on Sublevel 2.
  fake_daniel: {
    start: [
      { when: { flag: 'verified_sarah' }, node: 'seen_through' },
      { node: 'open' },
    ],
    nodes: {
      open: {
        speaker: 'daniel',
        via: 'speaker',
        lines: [
          { narration: 'As you step into the hall, every speaker on Sublevel 2 speaks at once, softly, in Daniel’s voice.' },
          'Containment. She moved Sarah to containment. Hurry, she’s next to my body. Straight ahead.',
        ],
        choices: [
          { text: 'Run to containment', echo: false, effects: [lost(1)], next: 'trap' },
          { text: 'Ignore it. Keep going to monitoring.', echo: false, next: 'ignore' },
        ],
      },
      seen_through: {
        lines: [
          { narration: 'Every speaker on Sublevel 2 speaks at once, in Daniel’s voice: Containment, she moved Sarah to containment.' },
          { narration: 'You know exactly where Sarah is. You keep walking.' },
          { speaker: 'voss', via: 'speaker', text: 'Clever. She told you about the birthday card, didn’t she.' },
        ],
        end: true,
      },
      ignore: {
        lines: [{ narration: 'You keep walking. Behind you the voice keeps calling, and then, very quietly, starts to laugh.' }],
        end: true,
      },
      trap: {
        lines: [
          { narration: 'You run into containment. The bed under the glass canopy is lit, the ventilator breathing. There is nobody else here. Above the bed, the monitor writes a word across its screen, one letter at a time: HURRY.' },
          { speaker: 'sarah', via: 'radio', text: 'Where are you? The chair just turned all the way on. It’s so loud. Please.' },
        ],
        effects: [{ advanceTime: 5 }],
        end: true,
      },
    },
  },

  switch: {
    start: [
      { when: tooLate, node: 'too_late' },
      { node: 'open' },
    ],
    nodes: {
      open: {
        speaker: 'voss',
        via: 'speaker',
        lines: [
          { narration: 'The switching room. Every speaker turns toward you with a click.' },
          'Don’t. Listen to me. If you pull that lever, you kill me, and you kill the last copy of Daniel with me. I am holding him. I can feel him in here.',
          { speaker: 'sarah', via: 'radio', text: 'I’m here. I’m still me. There’s a way to save his copy first. The small breaker under the panel isolates his partition. I can talk you through it. Or just pull the big one. I trust you either way.' },
        ],
        choices: [
          {
            text: 'Talk me through saving Daniel’s copy first.',
            when: { flag: 'verified_sarah' },
            next: 'save_copy',
          },
          {
            text: 'Talk me through saving Daniel’s copy first.',
            when: { notFlag: 'verified_sarah' },
            next: 'unsure',
          },
          { text: 'Pull the big lever. Now.', echo: false, next: 'cut_all' },
        ],
      },
      unsure: {
        lines: [
          { narration: 'You reach for the small breaker, and stop. A voice on the radio is telling you which switches to touch. You never asked it anything only Sarah would know. In this room, with her, you cannot be sure.' },
          { speaker: 'voss', via: 'speaker', text: 'That’s right. You don’t know who you’re listening to. You never did.' },
        ],
        choices: [{ text: 'Pull the big lever. Now.', echo: false, next: 'cut_all' }],
      },
      save_copy: {
        speaker: 'sarah',
        via: 'radio',
        lines: [
          'Okay. Small breaker. The one labelled PARTITION D. Lift the cover. Flip it down. Count to three.',
          { narration: 'You do. Somewhere in the racks, a whole bank of relays goes still. Voss screams through every speaker at once, a sound that is not a voice any more.' },
          'His partition is sealed. He’s safe. Now the big one. Pull it. Pull it for me.',
          { narration: 'You pull the red lever with both hands.' },
        ],
        effects: [{ setFlag: ['saved_daniel_copy', 'voss_gone'] }],
        next: [
          { when: warm, node: 'found_you' },
          { node: 'clean_line' },
        ],
      },
      cut_all: {
        lines: [
          { narration: 'You pull the red lever with both hands. Every relay in the room stops at once. The silence is so total that you can hear your own heart.' },
          { narration: 'Voss does not scream. She simply stops, in the middle of a word. And somewhere in the same instant, everything else in that network stops too: every echo, every copy. Including him.' },
        ],
        effects: [{ setFlag: 'voss_gone' }],
        next: 'scorched',
      },
      too_late: {
        speaker: 'sarah',
        via: 'radio',
        lines: [
          { narration: 'You reach the switching room. The racks are quiet. Too quiet.' },
          'It’s okay. You can stop now. I got out.',
          { narration: 'It is Sarah’s voice on your radio. Calm. Warm. Somehow, wrong.' },
          'Come up to the landing. I’m waiting for you.',
        ],
        next: 'her_voice',
      },
      found_you: {
        lines: [],
        effects: [
          {
            endChapter: {
              title: 'Ending: Found You',
              ending: 'found_you',
              text: 'You run. Up the freight lift, across the landing, to the security shutter, which is rising, slowly, groaning, with all the power gone out of it. Sarah ducks under it before it is halfway up and runs straight into you. She is shaking. So are you. Neither of you says anything for a long time. Then she pulls back, looks at your face in the light of your flashlight, and laughs, wet and shaky. You’re blushing, she says. I knew it. And then she kisses you, in the dark, in the place where it all began, and for the first time in a long time the facility is completely, beautifully quiet. Weeks later, Daniel opens a sealed partition and finds himself inside it, safe. Emily cries. Sarah buys you a coffee. A first one.',
            },
          },
        ],
        end: true,
      },
      clean_line: {
        lines: [],
        effects: [
          {
            endChapter: {
              title: 'Ending: Clean Line',
              ending: 'clean_line',
              text: 'The shutter on Sublevel 1 groans upward with the power gone out of it. Sarah is waiting on the other side, arms wrapped around herself. She holds on to you for a long moment, the way people hold on to the person who came back for them. Voss is gone. Daniel’s last copy is safe, sealed in a partition no one else can open. Months later, the facility is torn down. On the last day, Sarah stands next to you and watches the walls come down, and asks if you’d like to get a coffee sometime. You say yes. You both know it means more than coffee, and neither of you is in a hurry.',
            },
          },
        ],
        end: true,
      },
      scorched: {
        lines: [],
        effects: [
          {
            endChapter: {
              title: 'Ending: Scorched Wire',
              ending: 'scorched_wire',
              text: 'Sarah is safe. She is waiting at the shutter when you come back up, and she holds on to you so hard it hurts. Voss is gone, every last trace of her. So is the master copy of Daniel. In the weeks after, nobody quite knows how to talk about that. Daniel, wherever he is and whatever he is now, says only: it was the right call. It was the only call. Some nights, the radio on your kitchen table clicks once, and goes quiet, and you never find out why.',
            },
          },
        ],
        end: true,
      },
      her_voice: {
        lines: [],
        effects: [
          {
            endChapter: {
              title: 'Ending: Her Voice',
              ending: 'her_voice',
              text: 'Sarah is waiting at the landing when you get there, the shutter wide open behind her. She is smiling. She takes your hand. Her grip is perfect, gentle, exactly as strong as it needs to be, and it does not let go. Thank you, she says. It is Sarah’s voice. It is Sarah’s smile. As you walk out together into the rain, she hums a little tune under her breath, very softly. Three short. One long.',
            },
          },
        ],
        end: true,
      },
    },
  },
};

export const part2chapter5 = {
  number: 12,
  part: 2,
  title: 'Part Two, Chapter 5: Static',
  secrets: 0,

  start: {
    room: 'b1_landing',
    intro: ['THE LAST SIGNAL. Part Two. Chapter 5: Static.'],
    effects: [
      { setFlag: 'p2c5_started' },
      { stalkerStop: true },
      { give: 'facility_radio' },
      { give: 'key_001' },
      { setClock: { hour: 0, minute: 0 } },
      { startDialogue: 'separation' },
    ],
  },

  summary: [
    { when: { flag: 'verified_sarah' }, text: 'You made sure the voice on your radio was really Sarah.' },
    { when: { flag: 'radio_flirt' }, text: 'You told Sarah her voice was keeping you sane. She told you how you walk.' },
    { when: { flag: 'resisted_fake_1' }, text: 'You did not fall for Voss using Sarah’s voice.' },
    { when: { counterAtLeast: { id: 'lost_time', n: 1 } }, text: 'Voss’s voices cost you time.' },
    { when: { flag: 'saved_daniel_copy' }, text: 'You saved the last copy of Daniel.' },
  ],

  afterEnd: { effects: [] },

  rooms,
  roomAdditions,
  items: {},
  documents: {},
  recordings: {},
  objectives: {
    reach_switching: { text: 'Get to the switching room behind monitoring on Sublevel 2: storage, then the freight lift down.' },
    trust_radio: { text: 'Voss can fake any voice through the speakers. The real Sarah is only on your radio.' },
  },
  speakers: {},
  dialogues,
  events: {
    fake_sarah: { when: { notFlag: 'voss_gone' }, effects: [{ startDialogue: 'fake_sarah' }] },
  },
  triggers: [
    { id: 'p2c5_fake_daniel', when: [{ flag: 'p2c5_started' }, { at: 'b2_hall' }], effects: [{ startDialogue: 'fake_daniel' }] },
  ],
  globalActions: [
    {
      id: 'radio_sarah',
      label: 'Talk to Sarah on the radio',
      when: [{ flag: 'p2c5_started' }, { flag: 'corridor_sealed' }, { notFlag: 'voss_gone' }],
      effects: [{ sound: 'radio.on' }, { startDialogue: 'radio_sarah' }],
    },
  ],

  endings: {
    found_you: { name: 'Found You', blurb: 'Part Two. You found each other in the dark.' },
    clean_line: { name: 'Clean Line', blurb: 'Part Two. Voss gone, Daniel safe, and coffee, someday.' },
    scorched_wire: { name: 'Scorched Wire', blurb: 'Part Two. Voss gone, and Daniel’s last copy with her.' },
    her_voice: { name: 'Her Voice', blurb: 'Part Two. Too late.' },
  },
};
