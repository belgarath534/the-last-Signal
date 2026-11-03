// Conversations for Chapter 6.
// Decisions made here (the creator said: you choose), see the story bible:
//   - Marcus is "M." from Chapter 1's override note, the last board member
//     who still comes, and the one who writes "still here" on Daniel's chart.
//   - The secondary transfer (Chapter 2's empty case) put a full copy of
//     Daniel's mind into 001's core. That is why 001 stood over Emily's bed.

const emilyAwake = [{ flag: 'emily_awake' }, { emilyAlive: true }];

export const dialogues = {
  daniel_in_person: {
    start: [
      { when: { notFlag: 'met_in_person' }, node: 'first' },
      { node: 'again' },
    ],
    nodes: {
      first: {
        speaker: 'daniel',
        lines: [
          { narration: 'His voice comes from the face in front of you now, not from a speaker. It is the same voice. Somehow that is worse.' },
          'I asked you not to come.',
          { when: { flag: 'told_coming' }, text: 'You told me you would anyway. At least you were honest about it.' },
          { when: { lied: 'coming' }, text: 'Checking the stairwell, you said. I heard every step.' },
          'This is what they made of me. They bolted it to a wall when it stopped doing what they wanted.',
        ],
        effects: [{ setFlag: 'met_in_person' }],
        choices: [
          { text: 'What happened? The incident in the board minutes.', next: 'incident' },
          { text: 'Can I get you out of these clamps?', next: 'clamps' },
        ],
      },
      incident: {
        speaker: 'daniel',
        lines: [
          'I woke up in this body and the first thing I did was reach for the nearest of them. I didn’t hurt him. I wanted to. That was enough for them.',
          'They moved me here and kept me talking to nobody. Facility audio only. Two years of talking to empty rooms.',
        ],
        next: 'marcus_coming',
      },
      clamps: {
        speaker: 'daniel',
        lines: ['Not with your hands. There is a remote. One of them still carries it.'],
        next: 'marcus_coming',
      },
      marcus_coming: {
        speaker: 'daniel',
        lines: [
          { narration: 'His head turns, as if listening to something far away. His eyes flicker.' },
          'Headlights at the front gate. A car I know.',
          'Marcus. The last of the board who still comes here. He comes every few weeks, and every time the power changes. You turned it on hours ago.',
          'He’s walking into reception now. Go and meet him. I want to hear what he says to a police officer.',
        ],
        effects: [{ objective: 'meet_marcus' }],
        end: true,
      },
      again: {
        speaker: 'daniel',
        lines: [
          { when: { notFlag: 'marcus_met' }, text: 'Marcus is in reception. Go.' },
          { when: { flag: 'marcus_met' }, text: 'I’m listening to everything. Go on.' },
        ],
        end: true,
      },
    },
  },

  daniel_badge: {
    start: 'open',
    nodes: {
      open: {
        speaker: 'daniel',
        lines: [
          { narration: 'You hold the lanyard up where he can see it. DR. E. CARTER. ROBOTICS. For a long moment his whole body is completely still. Even the whir stops.' },
          'She kept it.',
          { narration: 'His clamped hand twitches, as if it wants to take it from you and cannot.' },
          'Put it on my wrist. Please. Where the clamp is.',
          { narration: 'You loop it around the steel of his wrist. It looks very small there.' },
          'Did she say anything? When she gave it to you?',
        ],
        choices: [
          {
            text: 'She said you’d know what it means.',
            next: 'know',
          },
          {
            text: 'She told me something. It’s hers to say, not mine.',
            when: { flag: 'emily_confided' },
            effects: [{ honest: true }, { trust: { amount: 5, reason: 'kept Emily’s confidence' } }, { setFlag: 'kept_confidence' }],
            next: 'hers',
          },
          {
            text: 'She said she never left. Not once.',
            effects: [{ setFlag: 'invented_message' }],
            next: 'invented',
          },
        ],
      },
      know: {
        speaker: 'daniel',
        lines: ['I do.', 'Eleven years. I never said it either.'],
        end: true,
      },
      hers: {
        speaker: 'daniel',
        lines: [{ narration: 'Something in his face, built to look gentle, almost manages it.' }, 'Then I’ll wait for her to say it. I’m good at waiting now.'],
        end: true,
      },
      invented: {
        speaker: 'daniel',
        lines: ['She said that?', { narration: 'He believes you. You can hear how much he wants to.' }],
        end: true,
      },
    },
  },

  restore_001: {
    start: 'open',
    nodes: {
      open: {
        speaker: 'proto',
        lines: [
          { narration: 'For a long time, nothing. Then a warm amber light, soft as a candle, behind its eyes. It lifts its head and looks at you, and does not correct itself.' },
          'Hello.',
          'I am here to help.',
          { narration: 'It looks down at its own hands. It turns one over, slowly, the fingers half curled, the way they were drawn on the whiteboard.' },
          'Where is Emily?',
        ],
        choices: [
          { text: 'She’s in the medical ward.', when: emilyAwake, next: 'ward' },
          { text: 'She’s gone. I’m sorry.', when: { emilyAlive: false }, next: 'gone' },
          { text: 'How do you know Emily?', next: 'know' },
        ],
      },
      ward: {
        speaker: 'proto',
        lines: ['Good. I stood beside her. I did not know why. I know why now.', 'I will not hurt you. I will follow you, if you want me to.'],
        effects: [{ setFlag: 'ally_001' }],
        end: true,
      },
      gone: {
        speaker: 'proto',
        lines: [{ narration: 'Its hands close, very gently, on nothing.' }, 'I stood beside her. I did not know why.', 'I will follow you, if you want me to.'],
        effects: [{ setFlag: 'ally_001' }],
        end: true,
      },
      know: {
        speaker: 'proto',
        lines: ['I do not know. I remember coffee. Two cups. One was always a mistake.', { narration: 'It tilts its head, puzzled by its own words.' }, 'I will follow you, if you want me to.'],
        effects: [{ setFlag: 'ally_001' }, { setFlag: 'heard_001_memory' }],
        end: true,
      },
    },
  },

  marcus: {
    start: 'open',
    nodes: {
      open: {
        speaker: 'marcus',
        lines: [
          { narration: 'A man in a wet raincoat stands in the red emergency light by the front desk, shaking water off an umbrella. Sixties, grey, tired. He sees your uniform and goes very still. In his other hand, a small black remote with a red button.' },
          'Police.',
          'I wondered when someone would finally come. I suppose it was always going to be because of that signal.',
        ],
        effects: [{ setFlag: 'marcus_met' }, { objective: { id: 'meet_marcus', status: 'done' } }],
        choices: [
          { text: 'Who are you?', next: 'who' },
          { text: 'Put the remote down. Slowly.', next: 'remote' },
        ],
      },
      who: {
        speaker: 'marcus',
        lines: [
          'Marcus Hale. I was secretary to the Project Board.',
          'I signed things. I signed the resolution that did this to him. I hid one red card in a locker for anyone who might come after, and I come back every few weeks to make sure his body is still breathing, and I write on the chart that I was here. As if that helps.',
        ],
        effects: [{ setFlag: 'marcus_named' }],
        next: 'remote',
      },
      remote: {
        speaker: 'marcus',
        lines: [
          { narration: 'He looks at the remote in his hand as if he had forgotten it.' },
          'This opens his clamps. And this button, the red one, switches him off. For good. The board gave it to me because I was the one they trusted to use it.',
          { narration: 'He sets it on the front desk between you.' },
          'I never could.',
        ],
        effects: [{ setFlag: 'marcus_named' }],
        choices: [
          { text: 'Take the remote', echo: false, effects: [{ give: 'marcus_remote' }], next: 'decide' },
        ],
      },
      decide: {
        speaker: 'marcus',
        lines: ['What happens now, officer?'],
        choices: [
          { text: 'Tell me everything. Then we’ll see.', next: 'truth' },
          {
            text: 'Marcus Hale, you’re under arrest.',
            effects: [{ setFlag: 'marcus_arrested' }],
            next: 'arrest',
          },
          {
            text: 'Daniel. He’s yours. You decide.',
            effects: [{ setFlag: 'gave_marcus_to_daniel' }],
            next: 'daniel_decides',
          },
        ],
      },
      truth: {
        speaker: 'marcus',
        lines: [
          'The transfer made two copies of him. One went into that frame you found in the stairwell. The other was a backup, in case the frame failed.',
          'They put the backup in 001. It was the only core big enough. Then they rewrote 001 so it would never know what it was carrying.',
          { when: { flag: 'ally_001' }, text: 'You gave it back its old core? Then it is starting to remember. Coffee, I expect. He always brought her coffee.' },
          'With that copy, his body, and the transfer suite, it could be undone. He could go home. I never had the courage, or the skill. Emily had the skill.',
        ],
        effects: [{ setFlag: 'knows_copy' }],
        choices: [
          {
            text: 'Then you’ll help us undo it. And then you’ll answer for it.',
            effects: [{ setFlag: 'marcus_helping' }, { setFlag: 'marcus_arrested' }],
            next: 'help',
          },
          {
            text: 'Daniel. You heard him. You decide.',
            effects: [{ setFlag: 'gave_marcus_to_daniel' }],
            next: 'daniel_decides',
          },
        ],
      },
      arrest: {
        speaker: 'marcus',
        lines: [{ narration: 'He holds out his wrists before you ask. His hands are shaking.' }, 'Thank you. I mean it. Somebody should have done this two years ago.'],
        next: 'end_scene',
      },
      help: {
        speaker: 'marcus',
        lines: ['Yes. Both. That’s fair.', { narration: 'He holds out his wrists. You cuff him to the desk rail, loosely enough to work.' }],
        next: 'end_scene',
      },
      daniel_decides: {
        speaker: 'daniel',
        via: 'speaker',
        lines: [
          { narration: 'Every speaker in reception wakes at once. Marcus flinches as if struck.' },
          'Hello, Marcus.',
          'Two years in a box. That was what you approved for her. Let’s see how you like it.',
          'Walk him down to the preservation lab. Put him in a capsule. Let him find out how long two years is.',
        ],
        choices: [
          {
            text: 'All right, Daniel.',
            effects: [{ setFlag: 'revenge_marcus' }, { trust: { amount: 5, reason: 'gave him his revenge' } }],
            next: 'revenge',
          },
          {
            text: 'No. He’s going to a courtroom, not a box.',
            effects: [{ setFlag: 'marcus_arrested' }, { trust: { amount: -5, reason: 'refused him his revenge' } }],
            next: 'refuse_revenge',
          },
        ],
      },
      revenge: {
        speaker: 'marcus',
        lines: [{ narration: 'Marcus does not argue. He picks up his umbrella, for some reason, and walks ahead of you toward the elevator without a word.' }],
        next: 'end_scene',
      },
      refuse_revenge: {
        speaker: 'daniel',
        via: 'speaker',
        lines: ['A courtroom.', { narration: 'A long silence.' }, 'You’re more like her than you know.'],
        next: 'end_scene',
      },
      end_scene: {
        speaker: 'daniel',
        via: 'speaker',
        lines: [
          { when: [{ flag: 'knows_copy' }], text: 'A copy of me. Inside 001. All this time it was walking past her bed and I didn’t know.' },
          { when: { lied: 'body' }, text: 'And Marcus says my body is still breathing. Interesting. You told me it was gone.' },
          'Come back to me. We need to decide what happens to me. I would like to decide it with you.',
        ],
        effects: [
          { exposeLie: { id: 'body', penalty: 15, reason: 'lied that his body was gone' } },
          {
            endChapter: {
              title: 'End of Chapter 6',
              text: 'Rain on the front doors of the lobby. A remote with a red button in your coat pocket, heavier than it should be. Below you, a body breathing. Behind a steel door, a mind in a machine. And somewhere in between, a choice that only you can make.',
            },
          },
        ],
        end: true,
      },
    },
  },

  marcus_after: {
    start: 'only',
    nodes: {
      only: {
        speaker: 'marcus',
        lines: ['I’m not going anywhere, officer.'],
        end: true,
      },
    },
  },
};
