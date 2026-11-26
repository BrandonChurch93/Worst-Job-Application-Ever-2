# ball-fix: the clear ball and the displays

Owner `/root/ball_fixer`, branch `agent/ball-fix`. Parts `clear-ball`, `displays`. Earlier notes read: `ball-displays.md`, `ball.md`, `displays.md`.

## What the approved images hold in my part that a quick look misses

1. `clear-ball`, `rail-cam`: the glass is read from its rim alone. The middle of the ball is almost as clear as air, the arrow sits behind nothing, and all the bending, the darkening and the warm pinpoints of the lamps are packed into the outer fifth of the disc.
2. `clear-ball`: the seam is a light hairline ring with one small vent boss on it, never a dark line, and it crosses the ball off centre so it does not cut the arrow.
3. `lobby-doors`: the shadow on the carpet is broad and dense, it falls toward the camera, and the gathered light is a small bright spot at the foot of the ball inside the shadow, not a ring around it.
4. `reply-all`, `youre-fired`, `last-save`: the window highlight is one curved pane high on one shoulder, a tenth of the disc, and it never lies over the arrow's face. The arrow keeps its dark edge and its gloss through the glass.
5. `table-wide`, `tier-office`: at 90 to 130 px the ball is found by its bright double edge and its shadow, not by its body. The display in `table-wide` carries six amber digits with a soft glow on a dark glass, and the settled list of that key says the digits are an example.

## Baseline before my first change

MEASURED on `origin/main` 997de9fb at 06:58 UTC: `npm test` 102 files, 1390 of 1390. `npm run build` built. `npm run bots` all clear.

MEASURED with `npm run build && npm run counts -- --key <key> --live low` on the tree without my changes (git stash), 07:20 UTC:

| key | part | meshes | colour | shadow | calls | triangles |
| --- | --- | --- | --- | --- | --- | --- |
| table-wide | clear-ball | 2 | 2 | 0 | 2 | 18872 |
| table-wide | displays | 8 | 8 | 0 | 8 | 328 |
| tier-office | clear-ball | 3 | 3 | 0 | 3 | 18874 |
| tier-office | displays | 4 | 4 | 0 | 4 | 164 |

`table-wide` whole frame: 201 draw calls, 500110 triangles. `tier-office` whole frame: 126 draw calls, 331205 triangles. The command exits 1 over 5 calls it cannot place: known.

After my changes, same commands, 07:21 UTC: the four rows are the same, number for number. The frame totals are the same.

## Point 1: the crumpled arrow (07:05 UTC, sent to `/root` and `/root/machine_runner`)

MEASURED with `node assets-src/table/ball/diag.mjs --keys reply-all,youre-fired --variants asis,noshell,nobend --tier review`: the key drawn as it is, with the shells not drawn, and with the bending off.

- `reply-all`, `tier-office`: the crumple is in the arrow with the shells not drawn at all. `node assets-src/table/ball/state.mjs` prints the cursor at that key: acting `shocked`, reaction `recoil`, damage `["flattened"]`. It is the arrow's own state, not the glass.
- `youre-fired`: the arrow is whole with the shells off. The faults are the glass: a veil over the middle, a broad pink rim, a dark seam line, a large white window highlight.

Ruling of `/root`, 07:13 UTC: `flattened` is raised by the HQ doors alone, `/root/machine_runner` takes it out of every other hit. The four glass faults are mine, in that order.

## Point 2: the glass

What changed in `src/table/real/ball/glsl.ts`:

- The front shell no longer draws the bent picture over the middle. It carries the rim band only (rho over 0.56), the reflections, the pinpoints, the edge. The veil is gone because nothing is drawn over the arrow but the highlight and a faint reflection.
- The back shell carries the picture behind the ball, bent through a hollow shell (outer radius 1, inner 0.875, index 1.49, total reflection in the rim band). Straight lines of the track bend in the rim and are not carried straight through.
- The window highlight is one curved pane on the upper left shoulder (centre at rho 0.8, width 0.34), with a faint echo on the far wall. It lies clear of the arrow.
- The seam is a light glint only. The dark line is gone.
- The coloured rim: the rim band picture is desaturated to 0.6 and the edge is thinner.
- The lamps show as small warm points in the rim band only.
- The back shell writes depth behind the cursor's reach, so the lens blur of the post pass treats the ball as one thing.

