import Foundation

// The game's sound vocabulary and room ambience, ported from web/js/audio.

enum Bus { case sfx, ambience, music }

/// What the sound director needs from the device. The iPhone version uses AVAudioEngine.
protocol AudioOut: AnyObject {
    /// a recorded sound from the app bundle
    func playFile(_ name: String, gain: Double, pan: Double, lowpass: Double?, rate: Double, bus: Bus)
    /// a sound made in code; `key` caches it when the same sound comes back
    func playPCM(_ pcm: PCM, pan: Double, bus: Bus)
    /// replaces the room ambience (fading the old one out)
    func setAmbience(_ layers: [AmbienceLayer], fadeIn: Double, fadeOut: Double)
    func playMusic(_ name: String, loop: Bool, fade: Double, level: Double)
    func stopMusic(fade: Double)
    func applyVolumes(master: Double, effects: Double, ambience: Double, music: Double)
}

enum AmbienceLayer {
    case file(String, gain: Double, lowpass: Double?, pan: Double)
    case noise(key: String, filter: String, freq: Double, Q: Double, gain: Double, pan: Double)
    case tone(key: String, freq: Double, type: String, gain: Double)
}

// Recorded files (web/js/audio/library.js).
let cueSamples: [String: String] = [
    "door": "sfx-door", "car.door": "sfx-car-door", "locker": "sfx-locker", "latch": "sfx-latch", "locked": "sfx-locked",
    "elevator.open": "sfx-elevator", "radio.static": "sfx-radio-static", "radio.on": "sfx-radio-static",
    "chapter.end": "sfx-stinger", "stinger.death": "sfx-stinger", "stinger.soft": "sfx-hit-soft", "thunder": "sfx-thunder",
]
let startlingSamples: Set<String> = ["sfx-stinger", "sfx-locker", "sfx-car-door", "sfx-hit-soft", "sfx-thunder"]
let sampleFiles: [String: String] = [
    "amb-rain": "amb-rain", "amb-corridor": "amb-corridor", "amb-facility": "amb-facility", "amb-generator": "amb-generator",
    "amb-sublevel": "music-sublevel",
]

