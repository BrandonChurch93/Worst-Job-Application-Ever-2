# polish-turn: the page turn's seat and the step row during the turn

Branch `agent/polish-turn`, from `origin/main` 02eeb686. Times are UTC, 26 Nov 2026, read with `date -u`.

Files edited: `src/stage/turn.ts`, `src/shell/view.ts`, `src/core/renderer.ts`. `src/core/levelShadows.ts` not edited. No file outside the brief's list needed a change, so there is no NEEDS patch.
Tests: new `tests/polish-turn.test.ts`. In `tests/stage-turn.test.ts` only the numbers my work changes: the speed at the seat (0.7 to 0.9 of the hand over became 1.1 to 1.3), the depth of the first knock (6 became 8 degrees), and where the knocks start (the seat became the seat plus `TURN.held`).

## 0. Before anything was changed

MEASURED on `origin/main` 02eeb686: `npm ci`, `npm run build`, `npm test`: 147 files, 1812 tests passed.

## 1. The kit's lines the mend rests on

- `kit/03-METHOD.md` line 605: "A page is the face of the slab. To change page the slab turns over about its long axis and the next page is on its back. It has mass: it starts slowly, swings, seats with a knock, and the things on the new page shiver once."
- `kit/03-METHOD.md` line 49: "Behind the page there is nothing to see. During a page turn the edge of the slab and a dark, unlit backing show for a moment. Nothing else is ever visible around a page."
- `kit/03-METHOD.md` line 450: "`page-turn` | A heavy slab turning over with a low rush of air and a knock as it seats | Every page turn".
- `kit/07-QUALITY-BAR.md`: "Contact: on the frame something hits, do both things react, and does the page around them answer?" "Weight: do things move as if they had mass?"

## 2. What was measured before (origin/main)

How: the live site, `mode=live&bot=keen&clock=steps&quality=<level>`, 1920 by 1080, one picture every 1/60 s from the step the page becomes step 1 (a script of mine outside the repo, `/tmp/m/live.mjs`, built on `tools/lib/capture.mjs`); the film, `npm run seq -- --first 848 --last 871 --tier draft --force` (the seat is frame 858). The gap is the height in px at 1920 wide of the dark backing over the slab's upper edge, read down a strip of columns left of the middle. The angle is `arriveTurn` at that frame.

| frame from the seat | angle, degrees | gap px, live high | gap px, live low | gap px, film |
|---|---|---|---|---|
| -10 | -45.8 | 213 | 213 | 194 |
| -8 | -37.5 | 159 | 159 | 144 |
| -6 | -29.3 | 112 | 112 | 98 |
| -4 | -20.7 | 69 | 69 | 56 |
| -3 | -16.0 | 50 | 50 | 38 |
| -2 | -11.1 | 31 | 31 | 20 |
| -1 | -5.8 | 15 | 15 | 6 |
| 0 | 0 | 2 | 2 | 0 |
| 1 | -3.1 | 4 | 4 | 6 |
| 2 | -5.1 | 9 | 9 | 10 |
| 3 | -5.95 | 12 | 12 | 12 |
| 4 | -5.7 | 12 | 12 | 10 |
| 5 | -4.4 | 10 | 10 | 6 |
| 6 | -2.0 | 5 | 5 | 0 |
| 7 | -0.7 | 0 | 0 | 2 |
| 8 | -1.7 | 3 | 3 | 2 |
| 9 | -1.6 | 3 | 3 | 2 |
| 10 | -0.4 | 1 | 1 | 0 |
| 11 to 20 | 0 | 0 | 0 | 0 |

