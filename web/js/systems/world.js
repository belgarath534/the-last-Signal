// Rooms, exits, objects and the inventory.
// Rooms are data (see content/rooms.js); this system turns them into
// descriptions, menus and state changes.

import { evaluate } from '../core/conditions.js';

const DIRECTION_ORDER = ['north', 'east', 'south', 'west', 'up', 'down', 'in', 'out'];

export const DIRECTION_PAN = {
  north: 0, south: 0, east: 0.8, west: -0.8, up: 0, down: 0, in: 0, out: 0,
  left: -0.6, right: 0.6, ahead: 0, behind: 0,
};

const doneKey = (room, obj, action) => `done:${room}:${obj}:${action}`;
const triedLockedKey = (room, exit) => `lockedKnown:${room}:${exit}`;

// Text fields may be a plain string or a list of { when, text } variants;
// the first variant whose condition holds is used.
export function pickText(value, state) {
  if (!Array.isArray(value)) return value;
  return value.find((v) => evaluate(v.when, state))?.text;
}

function joinList(items) {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

export function installWorld(ctx) {
  const { effects } = ctx;
  const rooms = ctx.content.rooms;

  const room = () => {
    const r = rooms[ctx.state.location];
    if (!r) throw new Error(`Unknown room "${ctx.state.location}"`);
    return r;
  };

  // ---- inventory -------------------------------------------------------
  effects.register('give', (itemId, c) => {
    const item = c.content.items[itemId];
    if (!item) throw new Error(`Unknown item "${itemId}"`);
    if (!c.state.inventory.includes(itemId)) {
      c.state.inventory.push(itemId);
      c.cue('pickup');
      c.say(`Added to inventory: ${item.name}.`, { kind: 'system' });
    }
  });

  effects.register('remove', (itemId, c) => {
    c.state.inventory = c.state.inventory.filter((i) => i !== itemId);
  });

  // { useOne: [ids] } removes the first of these items the player carries.
  effects.register('useOne', (ids, c) => {
    const id = ids.find((i) => c.state.inventory.includes(i));
    if (id) c.state.inventory = c.state.inventory.filter((i) => i !== id);
  });

  effects.register('moveTo', (roomId, c) => enterRoom(roomId, c));

  // ---- queries ---------------------------------------------------------
  function visibleObjects() {
    return (room().objects || []).filter((o) => evaluate(o.when, ctx.state));
  }

  function visibleExits() {
    const list = (room().exits || []).filter((e) => evaluate(e.when, ctx.state));
    return list.sort((a, b) => DIRECTION_ORDER.indexOf(a.dir) - DIRECTION_ORDER.indexOf(b.dir));
  }

  function exitLabel(exit) {
    const target = rooms[exit.to];
    return exit.label || target?.name || exit.to;
  }

  function isLocked(exit) {
    // `locked: true` means locked for good; anything else is a condition
    if (exit.locked === true) return true;
    return exit.locked ? evaluate(exit.locked, ctx.state) : false;
  }

  function objectActions(objectId) {
    const obj = visibleObjects().find((o) => o.id === objectId);
    if (!obj) return [];
    return (obj.actions || []).filter((a) => {
      if (!evaluate(a.when, ctx.state)) return false;
      if (a.once && a.hideAfter && ctx.state.flags[doneKey(room().id, obj.id, a.id)]) return false;
      return true;
    });
  }

  // ---- descriptions ----------------------------------------------------
  function details(list) {
    return (list || []).filter((d) => evaluate(d.when, ctx.state)).map((d) => d.text);
  }

  function summary() {
    const objs = visibleObjects().map((o) => o.name.toLowerCase());
    const lower = (t) => t.charAt(0).toLowerCase() + t.slice(1);
    const exits = visibleExits().map((e) =>
      e.dir === 'in' || e.dir === 'out' ? lower(exitLabel(e)) : `${e.dir}: ${lower(exitLabel(e))}`,
    );
    const parts = [];
    if (objs.length) parts.push(`You notice ${joinList(objs)}.`);
    if (exits.length) parts.push(`Ways out: ${exits.join('; ')}.`);
    return parts.join(' ');
  }

  function describe({ full }) {
    const r = room();
    const firstTime = !ctx.state.visited[r.id];
    const base = full || firstTime || !r.revisit ? r.description : r.revisit;
    ctx.say(pickText(base, ctx.state));
    for (const d of details(r.details)) ctx.say(d);
    ctx.say(summary(), { kind: 'summary' });
  }

  function enterRoom(roomId, c = ctx) {
    if (!rooms[roomId]) throw new Error(`Unknown room "${roomId}"`);
    if (c.state.location !== roomId) c.state.previousRoom = c.state.location;
    c.state.location = roomId;
    const r = rooms[roomId];
    c.bus.emit('room:entered', { room: r });
    c.say(r.name, { kind: 'heading' });
    describe({ full: false });
    c.state.visited[roomId] = true;
  }

  // ---- player actions ----------------------------------------------------
  function look() {
    ctx.cue('ui.select');
    describe({ full: true });
    ctx.advanceTime(1);
  }

  function listen() {
    const r = room();
    const l = r.listen || {};
    ctx.cue('listen');
    ctx.say(pickText(l.text, ctx.state) || 'You hold still and listen. Nothing stands out.');
    for (const d of details(l.details)) ctx.say(d);
    effects.apply(l.effects, ctx);
    ctx.runListenHooks();
    ctx.advanceTime(1);
  }

  function go(exitId) {
    const exit = visibleExits().find((e) => e.id === exitId);
    if (!exit) return ctx.say('You cannot go that way.', { kind: 'system' });
    if (isLocked(exit)) {
      ctx.state.flags[triedLockedKey(room().id, exit.id)] = true;
      ctx.cue('locked', { pan: DIRECTION_PAN[exit.dir] });
      ctx.say(pickText(exit.lockedText, ctx.state) || 'The way is blocked.');
      return;
    }
    ctx.cue(exit.sound || 'door', { pan: DIRECTION_PAN[exit.dir] });
    if (exit.text) ctx.say(exit.text);
    effects.apply(exit.effects, ctx);
    enterRoom(exit.to);
    ctx.advanceTime(exit.time ?? 2);
  }

  function act(objectId, actionId) {
    const r = room();
    const obj = visibleObjects().find((o) => o.id === objectId);
    const action = obj && objectActions(objectId).find((a) => a.id === actionId);
    if (!action) return ctx.say('That is not possible right now.', { kind: 'system' });

    const key = doneKey(r.id, obj.id, action.id);
    const alreadyDone = !!ctx.state.flags[key];

    if (action.cue) ctx.cue(action.cue, { pan: DIRECTION_PAN[obj.position] });
    if (alreadyDone && action.once) {
      ctx.say(pickText(action.afterText || action.text, ctx.state));
    } else {
      if (action.text) ctx.say(pickText(action.text, ctx.state));
      effects.apply(action.effects, ctx);
      if (action.once) ctx.state.flags[key] = true;
    }
    ctx.advanceTime(action.time ?? 1);
  }

  return {
    room,
    visibleObjects,
    visibleExits,
    exitLabel,
    isLocked,
    lockedKnown: (exit) => !!ctx.state.flags[triedLockedKey(room().id, exit.id)] && isLocked(exit),
    objectActions,
    enterRoom,
    describeHere() {
      ctx.say(room().name, { kind: 'heading' });
      describe({ full: false });
    },
    look,
    listen,
    go,
    act,
  };
}