/// Synthesised cues (web/js/audio/cues.js). `soft` is the "reduce sudden loud sounds" factor.
func cueParts(_ name: String, pan p: Double?, soft: (Double) -> Double) -> [Synth.Part]? {
    typealias S = Synth
    switch name {
    case "ui.move": return [S.tone(1100, 0.03, gain: 0.05, pan: p)]
    case "ui.select": return [S.tone(660, 0.05, gain: 0.08), S.tone(990, 0.06, gain: 0.08, at: 0.05)]
    case "ui.back": return [S.tone(700, 0.12, gain: 0.07, slideTo: 440)]
    case "ui.error": return [S.tone(220, 0.08, gain: 0.04, type: "square", lowpass: 900), S.tone(196, 0.12, gain: 0.04, type: "square", lowpass: 900, at: 0.1)]
    case "saved": return [S.tone(784, 0.07, gain: 0.06), S.tone(1047, 0.1, gain: 0.06, at: 0.08)]
    case "door": return [S.noise(0.3, freq: 500, gain: 0.12, pan: p), S.tone(80, 0.15, gain: 0.15, at: 0.22, pan: p)]
    case "door.glass": return [S.noise(0.35, freq: 2500, filter: "highpass", gain: 0.05, pan: p), S.tone(1250, 0.25, gain: 0.02, pan: p), S.tone(90, 0.12, gain: 0.1, at: 0.3, pan: p)]
    case "car.door": return [S.noise(0.15, freq: 350, gain: 0.2), S.tone(60, 0.18, gain: 0.25, at: 0.05)]
    case "footsteps": return (0..<4).map { S.noise(0.08, freq: 600, gain: 0.12, at: Double($0) * 0.32, pan: p) }
    case "locked": return [S.noise(0.06, freq: 900, filter: "bandpass", Q: 3, gain: 0.15, pan: p), S.noise(0.06, freq: 800, filter: "bandpass", Q: 3, gain: 0.15, at: 0.12, pan: p), S.tone(110, 0.1, gain: 0.1, at: 0.12, pan: p)]
    case "latch": return [S.noise(0.05, freq: 3000, filter: "highpass", gain: 0.1, pan: p), S.tone(300, 0.05, gain: 0.06, at: 0.04, pan: p)]
    case "pickup": return [S.tone(520, 0.14, gain: 0.08, slideTo: 780)]
    case "document": return [S.noise(0.12, freq: 3200, filter: "bandpass", Q: 1.5, gain: 0.06), S.noise(0.1, freq: 2600, filter: "bandpass", Q: 1.5, gain: 0.05, at: 0.15)]
    case "locker": return [S.noise(0.6, freq: 1200, filter: "bandpass", sweepTo: 2600, Q: 6, gain: soft(0.12), pan: p), S.tone(70, 0.2, gain: soft(0.2), at: 0.55, pan: p)]
    case "tape": return [S.tone(1900, 0.5, gain: 0.015, pan: p), S.noise(0.6, freq: 400, gain: 0.04, pan: p)]
    case "card.accept": return [S.tone(1320, 0.08, gain: 0.07, pan: p), S.tone(1760, 0.14, gain: 0.07, at: 0.09, pan: p)]
    case "elevator.open": return [S.tone(523, 0.6, gain: 0.05), S.noise(0.9, freq: 300, gain: 0.06, at: 0.2)]
    case "listen": return [S.tone(220, 0.4, gain: 0.02, attack: 0.15)]
    case "power.on": return [S.tone(40, 1.8, gain: soft(0.18), type: "sawtooth", slideTo: 120, lowpass: 400, attack: 0.4), S.tone(55, 0.3, gain: soft(0.3), at: 1.7)]
    case "deep.machine": return [S.tone(45, 1.2, gain: 0.12, type: "sawtooth", slideTo: 52, lowpass: 200, attack: 0.3), S.tone(45, 0.9, gain: 0.1, type: "sawtooth", slideTo: 40, lowpass: 200, attack: 0.3, at: 1.6)]
    case "radio.on": return [S.tone(1400, 0.06, gain: 0.05), S.noise(0.25, freq: 1800, filter: "bandpass", gain: 0.05, at: 0.05)]
    case "radio.static": return [S.noise(0.35, freq: 1800, filter: "bandpass", Q: 1, gain: 0.06), S.tone(1450, 0.06, gain: 0.035, at: 0.35)]
    case "speaker.hum": return [S.noise(0.15, freq: 900, filter: "bandpass", gain: soft(0.12)), S.tone(60, 0.8, gain: soft(0.08), attack: 0.1), S.tone(120, 0.8, gain: soft(0.04), attack: 0.1)]
    case "signal": return (0..<3).map { S.tone(1000, 0.12, gain: 0.05, at: Double($0) * 0.22) } + [S.tone(1000, 0.6, gain: 0.05, at: 0.75)]
    case "objective": return [S.tone(523, 0.12, gain: 0.05), S.tone(659, 0.18, gain: 0.05, at: 0.12)]
    case "objective.done": return [S.tone(523, 0.1, gain: 0.05), S.tone(659, 0.1, gain: 0.05, at: 0.1), S.tone(784, 0.25, gain: 0.05, at: 0.2)]
    case "trust.up": return [S.tone(440, 0.25, gain: 0.04, attack: 0.05), S.tone(554, 0.35, gain: 0.04, attack: 0.05, at: 0.18)]
    case "trust.down": return [S.tone(330, 0.3, gain: 0.045, attack: 0.05), S.tone(311, 0.45, gain: 0.045, attack: 0.05, at: 0.2)]
    case "secret": return [784.0, 988, 1175].enumerated().map { S.tone($0.element, 0.15, gain: 0.04, at: Double($0.offset) * 0.09) }
    case "door.heavy": return [S.noise(0.6, freq: 300, gain: 0.12, attack: 0.1, pan: p), S.tone(55, 0.3, gain: 0.18, at: 0.5, pan: p)]
    case "cart": return (0..<6).map { S.noise(0.25, freq: 700, filter: "bandpass", Q: 2, gain: 0.05, at: Double($0) * 0.3) }
    case "tarp": return [S.noise(0.5, freq: 1500, filter: "bandpass", Q: 0.8, gain: 0.05, attack: 0.1, pan: p)]
    case "monitor": return [S.tone(1000, 0.08, gain: 0.04, pan: p), S.tone(1000, 0.08, gain: 0.04, at: 1, pan: p)]
    case "alarm": return [880.0, 660, 880, 660].enumerated().map { S.tone($0.element, 0.15, gain: 0.06, type: "triangle", at: Double($0.offset) * 0.18) }
    case "alarm.critical": return (0..<6).map { S.tone(1200, 0.08, gain: soft(0.05), type: "square", lowpass: 2500, at: Double($0) * 0.12) }
    case "flatline": return [S.tone(1000, 3, gain: 0.05, attack: 0.01)]
    case "footsteps.heavy":
        return (0..<3).flatMap { i -> [Synth.Part] in
            let t = Double(i) * 0.55
            return [S.tone(55, 0.18, gain: soft(0.22), at: t, pan: p), S.noise(0.12, freq: 400, gain: soft(0.1), at: t, pan: p),
                    S.tone(420, 0.2, gain: 0.015, type: "sawtooth", slideTo: 380, lowpass: 900, at: t + 0.1, pan: p)]
        }
    case "footsteps.far": return (0..<3).map { S.tone(50, 0.15, gain: 0.07, lowpass: 200, at: Double($0) * 0.6, pan: p) }
    case "hit": return [S.noise(0.25, freq: 900, gain: soft(0.3)), S.tone(70, 0.4, gain: soft(0.3))]
    case "chapter.end": return [S.tone(55, 3, gain: 0.12, type: "sawtooth", lowpass: 300, attack: 0.8)] + [392.0, 349, 311].enumerated().map { S.tone($0.element, 0.7, gain: 0.04, attack: 0.1, at: 0.6 + Double($0.offset) * 0.6) }
    default: return nil
    }
}

