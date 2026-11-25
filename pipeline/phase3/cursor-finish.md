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

## Item 4: scorch and tape

Scorch, what was wrong: a flat matte black triangle with a faint fringe.

- The crust is glossy lumps: roughness 0.26 on a lump and 0.9 between, stronger tilt of the normal
  (12, was 7), pale glints on the lumps, a more crumbled edge (fine noise 1.1, was 0.6).
- The fringe is narrow and amber: `(0.85, 0.48, 0.16)` at its outside to `(0.14, 0.05, 0.012)`
  against the crust, 1.2 units wide, and it follows the crust with less noise than the crust has.
- Found here: the item 6 change (coloured light made neutral on the face) also made the face's
  own colour neutral, so the fringe, the heat's warm tint and the melt's tint were grayed. It now
  divides the face's colour out before it takes the light's luma, and puts it back.

Still wrong: the crust does not stand up from the body (the shell's form is not mine) and does
not run down the left edge as on the approved sheet; the smoke is thinner than approved.

Tape, what was wrong: wide frosted bands with saw teeth, far past the body.

- Ends: teeth 0.22 high (was 1.1) on a slow uneven wave, so an end reads torn, not pinked.
- Opacity: frost 0.2 (was 0.37), less sheen (0.4, was 0.8), a fainter cast shadow.
- Shorter and narrower: halves 16, 23, 11 px (were 20, 28, 15), widths 4.4, 4.6, 4.2 (were 5.0,
  5.4, 4.8). No test holds these numbers (MEASURED: `npm test` green).
- The slat joints show through the tape.

## Item 5: scared and the flattened cracks

Scared, what was wrong: smooth gray with a regular grid of dots (the detail texture sampled at
one small scale).

- The dots are gone. Mottling comes from three scales of the texture together, pits from two, and
  a slow warm and cool drift; the grain of the normal is stronger (0.5, was 0.22).

Still wrong: the band still catches a bright line on the lamp side, so it is not fully matte;
that is the fill term on the roll, see the form fixer's ask below.

Cracks, what was wrong: one crack (the cells were 11 units wide, wider than the body).

- A net: cells 4.2 units wide, and a finer set (1.9 units) that shows only near a main crack in
  about half the plates, at 0.12 against 0.3, so it branches. Hairlines with the lit lip and the
  slight tilt of each plate kept.

Still wrong: the lines are a little paler and wavier than the approved ones.

## The new light (main e599fbb and after)

- The shadow pass now lifts things between 6 and 12 px by `shadowHeights.from` and `lift`. My depth
  material for the body (`bodyDepthMaterial`) reads the same band as `src/post/studio.ts`, so the
  arrow's shadow follows the page's rule. Nothing in `src/post/` is changed.
- The page seen through a punched hole went to an even gray disc under the longer shadow. The
  share of the light let down a bore is 0.6 (was 0.5). Still wrong: the disc is flatter and
  grayer than the approved one, where the lower right of the page inside is plainly lit.

## The fill term and M3 (decision, measured)

The form fixer asked for the fill to depend on the side, because the new roll of the enamel reads
as a gray band with an arc round each notch. I wrote it (commit a83e58b: a face tilted from the
lamp gets back the share it lost, the lit side gets nothing) and it does take the band away.

It is taken back out. MEASURED at the review tier with
`npm run measure -- --unit step1 --only M3,M4 --tier review`: main db41bef M3 0.8224, my branch
with the new fill 0.8191. With the tool's own `highFrequencyEnergy` on the two stills, cell by
cell (120 px), all of the loss is on the arrow in `step1-tug` (cells at 1200,360; 1320,360;
1200,240): the even white face has less fine contrast than the banded one. With the old fill back
the same still reads 0.8222, and the last 0.0002 was the softer flecks in the hot tip.

- The fill term is the one main has. The band on the roll is therefore still there. The code of
  the side dependent fill is in a83e58b for whoever takes it up with M3 in hand: it costs 0.0031
  of M3 on `step1-tug`.
- The flecks in the glowing tip are crisper and a little brighter (threshold 0.685 to 0.735,
  strength 1.5; were 0.7 to 0.82 and 1.2). Still wrong: on the sheet they are coarser than the
  approved sparks, which are fine points and thin veins.

## The three things that still look least real

1. The fresh laser hole at 70 px in `step1-fire` still reads as a ring: darker than before and
   with the key seen through it, but a ring.
2. The punched hole: the page inside is an even gray disc and the wall has less tooth than the
   approved one.
3. Angry: the flecks are blobs and the steam is two ribbons, where the approved picture has fine
   sparks, a deep dark tip and a curling plume.
