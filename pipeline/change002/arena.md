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
| `scorch.ts` | What the finishing blast leaves: its line, its share, the scorch as a picture of numbers, the chips, the cold beam's light and the shadows it throws | no |
| `ground.ts` | Slabs, seams with their light and its spill, the bed below, the socket, cracks, and the ceramic that reads the wounds | yes |
| `props.ts` | Pillars, panes with their green shade, corner guns, the health bar in its bolted frame | yes |
| `wreck.ts` | Stumps, toppled columns, rubble, glass teeth and shards, sparks, flash, smoke, the warning light, the dust of the split, the glint of a stopped shot | yes |
| `finish.ts` | The finishing blast on the arena: the scorch burnt in, chips, wisps of smoke, the drawn shadows of a cold beam | yes |
| `index.ts` | `makeArena`, `arenaPart`, `arenaWell`, and the exports the fight reads | yes |
| `harness/` | The arena alone on the site's real `App`, for `tools/arena-shots.mjs` | yes |

STATED: there is no `Math.random` and no wall clock in the module; `pose` does not read `dt`. MEASURED: `tests/arena-layout.test.ts` reads every file of `src/arena/` for both and passes, and checks that the files of numbers do not import three.js.

## How it plugs in

STATED, as agreed with the fight helper and wired by them behind `LOOK1_ON` (agent/b-boss, f5b68d24; MEASURED on the real page with the switch on, see below):

- The page pushes one shape of kind `anchor` over the whole page (0, 0, 1920, 1080, z0 0) with the part `boss-arena` = `arenaPart(viewOf)`. `viewOf()` gives the view or null.
- From `ARENA.clearAt` the page also pushes one shape of kind `well` over the whole page, `arenaWell(view)` gives its numbers (z0 -60). That is how the page's own ground is kept from showing through or fighting with mine: the site's ground cuts itself out under a well, so from 0.70 s there is no page ground left under the slabs, and I draw the ceramic top myself with the site's own ceramic material. No shared file was touched and no NEEDS commit was made.
- Before 0.70 s I draw only hairline cracks, just above the page's ground, and the page stays whole.
- The health bar is mine: frame, bolts, track and fill from `view.boss.health`. The label is a `text` shape of the page with `copy:step4.bossHealthLabel` at `ARENA.label` (x 960, y 40, 30 px, inter-600), shown from `ARENA.barLands`. No new words.
- The fight takes its walls from `STANDS` / `solids(view)`.

- The ceramic runs on 72 px past the edge of the page on every side (off screen at rest). The fight shakes the arena as a wrapper round my part; without the apron the edge of the page came into the picture (MEASURED on the real page at 6.9 s and 43.2 s, mended and seen again).
- `arenaPart(viewOf, { beam })` and `makeArena({ seed, beam })` take an optional driver for the light of a cold beam, see "The finishing blast".

Exports of `src/arena` (index.ts): `makeArena`, `arenaPart`, `arenaWell`, `ARENA`, `MIDDLE`, `PANES`, `PILLARS`, `SEAMS`, `SLABS`, `solids`, `standing`, `brokenBy`, `breaksBox`, `shake`, `KNOCKS`, `BLAST_KNOCK`, `SCORCH`, `scorchFrom`, `scorchOf`, `beamOf`, and the types `BlastLine`, `BeamLight`, `BeamDriver`.

The page must be clear of its content by **0.70 s** of `view.time` (`ARENA.clearAt`). STATED by the fight helper: the content is off screen by 0.60 s.

## The scene change

All on `view.time`, 0 = the Submit button breaks out. Length 2.4 s (`ARENA.changeSeconds`). At 60 frames a second:

