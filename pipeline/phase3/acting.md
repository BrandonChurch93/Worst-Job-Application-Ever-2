# The cursor's acting on step 1

Branch `agent/acting`. Files: `src/cursor/body.ts` (all but `ARM` and the arms block of `step()`), `src/cursor/act/feel.ts`, `src/cursor/act/acting.ts`, my seconds of `src/pages/step1/script.ts`, `acting()` in `src/cursor/sheets.ts`, the tests named in the brief.

## What the approved images show that a quick look misses

1. The face is a pillow, not a plate. It is brightest in a soft band just inside the rim along the upper left edge, about a tenth of the body's width, and falls to a light grey toward the lower right. There is no hard glint anywhere on it.
2. The rim is a rounded black bevel about a twentieth of the body's width, glossy, with a hair of light on its upper left side. It keeps one width all the way round, in every state.
3. The gap under the body is the darkest thing in the picture after the rim: a near black line of contact tight under the lower right edge, darkest in the notch between stem and wing, then a soft shadow about a third of the body's width long. A still body sits close to the paper.
4. A state changes one thing and keeps the outline, the size and the angle. Beads stand on the face and on the paper beside it, each with its own glint. Shocked is only longer in the head. Angry is a red to orange wash in the top third with smoke from inside the tip. Scared is the same arrow in pale stone. Only exhausted gives up the outline, and even there the tip and the tail's hook can be read.
5. In `step1-fire.png` the arrow is the sharpest thing on the keys: no blur, no smear, one small hole, one thin wisp two body lengths tall, a tight shadow. It is about one key tall and tipped forward, tip up, as if caught mid step.

## What a stranger reads, beat by beat

Read from close looks at 1920 px wide (film frames cut round the cursor) and from the sheets.

- `step1.keyboard` (0 to 2.0 s). It struts straight to the field, upright, bouncing, leaning into the walk. It pulls back, taps once, and stays on the tap. The page opens under it and it throws itself back, flat on its heel, and stays there. Read: it was sure of itself and the page surprised it.
- `step1.firstName` (2.0 to 10.0 s). It stomps the first keys. The turrets come up, it looks twice, goes small. It leaps clear on to the H key and stands there tall and puffed, quite still, for more than a second (4.6 to 5.7 s). A shot lands one key to its right and it does not move. The next shot hits it (5.813 s): two frames squashed flat and bent round the blow, shoved a key's width left, then it springs back up on H, scorched, on the hot key (the key at 6.0 s), tips over on to its side and lies there a third of a second. It sees the next shot at the last moment, snaps a row up to R and holds, small. It drops flat and slides to S while that shot lands where it was, stretches up, and goes back to the keys careful and low. Read: it thought it could not be hit; it was hit; after that it hides.
- `step1.lastName` (10.0 to 15.0 s). The keys change places. Three times it pulls up off the keys on to the bare page above the board, to the right of the note so it never stands on text, rears back and holds the lean (0.2 to 0.3 s still), and dives for the letter where it is now. The second time it looks both ways first. Then it stops looking and stomps. Read: thrown each time, then cross.
- `step1.email` (15.0 to 19.9 s). One careful key. It darts off the board to the bare strip of page between the board's upper edge and the upload zone, right of the note, and waits there small, low and leaning away, beads on it (15.36 to 15.5 s). Nothing happens. It types the address in one run and hits Enter, proud. The first slab hangs over it: it starts, leaps long to the bare page, jumps when the slab lands. The second hangs over it: it cowers, leaps to the corner of the Email field, jumps when that one lands. The third hangs: it cowers there, pale, laid back, and ducks flat when it lands a hand away. It stays scared. Read: sure, then hunted, then hiding.
- `step1.shredded` (28.25 to 32.0 s). Its fifteen strips lie in a fan beside the slot, apart from the paper's strips. They stand, hold out of line, and close. At what the form says it sags small and low and stays down (0.4 s), then drags itself off the slot in two pulls with a stop between, low and bent. Read: it has nothing left.

## Decisions

