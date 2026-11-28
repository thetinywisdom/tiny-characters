import SwiftUI
import SpriteKit

/// Tiny RPG: a small story game with the tiny people of tiny-characters.
@main
struct TinyRPGApp: App {
    init() { PixelFont.register() }
    var body: some Scene {
        WindowGroup { GameView() }
    }
}

struct GameView: View {
    @State private var scene: WorldScene = {
        let s = WorldScene(size: CGSize(width: 390, height: 844))
        s.scaleMode = .resizeFill
        return s
    }()
    var body: some View {
        SpriteView(scene: scene, preferredFramesPerSecond: 60, options: [.ignoresSiblingOrder])
            .ignoresSafeArea()
            .statusBarHidden()
    }
}
