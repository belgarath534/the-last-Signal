// Effects are the "verbs" content uses to change the world:
//   { setFlag: 'power_on' }, { give: 'flashlight' }, { trust: { amount: 5, reason: '...' } }
// Each system registers the effects it owns, so the engine core never
// needs to know about trust, journals or dialogue.
//
// An effect list is an array of objects; each object may hold several
// keys, applied in the order written.

export function createEffects() {
  const handlers = new Map();

  function register(name, fn) {
    if (handlers.has(name)) throw new Error(`Effect "${name}" registered twice`);
    handlers.set(name, fn);
  }

  function apply(effects, ctx) {
    if (!effects) return;
    const list = Array.isArray(effects) ? effects : [effects];
    for (const effect of list) {
      if (typeof effect === 'function') {
        effect(ctx);
        continue;
      }
      for (const [name, value] of Object.entries(effect)) {
        const fn = handlers.get(name);
        if (!fn) throw new Error(`Unknown effect "${name}"`);
        fn(value, ctx);
      }
    }
  }

  return { register, apply, has: (name) => handlers.has(name), names: () => [...handlers.keys()] };
}
