import SpriteKit

/// Anyone who stands and walks: a person, an animal or a monster. Its position
/// is its feet; it shows the right view and steps through its walk cycle.
final class Walker: SKSpriteNode {
    let group: String
    let look: String
    /// Where it really is (world pixels); the node is drawn on whole pixels.
    var spot: CGPoint { didSet { place() } }
    var facing = "down" { didSet { if facing != oldValue { refresh() } } }
    var walking = false { didSet { if walking != oldValue { refresh() } } }
    /// Monsters keep moving (floating, swaying) while they stand.
    var alwaysAnimate = false
    private var clock: TimeInterval = 0
    private var shown = ""

    init(group: String = "People", look: String, at spot: CGPoint, facing: String = "down") {
        self.group = group
        self.look = look
        self.spot = spot
        self.facing = facing
        super.init(texture: nil, color: .clear, size: .zero)
        place()
        refresh()
    }

    required init?(coder: NSCoder) { fatalError("not used") }

    func tick(_ dt: TimeInterval) {
        clock += dt
        refresh()
    }

    /// Turn towards a point.
    func face(_ p: CGPoint) { facing = Walker.facing(dx: p.x - spot.x, dy: p.y - spot.y, was: facing) }

    static func facing(dx: CGFloat, dy: CGFloat, was: String) -> String {
        if abs(dx) < 0.01 && abs(dy) < 0.01 { return was }
        if abs(dx) > abs(dy) { return dx < 0 ? "left" : "right" }
        return dy > 0 ? "up" : "down"       // y goes up the screen: walking up shows the back
    }

    private func place() {
        position = CGPoint(x: spot.x.rounded(), y: spot.y.rounded())
        zPosition = World.depth(spot.y)
    }

    private func refresh() {
        var name = "\(look)_\(facing)_stand"
        if walking || alwaysAnimate, let seq = Sprites.anim("\(look)_\(facing)"), !seq.isEmpty {
            name = seq[Int(clock * 8) % seq.count]
        }
        if name != shown {
            shown = name
            Sprites.apply(self, group, name)
        }
    }
}
