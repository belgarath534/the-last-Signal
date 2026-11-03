import Foundation

/// Mono audio samples.
final class PCM {
    let samples: [Float]
    let rate: Double
    init(_ samples: [Float], rate: Double = Synth.SR) { self.samples = samples; self.rate = rate }
    var duration: Double { Double(samples.count) / rate }
}

/// Sound made in code, matching the Web Audio graphs of web/js/audio/audio-engine.js.
enum Synth {
    static let SR = 44100.0

    struct Biquad {
        enum Kind: String { case lowpass, highpass, bandpass }
        var b0 = 1.0, b1 = 0.0, b2 = 0.0, a1 = 0.0, a2 = 0.0
        var x1 = 0.0, x2 = 0.0, y1 = 0.0, y2 = 0.0
        let kind: Kind
        init(_ kind: Kind, _ freq: Double, q: Double) { self.kind = kind; set(freq, q: q) }
        mutating func set(_ freq: Double, q: Double) {
            let f = Swift.min(Swift.max(freq, 10), SR * 0.45)
            let Q = Swift.max(q, 0.0001)
            let w = 2 * Double.pi * f / SR, c = cos(w), alpha = sin(w) / (2 * Q)
            let a0 = 1 + alpha
            switch kind {
            case .lowpass: b0 = (1 - c) / 2; b1 = 1 - c; b2 = (1 - c) / 2
            case .highpass: b0 = (1 + c) / 2; b1 = -(1 + c); b2 = (1 + c) / 2
            case .bandpass: b0 = alpha; b1 = 0; b2 = -alpha
            }
            b0 /= a0; b1 /= a0; b2 /= a0; a1 = -2 * c / a0; a2 = (1 - alpha) / a0
        }
        mutating func run(_ x: Double) -> Double {
            let y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2
            x2 = x1; x1 = x; y2 = y1; y1 = y
            return y
        }
    }

    static func osc(_ type: String, _ phase: Double, _ dt: Double) -> Double {
        func blep(_ t: Double) -> Double {
            if t < dt { let x = t / dt; return x + x - x * x - 1 }
            if t > 1 - dt { let x = (t - 1) / dt; return x * x + x + x + 1 }
            return 0
        }
        switch type {
        case "square":
            var v = phase < 0.5 ? 1.0 : -1.0
            v += blep(phase); v -= blep((phase + 0.5).truncatingRemainder(dividingBy: 1))
            return v
        case "sawtooth": return 2 * phase - 1 - blep(phase)
        case "triangle": return phase < 0.5 ? 4 * phase - 1 : 3 - 4 * phase
        default: return sin(2 * Double.pi * phase)
        }
    }

    static func expRamp(_ a: Double, _ b: Double, _ k: Double) -> Double { a * pow(b / a, Swift.min(Swift.max(k, 0), 1)) }

    /// The envelope of audio-engine.js: a fast rise to the peak, a hold, then a fall to silence.
    static func envelope(_ t: Double, dur: Double, peak: Double, attack: Double, release: Double) -> Double {
        let p = Swift.max(peak, 0.0002)
        let holdEnd = Swift.max(attack, dur - release)
        if t < attack { return expRamp(0.0001, p, t / attack) }
        if t < holdEnd { return p }
        if t < dur { return expRamp(p, 0.0001, (t - holdEnd) / Swift.max(dur - holdEnd, 0.0001)) }
        return 0
    }

    /// One piece of a sound: a tone or a burst of filtered noise.
    struct Part {
        var noise = false
        var freq = 1000.0, dur = 0.1
        var type = "sine", slideTo: Double? = nil, lowpass: Double? = nil
        var filter = "lowpass", sweepTo: Double? = nil, Q: Double? = nil
        var gain = 0.2, attack: Double? = nil, release: Double? = nil
        var at = 0.0
        var pan: Double? = nil
    }

