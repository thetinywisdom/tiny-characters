import SpriteKit

// The screen's own things (the goal, the dialogue box, the fight), laid out in
// points on the camera, drawn as hard-edged boxes like everything else.

enum UI {
    /// A box with a 2 pt border, centred on `center`.
    static func panel(_ size: CGSize, fill: SKColor = Palette.navy, border: SKColor = Palette.paper) -> SKSpriteNode {
        let outer = SKSpriteNode(color: border, size: size)
        let inner = SKSpriteNode(color: fill, size: CGSize(width: size.width - 4, height: size.height - 4))
        inner.zPosition = 0.1
        outer.addChild(inner)
        return outer
    }

    static func label(_ text: String, size: CGFloat, color: SKColor = Palette.paper) -> SKLabelNode {
        let l = SKLabelNode(fontNamed: PixelFont.name)
        l.text = text
        l.fontSize = size
        l.fontColor = color
        l.zPosition = 0.2
        return l
    }

    /// A tappable button: a panel named `name`, with its label.
    static func button(_ title: String, name: String, size: CGSize) -> SKSpriteNode {
        let b = panel(size, fill: Palette.ink, border: Palette.gold)
        b.name = name
        let l = label(title, size: 17)
        l.verticalAlignmentMode = .center
        l.horizontalAlignmentMode = .center
        l.name = name
        b.addChild(l)
        return b
    }
}

/// The dialogue box at the bottom of the screen: a name, the line typing out,
/// tap to finish the line, tap again for the next.
final class DialogueBox: SKNode {
    private let box: SKSpriteNode
    private let nameLabel: SKLabelNode
    private let text: SKLabelNode
    private let more: SKLabelNode
    private var lines: [String]
    private var index = 0
    private var shown = 0.0
    private let done: () -> Void
    private let width: CGFloat

    init(name: String, lines: [String], width: CGFloat, done: @escaping () -> Void) {
        self.lines = lines
        self.done = done
        self.width = width
        box = UI.panel(CGSize(width: width, height: 120))
        nameLabel = UI.label(name, size: 15, color: Palette.gold)
        text = UI.label("", size: 17)
        more = UI.label("▼", size: 12, color: Palette.gold)
        super.init()
        addChild(box)
        nameLabel.horizontalAlignmentMode = .left
        nameLabel.verticalAlignmentMode = .top
        nameLabel.position = CGPoint(x: -width / 2 + 14, y: 50)
        box.addChild(nameLabel)
        text.horizontalAlignmentMode = .left
        text.verticalAlignmentMode = .top
        text.numberOfLines = 0
        text.preferredMaxLayoutWidth = width - 28
        text.lineBreakMode = .byWordWrapping
        text.position = CGPoint(x: -width / 2 + 14, y: 28)
        box.addChild(text)
        more.position = CGPoint(x: width / 2 - 16, y: -50)
        more.isHidden = true
        more.run(.repeatForever(.sequence([.fadeOut(withDuration: 0.3), .fadeIn(withDuration: 0.3)])))
        box.addChild(more)
    }

    required init?(coder: NSCoder) { fatalError("not used") }

    private var line: String { lines[index] }
    private var typing: Bool { Int(shown) < line.count }

    func tick(_ dt: TimeInterval) {
        guard typing else { return }
        shown += dt * 45                                 // letters a second
        text.text = String(line.prefix(Int(shown)))
        more.isHidden = typing
    }

    func tap() {
        if typing { shown = Double(line.count); text.text = line; more.isHidden = false; return }
        index += 1
        if index >= lines.count { removeFromParent(); done(); return }
        shown = 0
        text.text = ""
        more.isHidden = true
    }
}
