# The arena of the boss fight (change 002)

Notes of the arena helper. Every claim is marked MEASURED (I ran it and read the number), STATED (told to me, or decided by me and written here) or UNKNOWN.

## What is built

A module in `src/arena/` that draws the arena from the state in `src/boss/view.ts` and from a seed, and from nothing else.

| File | What it holds | three.js |
| --- | --- | --- |
| `layout.ts` | The page as numbers: nine slabs, sixteen seams, eight pillars, two panes, four corner guns, the socket, the health bar, the times of the scene change | no |
| `change.ts` | The scene change as functions of `view.time`: cracks, split, light, rise, bar drop, and the shake | no |
| `solids.ts` | `solids(view)`, of type `SolidsOf`: what stands and stops a shot, and the one rule of a blast | no |
| `breaks.ts` | What a blast leaves on the ground, as a picture of numbers (soot, cut, embers, hole) | no |
| `ground.ts` | Slabs, seams with their light and its spill, the bed below, the socket, cracks, and the ceramic that reads the wounds | yes |
| `props.ts` | Pillars, panes with their green shade, corner guns, the health bar in its bolted frame | yes |
| `wreck.ts` | Stumps, toppled columns, rubble, glass teeth and shards, sparks, flash, smoke, the warning band, the dust of the split, the glint of a stopped shot | yes |
| `index.ts` | `makeArena`, `arenaPart`, `arenaWell`, and the exports the fight reads | yes |
| `harness/` | The arena alone on the site's real `App`, for `tools/arena-shots.mjs` | yes |

STATED: there is no `Math.random` and no wall clock in the module; `pose` does not read `dt`. MEASURED: `tests/arena-layout.test.ts` reads every file of `src/arena/` for both and passes, and checks that the four files of numbers do not import three.js.

## How it plugs in

STATED, as agreed with the fight helper and wired by them behind `LOOK1_ON` (agent/b-boss, f5b68d24):

- The page pushes one shape of kind `anchor` over the whole page (0, 0, 1920, 1080, z0 0) with the part `boss-arena` = `arenaPart(viewOf)`. `viewOf()` gives the view or null.
- From `ARENA.clearAt` the page also pushes one shape of kind `well` over the whole page, `arenaWell(view)` gives its numbers (z0 -60). That is how the page's own ground is kept from showing through or fighting with mine: the site's ground cuts itself out under a well, so from 0.70 s there is no page ground left under the slabs, and I draw the ceramic top myself with the site's own ceramic material. No shared file was touched and no NEEDS commit was made.
- Before 0.70 s I draw only hairline cracks, just above the page's ground, and the page stays whole.
- The health bar is mine: frame, bolts, track and fill from `view.boss.health`. The label is a `text` shape of the page with `copy:step4.bossHealthLabel` at `ARENA.label` (x 960, y 40, 30 px, inter-600), shown from `ARENA.barLands`. No new words.
- The fight takes its walls from `STANDS` / `solids(view)`.

Exports of `src/arena` (index.ts): `makeArena`, `arenaPart`, `arenaWell`, `ARENA`, `MIDDLE`, `PANES`, `PILLARS`, `SEAMS`, `SLABS`, `solids`, `standing`, `brokenBy`, `breaksBox`, `shake`, `KNOCKS`, `BLAST_KNOCK`.

The page must be clear of its content by **0.70 s** of `view.time` (`ARENA.clearAt`). STATED by the fight helper: the content is off screen by 0.60 s.

## The scene change

All on `view.time`, 0 = the Submit button breaks out. Length 2.4 s (`ARENA.changeSeconds`). At 60 frames a second:

