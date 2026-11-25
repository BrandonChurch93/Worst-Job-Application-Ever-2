# Step 1, About You: decisions

The logic, the script of the film and the numbers the makers of the real parts read. The shapes this page draws are the stand-ins; the real parts are built from them and from `v`.

## Layout

- Two columns under the step head: the resume card on the left, the three fields on the right, the keyboard deck across the full width below.
- The helper text of First name sits under its field at the left, as in the approved image. Last name and Email are moved down by its line (`HELPER_ROOM`, 34 px), and the gap between fields is 12 px.
- Continue sits right-aligned in the lower area. It is hidden while the keyboard is up, because the keyboard takes that area.
- The keyboard note is shown for as long as the keyboard is up.
- The shredder slot sits under the resume card, centred on it.

## Keyboard

- A click on any field opens the keyboard on First name. The order of the fields is fixed.
- A key press is queued. It fires when the cursor tip reaches the key, or after a short wait, whichever comes first.
- Names are capitalised by the page. Enter or Tab moves on once the field has its minimum.
- `typing()` is true while the keyboard is up.

## Turrets

- `Turrets` is a class that stands alone: no page state, its own `save()` and `load()`.
- A hit burns the last letter, knocks the cursor back and calls `hurt('burn')`.
- The film takes exactly one hit, at "Perpl", at 7.14 s of the unit, after two proud pauses of more than a second each. Between them, at 6.0 s, is the frame of the approved image: two bolts in the air, one 106 px from the cursor, the cursor in the air on its way from W up and to the right to the 5. The turrets rise `TIMES.turretDelay` (0.72 s) into the first name, in the film and live. The letter burns away 0.2 s after the hit (`SINGE`). It then types the name again to the end.
- A bolt that lands within 130 px of the cursor makes it flinch, unless it is being proud.
- For 0.9 s after a hit the cursor cannot be hit again.

## Last name

- The keys change places after each letter. In a live run they also change every 5 s while the visitor waits, so a still visitor sees the gag.
- The film chases the keys and types "Computer" in full.

## Email and slabs

- Three slabs, each aimed at where the cursor is. Each hangs for 0.2 s, then falls for 0.2 s. The film sees each one and dives clear of all three.
- When a slab lands the deck and its keys shake in the plane of the page by at most 4.5 px for 0.25 s (`SHAKE`), the keys within 460 px hop up to 15 px, the nearest first, the caret jumps and the cursor is jolted.
- A key under a landed slab is pressed its full travel (6 px) and stays down until the slabs lift. The slab sinks with the keys, stops dead and rebounds once by 1.2 px inside 0.06 s.
- A slab that lands on the cursor flattens it for a moment through `hurt`.

## Resume and the tug

- The paper sticks to the cursor on a click, so click then click works as well as a drag.
- The paper and the hands ride above the resume card, so nothing is hidden by it.
- The hands sit on the paper: the points in `resume-paper` are kept at most `300 * (1 - amount) - 34` px from the slot (`TUG.inside`), so the sheet never has to stretch.
- The hands are 128 px apart across the sheet (`TUG.hands`, 64 each side of the middle). `lx, ly` is the hand on the cursor's left as seen from above the slot, the same hand as the first arm.
- The strain is measured from the hands: the paper is taut when the hands are `300 * (1 - amount) - 34` px from the slot, and slack when nearer. The shoulder stays `TUG.reach` from the hands, 42 to 92 px: short while the cursor hauls, long while the shredder bites.
- In the film the shredder gains about 0.11 of the sheet in each cycle of a bite and a haul (`TUG_CURVE`: seconds, amount, lean in radians, strain in px). At the middle of the beat 0.44 of the sheet is gone, so the title still shows, as in the approved image.
- A line of the sheet that the shredder has eaten is parked at the slot under the page (z -30) with `v = [1]`, so the count of shapes does not change.
- No control is taken during the tug. The cursor is tethered to the paper by a knock, never held.
- A live tug is lost at the far end or after 9 s.
- After the loss the page stays in the tug for 0.3 s (`TIMES.lost`) with the arms off and the cursor taken, so the torn arms of the body can be seen. For that time the body is driven over the card, 6 px above its face and 84 px up the page from the slot, so the plate does not cut it. Then the shredder has it.

