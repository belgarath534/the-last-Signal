// The whole game state is one plain JSON-serialisable object.
// Nothing in here may hold functions, DOM nodes or class instances,
// because it is written to disk as-is by the save system.

export const SAVE_VERSION = 1;

// In-game clock starts at 1:47 AM on the night of the call.
export const START_CLOCK_MINUTES = 1 * 60 + 47;

export function createInitialState({ startRoom, chapter = 1 } = {}) {
  return {
    version: SAVE_VERSION,
    chapter,
    location: startRoom,
    visited: {},
    flags: {},
    inventory: [],
    journal: {
      documents: [],
      recordings: [],
      read: {},
    },
    objectives: {},
    trust: {
      daniel: { value: 0, history: [], lies: {}, honestAnswers: 0 },
    },
    time: { minutes: 0 },
    timers: [],
    dialogue: { active: null, seen: {} },
    firedTriggers: {},
    ended: null,
    stalker: { active: false, room: null, step: 0, nextMoveAt: 0, rechargeUntil: 0, alert: 0, alertDecayAt: 0 },
    previousRoom: null,
    gameOver: null,
    ward: { active: false, location: 'capsule', power: 0, stability: 0, emilyAlive: true, warned: {} },
    counters: {},
    stats: { actions: 0, secretsFound: 0 },
  };
}

// Deep clone for snapshots / saving. State is plain JSON so this is safe.
export function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

export function clockLabel(minutesElapsed) {
  const total = (START_CLOCK_MINUTES + minutesElapsed) % (24 * 60);
  const h24 = Math.floor(total / 60);
  const m = total % 60;
  const suffix = h24 < 12 ? 'AM' : 'PM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}
