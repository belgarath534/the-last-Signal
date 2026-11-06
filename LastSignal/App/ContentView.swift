import SwiftUI
import UIKit

// Colours from web/css/style.css.
private struct Palette {
    let bg, panel, text, muted, accent, signal, border, speech: Color
    static let normal = Palette(bg: Color(hex: 0x0b0d0f), panel: Color(hex: 0x14181c), text: Color(hex: 0xe6e2da), muted: Color(hex: 0xa8a399),
                                accent: Color(hex: 0xd9534f), signal: Color(hex: 0x7fc8a9), border: Color(hex: 0x2b3138), speech: Color(hex: 0xc9dcef))
    static let high = Palette(bg: .black, panel: .black, text: .white, muted: .white, accent: Color(hex: 0xff6b6b), signal: Color(hex: 0x8ff0c4), border: .white, speech: .white)
}
private extension Color {
    init(hex: UInt32) { self.init(red: Double((hex >> 16) & 0xff) / 255, green: Double((hex >> 8) & 0xff) / 255, blue: Double(hex & 0xff) / 255) }
}

struct ContentView: View {
    @ObservedObject var model: AppModel
    @AccessibilityFocusState private var focusNarration: Bool
    @AccessibilityFocusState private var focusTitle: Bool
    @Environment(\.scenePhase) private var phase

    private var p: Palette { model.settings.highContrast ? .high : .normal }
    @Environment(\.horizontalSizeClass) private var sizeClass
    private var scale: CGFloat {
        let user: CGFloat = model.settings.textSize == "larger" ? 1.4 : model.settings.textSize == "large" ? 1.17 : 1
        return user * (sizeClass == .regular ? 1.35 : 1)   // iPad: larger text for the bigger screen
    }
    private func font(_ size: CGFloat, _ style: Font.TextStyle = .body, bold: Bool = false) -> Font {
        .system(size: size * scale, weight: bold ? .semibold : .regular).leading(.standard)
    }

