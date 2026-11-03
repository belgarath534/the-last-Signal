import Foundation

// The app around the engine: screens, saves, settings, endings and history.
// Ported from web/js/ui. Every screen is described as headings, text and button groups,
// so the iPhone just draws it, and the tests can press buttons by name.

/* ---------- what a screen is made of ---------- */

struct MenuButton {
    let label: String
    var pan: Double? = nil
    var id: String? = nil
    let action: () -> Void
}
enum UIBlock {
    case heading(String)
    case text(String, style: String = "body")          // body, status, fineprint, kind
    case narration([Line])                            // the text of what just happened; gets focus
    case list([String])
    case buttons(String?, [MenuButton])                 // a group under its own heading
    case picker(label: String, hint: String?, options: [(value: String, label: String)], selected: String, set: (String) -> Void)
    case slider(label: String, value: Double, set: (Double) -> Void, done: () -> Void)
    case toggle(label: String, hint: String?, value: Bool, set: (Bool) -> Void)
}
struct ScreenModel {
    var id = 0
    var title: String
    var blocks: [UIBlock]
    /// what VoiceOver should land on: the narration, or the title
    var focusNarration = false
    var isGame = false
}

/// What the controller needs from the device.
protocol AppHost: AnyObject {
    func render()
    /// short status messages ("Saved")
    func notify(_ text: String, assertive: Bool)
    /// the built-in voice (only when the player chose it)
    func speak(_ text: String)
    func stopSpeaking()
    func voices() -> [(id: String, name: String)]
    func haptic(_ kind: String)
}

/* ---------- settings (web/js/core/settings.js) ---------- */

struct GameSettings: Codable, Equatable {
    var firstRunDone = false
    var speechMode = "screenreader"     // screenreader, selfvoice, text
    var voiceRate = 1.0
    var voiceName = ""
    var masterVolume = 0.8
    var ambienceVolume = 0.6
    var musicVolume = 0.45
    var explorationMusic = true
    var effectsVolume = 0.8
    var monoAudio = false
    var trustFeedback = "sound"         // off, sound, speech
    var reduceStartles = false
    var textSize = "normal"
    var highContrast = false
    var haptics = true

    init() {}
    // older or partial saved settings fill in the defaults
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        let d = GameSettings()
        firstRunDone = (try? c.decode(Bool.self, forKey: .firstRunDone)) ?? d.firstRunDone
        speechMode = (try? c.decode(String.self, forKey: .speechMode)) ?? d.speechMode
        voiceRate = (try? c.decode(Double.self, forKey: .voiceRate)) ?? d.voiceRate
        voiceName = (try? c.decode(String.self, forKey: .voiceName)) ?? d.voiceName
        masterVolume = (try? c.decode(Double.self, forKey: .masterVolume)) ?? d.masterVolume
        ambienceVolume = (try? c.decode(Double.self, forKey: .ambienceVolume)) ?? d.ambienceVolume
        musicVolume = (try? c.decode(Double.self, forKey: .musicVolume)) ?? d.musicVolume
        explorationMusic = (try? c.decode(Bool.self, forKey: .explorationMusic)) ?? d.explorationMusic
        effectsVolume = (try? c.decode(Double.self, forKey: .effectsVolume)) ?? d.effectsVolume
        monoAudio = (try? c.decode(Bool.self, forKey: .monoAudio)) ?? d.monoAudio
        trustFeedback = (try? c.decode(String.self, forKey: .trustFeedback)) ?? d.trustFeedback
        reduceStartles = (try? c.decode(Bool.self, forKey: .reduceStartles)) ?? d.reduceStartles
        textSize = (try? c.decode(String.self, forKey: .textSize)) ?? d.textSize
        highContrast = (try? c.decode(Bool.self, forKey: .highContrast)) ?? d.highContrast
        haptics = (try? c.decode(Bool.self, forKey: .haptics)) ?? d.haptics
    }
}

/* ---------- saves (web/js/core/save.js) ---------- */

struct SaveMeta: Codable { var room: String; var chapter: Int; var clock: String; var savedAt: String }
struct SaveFile: Codable { var meta: SaveMeta; var state: GameState }
let saveSlots = ["auto", "checkpoint", "1", "2", "3"]

final class Saves {
    let store: UserDefaults
    init(store: UserDefaults = .standard) { self.store = store }
    private func key(_ slot: String) -> String { "tls.save.\(slot)" }

