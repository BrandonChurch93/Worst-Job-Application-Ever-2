# Lamp keeper: the light in the machine and the printed floors

Third owner of `table-lights` and `tier-art`. Branch `agent/lamp-keeper`, looks on `agent/lamp-keeper-looks`, folder `lamp-keeper`. The notes of the earlier owners (`table-light.md`, `lights.md`, `art.md`) are read and not edited.

Facts are marked MEASURED (with the command), STATED (read somewhere, not run by me) or UNKNOWN.

## Start (03:49 UTC, 2026-11-26, main at 4f64ab74)

MEASURED on untouched main: `npm test` 96 files, 1345 of 1345 passed; `npm run build` exit 0; `npm run bots` "bots: all clear".

## What a quick look at the approved images misses, in my part

1. The floor is not lit, it mirrors. Between the lamps it is near black in every close image; what reads as a lit floor is the image of a lamp, a window or a model's lit front lying in the lacquer, sharp where it starts and drawn out in a soft tail toward the eye.
2. No two kinds of lamp are alike. Rail lamps are small flat rectangular windows set in the steel, seen mostly as a row of spots mirrored in the wall; lane lamps are warm amber domes a third of a ball wide with a pool about a ball wide; globes carry a halo; the beacon is a ribbed dome with a hot filament. A lamp is never a white disc.
3. The brightest floor of a tier is at the feet of the slings and round the flippers, warm, and it falls off to near black within two balls. The top of a tier is darker than its foot.
4. The frame's inner walls are dark: they show a few hard small images of lamps and nothing of a general light. A pale wall is the surest sign of a fill.
5. Colour sits in the light and not in the print: Corporate is warm white and gold on navy, Street is sodium amber with one red and one blue, Office alone is evenly lit and pale. A lit insert is a coloured rim with a paler middle and a dark line round it, never a white plate.

## Point 1: all ten keys beside approved, draft, 03:53 to 03:58 UTC

Command: `npm run compare -- --key <key> --tier draft --format hd` for each key (35 to 46 s each, `loader-page` 21 s), then `node assets-src/table/lights/means.mjs` (mean colour of the whole frame at 960 by 540, share of pixels under 24 and over 200 of 255).

MEASURED, mean RGB of approved, of the build, and the build's luminance over approved's:

| Key | Approved | Build | Build over approved | Dark share approved, build |
| --- | --- | --- | --- | --- |
| loader-page | (210, 208, 203) | (215, 212, 207) | 1.02 | 1%, 0% |
| table-wide | (58, 56, 52) | (56, 53, 50) | 0.95 | 47%, 52% |
| tier-corporate | (61, 59, 57) | (80, 78, 75) | 1.32 | 36%, 23% |
| lobby-doors | (78, 74, 70) | (99, 94, 87) | 1.27 | 18%, 19% |
| tier-office | (87, 87, 77) | (81, 83, 73) | 0.95 | 10%, 6% |
| reply-all | (85, 87, 81) | (84, 86, 77) | 0.99 | 15%, 5% |
| tier-street | (65, 67, 64) | (86, 85, 80) | 1.28 | 20%, 15% |
| youre-fired | (58, 48, 47) | (92, 79, 70) | 1.62 | 32%, 5% |
| rail-cam | (58, 59, 58) | (77, 68, 62) | 1.18 | 20%, 17% |
| last-save | (85, 84, 80) | (102, 95, 84) | 1.14 | 16%, 12% |

The tier keys are not dim as a whole frame: Corporate and Street are a quarter to a third brighter than approved. The light is in the wrong places: the frame's outer rails and apron are near white at both sides, and the floor between the lamps is a lit grey where approved is near black. What is dim is the lamps' own work: the pools at the slings and the lit fronts.

The three largest differences in light, each key:

