# Step 1, About You: decisions

Blockout phase. Stand-in shapes, working logic.

## Layout

- Two columns under the step head: the resume card on the left, the three fields on the right, the keyboard deck across the full width below.
- The helper text of First name sits right-aligned on its label row, so the three fields keep one pitch.
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
- The film takes exactly one hit, at "Perplex", and types the name again to the end.

## Last name

- The keys change places after each letter. In a live run they also change every 5 s while the visitor waits, so a still visitor sees the gag.
- The film chases the keys and types "Computer" in full.

## Email and slabs

- Three slabs, each aimed at where the cursor is. The film dodges all three.
- A slab that lands on the cursor flattens it for a moment through `hurt`.

## Resume and the tug

- The paper sticks to the cursor on a click, so click then click works as well as a drag.
- The paper and the hands ride above the resume card, so nothing is hidden by it.
- No control is taken during the tug. The cursor is tethered to the paper by a knock, never held.
- A live tug is lost at the far end or after 9 s.

## Last 4 s

- The kit wins. The cursor is whole again by 31.45 s.

## When the visitor does nothing

- Each phase moves on by itself after 20 s with a still or wrong pointer.

## Known and worked around

- The blockout draws field pockets flat and puts text at the field height, below the surface. Typed values were hidden. This page lifts its value text in `draw`. Any page with typed values meets the same thing.

## For the film

- `fire.ts` gives `makeTurrets()` and `drawFire(out, { typed, pressed, turrets })`: the page with the keyboard up, First name holding `typed`, the keys named in `pressed` down, and the given turrets with their bolts and marks. Key names are those of `keyboard.json`.
- The cursor grabs the paper by its top right corner, clear of the title.
- The film camera pushes in on the resume card and the slot from 21.6 s and is home again by 30.1 s.

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

