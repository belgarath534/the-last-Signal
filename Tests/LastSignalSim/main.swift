// Replays playthroughs recorded from the original JavaScript engine
// (tools/record-playthrough.mjs) and checks that the Swift engine produces
// exactly the same text, sounds and options after every action.
// Usage: swift run LastSignalSim story.json play1.json [play2.json ...]
@testable import LastSignalCore
import Foundation

final class CueLog: GameListener {
    var cues: [String] = []
    func cue(_ name: String, pan: Double?) { cues.append(name + (pan.map { "@" + jsNum($0) } ?? "")) }
    func trustChanged(delta: Double, value: Double, levelLabel: String, levelChanged: Bool) {}
    func roomEntered(_ roomId: String) {}
    func stateChanged() {}
}

let args = CommandLine.arguments.dropFirst()
let storyPath = args.first!
let content = try! Content(data: Data(contentsOf: URL(fileURLWithPath: storyPath)))
var failures = 0

for path in args.dropFirst() {
    let rec = try! JSONReader.parse(Data(contentsOf: URL(fileURLWithPath: path))).array!
    let game = Game(content: content)
    let log = CueLog()
    game.listener = log
    var checkpoint: GameState? = nil
    var lastCheckpointFlag = false
    var bad = 0
    for (i, step) in rec.enumerated() {
        let action = step["action"]!.array!
        let kind = action[0].string!
        if lastCheckpointFlag { checkpoint = game.snapshot() }
        log.cues = []
        var beat: Beat? = nil
        switch kind {
        case "new": beat = game.newGame(); checkpoint = game.snapshot()
        case "resume": game.loadState(checkpoint!); log.cues = []; beat = game.resume()
        case "next": beat = game.startNextChapter()
        case "choose": beat = game.choose(action[1].int!)
        case "room": beat = game.roomAction(action[1].string!)
        case "act": beat = game.act(action[1].string!, action[2].string!)
        case "go": beat = game.go(action[1].string!)
        case "read": game.markRead(action[1].string!)
        default: fatalError("unknown action \(kind)")
        }
        lastCheckpointFlag = beat?.checkpoint ?? false
        // compare text
        let want = (step["lines"]?.array ?? []).map { l -> String in let a = l.array!; return "[\(a[0].string!)|\(a[1].string!)] \(a[2].string ?? "")" }
        let got = (beat?.lines ?? []).map { "[\($0.kind)|\($0.speaker ?? "")] \($0.text)" }
        let wantCues = (step["cues"]?.array ?? []).map { $0.string! }
        let v = game.view()
        let wv = step["view"]!
        var problems: [String] = []
        if want != got { problems.append("text differs:\n  JS:    \(want.joined(separator: "\n         "))\n  Swift: \(got.joined(separator: "\n         "))") }
        if kind != "read" && kind != "resume" && wantCues != log.cues { problems.append("cues differ: JS \(wantCues) Swift \(log.cues)") }
        let gotView = [v.mode, v.roomId, v.clock, v.roomActions.map { $0.id }.joined(separator: ","), v.objects.map { $0.id }.joined(separator: ","),
                       v.exits.map { $0.id + ($0.lockedKnown ? "!" : "") }.joined(separator: ","), v.choices.map { "\($0.index):\($0.text)" }.joined(separator: "|")]
        let wantView = [wv["mode"]!.string!, wv["room"]!.string!, wv["clock"]!.string!, wv["actions"]!.strings.joined(separator: ","), wv["objects"]!.strings.joined(separator: ","),
                        wv["exits"]!.strings.joined(separator: ","), wv["choices"]!.strings.joined(separator: "|")]
        if gotView != wantView { problems.append("view differs:\n  JS:    \(wantView)\n  Swift: \(gotView)") }
        if !problems.isEmpty {
            bad += 1
            if bad <= 3 { print("\(path) step \(i) \(action):\n" + problems.joined(separator: "\n")) }
        }
    }
    print("\(path): \(rec.count) steps, \(bad) mismatched, chapter \(game.state.chapter), \(game.mode)")
    failures += bad
}
print(failures == 0 ? "ALL MATCH" : "\(failures) MISMATCHES")
exit(failures == 0 ? 0 : 1)
