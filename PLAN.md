# PLAN: Tiny Characters

## Goal

A home for the tiny pixel people the owner liked in Tiny City Builder's
bubble lab, so games can use them and they can grow.

## Decisions (agreed with the owner)

- The demo is on GitHub Pages, served from `main`.
- The characters are the bubble lab's tiny 2D pixel people (about 5 × 15
  pixels), kept as small and simple as they are there.

## Done

1. **First version**: the library (`src/tinyCharacters.js`: draw a person,
   the stage, random looks, seeded crowds, palette snapping), drawn exactly as
   in the bubble lab, plus walking steps, facing, skin and leg colours; the
   demo page (a park to walk around in, tap to talk, a gallery); README,
   SKILLS, PLAN, CLAUDE.md.
2. **GitHub Pages** for the demo, from the root of `main`
   (https://thetinywisdom.github.io/tiny-characters/), with `.nojekyll`.

## Next (only when the owner asks)

1. **More looks, taken from tiny-catalogue's people.** Compared part by
   part on a test sheet at the real size (Nov 2026). Each line is a few
   pixels on the 5 × 15 person; nothing changes the size of an adult.
   - **Bodies:** kid (body 4 rows, legs 2: 11 px tall, same head);
     grandpa and grandma are adults with grey or white hair plus their
     things (flat cap and walking stick; bun, skirt and shopping bag).
   - **Hair:** bald, long (a pixel down each side), ponytail (facing), twin
     tails, afro, bun.
   - **Headwear:** cap (brim forward when facing), straw hat / fedora
     (5 px brim), helmet; flat cap and police cap are the cap in grey or
     navy.
   - **Clothes:** open jacket or cardigan (shirt colour down the middle),
     suit with tie, shorts, skirt, apron, yukata with obi, sailor uniform,
     gakuran, police uniform (navy vest, gold badge).
   - **Carried:** backpack and randoseru (show when facing), shopping bag,
     briefcase, open umbrella, walking stick, boxes.
   - **Starter looks**, like the catalogue's tiles and outfits: man, woman,
     boy, girl, grandpa, grandma, schoolboy, schoolgirl, salaryman, police
     officer, delivery worker, summer stroll, rainy day.
   - **Maybe (the owner decides):** flu mask, beard, angel wings, bulky build
     (7 px wide), shoes or boots (1–2 px at the feet), the catalogue's extra
     hair colours (red, pink, blue), a tiny cat (the catalogue has cats).
   - **Too small, skip:** glasses, sunglasses and moustache (they read as a
     face, and the catalogue's people are faceless too), beanie (looks like
     hair), mohawk, hoodie, sleeves or tank top, backpack straps from the
     front, coffee cup, phone, ice cream, bow tie, fanny pack, headphones,
     every hairstyle variation within a family (side part, undercut, bob
     ...), the body sliders (heads tall, neck, arm thickness ...), walk and
     run styles.
2. Speech with them (floating pixel text from tiny-ui-kit) in the demo.
3. **A tinified catalogue**: a tiny pixel version of the things in
   thetinywisdom/tiny-catalogue, drawn in the same small, simple style as the
   people.
4. **Buildings first, toward a 2D map**: start the tiny catalogue with
   buildings, aiming for a 2D map the tiny people can walk around in.

## Known issues and small ideas

- People walk only left / right / up / down on a flat stage; there is no
  depth sorting beyond drawing the ones further back first.
- People keep to the strip around the path, so the top two thirds of the park
  is empty grass (let them wander higher, or make the park shorter?).
- On a walking step the body bobs up a pixel and a one-pixel gap opens
  between body and legs (close it, or keep it as in the bubble lab?).

## Open questions for the owner

None right now.