| Time (s) | Frame | What happens | Event | Sound length |
| --- | --- | --- | --- | --- |
| 0.00 | 0 | Cracks start at the socket and run outward along the seams to be, done by 0.62 | `page-crack` (the fight's `button-crack`) | 0.9 s |
| 0.70 | 42 | The page splits: seams jump open in 0.45 s, a little past and back; light surges up through them; dust rises along them for 1.5 s; the well cuts the page's ground | `arena-split` | 1.2 s |
| 1.00 | 60 | Pillars start to rise, inner four first | `arena-rise` | 1.0 s |
| 1.42 to 1.61 | 85 to 97 | The eight pillars lock, one after another | (inside `arena-rise`) | |
| 1.66 to 1.70 | 100 to 102 | The two panes lock | (inside `arena-rise`) | |
| 1.70 | 102 | The health bar starts to drop from 220 px above its place | `healthbar-drop` | 0.5 s, its hit at 0.42 s |
| 1.84 to 1.90 | 110 to 114 | The four corner guns lock | (inside `arena-rise`) | |
| 2.12 | 127 | The bar lands, one small bounce | (the hit of `healthbar-drop`) | |
| 2.40 | 144 | The change is over; from here `solids(view)` lists what stands | | |

STATED: the fight helper emits `arena-split`, `arena-rise` and `healthbar-drop` at `ARENA.splitAt`, `ARENA.riseAt`, `ARENA.barAt`.

### The shake, for the camera owner

`shake(time, blastTimes)` returns `{ x, y, roll }` in page px and radians, the sum of decaying knocks, a pure function of the time. I do not move the camera. The numbers (`KNOCKS`, `BLAST_KNOCK`):

| At (s) | Size (px) | Roll (rad) | Rate (Hz) | Decay (s) | What |
| --- | --- | --- | --- | --- | --- |
| 0.00 | 14 | 0.004 | 21 | 0.22 | the button breaks out |
| 0.70 | 22 | 0.007 | 17 | 0.34 | the page splits |
| 1.42 | 4 | 0.001 | 26 | 0.12 | the first pillars lock |
| 1.66 | 4 | 0.001 | 26 | 0.12 | the panes lock |
| 1.90 | 5 | 0.0015 | 26 | 0.12 | the corner guns lock |
| 2.12 | 7 | 0.002 | 24 | 0.15 | the health bar lands |
| each blast | 26 | 0.008 | 15 | 0.40 | the big cannon fires |

UNKNOWN: who applies it. Asked of the fight helper at 23:38Z.

## What the big cannon breaks

For every entry of `view.breaks` with `at <= view.time`:

- A trench along the line from (x0, y0): soot with a soft edge and thrown specks, a cut that the site's light shades (the ceramic's normal is bent by the depth), fissures, two rows of embers that flicker and are hotter for half a second after the blast.
- At the far end of the line the slab is broken through: a ragged hole, 290 to 420 px long and never more than 45% of the line, lit from below, with the broken wall of the slab under its upper edge. Where the line crosses a seam the slab edge crumbles the same way.
- The hole never opens under the foot of a pillar, a pane, a corner gun, the health bar or the socket (MEASURED by test), so it is split round them.
- Each pillar the line breaks: a stump 84 to 140 px high with a rough top and eleven lumps of rubble thrown away from the line; 36% of them topple instead, to a stump 22 to 36 px high and the column lying beside it.
- Each pane the line breaks: jagged teeth in its shoe, short where the line went through and taller toward its ends, and 22 shards on the ground, most thrown the way the blast went.
- For 0.24 s a flash along the line and a burst at its far end; sparks for 0.7 s; smoke for 1.7 s; two lights of the site's pool for 0.5 s.
- While `boss.big` is set and not yet fired: a warning band on the ground along the line, as wide as the blast, two bright edges and a faint fill, brighter and quicker as `tell` rises. The look helper draws the thin line at muzzle height; the ground band is mine.
- A hit of kind `solid`: a glint at its place for 0.18 s.

The wounds are not a picture laid over the ground. They are four numbers a texel (1440 by 810 over the page) that the ceramic's own shader reads: it darkens, roughens, bends the normal, lights the embers and the hole. The same trench is therefore lit and shadowed by the site's light like the rest of the ground.

Events, as the fight helper emits them: `cannon-warn` (their `big-tell`, 0.8 s), `arena-break` once per blast (1.3 s, the slab breaking is folded into it), `pane-shatter` (1.4 s) and `pillar-break` (1.1 s) once per thing.

