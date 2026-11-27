# Look 1 of the boss: notes of b_bosslook_builder

Branch `agent/b-bosslook`, made from `origin/agent/b-boss`. Every claim is marked MEASURED (I ran or rendered it), STATED (someone told me) or UNKNOWN.

## What is built

A module in `src/boss/look1/` that draws the boss from a `BossView` and nothing else.

| File | What it holds |
| --- | --- |
| `numbers.ts` | The sizes of the machine, in px of the 1920 wide target sheets. `K = 226 / 590` turns them into page px. |
| `kit.ts` | Shapes and the materials of the look (brushed plates, bright bezel, lacquer button, frosted glass, orange plastic, soot). |
| `model.ts` | The body: hull, bezel, button, two wings, two rotary guns, hatch, bay, shield, four legs with knee and three-finger claw, the cannon, the marks of damage. |
| `gun.ts` | The rotary gun on its domed mount: `makeGun()`, `poseGun()`. The arena uses the same gun for the four corners. |
| `pose.ts` | `poseOf(view, options)`: every place, angle and strength, with no three.js in it. Also `muzzleOf`, `bigMuzzleOf`, `weakOf`, `wordAt`, and the tables `FORM`, `TURRET`, `FALL`, `GONE`, `WALK`, `TIMES`. |
| `fx.ts` | Everything that is not solid: dust, smoke, steam, sparks, flashes, the crack stars under the feet, bullets, hits, the tell line and the beam of the big cannon, the shards of the shield, the finishing blast. |
| `events.ts` | `EVENTS`: on which moment each event lands and how long its sound may be. |
| `index.ts` | `makeBoss(ctx)`. |

The eight parts of the brief:

