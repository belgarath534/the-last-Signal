import Foundation

// The whole game state, saved to disk as-is. Mirrors web/js/core/state.js.

/// A dictionary that remembers the order keys were first added (like a JavaScript object).
struct Ordered<V: Codable & Equatable>: Codable, Equatable {
    private(set) var keys: [String] = []
    private var values: [String: V] = [:]
    subscript(key: String) -> V? {
        get { values[key] }
        set {
            if let v = newValue {
                if values[key] == nil { keys.append(key) }
                values[key] = v
            } else if values[key] != nil {
                values[key] = nil
                keys.removeAll { $0 == key }
            }
        }
    }
    var entries: [(String, V)] { keys.map { ($0, values[$0]!) } }
    var count: Int { keys.count }
}

struct TrustEvent: Codable, Equatable { var delta: Double; var reason: String; var at: Int }
struct Lie: Codable, Equatable { var exposed: Bool; var at: Int; var about: String }
struct Trust: Codable, Equatable {
    var value = 0.0
    var history: [TrustEvent] = []
    var lies = Ordered<Lie>()
    var honestAnswers = 0
}
struct GameTimer: Codable, Equatable { var event: String; var at: Int }
struct DialoguePos: Codable, Equatable { var id: String; var node: String }
struct Ended: Codable, Equatable { var chapter: Int; var title: String; var text: String; var ending: String? }
struct GameOver: Codable, Equatable { var title: String; var text: String }
struct Journal: Codable, Equatable {
    var documents: [String] = []
    var recordings: [String] = []
    var read: Set<String> = []
}
struct Stalker: Codable, Equatable {
    var active = false
    var room: String? = nil
    var step = 0
    var nextMoveAt = 0
    var rechargeUntil = 0
    var alert = 0.0
    var alertDecayAt = 0
    var wokeFacing = false
}
struct Ward: Codable, Equatable {
    var active = false
    var location = "capsule"
    var power = 0.0
    var stability = 0.0
    var emilyAlive = true
    var warned: Set<String> = []
    var checks = 0
}

struct GameState: Codable, Equatable {
    static let saveVersion = 1
    var version = GameState.saveVersion
    var chapter = 1
    var location: String
    var visited: Set<String> = []
    var flags: Set<String> = []
    var inventory: [String] = []
    var journal = Journal()
    var objectives = Ordered<String>()
    var trust = Trust()
    var minutes = 0
    var timers: [GameTimer] = []
    var dialogue: DialoguePos? = nil
    var dialogueSeen: Set<String> = []
    var firedTriggers: Set<String> = []
    var ended: Ended? = nil
    var stalker = Stalker()
    var previousRoom: String? = nil
    var gameOver: GameOver? = nil
    var ward = Ward()
    var counters: [String: Double] = [:]
    var actions = 0
    var secretsFound = 0

    init(startRoom: String) { location = startRoom }
}

/// In-game clock: the story starts at 1:47 AM.
let startClockMinutes = 1 * 60 + 47

func clockLabel(_ minutesElapsed: Int) -> String {
    let total = (startClockMinutes + minutesElapsed) % (24 * 60)
    let h24 = total / 60, m = total % 60
    let suffix = h24 < 12 ? "AM" : "PM"
    let h12 = h24 % 12 == 0 ? 12 : h24 % 12
    return "\(h12):\(m < 10 ? "0" : "")\(m) \(suffix)"
}

/// JavaScript's Math.round (halves round up).
func jsRound(_ x: Double) -> Double { (x + 0.5).rounded(.down) }

/// JavaScript number to text: 5 not 5.0.
func jsNum(_ v: Double) -> String {
    if v == v.rounded() && abs(v) < 1e15 { return String(Int(v)) }
    return String(v)
}
