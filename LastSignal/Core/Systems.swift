import Foundation

// The systems, each ported from web/js/systems/*.js.

let directionOrder = ["north", "east", "south", "west", "up", "down", "in", "out"]
let directionPan: [String: Double] = [
    "north": 0, "south": 0, "east": 0.8, "west": -0.8, "up": 0, "down": 0, "in": 0, "out": 0,
    "left": -0.6, "right": 0.6, "ahead": 0, "behind": 0,
]

struct TrustLevel { let id: String, min: Double, label: String }
let trustLevels = [
    TrustLevel(id: "hostile", min: -100, label: "hostile"),
    TrustLevel(id: "distrustful", min: -40, label: "distrustful"),
    TrustLevel(id: "wary", min: -10, label: "wary"),
    TrustLevel(id: "cautious", min: 20, label: "cautiously open"),
    TrustLevel(id: "trusting", min: 50, label: "trusting"),
]
func trustLevel(_ value: Double) -> TrustLevel {
    var level = trustLevels[0]
    for l in trustLevels where value >= l.min { level = l }
    return level
}

private func joinList(_ items: [String]) -> String {
    if items.count <= 1 { return items.joined() }
    return items.dropLast().joined(separator: ", ") + " and " + items.last!
}
private func nonEmpty(_ s: String?) -> String? { (s?.isEmpty ?? true) ? nil : s }
private func lowerFirst(_ t: String) -> String { t.prefix(1).lowercased() + t.dropFirst() }

extension Game {
    /* ================= world: rooms, exits, objects, inventory ================= */

    func room() -> JSON {
        guard let r = content.rooms[state.location] else { fatalError("Unknown room \(state.location)") }
        return r
    }

    func give(_ itemId: String) {
        guard let item = content.items[itemId] else { fatalError("Unknown item \(itemId)") }
        if !state.inventory.contains(itemId) {
            state.inventory.append(itemId)
            cue("pickup")
            say("Added to inventory: \(item["name"]?.string ?? itemId).", kind: "system")
        }
    }

    func visibleObjects() -> [JSON] { (room()["objects"]?.array ?? []).filter { evaluate($0["when"]) } }

    func visibleExits() -> [JSON] {
        let list = (room()["exits"]?.array ?? []).filter { evaluate($0["when"]) }
        func rank(_ e: JSON) -> Int { directionOrder.firstIndex(of: e["dir"]?.string ?? "") ?? -1 }
        return list.enumerated().sorted { (rank($0.element), $0.offset) < (rank($1.element), $1.offset) }.map { $0.element }
    }

    func exitLabel(_ exit: JSON) -> String {
        if let l = exit["label"]?.string, !l.isEmpty { return l }
        let to = exit["to"]?.string ?? ""
        return content.rooms[to]?["name"]?.string ?? to
    }

    /// `locked: true` is locked for good; anything else is a condition.
    func isLocked(_ exit: JSON) -> Bool {
        guard let locked = exit["locked"] else { return false }
        if locked == .bool(true) { return true }
        return locked.truthy ? evaluate(locked) : false
    }

    private func doneKey(_ room: String, _ obj: String, _ action: String) -> String { "done:\(room):\(obj):\(action)" }
    private func triedLockedKey(_ room: String, _ exit: String) -> String { "lockedKnown:\(room):\(exit)" }

    func lockedKnown(_ exit: JSON) -> Bool {
        state.flags.contains(triedLockedKey(room()["id"]?.string ?? "", exit["id"]?.string ?? "")) && isLocked(exit)
    }

    func objectActionList(_ objectId: String) -> [JSON] {
        guard let obj = visibleObjects().first(where: { $0["id"]?.string == objectId }) else { return [] }
        let roomId = room()["id"]?.string ?? ""
        return (obj["actions"]?.array ?? []).filter { a in
            if !evaluate(a["when"]) { return false }
            if a["once"]?.truthy == true && a["hideAfter"]?.truthy == true && state.flags.contains(doneKey(roomId, objectId, a["id"]?.string ?? "")) { return false }
            return true
        }
    }

    private func details(_ list: JSON?) -> [String] {
        (list?.array ?? []).filter { evaluate($0["when"]) }.compactMap { $0["text"]?.string }
    }

