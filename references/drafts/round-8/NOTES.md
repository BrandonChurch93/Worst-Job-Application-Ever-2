# Reference round 8: the arena from above and the new boss alone

Drafts. Nothing here is approved and nothing here is built until Brandon picks. Made on 2026-11-27 between 2:07 PM and 2:17 PM Mountain Time, delivered with Status 170.

## What was asked

Brandon, in the thread, about 1:49 PM MT on 2026-11-27, word for word: "Where the actual Boss battle none of those are what I was envisioning I'm envisioning a top down arena similar to what it looks like now as far as the camera angle, but an actual arena that we fight in with a 3-D environment that is breakable when the Boss fires his big Canon, we also need a couple images of what the new boss will look like that should probably be done separate from the arena"

How the Builder read it (logged as a decision): top down means the camera of step 4 as it is built today; an actual arena means a bounded floor with walls and cover that fills the screen; each arena is shown whole and then after the blast of the cannon on the boss's back; the boss is shown alone on plain ground, once as the game sees it and once from the side. The locks of round 7b still hold where his words do not change them: the same world as the build (ceramic, frosted glass, brushed aluminum, orange plastic, one soft light from the upper left, the same type, the cursor at its real size), no cinematic lighting, no photographs, no people and no creatures.

## The codes, one line each

He picks by code and may mix (an arena from one, a boss from another).

- ARENA 1: a pit sunk into the page, the header and the step rail kept. An aluminum rim, curved walls of ceramic blocks, eight columns, glass slabs for cover. After the cannon: the rim breached, two columns down to stumps, a wall scattered, a glass slab in shards, two scorched tracks across the floor.
- ARENA 2: an arena built from the application's own parts, the header and the step rail kept. A ring of frosted glass panels, four blocks of keyboard keys, four pillars of stacked metal discs, two checkbox cubes, the three red error slabs as cover. After the cannon: the ring breached, a pillar toppled, a cube in shards, two slabs gone and one cracked in two, keys blown out.
- ARENA 3: a dark machine hall under the page, the whole screen. An eight-sided ceramic wall, a dark riveted deck with orange light channels, four fans, eight pylons, two banks of round tanks. After the cannon: the wall breached, a bank of tanks burst and spilled, a pylon bursting, a fan wrecked.
- ARENA 4, the wildcard: the company's office as the arena, the whole screen. Cubicles, filing cabinets, copiers, a water cooler, a reception desk, a glass meeting room. Why: every desk and copier is cover the visitor can hide behind and the boss can blow apart, and it is the place the application was keeping the visitor out of. After the cannon: a cubicle and a corner of the outer wall blown out, copiers thrown over, the meeting room's glass shattered and its table split.
- LOOK 1: a walker. The Submit button on a low hull on legs, a long cannon along its back, a curved glass shield in front, two rotary guns.
- LOOK 2: a siege tank. Two tracks, a round turret with the Submit button under a heavy gun, a glass plough as the shield.
- LOOK 3: a hovering gyroscope. Rings turning round a round Submit button, a rail gun over it, a glass arc as the shield, an orange glow underneath.
- LOOK 4, the wildcard: the whole application bolted into one machine. The step buttons 1 to 5, the three red error slabs, the shredder's rollers as jaws, the rotary dial, the crank, and a big cannon on the back. Why: every weapon on it is a thing that already beat the visitor earlier in the application.

The boss inside the ARENA pictures is a stand-in: the machine of today with a cannon on its back. The boss is picked from the LOOK pictures.

## Faults and strays, said plainly

No picture was judged for taste. These are facts read off the pictures, each viewed once.