    @discardableResult
    func save(_ slot: String, _ state: GameState, room: String, chapter: Int, clock: String) -> Bool {
        let f = SaveFile(meta: SaveMeta(room: room, chapter: chapter, clock: clock, savedAt: ISO8601DateFormatter().string(from: Date())), state: state)
        guard let d = try? JSONEncoder().encode(f) else { return false }
        store.set(d, forKey: key(slot))
        return true
    }
    func load(_ slot: String) -> SaveFile? {
        guard let d = store.data(forKey: key(slot)) else { return nil }
        return try? JSONDecoder().decode(SaveFile.self, from: d)
    }
    func meta(_ slot: String) -> (empty: Bool, corrupt: Bool, meta: SaveMeta?) {
        guard let d = store.data(forKey: key(slot)) else { return (true, false, nil) }
        guard let f = try? JSONDecoder().decode(SaveFile.self, from: d) else { return (false, true, nil) }
        return (false, false, f.meta)
    }
    func latest() -> String? {
        saveSlots.compactMap { s -> (String, String)? in meta(s).meta.map { (s, $0.savedAt) } }.max { $0.1 < $1.1 }?.0
    }
    func remove(_ slot: String) { store.removeObject(forKey: key(slot)) }
}

/* ---------- the controller ---------- */

final class AppController: GameListener {
    let game: Game
    let sound = SoundDirector()
    let saves: Saves
    weak var host: AppHost?
    private let store: UserDefaults
    private(set) var settings: GameSettings

    enum Screen: Equatable {
        case firstRun, title, game, journal, reader(String), inventory, pause, saves(Bool), history, help, settings, confirm(Int)
    }
    struct Confirm { let question: String, yes: String, no: String, onYes: () -> Void, onNo: (() -> Void)? }
    private(set) var screen: Screen = .title
    private var stack: [Screen] = []
    private var confirms: [Int: Confirm] = [:]
    private var confirmSeq = 0
    private(set) var model = ScreenModel(title: "", blocks: [])
    private var modelSeq = 0

    // game screen state
    private(set) var lastBeat: [Line] = []
    private(set) var history: [[Line]] = []
    private var submenu: String? = nil
    private var pendingNotes: [String] = []
    private var gameShown = false

    init(content: Content, store: UserDefaults = .standard) {
        self.store = store
        self.saves = Saves(store: store)
        game = Game(content: content)
        if let d = store.data(forKey: "tls.settings"), let s = try? JSONDecoder().decode(GameSettings.self, from: d) { settings = s } else { settings = GameSettings() }
        game.listener = self
        sound.reduceStartles = { [weak self] in self?.settings.reduceStartles ?? false }
        sound.mono = { [weak self] in self?.settings.monoAudio ?? false }
    }

    /// Call once the host and audio are connected.
    func start() {
        applyVolumes()
        show(settings.firstRunDone ? .title : .firstRun)
    }

    func set<T>(_ key: WritableKeyPath<GameSettings, T>, _ value: T) {
        settings[keyPath: key] = value
        if let d = try? JSONEncoder().encode(settings) { store.set(d, forKey: "tls.settings") }
        if (key as AnyKeyPath) == \GameSettings.explorationMusic { updateMusic() }
    }
    func applyVolumes() {
        sound.out?.applyVolumes(master: settings.masterVolume, effects: settings.effectsVolume, ambience: settings.ambienceVolume, music: settings.musicVolume)
    }

    /* ---------- navigation ---------- */

    func show(_ s: Screen, keepStack: Bool = false) {
        if !keepStack { stack = [] }
        screen = s
        build(fresh: true)
    }
    /// Open a screen that comes back to this one when closed.
    func open(_ s: Screen) {
        sound.cue("ui.select")
        stack.append(screen)
        screen = s
        build(fresh: true)
    }
    func back() {
        sound.cue("ui.back")
        if let prev = stack.popLast() { screen = prev } else { screen = game.state != nil ? .game : .title }
        build(fresh: true)
    }
    private func confirm(_ c: Confirm) {
        confirmSeq += 1
        confirms[confirmSeq] = c
        open(.confirm(confirmSeq))
    }

    /// Rebuilds the current screen. `fresh` means it was just opened (or something happened), so focus moves.
    func build(fresh: Bool = false) {
        var m: ScreenModel
        switch screen {
        case .firstRun: m = firstRunScreen()
        case .title: m = titleScreen()
        case .game: m = gameScreen()
        case .journal: m = journalScreen()
        case .reader(let id): m = readerScreen(id)
        case .inventory: m = inventoryScreen()
        case .pause: m = pauseScreen()
        case .saves(let saving): m = savesScreen(saving)
        case .history: m = historyScreen()
        case .help: m = helpScreen()
        case .settings: m = settingsScreen()
        case .confirm(let n): m = confirmScreen(n)
        }
        if fresh { modelSeq += 1 }
        m.id = modelSeq
        model = m
        host?.render()
    }

    /* ---------- engine events ---------- */

