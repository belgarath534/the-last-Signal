// Plays the whole app (menus, game, journal, saves) by pressing buttons by name,
// the way a VoiceOver player moves through it. Then presses random buttons for a long time
// to make sure nothing crashes or gets stuck.
// Usage: swift run LastSignalUI story.json [steps] [seed]
@testable import LastSignalCore
import Foundation

final class Host: AppHost {
    var notes: [String] = []
    func render() {}
    func notify(_ text: String, assertive: Bool) { notes.append(text) }
    func speak(_ text: String) {}
    func stopSpeaking() {}
    func voices() -> [(id: String, name: String)] { [("v1", "Test voice")] }
    func haptic(_ kind: String) {}
}
final class Audio: AudioOut {
    var played: [String] = []
    func playFile(_ name: String, gain: Double, pan: Double, lowpass: Double?, rate: Double, bus: Bus) { played.append(name) }
    func playPCM(_ pcm: PCM, pan: Double, bus: Bus) { played.append("pcm") }
    func setAmbience(_ layers: [AmbienceLayer], fadeIn: Double, fadeOut: Double) {}
    func playMusic(_ name: String, loop: Bool, fade: Double, level: Double) { played.append(name) }
    func stopMusic(fade: Double) {}
    func applyVolumes(master: Double, effects: Double, ambience: Double, music: Double) {}
}

struct Failure: Error { let msg: String }
let args = Array(CommandLine.arguments.dropFirst())
let content = try! Content(data: Data(contentsOf: URL(fileURLWithPath: args[0])))
let steps = args.count > 1 ? Int(args[1])! : 3000
var seed = UInt64(args.count > 2 ? Int(args[2])! : 1)
func rnd() -> Double { seed = seed &* 6364136223846793005 &+ 1442695040888963407; return Double(seed >> 11) / Double(1 << 53) }

let defaults = UserDefaults(suiteName: "lastsignal-test-\(seed)")!
defaults.removePersistentDomain(forName: "lastsignal-test-\(seed)")
let app = AppController(content: content, store: defaults)
let host = Host(), audio = Audio()
app.host = host
app.sound.out = audio
app.start()

func buttons() -> [(group: String?, b: UIButton)] {
    app.model.blocks.flatMap { blk -> [(String?, UIButton)] in if case let .buttons(h, bs) = blk { return bs.map { (h, $0) } }; return [] }
}
func press(_ prefix: String) throws {
    guard let b = buttons().first(where: { $0.b.label.hasPrefix(prefix) })?.b else {
        throw Failure(msg: "no button “\(prefix)” on “\(app.model.title)”: \(buttons().map { $0.b.label })")
    }
    b.action()
}
func narration() -> String {
    for blk in app.model.blocks { if case let .narration(lines) = blk { return lines.map(AppController.lineText).joined(separator: " ") } }
    return ""
}

do {
    // first run, title, new game
    guard app.model.title == "Welcome to The Last Signal" else { throw Failure(msg: "first screen is \(app.model.title)") }
    try press("I use a screen reader")
    guard app.model.title == "The Last Signal" else { throw Failure(msg: "expected title screen") }
    try press("New game")
    guard app.model.isGame, app.model.focusNarration, narration().contains("Chapter 1") else { throw Failure(msg: "new game did not start: \(narration().prefix(80))") }
    print("new game:", app.model.title, "|", narration().prefix(70))
    // examine an object, use it, go back
    try press("Glovebox"); try press("Open the glovebox"); print("glovebox:", narration().prefix(90))
    try press("Back to the room")
    try press("Police radio"); try press("Review the call notes")
    try press("Back to the room")
    // journal and reader
    try press("Journal"); guard app.model.title == "Journal" else { throw Failure(msg: "journal did not open") }
    try press("Dispatch") ; print("reader:", app.model.title)
    try press("Back to journal"); try press("Back")
    guard app.model.isGame else { throw Failure(msg: "back did not return to the game") }
    try press("Inventory"); print("inventory:", app.model.blocks.count, "blocks"); try press("Back")
    // save to slot 1, move, load it back
    try press("Pause menu"); try press("Save game"); try press("Slot 1"); print("saved:", host.notes.last ?? "")
    try press("Back"); try press("Resume")
    try press("Step out into the rain"); let afterMove = app.game.state.location
    try press("Pause menu"); try press("Load game"); try press("Slot 1")
    guard app.game.state.location == "patrol_car", afterMove != "patrol_car" else { throw Failure(msg: "load did not restore the save") }
    print("loaded slot 1 back in:", app.game.state.location)
    // repeat, history, settings, help
    try press("Repeat last")
    try press("Pause menu"); try press("Message history"); try press("Back"); try press("Settings"); try press("Back"); try press("How to play"); try press("Play: The signal"); try press("Back"); try press("Resume")
    // quit and continue
    try press("Pause menu"); try press("Quit to main menu"); try press("Quit to main menu")
    guard app.model.title == "The Last Signal" else { throw Failure(msg: "quit did not reach the title") }
    try press("Continue"); guard app.model.isGame else { throw Failure(msg: "continue failed") }
    print("scripted flow OK")
} catch let f as Failure { print("FAIL:", f.msg); exit(1) }

// random play through the real screens
var screens: [String: Int] = [:]
var chapters = Set<Int>()
var endings = Set<String>()
for i in 0..<steps {
    screens[app.model.title, default: 0] += 1
    if let s = app.game.state { chapters.insert(s.chapter); if let e = s.ended?.ending { endings.insert(e) } }
    var bs = buttons().map { $0.b }
    // stay in the game most of the time: menus are visited, not lived in
    if !app.model.isGame { bs = bs.filter { !["Settings", "How to play", "Load game", "Save game"].contains($0.label) && !$0.label.hasPrefix("Play:") } }
    else if rnd() < 0.9 { bs = bs.filter { !["Journal", "Inventory", "Pause menu", "Repeat last"].contains($0.label) } }
    bs = bs.filter { !$0.label.hasPrefix("Return to the main menu") || rnd() < 0.02 }
    guard !bs.isEmpty else { print("STUCK on \(app.model.title) at step \(i)"); exit(1) }
    bs[Int(rnd() * Double(bs.count))].action()
}
print("random play: \(steps) presses, \(screens.count) different screens, chapters \(chapters.sorted()), endings \(endings.sorted())")
print("sounds played: \(audio.played.count)")
print("ALL OK")
