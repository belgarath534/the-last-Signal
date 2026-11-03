// Declarative conditions used everywhere in content: exits, objects,
// actions, dialogue choices, triggers. Keeping them as data (not code)
// means writers can add story content without touching the engine, and
// tests can check content for typos.
//
// A condition is:
//   - null/undefined            -> always true
//   - an array                  -> every entry must be true
//   - a function(state)         -> escape hatch for unusual logic
//   - an object; every key must hold:
//       flag / notFlag          string | string[]
//       has / notHas            item id | item id[]
//       visited / notVisited    room id
//       read                    document id (opened in the journal)
//       found                   document or recording id (in journal)
//       trustAtLeast / trustBelow   number (Daniel's trust)
//       lied / lieExposed       lie id
//       objective               { id, status }
//       minutesAtLeast          number of in-game minutes elapsed
//       at                      room id | room id[] (player's location)
//       inDialogue              boolean
//       chapter                 number (current chapter)
//       wardActive / emilyAlive boolean (Emily's life support, see systems/ward.js)
//       emilyIn                 'capsule' | 'ward'
//       wardPowerBelow / emilyStabilityBelow   number
//       stalkerActive / stalkerHere / stalkerRecharging   boolean (Prototype 001)
//       stalkerIn               room id | room id[]
//       stalkerAlertBelow       number
//       all / any               condition[]
//       not                     condition

const asList = (v) => (Array.isArray(v) ? v : [v]);

const CHECKS = {
  flag: (v, s) => asList(v).every((f) => !!s.flags[f]),
  notFlag: (v, s) => asList(v).every((f) => !s.flags[f]),
  has: (v, s) => asList(v).every((i) => s.inventory.includes(i)),
  notHas: (v, s) => asList(v).every((i) => !s.inventory.includes(i)),
  visited: (v, s) => asList(v).every((r) => !!s.visited[r]),
  notVisited: (v, s) => asList(v).every((r) => !s.visited[r]),
  read: (v, s) => asList(v).every((d) => !!s.journal.read[d]),
  found: (v, s) =>
    asList(v).every((d) => s.journal.documents.includes(d) || s.journal.recordings.includes(d)),
  trustAtLeast: (v, s) => s.trust.daniel.value >= v,
  trustBelow: (v, s) => s.trust.daniel.value < v,
  lied: (v, s) => !!s.trust.daniel.lies[v],
  lieExposed: (v, s) => s.trust.daniel.lies[v]?.exposed === true,
  objective: (v, s) => s.objectives[v.id] === v.status,
  minutesAtLeast: (v, s) => s.time.minutes >= v,
  at: (v, s) => asList(v).includes(s.location),
  inDialogue: (v, s) => !!s.dialogue.active === !!v,
  chapter: (v, s) => s.chapter === v,
  wardActive: (v, s) => !!s.ward?.active === !!v,
  emilyAlive: (v, s) => (s.ward?.emilyAlive ?? true) === !!v,
  emilyIn: (v, s) => !!s.ward?.active && s.ward.location === v,
  wardPowerBelow: (v, s) => (s.ward?.power ?? 0) < v,
  emilyStabilityBelow: (v, s) => (s.ward?.stability ?? 0) < v,
  stalkerActive: (v, s) => !!s.stalker?.active === !!v,
  stalkerHere: (v, s) => (!!s.stalker?.active && s.stalker.room === s.location) === !!v,
  stalkerIn: (v, s) => !!s.stalker?.active && asList(v).includes(s.stalker.room),
  stalkerRecharging: (v, s) => (!!s.stalker?.active && s.time.minutes < s.stalker.rechargeUntil) === !!v,
  stalkerAlertBelow: (v, s) => (s.stalker?.alert ?? 0) < v,
  // There is somewhere to back away to that 001 is not standing in.
  canFlee: (v, s) => (!!s.previousRoom && s.previousRoom !== s.location && s.previousRoom !== s.stalker?.room) === !!v,
  // Named counters, such as the jury's leaning in Part Two.
  counterAtLeast: (v, s) => (s.counters?.[v.id] ?? 0) >= v.n,
  counterBelow: (v, s) => (s.counters?.[v.id] ?? 0) < v.n,
  // { countAtLeast: { flags: [...], n: 2 } }: at least n of these flags are set.
  countAtLeast: (v, s) => v.flags.filter((f) => s.flags[f]).length >= v.n,
  all: (v, s) => v.every((c) => evaluate(c, s)),
  any: (v, s) => v.some((c) => evaluate(c, s)),
  not: (v, s) => !evaluate(v, s),
};

export const CONDITION_KEYS = Object.keys(CHECKS);

export function evaluate(cond, state) {
  if (cond == null) return true;
  if (typeof cond === 'function') return !!cond(state);
  if (Array.isArray(cond)) return cond.every((c) => evaluate(c, state));
  if (typeof cond !== 'object') throw new Error(`Bad condition: ${JSON.stringify(cond)}`);

  for (const [key, value] of Object.entries(cond)) {
    const check = CHECKS[key];
    if (!check) throw new Error(`Unknown condition "${key}"`);
    if (!check(value, state)) return false;
  }
  return true;
}