    func cue(_ name: String, pan: Double?) {
        sound.cue(name, pan: pan)
        if settings.haptics {
            switch name {
            case "footsteps.heavy", "hit", "stinger.death", "chapter.end": host?.haptic(name == "footsteps.heavy" ? "step" : "heavy")
            case "alarm", "alarm.critical", "locked": host?.haptic("light")
            default: break
            }
        }
    }
    func trustChanged(delta: Double, value: Double, levelLabel: String, levelChanged: Bool) {
        if settings.trustFeedback == "off" { return }
        sound.cue(delta > 0 ? "trust.up" : "trust.down")
        if settings.trustFeedback == "speech" {
            pendingNotes.append("Daniel’s trust \(delta > 0 ? "rose" : "fell")." + (levelChanged ? " He now seems \(levelLabel)." : ""))
        }
    }
    func roomEntered(_ roomId: String) { updateSoundscape() }
    func stateChanged() { updateSoundscape() }

    private func updateSoundscape() {
        guard let s = game.state, let room = game.content.rooms[s.location] else { return }
        let powered = s.flags.contains("power_on")
        let key = "\(powered)|\(s.ward.emilyAlive)|\(s.ward.active ? s.ward.location : "-")"
        sound.setSoundscape(room["soundscape"]?.string, powered: powered, key: key, state: s)
        updateMusic()
    }
    func updateMusic() {
        guard let s = game.state, s.ended == nil, s.gameOver == nil, screen != .title, let room = game.content.rooms[s.location] else { return }
        if settings.explorationMusic, let track = pickMusic(s, room: room) { sound.playMusic(track, fade: 3, level: explorationMusicLevel) }
        else { sound.stopMusic(fade: 2) }
    }

    /* ---------- saving ---------- */

    func autosave() {
        guard game.state != nil else { return }
        let m = game.saveMeta()
        saves.save("auto", game.snapshot(), room: m.room, chapter: m.chapter, clock: m.clock)
    }
    private func saveTo(_ slot: String) -> Bool {
        let m = game.saveMeta()
        let ok = saves.save(slot, game.snapshot(), room: m.room, chapter: m.chapter, clock: m.clock)
        sound.cue(ok ? "saved" : "ui.error")
        return ok
    }
    @discardableResult
    func loadFrom(_ slot: String) -> Bool {
        guard let f = saves.load(slot) else {
            sound.cue("ui.error")
            host?.notify("That save could not be loaded.", assertive: true)
            return false
        }
        game.loadState(f.state)
        history = []
        lastBeat = []
        submenu = nil
        stack = []
        screen = .game
        showBeat(game.resume().lines)
        autosave()
        build(fresh: true)
        return true
    }
    func newGame() {
        history = []
        submenu = nil
        stack = []
        screen = .game
        showBeat(game.newGame().lines)
        autosave()
        build(fresh: true)
    }

    // endings found in any playthrough, kept with the settings
    var endingsSeen: [String] { (store.data(forKey: "tls.endings")).flatMap { try? JSONDecoder().decode([String].self, from: $0) } ?? [] }
    private func recordEnding(_ id: String) {
        var l = endingsSeen
        if !l.contains(id) { l.append(id); store.set(try? JSONEncoder().encode(l), forKey: "tls.endings") }
    }

    /// The app went to the background.
    func didLeave() { autosave(); host?.stopSpeaking() }

    /* ---------- the game screen (web/js/ui/screens/game.js) ---------- */

    static func lineText(_ l: Line) -> String { l.kind == "speech" ? "\(l.speaker ?? ""): “\(l.text)”" : l.text }

    private func showBeat(_ lines: [Line]) {
        var all = lines + pendingNotes.map { Line(text: $0, kind: "system") }
        pendingNotes = []
        if all.isEmpty { all.append(Line(text: "Nothing happens.", kind: "system")) }
        lastBeat = all
        history.append(all)
        if history.count > 200 { history.removeFirst() }
        if settings.speechMode == "selfvoice" { host?.speak(all.map(AppController.lineText).joined(separator: " ")) }
    }

    private func perform(_ fn: () -> Beat, closeSubmenu: Bool = false) {
        let beat = fn()
        if closeSubmenu { submenu = nil }
        showBeat(beat.lines)
        autosave()
        if beat.checkpoint {
            let m = game.saveMeta()
            saves.save("checkpoint", game.snapshot(), room: m.room, chapter: m.chapter, clock: m.clock)
        }
        build(fresh: true)
    }

    private static let positionWord = ["left": "on your left", "right": "on your right", "ahead": "ahead", "behind": "behind you"]
    private static let dirWord = ["north": "North", "south": "South", "east": "East", "west": "West", "up": "Up", "down": "Down", "in": "In", "out": "Out"]