1. Body with real height, in the four materials. MEASURED: `proof/bosslook/states.jpg`.
2. Forming, `boss.form` 0 to 1: the button cracks its socket, shoots out, the hull closes on it in the air, he lands, wings, guns and four legs come out one after the other, he stands up, the shield rises. The word stays centred and level on the button the whole way (MEASURED by test). `proof/bosslook/forming.jpg`.
3. Turret beat, `boss.turret` 0 to 1: hatch slides, the cannon climbs, swings forward over the button, the barrel runs out, it comes down on its rest at turret 0.94 with a kick, sparks and a ring, the bore glows. `proof/bosslook/turret.jpg`.
4. Fight: heading, legs that walk by `boss.walked` on planted feet, guns that aim, tell (lamp and spin), kick and flash at `firedAt`, shield flash, open flank ringed in red, hit, damage by stage, heal pulse. `proof/bosslook/walking.jpg`, `firing.jpg`, `damage.jpg`.
5. Big cannon: thin tell line in the air at muzzle height, bore and window that charge, body that braces and trembles, beam from x0, y0 to x1, y1 about `width` thick for 0.3 s, recoil, heat on the barrel, smoke. `proof/bosslook/blast.jpg`.
6. Bullets: round glowing orange balls, 19 px, short trail, a soft shade on the ground. Hits by kind (`round`, `glance`, `arrow`; `solid` is the arena's). Darts are left as today: the look does not draw them.
7. Beaten, `boss.beaten` 0 to 1 over the 1.0 s fall: the cannon is blown off (0 to 0.4), the glass bursts (0.05 to 0.3), the body drops on its belly (0.3 to 0.7) with dust, he smokes, the button lies clear with the word in its centre. `proof/bosslook/beaten.jpg`. The guide picture `references/drafts/round-9/LOOK-1-STATE-3-beaten.png` is beside it and is NOT a picked target.
8. The cursor is not redrawn.

Added after the brief, a first reading only, not a design that was looked at with the arrow's beam: `boss.gone` 0 to 1. The body burns white, the glass frame, guns, wings and legs are torn off down the beam one by one, the hull burns away with a last flash, the bare button comes down on the ground at gone 0.9. `proof/bosslook/gone.jpg`.

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

The page draws the word itself with its own label at `wordAt(view)` (x, y in page px, z, rot, show). STATED by b_boss_builder at 23:30Z: the module is wired behind `LOOK1_ON` in `src/boss/tune.ts`, still false; he had not yet looked at a picture with the switch on.

I edited nothing outside `src/boss/look1/`, `tools/bosslook*`, `tests/bosslook-pose.test.ts` and `pipeline/change002/`. No NEEDS: commit was necessary.

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
| finish-fire | gone leaves 0 | frame 0; parts leave from 0.09 s to 1.66 s | 2.1 s |
| boss-gone | gone 0.9, the hull is burnt away | 1.92 s (frame 115) | 1.0 s |
| button-down | gone 0.9, the button is on the ground | 1.92 s (frame 115) | 0.4 s |

Offers the fight does not emit today (STATED by b_boss_builder): body-clamp at form 0.20 (0.58 s), body-land at form 0.34 (0.99 s), leg-stomp at 1.80, 2.03, 2.26 and 2.49 s.

## Numbers

MEASURED by `tests/bosslook-pose.test.ts`:

- The side guns' muzzles stand 79 px to each side of the middle and 75 px ahead of their mounts; the big muzzle 274 px ahead of the middle. Heights about 81 px (guns) and 103 px (big).
- Planted feet do not move while they are planted. On straight lines at the home heading at least two feet stand at all times.
- Walking a diagonal while turning, all four feet are in the air in under 10% of the frames (about 5 to 9%). This is below the bar: see the end.
- The same view gives the same pose, however often it is asked. No clock and no dice in the folder.

MEASURED by `node tools/bosslook.mjs counts` on the helper machine (headless browser, software renderer, 1920 by 1080, low level; `proof/bosslook/counts.json`):

| State | Triangles of the boss alone | Draws of the boss alone | Whole frame, all passes | ms with him | ms without him |
| --- | --- | --- | --- | --- | --- |
| turret inside | 66,232 | 102 | 131,238 tris, 201 draws | 1965.7 | 1744.8 |
| turret out | 75,616 | 117 | 148,128 tris, 223 draws | 1925.8 | 1752.8 |
| forming, form 0.36 | 11,226 | 19 | 22,768 tris, 39 draws | 1760.3 | 1728.8 |
| fight frame, 12 bullets, a gun firing, stage 2 | 80,920 | 130 | 156,104 tris, 239 draws | 1916.5 | 1700.5 |
| big blast at 0.1 s | 75,738 | 119 | 148,250 tris, 225 draws | 1923.3 | 1710.8 |
| beaten 0.2 | 77,708 | 129 | 151,242 tris, 238 draws | 1907.7 | 1715.1 |

The ms are the software renderer's, about 100 times slower than a real card, so only the two columns against each other mean anything: he adds 2% (forming) to 13% (fight) to a low level frame there. The frame time on a real graphics card is UNKNOWN. Medium and high levels: see the report, UNKNOWN until that run is in the json.

## What differs from the pictures, and why

- Legs: mine are shorter and heavier, bent at a knee, with a three-finger claw (asked by the Builder at 22:52Z). They are paler than the picture's.
- The word Submit: the page's own weight and size, not the picture's lighter word (asked).
- The ground: the site's ceramic, not the picture's pinker ground (asked).
- Hull: darker plates with a bright bezel, but still less contrast between bezel, wings and hatch than the picture.
- Turret out: my breech window is a plain orange square; the picture's has a softer glow and more hoses. My steam is two small plumes; the picture's is longer.
- The shield is a little taller and greener than the picture's.
- Shadows are the site's: longer and harder than the picture's soft ones.
- Beaten: the guide shows the button with the hull still whole around it and the body charred; mine drops on its belly, splays its legs, loses cannon and glass, and smokes. The guide is not picked.

## What is off or below the bar

- A lifted upper leg on the side away from the key light turns dark for the length of its step (MEASURED in `walking.jpg`). The site's room is dark beside its one soft light, so a plate tilted away from it loses its reflection. I made the plates less metallic, which took it from black to dark grey; it still shows.
- All four feet in the air in 5 to 9% of frames on a diagonal while turning. A step lasts about 0.06 s at 190 px a second, so it does not read as a hop, but the bar was two feet down always.
- Stage 1 damage (ember cracks, cracked glass, two vents of smoke, a spark now and then) reads on the sheet; at his real size on the page it is small. Stage 2 (fire, torn plates, loose hoses) reads better.
- The forming works and lands hard, but it does not yet feel as powerful as the brief asks: no camera shake is mine to give, the flash at the landing is small on a pale ground.
- Additive glows nearly vanish on the pale ground (MEASURED). The rings that must read (open flank, last flash) are drawn with normal blending instead.
- Draw calls: 102 to 130 for the boss alone. The parts that never move against each other could be joined into fewer meshes; not done.
- Levels and tiers: the three live levels thin out the thrown chunks, the puffs of smoke and the lamps (low 10, 40, 2; medium 18, 90, 5; high 26, 150, 8); the film draws 26, 150, 10 at every tier and the site's finishing does the rest. The solid shapes are the same at every level, which is why the low level still costs 66 to 81 thousand triangles. The harness rendered every sheet at the draft tier; renders at the higher film tiers are UNKNOWN, not run.
- `boss.gone`: a first reading, never seen together with the arrow's beam or the arena. The power-up glow round the arrow is not mine and not built here.
- Darts: not drawn by the look (left as today). The flattened cursor: nothing found missing, but I did not render it beside the boss; UNKNOWN.
- `tests/cut-of-build.test.ts` is red on branches until the Builder runs the cut on the merged tree (STATED by the brief); left alone.

## The harness

`node tools/bosslook.mjs <sets...> [--tier draft]` with sets `states forming turret walking firing blast damage beaten gone page counts`. It builds the views by hand, renders the boss alone through the site's real light and finishing in a headless browser, and writes one sheet per set under `pipeline/change002/proof/bosslook/`, target beside render where there is a target, none wider than 1400 px. Raw frames go to `out/work/bosslook/` and are not committed.
