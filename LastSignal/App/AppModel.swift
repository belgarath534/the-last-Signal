import SwiftUI
import AVFoundation
import UIKit

/// Connects the app controller to SwiftUI, VoiceOver, the built-in voice and vibration.
final class AppModel: ObservableObject, AppHost {
    let controller: AppController
    let audio = AudioEngine()
    private let synth = AVSpeechSynthesizer()
    @Published var screen = ScreenModel(title: "", blocks: [])
    @Published var settings = GameSettings()
    private let tap = UIImpactFeedbackGenerator(style: .light)
    private let thump = UIImpactFeedbackGenerator(style: .heavy)

    init() {
        let url = Bundle.main.url(forResource: "story", withExtension: "json")!
        let content = try! Content(data: Data(contentsOf: url))
        controller = AppController(content: content)
        controller.host = self
        controller.sound.out = audio
        audio.preload(Array(Set(cueSamples.values)) + Array(sampleFiles.values) + ["sfx-creak", "sfx-crack", "sfx-far-metal", "sfx-far-clank", "sfx-chant"])
        controller.start()
    }

    func render() {
        screen = controller.model
        settings = controller.settings
    }

    func notify(_ text: String, assertive: Bool) {
        switch controller.settings.speechMode {
        case "selfvoice": speak(text)
        default:
            let s = NSAttributedString(string: text, attributes: [.accessibilitySpeechQueueAnnouncement: !assertive])
            UIAccessibility.post(notification: .announcement, argument: s)
        }
    }

    func speak(_ text: String) {
        guard controller.settings.speechMode == "selfvoice", !text.isEmpty else { return }
        synth.stopSpeaking(at: .immediate)
        let u = AVSpeechUtterance(string: text)
        u.rate = Float(min(max(Double(AVSpeechUtteranceDefaultSpeechRate) * controller.settings.voiceRate, Double(AVSpeechUtteranceMinimumSpeechRate)), Double(AVSpeechUtteranceMaximumSpeechRate)))
        if !controller.settings.voiceName.isEmpty, let v = AVSpeechSynthesisVoice(identifier: controller.settings.voiceName) { u.voice = v }
        else { u.voice = AVSpeechSynthesisVoice(language: "en-US") }
        synth.speak(u)
    }
    func stopSpeaking() { synth.stopSpeaking(at: .immediate) }

    func voices() -> [(id: String, name: String)] {
        AVSpeechSynthesisVoice.speechVoices().filter { $0.language.hasPrefix("en") }.map { ($0.identifier, "\($0.name) (\($0.language))") }
    }

    func haptic(_ kind: String) {
        switch kind {
        case "heavy": thump.impactOccurred(intensity: 1)
        case "step": thump.impactOccurred(intensity: 0.6)
        default: tap.impactOccurred(intensity: 0.7)
        }
    }

    /// The player touched a button: in "read aloud" mode, say what it is first.
    func focusedButton(_ label: String) {
        if controller.settings.speechMode == "selfvoice" { speak(label) }
    }

    func didLeave() { controller.didLeave(); audio.suspend() }
    func didReturn() { audio.resume() }
}