    private func gameScreen() -> ScreenModel {
        if !gameShown { gameShown = true }
        if lastBeat.isEmpty, game.state != nil { showBeat(game.resume().lines) }
        let v = game.view()
        let title = v.mode == "gameOver" ? v.gameOver!.title : v.mode == "chapterEnd" ? v.ended!.title : v.roomName
        if v.mode == "chapterEnd" { sound.playMusic(endMusic(v.ended), loop: false, fade: 4) }
        else if v.mode == "gameOver" { sound.stopMusic() }
        else { updateMusic() }
        if let s = submenu, !v.objects.contains(where: { $0.id == s }) { submenu = nil }
        if v.mode != "explore" { submenu = nil }

        var blocks: [UIBlock] = [.text("Time: \(v.clock)", style: "status"), .narration(lastBeat)]
        switch v.mode {
        case "gameOver": blocks += gameOverControls(v)
        case "chapterEnd": blocks += chapterEndControls()
        case "dialogue": blocks.append(.buttons("Respond", v.choices.enumerated().map { i, c in MenuButton(label: "\(i + 1). \(c.text)") { [unowned self] in perform { game.choose(c.index) } } }))
        default:
            if let s = submenu, let o = v.objects.first(where: { $0.id == s }) { blocks.append(objectControls(o)) } else { blocks += exploreControls(v) }
        }
        if v.mode != "chapterEnd" && v.mode != "gameOver" { blocks.append(menuControls(v)) }
        return ScreenModel(title: title, blocks: blocks, focusNarration: true, isGame: true)
    }

    private func exploreControls(_ v: GameView) -> [UIBlock] {
        let actions = v.roomActions.map { a in MenuButton(label: a.label) { [unowned self] in perform { game.roomAction(a.id) } } }
        let objects = v.objects.map { o in
            MenuButton(label: ([o.name, AppController.positionWord[o.position ?? ""]].compactMap { $0 }).joined(separator: ", "), pan: directionPan[o.position ?? ""] ?? 0, id: o.id) { [unowned self] in
                sound.cue("ui.select")
                submenu = o.id
                build(fresh: true)
            }
        }
        let exits = v.exits.map { e -> MenuButton in
            let label = e.dir == "in" || e.dir == "out" ? e.label : "\(AppController.dirWord[e.dir] ?? e.dir): \(e.label)"
            return MenuButton(label: e.lockedKnown ? "\(label), locked" : label, pan: directionPan[e.dir] ?? 0) { [unowned self] in perform { game.go(e.id) } }
        }
        return [.buttons("Actions", actions), .buttons("Around you", objects), .buttons("Exits", exits)]
    }

    private func objectControls(_ obj: GameView.Object) -> UIBlock {
        var actions = game.objectActions(obj.id).map { a in
            MenuButton(label: a.label, pan: directionPan[obj.position ?? ""] ?? 0) { [unowned self] in perform { game.act(obj.id, a.id) } }
        }
        actions.append(MenuButton(label: "Back to the room") { [unowned self] in
            sound.cue("ui.back")
            submenu = nil
            build(fresh: true)
        })
        return .buttons(obj.name, actions)
    }

    private func menuControls(_ v: GameView) -> UIBlock {
        var items = [
            MenuButton(label: "Repeat last") { [unowned self] in repeatLast() },
            MenuButton(label: "Journal") { [unowned self] in open(.journal) },
            MenuButton(label: "Inventory") { [unowned self] in open(.inventory) },
            MenuButton(label: "Pause menu") { [unowned self] in open(.pause) },
        ]
        if v.mode == "dialogue" { items.remove(at: 2) }
        return .buttons("Menu", items)
    }

    func repeatLast() {
        if settings.speechMode == "selfvoice" { host?.speak(lastBeat.map(AppController.lineText).joined(separator: " ")) }
        build(fresh: true)
    }