/* ---------- room ambience (web/js/audio/soundscapes.js) ---------- */

/// Something that happens now and then in a room, every `min`..`max` seconds.
struct Periodic {
    let min: Double, max: Double
    let fire: (SoundDirector) -> Void
}
struct Soundscape { var layers: [AmbienceLayer] = []; var events: [Periodic] = [] }

private func rnd(_ a: Double, _ b: Double) -> Double { Double.random(in: a..<b) }

/// A recorded sound somewhere far off: random side, muffled, quiet.
private func distant(_ names: [String], _ min: Double, _ max: Double, _ gain: Double = 0.25) -> Periodic {
    Periodic(min: min, max: max) { d in
        d.oneShot(names.randomElement()!, gain: gain, lowpass: 900 + rnd(0, 800), pan: rnd(-0.8, 0.8), rate: 0.85 + rnd(0, 0.2))
    }
}
private func every(_ min: Double, _ max: Double, _ parts: @escaping () -> [Synth.Part]) -> Periodic {
    Periodic(min: min, max: max) { d in d.ambientParts(parts()) }
}
private func noiseLayer(_ filter: String = "lowpass", _ freq: Double, Q: Double = 0.7, gain: Double, pan: Double = 0) -> AmbienceLayer {
    .noise(key: "\(filter)\(freq)\(Q)", filter: filter, freq: freq, Q: Q, gain: gain, pan: pan)
}
private func noiseLayer(_ freq: Double, gain: Double, pan: Double = 0) -> AmbienceLayer { noiseLayer("lowpass", freq, gain: gain, pan: pan) }
private func toneLayer(_ freq: Double, _ type: String = "sine", gain: Double) -> AmbienceLayer {
    .tone(key: "\(type)\(freq)", freq: freq, type: type, gain: gain)
}
private func file(_ name: String, gain: Double, lowpass: Double? = nil, pan: Double = 0) -> AmbienceLayer {
    .file(sampleFiles[name] ?? name, gain: gain, lowpass: lowpass, pan: pan)
}
private func powerHum(_ gain: Double) -> AmbienceLayer { file("amb-generator", gain: gain, lowpass: 900) }