    static func tone(_ freq: Double, _ dur: Double, gain: Double = 0.2, type: String = "sine", slideTo: Double? = nil, lowpass: Double? = nil,
                     attack: Double? = nil, at: Double = 0, pan: Double? = nil) -> Part {
        Part(noise: false, freq: freq, dur: dur, type: type, slideTo: slideTo, lowpass: lowpass, gain: gain, attack: attack, at: at, pan: pan)
    }
    static func noise(_ dur: Double, freq: Double = 1000, filter: String = "lowpass", sweepTo: Double? = nil, Q: Double? = nil, gain: Double = 0.2,
                      attack: Double? = nil, at: Double = 0, pan: Double? = nil) -> Part {
        Part(noise: true, freq: freq, dur: dur, filter: filter, sweepTo: sweepTo, Q: Q, gain: gain, attack: attack, at: at, pan: pan)
    }

    /// Renders parts into one buffer (each at its own start time).
    static func render(_ parts: [Part]) -> PCM {
        let total = parts.map { $0.at + $0.dur + 0.05 }.max() ?? 0
        var out = [Float](repeating: 0, count: Swift.max(1, Int(total * SR)))
        for p in parts {
            let start = Int(p.at * SR), n = Int((p.dur + 0.05) * SR)
            let attack = p.attack ?? 0.005, release = p.release ?? Swift.min(0.1, p.dur / 2)
            var phase = 0.0
            var bq: Biquad? = p.noise
                ? Biquad(Biquad.Kind(rawValue: p.filter) ?? .lowpass, p.freq, q: p.Q ?? 0.7)
                : p.lowpass.map { Biquad(.lowpass, $0, q: 1) }
            for i in 0..<n where start + i < out.count {
                let t = Double(i) / SR
                var v: Double
                if p.noise {
                    if let s = p.sweepTo, i % 32 == 0 { bq!.set(expRamp(p.freq, s, t / p.dur), q: p.Q ?? 0.7) }
                    v = bq!.run(Double.random(in: -1...1))
                } else {
                    let f = p.slideTo.map { expRamp(p.freq, $0, t / p.dur) } ?? p.freq
                    v = osc(p.type, phase, f / SR)
                    phase += f / SR; if phase >= 1 { phase -= 1 }
                    if bq != nil { v = bq!.run(v) }
                }
                out[start + i] += Float(v * envelope(t, dur: p.dur, peak: p.gain, attack: attack, release: release))
            }
        }
        return PCM(out)
    }

    /// A seamless loop: renders a bit extra and crossfades the end into the start.
    static func loop(_ seconds: Double, warmup: Double = 0.5, _ next: (Double) -> Double) -> PCM {
        let n = Int(seconds * SR), fade = Int(0.25 * SR), warm = Int(warmup * SR)
        var raw = [Double](repeating: 0, count: warm + n + fade)
        for i in 0..<raw.count { raw[i] = next(Double(i) / SR) }
        var out = [Float](repeating: 0, count: n)
        for i in 0..<n { out[i] = Float(raw[warm + i]) }
        for i in 0..<fade {
            let k = Double(i) / Double(fade)
            out[i] = Float(raw[warm + i] * k + raw[warm + n + i] * (1 - k))
        }
        return PCM(out)
    }

    /// The web version's loopNoise: endless filtered noise.
    static func noiseLoop(filter: String, freq: Double, Q: Double) -> PCM {
        var bq = Biquad(Biquad.Kind(rawValue: filter) ?? .lowpass, freq, q: Q)
        return loop(4) { _ in bq.run(Double.random(in: -1...1)) }
    }
    /// The web version's loopTone: a steady oscillator (one second holds whole cycles of these frequencies).
    static func toneLoop(freq: Double, type: String) -> PCM {
        var phase = 0.0
        return loop(1, warmup: 0) { _ in
            let v = osc(type, phase, freq / SR)
            phase += freq / SR; if phase >= 1 { phase -= 1 }
            return v
        }
    }
}