    private func chapterEndControls() -> [UIBlock] {
        let s = game.state!
        let content = game.content
        var lines = ["Daniel seems \(trustLevel(s.trust.value).label) toward you."]
        let part = content.chapters[s.chapter]?["part"]?.int ?? 1
        for n in 1...s.chapter where (content.chapters[n]?["part"]?.int ?? 1) == part {
            for l in content.chapters[n]?["summary"]?.array ?? [] where game.evaluate(l["when"]) { if let t = l["text"]?.string { lines.append(t) } }
        }
        for (_, lie) in s.trust.lies.entries {
            lines.append(lie.exposed ? "Daniel caught you lying about \(lie.about)." : "You lied to Daniel about \(lie.about). He has not found out. Yet.")
        }
        let t = game.chapterSummary()
        lines.append("Documents found: \(t.documents.0) of \(t.documents.1).")
        lines.append("Recordings found: \(t.recordings.0) of \(t.recordings.1).")
        lines.append("Hidden discoveries: \(t.secrets.0) of \(t.secrets.1).")

        let hasNext = game.hasNextChapter
        let endingId = s.ended?.ending
        let ending = endingId.flatMap { content.endings[$0] }
        if let endingId, ending != nil { recordEnding(endingId) }
        var blocks: [UIBlock] = [.heading(ending != nil ? "Ending: \(ending!["name"]?.string ?? "")" : "Your choices so far")]
        if let b = ending?["blurb"]?.string { blocks.append(.text(b)) }
        blocks.append(.list(lines))
        if ending != nil {
            blocks.append(.text("Endings found: \(endingsSeen.count) of \(content.endingOrder.count). \(hasNext ? "Part Two continues from this ending." : "Thank you for playing.")"))
        } else {
            blocks.append(.text(hasNext ? "Your progress is saved." : "This is the end of the current build. Your progress is saved, and your choices will carry into the next chapter."))
        }
        var buttons: [MenuButton] = []
        let nextTitle = content.chapters[s.chapter + 1]?["title"]?.string ?? ""
        if ending != nil {
            if hasNext { buttons.append(MenuButton(label: "Continue to Part Two: \(nextTitle)") { [unowned self] in perform { game.startNextChapter() } }) }
            buttons.append(MenuButton(label: "Go back to the final choice") { [unowned self] in loadFrom("checkpoint") })
        } else if hasNext {
            buttons.append(MenuButton(label: "Continue to \(nextTitle)") { [unowned self] in perform { game.startNextChapter() } })
        }
        if ending == nil { buttons.append(MenuButton(label: "Keep exploring Chapter \(s.chapter)") { [unowned self] in perform { game.continueAfterChapter() } }) }
        buttons.append(MenuButton(label: "Return to the main menu") { [unowned self] in show(.title) })
        blocks.append(.buttons("What next", buttons))
        return blocks
    }

    private func gameOverControls(_ v: GameView) -> [UIBlock] {
        var buttons: [MenuButton] = []
        if !saves.meta("checkpoint").empty { buttons.append(MenuButton(label: "Try again from the last checkpoint") { [unowned self] in loadFrom("checkpoint") }) }
        buttons.append(MenuButton(label: "Return to the main menu") { [unowned self] in show(.title) })
        return [.heading("You died"), .text(v.gameOver?.text ?? ""), .buttons(nil, buttons)]
    }

    /* ---------- menus (web/js/ui/screens/menus.js) ---------- */

    private func firstRunScreen() -> ScreenModel {
        let choose = { [unowned self] (mode: String) in
            set(\.speechMode, mode)
            set(\.firstRunDone, true)
            sound.cue("ui.select")
            show(.title)
        }
        return ScreenModel(title: "Welcome to The Last Signal", blocks: [
            .text("This game is designed to be played entirely by sound and text, without needing to see the screen. Headphones are strongly recommended: sounds on your left and right tell you where things are."),
            .text("How would you like the game to speak to you? You can change this later in Settings."),
            .buttons("Choose how to play", [
                MenuButton(label: "I use a screen reader, such as VoiceOver") { choose("screenreader") },
                MenuButton(label: "Read the game aloud to me") { choose("selfvoice") },
                MenuButton(label: "I will read the text myself") { choose("text") },
            ]),
        ])
    }

    private func titleScreen() -> ScreenModel {
        sound.setSoundscape("outdoor_rain", powered: false, key: "title", state: nil)
        sound.playMusic("music-title")
        let latest = saves.latest()
        var items: [MenuButton] = []
        if let latest { items.append(MenuButton(label: "Continue") { [unowned self] in loadFrom(latest) }) }
        items.append(MenuButton(label: "New game") { [unowned self] in
            if latest == nil { return newGame() }
            confirm(Confirm(question: "Start a new game? Your autosave will be replaced. Saves in numbered slots are kept.", yes: "Start a new game", no: "Cancel", onYes: { [unowned self] in newGame() }, onNo: nil))
        })
        if latest != nil { items.append(MenuButton(label: "Load game") { [unowned self] in open(.saves(false)) }) }
        items.append(MenuButton(label: "Settings") { [unowned self] in open(.settings) })
        items.append(MenuButton(label: "How to play") { [unowned self] in open(.help) })
        if settings.speechMode == "selfvoice" { host?.speak("The Last Signal. Main menu.") }
        return ScreenModel(title: "The Last Signal", blocks: [
            .text("A psychological horror investigation. Played by ear.", style: "tagline"),
            .buttons("Main menu", items),
            .text("Parts One and Two: twelve chapters, ten endings.", style: "fineprint"),
        ])
    }

