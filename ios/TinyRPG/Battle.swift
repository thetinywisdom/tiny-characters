import SpriteKit

/// A short turn-based fight: you and the foe face each other, big, on a strip
/// of ground. Attack, Guard (half damage from the next hit) or Run (half the time).
final class Battle: SKNode {
    enum Result { case won, lost, fled }

    let foe: FoeInfo
    private let onEnd: (Result) -> Void
    private let you: Walker
    private let them: Walker
    private let message: SKLabelNode
    private let youBar: HPBar
    private let themBar: HPBar
    private let buttons = SKNode()
    private var youHP = 20, themHP: Int
    private var guarding = false
    private var busy = false
    private let zoom: CGFloat

    init(foe: FoeInfo, player: String, screen: CGSize, onEnd: @escaping (Result) -> Void) {
        self.foe = foe
        self.onEnd = onEnd
        themHP = foe.hp
        zoom = max(4, (min(screen.width, screen.height) / 70).rounded(.down))
        you = Walker(look: player, at: .zero, facing: "right")
        them = Walker(group: "Monsters", look: foe.sprite, at: .zero, facing: "left")
        message = UI.label(foe.intro, size: 17)
        youBar = HPBar(name: "You", max: 20, width: min(150, screen.width * 0.38))
        themBar = HPBar(name: foe.name, max: foe.hp, width: min(150, screen.width * 0.38))
        super.init()

        let back = SKSpriteNode(color: Palette.navy, size: screen)
        back.zPosition = 0
        addChild(back)
        let strip = SKSpriteNode(color: Palette.grass, size: CGSize(width: screen.width, height: zoom * 14))
        strip.position = CGPoint(x: 0, y: -zoom * 4)
        strip.zPosition = 1
        addChild(strip)

        them.alwaysAnimate = true
        // each fighter stands in a holder scaled up by zoom: Sprites.apply sets the
        // walker's size on every new frame, which would undo a scale on the walker
        for (w, x) in [(you, -screen.width * 0.24), (them, screen.width * 0.24)] {
            let holder = SKNode()
            holder.setScale(zoom)
            holder.position = CGPoint(x: x.rounded(), y: 0)
            holder.zPosition = 2
            holder.addChild(w)
            addChild(holder)
        }
        youBar.position = CGPoint(x: -screen.width * 0.24, y: zoom * 26)
        themBar.position = CGPoint(x: screen.width * 0.24, y: zoom * 26)
        for b in [youBar, themBar] { b.zPosition = 3; addChild(b) }

        message.numberOfLines = 0
        message.preferredMaxLayoutWidth = screen.width - 40
        message.horizontalAlignmentMode = .center
        message.verticalAlignmentMode = .center
        message.position = CGPoint(x: 0, y: screen.height * 0.3)
        message.zPosition = 3
        addChild(message)

        let bw = min(110, (screen.width - 48) / 3)
        for (i, (title, name)) in [("Attack", "attack"), ("Guard", "guard"), ("Run", "run")].enumerated() {
            let b = UI.button(title, name: name, size: CGSize(width: bw, height: 48))
            b.position = CGPoint(x: CGFloat(i - 1) * (bw + 12), y: -screen.height * 0.28)
            buttons.addChild(b)
        }
        buttons.zPosition = 4
        addChild(buttons)
    }

    required init?(coder: NSCoder) { fatalError("not used") }

    func tick(_ dt: TimeInterval) { you.tick(dt); them.tick(dt) }

    func tap(at p: CGPoint) {
        guard !busy else { return }
        let names = nodes(at: p).compactMap { $0.name }
        if names.contains("attack") { attack() }
        else if names.contains("guard") { guardUp() }
        else if names.contains("run") { flee() }
    }

    // --- your turn ------------------------------------------------------------

    private func attack() {
        busy = true
        let crit = Int.random(in: 0..<10) == 0
        let dmg = Int.random(in: 3...5) * (crit ? 2 : 1)
        lunge(you, by: zoom * 6) { [self] in
            hit(them)
            themHP = max(0, themHP - dmg)
            themBar.set(themHP)
            say(crit ? "A clean hit! \(dmg) damage." : "You hit it for \(dmg).")
            if themHP == 0 { after(1.0) { self.say(self.foe.defeat); self.them.parent?.run(.fadeOut(withDuration: 0.6)) }; after(2.6) { self.end(.won) }; return }
            after(1.0) { self.foeTurn() }
        }
    }