Room left for the finishing beam (STATED by the Builder at 22:52Z, not designed): nothing of mine stands on the middle slab, a hole never opens in it for a line that starts at the boss (MEASURED by test on the fight's rectangle for one line; STATED in general, since a hole is at most 420 px from the screen edge it runs to), and the wounds picture can take a mark that is soot and cut only. A trench may cross the middle slab from 275 px ahead of the boss's centre outward, as the lines do.

## Solids

`solids(view)`: the pillars and panes that stand (id, kind, box in page px) and the middle slab's outline (its eight joints). Nothing stands before 2.4 s. A thing is broken by the first blast in time whose line is within half its width of the thing's box (`breaksBox`, inclusive). MEASURED: `tests/arena-solids.test.ts`, 7 tests pass.

- Pillar boxes are 56 px square about the feet I measured in the picture: (185,372) (577,352) (157,712) (563,722) (1384,352) (1775,373) (1397,722) (1802,712).
- Pane boxes are 14 px thick, x 372 and x 1592, y 350 to 750.
- `ARENA.safe` (640..1280, 330..770) is the fight's own rectangle for the boss's centre. MEASURED: its corners lie off the middle slab by up to 53 px. `ARENA.inside` (700..1235, 385..735) lies wholly on the slab.

Standing things lean in the picture so that their height reads from straight above. Mine all lean the same way, up by 0.5 and left by 0.26 of their height, with the foot where it is in the numbers: the foot is what stops a shot.

## Numbers measured

All MEASURED on this machine, which draws with software GL (no graphics card), so the times say how the arena compares with the empty page here and not what a visitor's machine will take.

At the low level, one sample, `node tools/arena-shots.mjs --measure` (median of six pictures after three thrown away; counts are the engine's, summed over the passes of one sample):

| View | Triangles | Draw calls | ms a picture |
| --- | --- | --- | --- |
| the page's ground alone, no arena | 24 | 6 | 1679 |
| arena at rest | 45,679 | 115 | 2405 |
| mid change, 1.30 s | 15,992 | 55 | 2273 |
| 0.20 s after a blast | 46,691 | 130 | 2433 |
| after three blasts | 47,267 | 126 | 2423 |

So the arena at rest adds 45,655 triangles and 109 draw calls at the low level, and here 0.73 s to a picture that takes 1.68 s with nothing in it. UNKNOWN: the frame time on a real graphics card.

At the full level the engine counts 99,842 triangles and 219 draw calls for the first picture at rest (it includes the pass that draws the shadows) and about 64,000 and 167 for later ones.

Built geometry, counted in node: 34,313 triangles in 96 meshes, of which the four guns 12,544, the ground 11,324, the wreck's pools 4,426 (mostly not drawn until something breaks), the bar 3,487, the pillars 2,208, the panes 324.

Painting the wound of one blast: about 200 ms at once (node, this machine). To keep it off the frame of the blast it is painted ahead while the cannon aims, a slice a frame over 36 frames (about 5.5 ms a frame), once the line has lain still from one frame to the next; what is left is done on the frame of the blast. The picture is the same either way (MEASURED: `tests/arena-breaks.test.ts`, slices equal the whole).

Tests: `tests/arena-solids.test.ts`, `tests/arena-layout.test.ts`, `tests/arena-breaks.test.ts`, 22 tests, all pass. Whole suite at 23:25Z on the tree with agent/b-bosslook merged: 182 files pass, 13 skipped, 1 fails, `tests/cut-of-build.test.ts` (2 tests), which is red on branches until the Builder runs the cut.

## What differs from the two pictures, and why

Picture one (the arena at rest):

- The lean. The picture is drawn with a wide lens, so things lean away from its middle. The site's camera looks straight down with a narrow lens; I lean every standing thing the same way instead, so that no foot lies about where it is.
- The seams are thinner and glow more than the picture's copper channels, as the Builder asked at 22:52Z.
- The corner guns are the look's rotary gun at 0.62; their domed foot is about 67 px across where the picture's is about 100.
- The ground is the site's ceramic and grain, not the picture's.
- Bullets, the boss, the arrow and its trail are not mine.

Picture two (after the cannon):

- The pane. In the picture the broken pane still stands tall with a gap torn through it. Mine falls to a row of teeth along its whole shoe, because by the rule a broken pane stops no shot, and tall glass that stops nothing would lie.
- The trench starts where the break's line starts (the muzzle), not under the boss.
- The hole is split where it meets a foot or a corner gun.
- The beam and its burst are the look helper's.

## What is off

- Not yet seen on the real page with the fight running; everything here is from the harness.
- Glass: the shards are one shape at different sizes, and the teeth are thin from above. They read as glass, not yet as the big standing splinters of the picture.
- Stumps: the tops are grey and faceted, not the rough stone of the picture.
- The dust of the split is faint on the white ceramic.
- Draw calls are high for what is drawn (96 meshes); pillars, feet and guns could be joined or instanced.
- The frame time is known only in software GL.
- If a blast arrives with no tell before it (a film jumped to a time), its wound is painted at once, about 200 ms.

## Proof

`pipeline/change002/proof/arena/`, each 1400 px wide, the target top left:

- `rest.png`: at rest.
- `change.png`: 0.05, 0.35, 0.80, 1.30 and 1.90 s into the change.
- `blast.png`: the warning band, then 0.03, 0.20 and 0.70 s after a blast, with the boss as a plain box 226 wide.
- `breaks.png`: after one, two and three blasts along different lines.
- `box.png`: at rest with the box and a glint on a pillar.
- `measure-low.json`: the table above.

Made with `node tools/arena-shots.mjs [rest|change|breaks|blast|box] [--no-build] [--level low] [--samples N]`.