- Not one event of the page moved. MEASURED: a test that runs the film of step 1 and lists every event except where a missed bolt lands, and every change of a typed value, gives the same list with the same times (to the step) on `main` and on this branch, 0 to 32 s. Where a missed bolt lands and when follows the cursor, so those 9 times move by up to 0.07 s; they cannot be kept with a new path.
- The hit is at 5.813 s, not 7.138 s (round 4, R1-1 issue 3: at 6.0 s the cursor has to stand on the hot key in the middle letter rows, scorched). The cursor stands on H (`FIRST.stand`, tip (1072,870), body centre (1086,896)) from 4.6 s; the right turret's shot of 5.475 s locks on it and hits. H and not J (the push of 19:49Z had J and 5.746 s) because the page singes the last letter 0.195 s after the hit: on H the field still reads five letters at 6.0 s, as the approved image does, and loses the fifth one step later (6.008 s). No key press and no typed letter moves. What moves with the hit: `bolt-hit-cursor` and the sizzle (7.138 to 5.813 s) and the singe (7.333 to 6.008 s; the letter is typed again at 8.050 s as before). The throw across the board and the hold on the hatch are gone. `tests/step1.test.ts` lines 506 and 507 (not my file) were changed by the Builder's word of 19:47Z to the hit between 5.5 and 6 s; the patch is `pipeline/phase3/acting-NEEDS.patch`.
- At 6.0 s the body is still (speed 19 px/s), spin 0.12, in the state `shocked`, burnt, on H, 0.19 s after the hit. The tip of the arrow stands on the key cap, not in the gap between rows: the page takes the ground from the tip, and in a gap the body sinks to the deck and the caps hide it.
- A fresh burn shoves the body `HIT.shove` px along the blow at once, and lifts it less (`HIT.lift`). The tumble of a recoil is smaller and comes back faster (`TUMBLE`), so the body is upright again 0.19 s after the hit. The squash of a recoil is its first 0.05 s (three frames), the stretch the next 0.04 s, then it is pulled back so the arrow has its own proportions at the key (squash 1.18 at 6.0 s).
- A hit sets the squash and the bend at once (`HIT`), with no spring to build them: one frame of contact.
- A jump or a start no longer kicks a body that is already in the air (`aloft`). Before, three reactions in a row left it hanging 260 px up for a second.
- The keys of the last name and of the email are struck when the body reaches the key. The dives (`LAST.dive`) and the leave after the duck (`FIRST.after`) are set so the body reaches each key in the same step as on main 4a8ac73.
- The nervous wait of the email is on the bare strip of page between the board's upper edge and the upload zone (the Builder's ruling of 19:00Z), 46 px above the board, right of the note. A new reaction `dart` takes it there at a scared body's pace and drops it to the ground at once. The wait is 0.14 s long: the first key is struck at 15.175 s and the run's click is at 15.5 s, and neither moves. The body turns confident 0.1 s into the run, so the nervous gait carries it to the second key in the same step as on main.
- The second `dustOff` is gone so the cocky pose is a clean hold. The angry stamp at the end of the shredded beat is gone: a start, then exhausted.
- Round 4, R9: after each dive from a slab it cowers (small, low, held about 0.5 s) where it landed, not a start upward. At the wiped form the start is gone: it cowers at once and holds, then `TRUDGE` is two pulls with a stop. The lift at 31.5 s to the next unit is the stage's and limits the slump to 1.2 s.
- After the third slab it stays scared until the form takes the address (the page set it angry for 0.4 s, which read as a flicker).
- The pile lies `FAN.away` from the body's place because `PILE` is not mine. `GATHER` holds the strips out of line from 0.4 to 0.8 of the mend. `ASKEW` now lies along the strips' axis (`along`, `step`) with under 0.7 px across, as the cursor fixer asked, so a strip slides in its own lane and never shows a gap of page.
- Agreed with the cursor fixer: `STRIPS` is 15 and read from the constant; `melt` is 0.6; no beads with exhausted.
- Whose is what on the sheet, agreed with the cursor fixer at 19:27Z: the outline, the rim, the red and the drips are the cursor fixer's; the stances are mine. The sheet's zoom (`SHEET.acting.zoom`) is outside `acting()` and not mine.
- The light: `config/showcase.json` says the slanting light of the approved images is not part of the look (STATED, lines 229 and 432), so no pose leans on it.

