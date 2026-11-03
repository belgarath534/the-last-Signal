// Daniel's trust in the player.
//
// value:   -100 .. 100, starts at 0 ("wary").
// history: every change with its reason, so later content (and the
//          chapter summary) can refer back to what the player did.
// lies:    things the player said that were not true. A lie costs nothing
//          when told, but if Daniel later catches it (exposeLie) trust
//          drops sharply. Honesty is tracked separately from trust: being
//          honest about something Daniel dislikes can still lower trust.

const MIN = -100;
const MAX = 100;

export const TRUST_LEVELS = [
  { id: 'hostile', min: -100, label: 'hostile' },
  { id: 'distrustful', min: -40, label: 'distrustful' },
  { id: 'wary', min: -10, label: 'wary' },
  { id: 'cautious', min: 20, label: 'cautiously open' },
  { id: 'trusting', min: 50, label: 'trusting' },
];

export function trustLevel(value) {
  let level = TRUST_LEVELS[0];
  for (const l of TRUST_LEVELS) if (value >= l.min) level = l;
  return level;
}

export function installTrust(ctx) {
  const { effects } = ctx;
  const daniel = () => ctx.state.trust.daniel;

  function change(amount, reason) {
    const t = daniel();
    const before = t.value;
    t.value = Math.max(MIN, Math.min(MAX, t.value + amount));
    const delta = t.value - before;
    if (delta === 0) return;
    t.history.push({ delta, reason: reason || '', at: ctx.state.time.minutes });
    const levelChanged = trustLevel(before).id !== trustLevel(t.value).id;
    ctx.bus.emit('trust:changed', { delta, value: t.value, reason, level: trustLevel(t.value), levelChanged });
  }

  effects.register('trust', (v) => {
    if (typeof v === 'number') change(v);
    else change(v.amount, v.reason);
  });

  effects.register('honest', () => {
    daniel().honestAnswers += 1;
  });

  effects.register('lie', (v) => {
    const id = typeof v === 'string' ? v : v.id;
    daniel().lies[id] = { exposed: false, at: ctx.state.time.minutes, about: v.about || id };
  });

  // { exposeLie: { id, penalty, reason } }  -- does nothing if no such lie.
  effects.register('exposeLie', (v) => {
    const lie = daniel().lies[v.id];
    if (!lie || lie.exposed) return;
    lie.exposed = true;
    change(-(v.penalty ?? 20), v.reason || `caught lying about ${lie.about}`);
  });

  return { change, level: () => trustLevel(daniel().value) };
}
