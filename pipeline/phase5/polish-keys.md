# Polish keys: the held key, the page's answer to a hit, the give back of step 1

Branch `agent/polish-keys`, from 664bedb5. Files changed: `src/pages/step1/index.ts`, `src/pages/step1/keyboard.ts`, `src/pages/step1/turrets.ts`, `src/pages/step1/real/keyboard.ts`, `src/pages/step1/real/turrets.ts`, `src/pages/step1/real/turret-fx.ts`, `tests/polish-keys.test.ts`, `tests/polish-keys-measure.test.ts`, `tests/polish-keys-film.test.ts`, `tests/polish-keys-run.ts`, `pipeline/phase5/polish-keys-shots.mjs`, this note.

Every number below is from the live stage stepped under the pack's own visitor, frames of 60 a second, by `POLISH_KEYS_TABLE=<file> npx vitest run tests/polish-keys-measure.test.ts`. "Before" is 664bedb5.

## Decisions

1. All three mends are on the live site only. The film's draw list of step 1 is not changed by one value, so no film frame changes and no film sheet is owed. This is narrower than the first plan sent to the Builder, which named film frames for A and B. Proof: `tests/polish-keys-film.test.ts` writes one sha1 of the draw list and the cursor's pose for every film frame of the page; the file made at 664bedb5 and the file made now are compared by `cmp`. The three draft stills are compared by `cmp` as well.
2. A, the travel. A key held down on the live site is drawn slid `SINK.x`, `SINK.y` (5.5 px, 5.5 px) toward its shadow in the page's plane, its label with it, and its shadow drawn in to `SINK.shade` of its length. The camera looks straight down the travel of a key, so the 6 px of height a key goes down by are about 1.3 px on screen at 1920 by 1080 (STATED, from the camera's distance); the slide is what is seen. The cap's tint at the bottom is the one a pressed key had before (`SUNK`, 0.24 darker): the letter's contrast on a pressed cap is what it was.
3. A, the hold. The key stays at the bottom for as long as the button of the click that pressed it is down, the pointer anywhere. It rises on the release on the spring it had (0.14 s, a short overshoot). One press types one letter however long it is held.
4. A, the turrets. While a key is held on the live site a turret does not wind up: a shot whose wind up would run under the held key is put off, by `STAY` (0.7 s) at the most for one shot, so holding a key down does not stop the turrets. A bolt already in the air flies on. The film never calls this.
5. B. On the live site a bolt that hits the arrow presses no key. The caps within `JAR.reach` of the strike are thrown outward from it by up to `JAR.px` on the frame of the hit and are back within `JAR.seconds`; the deck's own shake is kept. The strike's light is thrown on the deck and the caps round it (`EMIT.thrown`) and dies with a time constant of `SCORCH.quick` (0.04 s, was 0.4 s). A bolt that misses the arrow and lands on a cap still taps that cap, and the tap types no letter: it is a depth in the draw only, `strike()` is not called.
6. C. No new prop. In the tug's end the mended arrow is put with its tip `CAUGHT.under` px under the hood's lip of the shredder's cassette (before it lay 43 px below it, touching nothing), drops its tired pose and is drawn out long toward the hood over the last `CAUGHT.strain` seconds. At the end the cassette kicks (`CAUGHT.kick`), the arrow is thrown back short to where the pile lay inside `CAUGHT.fall` (0.067 s) with one swing, stands, and is released `CAUGHT.beat` (0.134 s) after the snap. Before, the release came 0.42 s after the same moment, so the visitor waits less.
7. The arms are untouched and stay inside `step1.tug`.
8. Two numbers held by tests of other owners are changed, because the beat the arrow stands before it is given back is now 4 frames and was 25. `tests/fix-tug.test.ts`: the window in which the arrow must lie settled before the mouse has it, 0.3 s to 0.05 s. `tests/polish-tug.test.ts`: the least time the arrow stands still before the mouse has it, 0.2 s to 0.05 s (0.071 s is measured). Nothing else in either file is touched. The reason the beat is short: the pack's sheet of the give back runs from 6 frames before the arrow's first move to 16 frames after it, so a longer stand would put the arrow following the visitor outside the sheet, and the visitor would wait longer.

## Numbers (MEASURED, the command above, before at 664bedb5 and after)

A, the visitor presses P at frame 939 (0:15.65) and lets go at frame 954.

| | before | after |
| --- | --- | --- |
| press to the bottom | 1 frame (0.81 of the travel on 939, all of it on 940) | 1 frame (the same) |
| frames at the bottom | 5 (940 to 944), then it rose with the button still down | 14 (940 to 953), every frame the button is down |
| up again | at frame 948, 6 frames before the release | at its neighbours' height on frame 956, 2 frames after the release (0.70, 0.29, then past by 0.06, 0.24, 0.24, 0.15, 0.05 of the slide, at rest on 961) |
| what moves on screen at 1920 by 1080 | the cap's top 6 px lower in height, about 1.3 px (STATED) | the cap and its label 5.5 px right and 5.5 px down, the shadow drawn in to a tenth |
| turret 1 beside it | winds up from 0.44 to 0.96 through frames 939 to 950 and fires on 951 | 0.39 on 938, 0 from 939 to 953, winds again from 954 |
| letter on the sunk cap | | ink (19, 16, 14) on cap (161, 154, 144), contrast 6.8, read off the pictures of frames 958 and 950 at 960 by 540 |

One bolt fired on frame 924, before the press, is in the air while the key is held and lands on the cap G on frame 953, before and after. It is at the left edge of the pack's crop.

B, the bolt meets the arrow on frame 898 (0:14.97).

| | before | after |
| --- | --- | --- |
| key under the arrow (G) | down all 6 px on 898, 899, 900, up by 904 | no key down, frames 898 to 910 |
| caps round the strike | none moved but with the deck | thrown outward by up to `JAR.px` (7.5 px) on 898, back inside `JAR.seconds` (0.2 s) |
| deck | 3.08, 0.34, -1.64, -1.61, -0.43 px | the same |
| the strike's light | a 46 px halo and a lamp of reach 48 dying on 0.4 s | thrown on the deck and caps to 300 px, dying on 0.04 s: a fifth left after 4 frames, a twentieth after 7 |

C, the give back.

| | before | after |
| --- | --- | --- |
| the visitor loses the arrow | frame 2357 | frame 2327 (the visitor's run is 30 frames ahead by then, nothing in the tug changed) |
| the shredding starts | 2419 | 2389 |
| what holds the arrow | nothing drawn: it lay 43 px under the hood's lip | its tip 7 px under the hood's lip and not moving, drawn out from frame 2527 to 1.24 of its length by 2544 and held so for 13 frames (2544 to 2556) |
| the release | none drawn | frame 2557: the cassette is kicked 19.8 px and is back in 13 frames, the arrow goes from 1.24 to 0.70 of its length in one frame and is thrown 50 px back in 4 frames (23, 18, 7, 2 px), turned 0.18 rad on the first, at its length again on 2561 |
| the beat | the arrow stood 25 frames | it stands without moving on frames 2561 to 2564 |
| the arrow is the visitor's again | 2612, 25 frames after the shredding's end | 2565, 8 frames after it |
| from the shredding's start to the visitor's arrow | 193 frames | 176 frames |
| control taken, all of it | 255 frames, 4.25 s | 238 frames, 3.97 s (`live.controlTakenMaxSeconds` is 8) |

The film: `POLISH_KEYS_FILM=<file> npx vitest run tests/polish-keys-film.test.ts` at 664bedb5 and now, 1920 frames of the page, `cmp` says the two files and their event lists are the same.
