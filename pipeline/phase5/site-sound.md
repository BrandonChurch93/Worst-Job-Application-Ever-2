# Phase 5, the sound in the site: notes of /root/site_sound

Part `sound-engine`. Branch `agent/site-sound`. A fact here is MEASURED (the command and the number are given), STATED (read somewhere, the place is given) or UNKNOWN.

## Decisions

1. `decision.metrics.0` hangs on `count-run`, not on `metrics-card`. MEASURED (Stage in film mode, the film's own flow): `metrics-card` 144.200 s, `stamp` 146.433 s, `count-run` 147.100 s. On `metrics-card` the line "It will apply again tomorrow" would be spoken 2.2 s before the stamp and "Rejected." would be dropped or come 9.5 s after it. One row of `filmLive` in `src/audio/cues.ts` changes it back. `metrics-card` plays its own cue only.
2. The engine's own clock of the boss fight is gone. It said `boss.slow` after 22 s whatever the boss's health. The page reports `boss-slow` (`src/boss/fight.ts` line 507, there before this job: once, live only, health above half at `live.bossSlowSeconds`), and the engine only listens.
3. The fight music never played: no page emits `boss-loop` and the cut list never held it. Addendum 001 puts the loop "from `boss.unfold` to `boss.collapse`". The event `unfold` now also starts `boss-loop` (`alsoStarts` in `src/audio/cues.ts`), `power-down` stops it, and so do `page-turn`, `skip` and 30 s (`LIVE.loopMaxSeconds`). The film mix lays it the same way. A live fight longer than 30 s loses its music for the rest: the keen bot's fight has 19.3 s of it.
4. The hold music is cut dead at `audio.holdMusicSeconds`, with no fade, in the site as in the mix. The kit asks for it twice ("cut dead on the frame the counter reaches zero", "cut off mid-note"), the brief asks for a fade on every loop. The kit is followed and the step of the cut is measured below.
5. A line that is being spoken when the visitor skips or the page turns is left to end by itself. Cutting a word sounds like a fault, and "a line never interrupts another" is kept. The lines that wait are taken back and the loops stop. One call in `event()` of `src/audio/index.ts` would cut it instead.
6. The idle rule moved from `src/main.ts` into the engine: `quiet(seconds)`. `main.ts` passes the seconds since the last movement or click, the engine holds `live.idleSeconds`. This is what lets a test prove the rule at the engine's level.
7. The volume is 1 on a page that sets none. Before this `main.ts` kept the last volume when a page had no `volume()`; step 2 always ends at 1, so nothing heard changes, but the rule is now in one place.
8. The margin of the levels is `audio.duckDb` (8 dB): section 12 says "Effects duck under a line" and names no other number. The voice is called clear when its loudness is at least 8 dB over the ducked bed.
9. Idle after a hidden tab is left as it was: the seconds since the last movement run on while the tab is hidden, and the engine holds its sound graph meanwhile, so the line is said when the visitor is back.

## The six events (point 2)

| event | where | when | MEASURED in the film (s, frame) |
| --- | --- | --- | --- |
| `carpet-roll` | `src/pages/step3/index.ts` (was there) | the lobby carpet unrolls | 79.479, 4768 |
| `inbox-take` | `src/pages/step3/index.ts` (was there) | the inbox takes the ball | 85.779, 5146 |
| `firehouse-take` | `src/pages/step3/index.ts` (was there) | the firehouse takes the ball | 93.258, 5595 |
| `boss-slow` | `src/boss/fight.ts` (was there) | `live.bossSlowSeconds` into the fight, health above half, live only | not in the film |
| `metrics-card` | `src/pages/step5/index.ts` (new) | the first step the metrics card is at rest | 144.200, 8652 |
| `count-run` | `src/pages/step5/index.ts` (new) | the step its numbers start to count | 147.100, 8826 |

Four were emitted already when this job began; two emits were added, one line each. `count-run` has no cue: it is in `silentEvents`, `npm run sound` names it, the cut list carries it with `"cue": null` and the mix lays nothing for it.

The film's story test of step 5 lists its events by name, so the two emits made it two names longer: `pipeline/phase5/site-sound-NEEDS.patch`, applied on the branch as a `NEEDS:` commit with the Builder's word.

### No picture changes with the two emits

MEASURED: `npm run determinism` passes with the emits in. `npm run still -- --key decision --format hd --tier draft` made on `origin/main` at a5724fb9 and on this branch: `cmp` says the same, sha256 40f6bca74b67e0273cff915bf0e93efe83c9b91f0bc43434a3e2ef235da334a1 both. The three stills `step1-fire`, `table-wide` and `boss-fight` are byte equal to those of `origin/main` as well.

### What the two emits do to the cut list and the review mix

MEASURED in a scratch copy of this branch with the sound files beside it; nothing of it is committed and no paid call was made.

- `npm run cut`: 977 events, 976 with a cue; 20 lines, 20 with a kept take; 35 of 35 beat events inside their beat. `metrics-card` is on frame 8652 with the cue `metrics-card`. `count-run` is on frame 8826 with `"cue": null`: it is the one event without a cue, has no row in `cut/CUES.md`, and no kept take exists for it today.
- `npm run mix`: `audio/mix/review.wav`, 153.000 s, 894 cues and 20 lines laid, -14.02 LUFS, true peak -1.4 dB, 0 cues and 0 lines with no kept sound, 976 of 977 events mapped. Laid new: `metrics-card` at frame 8652 (0.312 s), `carpet-roll` at 4768, `inbox-take` at 5146, `firehouse-take` at 5595, and `boss-loop` from `unfold` at frame 6942 for 20.52 s. `count-run` lays nothing. The mix counts the unmapped event and does not print its name (`tools/mix.mjs` is not a file of this part); `npm run sound` prints it: "with no sound of its own, on purpose: count-run".
- The `cut/CUTLIST.json` on main is older than the stage (689 events) and the `audio/mix/review.json` on main is of a mix with no cue laid (657 events, 0 cues). Both change whole when the two commands run, not only by the two events: `dart-fire` and `dart-hit` go from 44 to 171 each, `step` from 396 to 415.

## The narrator on the live site (point 3)

Each rule has a test of its own in `tests/audio-rules.test.ts`, on the real engine with a sound clock the test moves by hand. The whole site is in `tests/audio-visit.test.ts` and in `npm run sound -- --visit keen` and `--visit skipper`, which play the live site through the stage with the bot, feed the engine exactly as `src/main.ts` does, and print the engine's own log. The tables of both visits are in `pipeline/phase5/site-sound-visits.md`.

What the two visits show, MEASURED, seed 20261124:

- keen: finished in 124.05 s, no skip. 11 of the 20 lines of the film heard, 3 booked and taken back at the turn of their page, 6 dropped. No line that only the live site has was heard: `hit` was asked for about 30 times and always fell inside the gap.
- skipper: finished in 117.43 s, 5 skips. Heard: `marketing.stroll`, three idle lines, one skip line, `pinball.seal`, `decision.letter`, `decision.metrics`. Each line of the film started on the page of its own gag after its own event; the skip line was dropped 4 times of 5.
- Why so few: two lines must be `audio.liveNarratorMinGapSeconds` (6 s) apart and a line of the film may wait 10 s for its turn (`LIVE.waitSeconds`), a hit 0.4 s. With lines of 3 to 8 s the narrator can say one line in about 11 s. Both numbers are the config's and the levels', not changed here.

## The loops (point 4)

`npm run sound -- --loops`, MEASURED on the files of `public/audio/`:

| loop | seconds | step at the seam | largest step inside | seam against largest |
| --- | --- | --- | --- | --- |
| `boss-loop` | 6.857 | 0.002563 | 0.013855 | -14.66 dB |
| `room-tone` | 19 | 0.000122 | 0.004669 | -31.65 dB |
| `shredder` | 3.2 | 0.019714 | 0.146759 | -17.44 dB |

Each seam is smaller than the largest step the loop takes inside itself. The hold music is no loop (4 s long, played once): its dead cut at 2 s is a step of 0.041382 against a largest step of 0.009369 inside, 12.9 dB over it. That step is the cut the kit asks for.

| sound | started by | comes in | stopped by | goes out | ducked |
| --- | --- | --- | --- | --- | --- |
| `room-tone` | the first event, beat or `start()` after the sounds have loaded | 0.4 s | `stop()` (film paused, sought, left; step or mode changed) | 0.03 s | no, it is on its own bus |
| `shredder` | event `shredder` | 0.03 s | `shredder-stop`, `page-turn`, `skip`, 30 s, `stop()` | 0.03 s | yes, 8 dB under a line |
| `boss-loop` | event `unfold` | 0.03 s | `power-down`, `page-turn`, `skip`, 30 s, `stop()` | 0.03 s | yes, 8 dB under a line |
| `hold-music` | event `hold-music` | the 3 ms of its own file | 2 s, or `hold-music-stop`, `letter-drop` | cut dead at 2 s; 0.03 s at a stop event | yes, 8 dB under a line |

The duck goes down over 0.08 s before a line and comes back over 0.3 s after it (`DUCK` in `src/audio/levels.ts`).

## The crank (point 5)

`src/pages/step2/index.ts` line 857: the page's volume is `max(0.1, level)` from the moment the Audio volume row opens until that row is done, and 1 otherwise; `level` is a tenth for each whole turn.

MEASURED, `tests/audio-visit.test.ts` "turns the crank from nothing to 100 percent" and `npm run sound -- --visit keen`: the engine's output gain is 1 from the first click until 42.57 s, then 0.1 when the row opens, 0.2, 0.3 as the visitor turns, 0.4 to 0.9 as the crank runs away, 1 at 45.32 s, and 1 on every page after step 2. The skipper never turns it: 1 all through.

## The edges (point 6)

Tests in `tests/audio-rules.test.ts`: the mute over a line and a loop, the fallback forced by an audio graph that throws and by a browser without one, the film and back, a skip in the middle of a line, a tab hidden and shown. A1, A2 and A11 are measured in a browser by `npm run sound -- --check`.

A2. MEASURED on a quiet VM of 4 cores, `npm run sound -- --browser --site`: the control changed its state 2.17 s, 2.68 s and 3.01 s after the press, each time after exactly one drawn frame. With 8 busy loops beside it the page drew one frame in over 20 s and the control was not shown in that time. So it is the control and not the check's timing: `src/ui/interface.ts` writes the state and the icon only in the draw tick, and the engine mutes at the press. The file is `/root/site_controls`' and the fix is theirs (the state written at the press). The check now waits for the sounds to load before it reads "as found", and records how late each answer came and how many frames were drawn.

## What is not done, and what is not known

- A6 and A9 wait for the mix; A10 is left as ruled.
- `cut/CUTLIST.json` on main is older than the stage: 689 events against the 977 `npm run cut` gives now.
- What a phone does with the sound is UNKNOWN: everything here is measured in Chromium on a desk.
