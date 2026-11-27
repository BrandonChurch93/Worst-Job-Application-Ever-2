# Polish, the arrow under a visitor's pointer (round 21 fix, branch `agent/polish-arrow`)

Owner of this note: the fix agent for the arrow. Every fact is MEASURED (command and number given), STATED (read somewhere) or UNKNOWN.

## What was measured first, with no browser

Command: `ARROW_OUT=/tmp/arrow-before npx vitest run tests/polish-arrow-measure.test.ts` on `origin/main` 02eeb686. It drives the live stage with the motion pack's own visitor (`tools/lib/pack-site.mjs`) and prints one row for each frame of 60. The three tables as measured before the mend are kept beside this note as `polish-arrow-before-visitor.txt`, `polish-arrow-before-careers.txt` and `polish-arrow-before-step1.txt`.

MEASURED before, pack visitor, 16 s: the drawn angle stood up to 91.5 degrees off the standard angle (frame 64, 0:01.083), it changed by up to 26.5 degrees in one frame (frame 670, 0:11.183), and 16 frames changed by more than 12 degrees.

One rule was behind all of it: `DIVE` in `src/cursor/body.ts`. The arrow turns tip first into its path whenever it is 18 px or more above its floor and faster than 400 px a second. The film uses that for a thrown arrow. Under a visitor four things lifted the arrow that high with no throw by the page:

1. the hop of the confident walk (30 px),
2. the hop of the startle on a perk card (19 px),
3. the turning perk card, whose highest edge the arrow rides up to z 161 and then falls from,
4. the let-go after a page turn at z 260 (`HANDOFF.z`), a fall of 0.46 s while the pointer already strokes.

The shadow standing off is the same height: at z 260 the shadow lies far from the arrow, at z 161 likewise.

## What was changed

`src/cursor/body.ts`, all behind `this.hand` (true only on the live stage), so the film's path runs the old lines:

- `LED`: the drawn angle under a visitor's pointer. While the page has not hit or thrown the arrow, the angle the body asks for is bounded softly at `LED.most` (35 degrees off the standard angle, soft from `LED.knee`), and the drawn angle goes to it by at most `LED.rate` radians a second (12.5, which is 11.9 degrees in a frame of 60). The acting stays: the mood's lean at rest is inside the bound and is drawn as before (Builder, 23:03Z, citing `kit/03-METHOD.md` line 123).
- The dive is the page's: `flying` needs a knock by the page (`thrown`, set in `knock()` and held for `LED.longest` seconds at most or until it is down).
- `HOVER` and `rides`: the page turn under a visitor. The arrow lies on its page through both halves of the turn at the height it stands at (`hover + ground`), and its pose says `rides`. It no longer hangs at `HANDOFF.z` and falls after the let-go. Off a raised thing with no throw it comes down at `HOVER.fall` instead of floating.
- The numbers `LED` and `HOVER` are named in the file with one line each. No number of the kit changed: `config.scale.heights.cursorHover` is read, not set.

`src/cursor/view.ts`:

- What holds the cursor in the scene (the stand of `src/shell/view.ts`) stays still in the room while a page turns: the slab is drawn lying still and the camera, the light and the stand go round it. A cursor whose pose says `rides` undoes the stand's turn (its root takes the inverse of the stand's matrix), so it lies in the slab's plane and goes over with the page. Without `rides` the root's matrix is the identity, as it was: the film's arrow is drawn as before.

`src/pages/marketing/index.ts`:

- `SETTLE`: under a visitor a perk card comes over on a smooth curve, goes 4.5 percent of the half turn (8 degrees) past flat and settles back. In the film (`s.mode !== 'live'`) the old curve runs unchanged.
- The rejected landing's own descent runs in the film only: under a visitor the body brings the arrow down with the page turn (above), and the page's descent assumed the film's pull toward `HANDOFF.z`.

## Why the perk card snapped

MEASURED from the old curve (`TURN_SHARP` 5 tanh over `FLIP_SECONDS` 0.63): the last frames of 60 go 37, 30, 24, 19, 14, 11, 8 degrees a frame toward flat with no settle. The pack shows every second frame (30 a second), so between two tiles the card went from about 30 degrees up to flat, and nothing followed it: no pass, no settle, and the shadow cue of a tilted slab falls with the angle. It was not one frame in the stage, it was a fast end with nothing after it. UNKNOWN whether the critic's eye also caught the pit closing in the same frame.

MEASURED after (`npx vitest run tests/polish-arrow.test.ts`, the card test): at most 12 degrees a frame, 3 to 6 frames from 30 degrees up to flat, 8 degrees past, then at least 6 frames back to flat.

## Decisions

- The limit sits on the drawn angle, in `pose()`, not on the springs: the springs, the squash, the arms and the hand-back are untouched, so the mend for the tug in the same file does not fight it.
- Optional state fields (`thrown`, `drawn`, `hung`, `arriving`) are added at the end of the state and not to `fresh()`, to keep the lines the tug's owner edits unchanged.
- A hit (`struck`), a recoil, the ball, an aim and a takeover by the page are excepted from the limit, as the brief says.
- The arrow still rides the highest edge of a turning perk card (the page's `turningTop`). A height for the very point under the tip was weighed and left: it can jump by tens of px in one step where the card's edge passes.

## Pictures, and what is still open

Shot with `out/work/shoot.mjs` (the pack's visitor in the browser, hd, real size) and the motion pack of round 22 on commit 1be367dc.

- MEASURED in pictures, high level: at rest (0:03.45), walking over a perk card (0:00.98, 0:01.05), and right after the turn (0:11.08 to 0:11.35) the shadow's dark touches the arrow's lower right edge. Medium and low level: the same at rest, walking and 0:11.08.
- MEASURED in pictures, the page turn with `rides`, every second frame of 60 from 0:10.32 to 0:10.88 at high, and 0:10.55 and 0:10.68 at medium and low: the arrow lies on the slab and goes over with it, foreshortened as the slab is, dark on the leaving page as the page is, and its shadow touches its lower right edge in every one of them. z reads 4 through the whole turn.
- The arriving half, first tried two ways. The arrow level at `hover`: MEASURED in the picture, it was drawn as a dot until 0:10.70. The cause, read in `src/shell/view.ts`: the cursor hangs from the stand, which turns against the slab about the line across the middle of the view, so the body of a level arrow below its tip lies under the face of a slab that comes over from behind. The arrow level and high enough to clear the slab (`reach * tan(turn)`, up to 260): its shadow lay 50 to 80 px off for about ten frames. Both are gone with `rides`.
- OPEN: on a turning perk card the arrow rides the card's highest edge (z 169, 167, 161 at 0:00.650 to 0:00.683). MEASURED in real size crops at high: the arrow stands level over the card's raised edge and no dark touches its lower right edge in those three frames. Where its shadow falls was not looked for. Not mended.
- With `origin/agent/polish-turn` (98404c17) merged in a scratch tree, never pushed, before `rides`: MEASURED, the let-go landed at z 5 on the seat frame (0:10.95), 0 frames over 12 degrees, furthest 34.6 degrees. With `rides` the body no longer reads the slab's turn at all (z stays at `hover + ground`), so no number of the body follows the turn's timing. Not run again on that merge after `rides`: UNKNOWN by measure, STATED from the code.