| Time (s) | Frame | What happens | Event | Sound length |
| --- | --- | --- | --- | --- |
| 0.00 | 0 | Cracks start at the socket and run outward along the seams to be, done by 0.62 | `page-crack` (the fight's `button-crack`) | 0.9 s |
| 0.70 | 42 | The page splits: seams jump open in 0.45 s, a little past and back; light surges up through them; pale dust rises along them (96 puffs, up within 6 frames, gone by 2.6 s); the well cuts the page's ground | `arena-split` | 1.2 s |
| 1.00 | 60 | Pillars start to rise, inner four first | `arena-rise` | 1.0 s |
| 1.42 to 1.61 | 85 to 97 | The eight pillars lock, one after another | (inside `arena-rise`) | |
| 1.66 to 1.70 | 100 to 102 | The two panes lock | (inside `arena-rise`) | |
| 1.70 | 102 | The health bar starts to drop from 220 px above its place | `healthbar-drop` | 0.5 s, its hit at 0.42 s |
| 1.84 to 1.90 | 110 to 114 | The four corner guns lock | (inside `arena-rise`) | |
| 2.12 | 127 | The bar lands, one small bounce | (the hit of `healthbar-drop`) | |
| 2.40 | 144 | The change is over; from here `solids(view)` lists what stands | | |

STATED by the fight helper (00:16Z): it emits `arena-split` at 0.70, `arena-rise` at 1.00 and `healthbar-drop` at 1.70, the start of the fall. What each event shows and how its sound should sit is in `pipeline/change002/arena-sounds.md`.

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

STATED by the fight helper (00:16Z): it applies the shake as a wrapper group round my part and the boss's (x, minus y, roll from `shake(view.time, view.breaks.map((k) => k.at))`). The arrow, the caption and the bar's words do not move.

## What the big cannon breaks

For every entry of `view.breaks` with `at <= view.time`:

- A trench along the line from (x0, y0): soot with a soft edge and thrown specks, a cut that the site's light shades (the ceramic's normal is bent by the depth), fissures, two rows of embers that flicker and are hotter for half a second after the blast.
- At the far end of the line the slab is broken through: a ragged hole, 290 to 420 px long and never more than 45% of the line. It has depth: under its upper edge the broken side wall of the slab shows, dark, and the light comes up from below, deep orange at the rim and brightest in the middle (how far a texel lies inside the hole is probed in 24 directions). Where the line crosses a seam the slab edge crumbles the same way.
- The hole never opens under the foot of a pillar, a pane, a corner gun, the health bar or the socket (MEASURED by test), so it is split round them.
- Each pillar the line breaks: a stump 84 to 140 px high with a rough broken top (a lump, not a flat cap) and eleven lumps of rubble thrown away from the line; 36% of them topple instead, to a stump 22 to 36 px high and the column lying beside it. The column in flight and at rest is lit by the site's light like the standing ones (MEASURED on the real page at 43.2, 43.5 and 44.5 s: grey in all three, where it was black then white before).
- Each pane the line breaks: low jagged teeth in its shoe, lowest where the line went through, never taller than 24% of the pane, and at most three thin splinters left standing; shards of several shapes on the ground, most thrown the way the blast went. Nothing of it stops a shot.
- For 0.24 s a flash along the line and a burst at its far end; sparks for 0.7 s; smoke for 1.7 s; two lights of the site's pool for 0.5 s.
- While `boss.big` is set and not yet fired: the warning is light on the ground along the line. It is as wide as the blast at first, narrows and brightens as `tell` rises, and lights the pillars and the pane that stand in it. The look helper draws the thin line at muzzle height; the light on the ground is mine. STATED by the fight helper: the line lies still for the whole tell, 1.6 s.
- A hit of kind `solid`: a glint at its place for 0.18 s.

The wounds are not a picture laid over the ground. They are four numbers a texel (1440 by 810 over the page) that the ceramic's own shader reads: it darkens, roughens, bends the normal, lights the embers and the hole. The same trench is therefore lit and shadowed by the site's light like the rest of the ground.

Events, as the fight helper emits them: `cannon-warn` (their `big-tell`, 0.8 s), `arena-break` once per blast (1.3 s, the slab breaking is folded into it), `pane-shatter` (1.4 s) and `pillar-break` (1.1 s) once per thing.

## The finishing blast

Asked by the Builder at 00:03Z, after `references/approved-002/finish-button-left.png`, `finish-charge.png` and `finish-blast.png`. It differs from the big cannon's blast: it breaks no slab through to the light, it scorches. The slab under the button stays whole.

As a function, like the blasts (`scorch.ts`, no three.js):

