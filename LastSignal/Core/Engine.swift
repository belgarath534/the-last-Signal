import Foundation

// The game engine, ported from web/js/core/game.js. It never touches the screen or sound:
// every action returns a "beat" (the lines it produced), and sounds go out as cues.

struct Line: Equatable {
    var text: String
    var kind = "narration"   // narration, system, summary, heading, speech, alert
    var speaker: String? = nil
    var speakerId: String? = nil
}
struct Beat { var lines: [Line]; var checkpoint: Bool }

/// The story, from story.json, with lookups by id.
final class Content {
    let raw: JSON
    let start: JSON
    let chapters: [Int: JSON]
    let rooms: [String: JSON]
    let stalkerRoute: [String]
    let items: [String: JSON]
    let documents: [String: JSON]
    let documentOrder: [String]
    let recordings: [String: JSON]
    let objectives: [String: JSON]
    let speakers: [String: JSON]
    let dialogues: [String: JSON]
    let events: [String: JSON]
    let triggers: [JSON]
    let endings: [String: JSON]
    let endingOrder: [String]
    let globalActions: [JSON]

    init(_ json: JSON) {
        raw = json
        start = json["start"] ?? .null
        var ch: [Int: JSON] = [:]
        for (k, v) in json["chapters"]?.pairs ?? [] { if let n = Int(k) { ch[n] = v } }
        chapters = ch
        rooms = json["rooms"]?.dictionary() ?? [:]
        stalkerRoute = json["stalkerRoute"]?.strings ?? []
        items = json["items"]?.dictionary() ?? [:]
        documents = json["documents"]?.dictionary() ?? [:]
        documentOrder = json["documents"]?.pairs?.map { $0.0 } ?? []
        recordings = json["recordings"]?.dictionary() ?? [:]
        objectives = json["objectives"]?.dictionary() ?? [:]
        speakers = json["speakers"]?.dictionary() ?? [:]
        dialogues = json["dialogues"]?.dictionary() ?? [:]
        events = json["events"]?.dictionary() ?? [:]
        triggers = json["triggers"]?.array ?? []
        endings = json["endings"]?.dictionary() ?? [:]
        endingOrder = json["endings"]?.pairs?.map { $0.0 } ?? []
        globalActions = json["globalActions"]?.array ?? []
    }

    convenience init(data: Data) throws { self.init(try JSONReader.parse(data)) }
}

/// Engine events for the app: sounds, trust changes, rooms.
protocol GameListener: AnyObject {
    func cue(_ name: String, pan: Double?)
    func trustChanged(delta: Double, value: Double, levelLabel: String, levelChanged: Bool)
    func roomEntered(_ roomId: String)
    func stateChanged()
}

struct GameView {
    struct Action { let id: String, label: String }
    struct Object { let id: String, name: String, position: String? }
    struct Exit { let id: String, dir: String, label: String, lockedKnown: Bool }
    struct ChoiceItem { let index: Int, text: String }
    var mode: String       // explore, dialogue, chapterEnd, gameOver
    var roomId: String, roomName: String, zone: String?
    var clock: String
    var roomActions: [Action]
    var objects: [Object]
    var exits: [Exit]
    var choices: [ChoiceItem]
    var ended: Ended?
    var gameOver: GameOver?
}

final class Game {
    let content: Content
    weak var listener: GameListener?
    var state: GameState! = nil
    private var output: [Line] = []
    private var checkpointRequested = false

    init(content: Content) { self.content = content }

    /* ---------- helpers used by every system ---------- */

    func say(_ text: String?, kind: String = "narration", speaker: String? = nil, speakerId: String? = nil) {
        guard let text, !text.isEmpty else { return }
        output.append(Line(text: text, kind: kind, speaker: speaker, speakerId: speakerId))
    }
    func cue(_ name: String, pan: Double? = nil) { listener?.cue(name, pan: pan) }

    /// Time moves one minute at a time so Emily's life support and 001 react at exactly the right moment.
    func advanceTime(_ minutes: Int) {
        guard minutes > 0 else { return }
        for _ in 0..<minutes {
            state.minutes += 1
            wardTick()
            stalkerTick()
        }
    }

    /* ---------- conditions ---------- */

    func evaluate(_ cond: JSON?) -> Bool {
        guard let cond, !cond.isNull else { return true }
        if let list = cond.array { return list.allSatisfy { evaluate($0) } }
        guard let pairs = cond.pairs else { fatalError("Bad condition: \(cond)") }
        for (key, v) in pairs where !check(key, v) { return false }
        return true
    }