- From the first bite the six paper strips hang under the hood (`FRINGE`): `u = clamp((most - 0.12 - order * 0.018) * 1.2, 0, 0.34)`, where `most` is the largest share of the sheet eaten so far, so a strip never goes back in. After the loss each goes on from where it hangs.
- The drop zone has an upload glyph above its prompt (`GLYPH`, `uploadGlyph`): six strokes 3 px wide, 64 px across, drawn as `resume-glyph-<i>` boxes of the shell in ink on the face of the card until the resume is received. A level stroke is a box with no turn: a turned box whose own rectangle lay over the prompt made the type maker set the prompt for the wrong ground (contrast 3.43).

## Last 4 s

- The kit wins. From the moment the shredder has the cursor (`SHRED`, seconds): the body is under the page at 0.34, the strips leave the hood from 0.12, the cursor lies as a pile of strips from 0.78 for 1.0 s, the form empties from 0.92 to 1.76 (Email, then Last name, then First name, one field after the other, 0.28 s each: the focus ring lights on the field and its caret runs back along the line and takes a character at a time), the strips zip back from 1.78 for 1.0 s, and the pointer is handed back at 2.8. In the film that is whole at 30.2 s, with 1.3 s left to look at the empty form and start toward it.

## When the visitor does nothing

- Each phase moves on by itself after 20 s with a still or wrong pointer.

## Known and worked around

- The blockout draws field pockets flat and puts text at the field height, below the surface. Typed values were hidden. This page lifts its value text in `draw`. Any page with typed values meets the same thing.

## For the film

- `fire.ts` gives `makeTurrets()` and `drawFire(out, { typed, pressed, turrets })`: the page with the keyboard up, First name holding `typed`, the keys named in `pressed` down, and the given turrets with their bolts and marks. Key names are those of `keyboard.json`.
- The cursor grabs the paper by its top right corner, clear of the title.
- The film camera eases from home to a wide frame (1000 px wide) between 21.1 s and 22.1 s, pushes in for 2.7 s to a 928 px frame (`TUG_CLOSE`: the whole drop zone, its label whole above it, the slot, the hood and the strips under it) and holds it through the key still at 25.125, then eases home between 27.6 s and 28.9 s. Both frames share one top edge, 46 px above the drop zone and under the line of the step's lead, and one right edge, `TUG_EDGE` = `FIELD_X` - 16, in the gutter between the shadow of the drop zone and the field column, so from 22.1 s to 27.6 s no label or field of the right column is cut by the frame. No closer: the fine detail against the approved image (M3) is 1.092 at this frame and falls under the least at about 850 px. `tests/step1-script.test.ts` holds the cursor at least 70 px inside the frame for the whole tug (least 86 px, at the top edge at 22.93 s), the field column outside the right edge and the label at least 16 px under the top edge.
- The end (`END`, seconds after the cursor is whole): a double take at 0.06, a lean toward the message with `shocked` from 0.14, a wind-up and a stamp in `angry` at 0.62, then `exhausted` and a trudge of 0.8 s away from the card from 1.0.

## For the measures

- A part that a gag has taken from its place in the layout tree carries `moved: true` for as long as it is away: the paper and its lines while it slides, is carried, fed or tugged; a slab; a key and its legend while it sits on another seat or flies to one. A part at rest on the tree does not carry it.
- `mechanism` is on the keycaps, the turrets and the shredder housing, and only while the part stands at least `machineMinTop` high. The deck, the slab, the paper and the upper lip of the slot are not mechanisms.
- A keycap node has no `floor`: the still's state gives a part's height as its top less its node's floor, and scale.heights.keycap (42) is a height above the page, not above the deck. The key shape still stands on the deck: each draw sets its `z0` to the deck top.
- Left for the Builder, in `NEEDS.patch`, not applied on this branch: `src/capture/showcase.ts` takes a node's floor from its top even when the floor is under the page, so a progress button on its rail (floor -3) reads 13 for 10 and a button cap in its socket (floor -4) reads 18 for 14, on every page. Taking only a floor above the page from the top turns M9 green for this unit.
- `strips-zip` is emitted with hitsCursor false: the strips fly to the pile, they do not strike the cursor.