- `loader-page`: no lamp in it. (1) The port's well is mid grey where approved is near black. Not mine. Nothing else in light.
- `table-wide`: (1) The rail lamps are an even dotted line of cold white points down both walls; approved has warm pools of different sizes, largest at the slings and the foot of each tier. (2) The floors read flat teal and grey; approved floors are near black with warm reflections. (3) The frame's side walls are pale grey sheets; approved walls are dark with bright edges.
- `tier-corporate`: (1) A ring of equal white discs round the tier, each with a small halo and no pool; approved lamps are warm and the pools at the slings are the brightest floor. (2) The outer rail lands at both sides are near white (website light on brushed metal) and carry the frame's mean up. (3) Each globe sits in a dark ring on the floor where approved has a halo and a mirrored image.
- `lobby-doors`: (1) Whole frame 1.27 of approved, bright share 7.9% against 4.6%: the HQ's lit hall and the apron behind are pale cream. (2) Floor is flat navy with gold lines; approved mirrors the doors, the globes and the brass in it. (3) A blown blue white insert at the lower left edge is the brightest thing; approved's brightest things are the two globes.
- `tier-office`: (1) Even ring of white discs with halos on a green floor; approved has no visible rail lamps from this side and its light is in the cups, the inbox and the sling feet. (2) Models are dark (cubicles, inbox near black brown) where approved has them cream and lit from above. (3) The inserts are white hot plates twice the size of approved's.
- `reply-all`: (1) Dark share 5% against 15%: no deep shadow anywhere, the floor is an even lit green. (2) Lamps show as discs with a pale tail; approved shows them mirrored in the rail wall. (3) Inserts blown out, brightest things in the frame; approved's brightest are the cup lids.
- `tier-street`: (1) Ring of equal white discs with halos; approved lamps are small and amber and the frame is warm. (2) Floor is a mid blue print, evenly lit; approved is near black with the road lines catching light. (3) Apron and outer rails near white.
- `youre-fired`: (1) 1.62 of approved, dark share 5% against 32%. The steel wall behind the firehouse is bright brushed silver with a pink cast over a third of the frame; approved is blue black with a few glints. (2) The floor is pale grey green and matt with a flat red wash before the bay; approved is near black and wet with one red streak and the windows mirrored. (3) The beacon lights the roof pink and evenly; approved's beacon has a hot core and lights only the roof round it.
- `rail-cam`: (1) Floor matt blue grey with long pale tails; approved near black with small warm discs. (2) Red insert is a white hot plate with a red rim, the brightest thing; approved's brightest is the beacon. (3) The brick and stone fronts are evenly lit and pale.
- `last-save`: (1) A milky veil over the floor: 1.14 of approved and the print is pale grey blue. (2) Inserts blown out to white. (3) The garage is a pale lit cylinder, brighter than anything in approved's upper right.

## Baseline counts (before the first change)

Command: `npm run build && npm run counts -- --key <key> --live low`, run 03:59 UTC on main 4f64ab74. MEASURED, my two rows (meshes, colour pass draws, shadow pass draws, calls, triangles) and the whole frame:

| Key | table-lights | tier-art | Whole frame |
| --- | --- | --- | --- |
| table-wide | 8, 8, 0, 8, 25350 | 6, 6, 0, 6, 3534 | 195 calls of 300, 449426 triangles |
| tier-corporate | 6, 6, 0, 6, 17996 | 3, 3, 0, 3, 1180 | 109 calls, 252142 |
| tier-office | 6, 6, 0, 6, 22854 | 3, 3, 0, 3, 1180 | 129 calls, 335094 |
| tier-street | 4, 4, 0, 4, 14708 | 2, 2, 0, 2, 1178 | 106 calls, 269420 |

The command ends with exit 1 on every key on untouched main ("The rows do not make up what the renderer counted: -5 calls and 2 triangles are in no row"). Not mine.

## Looks counter

