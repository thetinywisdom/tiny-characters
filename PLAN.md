# PLAN: Tiny Characters

## Goal

A home for the tiny pixel people the owner liked in Tiny City Builder's
bubble lab, so games can use them and they can grow.

## Decisions (agreed with the owner)

- The characters are the bubble lab's tiny 2D pixel people (about 5 × 15
  pixels), kept as small and simple as they are there.

## Done

1. **First version**: the library (`src/tinyCharacters.js`: draw a person,
   the stage, random looks, seeded crowds, palette snapping), drawn exactly as
   in the bubble lab, plus walking steps, facing, skin and leg colours; the
   demo page (a park to walk around in, tap to talk, a gallery); README,
   SKILLS, PLAN, CLAUDE.md.

## Next (only when the owner asks)

1. More looks: hats, skirts, bags, children and grandparents.
2. Speech with them (floating pixel text from tiny-ui-kit) in the demo.
3. GitHub Pages for the demo.

## Known issues and small ideas

- People walk only left / right / up / down on a flat stage; there is no
  depth sorting beyond drawing the ones further back first.

## Open questions for the owner

None right now.