    private func confirmScreen(_ n: Int) -> ScreenModel {
        guard let c = confirms[n] else { return ScreenModel(title: "Are you sure?", blocks: []) }
        return ScreenModel(title: "Are you sure?", blocks: [
            .text(c.question),
            .buttons("Choose", [
                MenuButton(label: c.yes) { c.onYes() },
                MenuButton(label: c.no) { [unowned self] in if let no = c.onNo { no() } else { back() } },
            ]),
        ])
    }

    private func pauseScreen() -> ScreenModel {
        let m = game.saveMeta()
        return ScreenModel(title: "Paused", blocks: [
            .text("\(m.room). \(m.clock).", style: "status"),
            .buttons("Pause menu", [
                MenuButton(label: "Resume") { [unowned self] in back() },
                MenuButton(label: "Save game") { [unowned self] in open(.saves(true)) },
                MenuButton(label: "Load game") { [unowned self] in open(.saves(false)) },
                MenuButton(label: "Message history") { [unowned self] in open(.history) },
                MenuButton(label: "Settings") { [unowned self] in open(.settings) },
                MenuButton(label: "How to play") { [unowned self] in open(.help) },
                MenuButton(label: "Quit to main menu") { [unowned self] in
                    autosave()
                    confirm(Confirm(question: "Quit to the main menu? Your progress has been autosaved.", yes: "Quit to main menu", no: "Stay", onYes: { [unowned self] in show(.title) }, onNo: nil))
                },
            ]),
        ])
    }

    private func describeSlot(_ slot: String) -> String {
        let name = slot == "auto" ? "Autosave" : slot == "checkpoint" ? "Checkpoint" : "Slot \(slot)"
        let s = saves.meta(slot)
        if s.empty { return "\(name): empty" }
        guard let m = s.meta else { return "\(name): damaged save" }
        var when = ""
        if let d = ISO8601DateFormatter().date(from: m.savedAt) {
            let f = DateFormatter(); f.dateStyle = .medium; f.timeStyle = .short
            when = f.string(from: d)
        }
        return "\(name): \(m.room), Chapter \(m.chapter), \(m.clock) in game. Saved \(when)."
    }

    private func savesScreen(_ saving: Bool) -> ScreenModel {
        let slots = saveSlots.filter { !(saving && ($0 == "auto" || $0 == "checkpoint")) }
        let buttons = slots.map { slot in
            MenuButton(label: describeSlot(slot)) { [unowned self] in
                let s = saves.meta(slot)
                if saving {
                    let doSave = { [unowned self] in
                        let ok = saveTo(slot)
                        if case .confirm = screen { stack.removeLast(); screen = .saves(true) }
                        build(fresh: true)
                        host?.notify(ok ? "Saved to slot \(slot)." : "Saving failed. Storage may be full.", assertive: true)
                    }
                    if s.empty { return doSave() }
                    confirm(Confirm(question: "Overwrite \(describeSlot(slot))", yes: "Overwrite", no: "Cancel", onYes: doSave, onNo: { [unowned self] in back() }))
                } else {
                    if s.empty || s.corrupt {
                        sound.cue("ui.error")
                        return host?.notify(s.empty ? "That slot is empty." : "That save is damaged and cannot be loaded.", assertive: false) ?? ()
                    }
                    loadFrom(slot)
                }
            }
        }
        return ScreenModel(title: saving ? "Save game" : "Load game", blocks: [
            .text(saving ? "Choose a slot to save to. The game also autosaves after every action." : "Choose a save to load."),
            .buttons("Save slots", buttons),
            .buttons(nil, [MenuButton(label: "Back") { [unowned self] in back() }]),
        ])
    }

    private func historyScreen() -> ScreenModel {
        ScreenModel(title: "Message history", blocks: [
            .text(history.isEmpty ? "Nothing yet." : "Everything that has happened this session, oldest first. The most recent is at the end."),
            .list(history.map { $0.map(AppController.lineText).joined(separator: " ") }),
            .buttons(nil, [MenuButton(label: "Back") { [unowned self] in back() }]),
        ])
    }

    private static let glossary: [(String, String)] = [
        ("signal", "The signal: three short tones and one long. The reason you are here."),
        ("radio.static", "Radio: someone is talking to you over a radio."),
        ("speaker.hum", "Facility speakers: someone is talking through the building."),
        ("trust.up", "Trust rises: Daniel trusts you a little more."),
        ("trust.down", "Trust falls: Daniel trusts you a little less."),
        ("objective", "New objective."),
        ("objective.done", "Objective complete."),
        ("document", "A document or recording was added to your journal."),
        ("pickup", "An item was added to your inventory."),
        ("locked", "The way is locked or blocked."),
        ("secret", "You found something hidden."),
        ("monitor", "Emily’s heart monitor."),
        ("alarm", "Emily’s monitor alarm: she needs attention soon."),
        ("alarm.critical", "Urgent alarm: Emily is in danger right now."),
        ("footsteps.heavy", "Prototype 001, one room away. The ear tells you which side."),
        ("footsteps.far", "Prototype 001, two rooms away."),
    ]

