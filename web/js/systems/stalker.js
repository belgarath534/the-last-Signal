// Prototype 001 on patrol.
//
// Designed to be played by ear, and to be fair:
//   - 001 walks a fixed route, one room every MOVE_EVERY in-game minutes.
//     Time only passes when you act, so you can always stop and think.
//   - Whenever it is next to you, you hear heavy footsteps in the ear of
//     its direction, and the text says where it is.
//   - If its next step is into your room, you are warned first.
//   - Listen tells you exactly where it is, anywhere in range.
//   - At the end of its route it stands still to recharge. It cannot see
//     you then. That is the moment to take its key.
// Meeting it starts an encounter (content: dialogues 'encounter_001').

const MOVE_EVERY = 2;
const RECHARGE_MINUTES = 6;
const ALERT_DECAY_EVERY = 10;

export const STALKER_DEFAULTS = {
  active: false,
  room: null,
  step: 0,
  nextMoveAt: 0,
  rechargeUntil: 0,
  alert: 0,
  alertDecayAt: 0,
};

export function installStalker(ctx) {
  const { effects } = ctx;
  const s = () => {
    if (!ctx.state.stalker) ctx.state.stalker = JSON.parse(JSON.stringify(STALKER_DEFAULTS));
    return ctx.state.stalker;
  };
  const route = () => ctx.content.stalkerRoute;
  const rooms = ctx.content.rooms;

  // Shortest path length and first direction from the player to a room.
  function locate(target) {
    const from = ctx.state.location;
    if (from === target) return { distance: 0 };
    const seen = new Set([from]);
    let frontier = (rooms[from].exits || []).filter((e) => e.to !== from).map((e) => ({ room: e.to, dir: e.dir }));
    for (let distance = 1; distance <= 4 && frontier.length; distance++) {
      const hit = frontier.find((f) => f.room === target);
      if (hit) return { distance, dir: hit.dir };
      const next = [];
      for (const f of frontier) {
        if (seen.has(f.room)) continue;
        seen.add(f.room);
        for (const e of rooms[f.room]?.exits || []) if (!seen.has(e.to)) next.push({ room: e.to, dir: f.dir });
      }
      frontier = next;
    }
    return { distance: Infinity };
  }

  const roomWord = (id) => rooms[id].shortName || rooms[id].name.toLowerCase();

  const PAN = { north: 0, south: 0, east: 0.8, west: -0.8 };
  const dirWord = (d) => ({ north: 'ahead of you, to the north', south: 'behind you, to the south', east: 'on your right, to the east', west: 'on your left, to the west', up: 'above you, up the lift shaft', down: 'below you' })[d] || d;

  function recharging() {
    const st = s();
    return st.active && ctx.state.time.minutes < st.rechargeUntil;
  }

  function nextRoom() {
    const st = s();
    return route()[(st.step + 1) % route().length];
  }

  function move() {
    const st = s();
    const before = locate(st.room);
    st.step = (st.step + 1) % route().length;
    st.room = route()[st.step];
    st.nextMoveAt = ctx.state.time.minutes + MOVE_EVERY;
    if (st.step === 0) {
      st.rechargeUntil = ctx.state.time.minutes + RECHARGE_MINUTES;
      st.nextMoveAt = st.rechargeUntil;
    }
    const now = locate(st.room);
    if (now.distance === 1) {
      ctx.cue('footsteps.heavy', { pan: PAN[now.dir] ?? 0 });
      const coming = nextRoom() === ctx.state.location && st.step !== 0;
      ctx.say(
        `Heavy footsteps, ${dirWord(now.dir)}. 001 is in the ${roomWord(st.room)}.` +
          (coming ? ' It is coming toward you.' : ''),
        { kind: 'alert' },
      );
    } else if (now.distance === 2) {
      ctx.cue('footsteps.far', { pan: PAN[now.dir] ?? 0 });
      if (before.distance !== 2) ctx.say(`Distant, heavy footsteps, somewhere ${dirWord(now.dir)}.`, { kind: 'alert' });
    } else if (before.distance <= 1 && now.distance > 1) {
      ctx.say('The footsteps move away.', { kind: 'alert' });
    }
    if (st.step === 0 && now.distance <= 1) {
      ctx.say('The footsteps stop. A low whine, rising: 001 has docked to recharge.', { kind: 'alert' });
    }
  }

  function tick() {
    const st = s();
    if (!st.active || ctx.state.dialogue.active || ctx.state.gameOver) return;
    const now = ctx.state.time.minutes;
    if (now >= st.alertDecayAt && st.alert > 0) {
      st.alert -= 1;
      st.alertDecayAt = now + ALERT_DECAY_EVERY;
    }
    // One minute before it wakes from recharging, warn anyone in the room.
    if (st.rechargeUntil - now === 1 && st.room === ctx.state.location) {
      ctx.cue('alarm');
      ctx.say('001’s charging whine is dropping. It is about to wake.', { kind: 'alert' });
    }
    if (now >= st.nextMoveAt) {
      // Waking up from recharging with the player in the room: it stays a
      // moment, awake, and the encounter begins.
      if (st.step === 0 && st.room === ctx.state.location && !st.wokeFacing) {
        st.wokeFacing = true;
        st.nextMoveAt = now + 1;
        return;
      }
      st.wokeFacing = false;
      move();
    }
  }
  ctx.onTick(tick);

  // Listen: where is it?
  ctx.onListen(() => {
    const st = s();
    if (!st.active) return;
    const where = locate(st.room);
    if (where.distance === 0) {
      ctx.say(recharging() ? '001 stands in this room, docked and whining softly as it charges.' : '001 is right here.');
    } else if (where.distance === 1) {
      ctx.cue('footsteps.heavy', { pan: PAN[where.dir] ?? 0 });
      ctx.say(`001 is close: in the ${roomWord(st.room)}, ${dirWord(where.dir)}.${recharging() ? ' It is recharging.' : ''}`);
    } else if (where.distance === 2) {
      ctx.say(`You hear 001 somewhere ${dirWord(where.dir)}, two rooms away.${recharging() ? ' It has stopped moving.' : ''}`);
    } else {
      ctx.say('You cannot hear 001 from here.');
    }
  });

  // ---- effects --------------------------------------------------------------
  effects.register('stalkerStart', (v) => {
    const st = s();
    const i = route().indexOf(v.room);
    Object.assign(st, {
      active: true,
      step: i < 0 ? 0 : i,
      room: v.room,
      nextMoveAt: ctx.state.time.minutes + MOVE_EVERY,
      rechargeUntil: 0,
      alert: 0,
      alertDecayAt: ctx.state.time.minutes + ALERT_DECAY_EVERY,
    });
  });

  effects.register('stalkerStop', () => {
    s().active = false;
  });

  // It loses interest and walks on to its next room.
  effects.register('stalkerMoveOn', () => {
    const st = s();
    st.step = (st.step + 1) % route().length;
    st.room = route()[st.step];
    st.nextMoveAt = ctx.state.time.minutes + MOVE_EVERY;
    if (st.step === 0) {
      st.rechargeUntil = ctx.state.time.minutes + RECHARGE_MINUTES;
      st.nextMoveAt = st.rechargeUntil;
    }
  });

  effects.register('stalkerAlert', (n) => {
    const st = s();
    st.alert += n;
    st.alertDecayAt = ctx.state.time.minutes + ALERT_DECAY_EVERY;
  });

  // Back out the way you came. 001 does not follow.
  effects.register('flee', (v, c) => {
    const to = c.state.previousRoom;
    if (to && to !== s().room) {
      c.cue('footsteps');
      c.state.location = to;
      c.bus.emit('room:entered', { room: rooms[to] });
      c.say(`You are back in the ${roomWord(to)}.`, { kind: 'system' });
    }
  });

  // Caught: hurt the first time, killed if already hurt.
  effects.register('caught', (v, c) => {
    if (c.state.flags.injured) {
      c.cue('stinger.death');
      c.state.gameOver = {
        title: 'You did not get away',
        text: 'The hand that was built to hold a cup without breaking it closes around you, and does not let go. The last thing you hear is its heartbeat: three short, one long.',
      };
      c.say(c.state.gameOver.text, { kind: 'alert' });
      return;
    }
    c.state.flags.injured = true;
    c.cue('hit');
    c.say('You are hurt. If it catches you again before you are treated, you will not survive. The medical ward has supplies.', { kind: 'alert' });
    effects.apply({ stalkerMoveOn: true }, c);
  });

  return { state: s, recharging, locate };
}
