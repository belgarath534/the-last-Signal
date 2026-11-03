import Foundation

/// The story's data, read from story.json. Objects keep their keys in the order they were
/// written, because the order of effects matters (just like in the JavaScript version).
indirect enum JSON: Equatable {
    case null
    case bool(Bool)
    case number(Double)
    case string(String)
    case array([JSON])
    case object([(String, JSON)])

    static func == (a: JSON, b: JSON) -> Bool {
        switch (a, b) {
        case (.null, .null): return true
        case let (.bool(x), .bool(y)): return x == y
        case let (.number(x), .number(y)): return x == y
        case let (.string(x), .string(y)): return x == y
        case let (.array(x), .array(y)): return x == y
        case let (.object(x), .object(y)): return x.count == y.count && zip(x, y).allSatisfy { $0.0 == $1.0 && $0.1 == $1.1 }
        default: return false
        }
    }

    subscript(key: String) -> JSON? {
        if case .object(let pairs) = self { return pairs.first { $0.0 == key }?.1 }
        return nil
    }
    subscript(index: Int) -> JSON? {
        if case .array(let a) = self, index >= 0, index < a.count { return a[index] }
        return nil
    }

    var string: String? { if case .string(let s) = self { return s }; return nil }
    var number: Double? { if case .number(let n) = self { return n }; return nil }
    var int: Int? { number.map { Int($0) } }
    var bool: Bool? { if case .bool(let b) = self { return b }; return nil }
    var array: [JSON]? { if case .array(let a) = self { return a }; return nil }
    var pairs: [(String, JSON)]? { if case .object(let p) = self { return p }; return nil }
    var isObject: Bool { pairs != nil }
    var isNull: Bool { if case .null = self { return true }; return false }

    /// JavaScript truthiness.
    var truthy: Bool {
        switch self {
        case .null: return false
        case .bool(let b): return b
        case .number(let n): return n != 0 && !n.isNaN
        case .string(let s): return !s.isEmpty
        default: return true
        }
    }

    /// A single value or a list, as a list (the JavaScript `asList`).
    var list: [JSON] { array ?? [self] }
    var strings: [String] { list.compactMap { $0.string } }

    /// An object's values in order, keyed for fast lookup.
    func dictionary() -> [String: JSON] {
        var d: [String: JSON] = [:]
        for (k, v) in pairs ?? [] where d[k] == nil { d[k] = v }
        return d
    }
}

/// A small JSON parser that keeps object keys in order.
struct JSONReader {
    private let b: [UInt8]
    private var i = 0
    struct Failure: Error { let message: String }

    static func parse(_ data: Data) throws -> JSON {
        var r = JSONReader(b: [UInt8](data))
        r.skip()
        let v = try r.value()
        return v
    }
    private init(b: [UInt8]) { self.b = b }

    private mutating func skip() { while i < b.count, b[i] == 0x20 || b[i] == 0x0A || b[i] == 0x0D || b[i] == 0x09 { i += 1 } }
    private func fail(_ m: String) -> Failure { Failure(message: "\(m) at byte \(i)") }

    private mutating func value() throws -> JSON {
        guard i < b.count else { throw fail("unexpected end") }
        switch b[i] {
        case UInt8(ascii: "{"):
            i += 1; skip()
            var pairs: [(String, JSON)] = []
            if b[i] == UInt8(ascii: "}") { i += 1; return .object(pairs) }
            while true {
                skip()
                let k = try str()
                skip()
                guard b[i] == UInt8(ascii: ":") else { throw fail("expected :") }
                i += 1; skip()
                pairs.append((k, try value()))
                skip()
                if b[i] == UInt8(ascii: ",") { i += 1; continue }
                if b[i] == UInt8(ascii: "}") { i += 1; return .object(pairs) }
                throw fail("expected , or }")
            }
        case UInt8(ascii: "["):
            i += 1; skip()
            var items: [JSON] = []
            if b[i] == UInt8(ascii: "]") { i += 1; return .array(items) }
            while true {
                skip()
                items.append(try value())
                skip()
                if b[i] == UInt8(ascii: ",") { i += 1; continue }
                if b[i] == UInt8(ascii: "]") { i += 1; return .array(items) }
                throw fail("expected , or ]")
            }
        case UInt8(ascii: "\""): return .string(try str())
        case UInt8(ascii: "t"): i += 4; return .bool(true)
        case UInt8(ascii: "f"): i += 5; return .bool(false)
        case UInt8(ascii: "n"): i += 4; return .null
        default:
            let start = i
            while i < b.count, "0123456789+-.eE".utf8.contains(b[i]) { i += 1 }
            guard let n = Double(String(decoding: b[start..<i], as: UTF8.self)) else { throw fail("bad number") }
            return .number(n)
        }
    }

    private mutating func str() throws -> String {
        guard b[i] == UInt8(ascii: "\"") else { throw fail("expected string") }
        i += 1
        var out = [UInt8]()
        while i < b.count {
            let c = b[i]
            if c == UInt8(ascii: "\"") { i += 1; return String(decoding: out, as: UTF8.self) }
            if c == UInt8(ascii: "\\") {
                i += 1
                let e = b[i]
                switch e {
                case UInt8(ascii: "n"): out.append(0x0A)
                case UInt8(ascii: "t"): out.append(0x09)
                case UInt8(ascii: "r"): out.append(0x0D)
                case UInt8(ascii: "b"): out.append(0x08)
                case UInt8(ascii: "f"): out.append(0x0C)
                case UInt8(ascii: "u"):
                    var code = UInt32(String(decoding: b[(i + 1)...(i + 4)], as: UTF8.self), radix: 16) ?? 0x3F
                    i += 4
                    if code >= 0xD800 && code < 0xDC00, b[i + 1] == UInt8(ascii: "\\"), b[i + 2] == UInt8(ascii: "u") {
                        let low = UInt32(String(decoding: b[(i + 3)...(i + 6)], as: UTF8.self), radix: 16) ?? 0
                        code = 0x10000 + ((code - 0xD800) << 10) + (low - 0xDC00)
                        i += 6
                    }
                    out.append(contentsOf: Array(String(UnicodeScalar(code).map(Character.init) ?? "?").utf8))
                default: out.append(e)
                }
                i += 1
                continue
            }
            out.append(c)
            i += 1
        }
        throw fail("unterminated string")
    }
}