    private func helpScreen() -> ScreenModel {
        ScreenModel(title: "How to play", blocks: [
            .heading("The basics"),
            .text("You explore the facility one place at a time. After every action, the game moves your focus to the text describing what happened. Swipe right to reach your options."),
            .list([
                "Actions: look around, listen, or use your radio.",
                "Around you: things you can examine or use. Their position, left, right or ahead, is also played in that ear.",
                "Exits: the ways out of this place, with their direction.",
                "Menu: repeat the last text, your journal, inventory, and the pause menu.",
            ]),
            .text("Every group starts with a heading, so you can jump between groups with the VoiceOver rotor set to Headings. A two-finger double-tap opens the pause menu."),
            .heading("Listening"),
            .text("Listen is a real tool, not decoration. Some things in the facility can only be found by listening for them. Time passes as you act, not while you read, so take as long as you need."),
            .heading("Daniel and trust"),
            .text("How honest you are, and what you choose to say, changes how much Daniel trusts you. Lies are remembered, and can be discovered later. By default a soft sound plays when his trust changes. You can turn that off, or have it spoken, in Settings."),
            .buttons("Sound glossary", AppController.glossary.map { cue, label in MenuButton(label: "Play: \(label)") { [unowned self] in sound.cue(cue) } }),
            .buttons(nil, [MenuButton(label: "Back") { [unowned self] in back() }]),
        ])
    }

    private func settingsScreen() -> ScreenModel {
        var blocks: [UIBlock] = [.heading("Speech")]
        blocks.append(.picker(label: "How the game speaks", hint: "Choose \"Use my screen reader\" if you have VoiceOver turned on. The built-in voice is for players who do not use one.",
                              options: [("screenreader", "Use my screen reader"), ("selfvoice", "Read aloud with the built-in voice"), ("text", "Text only")],
                              selected: settings.speechMode, set: { [unowned self] in set(\.speechMode, $0); build() }))
        blocks.append(.picker(label: "Built-in voice speed", hint: nil,
                              options: [("0.8", "Slow"), ("1", "Normal"), ("1.25", "Fast"), ("1.5", "Very fast"), ("1.8", "Fastest")],
                              selected: jsNum(settings.voiceRate), set: { [unowned self] in set(\.voiceRate, Double($0) ?? 1); build() }))
        let voices = host?.voices() ?? []
        if !voices.isEmpty {
            blocks.append(.picker(label: "Built-in voice", hint: nil, options: [("", "Default")] + voices.map { ($0.id, $0.name) },
                                  selected: settings.voiceName, set: { [unowned self] in set(\.voiceName, $0); build() }))
        }
        blocks.append(.buttons(nil, [MenuButton(label: "Test the built-in voice") { [unowned self] in
            if settings.speechMode != "selfvoice" { host?.notify("The built-in voice is only used when \"Read aloud with the built-in voice\" is selected.", assertive: false) }
            else { host?.speak("Unit 14, dispatch. Status check on the signal call, over.") }
        }]))
        blocks.append(.heading("Sound"))
        for (label, key) in [("Master volume", \GameSettings.masterVolume), ("Ambience volume", \GameSettings.ambienceVolume), ("Effects volume", \GameSettings.effectsVolume), ("Music volume", \GameSettings.musicVolume)] {
            blocks.append(.slider(label: label, value: settings[keyPath: key], set: { [unowned self] in set(key, $0); applyVolumes() },
                                  done: { [unowned self] in sound.cue(key == \GameSettings.ambienceVolume ? "signal" : "ui.select") }))
        }
        blocks.append(.toggle(label: "Music while exploring", hint: "Quiet music under every chapter. Turn off if it ever covers VoiceOver.", value: settings.explorationMusic, set: { [unowned self] in set(\.explorationMusic, $0) }))
        blocks.append(.toggle(label: "Mono audio", hint: "Plays every sound in both ears. Directions are still spoken in text.", value: settings.monoAudio, set: { [unowned self] in set(\.monoAudio, $0) }))
        blocks.append(.toggle(label: "Reduce sudden loud sounds", hint: nil, value: settings.reduceStartles, set: { [unowned self] in set(\.reduceStartles, $0) }))
        blocks.append(.toggle(label: "Vibration", hint: "Feel 001's footsteps, alarms and locked doors.", value: settings.haptics, set: { [unowned self] in set(\.haptics, $0) }))
        blocks.append(.buttons("Headphone check", [
            MenuButton(label: "Play a sound on the left", pan: -0.9) { [unowned self] in sound.cue("door", pan: -0.9) },
            MenuButton(label: "Play a sound on the right", pan: 0.9) { [unowned self] in sound.cue("door", pan: 0.9) },
        ]))
        blocks.append(.heading("Gameplay"))
        blocks.append(.picker(label: "When Daniel’s trust changes", hint: "Turning this off makes his feelings harder to read, as they would be in person.",
                              options: [("sound", "Play a soft sound"), ("speech", "Play a sound and say it"), ("off", "Tell me nothing")],
                              selected: settings.trustFeedback, set: { [unowned self] in set(\.trustFeedback, $0); build() }))
        blocks.append(.heading("Display"))
        blocks.append(.picker(label: "Text size", hint: nil, options: [("normal", "Normal"), ("large", "Large"), ("larger", "Larger")],
                              selected: settings.textSize, set: { [unowned self] in set(\.textSize, $0); build() }))
        blocks.append(.toggle(label: "High contrast", hint: nil, value: settings.highContrast, set: { [unowned self] in set(\.highContrast, $0); build() }))
        blocks.append(.buttons("Finish", [
            MenuButton(label: "Reset all settings to default") { [unowned self] in
                let keep = settings.firstRunDone
                settings = GameSettings(); settings.firstRunDone = keep
                set(\.firstRunDone, keep)
                applyVolumes()
                build(fresh: true)
                host?.notify("Settings reset.", assertive: false)
            },
            MenuButton(label: "Back") { [unowned self] in back() },
        ]))
        return ScreenModel(title: "Settings", blocks: blocks)
    }