func soundscape(_ id: String, powered: Bool, state: GameState?) -> Soundscape? {
    typealias S = Synth
    let w = state?.ward
    switch id {
    case "car_rain":
        return Soundscape(layers: [file("amb-rain", gain: 0.7, lowpass: 1400)],
                          events: [every(6, 14) { [S.tone(1000, 0.12, gain: 0.008, pan: 0.6)] }])
    case "outdoor_rain":
        return Soundscape(layers: [file("amb-rain", gain: 0.6)],
                          events: [every(9, 20) { [S.tone(38, 2.5, gain: 0.05, type: "sawtooth", lowpass: 120, attack: 0.6)] }, distant(["sfx-thunder"], 25, 50, 0.35)])
    case "lobby":
        var l = [file("amb-facility", gain: 0.35), file("amb-rain", gain: 0.12, lowpass: 700)]
        if powered { l.append(powerHum(0.15)) }
        return Soundscape(layers: l, events: [every(2, 5) { [S.tone(1800, 0.05, gain: 0.02, slideTo: 1100, pan: -0.6)] }])
    case "office":
        var l = [file("amb-facility", gain: 0.25, lowpass: 2000)]
        if powered { l += [powerHum(0.2), noiseLayer("highpass", 6000, gain: 0.006)] }
        return Soundscape(layers: l, events: [distant(["sfx-creak", "sfx-crack"], 14, 30, 0.2)])
    case "corridor":
        var l = [file("amb-corridor", gain: 0.45)]
        if powered { l.append(powerHum(0.12)) }
        return Soundscape(layers: l, events: [distant(["sfx-creak", "sfx-far-clank"], 12, 26, 0.22),
                                              every(8, 16) { [S.tone(90, 0.7, gain: 0.03, slideTo: 70, attack: 0.2, pan: rnd(-1, 1))] }])
    case "sublevel":
        return Soundscape(layers: [file("amb-sublevel", gain: 0.3), file("amb-generator", gain: 0.08, lowpass: 500)],
                          events: [distant(["sfx-far-metal", "sfx-far-clank", "sfx-crack"], 9, 22, 0.25)])
    case "cold_lab":
        var e: [Periodic] = []
        if w?.emilyAlive == true && w?.location == "capsule" { e.append(every(1, 1.1) { [S.tone(1000, 0.07, gain: 0.025, pan: 0.6)] }) }
        return Soundscape(layers: [noiseLayer("highpass", 3000, gain: 0.02), file("amb-corridor", gain: 0.25, lowpass: 1200)], events: e)
    case "ward":
        var e: [Periodic] = []
        if w?.emilyAlive == true && w?.location == "ward" {
            e.append(every(1, 1.1) { [S.tone(1000, 0.07, gain: 0.025, pan: 0.6)] })
            e.append(every(3.5, 3.6) { [S.noise(1.2, freq: 400, gain: 0.03, attack: 0.5, pan: 0.6)] })
        }
        return Soundscape(layers: [powerHum(0.15)], events: e)
    case "transfer":
        return Soundscape(layers: [powerHum(0.1)], events: [distant(["sfx-chant"], 30, 60, 0.06),
                                                           every(3, 9) { [S.noise(0.15, freq: 3000, filter: "bandpass", Q: 4, gain: 0.03, pan: rnd(-1, 1))] }])
    case "storage":
        return Soundscape(layers: [noiseLayer(200, gain: 0.025)], events: [distant(["sfx-far-clank", "sfx-creak"], 15, 30, 0.2),
                                                                       every(4, 8) { [S.tone(2400, 0.02, gain: 0.01, pan: 0.6)] }])
    case "b2":
        return Soundscape(layers: [powerHum(0.3), file("amb-sublevel", gain: 0.18, lowpass: 900), noiseLayer(350, gain: 0.03)],
                          events: [distant(["sfx-far-metal", "sfx-far-clank"], 15, 30, 0.2)])
    case "b2_quiet": return Soundscape(layers: [powerHum(0.1), toneLayer(120, gain: 0.004)])
    case "b2_screens":
        return Soundscape(layers: [powerHum(0.15), noiseLayer("highpass", 5000, gain: 0.008)],
                          events: [every(2, 4) { [S.tone(3000, 0.01, gain: 0.006, pan: rnd(-0.5, 0.5))] }])
    case "containment":
        return Soundscape(layers: [powerHum(0.15)], events: [every(1.4, 1.45) { [S.tone(700, 0.08, gain: 0.025)] },
                                                            every(4, 4.1) { [S.noise(1.6, freq: 500, gain: 0.04, attack: 0.7)] }])
    case "stairwell":
        return Soundscape(layers: [file("amb-corridor", gain: 0.3, lowpass: 800)],
                          events: [distant(["sfx-creak", "sfx-crack", "sfx-far-clank"], 10, 22, 0.25),
                                   every(5, 9) { [S.tone(420, 1.2, gain: 0.012, type: "sawtooth", slideTo: 380, lowpass: 700, attack: 0.3)] }])
    case "isolation":
        return Soundscape(layers: [noiseLayer(120, gain: 0.02), toneLayer(210, "sawtooth", gain: 0.004)],
                          events: [every(6, 6.1) { [0.0, 0.25, 0.5].map { S.tone(1000, 0.1, gain: 0.012, at: $0) } + [S.tone(1000, 0.5, gain: 0.012, at: 0.85)] }])
    case "apartment": return Soundscape(layers: [file("amb-rain", gain: 0.25, lowpass: 900), toneLayer(100, gain: 0.006)])
    case "station":
        return Soundscape(layers: [toneLayer(120, gain: 0.006), noiseLayer(600, gain: 0.015)],
                          events: [every(7, 15) { [0.0, 0.4].map { S.tone(1400, 0.25, gain: 0.01, at: $0, pan: 0.7) } }])
    case "cell":
        return Soundscape(layers: [noiseLayer(150, gain: 0.02)], events: [every(2.5, 4) { [S.tone(1500, 0.05, gain: 0.015, slideTo: 1000, pan: 0.5)] }])
    case "street":
        return Soundscape(layers: [file("amb-rain", gain: 0.45)],
                          events: [distant(["sfx-thunder"], 30, 60, 0.25),
                                   every(3, 7) { [S.noise(1.5, freq: 700, sweepTo: 300, gain: 0.03, attack: 0.5, pan: rnd(-1, 1))] }])
    case "office_city": return Soundscape(layers: [noiseLayer(90, gain: 0.03), file("amb-rain", gain: 0.1, lowpass: 600)])
    case "cafe":
        return Soundscape(layers: [noiseLayer("bandpass", 900, Q: 0.6, gain: 0.03)],
                          events: [every(3, 8) { [S.tone(2200, 0.04, gain: 0.01, pan: rnd(-0.5, 0.5))] },
                                   every(15, 25) { [S.noise(2, freq: 3000, filter: "highpass", gain: 0.02, attack: 0.3, pan: -0.6)] }])
    case "diner": return Soundscape(layers: [noiseLayer("bandpass", 3500, Q: 0.8, gain: 0.012, pan: 0.4), noiseLayer("bandpass", 800, Q: 0.6, gain: 0.02)])
    case "courtroom":
        return Soundscape(layers: [noiseLayer(400, gain: 0.02), noiseLayer("highpass", 5000, gain: 0.004)],
                          events: [every(6, 14) { [S.noise(0.2, freq: 1200, filter: "bandpass", gain: 0.02, pan: 0.6)] }])
    case "hallway":
        return Soundscape(layers: [noiseLayer(700, gain: 0.015)], events: [every(1.5, 4) { [S.tone(2600, 0.03, gain: 0.008, pan: rnd(-1, 1))] }])
    case "evidence":
        return Soundscape(layers: [toneLayer(120, gain: 0.006), noiseLayer("highpass", 4000, gain: 0.006)],
                          events: [every(5, 5.1) { [S.noise(1.4, freq: 600, gain: 0.015, attack: 0.6)] }])
    case "switching":
        return Soundscape(layers: [powerHum(0.2)],
                          events: [distant(["sfx-chant"], 12, 25, 0.1),
                                   every(0.08, 0.3) { [S.noise(0.02, freq: 3000, filter: "highpass", gain: 0.012, pan: rnd(-1, 1))] },
                                   every(6, 6.1) { [S.noise(1.4, freq: 600, gain: 0.02, attack: 0.6)] }])
    case "elevator": return Soundscape(layers: [powerHum(0.3), noiseLayer(400, gain: 0.03)])
    default: return nil
    }
}