    private func check(_ key: String, _ v: JSON) -> Bool {
        let s = state!
        switch key {
        case "flag": return v.strings.allSatisfy { s.flags.contains($0) }
        case "notFlag": return v.strings.allSatisfy { !s.flags.contains($0) }
        case "has": return v.strings.allSatisfy { s.inventory.contains($0) }
        case "notHas": return v.strings.allSatisfy { !s.inventory.contains($0) }
        case "visited": return v.strings.allSatisfy { s.visited.contains($0) }
        case "notVisited": return v.strings.allSatisfy { !s.visited.contains($0) }
        case "read": return v.strings.allSatisfy { s.journal.read.contains($0) }
        case "found": return v.strings.allSatisfy { s.journal.documents.contains($0) || s.journal.recordings.contains($0) }
        case "trustAtLeast": return s.trust.value >= (v.number ?? 0)
        case "trustBelow": return s.trust.value < (v.number ?? 0)
        case "lied": return s.trust.lies[v.string ?? ""] != nil
        case "lieExposed": return s.trust.lies[v.string ?? ""]?.exposed == true
        case "objective": return s.objectives[v["id"]?.string ?? ""] == v["status"]?.string
        case "minutesAtLeast": return Double(s.minutes) >= (v.number ?? 0)
        case "at": return v.strings.contains(s.location)
        case "inDialogue": return (s.dialogue != nil) == v.truthy
        case "chapter": return Double(s.chapter) == v.number
        case "wardActive": return s.ward.active == v.truthy
        case "emilyAlive": return s.ward.emilyAlive == v.truthy
        case "emilyIn": return s.ward.active && s.ward.location == v.string
        case "wardPowerBelow": return s.ward.power < (v.number ?? 0)
        case "emilyStabilityBelow": return s.ward.stability < (v.number ?? 0)
        case "stalkerActive": return s.stalker.active == v.truthy
        case "stalkerHere": return (s.stalker.active && s.stalker.room == s.location) == v.truthy
        case "stalkerIn": return s.stalker.active && v.strings.contains(s.stalker.room ?? "\u{0}")
        case "stalkerRecharging": return (s.stalker.active && s.minutes < s.stalker.rechargeUntil) == v.truthy
        case "stalkerAlertBelow": return s.stalker.alert < (v.number ?? 0)
        case "canFlee": return (s.previousRoom != nil && s.previousRoom != s.location && s.previousRoom != s.stalker.room) == v.truthy
        case "counterAtLeast": return (s.counters[v["id"]?.string ?? ""] ?? 0) >= (v["n"]?.number ?? 0)
        case "counterBelow": return (s.counters[v["id"]?.string ?? ""] ?? 0) < (v["n"]?.number ?? 0)
        case "countAtLeast": return Double((v["flags"]?.strings ?? []).filter { s.flags.contains($0) }.count) >= (v["n"]?.number ?? 0)
        case "all": return (v.array ?? []).allSatisfy { evaluate($0) }
        case "any": return (v.array ?? []).contains { evaluate($0) }
        case "not": return !evaluate(v)
        default: fatalError("Unknown condition \"\(key)\"")
        }
    }

    /// Text fields are a string, or a list of { when, text } variants: the first that holds wins.
    func pickText(_ value: JSON?) -> String? {
        guard let value else { return nil }
        if let list = value.array { return list.first { evaluate($0["when"]) }?["text"]?.string }
        return value.string
    }

    /* ---------- effects ---------- */

    func apply(_ effects: JSON?) {
        guard let effects, !effects.isNull else { return }
        for effect in effects.list {
            for (name, v) in effect.pairs ?? [] { applyOne(name, v) }
        }
    }