## Not done

- The nervous wait of the email is in clear space but only 0.14 s long.
- The holds of the last name's rears are 0.2 to 0.3 s; a `rear` now travels at a scared body's pace for its first 0.24 s so the lean is held on the page, not on the way.
- The pile of the cursor's strips is close under the slot. Moving it needs `PILE`, which is the tug fixer's.
- Round 4, R9, not answered: confident read as cautious (the pause is the set-down from the air in the first second, which is the stage's); the release at the acceptance and the proud hold at the paper (they play after 19.9 s, in the resume, not mine); the mend's read (it happens at `PILE`, right under the slot where the paper's strips hang, and the camera there is the tug's; a narrower fan was tried and not kept because it could not be judged in the time); the nervous wait is still 0.14 s.
- The narrator's line at the hit is booked in `content/narration.json` at 0.72 of the beat (7.76 s), now 1.9 s after the hit. The Builder has it.
- Round 4, the Builder's word of 20:07Z (a pose has to change the outline by a third to be read at 20 px): after the hit the recoil lasts 0.62 s, and from 6.0 s to 6.33 s the arrow is held knocked over on its side (turn 0.52, lean 0.34) on the hot key with the hole in view. At 6.0 s itself it is still upright (spin 0.12). It leaves at 6.335 s; the next shot lands on H at 6.433 s, 92 px behind it. The beat sheet of the first name takes a frame at 6.33 s, so the held pose is on it.
- A red I made and could not clear in my files: `npm run measure -- --unit step1` gives M9 red on 8107d4f's parent a6a6029 (22 key caps in the still `step1-fire` stand 44.5 to 45.6 px above the page against 36 to 42 within 2). The page makes the caps within 460 px of a hit hop for up to 0.38 s, and the hit is now 0.19 s before the key frame. A hit early enough for the hop to be over (by 5.62 s) would take the fifth letter out of the field before 6.0 s. The Builder has the three ways out (accept; `THUD.shake` 0.4 to 0.2 in the page, not my file; the hit back after 6.0 s).


## Fix round 3

Owner: acting_closer, branch `agent/acting3`, 21:23Z to 22:50Z on 2026-11-25. Round 5's issues R9-1 1 to 5, 7 to 10, 12; R9-2 3 to 7, 9, 10, 14; R4-2 1; R1-2 15.

### What a sheet of twelve frames sees

MEASURED (`npm run sheet -- --beat step1.<beat> --tier draft`): the frames of a beat stand at its start plus k times (its length less one frame) over 11. For the first name that is every 0.72 s (2.0, 2.72, 3.45, 4.17, 4.90, 5.62, 6.35, 7.07, 7.80, 8.52, 9.25, 9.97), for the last name and the email every 0.45 s, for the keyboard every 0.18 s, for the shredded beat every 0.34 s. At the sheet's size the arrow is about 20 px tall. A pose is read only when it is held across one of those instants and changes the outline as a whole: where it stands, how tall it is, which way it is laid.

### Decisions

- No event of the page moved. MEASURED: the list of every event of the film of step 1 except `bolt-hit` and `step`, with its step, is the same on `main` 9443fc4 and on this branch (81 events, `diff` empty; the list is written by a trace test kept out of the repo).
- The first second of `step1.keyboard` is the stage's set-down from the air (frozen): the body stands on the page from 1.0 s and the tap is at 1.5 s. In that half second: one long strut hop past the field (`STRUT`, 0.17 s, a squash where it lands), drawn back and up (`tap`, from 1.32 s), struck long into the field at 1.5 s, a proud settle, and at 1.64 s, when the board comes up, a new `rear`: a start upward, then packed down small and laid back, held to 2.1 s (squash 0.63 to 0.79, lean and turn 0.55 to 0.7 together).
- Confident stands taller and leans further into its way (`FEEL.confident`: stretch 1.12, lean 0.22, puff 0.3). Proud is taller and fuller still (1.18, 0.3, 0.9): the cocky stand on H from 4.7 s to the hit is a held pose of its own and lies on the frames of 4.90 s and 5.62 s.
- The hit (5.813 s): one short frame squashed and bent away (`HIT.bend` 0.8 to 0.5 so the outline stays whole), then tall and laid back the way the blow went, and held there to 6.33 s. Before, the body went over to 0.62, came back to 0.12 at 6.0 s and went over again to 0.52: three turns in 0.3 s, which is what read as torn. Now the turn goes out once (`TUMBLE.far` 0.8 to 0.6, for the squash only, `share` 0.145 to 0.08) and settles: at 6.0 s speed 19 px/s, spin 0.11 (the script's test of the key frame wants under 0.2), lean 0.36 on its way to 0.45, squash 1.32.
- The dodge after the hit (`snap`) is held 0.72 s, to the duck at 7.14 s, so it lies on the frame of 7.07 s.
- The last name: at each hunt the keys throw it (`flinch` 0.03 s after the key, a toss of `LAST.toss`), it is in the air over the bare page for about 0.3 s, and the three holds differ: a rear, a double take, then temper (a new reaction `fume`: packed down, swollen, pushed forward over its tip, shaking). After the hunts each stomp is answered by `fume` in place of a flinch, and Enter by a new `stamp`.
- The email: after Enter it is nervous, still on the key, for 0.45 s before the first slab hangs (the page sets proud when the key is struck; the cue comes 0.04 s after). It turns scared when it sees the first slab, so the dives go at a scared body's pace. The wait after the first key (`dart`) now ends upright and still, so the tremble and the beads are what is seen, not a dodge.
- The end: the pile stirs in its last 0.42 s on the page (`STIR`: each strip at rest twitches about its place and lifts a little, more and more), then stands. The cower at the wiped form is gone: it turned the body 50 degrees and squashed it to 0.63, and with the melt that was the blob. Exhausted is now stretch 0.8, lean 0.3, bend 0.4, melt 0.6 (was 0.74, 0.4, 0.55, 0.6): it sags and stays an arrow, then drags itself in two pulls. The melt was agreed with the cursor form fixer at 21:50Z: I had set 0.4, the new form is tuned at 0.6 and gives back the squash itself there, so 0.6 stands; bend 0.4 is the top, above it the body curls into a claw.
- The paper fixer was asked to hold the tug frame through the mend and declined (a test holds the camera at home from the form's message at 28.96 s, and the message would be cut). The stand and the zip play at home size.

### Tests changed, each for a number of mine

- `tests/acting-wait.test.ts`: the third hold of the last name is temper now, leaned forward (over 0.3), not a rear.
- `tests/cursor-act-knock.test.ts`: the body turns the way the bolt went within 0.06 s (over 0.2, was over 0.5 within 0.12 s) and then holds laid back that way.

### The acting sheet (R1-2 issue 15)

The six anchors of `acting()` have their own row now: pitch 55 page pixels (was 60) about x 945 (was 938). No size, zoom or pose changed; the shocked pose is as it was. MEASURED on `npm run compare -- --sheet cursor-acting --tier draft --format hd`, as the share of the picture's width from its edge to the first and last dark pixel of an outline: this build 0.0667 left and 0.0635 right (before: about 0.012 left and 0.047 right, read off the compare); the approved image 0.0682 left and 0.0490 right.

### What a stranger says the arrow feels, sheet by sheet, with no words

Read by me on the draft sheets of the head, at the sheet's size (the arrow about 20 px tall), the way R9 reads them.

- `step1.keyboard`, the script's word: confident. A stranger says: "it stands and waits, then hops over to the box and jabs it, and when the keyboard comes up it sits back." Sure of itself reads from the hop and the jab (frames 7 to 9), and the sit back reads as surprise (frames 10 to 12). Not the script's word in frames 4 to 6: the arrow stands at the edge of the drop zone and does nothing, because the stage holds it there until 1.0 s. Not fixed: the stage is frozen.
- `step1.firstName`, the script's word: cocky, then shocked and running. A stranger says: "it types, standing tall on a key, something burns it, and then it runs about between the shots." Tall and pleased reads on frames 5 and 6 (the stand on H). The hit itself is not on a frame of this sheet; on the motion sheet the arrow is lost in the hot key's glow from the frame after the hit, so a stranger says "a flash, and then it is somewhere in the glow". At full size (stills at 5.82, 5.83, 5.85, 5.88, 5.93, 6.0, 6.17 and 6.3 s) it reads: knocked a key to the left clear of the flash, squashed and bent, outline whole; back onto the key by 5.95 s; tall and laid back, still, to 6.33 s. The one frame at 5.88 s crosses the flash and is half covered. Not fixed: the glow and the flash are not mine, and the key picture wants the body on the hot key at 6.0 s.
- `step1.lastName`, the script's word: frustrated. A stranger says: "the keys jump about and throw it off the board, twice, and then it goes red and stabs at them." This is the script's word; the red is the angry heat and the three holds differ.
- `step1.email`, the script's word: nervous, then scared. A stranger says: "it types fast and hits the red key, red plates drop and it lies flat and scuttles out from under them." Scared reads from the flat, small body and the three different places (frames 8 to 11). Nervous, the 0.45 s after Enter, lies between two frames of the sheet and is not seen on it.
- `step1.shredded`, the script's word: exhausted. A stranger says: "a heap of strips lies under the slot, it pulls itself back into an arrow, sags, and drags off." The sag reads on frames 10 and 11 as a short, slumped arrow; at home size it is a few pixels, so it is the weakest of the five reads.

### The knocked body clear of the flash

MEASURED on `npm run sheet -- --motion hit --tier review` before this change: the frame of 5.90 s had the arrow inside the flash on its way back to the key (the spring brought it back 60 px in 0.13 s, at 600 px/s through the flash). Now the body stands where the blow put it for 0.07 s (`HIT.hold`), a key to the side, squashed and bent with its outline whole, and comes back in 0.1 s (`HIT.back`, eased at both ends): 5.82 to 5.88 s clear of the flash, back on the key at 5.98 s, at 6.0 s speed 21 px/s, spin 0.05, lean 0.38. The knock also sets the side the body falls to from the blow itself. The events of the film are the same list as on `main` (diff empty), the key frame's test holds, and `tests/cursor-act-knock.test.ts` holds as it stood after the first push. New test: `tests/acting3-holds.test.ts` (the rear, the hit's squash and held recoil with at most two changes of turn, nervous on Enter, a cower under each slab in a different place, the sag's numbers).

### Not done, and why

- A slump after the form's "Reluctantly": the message comes at about 19.85 s and my seconds end at 19.9 s. The seconds after are the paper fixer's.
- Confident in the first second: the stage holds the cursor in the air until 1.0 s (the Builder's ruling at 22:03Z: it stays).
- The pile, the stand and the zip larger in the frame: the camera is home from 28.96 s (declined by the paper fixer, upheld by the Builder).

### The pile's fan

Agreed with the cursor form fixer at 22:12Z: its loose strip is now the piece of the arrow it was cut from, so the fan pushes the strips less far apart (`FAN.across` 2.1 to 0.9, `FAN.stagger` 16 to 6, `tilt` stays 0). Looked at on a trial merge of its b429fd6 with this branch (stills of `step1.shredded` at 29.15 s, old fan above new): the pile reads as one arrowhead cut into strips.

### Measures of the last push

MEASURED on the merge with `main` db41bef, `npm run measure -- --unit step1 --tier review`: 8 green, 0 red. M2 0.0069 (most 0.02), M3 0.8224 (least 0.8, the same as `main`), M4 14 px and 4.76, M7 0 misses of 3, M9 1.87 px. `npm run still -- --key step1-fire --format hd`: draft 12.3 s, review 24.7 s, 470467 triangles and 282 draw calls, the same counts as `main`. No texture added.