## After round 1 of the blockout

- The reset. In the film the tug lasts 5.2 s (22.25 to 27.45), the strips fly at 28.56, the fields empty and the message that asks for everything again shows at 28.96, and the page turns at 31.50: 2.54 s of hold. The camera is back home by 28.70 and stays there. The message is set in the hero type (32 px, weight 600) in the middle of the resume card.
- The line between `step1.tug` and `step1.shredded` is 28.25, not 28. At 28 the narrator's line "The shredder / always wins." ends 0.2 s before the next line starts and `tests/content.test.ts` refuses it (0.3 s is the least). 28.25 is the first quarter second that passes.
- The slabs. A slab never lands on the typed address. It is aimed at the cursor. If the cursor is on the field row and there is room right of the value (24 px clear), the slab lands on the field beside the value. Otherwise it lands on the keyboard, on top of the keys, where the cursor stands. In the film: beside the value, on the keys, beside the value.
- Continue is drawn as step 2 draws its own: metal with dark type while the form is empty, accent with light type once the form can be sent. It stays under the fields, at the line the keyboard rises from.


## After round 2 of the blockout

- The tug. `TUG_CURVE` has five bites, each followed by a pull-back, over the same 5.2 s. The arms change length with the rate of the paper (`tugReach`, 50 to 150 px): long when the shredder bites, short when the cursor hauls. The cursor leans to the other side on each pull-back. No second of the tug looks like the one before it.
- The first name. A bolt is a light capsule with a dark edge and a short tail. The muzzle is a light block on a dark barrel. A scorch is a small disc. The pressed key stays down 0.24 s and is drawn dark. The cursor dodges, ducks, stands proud on x for 0.8 s, is hit once, holds the shock for about 0.95 s, then types the rest. The times are in the `FIRST` table in `script.ts`.
- The slabs. This replaces the note of round 1. Each slab falls straight down from 110 px onto the place where the cursor stood on the keyboard, stays where it landed, and all three lift together after the third. None lands on the address, its field or the Continue button. The fall is low because the straight-on camera shows height only by the shadow, and a slab that hangs higher throws the two thin shadow lines the critics saw.
- The sink. The well keeps its full width and closes upward. A legend is not drawn once its key is within 24 px of the closing edge, so no legend shows without its key.
- The landing. The film cursor is let go by the page turn at 0.5 s at the handoff point and reaches the page at about 1.0 to 1.2 s. The script now waits at the handoff point and walks straight to the First name field. The click is still at 1.08 s, while the cursor is close to the page but not yet on it.

## The script of the film

- `script.ts` builds the pointer path from moves: a start, an end, an arc that bulges up the screen, and an ease. Two moves never overlap; `makePlan` throws if they do.
- A cue is a time with an acting state, a reaction, or a hop (an upward speed given to the body). A leap is a move with a hop at its start, so the body leaves the key, flies the arc and comes down on the next key.
- Every time in `FIRST`, `LAST`, `MAIL`, `DIVE`, `RESUME`, `TRUDGE` and `CAMERA` is a second of the unit.
- The click on the field is at 1.5 s. The cursor is on the page from 0.96 s.

## Numbers for the makers: `v`

All are blended between sim steps by the stage. A length never changes for an id.

