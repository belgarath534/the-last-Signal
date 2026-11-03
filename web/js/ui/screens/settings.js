// Settings. Native form controls with real <label>s: they are the most
// reliable controls for VoiceOver (swipe up/down adjusts sliders and
// pickers) and for every other screen reader and input method.

import { h, button, buttonGroup } from '../dom.js';

let uid = 0;

function field(labelText, control, hint) {
  const id = `f${++uid}`;
  control.id = id;
  const hintEl = hint ? h('p', { class: 'hint', id: `${id}-hint` }, hint) : null;
  if (hintEl) control.setAttribute('aria-describedby', hintEl.id);
  return h('div', { class: 'field' }, h('label', { for: id }, labelText), control, hintEl);
}

function select(app, key, options, onChange) {
  const el = h(
    'select',
    { onchange: (e) => { const v = options.find((o) => String(o[0]) === e.target.value)[0]; app.settings.set(key, v); onChange?.(v); } },
    options.map(([value, label]) => h('option', { value: String(value), selected: app.settings.get(key) === value }, label)),
  );
  return el;
}

function checkbox(app, key, labelText, hint) {
  const id = `f${++uid}`;
  const input = h('input', {
    type: 'checkbox',
    id,
    checked: app.settings.get(key),
    onchange: (e) => app.settings.set(key, e.target.checked),
  });
  const hintEl = hint ? h('p', { class: 'hint', id: `${id}-hint` }, hint) : null;
  if (hintEl) input.setAttribute('aria-describedby', hintEl.id);
  return h('div', { class: 'field checkbox' }, input, h('label', { for: id }, labelText), hintEl);
}

function volume(app, key) {
  const pct = (v) => `${Math.round(v * 100)} percent`;
  const input = h('input', {
    type: 'range',
    min: '0',
    max: '1',
    step: '0.1',
    value: String(app.settings.get(key)),
    'aria-valuetext': pct(app.settings.get(key)),
  });
  input.addEventListener('input', () => {
    const v = Number(input.value);
    input.setAttribute('aria-valuetext', pct(v));
    app.settings.set(key, v);
    app.audio.applyVolumes();
  });
  input.addEventListener('change', () => app.audio.cue(key === 'ambienceVolume' ? 'signal' : 'ui.select'));
  return input;
}

export function settingsScreen(app) {
  const voices = app.announcer.voices().filter((v) => v.lang?.startsWith('en'));

  const el = h(
    'div',
    { class: 'screen settings' },
    h('h1', {}, 'Settings'),

    h('section', { class: 'group' },
      h('h2', {}, 'Speech'),
      field('How the game speaks', select(app, 'speechMode', [
        ['screenreader', 'Use my screen reader'],
        ['selfvoice', 'Read aloud with the built-in voice'],
        ['text', 'Text only'],
      ]), 'Choose "Use my screen reader" if you have VoiceOver or another screen reader turned on. The built-in voice is for players who do not use one.'),
      field('Built-in voice speed', select(app, 'voiceRate', [
        [0.8, 'Slow'], [1, 'Normal'], [1.25, 'Fast'], [1.5, 'Very fast'], [1.8, 'Fastest'],
      ])),
      voices.length
        ? field('Built-in voice', select(app, 'voiceName', [['', 'Default'], ...voices.map((v) => [v.name, v.name])]))
        : null,
      button('Test the built-in voice', () => {
        const mode = app.settings.get('speechMode');
        if (mode !== 'selfvoice') app.notify('The built-in voice is only used when "Read aloud with the built-in voice" is selected.');
        else app.announcer.narrate('Unit 14, dispatch. Status check on the signal call, over.');
      }),
    ),

    h('section', { class: 'group' },
      h('h2', {}, 'Sound'),
      field('Master volume', volume(app, 'masterVolume')),
      field('Ambience volume', volume(app, 'ambienceVolume')),
      field('Effects volume', volume(app, 'effectsVolume')),
      field('Music volume', volume(app, 'musicVolume'), 'Music plays on the main menu and at the end of chapters, never over exploration.'),
      checkbox(app, 'explorationMusic', 'Music while exploring', 'Quiet music under every chapter. Turn off if it ever covers your screen reader.'),
      checkbox(app, 'monoAudio', 'Mono audio', 'Plays every sound in both ears. Directions are still spoken in text.'),
      checkbox(app, 'reduceStartles', 'Reduce sudden loud sounds'),
      buttonGroup('Headphone check', [
        button('Play a sound on the left', () => app.audio.cue('door', { pan: -0.9 }), { 'data-pan': '-0.9' }),
        button('Play a sound on the right', () => app.audio.cue('door', { pan: 0.9 }), { 'data-pan': '0.9' }),
      ], { headingLevel: 3 }),
    ),

    h('section', { class: 'group' },
      h('h2', {}, 'Gameplay'),
      field('When Daniel’s trust changes', select(app, 'trustFeedback', [
        ['sound', 'Play a soft sound'],
        ['speech', 'Play a sound and say it'],
        ['off', 'Tell me nothing'],
      ]), 'Turning this off makes his feelings harder to read, as they would be in person.'),
      checkbox(app, 'shortcuts', 'Keyboard shortcuts', 'Single-key shortcuts such as R to repeat. Turn off if they clash with your screen reader.'),
    ),

    h('section', { class: 'group' },
      h('h2', {}, 'Display'),
      field('Text size', select(app, 'textSize', [
        ['normal', 'Normal'], ['large', 'Large'], ['larger', 'Larger'],
      ])),
      checkbox(app, 'highContrast', 'High contrast'),
    ),

    buttonGroup('Finish', [
      button('Reset all settings to default', () => {
        app.settings.reset();
        app.audio.applyVolumes();
        app.show('settings', app.currentParams);
        app.notify('Settings reset.');
      }),
      button('Back', () => app.back(), { class: 'btn btn-back' }),
    ]),
  );
  return { el, title: 'Settings' };
}