    private func applyOne(_ name: String, _ v: JSON) {
        switch name {
        // core
        case "setFlag": for f in v.strings { state.flags.insert(f) }
        case "clearFlag": for f in v.strings { state.flags.remove(f) }
        case "say": for t in v.strings { say(t) }
        case "sound": cue(v.string ?? v["name"]?.string ?? "", pan: v["pan"]?.number)
        case "advanceTime": advanceTime(v.int ?? 0)
        case "schedule":
            let event = v["event"]?.string ?? ""
            state.timers.removeAll { $0.event == event }
            state.timers.append(GameTimer(event: event, at: state.minutes + (v["in"]?.int ?? 0)))
        case "cancelTimer": state.timers.removeAll { $0.event == v.string }
        case "secret":
            let key = "secret:" + (v.string ?? jsNum(v.number ?? 0))
            if state.flags.contains(key) { return }
            state.flags.insert(key)
            state.secretsFound += 1
            cue("secret")
            say("You found something hidden.", kind: "system")
        case "checkpoint": checkpointRequested = true
        case "count":
            let id = v["id"]?.string ?? ""
            state.counters[id] = (state.counters[id] ?? 0) + (v["add"]?.number ?? 0)
        case "setClock":
            let now = (startClockMinutes + state.minutes) % 1440
            let target = (v["hour"]?.int ?? 0) * 60 + (v["minute"]?.int ?? 0)
            state.minutes += ((target - now) % 1440 + 1440) % 1440
        case "endChapter":
            state.flags.insert("chapter_\(state.chapter)_complete")
            let ending = v["ending"]?.string
            state.ended = Ended(chapter: state.chapter, title: v["title"]?.string ?? "", text: v["text"]?.string ?? "", ending: ending)
            if let ending {
                state.flags = state.flags.filter { !$0.hasPrefix("ending_") }
                state.flags.insert("ending_" + ending)
            }
            cue("chapter.end")
            say(v["text"]?.string)
            say(v["title"]?.string, kind: "heading")
        // world
        case "give": give(v.string ?? "")
        case "remove": state.inventory.removeAll { $0 == v.string }
        case "useOne":
            if let id = v.strings.first(where: { state.inventory.contains($0) }) { state.inventory.removeAll { $0 == id } }
        case "moveTo": enterRoom(v.string ?? "")
        // dialogue
        case "startDialogue": startDialogue(v.string ?? "")
        case "endDialogue": endDialogue()
        // trust
        case "trust":
            if let n = v.number { changeTrust(n, reason: nil) } else { changeTrust(v["amount"]?.number ?? 0, reason: v["reason"]?.string) }
        case "honest": state.trust.honestAnswers += 1
        case "lie":
            let id = v.string ?? v["id"]?.string ?? ""
            state.trust.lies[id] = Lie(exposed: false, at: state.minutes, about: v["about"]?.string ?? id)
        case "exposeLie":
            let id = v["id"]?.string ?? ""
            guard let lie = state.trust.lies[id], !lie.exposed else { return }
            state.trust.lies[id]?.exposed = true
            changeTrust(-(v["penalty"]?.number ?? 20), reason: v["reason"]?.string ?? "caught lying about \(lie.about)")
        // journal
        case "addDocument": addDocument(v.string ?? "")
        case "addRecording": addRecording(v.string ?? "")
        case "objective": setObjective(v)
        // Emily's life support
        case "wardStart", "wardMoveIn", "wardAddPower", "wardStabilize", "wardEnd", "wardReport": wardEffect(name, v)
        // Prototype 001
        case "stalkerStart", "stalkerStop", "stalkerMoveOn", "stalkerAlert", "flee", "caught": stalkerEffect(name, v)
        default: fatalError("Unknown effect \"\(name)\"")
        }
    }

    /* ---------- running actions ---------- */

    /// Scheduled events and triggers run between player actions, never in the middle of a conversation.
    private func runPending() {
        var guardN = 0
        while guardN < 20 && state.dialogue == nil && state.gameOver == nil {
            guardN += 1
            let now = state.minutes
            state.timers = state.timers.enumerated().sorted { ($0.element.at, $0.offset) < ($1.element.at, $1.offset) }.map { $0.element }
            if let due = state.timers.first(where: { $0.at <= now }) {
                if let i = state.timers.firstIndex(of: due) { state.timers.remove(at: i) }
                guard let ev = content.events[due.event] else { fatalError("Unknown event \(due.event)") }
                if evaluate(ev["when"]) { apply(ev["effects"]) }
                continue
            }
            guard let trig = content.triggers.first(where: { t in
                !state.firedTriggers.contains(t["id"]?.string ?? "") && evaluate(t["when"])
            }) else { break }
            if trig["once"] != .bool(false) { state.firedTriggers.insert(trig["id"]?.string ?? "") }
            apply(trig["effects"])
        }
    }

    @discardableResult
    private func run(_ fn: () -> Void) -> Beat {
        output = []
        checkpointRequested = false
        fn()
        runPending()
        state.actions += 1
        listener?.stateChanged()
        return Beat(lines: output, checkpoint: checkpointRequested)
    }

    private func roomActionList() -> [GameView.Action] {
        var list = [GameView.Action(id: "look", label: "Look around"), GameView.Action(id: "listen", label: "Listen")]
        for a in content.globalActions where evaluate(a["when"]) {
            list.append(GameView.Action(id: a["id"]?.string ?? "", label: a["label"]?.string ?? ""))
        }
        return list
    }

    var mode: String {
        if state.gameOver != nil { return "gameOver" }
        if state.ended != nil { return "chapterEnd" }
        if state.dialogue != nil { return "dialogue" }
        return "explore"
    }

    /* ---------- the API the app uses ---------- */

