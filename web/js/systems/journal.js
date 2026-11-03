// Documents, recordings and objectives the player has collected.

export function installJournal(ctx) {
  const { effects } = ctx;
  const j = () => ctx.state.journal;

  effects.register('addDocument', (id, c) => {
    const doc = c.content.documents[id];
    if (!doc) throw new Error(`Unknown document "${id}"`);
    if (j().documents.includes(id)) return;
    j().documents.push(id);
    c.cue('document');
    c.say(`Added to journal: ${doc.title}. Open your journal to read it in full.`, { kind: 'system' });
    c.bus.emit('journal:added', { type: 'document', id });
  });

  effects.register('addRecording', (id, c) => {
    const rec = c.content.recordings[id];
    if (!rec) throw new Error(`Unknown recording "${id}"`);
    if (j().recordings.includes(id)) return;
    j().recordings.push(id);
    c.cue('document');
    c.say(`Recording saved to journal: ${rec.title}.`, { kind: 'system' });
    c.bus.emit('journal:added', { type: 'recording', id });
  });

  // { objective: 'id' } activates; { objective: { id, status: 'done' } }
  effects.register('objective', (v, c) => {
    const id = typeof v === 'string' ? v : v.id;
    const status = typeof v === 'string' ? 'active' : v.status || 'active';
    const obj = c.content.objectives[id];
    if (!obj) throw new Error(`Unknown objective "${id}"`);
    if (c.state.objectives[id] === status) return;
    c.state.objectives[id] = status;
    c.cue(status === 'done' ? 'objective.done' : 'objective');
    const prefix = status === 'done' ? 'Objective complete' : status === 'failed' ? 'Objective failed' : 'New objective';
    c.say(`${prefix}: ${obj.text}`, { kind: 'system' });
  });

  function markRead(id) {
    if (!j().read[id]) {
      j().read[id] = true;
      const doc = ctx.content.documents[id] || ctx.content.recordings[id];
      effects.apply(doc?.onRead, ctx);
    }
  }

  function objectivesByStatus(status) {
    return Object.entries(ctx.state.objectives)
      .filter(([, s]) => s === status)
      .map(([id]) => ({ id, text: ctx.content.objectives[id].text }));
  }

  return { markRead, objectivesByStatus };
}