    var body: some View {
        let s = model.screen
        ScrollViewReader { proxy in
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    Text(s.title)
                        .font(font(s.title == "The Last Signal" ? 34 : 26, .largeTitle, bold: true))
                        .foregroundStyle(s.title == "The Last Signal" ? p.accent : p.text)
                        .accessibilityAddTraits(.isHeader)
                        .accessibilityFocused($focusTitle)
                        .id("top")
                    ForEach(Array(s.blocks.enumerated()), id: \.offset) { i, block in
                        blockView(block, screenID: s.id, index: i)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 24)
                .frame(maxWidth: sizeClass == .regular ? 900 : 760, alignment: .leading)
                .frame(maxWidth: .infinity)
            }
            .background(p.bg.ignoresSafeArea())
            .onChange(of: s.id) {
                proxy.scrollTo("top", anchor: .top)
                moveFocus()
            }
        }
        .preferredColorScheme(.dark)
        .dynamicTypeSize(.xSmall ... .accessibility3)
        // two-finger double-tap: the pause menu (or back out of a menu)
        .accessibilityAction(.magicTap) { magicTap() }
        .accessibilityAction(.escape) { escape() }
        .onChange(of: phase) {
            if phase == .background { model.didLeave() }
            if phase == .active { model.didReturn() }
        }
        .onAppear {
            UIApplication.shared.isIdleTimerDisabled = true
            moveFocus()
        }
    }

    private func moveFocus() {
        focusNarration = false
        focusTitle = false
        let toNarration = model.screen.focusNarration
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            if toNarration { focusNarration = true } else {
                UIAccessibility.post(notification: .screenChanged, argument: nil)
                focusTitle = true
            }
        }
    }

    private func pressButton(_ label: String) {
        model.screen.blocks.lazy.compactMap { block -> MenuButton? in
            if case let .buttons(_, bs) = block { return bs.first { $0.label == label } }
            return nil
        }.first?.action()
    }
    private func magicTap() {
        if model.screen.isGame { pressButton("Pause menu") } else if model.screen.title == "Paused" { pressButton("Resume") }
    }
    private func escape() {
        let labels = ["Back", "Back to journal", "Back to the room", "Resume", "Cancel", "Stay"]
        for l in labels {
            if model.screen.blocks.contains(where: { if case let .buttons(_, bs) = $0 { return bs.contains { $0.label == l } }; return false }) {
                return pressButton(l)
            }
        }
    }

    @ViewBuilder
    private func blockView(_ block: UIBlock, screenID: Int, index: Int) -> some View {
        switch block {
        case .heading(let t):
            Text(t).font(font(20, .title3, bold: true)).foregroundStyle(p.text)
                .padding(.top, 8)
                .accessibilityAddTraits(.isHeader)
        case .text(let t, let style):
            Text(t)
                .font(style == "fineprint" || style == "status" || style == "kind" ? font(15) : style == "tagline" ? font(18) : font(18))
                .foregroundStyle(style == "body" ? p.text : p.muted)
                .fixedSize(horizontal: false, vertical: true)
        case .narration(let lines):
            VStack(alignment: .leading, spacing: 14) {
                ForEach(Array(lines.enumerated()), id: \.offset) { _, l in
                    Text(AppController.lineText(l))
                        .font(font(18, .body, bold: l.kind == "heading"))
                        .foregroundStyle(l.kind == "speech" ? p.speech : l.kind == "alert" ? p.accent : l.kind == "system" || l.kind == "summary" ? p.muted : p.text)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(14)
            .background(p.panel, in: RoundedRectangle(cornerRadius: 8))
            // read as one passage, a new element every time so VoiceOver reads it out
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(lines.map(AppController.lineText).joined(separator: " "))
            .accessibilityFocused($focusNarration)
            .id("beat-\(screenID)")
        case .list(let items):
            VStack(alignment: .leading, spacing: 8) {
                ForEach(Array(items.enumerated()), id: \.offset) { _, t in
                    Text(t).font(font(17)).foregroundStyle(p.text).fixedSize(horizontal: false, vertical: true)
                }
            }
        case let .buttons(heading, buttons):
            VStack(alignment: .leading, spacing: 10) {
                if let heading {
                    Text(heading.uppercased()).font(font(14, .caption, bold: true)).kerning(1.5).foregroundStyle(p.muted)
                        .accessibilityLabel(heading)
                        .accessibilityAddTraits(.isHeader)
                }
                ForEach(Array(buttons.enumerated()), id: \.offset) { _, b in
                    Button {
                        b.action()
                    } label: {
                        Text(b.label)
                            .font(font(18))
                            .foregroundStyle(p.text)
                            .multilineTextAlignment(.leading)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.horizontal, 16).padding(.vertical, 13)
                            .frame(minHeight: 52)
                            .background(p.panel, in: RoundedRectangle(cornerRadius: 8))
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(p.border))
                    }
                    .simultaneousGesture(LongPressGesture(minimumDuration: 0.01).onEnded { _ in model.focusedButton(b.label) })
                }
            }
            .padding(.top, 4)
        case let .picker(label, hint, options, selected, set):
            VStack(alignment: .leading, spacing: 6) {
                Text(label).font(font(18)).foregroundStyle(p.text).accessibilityHidden(true)
                Picker(label, selection: Binding(get: { selected }, set: { set($0) })) {
                    ForEach(Array(options.enumerated()), id: \.offset) { _, o in Text(o.label).tag(o.value) }
                }
                .pickerStyle(.menu)
                .tint(p.signal)
                .font(font(18))
                if let hint { Text(hint).font(font(15)).foregroundStyle(p.muted).accessibilityHidden(true) }
            }
            .accessibilityElement(children: .contain)
            .accessibilityHint(hint ?? "")
        case let .slider(label, value, set, done):
            VStack(alignment: .leading, spacing: 4) {
                Text(label).font(font(18)).foregroundStyle(p.text).accessibilityHidden(true)
                Slider(value: Binding(get: { value }, set: { set(($0 * 10).rounded() / 10) }), in: 0...1, step: 0.1,
                       onEditingChanged: { editing in if !editing { done() } })
                    .tint(p.signal)
                    .accessibilityLabel(label)
                    .accessibilityValue("\(Int((value * 100).rounded())) percent")
            }
        case let .toggle(label, hint, value, set):
            VStack(alignment: .leading, spacing: 4) {
                Toggle(isOn: Binding(get: { value }, set: { set($0) })) { Text(label).font(font(18)).foregroundStyle(p.text) }
                    .tint(p.signal)
                    .accessibilityHint(hint ?? "")
                if let hint { Text(hint).font(font(15)).foregroundStyle(p.muted).accessibilityHidden(true) }
            }
        }
    }
}
