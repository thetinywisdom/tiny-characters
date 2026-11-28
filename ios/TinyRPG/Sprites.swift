import SpriteKit

// The pictures, exported from tiny-characters (tools/export-sprites.mjs) into
// Sprites/<Group>.atlas, with Sprites/sprites.json: each frame's size and feet
// point (ax, ay from the top left), each group's scale (pixels per world pixel:
// 1, or 4 for the buildings), and the walk cycles (anims["<name>_<facing>"]).
// One world unit is one person pixel; every texture is drawn with hard pixels.

struct FrameInfo: Decodable { let w: CGFloat; let h: CGFloat; let ax: CGFloat; let ay: CGFloat }
struct GroupInfo: Decodable { let scale: CGFloat; let frames: [String: FrameInfo] }
struct SpriteIndex: Decodable { let anims: [String: [String]]; let groups: [String: GroupInfo] }

enum Sprites {
    static let index: SpriteIndex = {
        let url = Bundle.main.url(forResource: "sprites", withExtension: "json")
            ?? Bundle.main.url(forResource: "sprites", withExtension: "json", subdirectory: "Sprites")
        guard let url, let data = try? Data(contentsOf: url) else { fatalError("Sprites/sprites.json is missing from the app") }
        do { return try JSONDecoder().decode(SpriteIndex.self, from: data) }
        catch { fatalError("sprites.json: \(error)") }
    }()

    private static var atlases: [String: SKTextureAtlas] = [:]
    private static var textures: [String: SKTexture] = [:]

    static func atlas(_ group: String) -> SKTextureAtlas {
        if let a = atlases[group] { return a }
        let a = SKTextureAtlas(named: group)
        atlases[group] = a
        return a
    }

    static func texture(_ group: String, _ name: String) -> SKTexture {
        let key = group + "/" + name
        if let t = textures[key] { return t }
        let t = atlas(group).textureNamed(name)
        t.filteringMode = .nearest
        textures[key] = t
        return t
    }

    static func info(_ group: String, _ name: String) -> FrameInfo? { index.groups[group]?.frames[name] }
    static func has(_ group: String, _ name: String) -> Bool { info(group, name) != nil }
    static func anim(_ key: String) -> [String]? { index.anims[key] }

    /// A sprite with its feet at the node's position, sized in world pixels.
    static func node(_ group: String, _ name: String) -> SKSpriteNode {
        let n = SKSpriteNode()
        apply(n, group, name)
        return n
    }

    /// Show frame `name` on `n` (texture, size, feet as the anchor).
    static func apply(_ n: SKSpriteNode, _ group: String, _ name: String) {
        guard let f = info(group, name) else { return }
        let s = index.groups[group]?.scale ?? 1
        n.texture = texture(group, name)
        n.size = CGSize(width: f.w / s, height: f.h / s)
        n.anchorPoint = CGPoint(x: f.ax / f.w, y: 1 - f.ay / f.h)
    }

    /// The picture's box in world pixels for a frame standing at `foot`.
    static func box(_ group: String, _ name: String, at foot: CGPoint) -> CGRect {
        guard let f = info(group, name) else { return .zero }
        let s = index.groups[group]?.scale ?? 1
        return CGRect(x: foot.x - f.ax / s, y: foot.y - (f.h - f.ay) / s, width: f.w / s, height: f.h / s)
    }
}

/// The palette of tiny-characters (COLORS and friends), as SKColors.
enum Palette {
    static func hex(_ s: String) -> SKColor {
        var v: UInt64 = 0
        Scanner(string: s.replacingOccurrences(of: "#", with: "")).scanHexInt64(&v)
        return SKColor(red: CGFloat((v >> 16) & 255) / 255, green: CGFloat((v >> 8) & 255) / 255, blue: CGFloat(v & 255) / 255, alpha: 1)
    }
    static let ink = hex("#2f3236"), paper = hex("#f2efe8"), navy = hex("#262b3a"), gold = hex("#f2b64a")
    static let grass = hex("#9fb08d"), grass2 = hex("#93a582"), path = hex("#ddd0aa"), path2 = hex("#cfc09a")
    static let red = hex("#d8443c"), green = hex("#5f8f5a")
}