    private func guardUp() {
        busy = true
        guarding = true
        say("You brace yourself.")
        after(0.8) { self.foeTurn() }
    }

    private func flee() {
        busy = true
        if Bool.random() { say("You got away!"); after(0.9) { self.end(.fled) } }
        else { say("Couldn't get away!"); after(0.9) { self.foeTurn() } }
    }

    // --- the foe's turn -------------------------------------------------------

    private func foeTurn() {
        let lo = foe.attack.first ?? 1, hi = foe.attack.last ?? lo
        var dmg = Int.random(in: lo...max(lo, hi))
        if guarding { dmg /= 2 }
        let wasGuarding = guarding
        guarding = false
        say(foe.taunts.randomElement() ?? "...")
        after(0.7) { [self] in
            lunge(them, by: -zoom * 6) { [self] in
                hit(you)
                youHP = max(0, youHP - dmg)
                youBar.set(youHP)
                say(wasGuarding ? "You blocked most of it: \(dmg) damage." : "It hits you for \(dmg).")
                if youHP == 0 { after(1.0) { self.say("Everything goes dark...") }; after(2.4) { self.end(.lost) }; return }
                after(0.8) { self.busy = false; self.say("What will you do?") }
            }
        }
    }

    // --- bits -----------------------------------------------------------------

    private func say(_ s: String) { message.text = s }
    private func after(_ t: TimeInterval, _ f: @escaping () -> Void) { run(.sequence([.wait(forDuration: t), .run(f)])) }
    private func end(_ r: Result) { removeFromParent(); onEnd(r) }

    /// Step forward and back (whole points, no easing: it stays pixel art).
    private func lunge(_ w: Walker, by dx: CGFloat, then: @escaping () -> Void) {
        guard let holder = w.parent else { return then() }
        holder.run(.sequence([.moveBy(x: dx, y: 0, duration: 0.1), .run(then), .moveBy(x: -dx, y: 0, duration: 0.15)]))
    }

    /// Blink white twice.
    private func hit(_ w: Walker) {
        w.color = .white
        let on = SKAction.run { w.colorBlendFactor = 1 }, off = SKAction.run { w.colorBlendFactor = 0 }, wait = SKAction.wait(forDuration: 0.08)
        w.run(.sequence([on, wait, off, wait, on, wait, off]))
    }
}

/// A name and a bar of hit points, in whole steps.
final class HPBar: SKNode {
    private let maxHP: Int
    private let fill: SKSpriteNode
    private let width: CGFloat
    private let count: SKLabelNode

    init(name: String, max: Int, width: CGFloat) {
        maxHP = max
        self.width = width
        fill = SKSpriteNode(color: Palette.green, size: CGSize(width: width - 4, height: 8))
        count = UI.label("\(max)/\(max)", size: 12)
        super.init()
        let title = UI.label(name, size: 14, color: Palette.gold)
        title.position = CGPoint(x: 0, y: 14)
        addChild(title)
        let frame = SKSpriteNode(color: Palette.paper, size: CGSize(width: width, height: 12))
        addChild(frame)
        let empty = SKSpriteNode(color: Palette.ink, size: CGSize(width: width - 4, height: 8))
        empty.zPosition = 0.1
        addChild(empty)
        fill.anchorPoint = CGPoint(x: 0, y: 0.5)
        fill.position = CGPoint(x: -(width - 4) / 2, y: 0)
        fill.zPosition = 0.2
        addChild(fill)
        count.position = CGPoint(x: 0, y: -22)
        addChild(count)
    }

    required init?(coder: NSCoder) { fatalError("not used") }

    func set(_ hp: Int) {
        fill.size.width = ((width - 4) * CGFloat(hp) / CGFloat(maxHP)).rounded()
        fill.color = hp * 3 <= maxHP ? Palette.red : Palette.green
        count.text = "\(hp)/\(maxHP)"
    }
}