| Shape | `v` | Meaning |
| --- | --- | --- |
| `keyboard-deck` | `[rise, swing, shake]` | rise 0 to 1: how far the deck has come up. swing: px above its seat while it overshoots. shake: px of in-plane shake from a slab, signed. |
| `key-<name>` | `[press, hop, shuffle, heat]` | press 0 to 1: how far down. hop: px above its seat, from a shuffle, a slab nearby or the rattle as the deck seats. shuffle 0 to 1: peak in the middle of a change of places. heat 0 to 1: a scorch lies on the key, cooling. |
| `email-slab`, `email-slab-<n>` | `[since, impact]` | since: seconds since it landed, 0 before. impact: 1 at the landing, 0 after 0.25 s. |
| `resume-paper` | `[lift, bite, amount, pull, lx, ly, rx, ry, vx, vy, hands]` | lift: px above the page. bite 0 to 1: how far the feed into the slot has gone, 1 in the tug. amount 0 to 1: how much of the sheet the shredder has. pull 0 to 1: strain between the hands and the slot. lx, ly, rx, ry: page px of the left and right hand; with no arms both are the point the cursor holds. vx, vy: px per second of the held end. hands: 1 while two hands hold it. |
| `resume-paper-line-<i>` | `[eaten]` | 1 once the line is past the slot. An eaten line and the eaten title are drawn at the slot, 30 px under the page, so the count of shapes never changes. |
| `shredder-jaw-0`, `shredder-jaw-1` | `[open, turn, feed]` | open 0 to 1. turn: radians, summed in `step`, 14 rad/s in the tug and 30 rad/s while it eats the cursor, with 0.3 s of lag. feed: change of amount per second. |
| `strip-<i>` | `[u, ink]` | u 0 to 1: its way out of the hood. ink 1: a strip of the cursor, dark, which goes to the pile (`PILE`, 176 px under the slot) and zips into the cursor; 0: a strip of paper, which hangs in a heap 56 px under the hood (`HEAP`) and is drawn back under the hood in 0.3 s (`TIDY`) once the message shows. |
| `field-focus` | `[glow]` | 1 on a typed or erased character, 0 after 0.25 s. |
| `field-caret` | `[jump]` | px above its line, after a slab lands. |
| `turret-<i>` | `[cos aim, sin aim, charge, since, heat, back, open, shots]` | Set by `Turrets.draw` (keyboard_smith). charge 0 to 1 over the 0.35 s wind-up. since: seconds since its last shot, at most 1. heat 0 to 1 once overheated. back: px the barrel is pulled back. open 0 to 1: the hatch. shots: how many it has fired. |
| `bolt-<n>` | `[share, born]` | share 0 to 1 of its flight. born 0 to 1 over its first 0.05 s. |
| `scorch-<n>` | `[left]` | share of its 2.4 s of life that is left. It fades in 0.4 s once the turrets start down. |

The slot's well is drawn at full width from its first frame. Strips leave from `HOOD`, the south face of the hood, 8 px above the page.

## Phase 3: the tug at the cursor's scale

This replaces every size and camera number of the tug given above.