- `scorchFrom(line)`: a start place and a direction. `line` is `{ x0, y0, x1, y1 }` in page px: the arrow's centre at firing and the point where the button is left, which is the middle of the burn. STATED by the fight helper at 01:39Z: that point is `view.scorch.x1, y1` = `FALLEN` = (960, 650). The trench starts 70 px ahead of the arrow (`SCORCH.ahead`) with a half width of 10 px (`SCORCH.thin`) and widens to 62 px (`SCORCH.half`) where it runs into the burn; its middle wanders and its edge is broken at two sizes, so no edge is straight. The burn is round, 138 px across the line and 1.1 times that along it (`SCORCH.burn`, `SCORCH.long`), its rim eaten in and out. The black ends at the burn: beyond it there is only a fan of soot that thins out over 320 px (`SCORCH.tail`). The beam's own line (`ex`, `ey`, `long`) still runs to the edge of the page.
- `scorchOf(view)`: the line and a share from 0 to 1 while the beam burns. The line is `view.scorch` (STATED by the fight helper at 00:16Z: set in the frame of `finish-fire` and kept to the end), else `view.finish`. The share is `view.boss.gone`, else the blast's clock over 2.13 s.
- `paintScorch(...)`: the scorch as four numbers a texel (soot, depth, embers, and when it burns), 1920 by 1080 over the page. `shownAt(when, share)` says how much of a texel shows at a share: the front runs out along the line first, then the black spreads from the middle to the rim, with a glowing edge while it spreads.
- The settled state is the same picture at share 1: black that is darkest in the middle, gives way to brown soot over about 50 px with blots eaten out of its rim, then soot that fades to the clean ground within 110 px of the burn (46 px at the hands); hairline cracks with no direction; small embers at the rim of the burn and down the middle of the trench, with a low flicker; specks thrown wide; 120 chips of ceramic thrown out to both sides and round the burn (fewer at the low level, never a different layout), none in the box the fight helper keeps for the words over the button (x 840 to 1080, y 340 to 400 with the button at 960, 650; `SCORCH.words`); thin smoke in four columns of ten puffs, the two over the burn a little taller.

The ceramic's shader reads this picture beside the wounds of the cannon, so the scorch is lit and shadowed like the rest of the ground and costs no draw call of its own. It is painted ahead over 48 frames while the arrow's aim lies still (`aimOf(view)`), and at once if the blast arrives without that (about 0.1 s here). MEASURED: `tests/arena-scorch.test.ts`, 8 tests pass: the line starts in front of the arrow, runs through the fallen boss and leaves the page; the same line and seed give the same picture, and slices equal the whole; the black is narrow at the hands, wider with every third of the way, and the burn is wider than the trench and about as long as it is wide, with no black beyond it and nothing behind the arrow; each edge of the trench strays by more than 4 px from a straight line and turns back on itself more than five times; the soot is blackest in the middle, less at the rim, thin outside and next to nothing far out; most embers of the burn lie at its rim; next to no soot lies from 220 px under the button on, for six seeds and firing places; no chip lies in the box of the words; it burns in from the arrow outward and from the middle to the rim; the line and the share are read from the view; the chips land clear of the black, the seams, the feet and the socket, the same every run; the beam stands as long as the blast and the shadows fall away from it.

The answer to the cold beam, for the helper who owns the arrow and the beam (agent/b-finish):

