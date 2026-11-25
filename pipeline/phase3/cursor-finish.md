# Cursor finish: notes

Owner: cursor-finish. Branch `agent/cursor-finish`. Parts: `cursor-effects`, `cursor-damage`.

Files: `src/cursor/model/material.ts`, `src/cursor/model/effects.ts`, `src/cursor/model/texture.ts`,
`src/cursor/act/damage.ts`, `src/cursor/act/tape.ts`, `damage()` in `src/cursor/sheets.ts`.

A fact here is MEASURED (command and number given), STATED (read somewhere) or UNKNOWN.

## Item 1: the holes

What was wrong, looked at beside `references/approved/cursor-damage.png` and `cursor-acting.png`:

- The punched hole read as a gray disc. The page seen through it was wholly inside the body's own
  shadow: the engine casts the hole's light about 20 px down and right of the hole, so none of it
  lands under the bore.
- The wall was one flat tone with no chips and no lit side.
- The laser hole had a wide even char ring and a smoke column wider than the hole.
- At 70 px in `step1-fire` the fresh hole was a pale ring.

What is built:

- `bodyDepthMaterial` moves the hole in the shadow pass along the light's slant by half the bore
  (`BORE_SHARE = 0.5`), with the heights squeezed as `look.shadowHeights` squeezes them. The page
  under a bore is now in shadow on the upper left and lit on the lower right, as on the approved
  sheet. The light's direction is read from the shadow camera's `viewMatrix`, so it follows the
  key light wherever the stage puts it.
- `charMaterial` finds the nearest hole and shades the wall by which kind it is. A punched wall is
  tan clay `(0.82, 0.69, 0.52)` with crumb and pits from the detail texture, sky light by side and
  by depth, and sun on the sliver that faces the lamp. A burnt wall is dark ash with ember specks,
  capped so the wall never goes to a pale band.
- In `wjaSurface` the rim of a punched hole is chipped unevenly (`bite`), dark on the lamp side
  where the enamel steps down, bright on the far brink, and the normal rolls into the hole so the
  gloss breaks at the edge.
- The rim of a burnt hole is a tight crust (1.05 to 1.2 radii), brown soot falling off to 1.7, hot
  specks on the lip only. The crust widens by `fwidth` when the hole is small on screen so it
  holds as a dark mark at 70 px.
- Smoke: 36 quads a plume (was 26), strands closer, sideways drift 0.075 (was 0.16), origin
  `L.radius * 0.45` above the hole's centre (was 0.9) so it leaves the hole itself.

Decisions:

1. The wall seen from above is the upper left wall (the body slants), and it faces away from the
   lamp. It is drawn as tan clay in bounce light, as the approved sheet has it.
2. The hole's light is let fall under the bore by shifting the hole in the shadow pass. The
   engine's true offset hides it entirely, which is the gray disc.
3. Wall shading is analytic, in emissive, and does not use the engine's shadow.
4. `charMaterial()` takes the hole uniforms of the body material made just before it
   (`body.ts` is not mine and calls them in that order).
5. The crust widens when the hole is small on screen.

Still wrong:

- Punched wall carries less texture than the approved one, and the page inside is less dark on
  the upper left.
- Laser crust and wall are thicker than the approved thin char; the soot halo is less amber.
- Smoke is fainter and thinner than approved.
- At 70 px the fresh hole is still a ring: thin dark crust, tan ring, the key seen through. The
  ruling keeps the hole open, so the ring is the wall. Open.

## Item 6: the arrow tinted orange at the keyboard hit

Cause: the emitters' direct light on the diffuse enamel face. The face now takes the luma of
coloured direct light and gives it back in the key light's colour (0.85 of the way), so a glow
lights the body without dyeing it. The gloss still reflects the glow's colour, and the dark edge
is untouched. What tint remains comes from bloom over the body, which is the light's, not mine.

## Tests

No test changed in any push so far. MEASURED: `npm test` 1230 passed, `npm run build` built,
`npm run bots` all clear, on the working tree before the first commit.

## Textures

Unchanged: one 512 px RGBA detail texture, 1.0 MB, made in code (`texture.ts`). No recipe changed.

## Counts and times (draft tier, this VM)

MEASURED with `npm run still -- --sheet <name> --format hd --tier draft`:

- `cursor-damage`: 7.7 to 8.1 s, 857956 triangles, 111 draw calls.
- `cursor-acting`: 7.2 s, 731566 triangles (729766 before the smoke change), 140 draw calls.
- `step1-fire` (`--key step1-fire`): 11.8 to 12.1 s, 439546 triangles, 282 draw calls.

## Measures

MEASURED: `npm run measure -- --unit step1` (draft tier): 7 green, 1 red. The red is M2 on
`step1-fire`, soft share 0.0216 against 0.02. MEASURED on main 9443fc4 with my changes stashed,
same command: the same red, the same 0.0216 of 21935 pixels. It is the draft tier's, not this
branch's. STATED in the brief: 0.0159 on main at review tier.

## Item 2: angry

What was wrong beside the approved sheet: the tip was a washed salmon patch with a hard ragged edge to
white, and the steam was faint, wide and began off the face.

- The glow's colours were too high in green: `(1.05, 0.1, 0.012)` in linear light is sRGB green 89.
  MEASURED on the approved image: the red is `(179, 3, 7)`, the tip `(102, 9, 4)`. The ramp is now
  pale `(1.3, 0.8, 0.35)`, orange `(1.25, 0.3, 0.02)`, red `(0.9, 0.015, 0.003)`, deep
  `(0.16, 0.003, 0.001)` at the tip.
- The falloff is long and soft: 8 units from nothing to full, a warm tint on the white before the
  glow covers it, less noise on the front (1.3 and 0.5, was 2.4 and 1.2).
- The coat and the specular are cut where it glows (0.88 and 0.8), else the studio's reflection
  washes the red to pink.
- Fine bright flecks in the orange part.
- Decision: the glow shows from heat 0.05 (was 0.3) and reaches `4.6 + 4.2 * heat` units, so the
  tug, which sends 0.28, has a glowing tip. The acting side's numbers are untouched.
- Steam: 2 wisps of 48 quads (was 3 of 18), foot 0.14 units wide, brighter than the page (1.3 to
  1.18), fades in over a tenth of its height (was 0.22) so it leaves the face itself.

Still wrong: no deep dark red at the very tip; the steam is ribbons more than curls; the warm
spill on the page comes from the emitter in `body.ts` (not mine), which gives light only over
heat 0.3 and is faint.

## Item 3: nervous

What was wrong: beads ran down the face and bunched at the lower left edge and under the neck, and
were large bubbles.

- 18 beads have fixed homes on the face, placed once from the seed with room between them (2.1
  units where it can be had). Each grows, sits, slides a short way down and dries, each on its own
  clock (3.2 to 5.8 s).
- 8 beads are a trail on the page off the right edge, 0.5 to 2 units out, from 4.6 to 14 units
  down.
- Radius 0.2 to 0.66 units (was 0.5 to 1.5), a little long down the slope.
- Face and trail come in by turns as the sweat rises, so a little sweat shows both.

Still wrong: the beads are faint on the white face at sheet size; the approved ones have a darker
edge and a stronger shadow.
