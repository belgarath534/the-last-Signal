import AVFoundation
import UIKit

/// The iPhone's sound for The Last Signal: effects, room ambience and music on AVAudioEngine,
/// with every sound placed left or right (the web version's stereo panning).
final class AudioEngine: AudioOut {
    private let engine = AVAudioEngine()
    private let sfxBus = AVAudioMixerNode()
    private let ambBus = AVAudioMixerNode()
    private let mono = AVAudioFormat(standardFormatWithSampleRate: Synth.SR, channels: 1)!
    private let stereo = AVAudioFormat(standardFormatWithSampleRate: Synth.SR, channels: 2)!
    private var files: [String: AVAudioPCMBuffer] = [:]
    private var musicVolume = 0.45, masterVolume = 0.8
    private var suspended = false

    /// One playing sound: player -> speed -> filter -> mixer (which carries its left/right position).
    private final class Voice {
        let player = AVAudioPlayerNode()
        let speed = AVAudioUnitVarispeed()
        let eq = AVAudioUnitEQ(numberOfBands: 1)
        let mixer = AVAudioMixerNode()
        var busy = false
        var serial = 0
        var startedAt = 0.0
    }
    private var sfxVoices: [Voice] = []
    private var ambVoices: [Voice] = []

    /// The room's looping layers, faded in and out together.
    private final class Scene {
        let mixer = AVAudioMixerNode()
        var voices: [Voice] = []
        var fade: Task<Void, Never>? = nil
    }
    private var scene: Scene? = nil
    private var loopCache: [String: AVAudioPCMBuffer] = [:]

    private var music: AVAudioPlayer? = nil
    private var musicLevel = 0.0

    init() {
        configureSession()
        engine.attach(sfxBus); engine.attach(ambBus)
        engine.connect(sfxBus, to: engine.mainMixerNode, format: stereo)
        engine.connect(ambBus, to: engine.mainMixerNode, format: stereo)
        for _ in 0..<12 { sfxVoices.append(makeVoice(to: sfxBus)) }
        for _ in 0..<8 { ambVoices.append(makeVoice(to: ambBus)) }
        start()
        NotificationCenter.default.addObserver(forName: .AVAudioEngineConfigurationChange, object: engine, queue: .main) { [weak self] _ in
            guard let self, !self.suspended else { return }
            self.start()
            self.restartLoops()
        }
    }