/* ---------- music (web/js/audio/music.js) ---------- */

let explorationMusicLevel = 0.5

func pickMusic(_ s: GameState, room: JSON) -> String? {
    let f = s.flags, id = room["id"]?.string ?? "", zone = room["zone"]?.string
    if f.contains("p2c5_started") && !f.contains("voss_gone") && (zone == "sublevel" || zone == "sublevel2") { return "music-voss" }
    if s.stalker.active && zone == "sublevel" { return "music-hunt" }
    if ["patrol_car", "front_gate"].contains(id) { return "music-outside" }
    if ["reception", "security_office", "main_corridor", "robotics_office", "elevator_car"].contains(id) { return "music-surface" }
    if ["stairwell", "isolation"].contains(id) { return "music-isolation" }
    if ["apartment", "street", "cafe", "diner", "emily_place", "okafor_office"].contains(id) { return "music-city" }
    if ["holding_cell", "interview_room", "county_jail"].contains(id) { return "music-sad" }
    if ["courtroom", "court_hallway", "evidence_room"].contains(id) { return "music-trial" }
    if zone == "sublevel" { return "music-sublevel1" }
    if zone == "sublevel2" { return "music-sublevel2" }
    return nil
}

func endMusic(_ ended: Ended?) -> String {
    if ["romance", "found_you", "clean_line"].contains(ended?.ending ?? "") { return "music-love" }
    if ["lost", "her_voice", "scorched_wire"].contains(ended?.ending ?? "") { return "music-sad" }
    return "music-descent"
}