- ARENA 1: the camera leans a little toward the viewer; the far wall shows slightly more of its face than a true view from straight above would.
- ARENA 2 after the cannon: two large metal door keys and two button-like discs lie in the wreck near the upper left. Nobody asked for them.
- ARENA 3: the health bar carries a number, "75%" whole and "50%" after the cannon. Nobody asked for it.
- ARENA 3 and ARENA 4 drop the header and the step rail. That was asked: Brandon's words on item 17 are "I really think we should move all the content off the screen for this boss fight". ARENA 1 and ARENA 2 keep them so that both ways can be seen.
- LOOK 1: the view from above shows four legs, the view from the side shows six.
- LOOK 1 and LOOK 2 from above: the cannon lies over the Submit pill. On LOOK 1 the word still reads under it; on LOOK 2 the word sits on the barrel.
- LOOK 3: the Submit button is round, not the pill of the build.
- LOOK 4 from above is seen from above with a slight lean, so its legs and the cannon's mouth show.
- LOOK 4 from the side is drawn with thin dark outlines, like an illustration, where the other pictures are soft renders, and it shows a thin pane of glass along the deck that the view from above does not have.
- Every word in every picture is spelled right. No people, no faces, no creatures.

## Retakes and why

A retake is allowed only for a failed call, broken text or a broken lock, at most twice per picture. No call failed and no text was broken.

- ARENA 2, one retake. Take 1 drew the health bar twice and tilted the camera. Take 2 is used.
- ARENA 3, one retake. Take 1 was seen from the side and above on a blue-grey ground, turned the boss into a standing robot figure (the kit rules out creatures and people) and drew the cursor far too large. Take 2 is used.
- ARENA 4, one retake. Take 1 was seen from the front and above. Take 2 is used.
- LOOK 4 from the side, two retakes. Takes 1 and 2 stood the machine's top deck upright as its front, so the two views were not one machine. Take 3 was asked as a strict side elevation and agrees with the view from above. Take 3 is used.
- The takes that were not used are kept small under `takes/`.

## Method, and what each input controlled

Every picture is one call to the image model at 16:9, returned at 2752x1536, cut to 16:9 at the centre and brought to 1920x1080 in code. The code of each picture is printed in a dark band of 100 rows under it, so the picture itself is untouched: a file here is 1920x1180 and its picture is the top 1080 rows.

- ARENA 1 (take 1). Image 1, the real 1920x1080 screenshot of step 4 in the fight (`BASELINE.png` without its band): the page, the header and rail, the type, the materials, the light, the cursor's size, the camera. Image 2, the approved `references/approved/tier-office.png`: how depth shows as relief and shadow inside the page. The words: the arena and what stands in it.
- ARENA 2, 3 and 4 (take 2). Image 1 only, the real screenshot, for the same things. The words: the arena, and the camera said as a plan view from straight above. Lesson kept for later rounds: with the approved tier picture as a second image and words that allowed the walls' sides to show, the camera tilted in three of four first takes; the screenshot alone with the strict plan-view wording held it.
- Each "after the cannon". One image only, the arena's own whole picture: everything that is not destroyed. The words: what the blast broke and where the beam is.
- LOOK 1, 2 and 3 from the side, and LOOK 4 from above (the first takes). Image 1, the real screenshot: the materials, the light, the ceramic ground, the look of the Submit button. The words: the machine. They were asked alone on plain ground; three came seen from the front left and above and are kept as the side views, one came from above.
- LOOK 1, 2 and 3 from above. Image 1, the look's first picture: the design. Image 2, the real screenshot: the camera and the ground. The words: the same machine seen from straight above.
- LOOK 4 from the side. Image 1 only, the view from above: the design. The words: the camera.

Times of the calls, measured: 23 s to 29 s each, 21 calls, none failed.

## Files

- `contact-sheet-ARENA.jpg`, `contact-sheet-LOOK.jpg`: BASELINE as the first tile, then each code.
- `BASELINE.png`: the real screenshot of step 4 in the fight on the build of today.
- `ARENA-1.png` to `ARENA-4.png`, `ARENA-1-after-the-cannon.png` to `ARENA-4-after-the-cannon.png`.
- `LOOK-1-from-above.png` to `LOOK-4-from-above.png`, `LOOK-1-from-the-side.png` to `LOOK-4-from-the-side.png`.
- `takes/`: the five takes that were not used.
