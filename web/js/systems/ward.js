// Emily's life support.
//
// Two numbers, both 0..100, change as in-game time passes (never real
// time, so reading speed never matters):
//   power      the energy feeding her capsule or the ward. Drains steadily.
//              Power cells top it up.
//   stability  how stable Emily is. Drains slowly; much faster if power
//              runs out. Checking on her in person restores it.
// If stability reaches 0, Emily dies. That is permanent and carries on
// through the story.
//
// Warnings are broadcast on the facility radio, so they reach the player
// wherever they are, at 50, 25 and 10 percent, and always before anything
// irreversible happens. Each warning is part of the action's text, so a
// screen reader reads it in order.

const POWER_DRAIN = 1; // per in-game minute
const STABILITY_DRAIN = 0.6;
const STABILITY_DRAIN_UNPOWERED = 4;
const THRESHOLDS = [50, 25, 10];

export const WARD_DEFAULTS = {
  active: false,
  location: 'capsule', // 'capsule' (in the lab) or 'ward'
  power: 0,
  stability: 0,
  emilyAlive: true,
  warned: {},
};

export function installWard(ctx) {
  const { effects } = ctx;
  const ward = () => {
    if (!ctx.state.ward) ctx.state.ward = structuredCloneSafe(WARD_DEFAULTS);
    return ctx.state.ward;
  };

  function describeStability(v) {
    if (v > 75) return 'stable';
    if (v > 50) return 'steady, but should be checked soon';
    if (v > 25) return 'weakening';
    if (v > 10) return 'in danger';
    return 'critical';
  }

  function report() {
    const w = ward();
    if (!w.emilyAlive) return 'The monitor shows a flat line. Emily is gone.';
    if (ctx.state.flags.emily_awake) return 'Emily is awake, resting in the medical ward. Her monitor no longer needs watching.';
    const where = w.location === 'ward' ? 'the medical ward' : 'her capsule in the preservation lab';
    return `Emily’s monitor, from ${where}: power ${Math.round(w.power)} percent. Her condition: ${describeStability(w.stability)}, ${Math.round(w.stability)} percent.`;
  }

  function warn(kind, level, text) {
    const w = ward();
    const key = `${kind}${level}`;
    if (w.warned[key]) return;
    w.warned[key] = true;
    // Only the loud alarms (25 percent and below) go out on the facility
    // channel, where Daniel can hear them. The 50 percent notice is a quiet
    // chirp on the player's own radio.
    if (level <= 25) ctx.state.flags.ward_alarm_heard = true;
    ctx.cue(level <= 10 ? 'alarm.critical' : level <= 25 ? 'alarm' : 'monitor');
    ctx.say(text, { kind: 'alert' });
  }

  // Re-arm warnings once a value has been restored above them.
  function rearm(kind, value) {
    const w = ward();
    for (const t of THRESHOLDS) if (value > t) delete w.warned[`${kind}${t}`];
    if (kind === 'power' && value > 0) delete w.warned.power0;
  }

  function tick() {
    const w = ward();
    if (!w.active || !w.emilyAlive) return;

    const flags = ctx.state.flags;
    // Wired into Sublevel 2's own supply: her power no longer runs down.
    if (!flags.ward_mains) w.power = Math.max(0, w.power - POWER_DRAIN);
    // She declines more slowly once she has been looked after a few times,
    // and much more slowly while Daniel watches over her from the ward systems.
    let drain = w.power > 0 ? STABILITY_DRAIN : STABILITY_DRAIN_UNPOWERED;
    if (w.power > 0 && (w.checks || 0) >= 3) drain *= 0.6;
    if (w.power > 0 && flags.daniel_watching) drain *= 0.35;
    w.stability = Math.max(0, w.stability - drain);

    // Every warning ends by saying exactly what to do, and where.
    const fixStability = w.location === 'ward'
      ? ' Go to the medical ward and choose Check on Emily.'
      : ' She needs the medical ward: power its door, then wheel her capsule there.';
    const fixPower = w.location === 'ward'
      ? ' Put a power cell in the medical ward\u2019s power bay.'
      : ' Put a power cell in her capsule, in the preservation lab.';

    for (const t of THRESHOLDS) {
      if (w.power <= t && w.power > 0) {
        warn('power', t, t <= 10
          ? `Radio alarm: Emily’s power is almost gone, ${Math.round(w.power)} percent. Find a power cell now.${fixPower}`
          : t <= 25
            ? `Radio alarm: Emily’s power is at ${Math.round(w.power)} percent.${fixPower}`
            : `Your radio chirps quietly: Emily’s power is at ${Math.round(w.power)} percent.${fixPower}`);
      }
      if (w.stability <= t) {
        warn('stab', t, t <= 10
          ? `Radio alarm, urgent: Emily is critical. Get to her now, or she will die.${fixStability}`
          : t <= 25
            ? `Radio alarm: Emily’s condition is getting worse. She needs you to check on her.${fixStability}`
            : `Your radio chirps quietly: Emily’s condition is slipping. Check on her when you can.${fixStability}`);
      }
    }
    if (w.power === 0) warn('power', 0, `Radio alarm: Emily’s power has run out. Her life support is failing.${fixPower}`);

    if (w.stability <= 0) {
      w.emilyAlive = false;
      w.active = false;
      ctx.state.flags.emily_dead = true;
      ctx.cue('flatline');
      ctx.say('Your radio gives one long, unbroken tone. Then nothing. Emily’s monitor has flatlined.', { kind: 'alert' });
    }
  }

  ctx.onTick(tick);

  // ---- effects used by content -------------------------------------------
  // { wardStart: { power, stability } } begins the clock (capsule found).
  effects.register('wardStart', (v) => {
    const w = ward();
    if (w.active || !w.emilyAlive) return;
    Object.assign(w, { active: true, location: 'capsule', power: v.power, stability: v.stability });
  });

  // Emily's capsule is plugged into the ward: power comes from the ward now.
  effects.register('wardMoveIn', (v) => {
    const w = ward();
    if (!w.emilyAlive) return;
    w.location = 'ward';
    w.power = Math.max(w.power, v.power);
    rearm('power', w.power);
  });

  effects.register('wardAddPower', (amount, c) => {
    const w = ward();
    w.power = Math.min(100, w.power + amount);
    rearm('power', w.power);
    c.say(`Emily’s power is now ${Math.round(w.power)} percent.`, { kind: 'system' });
  });

  effects.register('wardStabilize', (amount, c) => {
    const w = ward();
    if (!w.emilyAlive) return;
    w.stability = Math.min(100, Math.max(w.stability, amount));
    if (amount >= 100) w.checks = (w.checks || 0) + 1;
    rearm('stab', w.stability);
    c.say(`Emily’s condition: ${describeStability(w.stability)}.`, { kind: 'system' });
  });

  // Emily is awake: the slow decline is over.
  effects.register('wardEnd', () => {
    const w = ward();
    w.active = false;
    ctx.state.flags.emily_awake = true;
  });

  effects.register('wardReport', (v, c) => c.say(report(), { kind: 'system' }));

  return { report, state: ward };
}

function structuredCloneSafe(v) {
  return JSON.parse(JSON.stringify(v));
}