    func newGame() -> Beat {
        state = GameState(startRoom: content.start["room"]?.string ?? "")
        state.inventory = content.start["inventory"]?.strings ?? []
        return run {
            for line in content.start["intro"]?.strings ?? [] { say(line) }
            apply(content.start["effects"])
            enterRoom(content.start["room"]?.string ?? "")
        }
    }

    func loadState(_ saved: GameState) {
        state = saved
        listener?.roomEntered(state.location)
        listener?.stateChanged()
    }
    func snapshot() -> GameState { state }

    func saveMeta() -> (room: String, chapter: Int, clock: String) {
        (room()["name"]?.string ?? "", state.chapter, clockLabel(state.minutes))
    }

    func view() -> GameView {
        let m = mode
        let r = room()
        let explore = m == "explore"
        return GameView(
            mode: m,
            roomId: r["id"]?.string ?? state.location, roomName: r["name"]?.string ?? "", zone: r["zone"]?.string,
            clock: clockLabel(state.minutes),
            roomActions: explore ? roomActionList() : [],
            objects: explore ? visibleObjects().map { GameView.Object(id: $0["id"]?.string ?? "", name: $0["name"]?.string ?? "", position: $0["position"]?.string) } : [],
            exits: explore ? visibleExits().map { GameView.Exit(id: $0["id"]?.string ?? "", dir: $0["dir"]?.string ?? "", label: exitLabel($0), lockedKnown: lockedKnown($0)) } : [],
            choices: m == "dialogue" ? dialogueChoices() : [],
            ended: state.ended, gameOver: state.gameOver)
    }

    func objectActions(_ id: String) -> [GameView.Action] {
        objectActionList(id).map { GameView.Action(id: $0["id"]?.string ?? "", label: $0["label"]?.string ?? "") }
    }

    /// Text shown after loading a save or coming back to the game.
    func resume() -> Beat {
        run {
            if state.ended != nil { return }
            if state.dialogue != nil {
                say("You are in the middle of a conversation.", kind: "system")
                replayDialogue()
            } else {
                describeHere()
            }
        }
    }

    func look() -> Beat { run { lookAround() } }
    func listen() -> Beat { run { listenHere() } }
    func go(_ exitId: String) -> Beat { run { goExit(exitId) } }
    func act(_ objectId: String, _ actionId: String) -> Beat { run { actOn(objectId, actionId) } }
    func choose(_ index: Int) -> Beat { run { chooseDialogue(index) } }
    func roomAction(_ id: String) -> Beat {
        if id == "look" { return look() }
        if id == "listen" { return listen() }
        guard let a = content.globalActions.first(where: { $0["id"]?.string == id }), evaluate(a["when"]) else {
            return run { say("You cannot do that now.", kind: "system") }
        }
        return run { apply(a["effects"]) }
    }
    var hasNextChapter: Bool { content.chapters[state.chapter + 1] != nil }

    func startNextChapter() -> Beat {
        run {
            let n = state.chapter + 1
            guard let ch = content.chapters[n] else { return }
            if let reached = state.ended?.ending, !state.flags.contains("ending_" + reached) { state.flags.insert("ending_" + reached) }
            state.chapter = n
            state.ended = nil
            for line in ch["start"]?["intro"]?.strings ?? [] { say(line) }
            apply(ch["start"]?["effects"])
            enterRoom(ch["start"]?["room"]?.string ?? "")
        }
    }

    func continueAfterChapter() -> Beat {
        run {
            let after = content.chapters[state.chapter]?["afterEnd"]
            state.ended = nil
            for id in after?["resetTriggers"]?.strings ?? [] { state.firedTriggers.remove(id) }
            apply(after?["effects"])
        }
    }

    /// Progress for the chapter summary, covering every chapter so far.
    func chapterSummary() -> (documents: (Int, Int), recordings: (Int, Int), secrets: (Int, Int)) {
        func upTo(_ list: [String: JSON]) -> Int { list.values.filter { Int($0["chapter"]?.number ?? 1) <= state.chapter }.count }
        var secrets = 0
        for n in 1...max(state.chapter, 1) { secrets += content.chapters[n]?["secrets"]?.int ?? 0 }
        return ((state.journal.documents.count, upTo(content.documents)), (state.journal.recordings.count, upTo(content.recordings)), (state.secretsFound, secrets))
    }

    func markRead(_ id: String) {
        if !state.journal.read.contains(id) {
            state.journal.read.insert(id)
            apply((content.documents[id] ?? content.recordings[id])?["onRead"])
        }
    }

    func objectives(_ status: String) -> [(id: String, text: String)] {
        state.objectives.entries.filter { $0.1 == status }.map { ($0.0, content.objectives[$0.0]?["text"]?.string ?? "") }
    }
}
