# Look 1 of the boss: notes of b_bosslook_builder

Branch `agent/b-bosslook`, made from `origin/agent/b-boss` (merged again at 1178a395). Every claim is marked MEASURED (I ran or rendered it), STATED (someone told me) or UNKNOWN.

## What is built

A module in `src/boss/look1/` that draws the boss from a `BossView` and nothing else.

| File | What it holds |
| --- | --- |
| `numbers.ts` | The sizes of the machine, in px of the 1920 wide target sheets. `K = 226 / 590` turns them into page px. |
| `kit.ts` | Shapes and the materials of the look (brushed plates, bezel, lacquer button, frosted glass, orange plastic, soot, scorched steel), `cutTo` that cuts a shape along a convex outline. |
| `model.ts` | The body: hull, bezel, button, two wings, two rotary guns, hatch, bay, shield, four legs with a knee and a claw of two hooked talons, the cannon, the marks of damage, the hull once more in seven pieces for the finish, the button's scorched rim and what stays lying about it. |
| `gun.ts` | The rotary gun on its domed mount: `makeGun()`, `poseGun()`. The arena uses the same gun for the four corners at 0.62 of the size; the exports did not change. |
| `pose.ts` | `poseOf(view, options)`: every place, angle and strength, with no three.js in it. Also `muzzleOf`, `bigMuzzleOf`, `weakOf`, `wordAt`, `buttonAt`, and the tables `FORM`, `TURRET`, `FALL`, `GONE`, `FLY`, `LEFT`, `PRESS`, `BEAMLIT`, `WALK`, `TIMES`, `WORD`. |
| `fx.ts` | Everything that is not solid: dust, smoke, steam, sparks, flashes, the crack stars under the feet, bullets, hits, the tell line and the beam of the big cannon, the shards of the shield, the scraps and pops of the finish, the smoke over what is left. |
| `shade.ts` | His own soft shadow on the ground. |
| `events.ts` | `EVENTS`: on which moment each event lands and how long its sound may be. For the sound table only (STATED by b_boss_builder). |
| `index.ts` | `makeBoss(ctx)`. |

The eight parts of the brief:

