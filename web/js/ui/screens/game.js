// The main play screen.
//
// Layout, in reading order (this is what a screen reader user swipes through):
//   1. Heading: where you are            (h1, also the page title)
//   2. Status: time                      (plain text)
//   3. Narration: what just happened     (receives focus after every action)
//   4. Controls, each group under its own h2 so the VoiceOver rotor can jump:
//        explore  -> Actions / Around you / Exits / Menu
//        object   -> the object's actions / Back
//        dialogue -> Respond / Menu
//        chapter end -> summary and choices
//
// After every action focus moves to the narration, so the screen reader
// reads the result immediately; swiping right from there reaches the
// controls for the next decision.

import { h, button, buttonGroup, focusEl } from '../dom.js';
import { DIRECTION_PAN } from '../../systems/world.js';
import { evaluate } from '../../core/conditions.js';
import { endMusic } from '../../audio/music.js';

const POSITION_WORD = { left: 'on your left', right: 'on your right', ahead: 'ahead', behind: 'behind you' };
const DIR_WORD = { north: 'North', south: 'South', east: 'East', west: 'West', up: 'Up', down: 'Down', in: 'In', out: 'Out' };

export function gameScreen(app) {
  const { game } = app;
  let submenu = null; // object id while its action menu is open
  let lastBeat = [];

  const title = h('h1', { id: 'room-title' });
  const status = h('p', { class: 'status' });
  const beatEl = h('p', { id: 'beat', class: 'beat', tabindex: '-1', 'data-quiet': '' });
  const controls = h('div', { class: 'controls' });
  const el = h('div', { class: 'screen game-screen' }, title, status, beatEl, controls);

  // ---- narration ----------------------------------------------------------
  function lineText(l) {
    if (l.kind === 'speech') return `${l.speaker}: “${l.text}”`;
    return l.text;
  }

  function showBeat(lines) {
    const notes = app.takeNotes().map((text) => ({ text, kind: 'system' }));
    const all = [...lines, ...notes];
    if (!all.length) all.push({ text: 'Nothing happens.', kind: 'system' });
    lastBeat = all;
    app.recordBeat(all);
    beatEl.replaceChildren();
    all.forEach((l, i) => {
      if (i > 0) beatEl.append(h('br'), h('br'));
      beatEl.append(h('span', { class: `line line-${l.kind}${l.speakerId ? ` speaker-${l.speakerId}` : ''}` }, lineText(l)));
    });
    app.announcer.narrate(all.map(lineText).join(' '));
  }

  function perform(fn, { closeSubmenu = false } = {}) {
    const beat = fn();
    if (closeSubmenu) submenu = null;
    showBeat(beat.lines);
    render();
    app.autosave();
    if (beat.checkpoint) app.saves.save('checkpoint', game.snapshot(), game.saveMeta());
    focusEl(beatEl);
  }

  // ---- controls -----------------------------------------------------------
  function render() {
    const v = game.view();
    title.textContent = v.mode === 'gameOver' ? v.gameOver.title : v.mode === 'chapterEnd' ? v.ended.title : v.room.name;
    status.textContent = `Time: ${v.clock}`;
    document.title = `${title.textContent} — The Last Signal`;
    // Music never plays over exploration, so it cannot mask speech or clues.
    if (v.mode === 'chapterEnd') app.audio.playMusic(endMusic(v.ended), { loop: false, fade: 4 });
    else if (v.mode === 'gameOver') app.audio.stopMusic();
    else app.updateMusic?.();

    if (submenu && !v.objects.some((o) => o.id === submenu)) submenu = null;
    if (v.mode !== 'explore') submenu = null;

    const groups = [];
    if (v.mode === 'gameOver') groups.push(gameOverControls(v));
    else if (v.mode === 'chapterEnd') groups.push(...chapterEndControls(v));
    else if (v.mode === 'dialogue') groups.push(dialogueControls(v));
    else if (submenu) groups.push(objectControls(v.objects.find((o) => o.id === submenu)));
    else groups.push(...exploreControls(v));

    if (v.mode !== 'chapterEnd' && v.mode !== 'gameOver') groups.push(menuControls(v));
    controls.replaceChildren(...groups.filter(Boolean));
  }

  function exploreControls(v) {
    const actions = v.roomActions.map((a) =>
      button(a.label, () => perform(() => game.roomAction(a.id))),
    );

    const objects = v.objects.map((o) =>
      button(`${o.name}, ${POSITION_WORD[o.position] || ''}`.replace(/, $/, ''), () => {
        app.audio.cue('ui.select');
        submenu = o.id;
        render();
        focusEl(controls.querySelector('h2'));
      }, { 'data-pan': DIRECTION_PAN[o.position] ?? 0, 'data-object-id': o.id }),
    );

    const exits = v.exits.map((e) => {
      const dir = DIR_WORD[e.dir];
      const label = e.dir === 'in' || e.dir === 'out' ? e.label : `${dir}: ${e.label}`;
      return button(e.lockedKnown ? `${label}, locked` : label, () => perform(() => game.go(e.id)), {
        'data-pan': DIRECTION_PAN[e.dir] ?? 0,
      });
    });

    return [
      buttonGroup('Actions', actions),
      buttonGroup('Around you', objects),
      buttonGroup('Exits', exits),
    ];
  }

  function objectControls(obj) {
    const actions = game.objectActions(obj.id).map((a) =>
      button(a.label, () => perform(() => game.act(obj.id, a.id)), { 'data-pan': DIRECTION_PAN[obj.position] ?? 0 }),
    );
    actions.push(
      button(`Back to the room`, () => {
        app.audio.cue('ui.back');
        const id = submenu;
        submenu = null;
        render();
        focusEl([...controls.querySelectorAll('button')].find((b) => b.dataset.objectId === id) || controls.querySelector('h2'));
      }),
    );
    return buttonGroup(obj.name, actions);
  }

  function dialogueControls(v) {
    const choices = v.choices.map((c, i) =>
      button(`${i + 1}. ${c.text}`, () => perform(() => game.choose(c.index)), { class: 'btn choice' }),
    );
    return buttonGroup('Respond', choices);
  }

  function menuControls(v) {
    const items = [
      button('Repeat last', repeat),
      button('Journal', () => app.open('journal')),
      button('Inventory', () => app.open('inventory')),
      button('Pause menu', () => app.open('pause')),
    ];
    if (v.mode === 'dialogue') items.splice(2, 1);
    return buttonGroup('Menu', items);
  }

  function chapterEndControls() {
    const s = game.state;
    const content = game.ctx.content;
    const lines = [`Daniel seems ${app.trustLevel().label} toward you.`];
    // Every chapter's notes so far: earlier choices still matter.
    // Notes from every chapter so far in this part: earlier choices still matter.
    const part = content.chapters[s.chapter]?.part || 1;
    for (let n = 1; n <= s.chapter; n++) {
      if ((content.chapters[n]?.part || 1) !== part) continue;
      for (const l of content.chapters[n]?.summary || []) if (evaluate(l.when, s)) lines.push(l.text);
    }
    for (const lie of Object.values(s.trust.daniel.lies)) {
      lines.push(lie.exposed ? `Daniel caught you lying about ${lie.about}.` : `You lied to Daniel about ${lie.about}. He has not found out. Yet.`);
    }
    const t = game.chapterSummary();
    lines.push(`Documents found: ${t.documents[0]} of ${t.documents[1]}.`);
    lines.push(`Recordings found: ${t.recordings[0]} of ${t.recordings[1]}.`);
    lines.push(`Hidden discoveries: ${t.secrets[0]} of ${t.secrets[1]}.`);

    const hasNext = game.hasNextChapter();
    const ending = s.ended?.ending && content.endings?.[s.ended.ending];
    if (ending) {
      // Endings found are remembered across every playthrough.
      const seen = app.endingsSeen();
      if (!seen.includes(s.ended.ending)) app.recordEnding(s.ended.ending);
    }
    const seenNow = app.endingsSeen();
    const summary = h(
      'section',
      { class: 'group', 'aria-labelledby': 'summary-h' },
      h('h2', { id: 'summary-h' }, ending ? `Ending: ${ending.name}` : 'Your choices so far'),
      ending ? h('p', {}, ending.blurb) : null,
      h('ul', { class: 'summary' }, lines.map((l) => h('li', {}, l))),
      ending
        ? h('p', {}, `Endings found: ${seenNow.length} of ${Object.keys(content.endings).length}. ${hasNext ? 'Part Two continues from this ending.' : 'Thank you for playing.'}`)
        : h('p', {}, hasNext ? 'Your progress is saved.' : 'This is the end of the current build. Your progress is saved, and your choices will carry into the next chapter.'),
    );
    const buttons = [];
    if (ending) {
      if (hasNext) {
        const next = content.chapters[s.chapter + 1];
        buttons.push(button(`Continue to Part Two: ${next.title}`, () => { perform(() => game.startNextChapter()); app.saveChapterStart(); }));
      }
      buttons.push(button('Go back to the final choice', () => app.loadFrom('checkpoint')));
    } else if (hasNext) {
      const next = content.chapters[s.chapter + 1];
      buttons.push(button(`Continue to ${next.title}`, () => { perform(() => game.startNextChapter()); app.saveChapterStart(); }));
    }
    if (!ending) buttons.push(button(`Keep exploring Chapter ${s.chapter}`, () => perform(() => game.continueAfterChapter())));
    buttons.push(button('Return to the main menu', () => app.show('title')));
    return [summary, buttonGroup('What next', buttons)];
  }

  function gameOverControls(v) {
    const hasCheckpoint = !app.saves.list().find((x) => x.slot === 'checkpoint')?.empty;
    const buttons = [];
    if (hasCheckpoint) buttons.push(button('Try again from the last checkpoint', () => app.loadFrom('checkpoint')));
    buttons.push(button('Return to the main menu', () => app.show('title')));
    return h(
      'section',
      { class: 'group', 'aria-labelledby': 'go-h' },
      h('h2', { id: 'go-h' }, 'You died'),
      h('p', {}, v.gameOver.text),
      h('ul', { class: 'btn-list' }, buttons.map((b) => h('li', {}, b))),
    );
  }

  function repeat() {
    app.announcer.narrate(lastBeat.map(lineText).join(' '));
    focusEl(beatEl);
  }

  return {
    el,
    title: 'Game',
    focusTarget: () => beatEl,

    onShow(params) {
      if (params.newGame) {
        showBeat(game.newGame().lines);
        app.saveChapterStart();
      }
      else if (params.resume) showBeat(game.resume().lines);
      else if (!lastBeat.length) showBeat(game.resume().lines);
      render();
      if (params.newGame || params.resume) app.autosave();
    },

    onKey(key) {
      const v = game.view();
      if (key === 'Escape') {
        if (submenu) {
          submenu = null;
          render();
          focusEl(controls.querySelector('h2'));
        } else app.open('pause');
        return true;
      }
      if (key === 'r' || key === 'R') return repeat(), true;
      if (key === 'j' || key === 'J') return app.open('journal'), true;
      if ((key === 'i' || key === 'I') && v.mode !== 'dialogue') return app.open('inventory'), true;
      if (v.mode === 'explore' && (key === 'l' || key === 'L')) return perform(() => game.look(), { closeSubmenu: true }), true;
      if (/^[1-9]$/.test(key)) {
        const btn = controls.querySelectorAll('.btn-list')[0]?.querySelectorAll('button')[Number(key) - 1];
        if (btn) btn.click();
        return !!btn;
      }
      return false;
    },
  };
}