## Point 3: the shadow

The decal: a shorter, denser contact shadow that fades to its tip, the bright spot nearer the foot (0.34 + 0.5k radii from the centre), weaker rays and arc. Key shadow slant 1.15 to 0.55, lamp shadow slant cap 2.4 to 1.4, so it stays under the ball and reads as contact.

At 07:20 UTC the shadow did not show on the lit insert domes (`tier-office`). See the second step below.

## Point 4: the sheet `clear-ball`

Mine: the third ball is pressed flat where it strikes. `pressAt` in `src/table/real/ball/index.ts` reads the bumper the ball stands in or has just struck (`bumper.<id>`, `v[0]` seconds since the hit) and a steel ball it overlaps. First at most 0.14 of the radius; the Builder at 08:03 UTC: approved's third ball is about a fifth flatter on the bumper's side and 0.1 will not be seen, so it is now up to 0.3 (see the film issues below). Test: `tests/table-ball-press.test.ts`.

The page's: the list sent to `/root/machine_runner` is under Decisions.

## Point 5: the displays

The zeros in `table-wide` are the moment, not a fault. STATED in `config/showcase.json`: the key `table-wide` is beat `pinball.reveal` at 1, before any score, and its settled list says "The digits on the display are an example." STATED by the last owner (`displays.md`): the score shows from 5.2 s to 10.9 s and from 41.35 s, and at 5.2 s it is 000000.

## Second step on the glass and the shadow (07:27 to 07:45 UTC)

- The rim band grows darker and denser toward the edge (picture times 1.1 at the inner wall down to 0.5 at the edge, alpha 0.72 up to 0.9), the dark outline is wider (from rho 0.97), the far wall carries a faint neutral tint (alpha 0.1) so the body reads on a bright floor without a veil on the arrow, and the brim keeps a floor of light so the ball is found in the dark street.
- `lobby-doors`: MEASURED with a probe in `pose` (taken out again): the key shadow was drawn at density 0.86 but only 1.1 radii long, and the key's camera stands about 3 degrees over the carpet, so it came out a few px tall. Near the HQ doors the key shadow now turns to fall away from the doors and grows to 4.5 radii (slant 0.55 to 2.4 over the last 6 balls before the door). The spot stays at the foot (its distance no longer grows past slant 1.1). The camera is `/root/machine_runner`'s: asked for 12 degrees or more.
- The contact dark is softer (key at most 0.78, the foot term 0.62) because through the ball on a lit insert it read as a black hole (`tier-office`).
- `tier-office`: the shadow now shows on the lit insert dome in my draft still. Not asked of `/root/lamp_fixer` after all.

- 07:49 UTC: the rim band darker at the edge (0.4), one thin bright arc at rho 0.925 on the side away from the soft light, the far wall carries the lamps as warm points (0.1 + 0.5 F). Looked at in `rail-cam`, `tier-street`, `youre-fired` at `draft`.

- 07:57 UTC, the press seen in profile: `node assets-src/table/ball/diag.mjs --keys last-save --variants press,pressmost --tier draft` forces a press of 0.1 and of 0.14 radius toward page right. The ball shows one flat side there with the glass rim running along it. In the sheet as the page frames it today the cup stands behind the third ball, so the flat side faces away from the camera and is not seen: told `/root/machine_runner`.
- 08:00 UTC: the lamp points on the far wall are smaller and sit toward the rim (they were two broad warm blobs in `last-save`).

After these changes, MEASURED 07:46 UTC with `npm run counts -- --key table-wide --live low` and `--key tier-office`: `clear-ball` 2 calls 18872 triangles and 3 calls 18874 triangles, `displays` 8 calls 328 triangles and 4 calls 164 triangles. The same as before, number for number.

Asset sets: MEASURED with `ls public/assets/table`: `art`, `frame`. There is no set for the ball or for the displays, 0 MB each. `assets-src/table/ball` holds two scripts, 6078 bytes.

## The film issues of round 11 (from 08:03 UTC)

Mine by the Builder's list: R4-3 issue 1 (the capture reads as a swap), R4-2 issue 2 (the ball vanishes on the way out), R4-3 issue 4 (the arrow outside the shell over the Coffee recess), R9-1 issue 6 and R9-2 issue 1 (no squash on any impact), R9-2 issue 2 (the shell closing).