/* ---------- the director: cues, ambience and music for the app ---------- */

final class SoundDirector {
    weak var out: AudioOut?
    var reduceStartles: () -> Bool = { false }
    var mono: () -> Bool = { false }
    private var currentKey: String? = nil
    private var timers: [Task<Void, Never>] = []
    private(set) var musicNow: String? = nil
    private var cache: [String: PCM] = [:]
    private var panned: Set<String> = []

    private func pan(_ p: Double?) -> Double { mono() ? 0 : Swift.max(-1, Swift.min(1, p ?? 0)) }

    /// How loud each made-in-code cue peaks, so it sits level with the recorded sounds.
    /// (The web version's numbers were tiny; on iPhone they came out far too quiet.)
    static func targetPeak(_ name: String) -> Float {
        if name.hasPrefix("ui.") || name == "saved" { return 0.35 }
        if name == "footsteps.far" || name == "cart" || name == "listen" { return 0.55 }
        return 0.8
    }
    private var loudness: [String: Float] = [:]

    /// Plays a named cue: the recorded file if there is one, otherwise the synthesised sound.
    func cue(_ name: String, pan p: Double? = nil, gain: Double? = nil) {
        if let sample = cueSamples[name] {
            var g = gain ?? 0.8
            if startlingSamples.contains(sample) && reduceStartles() { g *= 0.35 }
            out?.playFile(sample, gain: g, pan: pan(p), lowpass: nil, rate: 1, bus: .sfx)
            return
        }
        let soft = reduceStartles()
        let key = "\(name)|\(soft)"
        if cache[key] == nil {
            // the recipe is asked with a marker pan, to learn whether this cue follows a direction at all
            guard let parts = cueParts(name, pan: 1, soft: { soft ? $0 * 0.4 : $0 }) else { return }
            // one gain per cue, from its full-strength version, so "reduce sudden loud sounds" still lowers it
            if loudness[name] == nil, let full = cueParts(name, pan: 1, soft: { $0 }) {
                let peak = Synth.render(full.map { var q = $0; q.pan = nil; return q }).peak
                loudness[name] = peak > 0 ? Swift.min(SoundDirector.targetPeak(name) / peak, 30) : 1
            }
            cache[key] = Synth.render(parts.map { var q = $0; q.pan = nil; return q }).scaled(loudness[name] ?? 1)
            if parts.contains(where: { $0.pan != nil }) { panned.insert(name) }
        }
        out?.playPCM(cache[key]!, pan: panned.contains(name) ? pan(p) : 0, bus: .sfx)
    }

