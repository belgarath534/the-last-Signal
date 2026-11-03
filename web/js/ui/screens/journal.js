// Journal (objectives, documents, recordings), document reader, inventory.

import { h, button, buttonGroup } from '../dom.js';

export function journalScreen(app) {
  const { game } = app;
  const content = game.ctx.content;
  const s = game.state;

  const objList = (status) =>
    game.objectives(status).map((o) => h('li', {}, o.text));

  const active = objList('active');
  const done = objList('done');

  const entryButton = (id, entry) =>
    button(`${entry.title}${s.journal.read[id] ? '' : ', unread'}`, () => app.open('reader', { id }));

  const docs = s.journal.documents.map((id) => entryButton(id, content.documents[id]));
  const recs = s.journal.recordings.map((id) => entryButton(id, content.recordings[id]));

  const el = h(
    'div',
    { class: 'screen' },
    h('h1', {}, 'Journal'),
    h(
      'section',
      { class: 'group' },
      h('h2', {}, 'Current objectives'),
      active.length ? h('ul', { class: 'prose-list' }, active) : h('p', {}, 'None right now.'),
    ),
    done.length
      ? h('section', { class: 'group' }, h('h2', {}, 'Completed'), h('ul', { class: 'prose-list' }, done))
      : null,
    docs.length ? buttonGroup(`Documents, ${docs.length}`, docs) : h('section', { class: 'group' }, h('h2', {}, 'Documents'), h('p', {}, 'None found yet.')),
    recs.length ? buttonGroup(`Recordings, ${recs.length}`, recs) : null,
    button('Back', () => app.back(), { class: 'btn btn-back' }),
  );
  return { el, title: 'Journal' };
}

export function readerScreen(app, p) {
  const content = app.game.ctx.content;
  const entry = content.documents[p.id] || content.recordings[p.id];
  const isRecording = !!content.recordings[p.id];
  app.game.markRead(p.id);
  app.autosave();

  const heading = h('h1', { 'data-quiet': '' }, entry.title);
  const el = h(
    'div',
    { class: 'screen reader' },
    heading,
    h('p', { class: 'kind' }, isRecording ? 'Recording transcript' : 'Document'),
    h('article', { class: 'document' }, entry.text.map((t) => h('p', {}, t))),
    button('Back to journal', () => app.back(), { class: 'btn btn-back' }),
  );
  return {
    el,
    title: entry.title,
    onShow() {
      app.audio.cue(isRecording ? 'tape' : 'document');
      app.announcer.narrate(`${entry.title}. ${entry.text.join(' ')}`);
    },
  };
}

export function inventoryScreen(app) {
  const { game } = app;
  const items = game.state.inventory.map((id) => {
    const it = game.ctx.content.items[id];
    return h('li', {}, h('strong', {}, it.name), `: ${it.description}`);
  });
  const el = h(
    'div',
    { class: 'screen' },
    h('h1', {}, 'Inventory'),
    h('p', {}, items.length ? `You are carrying ${items.length} ${items.length === 1 ? 'thing' : 'things'}. Items are used automatically: when an item can help, a new option appears on the thing it works with.` : 'You are carrying nothing.'),
    h('ul', { class: 'prose-list' }, items),
    button('Back', () => app.back(), { class: 'btn btn-back' }),
  );
  return { el, title: 'Inventory' };
}