One list, every low tier still counted (the Builder's ruling of 05:02 UTC: a diagnosis still and a trial still are looks). Two parts, 40 each a round, 80. The ten stills of point 1 were of the untouched build.

| When (UTC) | Name | Stills | What for |
| --- | --- | --- | --- |
| 04:00 to 04:10 | dbg youre-fired, last-save | 19 | each term of the light switched |
| 04:05 | r1 | 3 | first deep floor |
| 04:15 | r2 | 8 | spills, rail windows, hidden lamps |
| 04:22 | dbg lobby-doors | 7 | each term switched |
| 04:25 | r3 | 5 | floors by tier |
| 04:27 | r4 | 4 | Office print, lens level |
| 04:32 | r5 | 6 | after merge 21 |
| 04:36 | r6, r7 | 3 | bats and elbow |
| 04:42 | timing | 1 | one draft still for its time (the review still is not low tier) |
| 04:44 to 04:48 | b7, g7, b8 | 5 | the ground's shadow trial and its noise floor |
| 04:50 | r8 | 4 | garage lamps by rule |
| 04:53 | r9 | 4 | night prints from above |
| 04:58 | s2 | 2 | point 9 at the brief's two moments |
| 05:01 | r10 | 2 | shoulder lamps |
| 05:03 | r11 | 6 | shoulders again, four keys after the frame's wall fix |
| 05:04 | s3 | 3 | point 9 at the first flash |
| | Sum of round 1 | 82 | two over the 80: I counted 67 where it was 70 when I reported at 05:00. No still more until the Builder opens round 11. |

Round 11 (opened 05:42 UTC, 40 a part, 80), the same one list:

| When (UTC) | Name | Stills | What for |
| --- | --- | --- | --- |
| 05:43 | q1 | 4 | inserts in their wells, Office and street pits |
| 05:45 | q2 | 2 | prints lowered |
| 05:46 | q3 | 2 | Office lamps lowered, `table-wide` |
| 05:48 | q4 | 2 | Office inside the tenth, `reply-all` |
| 05:49 | q5 | 2 | lost: an edit of mine failed and the same state was rendered again |
| 05:51 | q6 | 2 | inserts with a thinner well and a hot centre |
| 05:59 | q7 | 1 | `tier-corporate` as it was, for the notes' paper |
| 06:01 | q8 | 1 | low lamp before the notes at 0.12, paper divided by 2.45 |
| 06:03 | q9 | 2 | the lamp at 0.2, and `youre-fired` |

## Diagnosis (04:00 to 04:25 UTC, 26 stills with a local switch on each term, counted in the list of looks)

One session, one key, each term of the light switched off in turn, region means read with `sharp`. The switch was a local patch and is not in the tree.

- `youre-fired`, the pale matt floor and the flat red wash (point 4). MEASURED: region x 300 y 880 w 400 h 200 is (123, 111, 87) with the broad spill term and (77, 77, 64) without it, approved (29, 42, 49). Region x 700 y 950 w 500 h 130 goes 122 to 83. The wash was the spill of the firehouse door: one broad soft red sheet in the coat, long as the whole street. It was not the red true light (without that light the wash is redder) and not the model.
- `youre-fired`, the bright wall behind: the frame's own room reflection, scaled by my `wjlEnv`. MEASURED wall (96, 81, 77); with `wjlEnv` at 0 (60, 29, 27). The frame's owner asked me to leave `wjlEnv` alone and is bringing the wall down in `steel()` on its side (MEASURED by it: (96, 81, 77) to (59, 49, 47)).
- With every term of mine off the whole frame of `youre-fired` is (49, 42, 35): darker than approved, with the right mood. So the excess was all in what the lights add to flat floors and walls, not in the lamps.
- `last-save`, the milky veil: mostly the surround reflected in the coat. Whole frame (102, 95, 84), without the room (89, 82, 69).
- `lobby-doors`, the pale floor at left (x 0 y 820 w 700 h 260): (111, 105, 98), without the room (79, 78, 78), approved (48, 50, 48). The carpet (165, 145, 133) against approved (88, 36, 37) is the model's own colour under my lamps; without the mirrored lamp term it is (121, 101, 89).

## What changed (commits 9933daba, 96b38e0f)

- Floors (points 2, 3): the print of a flat floor gives back less of a far lamp's light (`DEEP` in `lights/colours.ts`, by tier: seen along the floor 0.2 on Corporate and the street, 0.7 in the Office), and all of it inside a pool. The mirrored lamp is one sharp image and a tail of five taps toward the eye (`STREAK`). The floor's share of the room went 0.3 to 0.16 (0.2 Office).
- Point 4: the firehouse spill is a narrow red streak (half 0.42 ball, sharp start, falling tail); window spills are barred by the pitch of their windows (`pitch`, `phase`), so a row of windows mirrors as a row.
- Point 5: rail lamps are small flat windows in rectangular frames, three sizes by place (top wall, launch lane, lift side), lens colour deepened by tier (`TINT`), `LENS.window` 4.2 to 1.3 so the colour survives the bloom. Lane domes keep their pools.
- Point 6: hidden lamps over the dim models through `highOf` (Office inbox and cubicles, Corporate boardroom; they read the model boxes, so they follow the layout). Office wide lamps 2.4 times, Office print lifted 1.7 (`COAT.print`), so the Office is a lit room and the night tiers stay night.
- Inserts: `INSERT_GLOW.on` 1.9 to 1.05, rest 0.6 to 0.42; the glow atlas has a less white middle (rebaked with `--only inserts`).
- Point 8: garage lamps are computed from the garage model by the street owner's rule (upper `(base + h) * 96 - 22`, lower `(base + 0.4 h) * 96`, half a ball outside on the diagonals; with the two turn spiral the lower left one is left out).

## Point 6: the tiers at their cameras (r4, r2 for the street), MEASURED

`sharp` region means. The build's tier camera shows the frame's rails around the pit, approved fills the frame with the pit, so the pit of the build (x 250 y 40 w 1420 h 990) is set against the whole approved frame.

| Key | Approved whole | Build pit | Ratio | Build whole |
| --- | --- | --- | --- | --- |
| tier-corporate | (61, 59, 57) | (66, 63, 59) | 1.06 | (78, 76, 73) |
| tier-office | (87, 87, 77) | (89, 92, 75) | 1.02 | (92, 96, 84) |
| tier-street | (65, 67, 64) | (70, 67, 60) | 1.01 | (82, 80, 75) |

The rest of the whole frame is the frame's pale outer rails, not mine.

## The frame owner's two facts (04:36 UTC), MEASURED on `tier-corporate` draft

16 px squares on the left bat at a quarter, a half and 0.85 of its length, and on the lift's elbow (x 215 y 95):

| | Pivot | Middle | Tip | Elbow |
| --- | --- | --- | --- | --- |
| Before (r4) | (222, 141, 54) | (227, 144, 52) | (129, 87, 49) | (76, 55, 34) |
| After (r7) | (147, 98, 53) | (184, 118, 51) | (168, 108, 50) | (121, 83, 41) |
| Approved, by the frame owner | (187, 102, 27) | | (194, 107, 30) | (161, 79, 27) |

The bat lamp stood 16 px over the bat near its pivot; it now stands 150 px over the floor above the bat's middle (power 2.1, reach 3.6 balls). One lamp was added at the head of the lift column of Corporate and the Office (power 1.6 after r7, not rendered again yet).

## Counts after the changes (04:40 UTC, commit c475041e, live low)

Command: `npm run build && npm run counts -- --key <key> --live low`. MEASURED (meshes, colour, shadow, calls, triangles):

| Key | table-lights before | table-lights now | tier-art before and now |
| --- | --- | --- | --- |
| table-wide | 8, 8, 0, 8, 25350 | 8, 8, 0, 8, 22662 | 6, 6, 0, 6, 3534 |
| tier-corporate | 6, 6, 0, 6, 17996 | 6, 6, 0, 6, 16204 | 3, 3, 0, 3, 1180 |
| tier-office | 6, 6, 0, 6, 22854 | 6, 6, 0, 6, 20166 | 3, 3, 0, 3, 1180 |
| tier-street | 4, 4, 0, 4, 14708 | 4, 4, 0, 4, 12916 | 2, 2, 0, 2, 1178 |

Draw calls the same, triangles fewer (the rail lamps are flat windows now, not domes in cups). Whole frame of `table-wide`: 192 calls of 300.

Assets, `du -sb`: `public/assets/table/art` 8279678 bytes (7.90 MB of 9), `assets-full/table/art` 26280293 bytes, largest file 8543144. The lights have no asset folder.

One still of `youre-fired`, hd, `--force`: draft 39.2 s (43 s with start), review 80.4 s (83 s).

## Point 7: the savings, MEASURED, no patch recommended

`npm run counts -- --key table-wide --live low`: the shadow pass of the key light is 51 of the 192 calls.

- The shell's ground: 5 meshes, 7 colour calls, 6 shadow calls, 1930 triangles, the same in all four keys. Trial, not kept: `flat.castShadow = false` in `src/shell/real/ground.ts` takes 3 of the 6 (192 to 189 calls). Two draft stills before and after (the same code twice gives 0 pixels of difference): `youre-fired` 159 pixels differ, largest step 1; `table-wide` 18987 pixels differ, 764 by more than 4, largest step 23, all inside the machine (x 481 to 1531, y 323 to 1015). So the ground's shadow is seen in the wide view and 3 calls do not pay for it.
- `table-hardware`: 7 shadow calls in `table-wide` (14 meshes, 21 calls), 6 in `tier-corporate`, 7 in `tier-office`, 7 in `tier-street`. Not tried: the folder has an owner.
- The far plane of `src/core/renderer.ts` line 227 is set on my point lamps only. With `TRUE.shadows` 0 no lamp of mine casts (`shadow.autoUpdate` false), so no shadow pass reads that far plane and changing it saves no call. STATED from the code; the shadow column of my rows is 0 in every key (MEASURED).

## Point 8: the garage lamps

Computed from the garage model, by the street owner's rule. MEASURED in a throwaway test on main's layout (h 4.3): x 637 and 362 px, z 515.6 and 289.9, the old typed 16.63, 13.77, 516 and 290. With the runner's two turn spiral (h 3.0) the row heights follow and the lower left fitting is left out (six lamps).

## Point 9: the Office flash (05:04 UTC), MEASURED

`npx vitest run tests/table-lights-strobe.test.ts` on my tree: `pinball.replyAll office: 4 flashes in 7 s, most in one second 3, shortest gap 0.400 s, at 20.90 21.30 21.70 22.10`; whole film office 10 flashes, most in one second 3. The beat starts at 19 s (`config.film.beats`), so the first rise is 1.9 s in, 0.27143 of the beat.

`node assets-src/table/lights/look.mjs --name s3 --beat pinball.replyAll --at 0.26905,0.27143,0.27381 --camera tier-2`, pit means (x 250 y 40 w 1420 h 990): one step before the rise (105, 107, 88), at the rise (106, 108, 90), one step after (107, 109, 91). At rest in the same beat, `--at 0.5`, (97, 99, 81) (measured at 04:58 UTC, before the shoulder lamps, which add about 1). So the flash stands about a tenth over the rest and climbs by about one hundredth a step: shallow, no hard step between two frames.

## After the frame's wall fix reached main (r11, 05:03 UTC), whole frame against approved, MEASURED

| Key | Approved | Build | Ratio |
| --- | --- | --- | --- |
| youre-fired | (58, 48, 47) | (73, 65, 57) | 1.32 |
| lobby-doors | (78, 74, 70) | (83, 77, 72) | 1.04 |
| reply-all | (85, 87, 81) | (90, 91, 78) | 1.04 |
| table-wide | (58, 56, 52) | (46, 44, 41) | 0.79 |
| tier-street | (65, 67, 64) | (74, 74, 70) | 1.11, pit (72, 73, 67) 1.08 |
| tier-office | (87, 87, 77) | (89, 91, 78) | 1.04, pit (99, 99, 80) 1.11 |

`table-wide` is now darker than approved as a whole: the frame went dark around a pit that did not change.

## The shoulders under the bats (05:01 UTC)

The frame's owner saw them black in `tier-office` and `tier-street`. Cause: they lie behind the guide walls, which block every lamp of the lanes in the baked fields. One lamp 130 px high over each shoulder, in the tier's `windows` group (a source over 100 px high in a group of mode 2 is read as a wide lamp and gives almost nothing: seen in r10 on the street).

## Decisions

- The Office is treated as a lit room and the two others as night: one rule for all three made the Office floor near black.
- I did not lower `wjlEnv`: the frame reads it and its owner asked me to leave it.
- The hidden lamps are not fittings: they have no lens and spend none of `ctx.light`. They exist because the approved Office and the boardroom are lit from above with no visible source.
- No floor was rebaked: the lift of the Office print is a material colour, 197 s saved a round.
- The boardroom lamp stays at power 0.7. The Corporate owner MEASURED the walnut right under it and the paper a sixth brighter; twice the lamp would overlight the walnut it has just set. The paper keeps a colour over 1 on its side.

## Round 11, before its cards (05:43 to 05:52 UTC), MEASURED at draft

The Builder's first line of 05:42 UTC: the paper over 1 at (2.4, 2.0, 0.62). It is the Corporate owner's note in `pipeline/phase4/corporate-models.md`: the sheets on the three standing notes at the foot of the boardroom carry a colour over 1 because the hidden lamp gives them almost nothing, and the owner asked me for a factor. I read it wrongly at first as a thing of my own notes; done at 05:59 to 06:03 UTC as below.

Cause, read in the hook and worked out: the boardroom lamp hangs 211 px up over the middle of the room. The notes stand 1.05 balls in front of it, 25 px up, and face away from it, so they get its bare 0.4 share at the far end of its reach: about 0.02 of the lamp.

Change: one more hidden lamp of the same kind (`NOTES` in `groups.ts`), 0.75 ball in front of the notes on the side they face, 70 px up, reach 2 balls, power 0.2, colour `CORPORATE_WHITE`, following `general`. No fitting, no `ctx.light`, no draw call.

MEASURED on `tier-corporate` at draft, the mean of the three sheets (x 322, y 396, w 92, h 30):

| State | sRGB | Linear |
| --- | --- | --- |
| before: no lamp, paper (2.4, 2.0, 0.62) | (111, 99, 57) | (0.167, 0.131, 0.042) |
| lamp 0.12, paper (0.98, 0.82, 0.25) | (101, 90, 50) | (0.135, 0.107, 0.033) |
| lamp 0.2, paper (0.98, 0.82, 0.25) | (114, 103, 57) | (0.178, 0.140, 0.042) |

So the factor is 2.45: with the lamp at 0.2 the paper divided by 2.45 comes out as it did (1.07 of before in red and green, the same in blue), and no colour of that folder is over 1. The floor before the notes does not change to the eye (the pit of `tier-corporate` is (65, 62, 59), 1.05 of approved). The paper is not my file: the one line is in `pipeline/phase4/lamp-keeper-NEEDS.patch` (`PAPER` in `src/table/real/models/corporate/notes.ts`). Until it is applied the sheets are lit 2.45 times as much as before with their old colour, so the lamp and the patch belong in the same merge. With the patch on, `tests/table-corporate.test.ts` and my two light tests pass (31 of 31).

The marquee's title (the frame's owner, 05:52 UTC): near black in `table-wide`, seen again in the review still. Read, not rendered: it is drawn by the shell's type with its own material, which never passes `lit()`, so the `panel` group cannot touch it; a true light would take one of the six that are spent round the ball. Not mine and not done. The door is the frame's: a `text` shape goes to its part's maker first (`src/stage/CONTRACT.md`), and the run has part `marquee`. Told to the frame's owner.