(The live pictures stand about three quarters of a frame before the film's, because the page becomes step 1 inside a 1/60 s step of the run.)

The reading:
- The knocks did run on the live site, at the high level and at the low level alike (same gaps to the px). They were not seen for three reasons, all MEASURED above or STATED from the code.
- One. The way in slowed down: 4.2, 4.4, 4.6, 5.0, 5.3, 5.8 degrees a frame over the last six frames, from 7.5 at the hand over.
- Two. The first knock was a soft arch of 6.6 frames with its top at 12 px (3 px at a quarter of real size), and the second 3 px (under 1 px at a quarter). The critics' sheet takes every second frame of 60 (`EVERY = 2` in `tools/lib/pack-site.mjs`, 30 pictures a second, not 60). Where its pictures fall on the frames beside the contact, the flat frame is not among them and the row of gaps reads 15, 4, 12, 10, 0, 3, 1, 0 px: a slab easing down a long tail, which is what the critic wrote. Which frames round 21's sheet took is UNKNOWN; its tiles at 0:10.80 and 0:10.83 show the knock's tilt and no flat frame before them that can be told from the tilt of 0:10.73 and 0:10.77.
- Three. The shiver was a hop of at most 5.8 page units straight toward the camera (`SHIVER.hop` 9, faded), which a camera that looks straight on shows only as a shadow that moves about 10 px, and a slide of at most 2 px in the plane of the page. On step 1 only the five balls of the step row and the resume tray stand loose: the fields and the Continue button are sunk in pockets and do not hop. The shiver began at nothing on the frame of the contact and ran 0.44 s.
- There is no shadow under the slab's free edge: behind the slab is the dark, unlit backing of line 49. What opens and closes at the free edge is that dark gap.
- The step row: MEASURED in the film frames 848 to 855 and the live frames: balls 2 to 5 are near black down to 33 degrees of tilt, half lit at 29 and bright at 25, a switch inside two frames of 60. Cause, STATED from the code: `Engine.sample` turned the studio's room with the camera (`environmentRotation.x = -angle`), so a polished face lying on the slab swept the room at twice the slab's speed and crossed the edge of the room's light in one frame.

## 3. The mend (decisions)

All numbers are mine and live in `src/stage/turn.ts`, named, each with its line. Nothing in `config/` or `content/` changed. The half turn is still 0.5 s, the seat is still at 0.6 of the arriving half (0.3 s, frame 18 of 30), `seatedAt()` is unchanged, and no event moved.

1. In. `TURN.land` 0.8 became 1.2: the slab meets the seat at 1.2 times the speed of the hand over, 9 degrees a frame. The last four frames before the seat cover 5.7, 6.5, 7.4 and 8.4 degrees (before: 4.6, 5.0, 5.3, 5.8). To arrive on the same frame it is slower in the middle of the way in (3.4 degrees a frame at its slowest, about 50 degrees off flat; before 4.2 at about 45): it comes over, then falls.
2. Contact. On the step of the seat the slab is flat, and it lies flat for `TURN.held`, two frames (1/30 s), pressed into the seat. Decision: two frames and not one, because the critics' sheets take every second frame, and with two frames flat every such sheet holds the contact once. At 60 a second it is still one hit.
3. Answer. One knock of 8 degrees over 4 frames (the free edge stands 13, 18, 13 px off the seat in its three frames, by the camera's geometry, 20 degrees of view straight on), then one knock of 2 degrees over 3 frames (4 px), then nothing. The slab is still 9 frames, 0.15 s, after the contact (before: 10.2 frames).
4. The page answers on the frame of the contact.
   - The view: `JOLT`. The camera is knocked 1 percent of its distance toward the slab and 4.9 page units down, so the picture swells from its lower edge: at 1920 wide the foot of the page stays, the middle goes up 5 px, the head 10 px. It falls back as (1 - t)^2 over 5 frames and never goes past where it stood, so it opens no gap at any edge. The camera stays straight on. `view.ts` writes `scene.userData.jolt`, `renderer.ts` (`viewJolt`, `Engine.sample`) moves the camera for the draw and puts it back, as it does for the turn.
   - The loose things: `SHIVER`. Hop 26 (11 to 12 page units at its top, one and two frames after the contact; before 5.8 at its top, 2.3 frames after), slide 8 (4 px), bounces of 4 frames, each under a fifth of the one before, the foot of the page one frame after its head (before 6 frames). What can be seen of it is over with the last knock; the third bounce is 0.4 of a unit.
   - The gap at the free edge is 0 on the frame of the contact and the frame after it.
5. The step row. `ROOM` in `renderer.ts`: the studio's room now goes round the slab by the slab's angle the other way to the camera, so a face that lies flat on the slab mirrors the same piece of the room in every frame of the turn, coming and going. The lights are as they were (`TOWARD`).
6. The tilt past which what starts on the fold is left out (`view.ts`) follows the first knock as before, so it is now 8 degrees. Nothing under the fold can show at 8 degrees on the way in: the lower edge of the slab is past the foot of the picture from 16 degrees on (MEASURED: the gap under the slab is 0 from 3 frames before the seat).

## 4. Known and not mended

- On the real live site a frame whose list, cursor, turn and scroll equal the frame before is drawn as a page at rest (`src/main.ts`, the key of a live picture; not my file, not changed). With the pointer standing still that is the second flat frame of the seat, and it is then gathered with the first: the jolt between the two (10 px to 6 px at the head of the page) is blended for that one frame. Before my change the last 0.24 s of the old shiver fell in that path. The stepped run of the critics' pack and the film do not take that path.
- The cursor's shadow during the turn is `/root/r21_fix_arrow`'s.

## 5. After (MEASURED)

Same commands as section 2. The gap at the slab's free (upper) edge in px at 1920 wide, per frame of 60 from the seat. The slab's angle is from `arriveTurn` at the frame's time (`node /tmp/m/ang.mjs`).

| frame | angle, deg | live high | live low | film |
| --- | --- | --- | --- | --- |
| -4 | -27.95 | 106 | 106 | |
| -3 | -22.29 | 78 | 78 | 60 |
| -2 | -15.83 | 51 | 51 | 34 |
| -1 | -8.44 | 25 | 25 | 10 |
| 0 | 0 | 4 | 4 | 0 |
| 1 | 0 | 0 | 0 | 0 |
| 2 | 0, knock begins | 0 | 0 | 0 |
| 3 | first knock | 8 | 8 | 12 |
| 4 | first knock, top 8 | 17 | 17 | 16 |
| 5 | first knock | 15 | 15 | 8 |
| 6 | second knock | 3 | 3 | 0 |
| 7 | second knock, top 2 | 2 | 2 | 2 |
| 8 | second knock | 3 | 3 | 2 |
| 9 | 0 | 1 | 1 | 0 |
| 10 to 14 | 0 | 0 | 0 | 0 |

- In: the last two frames before the seat cover 7.39 and 8.44 degrees (before 5.33 and 5.76).
- Contact: flat on the frame of the seat in the film; the live pictures stand three quarters of a frame early, so their flat frames are 1 and 2.
- Answer: the free edge stands 17 px (live, high and low) and 16 px (film) off its seat at the top of the first knock, 8 px or more for three frames, then 2 to 3 px for the second knock, then 0. Still from frame 10 after the seat on the live site, 9 in the film: 0.15 to 0.17 s after the contact (before: 0.17 to 0.18 s, top 12 px).
- The live site at the low level is equal to the high level to the px (`node /tmp/m/live.mjs low /tmp/after/live-low 8 14`, `python3 /tmp/m/gap.py /tmp/after/live-low`).
- The step row: in the film frames 848 to 866 (`npm run -s seq -- --first 848 --last 871 --tier draft --force`) and the live frames, balls 2 to 5 are steel in every frame; before they were near black in frames 848 to 853.
- Seen in the pictures at a quarter of real size: the view's jolt on the contact frame and the frame after (the lines of the page stand 5 to 10 px higher and come back), the row and the tray hopped with their shadows longer one and two frames after the contact, the dark gap at the free edge three and four frames after the contact. At a quarter of real size the gap is 4 px at its top.

## 6. Checks (MEASURED, on the changed tree)

- The three draft stills step1-fire, table-wide, boss-fight: `cmp` equal to the ones made before the change.
- `npm run -s determinism`: pass, 12 pictures at hd, tier draft, identical across two fresh loads and two orders.
- `npm run -s bots`: keen reached every one of the 37 gags on every seed; bots: all clear.
- `npm run take -- --check`: the json equal to the one of `origin/main` (every one of the 10 beat events fell inside its beat).
- `npm test`: 148 files, 1819 tests passed (before: 147 files, 1812 tests; the new file is `tests/polish-turn.test.ts`, 7 tests).
- `npx tsc --noEmit -p .`: clean, run last.
- `tests/stage-turn.test.ts` (another owner's) was changed only where it holds numbers this work changed: the landing speed (0.7 to 0.9 of the hand over became 1.1 to 1.3), the start of the knocks (the seat plus `TURN.held`) and the first knock's depth (6 became 8 degrees).