    /* ---------- journal (web/js/ui/screens/journal.js) ---------- */

    private func journalScreen() -> ScreenModel {
        let s = game.state!
        let c = game.content
        let active = game.objectives("active").map { $0.text }
        let done = game.objectives("done").map { $0.text }
        func entry(_ id: String, _ e: JSON?) -> MenuButton {
            MenuButton(label: "\(e?["title"]?.string ?? id)\(s.journal.read.contains(id) ? "" : ", unread")") { [unowned self] in open(.reader(id)) }
        }
        let docs = s.journal.documents.map { entry($0, c.documents[$0]) }
        let recs = s.journal.recordings.map { entry($0, c.recordings[$0]) }
        var blocks: [UIBlock] = [.heading("Current objectives"), active.isEmpty ? .text("None right now.") : .list(active)]
        if !done.isEmpty { blocks += [.heading("Completed"), .list(done)] }
        if docs.isEmpty { blocks += [.heading("Documents"), .text("None found yet.")] } else { blocks.append(.buttons("Documents, \(docs.count)", docs)) }
        if !recs.isEmpty { blocks.append(.buttons("Recordings, \(recs.count)", recs)) }
        blocks.append(.buttons(nil, [MenuButton(label: "Back") { [unowned self] in back() }]))
        return ScreenModel(title: "Journal", blocks: blocks)
    }

    private func readerScreen(_ id: String) -> ScreenModel {
        let c = game.content
        let entry = c.documents[id] ?? c.recordings[id]
        let isRecording = c.recordings[id] != nil
        if !(game.state.journal.read.contains(id)) {
            game.markRead(id)
            autosave()
            sound.cue(isRecording ? "tape" : "document")
            if settings.speechMode == "selfvoice" { host?.speak("\(entry?["title"]?.string ?? ""). \((entry?["text"]?.strings ?? []).joined(separator: " "))") }
        }
        return ScreenModel(title: entry?["title"]?.string ?? "", blocks: [
            .text(isRecording ? "Recording transcript" : "Document", style: "kind"),
        ] + (entry?["text"]?.strings ?? []).map { .text($0) } + [
            .buttons(nil, [MenuButton(label: "Back to journal") { [unowned self] in back() }]),
        ])
    }

    private func inventoryScreen() -> ScreenModel {
        let items = game.state.inventory.map { id -> String in
            let it = game.content.items[id]
            return "\(it?["name"]?.string ?? id): \(it?["description"]?.string ?? "")"
        }
        return ScreenModel(title: "Inventory", blocks: [
            .text(items.isEmpty ? "You are carrying nothing." : "You are carrying \(items.count) \(items.count == 1 ? "thing" : "things"). Items are used automatically: when an item can help, a new option appears on the thing it works with."),
            .list(items),
            .buttons(nil, [MenuButton(label: "Back") { [unowned self] in back() }]),
        ])
    }
}