1. Body with real height, in the four materials. MEASURED: `proof/bosslook/states.jpg` (target beside build), `hull.jpg` (the hull plate at three times beside the target's), `film.jpg` (his size in the film beside the arena target).
2. Forming, `boss.form` 0 to 1: the button cracks its socket, shoots out, the hull closes on it in the air, he lands, wings, guns and four legs come out one after the other, he stands up, the shield rises. The word stays centred and level on the button the whole way (MEASURED by test). `proof/bosslook/forming.jpg`.
3. Turret beat, `boss.turret` 0 to 1: hatch slides, the cannon climbs, swings forward over the button, the barrel runs out, it comes down on its rest at turret 0.94 with a kick, sparks and a ring, the bore glows. `proof/bosslook/turret.jpg`.
4. Fight: heading, legs that walk by `boss.walked` on planted feet, guns that aim, tell (lamp and spin), kick and flash at `firedAt`, shield flash, open flank at `boss.weak`, hit, damage by stage, heal pulse. `proof/bosslook/walking.jpg`, `firing.jpg`, `damage.jpg`.
5. Big cannon: thin tell line in the air at muzzle height, bore and window that charge, body that braces and trembles, beam from x0, y0 to x1, y1 about `width` thick for 0.3 s, recoil, heat on the barrel, smoke. `proof/bosslook/blast.jpg`. The trench and the soot on the ground are the arena's (STATED by b_arena_builder).
6. Bullets: round glowing orange balls, 19 px, short trail, a soft shade on the ground. Hits by kind (`round`, `glance`, `arrow`; `solid` is the arena's). Darts are left as today: the look does not draw them.
7. Beaten, `boss.beaten` 0 to 1 over the 1.0 s fall: the cannon is blown off (0 to 0.4), the glass bursts (0.05 to 0.3), the body drops on its belly (0.3 to 0.7) with dust, he smokes, the button lies clear with the word in its centre. `proof/bosslook/beaten.jpg`.
8. The cursor is not redrawn.

## The finish (added by the Builder at 00:03Z and 00:41Z)

Targets: `references/approved-002/finish-blast.png` and `finish-button-left.png`. Sheet: `proof/bosslook/gone.jpg`, the two targets on top, then gone 0.12, 0.30, 0.50, 0.70, 0.86, 0.92, 1, the fist down, the fist gone. The beam, its light, the arrow and the scorched ground are not mine and are not in the sheet.

(a) Coming apart, `boss.gone` 0 to 1 (2.13 s on the live site, STATED): a machine torn off a button that stays whole. `GONE` in `pose.ts` gives each part its span: shield 0.02 to 0.6, guns from 0.05 and 0.10, wings from 0.08 and 0.14, legs from 0.20 to 0.36, the bay from 0.22, the hull from 0.28 in seven pieces, one every 0.06, the last one out at 0.98. Every part leaves along the beam at once and fans out to its own side of it as it goes (`FLY`: 2700 units far, 420 to the side at once and 0.42 more for each unit travelled, 120 high), tumbling. No part is given any travel toward the arrow: the step back and the round burst of the hull were taken out at the Builder's word (01:35Z). While the beam is on, every part keeps a floor of light of 0.42 of its own colour (`BEAMLIT`). The button slides to `LEFT` (960, 650, the fight's FALLEN; MEASURED equal by test) over gone 0.02 to 0.92 and turns level.

(b) What is left at gone 1, all of it downrange of the button along the line of the blast (`view.scorch`, else `view.finish`, else plus x; it does not follow the arrow when the arrow walks: MEASURED by test). Places are along the blast and across it, page px from the button's middle (`LEFT` in `pose.ts`):
- the button, whole, level, face up, with a thin scorched rim (19 px wider than the button);
- four torn hull plates of four sizes, 0.92, 0.6, 0.44 and 0.3 of their size, at 192, 300, 436 and 650 px downrange, burnt (the scorched steel), each tilted so that one edge is under the ground;
- a bent plate (burnt), a claw and two bolts (dark steel) at 92 to 262 px downrange, the claw clear of the caption under the button;
- small burnt shards, 64, 80 or 96 by level and 96 in the film (one instanced mesh), 4 to 19 px, thrown through the blast, each landing and staying, four in ten of them tilted into the ground; 16% lie beside the button, the rest from 136 to 780 px downrange in a fan half as wide as it is long;
- soot: two soft dark sprites on the side of each plate, of the bent plate and of the claw that faced the blast.
The crack stars under his feet now differ in size (0.7 to 1.3) and are gone by gone 0.42, so none is left where the scorch lies. A pale column of smoke about two button heights tall drifts up from the button's top right. The wide scorch with embers is the arena's (STATED by the Builder). The glass shards on the arrow's side are the shield's, from when he was beaten, and lie where the approved picture has glass.

Seen on the real page (MEASURED, `proof/bosslook/real-finish.jpg`): a scratch branch from origin agent/merge55 (cc5abb86) with this branch merged and `LOOK1_ON` true (local, not pushed), the site's still tool, page boss, draft tier, beat `boss.finish` at 0.328, 0.388, 0.44, 0.5, 0.56 and beat `boss.press` at 0.25. The Submit button is upright, level and readable in all six frames. With `LOOK1_ON` true the button is drawn by this module alone (`src/pages/step4/index.ts` calls `drawRig` for the stand-in only when the look is off). The button that was seen upside down is the stand-in's cap: its turn is `rig.cap.rot` from `collapseRig` in `src/boss/body.ts`, the fight helper's code (STATED from reading; I did not run the page with the look off).

(c) The fist: `buttonAt(view)` gives `{ x, y, w, h, rot, top, press }` in page px. The button goes down in 0.07 s from `view.boss.pressedAt` (9 model units deep, 4.5% smaller) and stays down for as long as `pressedAt` is set. It springs back with an overshoot over 0.38 s only from `view.boss.releasedAt`, a field the view does not carry today; the look reads it if it is there. So in the film the button stays down until the page turns (ruling of 00:41Z). MEASURED by test at 0.2, 0.45, 2 and 30 s after the blow, and with a release.

## How it plugs in

```ts
import { makeBoss } from '../boss/look1'
const boss = makeBoss({ seed, level })      // all optional
scene.add(boss.object)                       // page px, y up, origin at the middle of the 1920 by 1080 page
boss.pose(view, dt, light)                   // each frame; light is the page's emitter hook, optional
boss.setLevel('low' | 'medium' | 'high')
boss.dispose()
```

Options: `seed`, `socket` (where the button was, default 960, 960), `home` (960, 548), `ground` (draw my own cracks on the ground), `pit` (draw my own hole; off by default, the arena draws the hole, the lip and its cracks; the chunks thrown out and the crack stars under the feet are mine).

STATED by b_boss_builder: the module is wired behind `LOOK1_ON` in `src/boss/tune.ts`; the page part `boss-look1` in `src/pages/step4/real/index.ts` calls `pose(viewNow(), 1/60, ctx.light)`, keeps calling it at gone 1 and after, and draws the word at `wordAt(view)` with my `WORD` (`inter-400`, 25 px) from form 0.

I edited nothing outside `src/boss/look1/`, `tools/bosslook*`, `tests/bosslook-pose.test.ts` and `pipeline/change002/`. No NEEDS: commit was necessary.

## The shadow: both sets of numbers

Ruling of the Builder: the body's cast shadow is off inside look1 and the look draws its own, wide and soft, under the same light as the arena's pillars. `src/post/look.ts` is untouched.

| | The arena's pillars (STATED by b_arena_builder, 00:12Z) | The boss (`SHADE` in `shade.ts`) |
| --- | --- | --- |
| How | the site's shadow map only | a soft blob under the hull and one under each leg, drawn by the look |
| Direction | right and down, 42.7 degrees below +x (light toward -0.65, 0.6, 0.36) | (0.735, -0.678) in model units, y up: right and down, 42.7 degrees below +x |
| Length | 2.46 px for each px of height by geometry, about 0.4 seen for a thin pillar | 0.5 px for each px of height |
| Softness | about 10 px at the plate's edge, about 30 px at the far end | blur 64 model units, about 25 page px, the same all the way |
| Darkness | 0.33 to 0.50 in the first 15 px, core 0.40 | 0.40 |

UNKNOWN: the two were never rendered in one frame, so the match is by numbers only. Mine does not get softer with distance as the pillars' does.

## The tone against the target

MEASURED with a script on `references/approved-002/boss-turret-inside.png` and my render of the same state (mean and median brightness, 0 to 255, same boxes on both; my camera has perspective, so the boxes sit a few px off on the high parts):

| Place | Target | Build |
| --- | --- | --- |
| Hull face above the button | 133, 127 | 150, 146 |
| Hull face left of the button | 184, 186 | 158, 159 |
| The two together | 158 | 154 |
| Wing right of the gun | 132, 131 | 126, 133 |
| Hatch lid | 123, 124 | 123, 124 |
| Gun barrels | 154, 159 | 146, 135 |
| Leg, upper right | 123, 109 | 118, 122 |
| Leg, lower left | 107, 100 | 124, 131 |
| Ground | 237, 237 | 223, 223 |

The hull's mean is within 3% of the target's, but the target has a bright sweep across the plate that mine lacks: mine is flatter (13% lighter above the button, 14% darker left of it). The bevel boxes read 15 to 20% lighter than the target's; I do not trust those two boxes after the hull changed shape and give them as UNKNOWN.

## The frame of each event

Seconds are for the live site: forming 2.90 s, turret beat 1.60 s, fall 1.0 s, finishing blast 2.13 s (the last four STATED by b_boss_builder). At 60 frames a second one frame is 0.0167 s.

| Event | Lands on | Seconds after its start | Sound may last |
| --- | --- | --- | --- |
| break-out | form 0.06, the button leaves the socket | 0.17 s (frame 10) | 1.4 s |
| turret-rise | turret 0.02, the hatch starts | 0.03 s (frame 2) | 1.25 s |
| turret-lock | fired by the fight at turret 1.0; the cannon is down at 0.94 | 1.50 s for the picture, 1.60 s for the event (frames 90 and 96) | 0.7 s |
| bullet-fire | `guns[i].firedAt` | frame 0; flash 0.07 s, kick 0.25 s | 0.3 s |
| shield-glance | `shield.glancedAt` | frame 0; flash 0.3 s | 0.35 s |
| boss-heal | `healedAt` | frame 0; pulse 0.6 s | 0.6 s |
| big-tell | `big.tell` leaves 0 | frame 0; as long as the tell | the length of the tell, ending on big-fire |
| big-fire | `big.firedAt` | frame 0; beam 0.3 s, recoil 0.45 s, heat and smoke 1.2 s | 1.5 s |
| turret-off | beaten leaves 0 | frame 0; the cannon flies over 0.4 s | 0.9 s |
| boss-fall | beaten 0.7, the belly hits the ground | 0.70 s (frame 42) | 0.8 s |
| finish-fire | gone leaves 0 | frame 0; parts leave from 0.04 s on | 2.1 s |
| button-down | gone 0.9, the bare button is on the ground | 1.92 s (frame 115) | 0.4 s |
| boss-gone | gone 1, the last piece is out of the picture | 2.13 s (frame 128) | 1.0 s |
| finish-press | `pressedAt` | frame 0; down in 0.07 s, stays down | 0.3 s |

STATED by b_boss_builder: the fight keeps its own button-down mark at boss-gone + 1.4 s and names the sound's place to the Builder as gone 0.9. Offers the fight does not emit today: body-clamp at form 0.20 (0.58 s), body-land at form 0.34 (0.99 s), leg-stomp at 1.80, 2.03, 2.26 and 2.49 s.

## Numbers

MEASURED by `tests/bosslook-pose.test.ts` (13 tests):

- The side guns' muzzles stand 79 px to each side of the middle and 75 px ahead of their mounts; the big muzzle 274 px ahead of the middle. Heights about 81 px (guns) and 103 px (big).
- Planted feet do not move while they are planted. On straight lines at the home heading at least two feet stand at all times.
- Walking a diagonal while turning, all four feet are in the air in under 10% of the frames (about 5 to 9%). This is below the bar: see the end.
- The same view gives the same pose, however often it is asked. No clock and no dice in the folder.
- `LEFT` equals the fight's `FALLEN`; the thrown button ends there, level.
- The button under the fist: down in 0.07 s, down while the fist is on it, back only after a release.

MEASURED by `node tools/bosslook.mjs counts` on the helper machine (headless browser, software renderer, 1920 by 1080; `proof/bosslook/counts.json`). Own is the boss alone in one pass; frame is the whole frame with him over all passes.

| Level | State | Own triangles | Own draws | Frame triangles | Frame draws | ms with him | ms without him |
| --- | --- | --- | --- | --- | --- | --- | --- |
| low | turret inside | 55,666 | 116 | 64,702 | 147 | 1863.4 | 1764 |
| low | turret out | 65,912 | 132 | 82,180 | 170 | 1950.1 | 1746.8 |
| low | forming, form 0.36 | 10,930 | 21 | 13,572 | 30 | 1839 | 1755.8 |
| low | fight frame: 12 bullets, a gun firing, stage 2 | 71,042 | 146 | 90,206 | 187 | 1917 | 1722.5 |
| low | big blast at 0.1 s | 66,034 | 134 | 82,302 | 172 | 1853.1 | 1693.8 |
| low | beaten 0.2 | 66,798 | 143 | 84,998 | 184 | 1890.8 | 1738.4 |
| medium | turret inside | 55,826 | 116 | 95,040 | 215 | 2174.5 | 2010.2 |
| medium | turret out | 66,072 | 132 | 98,270 | 193 | 2240.6 | 1975.6 |
| medium | forming, form 0.36 | 11,090 | 21 | 15,402 | 34 | 2035 | 2009.3 |
| medium | fight frame: 12 bullets, a gun firing, stage 2 | 71,202 | 146 | 109,192 | 213 | 2164.9 | 1893 |
| medium | big blast at 0.1 s | 66,194 | 134 | 98,392 | 195 | 2193.4 | 1924.8 |
| medium | beaten 0.2 | 66,958 | 143 | 101,896 | 210 | 2171.1 | 1909 |
| high | turret inside | 55,986 | 116 | 120,044 | 267 | 2281.7 | 2048.8 |
| high | turret out | 66,232 | 132 | 98,750 | 193 | 2236.3 | 2019.7 |
| high | forming, form 0.36 | 11,250 | 21 | 15,882 | 34 | 2104.2 | 2009.8 |
| high | fight frame: 12 bullets, a gun firing, stage 2 | 71,362 | 146 | 109,672 | 213 | 2395.4 | 2143.1 |
| high | big blast at 0.1 s | 66,354 | 134 | 98,872 | 195 | 2448.4 | 2226.6 |
| high | beaten 0.2 | 67,118 | 143 | 102,376 | 210 | 2280.2 | 2001.7 |

The ms are the software renderer's, about 100 times slower than a real card, so only the two columns against each other mean anything: at the low level he adds 5% to 12% to a frame there. The frame time on a real graphics card is UNKNOWN. The finish (gone 0 to 1) is not in this table: UNKNOWN.

## What differs from the pictures, and why

- The word Submit: the page's own weight and size, not the picture's lighter word (asked).
- The ground: the site's ceramic, not the picture's pinker ground (asked).
- The camera of my harness has perspective, so the high parts (button, cannon) draw 7 to 9% larger beside the target than the flat sheet shows them; the numbers of the model follow the sheet.
- Legs: straight from hip to claw as seen from above, the knee raised, the lower link mostly hidden under it. The target's leg shows more of its length and more parts along it.
- Claws: two hooked talons in light steel; the target's are a little shorter and blunter.
- Hull: within 3% of the target's mean, flatter (see the tone table). The brushing shows at three times; at film size it is faint.
- Turret out: my steam is two small plumes; the picture's is longer. The window glows with a falloff in a dark rounded frame; the target's frame is thinner.
- The shield is a little taller and greener than the picture's.
- Beaten: the body drops on its belly, splays its legs, loses cannon and glass, and smokes; there is no picked target for that state.

## What is off or below the bar

- The body beside the two approved states reads as the same machine, not yet as a photograph of it: plates flatter than the target's, less small detail on the legs and the gun mounts, edges that face away from the key not clearly darker than the face (not finished, point 1 of the Builder's tone list).
- Stage 1 against stage 2 at film size is a small step (`film.jpg`): soot, a cracked shield and smoke at 1; a torn plate, fire and a broken top edge of the glass at 2.
- The legs keep a floor of light of 0.65 of their own colour (`LEGLIT` in `pose.ts`) over a darker steel, because the site's one low key left a leg that leans away from it nearly black (MEASURED in the sheets before the change). All four now read alike (MEASURED in `states.jpg` and `walking.jpg`), but flatter than the target's legs, which have deeper shading along the rails.
- All four feet in the air in 5 to 9% of frames on a diagonal while turning. A step lasts about 0.06 s at 190 px a second, so it does not read as a hop, but the bar was two feet down always.
- The forming works and lands hard, but it does not yet feel as powerful as the brief asks: no camera shake is mine to give, the flash at the landing is small on a pale ground.
- Additive glows nearly vanish on the pale ground (MEASURED). The rings that must read (open flank, last flash) are drawn with normal blending instead.
- The finish: the four plates that stay shrink to their lying size in the first half of their flight, which shows at slow speed; the thrown button skids from where he was beaten to FALLEN, 231 px in the film and up to about 340 px on the live site (STATED by b_boss_builder), and he turns level on the way, nearly half a turn in the film. On the real page (MEASURED, `real-finish.jpg`) the wreck sits on the arena's scorch; against the approved picture the pieces are fewer and plainer (flat burnt steel, no torn edges or rivets, no glow of embers on them), the soot at each piece is a soft smudge and not a streak, and the largest plate lies on the pale floor above the scorch, not in it. The finish helper's beam was a flat bar at the draft tier in these frames: UNKNOWN how the pieces read against its final look.
- The shadow is matched to the pillars' by numbers only (see the table).
- Draw calls: 116 to 146 for the boss alone. The parts that never move against each other could be joined into fewer meshes; not done.
- Levels and tiers: the three live levels thin out the thrown chunks, the puffs of smoke, the scraps and the lamps (low 10, 40, 2; medium 18, 90, 5; high 26, 150, 8); the film draws 26, 150, 10 at every tier and the site's finishing does the rest. The solid shapes are the same at every level. The harness rendered every sheet at the draft tier; renders at the higher film tiers are UNKNOWN, not run.
- Darts: not drawn by the look (left as today). The flattened cursor: nothing found missing, but I did not render it beside the boss; UNKNOWN.
- The whole suite, MEASURED at 01:12Z on this branch after the merge of 1178a395 (329 s): 2211 passed, 38 failed in 9 files, 17 skipped; `tests/bosslook-pose.test.ts` 13 of 13 then, 14 of 14 now. None of the failing files is mine: `config` (26), `boss-fight` (3), `boss-closer-acting` (3), `polish-turn2` (2), `audio-cues`, `site-loading`, `site-finish`, `site-finish-film`, `roughcut`. MEASURED: the ten failures in `boss-fight`, `boss-closer-acting`, `polish-turn2`, `audio-cues` and `site-loading` are the same ten on `origin/agent/b-boss` without my work. The other four files I did not run there; at 23:58Z they failed on the film's length (180.35 s over the 165 s the config allows), which is the base branch's. `tests/cut-of-build.test.ts` passed in this run (21 of 21), though the brief expects it red on branches.

## The harness

`node tools/bosslook.mjs <sets...> [--tier draft]` with sets `states forming turret walking firing blast damage beaten gone film page counts`. It builds the views by hand, renders the boss alone through the site's real light and finishing in a headless browser, and writes one sheet per set under `pipeline/change002/proof/bosslook/`, target beside render where there is a target, none wider than 1400 px. `states` also writes `hull.jpg`. `counts` takes `BOSSLOOK_LEVELS=low,medium,high` (one level is about two minutes). Raw frames go to `out/work/bosslook/` and are not committed.
