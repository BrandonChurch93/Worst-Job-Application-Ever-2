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
- `strips-zip` is emitted with hitsCursor false: the strips fly to the pile, they do not strike the cursor.
