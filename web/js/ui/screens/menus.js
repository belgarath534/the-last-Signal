// Title, first-run, pause, save/load, history, help and confirmation screens.

import { h, button, buttonGroup } from '../dom.js';

function screen(titleText, ...children) {
  return h('div', { class: 'screen' }, h('h1', {}, titleText), ...children);
}

const backButton = (app, label = 'Back') => button(label, () => app.back(), { class: 'btn btn-back' });

// ---- first launch -----------------------------------------------------------
export function firstRunScreen(app) {
  const choose = (mode) => {
    app.settings.set('speechMode', mode);
    app.settings.set('firstRunDone', true);
    app.audio.cue('ui.select');
    app.show('title');
  };
  const el = screen(
    'Welcome to The Last Signal',
    h('p', {}, 'This game is designed to be played entirely by sound and text, without needing to see the screen. Headphones are strongly recommended: sounds on your left and right tell you where things are.'),
    h('p', {}, 'How would you like the game to speak to you? You can change this later in Settings.'),
    buttonGroup('Choose how to play', [
      button('I use a screen reader, such as VoiceOver', () => choose('screenreader')),
      button('Read the game aloud to me', () => choose('selfvoice')),
      button('I will read the text myself', () => choose('text')),
    ]),
  );
  return { el, title: 'Welcome' };
}

// ---- title --------------------------------------------------------------------
export function titleScreen(app) {
  const latest = app.saves.latest();
  const items = [];
  if (latest) {
    items.push(button('Continue', () => app.loadFrom(latest)));
  }
  items.push(
    button('New game', () => {
      if (!latest) return app.newGame();
      app.open('confirm', {
        question: 'Start a new game? Your autosave will be replaced. Saves in numbered slots are kept.',
        yes: 'Start a new game',
        no: 'Cancel',
        onYes: () => app.newGame(),
      });
    }),
  );
  if (latest) items.push(button('Load game', () => app.open('saves', { mode: 'load' })));
  if (app.chapterStarts().length) items.push(button('Chapter select', () => app.open('chapters')));
  items.push(
    button('Settings', () => app.open('settings')),
    button('How to play', () => app.open('help')),
  );

  const el = h(
    'div',
    { class: 'screen title-screen' },
    h('h1', { class: 'game-title' }, 'The Last Signal'),
    h('p', { class: 'tagline' }, 'A psychological horror investigation. Played by ear.'),
    buttonGroup('Main menu', items),
    h('p', { class: 'fineprint' }, 'Parts One and Two: twelve chapters, ten endings.'),
  );

  return {
    el,
    title: 'Main menu',
    onShow() {
      app.audio.setSoundscape('outdoor_rain');
      app.audio.playMusic('music-title');
    },
  };
}

// ---- confirmation ---------------------------------------------------------------
export function confirmScreen(app, p) {
  const el = screen(
    'Are you sure?',
    h('p', { class: 'question' }, p.question),
    buttonGroup('Choose', [
      button(p.yes || 'Yes', () => p.onYes()),
      button(p.no || 'No', () => (p.onNo ? p.onNo() : app.back())),
    ]),
  );
  return { el, title: 'Confirm' };
}

// ---- pause --------------------------------------------------------------------
export function pauseScreen(app) {
  const el = screen(
    'Paused',
    h('p', { class: 'status' }, `${app.game.saveMeta().room}. ${app.game.saveMeta().clock}.`),
    buttonGroup('Pause menu', [
      button('Resume', () => app.back()),
      button('Save game', () => app.open('saves', { mode: 'save' })),
      button('Load game', () => app.open('saves', { mode: 'load' })),
      button('Message history', () => app.open('history')),
      button('Settings', () => app.open('settings')),
      button('How to play', () => app.open('help')),
      button('Quit to main menu', () => {
        app.autosave();
        app.open('confirm', {
          question: 'Quit to the main menu? Your progress has been autosaved.',
          yes: 'Quit to main menu',
          no: 'Stay',
          onYes: () => app.show('title'),
        });
      }),
    ]),
  );
  return { el, title: 'Paused' };
}

