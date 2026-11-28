import SpriteKit

/// The game: the town, you, the people in it and the foes. Tap the ground to
/// walk there, tap someone to walk up and talk, tap a foe (or walk into it) to fight.
final class WorldScene: SKScene {
    private let story = Story()
    private var world: World!
    private let cam = SKCameraNode()
    private let ui = SKNode()                // on the camera, in points
    private var zoom: CGFloat = 3            // screen points per pixel

    private var player: Walker!
    private let playerLook = "man"
    private let startSpot = CGPoint(x: 240, y: 160)
    private var npcs: [(info: NPCInfo, walker: Walker)] = []
    private var foes: [(info: FoeInfo, walker: Walker, home: CGPoint)] = []

    private var target: CGPoint?
    private var talkTo: Int?
    private var dialogue: DialogueBox?
    private var battle: Battle?
    private var goal: SKLabelNode!
    private var last: TimeInterval = 0
    private var clock: TimeInterval = 0

    override func didMove(to view: SKView) {
        guard world == nil else { return }
        backgroundColor = Palette.ink
        view.ignoresSiblingOrder = true
        world = World()
        addChild(world.node)
        addChild(cam)
        camera = cam
        ui.zPosition = 5000                  // over the whole town
        cam.addChild(ui)

        player = Walker(look: playerLook, at: startSpot, facing: "up")
        world.node.addChild(player)
        for n in story.info.npcs {
            let w = Walker(look: n.look, at: CGPoint(x: n.x, y: n.y), facing: n.facing)
            world.node.addChild(w)
            npcs.append((n, w))
        }
        for f in story.info.foes {
            let home = CGPoint(x: f.x, y: f.y)
            let w = Walker(group: "Monsters", look: f.sprite, at: home, facing: "down")
            world.node.addChild(w)
            foes.append((f, w, home))
        }
        goal = UI.label("", size: 15, color: Palette.paper)
        goal.horizontalAlignmentMode = .center
        goal.verticalAlignmentMode = .top
        ui.addChild(goal)
        layout()
        updateGoal()
    }

    override func didChangeSize(_ oldSize: CGSize) { if world != nil { layout() } }

    /// A whole number of points per pixel, so every pixel is the same size.
    private func layout() {
        zoom = max(2, min(6, (min(size.width, size.height) / 130).rounded(.down)))
        cam.setScale(1 / zoom)
        ui.setScale(zoom)                    // cancels the camera's scale: ui is in points
        let top = view?.safeAreaInsets.top ?? 0
        goal.position = CGPoint(x: 0, y: size.height / 2 - max(top, 12) - 8)
        follow()
    }

    private func updateGoal() { goal.text = "\(story.info.title): \(story.goal)" }