- The sheet is 64 by 88 px (`PAPER`), beside a 70 px cursor. Its title is 14 px, 12 px under the top edge so the hands on the two top corners leave it clear; seven bars 2 px high follow from 0.36 of its length. `paperNodes` reads `PAPER.inset`, `PAPER.top` and `PAPER.bar`.
- The slot is 96 px wide (`SLOT`, 1.5 sheets). The cassette is the same machine as before, drawn in its own units and scaled by `K` = 0.31 (`shredderShape.ts`); it still stands 32 px over the page (`TOP`, `machineMinTop` + 2). `GAP` is the dark gap between the unit and the two page panels that slide apart for it: 2.2 px at the sides, 2 px front and back. `slotShapes(jaw)` in `shredderShape.ts` is the one list of the slot's three shapes; the page and the sheet `cursor-arms` both draw it.
- 20 strips, 2.5 px wide in lanes 3.2 px apart over 0.47 of the sheet's width each side of the middle (`STRIPS`, `STRIP`), so the page shows between them; 15 of paper, each 0.8 to 1.2 of 42 px long and up to 0.1 radians askew as it comes out, and 5 of the cursor's ink once it has gone in. A strip comes down from the outlet to the page in the first 0.4 of its length and lies flat from there. Its stock sends on 0.14 of the light that falls through it, so a strip in the hood's shadow is still paper.
- The hands are 31 px each side of the middle of the sheet's top edge (`TUG.hands`): on its two sides, 1 px inside the edge and 4 px down from the top (`TUG.inside`); the title is 14 px under the top edge (`PAPER.top`). The shoulder stays `TUG.reach` from the hands, 31 to 47 px: short while the cursor hauls, long while the shredder bites. The paper is taut when the hands are `88 * (1 - amount) - 10` px from the slot.
- `TUG_CURVE`: seconds, amount, lean in radians (now up to 0.4 each way), strain in px. The first two points are the first contact: the lean is held and the strain is let go to 0 at 0.3 s (the arrested pose), then the first haul.
- The acting in the tug is `angry` while less than 0.62 of the sheet is gone (so at the key picture, 25.125 s, 0.44 gone), `nervous` to 0.7 and `scared` after.
- In `step1.resume` the cursor walks to the right of where the sheet comes to rest (19.9 to 20.3 s), turns `proud` at 20.4 and dusts itself off while the sheet slides in beside it (20.44 to 20.86 s), then steps to the corner, grabs at 21.06, lifts and carries (21.18 to 21.54) and drops at 21.62 as before. The sheet is only at rest from 20.86 s, so the puff is held for 0.56 s, not longer: the drop at 21.62 and the first bite at 22.03 do not move.
- The film camera (`TUG_FRAMES`, `CAMERA`), by the Builder's ruling of 17:35Z: from home to a frame 972 px of page wide between 21.1 and 22.1 s (top edge at page y 250) for the shredder's arrival and the first grab; one eased move between 23.1 and 24.4 s to a frame 620 px wide (top at page y 450, middle 4 px right of the slot), held through the key picture at 25.125 s, where the cursor is whole, both hands are on the sheet and the drop zone's edge crosses the frame; a creep to 520 px by 27.0 s (top at 508, so the prompt above is out of frame and not cut through); 18 px lower between 27.1 and 27.8 s so the pile lies clear of the bottom edge; home between 28.3 and 29.1 s. M3 at the key is red in this frame (0.68 at draft): the glass fills the upper half and measures 0.1 to 0.2 of the approved image's mean.
- The loss (`SHRED`): the sheet is gone at 27.09 s, the arms are torn off with it, the cursor is drawn tip first into the intake between 27.39 and 27.85 s (`stepShredded` drives it there while `s.shred < SHRED.gone`), the strips start out of the outlet 0.12 s into that phase, and at 0.64 s (28.03 s) the cursor is back on the page as its own pile of strips (`hurt('shredded')`, 1.14 s).
- The sheet at the mouth (`KNEE` in `paperSolve.ts`, `MOUTH` in `paper.ts`): the fed sheet stands up out of the cutters in a bend, tallest a quarter of the way to the hands, and is shaded where the hood keeps the sky off it: 0.3 at the mouth falling off in 4 px, and 0.16 below the line of the bend 13 px up. The crease picture is shown at 0.08 to 0.38 (`normalScale`), the grid's normals are drawn 0.3 toward their mean (`level`).
- The arms (`src/cursor/act/arms.ts`): a tube 5.3 px thick, at most 46 px long (`ARM.rest`); nearer than that it bends at an elbow, each to its own side (`ARM.elbow` 2.2: a conic, not an even bow), and it is straight when the strain is full. No cuff. An open hand that hangs lets its fingers fall (`droop`); an open hand that pushes bends back at the wrist (`wrist`). An arm whose hand is on the far side of the body goes under the body and comes out at the far edge, so no arm lies over the white face.
- The body in the tug (`ARM` in `body.ts`): strain grows from 34 px between shoulder line and hands over 13 px; it leans 0.85 of the angle to the hands, stretches by 0.2 of the strain and squashes when the strain is let go (`snap`).
