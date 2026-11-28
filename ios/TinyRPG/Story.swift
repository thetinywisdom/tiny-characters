import Foundation

// The story lives in story.json, not in code: who stands where, what they say
// in each state of the quest, which foes there are and what beating them changes.
// "when" is a state name or "*" (any); "set" moves the story to a new state.

struct TalkLine: Decodable { let when: String; let set: String?; let lines: [String] }
struct NPCInfo: Decodable { let id, name, look: String; let x, y: Double; let facing: String; let talk: [TalkLine] }
struct FoeInfo: Decodable {
    let id, name, sprite: String
    let x, y: Double
    let hp: Int
    let attack: [Int]
    let win: String
    let intro, defeat: String
    let taunts: [String]
}
struct StoryInfo: Decodable {
    let title, start: String
    let goals: [String: String]
    let npcs: [NPCInfo]
    let foes: [FoeInfo]
}

final class Story {
    let info: StoryInfo
    var state: String

    init() {
        guard let url = Bundle.main.url(forResource: "story", withExtension: "json"),
              let data = try? Data(contentsOf: url) else { fatalError("story.json is missing from the app") }
        do { info = try JSONDecoder().decode(StoryInfo.self, from: data) }
        catch { fatalError("story.json: \(error)") }
        state = info.start
    }

    var goal: String { info.goals[state] ?? "" }

    /// What someone says now (and the state it leads to).
    func talk(_ npc: NPCInfo) -> TalkLine? {
        npc.talk.first { $0.when == state } ?? npc.talk.first { $0.when == "*" }
    }
}