The lit inserts. Before: the lit glass filled the whole hole and read as a flat saturated disc. Now the atlas draws the glass at 0.82 of the hole at the foot of a dark well inside a thin metal trim, and the glow falls from a pale hot centre to dark at the glass edge (`assets-src/table/art/inserts.mjs`, `WELL`, 6 s to rebake). Seen in q6 on `tier-office` from above: a bulb under moulded glass, the well dark round it. In `rail-cam` no red insert is in the frame and nothing red is the largest bright thing.

The pits inside the tenth (pit region x 250, y 40, w 1420, h 990, against the whole approved frame):

| Key | Approved | Pit before | Pit now | Ratio now |
| --- | --- | --- | --- | --- |
| tier-office | (87, 87, 77) | (102, 104, 86), 1.16 after merge 24 | (94, 94, 78) | 1.06 |
| tier-street | (65, 67, 64) | (72, 73, 67), 1.08 | (70, 69, 63) | 1.03 |

Whole frames now: tier-office 1.04, reply-all 1.01, table-wide 0.86 (q3), lobby-doors 0.92 and rail-cam 0.97 (q1).

What moved: Office print 1.7 to 1.35, Office rail lamps 0.8 to 0.6 with the wide ones times 1.5, Office shoulder lamps times 0.7, street print 1.35 to 1.2.

Counts at ac3f758e (live low, MEASURED 05:56 UTC, `npm run build && npm run counts -- --key <k> --live low`): the same as at c475041e in every row of mine (table-lights 8, 8, 0, 8, 22662 on `table-wide`; 6, 6, 0, 6, 16204; 6, 6, 0, 6, 20166; 4, 4, 0, 4, 12916 on the tiers; tier-art 6, 6, 0, 6, 3534; 3, 3, 0, 3, 1180; 3, 3, 0, 3, 1180; 2, 2, 0, 2, 1178). Assets after the insert atlases were baked again: `public/assets/table/art` 8288329 bytes (7.90 MB of 9), `assets-full/table/art` 26326693 bytes, largest file 8543144 bytes.

Point (e), `table-wide` at review (05:57 UTC, 70.5 s, 936517 triangles, 580 draw calls, invalid values 0), looked at under approved: whole frame (52, 49, 44) against (59, 56, 52), 0.87. The pit holds beside approved; what differs most is outside my part (the open cabinet end and the black side walls, the marquee's dark title).

