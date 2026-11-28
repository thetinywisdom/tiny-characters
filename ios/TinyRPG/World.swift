import SpriteKit

/// The map: ground, buildings, trees and street things, and the ground nobody
/// walks through (`solids`). World units are person pixels, y up; everything
/// stands with its feet at its position and is drawn in front of what is above it.
final class World {
    static let size = CGSize(width: 480, height: 392)
    static func depth(_ y: CGFloat) -> CGFloat { 1000 - y }

    let node = SKNode()
    private(set) var solids: [CGRect] = []
    private var rng = Seeded(seed: 7)

    // the paths: a street across, and the shrine path up the middle
    let street = CGRect(x: 0, y: 146, width: 480, height: 36)
    let shrinePath = CGRect(x: 228, y: 182, width: 24, height: 150)

    init() {
        ground()
        // the row above the street (fronts on the street), left and right of the shrine path
        row(["house_1", "shop_ramen_1", "mixedUse_2"], y: 184, from: 8, to: 222)
        row(["koban_1", "shop_konbini_1", "house_3"], y: 184, from: 258, to: 474)
        // the row below the street
        row(["shop_cafe_1", "house_2", "kissaten_1", "shop_bakery_1", "woodApartment_1"], y: 60, from: 8, to: 474)
        // the shrine at the top, its torii on the path
        building("shrine_1", at: CGPoint(x: 240, y: 336))
        torii(at: CGPoint(x: 240, y: 280))
        for x in [206.0, 274.0] { thing("Props", "stoneLantern", at: CGPoint(x: x, y: 300), foot: 6) }
        for (x, y) in [(196.0, 268.0), (286.0, 268.0), (176.0, 318.0), (306.0, 318.0)] { tree("tree_sakura_\(Int(x) % 2 + 1)", at: CGPoint(x: x, y: y)) }
        // a forest round the shrine grounds
        for x in stride(from: 10.0, through: 470.0, by: 22.0) where abs(x - 240) > 70 {
            tree(rng.next() < 0.5 ? "tree_pine_1" : "tree_cedar_1", at: CGPoint(x: x + rng.next() * 6, y: 352 + rng.next() * 30))
        }
        for x in stride(from: 12.0, through: 160.0, by: 26.0) { tree("tree_pine_2", at: CGPoint(x: x, y: 262 + rng.next() * 40)) }
        for x in stride(from: 330.0, through: 470.0, by: 26.0) { tree("tree_cedar_2", at: CGPoint(x: x, y: 262 + rng.next() * 40)) }
        // street things
        thing("Props", "vendingMachine", at: CGPoint(x: 396, y: 181), foot: 4)
        thing("Props", "postBox", at: CGPoint(x: 254, y: 140), foot: 3)
        thing("Props", "bench", at: CGPoint(x: 410, y: 134), foot: 4)
        for x in [60.0, 180.0, 320.0, 450.0] { thing("Props", "streetLamp", at: CGPoint(x: x, y: 138), foot: 2, footW: 3) }
        for x in stride(from: 20.0, through: 460.0, by: 40.0) { thing("Plants", "bush_round_1", at: CGPoint(x: x + 8, y: 30 + rng.next() * 8), foot: 4) }
    }

    /// Is a box free to stand in (inside the map and off every solid)?
    func free(_ r: CGRect) -> Bool {
        guard r.minX >= 2, r.maxX <= World.size.width - 2, r.minY >= 2, r.maxY <= World.size.height - 2 else { return false }
        return !solids.contains { $0.intersects(r) }
    }

    // --- the ground ---------------------------------------------------------------