    private func summary() -> String {
        let objs = visibleObjects().map { ($0["name"]?.string ?? "").lowercased() }
        let exits = visibleExits().map { e -> String in
            let dir = e["dir"]?.string ?? ""
            return dir == "in" || dir == "out" ? lowerFirst(exitLabel(e)) : "\(dir): \(lowerFirst(exitLabel(e)))"
        }
        var parts: [String] = []
        if !objs.isEmpty { parts.append("You notice \(joinList(objs)).") }
        if !exits.isEmpty { parts.append("Ways out: \(exits.joined(separator: "; ")).") }
        return parts.joined(separator: " ")
    }

    private func describe(full: Bool) {
        let r = room()
        let firstTime = !state.visited.contains(r["id"]?.string ?? "")
        let base = full || firstTime || r["revisit"] == nil ? r["description"] : r["revisit"]
        say(pickText(base))
        for d in details(r["details"]) { say(d) }
        say(summary(), kind: "summary")
    }

    func enterRoom(_ roomId: String) {
        guard let r = content.rooms[roomId] else { fatalError("Unknown room \(roomId)") }
        if state.location != roomId { state.previousRoom = state.location }
        state.location = roomId
        listener?.roomEntered(roomId)
        say(r["name"]?.string, kind: "heading")
        describe(full: false)
        state.visited.insert(roomId)
    }

    func describeHere() {
        say(room()["name"]?.string, kind: "heading")
        describe(full: false)
    }

    func lookAround() {
        cue("ui.select")
        describe(full: true)
        advanceTime(1)
    }

    func listenHere() {
        let l = room()["listen"]
        cue("listen")
        say(nonEmpty(pickText(l?["text"])) ?? "You hold still and listen. Nothing stands out.")
        for d in details(l?["details"]) { say(d) }
        apply(l?["effects"])
        stalkerListen()
        advanceTime(1)
    }

    func goExit(_ exitId: String) {
        guard let exit = visibleExits().first(where: { $0["id"]?.string == exitId }) else {
            return say("You cannot go that way.", kind: "system")
        }
        let dir = exit["dir"]?.string ?? ""
        if isLocked(exit) {
            state.flags.insert(triedLockedKey(room()["id"]?.string ?? "", exitId))
            cue("locked", pan: directionPan[dir])
            say(nonEmpty(pickText(exit["lockedText"])) ?? "The way is blocked.")
            return
        }
        cue(exit["sound"]?.string ?? "door", pan: directionPan[dir])
        if let t = exit["text"]?.string { say(t) }
        apply(exit["effects"])
        enterRoom(exit["to"]?.string ?? "")
        advanceTime(exit["time"]?.int ?? 2)
    }

    func actOn(_ objectId: String, _ actionId: String) {
        let roomId = room()["id"]?.string ?? ""
        guard let obj = visibleObjects().first(where: { $0["id"]?.string == objectId }),
              let action = objectActionList(objectId).first(where: { $0["id"]?.string == actionId }) else {
            return say("That is not possible right now.", kind: "system")
        }
        let key = doneKey(roomId, objectId, actionId)
        let alreadyDone = state.flags.contains(key)
        let once = action["once"]?.truthy == true
        if let c = action["cue"]?.string { cue(c, pan: directionPan[obj["position"]?.string ?? ""]) }
        if alreadyDone && once {
            say(pickText(action["afterText"] ?? action["text"]))
        } else {
            if action["text"] != nil { say(pickText(action["text"])) }
            apply(action["effects"])
            if once { state.flags.insert(key) }
        }
        advanceTime(action["time"]?.int ?? 1)
    }

    /* ================= dialogue ================= */

    private static let viaPhrase = ["radio": "over the radio", "speaker": "through the facility speakers", "dispatch": "on your police radio"]

    func speakerName(_ id: String) -> String {
        if id == "player" { return "You" }
        guard let sp = content.speakers[id] else { return id }
        return (sp["names"]?.array ?? []).first { evaluate($0["when"]) }?["name"]?.string ?? id
    }

    private func node() -> JSON? {
        guard let a = state.dialogue else { return nil }
        guard let n = content.dialogues[a.id]?["nodes"]?[a.node] else { fatalError("Missing dialogue node \(a.id).\(a.node)") }
        return n
    }

    private func resolveNext(_ next: JSON?) -> String? {
        guard let next, next.truthy else { return nil }
        if let s = next.string { return s }
        guard let route = (next.array ?? []).first(where: { evaluate($0["when"]) }) else { fatalError("No dialogue route matched") }
        return route["node"]?.string
    }