- The shell opens and closes on `v[0]` of the ball's shape (`PARTING` in `index.ts`): the halves have swung apart by 0.7 of the way, they sink by 1.9 radii from 0.45 on, and they fade out between 0.7 and 1. MEASURED 08:12 UTC with `node assets-src/table/ball/diag.mjs --keys loader-page --variants asis,open25,open50,open75,open90 --tier draft --noref`: shut, two halves apart at 25 and 50 percent, nothing left at 75 and 90. `/root/machine_runner` sets `v[0]` over 0.27 s at the capture and over 0.2 s on the way out (its c56cd02a). Not yet seen in the film: its branch is not on main.
- The squash (`PRESS`): up to 0.3, which is 0.85 thin along the hit with a flat face and 1.1 wide across. Two sources, both a function of the frame alone:
  - the ball stands inside a bumper or a steel ball: 3 times the overlap (`pressAt`);
  - the page tells of a hit on the shape: `v[3]` strength 0 to 1, `v[4]` the angle on the page from the ball's middle to the thing struck (0 page right, a quarter turn page down), `v[5]` seconds since. Squash = 0.3 x strength x exp(-since / 0.05) (`hitOf`). With nothing given the ball is round.
- Ruling of `/root`, 08:23 UTC: no memory in `pose`. I had first let the ball know a hit by the turn of its own speed over three frames; that is taken out (4afe77c0), since a film rendered in pieces would draw the first frames of a piece differently. The slots went to `/root/machine_runner` at 08:25 UTC.
- MEASURED 08:23 UTC with the memory version, `node assets-src/table/ball/hit.mjs --frame 5010 --count 6 --step 2 --size 220` (the bumper hit of `pinball.coffee`, every second frame, the ball at its real size): the ball is seen out of round in the three frames after the contact. The drawing is the same now, only the numbers come from the page. Not rendered with the new source: no page gives it yet.
- R4-3 issue 4: STATED by `/root/machine_runner`: the arrow is placed at the ball's own middle each step, z included, and its reach is tested on every step. To be looked at when its branch is on main.
- The bore: inner wall 42 px. At a full squash it is 35.7 px along the hit axis for one frame and 46 px across.

## Tuning looks, by part

Critic round 1 (to 08:15 UTC):
- `clear-ball`: 45, which is 5 over the 40. 10 `review` (6 diagnosis, 4 report), 27 `draft` key stills, 3 `draft` sheets, and the 5 `draft` stills of the shell opening at 08:12 UTC, taken for the film issues after the count stood at 40. Reported to `/root`.
- `displays`: 1 of 40 (`table-wide` at `draft`, the main display beside approved: six amber numerals in a lit window, in place; nothing changed).

Critic round 2 (from 08:15 UTC):
- `clear-ball`: 2 so far. One sheet of 12 film frames round the bumper hit (`npm run sheet -- --motion bumper --tier draft --every-frame`), one row of 8 film frames at the ball's real size (`hit.mjs`).
- `displays`: 0.

Time of one still on this VM, MEASURED by `assets-src/table/ball/diag.mjs` (it prints the seconds of each render): `draft` 17.7 to 47.6 s, `review` 56.3 to 84.0 s. One film frame at `draft` after the first: 16.6 to 17.4 s (`hit.mjs`).

## Decisions

- The crumple is decided by state, not by glass (above).
- The press is read from what is already in the list, so nothing outside my folders changes.
- The test limit for the arrow inside the ball is 40 px from the centre (inner wall 42 px). Agreed with `/root/machine_runner` 07:12 UTC. The glass does not magnify the arrow: it is the real mesh and the shell is drawn over it.
- The debug hook (`wjb-ball` window event, `shell` and `bend`) stays for the diagnosis tool. It is read only when the event is sent.

## Sent to `/root/machine_runner` for the sheet

- Three equal panels with dark gutters between them, one ball state in each, in the order of the approved sheet: at rest by the bat, in flight, struck against the bumper.
- The third ball: no `flattened` damage, the arrow thrown flat against the inside wall away from the bumper.
- The ball in the third panel stands at `cup.r + 0.45` balls from the cup's centre. That overlaps the cup by 0.05 ball and my shell is fully pressed there (0.3). At `cup.r + 0.40` the flat face just touches the cup. The cup to the screen side of the ball, so the flat face is seen in profile.