- `BeamLight = { x0, y0, x1, y1, strength }`, page px, strength 0 to 1. `BeamDriver = (view) => BeamLight | null`, given as `arenaPart(viewOf, { beam })`.
- While it burns: a cold wash on the ceramic that falls off with the distance from the line, and one drawn mesh (`arena-beam-shadows`) in which every pillar and pane that stands throws a long sharp shadow away from the line (a pane's paler and green). The shadows are drawn on the ceramic and on what stands on it, never down in a seam or a hole.
- With a driver given, the arena adds no lights of its own; the beam's owner lights pillars, glass and ground through the site's pool. Without one, the arena uses `beamOf(view)` (from `view.finish`: up in 0.05 s, down over the last fifth of the blast) and adds three cold lights so it reads alone.
- STATED by the finish helper (00:40Z): its drawn shadows go, mine stay; its three cold lights ask for no shadow; it exports `beamLight(state)` in exactly this shape for the fight helper to pass. UNKNOWN: how the two look together, since agent/b-finish is not merged into this branch.

## The ground kept clear for the last stand

Ruled by the Builder at 01:54Z: no piece of the arena lies on, in front of or within 140 px of the arrow's stand (440, 650), of the line from it to the button (960, 650) or of the kneel spot (816, 650), from finish-arms to the page turn. `clear.ts` (no three.js) holds that ground (`KEEP`) and says where every loose piece comes to rest; `wreck.ts` draws from it.

- The toppled part of a pillar (`columnLie`) falls away from the blast's line as before. If it would then lie in the kept ground or off the page it falls the nearest other way, and if its foot is too near, the piece is thrown clear to the far side (it lies 80 to 230 px from its foot instead of 34).
- Rubble (`rubbleRest`) and shards of glass (`shardRest`) that would rest in the kept ground are moved straight out of it, to its edge plus their own half size.
- The two wisps of smoke along the trench rise between a fifth and two fifths of the way to the burn, and the two over the burn on its far side, so none stands over the stand or the kneel spot.
- MEASURED: `tests/arena-clear.test.ts`, 6 tests pass: for 3 seeds, 8 pillars and 2 panes, 72 blasts each from every side, every column, lump and shard rests at least 140 px plus its half size away. The same lists are drawn at the low, medium and high levels (STATED from wreck.ts: the wreck's counts do not depend on the level), so the three tests named by level ask the same thing.
- Not moved, since they stand where the approved picture has them: the pillar at (563, 722), 72 px from the line, whole or as a stump; the pane at x 372, 68 px behind the stand, whole or as its teeth. The chips of the last blast lie beside its trench, as in the picture; none within 50 px of the stand or the kneel spot (tested). The scorch, its embers and the smoke over the burn lie on the line by their nature.
- UNKNOWN: whether a piece in flight crosses the kept ground; a blast of the cannon is over 0.55 s after it fires, long before finish-arms.

## Solids

`solids(view)`: the pillars and panes that stand (id, kind, box in page px) and the middle slab's outline (its eight joints). Nothing stands before 2.4 s. A thing is broken by the first blast in time whose line is within half its width of the thing's box (`breaksBox`, inclusive). MEASURED: `tests/arena-solids.test.ts`, 7 tests pass.

- Pillar boxes are 56 px square about the feet I measured in the picture: (185,372) (577,352) (157,712) (563,722) (1384,352) (1775,373) (1397,722) (1802,712).
- Pane boxes are 14 px thick, x 372 and x 1592, y 350 to 750.
- `ARENA.safe` (640..1280, 330..770) is the fight's own rectangle for the boss's centre. MEASURED: its corners lie off the middle slab by up to 53 px. `ARENA.inside` (700..1235, 385..735) lies wholly on the slab.

Standing things lean in the picture so that their height reads from straight above. Mine all lean the same way, up by 0.5 and left by 0.26 of their height, with the foot where it is in the numbers: the foot is what stops a shot.

## Numbers measured

All MEASURED on this machine, which draws with software GL (no graphics card), so the times say how the arena compares with the empty page here and not what a visitor's machine will take.

At the low level, one sample, `node tools/arena-shots.mjs --measure` at 78fd9689 (median of six pictures after three thrown away; counts are the engine's, summed over the passes of one sample; `proof/arena/measure-low.json`):

| View | Triangles | Draw calls | ms a picture | At the first pass (23:32Z) |
| --- | --- | --- | --- | --- |
| the page's ground alone, no arena | 24 | 6 | 1680 | 24 / 6 / 1679 |
| arena at rest | 48,224 | 87 | 2587 | 45,679 / 115 / 2405 |
| mid change, 1.30 s | 17,991 | 55 | 2413 | 15,992 / 55 / 2273 |
| 0.20 s after a blast | 49,396 | 109 | 2595 | 46,691 / 130 / 2433 |
| after three blasts | 50,052 | 107 | 2504 | 47,267 / 126 / 2423 |
| after the finishing blast, close camera | 29,689 | 56 | 2359 | |
| after the finishing blast, whole page | 50,732 | 107 | 2578 | |
| the cold beam burning, whole page | 50,760 | 109 | 2536 | |

So the arena at rest adds 48,200 triangles and 81 draw calls at the low level, and here 0.91 s to a picture that takes 1.68 s with nothing in it. Against the first pass that is 28 draw calls fewer and 0.18 s slower: the ceramic's shader now also reads the scorch, the grain, the uneven seams and the hole's depth for every texel of the ground, and software GL pays for that in full. UNKNOWN: the frame time on a real graphics card.

Where the draw calls are. MEASURED in node at rest: 48 meshes are drawn, of which 32 are the four corner guns (the look's rotary gun, 8 meshes each, parts that turn and recoil), 6 the ground, 2 the eight pillars (bodies as one mesh and feet as one, once they are up; while they rise they are single meshes), and 8 the panes and the health bar. UNKNOWN: what exactly the other 33 calls are; most likely the pass that draws the shadows, which draws each thing that throws one a second time. The guns are not mine to join: their file is the look helper's.

At the full level and four samples the engine counts, for one picture: at rest 65,901 triangles and 121 draw calls (163 before the pillars were joined), after two blasts 73,409 and 151 (184 before), after the finishing blast 78,215 and 150 on the whole page and 43,028 and 66 in the close camera. The first picture after loading counts about twice that, since it includes the pass that draws the shadows.

The real page with the boss's look on (local switch, LOOK1_ON true, at 26291694), the whole frame with everything of every helper in it: 223,620 triangles and 307 draw calls at 12 s; 267,910 and 399 at 43.5 s, just after a blast; 96,088 and 98 at 54.4 s, after the finishing blast in the close camera (that frame and the other four of the finish at b362215a). At the interim (c6028fcb) the same moments counted 340,043 and 481, and 385,543 and 569. UNKNOWN: how much of that drop is the joined pillars and how much the other helpers' work merged since.

Painting the wound of one blast: 56 to 115 ms at once for three different lines (node, this machine, while it was also drawing pictures, MEASURED at the first pass and not again). To keep it off the frame of the blast it is painted ahead while the cannon aims, a slice a frame over 36 frames (about 3 ms a frame), once the line has lain still from one frame to the next; what is left is done on the frame of the blast. The picture is the same either way (MEASURED: `tests/arena-breaks.test.ts`, slices equal the whole). The scorch of the finishing blast is painted the same way over 48 frames; MEASURED in node: the two tests that paint it whole and again in slices take about 3.9 s each, checks included.

Tests: `tests/arena-solids.test.ts`, `tests/arena-layout.test.ts`, `tests/arena-breaks.test.ts`, `tests/arena-scorch.test.ts`, `tests/arena-clear.test.ts`, 36 tests, all pass at d79786fe. Whole suite again at 01:53Z on 695e51a0: 171 files pass (2,202 tests), 13 skipped, the same 13 files fail (45 tests), none of the arena. Before that: Whole suite at 00:52Z on 78fd9689 (agent/b-boss 84e223bc and agent/b-bosslook 0060b885 merged in): 171 files pass (2,201 tests), 13 skipped, 13 files fail (45 tests). None of the 13 is a test of the arena. MEASURED: the same 13 files fail with the same count each (45 tests) on origin/agent/b-boss 84e223bc alone, run in a separate checkout: `tests/config.test.ts` (26; the film's units now add up to 181.18 s against a limit of 165 s), `tests/boss-fight.test.ts` (3), `tests/boss-closer-acting.test.ts` (3), `tests/harness-plan.test.ts` (3), `tests/polish-turn2.test.ts` (2), `tests/cut-of-build.test.ts` (2, red on branches until the Builder runs the cut), and one each in `tests/audio-cues.test.ts`, `tests/film-cut.test.ts`, `tests/harness-keep.test.ts`, `tests/roughcut.test.ts` (the plan has no entry for the beat boss.finish), `tests/site-finish-film.test.ts`, `tests/site-finish.test.ts`, `tests/stage.test.ts`. They come in with the fight's new beat and film lengths, not from `src/arena`. Before that merge, at 23:44Z on 93d14a1e, the whole suite had one red file, `tests/cut-of-build.test.ts`.

## What differs from the pictures, and why

Picture one (the arena at rest):

- The lean. The picture is drawn with a wide lens, so things lean away from its middle. The site's camera looks straight down with a narrow lens; I lean every standing thing the same way instead, so that no foot lies about where it is.
- The seams are bevelled grooves with a wall that is dark at the lip and lit at the foot, and the light comes from inside and spills a little onto the ceramic. After the Builder's word at 00:19Z they are dimmer and uneven along their length; STATED from looking at the sheet beside the picture: they still read a little cleaner and more even than the picture's copper channels.
- The corner guns are the look's rotary gun at 0.62; their domed foot is about 67 px across where the picture's is about 100.
- The ground is the site's ceramic with a little grain of my own in the shader (no draw call); the picture's grain is coarser.
- Bullets, the boss, the arrow and its trail are not mine.

Picture two (after the cannon):

- The pane. In the picture the broken pane still stands tall with a gap torn through it. Mine falls to low teeth with at most three thin splinters, because by the rule a broken pane stops no shot, and tall glass that stops nothing would lie. Asked for this way by the Builder at 23:52Z: low teeth and a few tall splinters.
- The trench starts where the break's line starts (the muzzle), not under the boss.
- The hole is split where it meets a foot or a corner gun.
- The beam and its burst are the look helper's.

The finish (finish-button-left.png):

- The picture's scorch is one ragged shape with dense embers along the trench near the arrow. Mine is the same plan (trench, round burn, on to the edge) with a softer rim drawn out along the beam and smaller, sparser embers.
- The picture's smoke is two tall curling plumes. Mine is four thin wisps of grey puffs.
- The button, the arrow, the boss's wreck and the beam are not mine. On the real page the plain button lay near (735, 610) at 54.4 s while the burn is centred on the boss's place (960, 650) as the view says: told to the fight helper.

## What is off

- The finishing blast has been seen on the real page only with the fight's plain stand-in for the beam and the button, not with the finish helper's arrow and beam (agent/b-finish is not merged here). The hook is agreed in words with that helper and not run.
- The cold wash still lifts the ground near the beam almost to white in my harness; with a driver the finish helper's lights replace my three, UNKNOWN how bright the two are together.
- The beam's drawn shadows also fall on the bodies of pillars that stand in them (they are drawn on whatever lies over the ground there). That reads as the far side of a pillar in shade; it is not a true shadow.
- The scorch after the pass of 01:31Z (the Builder's words: narrow at the hands, widening, soft broken edges, a round burn at its end). Against `finish-button-left.png` it still differs: in the picture a narrowing scorched tail with embers runs on from the burn to the right edge, here the black ends at the burn and only thin soot lies beyond it (by the Builder's words "at its end a round burn"); the picture's black is deeper (its darkest tenth is about 43, 35, 31, mine about 61, 55, 52 beside the button on the real page, MEASURED); its cracks are a fine net over the whole burn, mine are few; its embers are finer and lie in two long rows.
- The scar of the big cannon (the hole with its ringed rim, seen at the bottom left of the close view after the finish) was not touched in this pass; its rim still shows rings that read as grain.
- Draw calls: 81 added at rest at the low level. 32 of the 48 meshes are the look's guns. The panes and the bar (8 meshes) could still be joined.
- The frame time is known only in software GL, and there the arena became 0.18 s a picture slower tonight for what the ground's shader now does.
- The fallen column is grey at 43.2, dark grey at 43.5 and light grey at 44.5 s on the real page: no longer black then white, but its faces still change a good deal as it turns.
- The dust of the split is drawn as light taken away (it cannot be brighter than the white ceramic), so it reads as soft pale-grey shade along the seams, not as bright dust.
- If a blast arrives with no tell before it (a film jumped to a time), its wound is painted at once, about 0.1 s.
- `tests/cut-of-build.test.ts` is red on this branch, as on every branch until the Builder runs the cut on the merged tree.

## Proof

`pipeline/change002/proof/arena/`, each 1400 px wide, the target top left:

- `rest.png`: at rest.
- `change.png`: 0.05, 0.35, 0.80, 1.30 and 1.90 s into the change.
- `blast.png`: the warning light, then 0.03, 0.20 and 0.70 s after a blast, with the boss as a plain box 226 wide.
- `breaks.png`: after one, two and three blasts along different lines.
- `box.png`: at rest with the box and a glint on a pillar.
- `finish.png`: the finishing blast at share 0.15 and 0.60 with the beam's light, settled in the close camera, settled on the whole page, and the beam's light and shadows on the whole page.
- `real-change.png`, `real-fight.png`, `real-finish.png`: the real page with the fight and the boss's look on (LOOK1_ON true, a local switch, not pushed), at 6.9, 7.3, 8.4 and 12 s; at 42.9, 43.2, 43.5 and 44.5 s (both at 26291694); at 52.6, 53.3, 54.4, 56.0 and 58.5 s of the page (at b362215a). In the finish frames the orange and white bar, the button, the wreck, the black cracks and the green bits are the fight's and the look's, not the arena's.
- `measure-low.json`: the table above.

Made with `node tools/arena-shots.mjs [rest|change|breaks|blast|box|finish] [--no-build] [--level low] [--samples N] [--measure]`. The real page frames were made with the site's own still tool (`tools/lib/capture.mjs`, page `boss`, tier draft) from a local copy of this branch.
