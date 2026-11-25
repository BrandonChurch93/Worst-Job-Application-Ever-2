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
- `step1.firstName` (2.0 to 10.0 s). It stomps the first keys. The turrets come up, it looks twice, goes small. It leaps clear and stands tall and puffed (4.7 to 5.6 s). It sees the next shot, snaps a row up and holds, tip high, still (the key at 6.0 s). It drops flat and slides a key along while the shot lands where it was, stretches up out of the duck and stands tall again, pleased (6.6 to 7.1 s). The shot of 6.82 s hits it at 7.138 s: one short bent frame, then it is thrown, long, across the board on to the bare metal by the right hatch, where it stands tall and stiff with a hole in it and a wisp of smoke until 7.92 s. Then it finishes the name, nervous. Read: cocky, then punished.
- `step1.lastName` (10.0 to 15.0 s). The keys change places. Three times it pulls up off the keys on to the bare page above the board, to the right of the note so it never stands on text, rears back and holds the lean (0.2 to 0.3 s still), and dives for the letter where it is now. The second time it looks both ways first. Then it stops looking and stomps. Read: thrown each time, then cross.
- `step1.email` (15.0 to 19.9 s). One careful key. It darts off the board to the bare strip of page between the board's upper edge and the upload zone, right of the note, and waits there small, low and leaning away, beads on it (15.36 to 15.5 s). Nothing happens. It types the address in one run and hits Enter, proud. The first slab hangs over it: it starts, leaps long to the bare page, jumps when the slab lands. The second hangs over it: it cowers, leaps to the corner of the Email field, jumps when that one lands. The third hangs: it cowers there, pale, laid back, and ducks flat when it lands a hand away. It stays scared. Read: sure, then hunted, then hiding.
- `step1.shredded` (28.25 to 32.0 s). Its fifteen strips lie in a fan beside the slot, apart from the paper's strips. They stand, hold out of line, and close. It starts at what the form says, sags, and drags itself a little way off the slot, low and bent. Read: it has nothing left.

## Decisions

- Not one event of the page moved. MEASURED: a test that runs the film of step 1 and lists every event except where a missed bolt lands, and every change of a typed value, gives the same list with the same times (to the step) on `main` and on this branch, 0 to 32 s. Where a missed bolt lands and when follows the cursor, so those 9 times move by up to 0.07 s; they cannot be kept with a new path.
- The hit stays at 7.138 s. The cursor stands 16 px past the spot of 5 (`FIRST.past`) so the shot of 6.82 s flies the same length as on main. The duck is a slide of one key (`FIRST.short`), so the shot of 6.37 s lands where the cursor was and misses.
- At 6.0 s the body is still (speed 19 px/s), in the state `plain` with the reaction `snap`: no tremble, no beads, no blur.
- The shock is held on the bare end of the deck by the right hatch (`FIRST.panel`), the darkest clear place on the board. The throw takes 0.13 s so the hit sheet ends on the landed body.
- A hit sets the squash and the bend at once (`HIT`), with no spring to build them: one frame of contact.
- A jump or a start no longer kicks a body that is already in the air (`aloft`). Before, three reactions in a row left it hanging 260 px up for a second.
- The keys of the last name and of the email are struck when the body reaches the key. The dives (`LAST.dive`) and the leave from the shock (`FIRST.after`) are set so the body reaches each key in the same step as on main.
- The nervous wait of the email is on the bare strip of page between the board's upper edge and the upload zone (the Builder's ruling of 19:00Z), 46 px above the board, right of the note. A new reaction `dart` takes it there at a scared body's pace and drops it to the ground at once. The wait is 0.14 s long: the first key is struck at 15.175 s and the run's click is at 15.5 s, and neither moves. The body turns confident 0.1 s into the run, so the nervous gait carries it to the second key in the same step as on main.
- The second `dustOff` is gone so the cocky pose is a clean hold. The angry stamp at the end of the shredded beat is gone: a start, then exhausted.
- After the third slab it stays scared until the form takes the address (the page set it angry for 0.4 s, which read as a flicker).
- The pile lies `FAN.away` from the body's place because `PILE` is not mine. `ASKEW` is larger and `GATHER` holds the strips out of line from 0.4 to 0.8 of the mend.
- Agreed with the cursor fixer: `STRIPS` is 15 and read from the constant; `melt` is 0.6; no beads with exhausted.

## Not done

- The nervous wait of the email is in clear space but only 0.14 s long.
- The holds of the last name's rears are 0.2 to 0.3 s; a `rear` now travels at a scared body's pace for its first 0.24 s so the lean is held on the page, not on the way.
- The pile of the cursor's strips is close under the slot. Moving it needs `PILE`, which is the tug fixer's.