    private func sayLine(_ raw: JSON, _ n: JSON) {
        let line: JSON = raw.string != nil ? .object([("text", raw)]) : raw
        if !evaluate(line["when"]) { return }
        if let narration = line["narration"]?.string { return say(narration) }
        let speaker = line["speaker"]?.string ?? n["speaker"]?.string ?? ""
        let via = line["via"]?.string ?? n["via"]?.string ?? ""
        let name = speakerName(speaker)
        let phrase = speaker != "player" && Game.viaPhrase[via] != nil ? ", " + Game.viaPhrase[via]! : ""
        say(line["text"]?.string, kind: "speech", speaker: name + phrase, speakerId: speaker)
    }

    private func showNode(_ dialogueId: String, _ nodeId: String) {
        state.dialogue = DialoguePos(id: dialogueId, node: nodeId)
        state.dialogueSeen.insert("\(dialogueId).\(nodeId)")
        guard let n = node() else { return }
        let via = n["via"]?.string
        if via == "radio" || via == "dispatch" { cue("radio.static") }
        if via == "speaker" { cue("speaker.hum") }
        for line in n["lines"]?.array ?? [] { sayLine(line, n) }
        apply(n["effects"])
        if n["end"]?.truthy == true { endDialogue() }
    }

    func startDialogue(_ id: String) {
        guard let d = content.dialogues[id] else { fatalError("Unknown dialogue \(id)") }
        showNode(id, resolveNext(d["start"]) ?? "")
    }

    func endDialogue() { state.dialogue = nil }

    func dialogueChoices() -> [View.ChoiceItem] {
        guard let n = node() else { return [] }
        let list = (n["choices"]?.array ?? []).enumerated().filter { evaluate($0.element["when"]) }
        if !list.isEmpty { return list.map { View.ChoiceItem(index: $0.offset, text: $0.element["text"]?.string ?? "") } }
        return [View.ChoiceItem(index: -1, text: n["next"]?.truthy == true ? "Continue" : "End conversation")]
    }

    func chooseDialogue(_ index: Int) {
        guard let n = node(), let a = state.dialogue else { return }
        if index == -1 {
            if n["next"]?.truthy == true, let next = resolveNext(n["next"]) { showNode(a.id, next) } else { endDialogue() }
            return
        }
        guard let choice = n["choices"]?[index], evaluate(choice["when"]) else {
            return say("That option is not available.", kind: "system")
        }
        cue("ui.select")
        if choice["echo"] != .bool(false) {
            sayLine(.object([("speaker", .string("player")), ("text", choice["echo"]?.string.map { JSON.string($0) } ?? choice["text"] ?? .null)]), n)
        }
        apply(choice["effects"])
        if state.dialogue == nil { return } // an effect ended it
        if choice["end"]?.truthy == true || choice["next"]?.truthy != true { endDialogue() }
        else if let next = resolveNext(choice["next"]) { showNode(a.id, next) }
    }

    /// Repeat the current node's lines (after loading a save mid-conversation).
    func replayDialogue() {
        guard let n = node() else { return }
        for line in n["lines"]?.array ?? [] { sayLine(line, n) }
    }

    /* ================= Daniel's trust ================= */

    func changeTrust(_ amount: Double, reason: String?) {
        let before = state.trust.value
        state.trust.value = max(-100, min(100, before + amount))
        let delta = state.trust.value - before
        if delta == 0 { return }
        state.trust.history.append(TrustEvent(delta: delta, reason: reason ?? "", at: state.minutes))
        let lvl = trustLevel(state.trust.value)
        listener?.trustChanged(delta: delta, value: state.trust.value, levelLabel: lvl.label, levelChanged: trustLevel(before).id != lvl.id)
    }

    /* ================= journal ================= */

    func addDocument(_ id: String) {
        guard let doc = content.documents[id] else { fatalError("Unknown document \(id)") }
        if state.journal.documents.contains(id) { return }
        state.journal.documents.append(id)
        cue("document")
        say("Added to journal: \(doc["title"]?.string ?? id). Open your journal to read it in full.", kind: "system")
    }

