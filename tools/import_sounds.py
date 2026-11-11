#!/usr/bin/env python3
"""Turns CC0 recordings from OpenGameArt.org into the iPhone version's cue sounds, all levelled
to the same loudness. Usage: python3 tools/import_sounds.py SOURCE_DIR  (needs numpy and ffmpeg)

Packs (all CC0): Interface Sounds and Sci-Fi Sounds (Kenney), 100 CC0 SFX, 100 CC0 SFX #2 and
30 CC0 SFX loops (rubberduck), 202 More Sound Effects (OwlishMedia), Metal Interactions and
37 hits/punches (qubodup), 10 Book Page Flips (StarNinjas), Tape Recorder Opening and Closing
(Spring Spring), Beep Tone Sound SFX (qubodup), Metal footsteps on concrete (Thimras),
Alarm (EZduzziteh)."""
import os, subprocess, sys, glob
import numpy as np

SR = 44100
SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(__file__), "..", "web", "audio")


def find(name):
    hits = sorted(glob.glob(os.path.join(SRC, "**", name + ".*"), recursive=True))
    hits = [h for h in hits if h.rsplit(".", 1)[1].lower() in ("ogg", "wav", "mp3", "flac")]
    assert hits, name
    return hits[0]


def load(name, rate=1.0):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", find(name), "-ac", "1", "-ar", str(int(SR / rate)), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)   # read at SR/rate, played at SR: slower and lower when rate < 1


def trim(x, thresh=0.01, tail=0.1):
    e = np.abs(x) > thresh * np.max(np.abs(x))
    a = max(np.argmax(e) - int(0.005 * SR), 0)
    b = min(len(x) - np.argmax(e[::-1]) + int(tail * SR), len(x))
    y = x[a:b].copy()
    n = min(int(0.03 * SR), len(y) // 4)
    y[-n:] *= np.linspace(1, 0, n)
    return y


def seq(parts, length=None):
    """[(seconds, samples, gain)] mixed together"""
    end = max(int(t * SR) + len(s) for t, s, _ in parts)
    out = np.zeros(max(end, int((length or 0) * SR)))
    for t, s, g in parts:
        i = int(t * SR)
        out[i:i + len(s)] += s * g
    return out


def lowpass(x, f):
    # one-pole low-pass, enough to make something sound far away
    a = np.exp(-2 * np.pi * f / SR)
    y = np.zeros_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def hold(x, seconds):
    """a sustained tone from a short one: loop its steady middle"""
    mid = x[int(len(x) * 0.3):int(len(x) * 0.7)]
    n = int(seconds * SR)
    reps = np.tile(mid, n // len(mid) + 2)[:n]
    f = min(int(0.01 * SR), n // 4)
    reps[:f] *= np.linspace(0, 1, f); reps[-f:] *= np.linspace(1, 0, f)
    return reps


def loud_db(x):
    """loudness of the loud part: RMS over 50 ms windows, the top 30% of them"""
    w = 2205
    r = np.array([np.sqrt(np.mean(x[i:i + w] ** 2)) for i in range(0, max(len(x) - w, 1), w)])
    r = np.sort(r)[::-1][:max(1, int(len(r) * 0.3))]
    return 20 * np.log10(np.mean(r) + 1e-12)


def save(name, x, target_db):
    """levelled by measured loudness, not by peak, so a beep and a door sit at the same level"""
    x = x - np.mean(x)
    # aim for the target loudness; where peaks would clip, round them off (a soft limiter) and try again
    for _ in range(6):
        x = x * 10 ** ((target_db - loud_db(x)) / 20)
        if np.max(np.abs(x)) > 0.97:
            x = 0.97 * np.tanh(x / 0.97)
        if abs(loud_db(x) - target_db) < 0.5:
            break
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-codec:a", "libmp3lame", "-b:a", "128k",
                    os.path.join(OUT, name + ".mp3")], input=x.astype(np.float32).tobytes(), check=True)
    print(name, f"{len(x) / SR:.2f}s", f"{loud_db(x):.1f} dB")


# loudness in the file; the app then plays cues about 6 dB lower (80% gain x 80% effects x 80% master)
UI, FULL, SOFT = -18.0, -15.5, -21.0

if __name__ == "__main__":
    save("sfx-ui-move", trim(load("tick_002")), UI)
    save("sfx-ui-select", trim(load("select_002")), UI)
    save("sfx-ui-back", trim(load("back_002")), UI)
    save("sfx-ui-error", trim(load("error_004")), UI)
    save("sfx-saved", trim(load("confirmation_001")), UI)
    save("sfx-objective", trim(load("question_002")), FULL)
    save("sfx-objective-done", trim(load("confirmation_003")), FULL)
    save("sfx-trust-up", trim(load("maximize_006")), FULL)        # rises
    save("sfx-trust-down", trim(load("minimize_006")), FULL)      # falls
    save("sfx-secret", trim(load("bell_01")), FULL)
    save("sfx-pickup", trim(load("sfx100v2_items_01")), FULL)
    save("sfx-document", trim(load("book_flip.3")), FULL)
    save("sfx-tape", trim(load("tape_recorder_opening")), FULL)
    save("sfx-door-glass", trim(load("doorOpen_001")), FULL)
    save("sfx-door-heavy", trim(load("metal_swing1")), FULL)
    save("sfx-tarp", trim(load("Cloth_03")), FULL)
    save("sfx-hit", trim(load("hit05")), FULL)
    save("sfx-listen", trim(load("pluck_001")), SOFT)

    steps = [trim(load(f"sfx100v2_footstep_0{i}")) for i in (1, 2)]
    save("sfx-footsteps", seq([(i * 0.32, steps[i % 2], 1) for i in range(4)]), FULL)
    heavy = [trim(load(f"metal_steps_0{i}", rate=0.8)) for i in (1, 2, 3)]
    save("sfx-footsteps-heavy", seq([(i * 0.55, heavy[i], 1) for i in range(3)]), FULL)
    far = [lowpass(trim(load(f"metal_steps_0{i}", rate=0.8)), 500) for i in (4, 5, 6)]
    save("sfx-footsteps-far", seq([(i * 0.6, far[i], 1) for i in range(3)]), SOFT)

    roll = trim(load("rolling"))
    save("sfx-cart", roll[:int(1.8 * SR)] * np.minimum(1, np.linspace(1.8, 0, int(1.8 * SR)) / 0.3)[:len(roll[:int(1.8 * SR)])], FULL)

    alarm = trim(load("alarm_2"))
    save("sfx-alarm", alarm, FULL)
    crit = trim(load("alarm_01"))
    save("sfx-alarm-critical", crit[:int(1.2 * SR)] * np.linspace(1, 0.6, len(crit[:int(1.2 * SR)])), FULL)

    # the signal and the heart monitor are built from one real recorded beep
    beep = trim(load("beep"), tail=0.02)
    save("sfx-signal", seq([(0.0, beep, 1), (0.22, beep, 1), (0.44, beep, 1), (0.75, hold(beep, 0.6), 1)]), FULL)
    save("sfx-monitor", seq([(0.0, beep, 1), (1.0, beep, 1)]), FULL)
    save("sfx-flatline", hold(beep, 3.0), FULL)
    # the game's own earlier recordings, brought to the same level
    for n in ["radio-static", "door", "car-door", "latch", "locked", "locker", "elevator", "stinger", "hit-soft", "thunder"]:
        save("sfx-" + n, trim(load("sfx-" + n)), FULL)
    save("sfx-card-accept", seq([(0.0, trim(load("metal_button_press1")), 0.8), (0.12, beep, 1)]), FULL)
