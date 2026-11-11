// Persistent progress. Saves are versioned JSON in key/value storage
// (localStorage in the browser and in the iOS web view). Every save
// carries a version number and is passed through migrations on load,
// so old saves keep working as the game grows.

import { SAVE_VERSION } from './state.js';

export const SLOTS = ['auto', 'checkpoint', '1', '2', '3'];

// migrations[n] upgrades a save from version n to n + 1.
const migrations = {
  // 1: (data) => { data.state.newField = default; return data; },
};

export function migrate(data) {
  let current = data;
  while (current.state.version < SAVE_VERSION) {
    const step = migrations[current.state.version];
    if (!step) throw new Error(`No migration from save version ${current.state.version}`);
    current = step(current);
    current.state.version += 1;
  }
  return current;
}

function isValidState(s) {
  return (
    s &&
    typeof s === 'object' &&
    typeof s.version === 'number' &&
    typeof s.location === 'string' &&
    s.flags && Array.isArray(s.inventory) && s.trust?.daniel && s.time
  );
}

export function createSaveManager(storage, prefix = 'tls') {
  const key = (slot) => `${prefix}.save.${slot}`;

  function safeGet(k) {
    try {
      return storage?.getItem(k) ?? null;
    } catch {
      return null;
    }
  }

  return {
    save(slot, state, meta = {}) {
      const data = { meta: { ...meta, savedAt: new Date().toISOString() }, state };
      try {
        storage.setItem(key(slot), JSON.stringify(data));
        return true;
      } catch (err) {
        console.error('[save] failed', err);
        return false;
      }
    },

    // Returns { state, meta } or null when the slot is empty or unreadable.
    load(slot) {
      const raw = safeGet(key(slot));
      if (!raw) return null;
      try {
        const data = migrate(JSON.parse(raw));
        if (!isValidState(data.state)) throw new Error('save failed validation');
        return data;
      } catch (err) {
        console.error(`[save] slot ${slot} is unreadable`, err);
        return null;
      }
    },

    remove(slot) {
      try {
        storage.removeItem(key(slot));
      } catch {
        /* ignore */
      }
    },

    // Summary for menus, newest first.
    list() {
      return SLOTS.map((slot) => {
        const raw = safeGet(key(slot));
        if (!raw) return { slot, empty: true };
        try {
          const { meta } = JSON.parse(raw);
          return { slot, empty: false, meta };
        } catch {
          return { slot, empty: false, corrupt: true, meta: {} };
        }
      });
    },

    // Whether a slot holds a save, for slots outside SLOTS such as chapter starts.
    has(slot) {
      return !!safeGet(key(slot));
    },

    latest() {
      const filled = this.list().filter((s) => !s.empty && !s.corrupt && s.meta?.savedAt);
      filled.sort((a, b) => b.meta.savedAt.localeCompare(a.meta.savedAt));
      return filled[0]?.slot ?? null;
    },
  };
}