    // --- touches ------------------------------------------------------------------

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let t = touches.first else { return }
        if let b = battle { b.tap(at: t.location(in: b)); return }
        if let d = dialogue { d.tap(); return }
        let p = t.location(in: world.node)
        if let i = npcs.firstIndex(where: { hitBox($0.walker).contains(p) }) {
            talkTo = i
            target = npcs[i].walker.spot
            return
        }
        if let f = foes.first(where: { hitBox($0.walker).contains(p) }) { target = f.walker.spot; talkTo = nil; return }
        talkTo = nil
        target = p
    }

    /// Easier to tap than the sprite itself.
    private func hitBox(_ w: Walker) -> CGRect { w.frame.insetBy(dx: -6, dy: -6) }

    // --- every frame -------------------------------------------------------------

    override func update(_ now: TimeInterval) {
        let dt = last == 0 ? 0 : min(1.0 / 20, now - last)
        last = now
        clock += dt
        if let b = battle { b.tick(dt); return }
        dialogue?.tick(dt)
        walkPlayer(dt)
        player.tick(dt)
        for n in npcs { n.walker.tick(dt) }
        moveFoes(dt)
        follow()
    }

    private func walkPlayer(_ dt: TimeInterval) {
        guard dialogue == nil, let goalSpot = target else { player.walking = false; return }
        // talking: stop a few pixels short and talk
        if let i = talkTo, player.spot.distance(to: npcs[i].walker.spot) < 14 { player.walking = false; target = nil; talkTo = nil; talk(i); return }
        let d = CGPoint(x: goalSpot.x - player.spot.x, y: goalSpot.y - player.spot.y)
        let len = hypot(d.x, d.y)
        if len < 1 { player.walking = false; target = nil; return }
        let step = min(len, 42 * CGFloat(dt))
        let move = CGPoint(x: d.x / len * step, y: d.y / len * step)
        player.facing = Walker.facing(dx: d.x, dy: d.y, was: player.facing)
        // slide along walls: the whole step, else only across, else only up or down
        for m in [move, CGPoint(x: move.x, y: 0), CGPoint(x: 0, y: move.y)] where m != .zero {
            let next = CGPoint(x: player.spot.x + m.x, y: player.spot.y + m.y)
            if world.free(feet(next)) && !bumps(next) { player.spot = next; player.walking = true; return }
        }
        player.walking = false
        target = nil
    }

    private func feet(_ p: CGPoint) -> CGRect { CGRect(x: p.x - 2, y: p.y, width: 5, height: 2) }
    private func bumps(_ p: CGPoint) -> Bool { npcs.contains { feet($0.walker.spot).intersects(feet(p)) } }

    /// Foes pace back and forth near home; come close and the fight starts.
    private func moveFoes(_ dt: TimeInterval) {
        for f in foes {
            let x = f.home.x + 14 * sin(clock * 0.6)
            let was = f.walker.spot
            f.walker.spot = CGPoint(x: x, y: f.home.y)
            f.walker.facing = x < was.x ? "left" : "right"
            f.walker.walking = true
            f.walker.tick(dt)
            if dialogue == nil, player.spot.distance(to: f.walker.spot) < 11 { fight(f.info); return }
        }
    }

    private func follow() {
        guard let player else { return }
        let half = CGSize(width: size.width / zoom / 2, height: size.height / zoom / 2)
        func clamp(_ v: CGFloat, _ lo: CGFloat, _ hi: CGFloat) -> CGFloat { lo > hi ? (lo + hi) / 2 : min(max(v, lo), hi) }
        let x = clamp(player.spot.x, half.width, World.size.width - half.width)
        let y = clamp(player.spot.y + 10, half.height, World.size.height - half.height)
        cam.position = CGPoint(x: x.rounded(), y: y.rounded())
    }

    // --- talking -------------------------------------------------------------------

    private func talk(_ i: Int) {
        let (info, w) = npcs[i]
        guard let line = story.talk(info) else { return }
        w.face(player.spot)
        player.face(w.spot)
        let width = min(size.width - 24, 560)
        let box = DialogueBox(name: info.name, lines: line.lines, width: width) { [weak self] in
            guard let self else { return }
            self.dialogue = nil
            if let next = line.set { self.story.state = next; self.updateGoal() }
            w.facing = info.facing
        }
        let bottom = view?.safeAreaInsets.bottom ?? 0
        box.position = CGPoint(x: 0, y: -size.height / 2 + max(bottom, 12) + 66)
        box.zPosition = 10
        ui.addChild(box)
        dialogue = box
    }

    // --- fighting ------------------------------------------------------------------

    private func fight(_ foe: FoeInfo) {
        target = nil
        talkTo = nil
        player.walking = false
        let b = Battle(foe: foe, player: playerLook, screen: size) { [weak self] result in
            guard let self else { return }
            self.battle = nil
            switch result {
            case .won:
                if let i = self.foes.firstIndex(where: { $0.info.id == foe.id }) { self.foes[i].walker.removeFromParent(); self.foes.remove(at: i) }
                self.story.state = foe.win
                self.updateGoal()
            case .fled:
                self.player.spot = CGPoint(x: self.player.spot.x, y: self.player.spot.y - 24)
                self.player.facing = "down"
            case .lost:
                self.player.spot = self.startSpot
                self.player.facing = "up"
            }
            self.follow()
        }
        b.zPosition = 20
        ui.addChild(b)
        battle = b
    }
}