    func addRecording(_ id: String) {
        guard let rec = content.recordings[id] else { fatalError("Unknown recording \(id)") }
        if state.journal.recordings.contains(id) { return }
        state.journal.recordings.append(id)
        cue("document")
        say("Recording saved to journal: \(rec["title"]?.string ?? id).", kind: "system")
    }

    func setObjective(_ v: JSON) {
        let id = v.string ?? v["id"]?.string ?? ""
        let status = v.string != nil ? "active" : (v["status"]?.string ?? "active")
        guard let obj = content.objectives[id] else { fatalError("Unknown objective \(id)") }
        if state.objectives[id] == status { return }
        state.objectives[id] = status
        cue(status == "done" ? "objective.done" : "objective")
        let prefix = status == "done" ? "Objective complete" : status == "failed" ? "Objective failed" : "New objective"
        say("\(prefix): \(obj["text"]?.string ?? "")", kind: "system")
    }

    /* ================= Emily's life support ================= */

    private func describeStability(_ v: Double) -> String {
        if v > 75 { return "stable" }
        if v > 50 { return "steady, but should be checked soon" }
        if v > 25 { return "weakening" }
        if v > 10 { return "in danger" }
        return "critical"
    }

    func wardReport() -> String {
        let w = state.ward
        if !w.emilyAlive { return "The monitor shows a flat line. Emily is gone." }
        if state.flags.contains("emily_awake") { return "Emily is awake, resting in the medical ward. Her monitor no longer needs watching." }
        let whereText = w.location == "ward" ? "the medical ward" : "her capsule in the preservation lab"
        return "Emily’s monitor, from \(whereText): power \(jsNum(jsRound(w.power))) percent. Her condition: \(describeStability(w.stability)), \(jsNum(jsRound(w.stability))) percent."
    }

    private func warn(_ kind: String, _ level: Int, _ text: String) {
        let key = "\(kind)\(level)"
        if state.ward.warned.contains(key) { return }
        state.ward.warned.insert(key)
        if level <= 25 { state.flags.insert("ward_alarm_heard") }
        cue(level <= 10 ? "alarm.critical" : level <= 25 ? "alarm" : "monitor")
        say(text, kind: "alert")
    }

    private func rearm(_ kind: String, _ value: Double) {
        for t in [50, 25, 10] where value > Double(t) { state.ward.warned.remove("\(kind)\(t)") }
        if kind == "power" && value > 0 { state.ward.warned.remove("power0") }
    }

    func wardTick() {
        guard state.ward.active && state.ward.emilyAlive else { return }
        let flags = state.flags
        if !flags.contains("ward_mains") { state.ward.power = max(0, state.ward.power - 1) }
        let w = state.ward
        var drain = w.power > 0 ? 0.6 : 4
        if w.power > 0 && w.checks >= 3 { drain *= 0.6 }
        if w.power > 0 && flags.contains("daniel_watching") { drain *= 0.35 }
        state.ward.stability = max(0, w.stability - drain)

        let inWard = state.ward.location == "ward"
        let fixStability = inWard ? " Go to the medical ward and choose Check on Emily." : " She needs the medical ward: power its door, then wheel her capsule there."
        let fixPower = inWard ? " Put a power cell in the medical ward’s power bay." : " Put a power cell in her capsule, in the preservation lab."
        for t in [50, 25, 10] {
            let p = state.ward.power, s = state.ward.stability, td = Double(t)
            if p <= td && p > 0 {
                let pct = jsNum(jsRound(p))
                warn("power", t, t <= 10 ? "Radio alarm: Emily’s power is almost gone, \(pct) percent. Find a power cell now.\(fixPower)"
                     : t <= 25 ? "Radio alarm: Emily’s power is at \(pct) percent.\(fixPower)"
                     : "Your radio chirps quietly: Emily’s power is at \(pct) percent.\(fixPower)")
            }
            if s <= td {
                warn("stab", t, t <= 10 ? "Radio alarm, urgent: Emily is critical. Get to her now, or she will die.\(fixStability)"
                     : t <= 25 ? "Radio alarm: Emily’s condition is getting worse. She needs you to check on her.\(fixStability)"
                     : "Your radio chirps quietly: Emily’s condition is slipping. Check on her when you can.\(fixStability)")
            }
        }
        if state.ward.power == 0 { warn("power", 0, "Radio alarm: Emily’s power has run out. Her life support is failing.\(fixPower)") }
        if state.ward.stability <= 0 {
            state.ward.emilyAlive = false
            state.ward.active = false
            state.flags.insert("emily_dead")
            cue("flatline")
            say("Your radio gives one long, unbroken tone. Then nothing. Emily’s monitor has flatlined.", kind: "alert")
        }
    }