    private func configureSession() {
        // Plays alongside VoiceOver; mixing keeps VoiceOver's speech on top of the game.
        try? AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: [])
        try? AVAudioSession.sharedInstance().setActive(true)
    }

    private func makeVoice(to bus: AVAudioMixerNode) -> Voice {
        let v = Voice()
        engine.attach(v.player); engine.attach(v.speed); engine.attach(v.eq); engine.attach(v.mixer)
        engine.connect(v.player, to: v.speed, format: mono)
        engine.connect(v.speed, to: v.eq, format: mono)
        engine.connect(v.eq, to: v.mixer, format: mono)
        engine.connect(v.mixer, to: bus, format: stereo)
        v.eq.bands[0].filterType = .lowPass
        v.eq.bands[0].bypass = true
        return v
    }

    private func start() {
        guard !engine.isRunning else { return }
        engine.prepare()
        do { try engine.start() } catch { print("audio engine: \(error)") }
    }

    /// Loads every sound in the app so nothing waits for a file later.
    func preload(_ names: [String]) {
        let fmt = mono
        DispatchQueue.global(qos: .userInitiated).async {
            for n in names {
                guard let b = AudioEngine.decode(n, to: fmt) else { continue }
                DispatchQueue.main.async { [weak self] in if self?.files[n] == nil { self?.files[n] = b } }
            }
        }
    }

    private static func decode(_ name: String, to fmt: AVAudioFormat) -> AVAudioPCMBuffer? {
        guard let url = Bundle.main.url(forResource: name, withExtension: "mp3"), let file = try? AVAudioFile(forReading: url) else { return nil }
        let inFmt = file.processingFormat
        guard let raw = AVAudioPCMBuffer(pcmFormat: inFmt, frameCapacity: AVAudioFrameCount(file.length)) else { return nil }
        do { try file.read(into: raw) } catch { return nil }
        if inFmt.sampleRate == fmt.sampleRate && inFmt.channelCount == 1 { return raw }
        guard let conv = AVAudioConverter(from: inFmt, to: fmt),
              let out = AVAudioPCMBuffer(pcmFormat: fmt, frameCapacity: AVAudioFrameCount(Double(raw.frameLength) * fmt.sampleRate / inFmt.sampleRate) + 1024) else { return nil }
        var fed = false
        var err: NSError?
        conv.convert(to: out, error: &err) { _, status in
            if fed { status.pointee = .endOfStream; return nil }
            fed = true; status.pointee = .haveData; return raw
        }
        return err == nil ? out : nil
    }

    private func buffer(_ pcm: PCM) -> AVAudioPCMBuffer? {
        guard let b = AVAudioPCMBuffer(pcmFormat: mono, frameCapacity: AVAudioFrameCount(max(pcm.samples.count, 1))) else { return nil }
        b.frameLength = AVAudioFrameCount(pcm.samples.count)
        pcm.samples.withUnsafeBufferPointer { src in
            if let base = src.baseAddress { b.floatChannelData![0].update(from: base, count: pcm.samples.count) }
        }
        return b
    }

    private func grab(_ pool: [Voice]) -> Voice {
        pool.first { !$0.busy } ?? pool.min { $0.startedAt < $1.startedAt }!
    }

    private func play(_ buf: AVAudioPCMBuffer, gain: Double, pan: Double, lowpass: Double?, rate: Double, pool: [Voice]) {
        guard !suspended else { return }
        start()
        let v = grab(pool)
        v.player.stop()
        v.serial += 1
        let serial = v.serial
        v.busy = true
        v.startedAt = CACurrentMediaTime()
        v.speed.rate = Float(min(max(rate, 0.25), 4))
        v.eq.bands[0].bypass = lowpass == nil
        if let lowpass { v.eq.bands[0].frequency = Float(lowpass) }
        v.mixer.outputVolume = Float(max(0, gain))
        v.mixer.pan = Float(max(-1, min(1, pan)))
        v.player.scheduleBuffer(buf, at: nil, options: [], completionCallbackType: .dataPlayedBack) { [weak v] _ in
            DispatchQueue.main.async { if let v, v.serial == serial { v.busy = false } }
        }
        v.player.play()
    }

    /* ---------- AudioOut ---------- */

    func playFile(_ name: String, gain: Double, pan: Double, lowpass: Double?, rate: Double, bus: Bus) {
        if files[name] == nil, let b = AudioEngine.decode(name, to: mono) { files[name] = b }
        guard let buf = files[name] else { return }
        play(buf, gain: gain, pan: pan, lowpass: lowpass, rate: rate, pool: bus == .ambience ? ambVoices : sfxVoices)
    }

    func playPCM(_ pcm: PCM, pan: Double, bus: Bus) {
        guard let buf = buffer(pcm) else { return }
        play(buf, gain: 1, pan: pan, lowpass: nil, rate: 1, pool: bus == .ambience ? ambVoices : sfxVoices)
    }

    func setAmbience(_ layers: [AmbienceLayer], fadeIn: Double, fadeOut: Double) {
        if let old = scene { fadeScene(old, to: 0, over: fadeOut, thenRemove: true) }
        scene = nil
        guard !layers.isEmpty else { return }
        start()
        let s = Scene()
        engine.attach(s.mixer)
        engine.connect(s.mixer, to: ambBus, format: stereo)
        s.mixer.outputVolume = 0
        for layer in layers {
            let buf: AVAudioPCMBuffer?
            var gain = 0.0, pan = 0.0, lowpass: Double? = nil
            switch layer {
            case let .file(name, g, l, p):
                if files[name] == nil, let b = AudioEngine.decode(name, to: mono) { files[name] = b }
                buf = files[name]; gain = g; lowpass = l; pan = p
            case let .noise(key, filter, freq, Q, g, p):
                if loopCache[key] == nil { loopCache[key] = buffer(Synth.noiseLoop(filter: filter, freq: freq, Q: Q)) }
                buf = loopCache[key]; gain = g; pan = p
            case let .tone(key, freq, type, g):
                if loopCache[key] == nil { loopCache[key] = buffer(Synth.toneLoop(freq: freq, type: type)) }
                buf = loopCache[key]; gain = g
            }
            guard let buf else { continue }
            let v = makeVoice(to: s.mixer)
            v.eq.bands[0].bypass = lowpass == nil
            if let lowpass { v.eq.bands[0].frequency = Float(lowpass) }
            v.mixer.outputVolume = Float(gain)
            v.mixer.pan = Float(pan)
            s.voices.append(v)
            // start somewhere in the middle of a recorded loop, like the web version
            let startFrame = buf.frameLength > 44100 ? AVAudioFramePosition(Double.random(in: 0..<Double(buf.frameLength - 44100))) : 0
            if startFrame > 0, let tail = slice(buf, from: AVAudioFrameCount(startFrame)) {
                v.player.scheduleBuffer(tail, at: nil, options: [], completionHandler: nil)
            }
            v.player.scheduleBuffer(buf, at: nil, options: .loops, completionHandler: nil)
            if !suspended { v.player.play() }
        }
        scene = s
        fadeScene(s, to: 1, over: fadeIn, thenRemove: false)
    }

    private func slice(_ buf: AVAudioPCMBuffer, from: AVAudioFrameCount) -> AVAudioPCMBuffer? {
        let n = buf.frameLength - from
        guard let out = AVAudioPCMBuffer(pcmFormat: buf.format, frameCapacity: n) else { return nil }
        out.frameLength = n
        out.floatChannelData![0].update(from: buf.floatChannelData![0] + Int(from), count: Int(n))
        return out
    }

    private func fadeScene(_ s: Scene, to target: Double, over seconds: Double, thenRemove: Bool) {
        s.fade?.cancel()
        let from = Double(s.mixer.outputVolume)
        let t0 = CACurrentMediaTime()
        s.fade = Task { @MainActor [weak self] in
            while !Task.isCancelled {
                let k = min((CACurrentMediaTime() - t0) / max(seconds, 0.01), 1)
                s.mixer.outputVolume = Float(from + (target - from) * k)
                if k >= 1 { break }
                try? await Task.sleep(nanoseconds: 30_000_000)
            }
            if thenRemove, let self {
                for v in s.voices {
                    v.player.stop()
                    [v.player, v.speed, v.eq, v.mixer].forEach { self.engine.detach($0) }
                }
                self.engine.detach(s.mixer)
            }
        }
    }

    private func restartLoops() {
        guard let s = scene else { return }
        for v in s.voices where !v.player.isPlaying { v.player.play() }
    }

    func playMusic(_ name: String, loop: Bool, fade: Double, level: Double) {
        stopMusic(fade: fade)
        guard let url = Bundle.main.url(forResource: name, withExtension: "mp3"), let p = try? AVAudioPlayer(contentsOf: url) else { return }
        p.numberOfLoops = loop ? -1 : 0
        p.volume = 0
        p.prepareToPlay()
        if !suspended { p.play() }
        musicLevel = level
        p.setVolume(Float(level * musicVolume * masterVolume), fadeDuration: max(fade, 0.01))
        music = p
    }

    func stopMusic(fade: Double) {
        guard let old = music else { return }
        music = nil
        old.setVolume(0, fadeDuration: max(fade, 0.01))
        DispatchQueue.main.asyncAfter(deadline: .now() + fade + 0.2) { old.stop() }
    }

    func applyVolumes(master: Double, effects: Double, ambience: Double, music m: Double) {
        masterVolume = master
        musicVolume = m
        engine.mainMixerNode.outputVolume = Float(master)
        sfxBus.outputVolume = Float(effects)
        ambBus.outputVolume = Float(ambience)
        music?.volume = Float(musicLevel * m * master)
    }

    /* ---------- the app leaving and coming back ---------- */

    func suspend() {
        suspended = true
        engine.pause()
        music?.pause()
    }
    func resume() {
        suspended = false
        configureSession()
        start()
        restartLoops()
        music?.play()
    }
}
