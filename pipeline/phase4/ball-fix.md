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

Open: on the lit insert domes the shadow does not show (`tier-office`). I think it is the draw order of the art windows over my decal. Told `/root/lamp_fixer`.

## Point 4: the sheet `clear-ball`

Mine: the third ball is pressed flat where it strikes. `pressAt` in `src/table/real/ball/index.ts` reads the bumper the ball stands in or has just struck (`bumper.<id>`, `v[0]` seconds since the hit) and a steel ball it overlaps, and flattens the shell on that side by at most 0.14 of the radius. No new field in a shape. Test: `tests/table-ball-press.test.ts`.

The page's: the list sent to `/root/machine_runner` is under Decisions.

## Point 5: the displays

The zeros in `table-wide` are the moment, not a fault. STATED in `config/showcase.json`: the key `table-wide` is beat `pinball.reveal` at 1, before any score, and its settled list says "The digits on the display are an example." STATED by the last owner (`displays.md`): the score shows from 5.2 s to 10.9 s and from 41.35 s, and at 5.2 s it is 000000.

## Tuning looks, by part, critic round 1

- `clear-ball`: 16 of 40 (6 `review` diagnosis stills, 8 `draft` stills, 1 `draft` sheet, 1 sheet compare).
- `displays`: 0 of 40.

Time of one still on this VM, MEASURED from the wall clock of `npm run still`: `draft` 17 to 43 s, `review` 59 to 82 s.

## Decisions

- The crumple is decided by state, not by glass (above).
- The press is read from what is already in the list, so nothing outside my folders changes.
- The test limit for the arrow inside the ball is 40 px from the centre (inner wall 42 px). Agreed with `/root/machine_runner` 07:12 UTC. The glass does not magnify the arrow: it is the real mesh and the shell is drawn over it.
- The debug hook (`wjb-ball` window event, `shell` and `bend`) stays for the diagnosis tool. It is read only when the event is sent.

## Sent to `/root/machine_runner` for the sheet

- Three equal panels with dark gutters between them, one ball state in each, in the order of the approved sheet: at rest by the bat, in flight, struck against the bumper.
- The third ball: no `flattened` damage, the arrow thrown flat against the inside wall away from the bumper.
- The ball in the third panel stands at `cup.r + 0.45` balls from the cup's centre. That overlaps the cup by 0.05 ball and my shell presses by 0.1 of its radius there. Nearer presses more, up to 0.14.