// ---- save / load ------------------------------------------------------------
function describeSlot(s) {
  const name = s.slot === 'auto' ? 'Autosave' : s.slot === 'checkpoint' ? 'Checkpoint' : `Slot ${s.slot}`;
  if (s.empty) return `${name}: empty`;
  if (s.corrupt) return `${name}: damaged save`;
  const m = s.meta;
  const when = m.savedAt ? new Date(m.savedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '';
  return `${name}: ${m.room}, Chapter ${m.chapter}, ${m.clock} in game. Saved ${when}.`;
}

export function savesScreen(app, p) {
  const saving = p.mode === 'save';
  const slots = app.saves.list().filter((s) => !(saving && (s.slot === 'auto' || s.slot === 'checkpoint')));
  const result = h('p', { role: 'status', class: 'result' });

  const buttons = slots.map((s) =>
    button(describeSlot(s), () => {
      if (saving) {
        const doSave = () => {
          const ok = app.saveTo(s.slot);
          app.show('saves', { ...p });
          app.notify(ok ? `Saved to slot ${s.slot}.` : 'Saving failed. Storage may be full.', { assertive: true });
        };
        if (s.empty) return doSave();
        app.open('confirm', {
          question: `Overwrite ${describeSlot(s)}`,
          yes: 'Overwrite',
          no: 'Cancel',
          onYes: doSave,
          onNo: () => app.show('saves', { ...p }),
        });
      } else {
        if (s.empty || s.corrupt) {
          app.audio.cue('ui.error');
          return app.notify(s.empty ? 'That slot is empty.' : 'That save is damaged and cannot be loaded.');
        }
        app.loadFrom(s.slot);
      }
    }, { 'aria-disabled': !saving && (s.empty || s.corrupt) ? 'true' : null }),
  );

  const el = screen(
    saving ? 'Save game' : 'Load game',
    h('p', {}, saving ? 'Choose a slot to save to. The game also autosaves after every action.' : 'Choose a save to load.'),
    buttonGroup('Save slots', buttons),
    result,
    backButton(app),
  );
  return { el, title: saving ? 'Save game' : 'Load game' };
}

// ---- chapter select -------------------------------------------------------------
// Replays a chapter from its start, with the choices made before it.
export function chaptersScreen(app) {
  const chapters = app.game.ctx.content.chapters;
  const reached = app.chapterStarts();
  const total = Object.keys(chapters).length;
  const buttons = reached.map((n) =>
    button(chapters[n].title, () =>
      app.open('confirm', {
        question: `Replay ${chapters[n].title}? You start it with the choices you had made before it. Your autosave is replaced; saves in numbered slots are kept.`,
        yes: 'Replay this chapter',
        no: 'Cancel',
        onYes: () => app.loadFrom(`chapter.${n}`),
      }),
    ),
  );
  const el = screen(
    'Chapter select',
    h('p', {}, `Replay any chapter you have reached: ${reached.length} of ${total}. Some endings depend on a choice made chapters earlier, so going back to an earlier chapter is how you find them.`),
    buttonGroup('Chapters', buttons),
    backButton(app),
  );
  return { el, title: 'Chapter select' };
}

// ---- message history ----------------------------------------------------------
export function historyScreen(app) {
  const text = (l) => (l.kind === 'speech' ? `${l.speaker}: “${l.text}”` : l.text);
  const items = app.history.map((beat) => h('li', {}, beat.map((l) => h('p', {}, text(l)))));
  const el = screen(
    'Message history',
    h('p', {}, items.length ? 'Everything that has happened this session, oldest first. The most recent is at the end.' : 'Nothing yet.'),
    h('ol', { class: 'history' }, items),
    backButton(app),
  );
  return { el, title: 'Message history' };
}

// ---- help ---------------------------------------------------------------------
const SOUND_GLOSSARY = [
  ['signal', 'The signal: three short tones and one long. The reason you are here.'],
  ['radio.static', 'Radio: someone is talking to you over a radio.'],
  ['speaker.hum', 'Facility speakers: someone is talking through the building.'],
  ['trust.up', 'Trust rises: Daniel trusts you a little more.'],
  ['trust.down', 'Trust falls: Daniel trusts you a little less.'],
  ['objective', 'New objective.'],
  ['objective.done', 'Objective complete.'],
  ['document', 'A document or recording was added to your journal.'],
  ['pickup', 'An item was added to your inventory.'],
  ['locked', 'The way is locked or blocked.'],
  ['secret', 'You found something hidden.'],
  ['monitor', 'Emily\u2019s heart monitor.'],
  ['alarm', 'Emily\u2019s monitor alarm: she needs attention soon.'],
  ['alarm.critical', 'Urgent alarm: Emily is in danger right now.'],
  ['footsteps.heavy', 'Prototype 001, one room away. The ear tells you which side.'],
  ['footsteps.far', 'Prototype 001, two rooms away.'],
];

export function helpScreen(app) {
  const section = (title, ...body) => h('section', { class: 'group' }, h('h2', {}, title), ...body);
  const list = (...items) => h('ul', { class: 'prose-list' }, items.map((t) => h('li', {}, t)));

  const el = screen(
    'How to play',
    section(
      'The basics',
      h('p', {}, 'You explore the facility one place at a time. After every action, the game moves your focus to the text describing what happened. Swipe right, or press Tab, to reach your options.'),
      list(
        'Actions: look around, listen, or use your radio.',
        'Around you: things you can examine or use. Their position, left, right or ahead, is also played in that ear.',
        'Exits: the ways out of this place, with their direction.',
        'Menu: repeat the last text, your journal, inventory, and the pause menu.',
      ),
      h('p', {}, 'Every group starts with a heading, so you can jump between groups with the VoiceOver rotor set to Headings, or with your screen reader’s heading key.'),
    ),
    section(
      'Listening',
      h('p', {}, 'Listen is a real tool, not decoration. Some things in the facility can only be found by listening for them. Time passes as you act, not while you read, so take as long as you need.'),
    ),
    section(
      'Daniel and trust',
      h('p', {}, 'How honest you are, and what you choose to say, changes how much Daniel trusts you. Lies are remembered, and can be discovered later. By default a soft sound plays when his trust changes. You can turn that off, or have it spoken, in Settings.'),
    ),
    section(
      'Keyboard shortcuts',
      list(
        'R: repeat the last text.',
        'L: look around.',
        'J: journal. I: inventory.',
        'Numbers 1 to 9: pick the matching option in the first list, such as a reply in a conversation.',
        'Escape: pause menu, or back.',
      ),
    ),
    section(
      'Sound glossary',
      h('p', {}, 'Play each sound to learn what it means.'),
      h('ul', { class: 'btn-list' }, SOUND_GLOSSARY.map(([cue, label]) => h('li', {}, button(`Play: ${label}`, () => app.audio.cue(cue))))),
    ),
    backButton(app),
  );
  return { el, title: 'How to play' };
}
