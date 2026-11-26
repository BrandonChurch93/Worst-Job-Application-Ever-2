# Step 2: rows, dial and acting (agent step2-dial)

Branch `agent/step2-dial`. Looks branch `agent/step2-dial-looks`.

## What the approved images show that a quick look misses

1. `step2-dial.png`: the highlight on the wheel is not a ring but two fans, one toward the upper left and one toward the lower right, and the orange hub carries one soft square of light high on its left shoulder, well off its middle.
2. The bevel that reads as "the bezel" is about 9 px wide and it is a step, not a slope: a rounded outer ring, a thin dark groove, then the wheel a hair lower. Every finger hole has a bright chamfer ring of about 2 px, which is what makes the holes read as cut and not printed.
3. The gap is not black. Inside a hole the plate is cream and its upper left third lies in a soft brown grey shade; the darkest line of the picture is the contact line under the lower left of the bezel and the ring round the foot of the hub.
4. The tray's edge is a thin aluminium lip with round corners (about 14 px) that is bright along the lower right and dark along the upper left inside wall, and the floor is the same frosted glass as the fields, darker in a band under the upper and left walls.
5. The dial's shadow does not stop at the tray: it runs down and right across the floor, climbs the lower lip and lies on the page under the tray. The open field's ring is a pale core with a warm spill on both sides, and the chevron of the open row points up.

## Decisions

- The fields and the trays of the rows are built by the shell's own control maker (`src/shell/real/controls.ts`, read, not changed): a row's field is the same field as step 1's, and a tray is cut and lined the same way (role `machineTray` is handed on as a field). So the rows are in the page's four materials by construction.
- A tray is no longer a `well` in the list. It is a pocket (`pocket: true`, `kind: 'box'`, `r` 14) whose height grows with the row's spring, in whole pixels, so the slab is cut with a rolled lip and round corners.
- The open field's ring is one shape `field-focus` and its caret is `field-caret`, both `part: 'rows'`, both lying inside the pocket. The four boxes `focus-n/s/w/e` and `caret` are gone.
- The dial is one object carried by the shape `dial-wheel`. The shapes `dial-centre`, `dial-stop` and `dial-hole-<k>` stay in the list for the logic and are drawn by that object (key `''`).
- `dial-wheel` carries `v: [angle]`, the wheel's turn in radians, clockwise on the page.
- The dial rises as one rigid body. Before it has risen it stands 7.4 px out of the tray's floor (`DIAL_BODY.rest`), which is under the page, so the tray opens on a dial lying low and the dial then rises to its 40 px.
- The numerals stay `text` shapes of part `type` with keys `data:step2.dial.<d>`. They lie on the plate, 6.2 px under the wheel's top, and are seen through the holes. When the wheel turns it covers them, as on a real dial.
- The shade inside each hole is painted (one instanced disc per hole, multiplied over the plate, turned with the wheel and always facing the key), because a 5 px wall is under what the shadow map resolves.