    func oneShot(_ name: String, gain: Double, lowpass: Double?, pan p: Double, rate: Double) {
        out?.playFile(name, gain: gain, pan: pan(p), lowpass: lowpass, rate: rate, bus: .ambience)
    }

    func ambientParts(_ parts: [Synth.Part]) {
        let p = parts.first?.pan
        // occasional sounds in a room: levelled to a steady, audible peak
        let pcm = Synth.render(parts.map { var q = $0; q.pan = nil; return q })
        let peak = pcm.peak
        out?.playPCM(peak > 0 ? pcm.scaled(Swift.min(0.5 / peak, 20)) : pcm, pan: pan(p), bus: .ambience)
    }

    /// Changes the room ambience when the room (or something it depends on) changes.
    func setSoundscape(_ id: String?, powered: Bool, key: String, state: GameState?) {
        let fullKey = "\(id ?? "-")|\(key)"
        if fullKey == currentKey { return }
        currentKey = fullKey
        timers.forEach { $0.cancel() }
        timers = []
        guard let id, let scene = soundscape(id, powered: powered, state: state) else {
            out?.setAmbience([], fadeIn: 1.5, fadeOut: 1.2)
            return
        }
        out?.setAmbience(scene.layers.map { layer in
            if mono(), case let .file(n, g, l, _) = layer { return .file(n, gain: g, lowpass: l, pan: 0) }
            return layer
        }, fadeIn: 1.5, fadeOut: 1.2)
        for e in scene.events {
            timers.append(Task { @MainActor [weak self] in
                while !Task.isCancelled {
                    let wait = e.min + Double.random(in: 0..<Swift.max(e.max - e.min, 0.001))
                    try? await Task.sleep(nanoseconds: UInt64(wait * 1_000_000_000))
                    if Task.isCancelled { break }
                    guard let self else { break }
                    e.fire(self)
                }
            })
        }
    }
    func stopAmbience() { setSoundscape(nil, powered: false, key: "", state: nil) }

    func playMusic(_ name: String, loop: Bool = true, fade: Double = 2, level: Double = 1) {
        if musicNow == name { return }
        musicNow = name
        out?.playMusic(name, loop: loop, fade: fade, level: level)
    }
    func stopMusic(fade: Double = 1.5) {
        guard musicNow != nil else { return }
        musicNow = nil
        out?.stopMusic(fade: fade)
    }
}