    func wardEffect(_ name: String, _ v: JSON) {
        switch name {
        case "wardStart":
            if state.ward.active || !state.ward.emilyAlive { return }
            state.ward.active = true; state.ward.location = "capsule"
            state.ward.power = v["power"]?.number ?? 0; state.ward.stability = v["stability"]?.number ?? 0
        case "wardMoveIn":
            if !state.ward.emilyAlive { return }
            state.ward.location = "ward"
            state.ward.power = max(state.ward.power, v["power"]?.number ?? 0)
            rearm("power", state.ward.power)
        case "wardAddPower":
            state.ward.power = min(100, state.ward.power + (v.number ?? 0))
            rearm("power", state.ward.power)
            say("Emily’s power is now \(jsNum(jsRound(state.ward.power))) percent.", kind: "system")
        case "wardStabilize":
            if !state.ward.emilyAlive { return }
            let amount = v.number ?? 0
            state.ward.stability = min(100, max(state.ward.stability, amount))
            if amount >= 100 { state.ward.checks += 1 }
            rearm("stab", state.ward.stability)
            say("Emily’s condition: \(describeStability(state.ward.stability)).", kind: "system")
        case "wardEnd":
            state.ward.active = false
            state.flags.insert("emily_awake")
        default: // wardReport
            say(wardReport(), kind: "system")
        }
    }

    /* ================= Prototype 001 ================= */

    private struct Located { var distance: Int; var dir: String? }

    /// Shortest path length and first direction from the player to a room (up to four rooms away).
    private func locate(_ target: String?) -> Located {
        let from = state.location
        guard let target else { return Located(distance: Int.max) }
        if from == target { return Located(distance: 0) }
        var seen: Set<String> = [from]
        var frontier: [(room: String, dir: String)] = (content.rooms[from]?["exits"]?.array ?? [])
            .filter { $0["to"]?.string != from }.map { ($0["to"]?.string ?? "", $0["dir"]?.string ?? "") }
        var distance = 1
        while distance <= 4 && !frontier.isEmpty {
            if let hit = frontier.first(where: { $0.room == target }) { return Located(distance: distance, dir: hit.dir) }
            var next: [(room: String, dir: String)] = []
            for f in frontier {
                if seen.contains(f.room) { continue }
                seen.insert(f.room)
                for e in content.rooms[f.room]?["exits"]?.array ?? [] {
                    let to = e["to"]?.string ?? ""
                    if !seen.contains(to) { next.append((to, f.dir)) }
                }
            }
            frontier = next
            distance += 1
        }
        return Located(distance: Int.max)
    }

    private func roomWord(_ id: String) -> String {
        content.rooms[id]?["shortName"]?.string ?? (content.rooms[id]?["name"]?.string ?? id).lowercased()
    }
    private static let stalkerPan: [String: Double] = ["north": 0, "south": 0, "east": 0.8, "west": -0.8]
    private func dirWord(_ d: String?) -> String {
        let words = ["north": "ahead of you, to the north", "south": "behind you, to the south", "east": "on your right, to the east",
                     "west": "on your left, to the west", "up": "above you, up the lift shaft", "down": "below you"]
        return words[d ?? ""] ?? (d ?? "")
    }

    private var stalkerRecharging: Bool { state.stalker.active && state.minutes < state.stalker.rechargeUntil }
    private var route: [String] { content.stalkerRoute }
    private func stalkerNextRoom() -> String { route[(state.stalker.step + 1) % route.count] }

