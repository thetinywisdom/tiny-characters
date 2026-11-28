# Tiny RPG (iOS, Swift + SpriteKit)

A small story game with the tiny people of tiny-characters: walk round a little
town, talk to people, and one short fight. The first chapter is "The Quiet Bell".

- Open `TinyRPG.xcodeproj` in Xcode 16 or later, pick an iPhone simulator, Run.
  To run on your phone, choose your team under Signing & Capabilities.
- The pictures are not drawn here: they are exported from the JS library
  (`node tools/export-sprites.mjs ios/TinyRPG/Sprites --no-preview`, from the
  repository root) into `TinyRPG/Sprites/*.atlas` and `sprites.json`. Re-run it
  whenever the drawings change.
- The story is `TinyRPG/story.json`: who stands where, what they say in each
  state of the quest ("when"), which state a talk or a win moves to ("set",
  "win"), the foes and their lines.
- Files: `WorldScene.swift` (the game: touches, walking, talking, starting a
  fight, the camera), `World.swift` (the map and what is solid), `Walker.swift`
  (anyone who walks), `Battle.swift` (the fight), `UI.swift` (dialogue box,
  panels, buttons), `Story.swift`, `Sprites.swift`, `PixelFont.swift`.
- One world unit is one person pixel; the camera shows a whole number of
  screen points per pixel, and every texture uses nearest filtering.
- Font: DotGothic16 (SIL Open Font License, `TinyRPG/Fonts/DotGothic16-OFL.txt`).