    private func ground() {
        rect(Palette.grass, CGRect(origin: .zero, size: World.size), z: -3000)
        rect(Palette.path, street, z: -2999)
        rect(Palette.path, shrinePath, z: -2999)
        rect(Palette.path, CGRect(x: 170, y: 326, width: 140, height: 12), z: -2999)   // the shrine's forecourt
        for x in stride(from: 0.0, to: World.size.width, by: 12) { rect(Palette.path2, CGRect(x: x, y: street.minY, width: 6, height: 1), z: -2998) }
        // grass tufts, as in the bubble lab: little 2 x 1 marks
        for _ in 0..<520 {
            let p = CGPoint(x: (rng.next() * World.size.width).rounded(), y: (rng.next() * World.size.height).rounded())
            let tuft = CGRect(x: p.x, y: p.y, width: 2, height: 1)
            if tuft.intersects(street) || tuft.intersects(shrinePath) { continue }
            rect(Palette.grass2, tuft, z: -2998)
        }
    }

    private func rect(_ c: SKColor, _ r: CGRect, z: CGFloat) {
        let n = SKSpriteNode(color: c, size: r.size)
        n.anchorPoint = .zero
        n.position = r.origin
        n.zPosition = z
        node.addChild(n)
    }

    // --- things on it -------------------------------------------------------------

    /// Buildings side by side from x `from`, as many as fit before `to`.
    private func row(_ names: [String], y: CGFloat, from: CGFloat, to: CGFloat, gap: CGFloat = 8) {
        var x = from
        for name in names {
            guard let f = Sprites.info("Buildings", name) else { continue }
            let w = f.w / 4
            if x + w > to { break }
            building(name, at: CGPoint(x: x + f.ax / 4, y: y))
            x += w + gap
        }
    }

    /// A building: its whole picture is solid (nobody walks behind one).
    private func building(_ name: String, at p: CGPoint) {
        guard Sprites.has("Buildings", name) else { return }
        add(Sprites.node("Buildings", name), at: p)
        solids.append(Sprites.box("Buildings", name, at: p))
    }

    /// The torii: you walk through it; only its two posts are solid.
    private func torii(at p: CGPoint) {
        guard Sprites.has("Buildings", "torii_1") else { return }
        add(Sprites.node("Buildings", "torii_1"), at: p)
        let b = Sprites.box("Buildings", "torii_1", at: p)
        solids.append(CGRect(x: b.minX + 3, y: p.y, width: 4, height: 3))
        solids.append(CGRect(x: b.maxX - 7, y: p.y, width: 4, height: 3))
    }

    private func tree(_ name: String, at p: CGPoint) {
        guard Sprites.has("Plants", name) else { return }
        add(Sprites.node("Plants", name), at: p.rounded)
        solids.append(CGRect(x: p.x - 3, y: p.y, width: 6, height: 4))
    }

    /// A street thing or plant; the ground under it (`foot` deep) is solid.
    private func thing(_ group: String, _ name: String, at p: CGPoint, foot: CGFloat, footW: CGFloat? = nil) {
        guard Sprites.has(group, name) else { return }
        add(Sprites.node(group, name), at: p.rounded)
        let b = Sprites.box(group, name, at: p.rounded)
        let w = footW ?? b.width
        solids.append(CGRect(x: p.x - w / 2, y: p.y, width: w, height: foot))
    }

    private func add(_ n: SKSpriteNode, at p: CGPoint) {
        n.position = p
        n.zPosition = World.depth(p.y)
        node.addChild(n)
    }
}

/// A small seeded random stream (the map is the same every time).
struct Seeded {
    private var a: UInt32
    init(seed: UInt32) { a = seed }
    /// mulberry32, as in tiny-characters
    mutating func next() -> CGFloat {
        a = a &+ 0x6D2B79F5
        var t = (a ^ (a >> 15)) &* (1 | a)
        t = (t &+ ((t ^ (t >> 7)) &* (61 | t))) ^ t
        return CGFloat((t ^ (t >> 14))) / 4294967296
    }
}

extension CGPoint {
    var rounded: CGPoint { CGPoint(x: x.rounded(), y: y.rounded()) }
    func distance(to p: CGPoint) -> CGFloat { hypot(p.x - x, p.y - y) }
}