    private func stalkerMove() {
        let before = locate(state.stalker.room)
        state.stalker.step = (state.stalker.step + 1) % route.count
        state.stalker.room = route[state.stalker.step]
        state.stalker.nextMoveAt = state.minutes + 2
        if state.stalker.step == 0 {
            state.stalker.rechargeUntil = state.minutes + 6
            state.stalker.nextMoveAt = state.stalker.rechargeUntil
        }
        let now = locate(state.stalker.room)
        let room = state.stalker.room ?? ""
        if now.distance == 1 {
            cue("footsteps.heavy", pan: Game.stalkerPan[now.dir ?? ""] ?? 0)
            let coming = stalkerNextRoom() == state.location && state.stalker.step != 0
            say("Heavy footsteps, \(dirWord(now.dir)). 001 is in the \(roomWord(room))." + (coming ? " It is coming toward you." : ""), kind: "alert")
        } else if now.distance == 2 {
            cue("footsteps.far", pan: Game.stalkerPan[now.dir ?? ""] ?? 0)
            if before.distance != 2 { say("Distant, heavy footsteps, somewhere \(dirWord(now.dir)).", kind: "alert") }
        } else if before.distance <= 1 && now.distance > 1 {
            say("The footsteps move away.", kind: "alert")
        }
        if state.stalker.step == 0 && now.distance <= 1 {
            say("The footsteps stop. A low whine, rising: 001 has docked to recharge.", kind: "alert")
        }
    }

    func stalkerTick() {
        guard state.stalker.active && state.dialogue == nil && state.gameOver == nil else { return }
        let now = state.minutes
        if now >= state.stalker.alertDecayAt && state.stalker.alert > 0 {
            state.stalker.alert -= 1
            state.stalker.alertDecayAt = now + 10
        }
        if state.stalker.rechargeUntil - now == 1 && state.stalker.room == state.location {
            cue("alarm")
            say("001’s charging whine is dropping. It is about to wake.", kind: "alert")
        }
        if now >= state.stalker.nextMoveAt {
            if state.stalker.step == 0 && state.stalker.room == state.location && !state.stalker.wokeFacing {
                state.stalker.wokeFacing = true
                state.stalker.nextMoveAt = now + 1
                return
            }
            state.stalker.wokeFacing = false
            stalkerMove()
        }
    }

    func stalkerListen() {
        guard state.stalker.active else { return }
        let w = locate(state.stalker.room)
        let room = state.stalker.room ?? ""
        if w.distance == 0 {
            say(stalkerRecharging ? "001 stands in this room, docked and whining softly as it charges." : "001 is right here.")
        } else if w.distance == 1 {
            cue("footsteps.heavy", pan: Game.stalkerPan[w.dir ?? ""] ?? 0)
            say("001 is close: in the \(roomWord(room)), \(dirWord(w.dir)).\(stalkerRecharging ? " It is recharging." : "")")
        } else if w.distance == 2 {
            say("You hear 001 somewhere \(dirWord(w.dir)), two rooms away.\(stalkerRecharging ? " It has stopped moving." : "")")
        } else {
            say("You cannot hear 001 from here.")
        }
    }

    func stalkerEffect(_ name: String, _ v: JSON) {
        switch name {
        case "stalkerStart":
            let room = v["room"]?.string ?? ""
            let i = route.firstIndex(of: room) ?? 0
            state.stalker = Stalker(active: true, room: room, step: i, nextMoveAt: state.minutes + 2, rechargeUntil: 0,
                                    alert: 0, alertDecayAt: state.minutes + 10, wokeFacing: state.stalker.wokeFacing)
        case "stalkerStop":
            state.stalker.active = false
        case "stalkerMoveOn":
            state.stalker.step = (state.stalker.step + 1) % route.count
            state.stalker.room = route[state.stalker.step]
            state.stalker.nextMoveAt = state.minutes + 2
            if state.stalker.step == 0 {
                state.stalker.rechargeUntil = state.minutes + 6
                state.stalker.nextMoveAt = state.stalker.rechargeUntil
            }
        case "stalkerAlert":
            state.stalker.alert += v.number ?? 0
            state.stalker.alertDecayAt = state.minutes + 10
        case "flee":
            if let to = state.previousRoom, to != state.stalker.room {
                cue("footsteps")
                state.location = to
                listener?.roomEntered(to)
                say("You are back in the \(roomWord(to)).", kind: "system")
            }
        default: // caught
            if state.flags.contains("injured") {
                cue("stinger.death")
                state.gameOver = GameOver(title: "You did not get away",
                                          text: "The hand that was built to hold a cup without breaking it closes around you, and does not let go. The last thing you hear is its heartbeat: three short, one long.")
                say(state.gameOver!.text, kind: "alert")
                return
            }
            state.flags.insert("injured")
            cue("hit")
            say("You are hurt. If it catches you again before you are treated, you will not survive. The medical ward has supplies.", kind: "alert")
            stalkerEffect("stalkerMoveOn", .null)
        }
    }
}
