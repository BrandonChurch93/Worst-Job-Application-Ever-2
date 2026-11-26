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
10. One fixed headroom after everything, `LIVE.headroomDb` 1.5 dB (2.5 until 18:14Z, on the 64 kbit pack) in `src/audio/levels.ts`, by the Builder's ruling of 17:00Z: no compressor and no limiter. It is the smallest half dB that holds the live output at or under `audio.truePeakDb` (-1 dB) in every render of `npm run sound -- --levels`. The plain audio elements of the fallback have no sum of their own to hold, so the headroom is in the sound graph only.
11. The 30 s after which a loop that nothing stops ends by itself is `LIVE.loopMaxSeconds` in `src/audio/levels.ts`. It is the sound part's own number, there since the engine was first built (main at aafc241c), not the config's. What it guards: a loop whose stop never comes. `sizzle` and `shredder` are stopped by an event of their page, `hold-music` by the engine's own clock and `boss-loop` by `power-down`; if a page is left, a fight is abandoned or an event is lost before that stop, the loop would otherwise sound until the tab is closed. The page turn and the skip stop loops as well, so the 30 s is the last guard, for a visitor who stays on the page.
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

### The lines only the live site has, over the four bots

`npm run sound -- --visit all`, MEASURED, seed 20261124: keen 124.05 s, clumsy 148.7 s, random 112.38 s with 4 skips, skipper 117.43 s with 5 skips. Lines of the film heard: keen 11, clumsy 12, random 6, skipper 4.

| line | asked for | heard | by |
| --- | --- | --- | --- |
| `live.idle` | 5 | 3 | skipper 3 |
| `live.skip` | 9 | 5 | random 4, skipper 1 |
| `live.tugLost` | 2 | 1 | clumsy 1 |
| `live.hit` | 84 | 0 | |
| `live.pinball.flipper` | 3 | 0 | |
| `live.boss.verify` | 3 | 0 | |
| `live.slowTyping` | 1 | 0 | |
| `live.realKeyboard` | 0 | 0 | no bot presses a real key |
| `live.boss.slow` | 0 | 0 | no bot's fight reaches `live.bossSlowSeconds` with the boss above half |
| `live.watchFilm` | 0 | 0 | no bot picks the film |

Every drop has the same reason in the log: the line could not start within its wait, because another line was being spoken or had ended less than `audio.liveNarratorMinGapSeconds` before.

- `live.boss.verify` cannot be heard on a first pass through step 4 under any numbers: its trigger, `checkbox`, is also the trigger of the film's line `boss.verify.0`, which is asked first at the same instant. Whenever the narrator is free the film's line takes the place, and when it is not, both are dropped. It can be heard only on a second pass in the same load, when the film's line is spent.
- `live.hit` may wait 0.4 s. It needs a hit at a moment when no line is spoken, none is booked and the last ended over 6 s ago. On step 1 and step 4, where the hits are, the lines of the film with their gaps fill nearly the whole page: 0 of 84 in four visits. It can happen, and a bot never got it.
- `live.pinball.flipper` hangs on the first flipper press, which comes right after the plunger, where `pinball.launch.0` is spoken: it needs a visitor who waits about 5 s after the launch before the first press. `live.slowTyping` needs the same kind of gap on step 1.
- `live.realKeyboard`, `live.boss.slow` and `live.watchFilm` are set off by nothing a bot does. That they are spoken when their trigger comes and the narrator is free is MEASURED at the engine's level (`tests/audio-rules.test.ts`, "speaks a line only the live site has when its trigger happens"); how often a real visitor hears them is UNKNOWN.

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

## The levels (point 4)

`npm run sound -- --levels`, MEASURED in Chromium 159.0.8154.6. The keen bot's visit (827 events, 124.05 s, seed 20261124) is sent event by event, at its own times, to the site's own engine on an offline sound graph of the browser, with the voice, the bed (effects after the duck, and the room tone) and the output on tracks of their own. Loudness is the project's own measure (`loudness` of `src/audio/dsp.ts`), over the span of the line. Voice and bed are read before the master gain, so the crank and the headroom do not move the margin.

The line of each moment is set off by its own trigger, at the occurrence where the bed under it is loudest, in a render of its own. The slot machine has no line: there the line of `step2.dial` is placed on the event `coins` by the tool.

| moment | line, trigger, time in the visit | voice LUFS | bed LUFS | margin dB | bed with no line LUFS | margin at the bed's loudest 0.4 s dB |
| --- | --- | --- | --- | --- | --- | --- |
| step 1 under fire | `step1.email.0`, `slab-drop`, 18.23 s, loudest of 3 | -14.95 | -30.03 | 15.08 | -22.06 | 11.76 |
| step 1, the tug at the shredder | `step1.tug.0`, `arms-out`, 20.23 s | -14.55 | -29.40 | 14.85 | -21.52 | 12.86 |
| the slot machine paying out | `step2.dial.0`, placed on `coins`, 41.07 s | -15.11 | -32.44 | 17.33 | -24.65 | 10.84 |
| the bumpers | `pinball.coffee.0`, `bumper`, 63.42 s, loudest of 5 | -15.00 | -29.62 | 14.62 | -22.21 | 7.98 |
| the boss's hit | `boss.slabs.0`, `slab-fire`, 95.58 s, loudest of 5 | -14.77 | -29.62 | 14.85 | -21.85 | 8.84 |

Wanted: 8 dB (`audio.duckDb`). Every margin over the line holds, by 6.6 dB or more. Against the loudest 0.4 s of the bed the bumpers are at 7.98 dB, 0.02 dB under 8: that is the voice's loudness over its whole line against one moment of the bed, a harder reading than section 12 gives. The page's busiest 3 s lie under the line in four of the five rows; on step 1 they are at 27.6 s, under the tug line and not under the email line, which is why the tug has a row.

The visit as it is heard (every event live, the narrator saying what its rules let through), the 11 lines heard: margins 14.12 dB (`pinball.launch.0`) to 25.83 dB (`pinball.coffee.0`); against the bed's loudest 0.4 s the smallest is 7.86 dB (`decision.letter.0`, the stamp). All eleven are in `out/work/audio/levels.json`.

### The peak, and the headroom

FINDING, MEASURED before the headroom: the live output went over full scale when a line was spoken: true peak up to +1.05 dB (the bumpers), +0.92 dB in the keen visit as heard, +0.66 dB in the skipper's. With no line: -2.39 dB (keen) and -2.92 dB (skipper).

The cause is the packed line file, not a gain and not two voices:

- No gain over 1 is on a line: the source gain is 1, the voice bus is 1, and the narrator never books two lines over each other (test "never lets a line interrupt another").
- The chain sets a line to -18 LUFS and holds no peak for the voice. For 9 kept lines that gain put peaks over full scale: the records beside the kept sounds say peak +4.11 dB (`line.step2.crank.0`), +3.76 (`line.pinball.replyAll.0`), +3.72 (`line.marketing.stroll.0`), +2.31 (`line.pinball.fired.0`), +1.73 (`line.live.slowTyping.0`), +1.59 (`line.live.hit.2`), +0.71 (`line.live.realKeyboard.0`), +0.52 (`line.step1.email.0`), +0.09 (`line.pinball.launch.0`). STATED from `audio/kept/*.json`.
- The 24 bit WAV cannot hold that: MEASURED with ffmpeg, the kept WAV of those lines has its largest sample at exactly 0 dB, with 1 to 100 samples at full scale, the longest run 17 samples (0.35 ms, `line.step2.crank.0`).
- The packed MP3 holds more: MEASURED with ffmpeg's decoder, largest sample +3.80 dB in `line.pinball.fired.0.mp3` and +3.95 dB in `line.pinball.replyAll.0.mp3`; 22 of the 34 packed lines read over 0 dB true peak that way.
- In Chromium the decoded line has its largest sample at exactly 0 dB and a true peak up to +0.84 dB (MEASURED in the render, voice track alone): its decoder stops at full scale. What Firefox and Safari do with those files is UNKNOWN.

So the sound that is wrong is the level of 9 kept lines, clipped for under half a millisecond each, and it is in the film mix as well, which reads the same kept files. The Builder's ruling of 17:16Z: keep them again from their takes with the peak held in the chain. The takes are on his machine only, so the tool is written here and run there: see "The peak held in the chain" below. No line was made or kept again in this VM.

The headroom: `LIVE.headroomDb` 2.5 dB, one gain between the master and the output. MEASURED after it, the true peak of the output in each of the nine renders: keen with no line -4.89 dB; step 1 under fire -2.13; the tug -1.99; the slot -3.21; the bumpers -1.45; the boss's hit -2.32; keen as heard -1.58; skipper with no line -5.42; skipper as heard -1.84. The bound is `audio.truePeakDb`, -1 dB: held, the largest is -1.45 dB. The margins of the table are the same to the hundredth before and after, and so is each page against the others: it is one gain after everything.

What it cost: the keen visit as heard is -19.65 LUFS at the output (it was -17.15), with no line -26.62 (was -24.12); the skipper's as heard -18.83 (was -16.33).

The check for step 3's sound checks is the last line of `npm run sound -- --levels`: "levels: peak pass" or "levels: peak FAIL", with the largest true peak and the render it is in. The command ends with exit code 1 when the peak is over the bound or a margin is under `audio.duckDb`. The bound is proven for these nine renders only: a line that no bot hears at a loud moment is not in them.

### The peak held in the chain (ruling of 17:16Z)

In `tools/sound.mjs` the chain of a line now ends with a look-ahead limiter, in `tools/lib/sound-peaks.mjs`: after the gain to the line's level, when the true peak is over `audio.truePeakDb` (-1 dB), the line goes through ffmpeg's `alimiter` (`level_in=1:level_out=1`, so no make-up gain; `level=0`, its own level control off; `asc=0`) and is measured again. No effect cue goes through it: the call is inside `if (t.kind === 'line')`. A line at or under the bound never reaches ffmpeg's limiter and comes back as the same object, so its bytes are the ones the chain made before.

- The true peak is the larger of two measures: the chain's own (`dsp.truePeakDb`) and ffmpeg's (`loudnorm`, `input_tp`, two places). Both must be at or under the bound after the limit.
- `alimiter` limits the samples, not the curve between them, so a limit at -1 dB leaves a true peak a little over it (MEASURED: -0.69 dB on one line). The tool lowers the limiter's own ceiling round by round (by what is still over plus 0.02 dB, and at least 0.02 dB times the square of the round) until the bound holds, 12 rounds at most, then it fails loud. MEASURED over the 34 lines: 2 to 5 rounds, ceilings from -1.02 to -1.93 dB.
- Attack 5 ms, release 50 ms (`PEAK` in the file). Why: the attack is the look-ahead, and 5 ms is about half a period of this voice's low pitch, so the gain comes down over a ramp before the peak and not as a step that clicks. The release is about five periods: the gain does not move inside one period, which would bend the wave, and it is back at 1 between words. MEASURED on four lines (`line.pinball.fired.0`, `line.step1.firstName.0`, `line.step1.tug.0`, `line.marketing.stroll.0`), release 20, 50, 100, 200 ms and attack 1, 2, 5 ms: the loudness after differs by 0.25 LU at most between them, so the choice costs little either way.
- The limiter delays its output by its look-ahead. The tool finds that delay by number (the shift at which the output is nearest the input) and takes it out, so the line is not moved in time and keeps its length. Test: the first half second of a limited line is the input to 0.0001.
- The record: `chain.peak` in the kept json holds `boundDb`, `limitDb` (the limiter's ceiling), `attackMs`, `releaseMs`, `rounds`, `truePeakBeforeDb`, `truePeakAfterDb`, `reductionDb` (the largest fall of a sample louder than -20 dB: the worst moment), `lufsBefore`, `lufsAfter`. `measured` is measured on the limited sound.

`npm run sound -- --rekeep-peaks` prints, for every kept line, true peak and loudness before and after, and "unchanged" or "kept again", and writes nothing. With `--write` it does it: from `out/work/audio/takes/<key>/<file>`, after the take's sha256 is checked against the json, for the lines whose bytes change. It replaces `chain`, `measured`, `seconds`, `sha256` and the WAV, adds `rekept` (`when`, `why`, `was`: the old sha256, true peak and loudness) and leaves every other field as it is: words, take, the listener's answers, `forced`, `problems`. It does not touch `audio/TAKES.json`, `audio/RECIPE.md`, `audio/ASSETS-ROWS.md` or the credits ledger. All lines are made before one is written, so a missing take or a wrong hash stops the run, naming the line, with nothing written. A line under the bound whose bytes the chain no longer makes (other ffmpeg, other take decode) is said, left as it is, and the command ends with exit code 1. A second run with `--write` finds every line unchanged.

MEASURED here, with no take: `npm run sound -- --rekeep-peaks --root /tmp/rk`, a scratch root whose takes are the 34 kept WAVs. Dry run: nothing written (0 files newer than the log). `--write`: 24 kept again; ffmpeg `ebur128=peak=true` on the two worst then reads -1.0 dBFS. `--write` a second time: 0 kept again, the sha256 of all 68 files the same as after the first. (In that root the 10 lines under the bound are reported as not the same bytes, which is right there: a kept WAV sent through trim, fade and low cut a second time is not itself.)

How far each line falls under -18 LUFS, MEASURED by the limiter stage alone on the kept WAV as it is (`holdPeak`, bound -1 dB):

- 10 lines are at or under the bound and unchanged: `boss.lastStand.0`, `boss.slabs.0`, `decision.letter.0`, `live.boss.slow.0`, `live.hit.0`, `live.hit.3`, `live.pinball.flipper.0`, `live.tugLost.0`, `pinball.lobby.0`, `pinball.seal.0`.
- 15 lines are over the bound and not clipped (their peak is at or under 0 dB, so the kept WAV is the levelled line and the number is the real one): `step1.firstName.0` 0.46 LU (1.18 dB off at the worst moment), `pinball.coffee.0` 0.27 LU (1.3 dB off at the worst moment), `live.skip.0` 0.26 LU (0.77 dB off at the worst moment), `live.watchFilm.0` 0.19 LU (0.96 dB off at the worst moment), `live.boss.verify.0` 0.15 LU (1.28 dB off at the worst moment), `step1.firstName.1` 0.12 LU (1.04 dB off at the worst moment), `boss.verify.0` 0.10 LU (0.93 dB off at the worst moment), `step1.tug.0` 0.08 LU (0.85 dB off at the worst moment), `marketing.perks.0` 0.06 LU (0.38 dB off at the worst moment), `decision.metrics.0` 0.04 LU (0.75 dB off at the worst moment), `live.hit.1` 0.02 LU (0.36 dB off at the worst moment), `live.idle.1` 0.02 LU (0.62 dB off at the worst moment), `step2.dial.0` 0.01 LU (0.53 dB off at the worst moment), `live.idle.0` 0.01 LU (0.47 dB off at the worst moment), `pinball.drain.0` 0.00 LU (0.05 dB off at the worst moment).
- 9 lines are clipped in the kept WAV, so the peak that the limiter met here is lower than the take's and the fall is a LOWER BOUND: `step2.crank.0` at least 0.23 LU under -18 (take's peak +4.11 dB, met here +0.22 dB; at most 1.23 LU by the bound below), `pinball.replyAll.0` at least 0.67 LU under -18 (take's peak +3.76 dB, met here +0.91 dB; at most 2.01 LU by the bound below), `marketing.stroll.0` at least 0.51 LU under -18 (take's peak +3.72 dB, met here +0.12 dB; at most 2.67 LU by the bound below), `pinball.fired.0` at least 0.98 LU under -18 (take's peak +2.31 dB, met here +0.79 dB; at most 1.88 LU by the bound below), `live.slowTyping.0` at least 0.12 LU under -18 (take's peak +1.73 dB, met here +0.12 dB; at most 0.39 LU by the bound below), `live.hit.2` at least 0.29 LU under -18 (take's peak +1.59 dB, met here +0.73 dB; at most 0.87 LU by the bound below), `live.realKeyboard.0` at least 0.46 LU under -18 (take's peak +0.71 dB, met here +0.60 dB; at most 0.66 LU by the bound below), `step1.email.0` at least 0.02 LU under -18 (take's peak +0.52 dB, met here +0.08 dB; at most 0.03 LU by the bound below), `pinball.launch.0` at least 0.04 LU under -18 (take's peak +0.09 dB, met here +0.17 dB; at most 0.05 LU by the bound below). The "at most" is the same kept WAV limited at -1 dB less the take's own overshoot: every sample then comes out no louder than the real line would, so the real loudness is not under it. It is a loose bound.

The real fall of the nine comes from the Builder's dry run on the takes. The four whose take peaks are 2.3 to 4.1 dB over full scale (`pinball.fired.0`, `pinball.replyAll.0`, `marketing.stroll.0`, `step2.crank.0`) are the ones that can pass 1 LU.

Test: `tests/audio-peaks.test.ts`, 7 tests, with a made take (two tones with a 30 ms burst that passes the bound once levelled) and a calm one. It needs ffmpeg and is skipped where there is none.

After the Builder kept and packed them again: see "The headroom on the 128 kbit pack" below.

### What holding the peak cost each line (the Builder's run on the takes, 17:46Z)

STATED by the Builder: dry run 24 to keep again, 10 unchanged, no line left as it is, the takes' hashes held; `--write --when 2026-11-26T17:46:32Z` kept 24 again; main cc6329a6. STATED from `chain.peak` in the 24 kept jsons of that commit, the loudest loss first:

| Line | True peak before | after | Off at the worst moment | Limiter at | Loudness after | Under -18 LUFS |
| --- | --- | --- | --- | --- | --- | --- |
| `line.pinball.fired.0` | +2.44 dB | -1.02 dB | 3.54 dB | -1.23 dB | -19.28 LUFS | 1.28 LU |
| `line.pinball.replyAll.0` | +3.87 dB | -1.02 dB | 5.05 dB | -1.29 dB | -18.95 LUFS | 0.95 LU |
| `line.marketing.stroll.0` | +3.73 dB | -1.02 dB | 4.83 dB | -1.11 dB | -18.63 LUFS | 0.63 LU |
| `line.step1.firstName.0` | +0.06 dB | -1.02 dB | 1.18 dB | -1.23 dB | -18.46 LUFS | 0.46 LU |
| `line.live.realKeyboard.0` | +0.97 dB | -1.02 dB | 1.99 dB | -1.28 dB | -18.40 LUFS | 0.40 LU |
| `line.step2.crank.0` | +4.23 dB | -1.02 dB | 5.24 dB | -1.13 dB | -18.37 LUFS | 0.37 LU |
| `line.live.hit.2` | +1.66 dB | -1.05 dB | 3.17 dB | -1.58 dB | -18.29 LUFS | 0.29 LU |
| `line.pinball.coffee.0` | +0.13 dB | -1.06 dB | 1.30 dB | -1.32 dB | -18.27 LUFS | 0.27 LU |
| `line.live.skip.0` | -0.47 dB | -1.02 dB | 0.77 dB | -1.48 dB | -18.26 LUFS | 0.26 LU |
| `line.boss.verify.0` | -0.10 dB | -1.02 dB | 0.93 dB | -1.20 dB | -18.24 LUFS | 0.24 LU |
| `line.live.watchFilm.0` | -0.49 dB | -1.05 dB | 0.96 dB | -1.45 dB | -18.19 LUFS | 0.19 LU |
| `line.live.boss.verify.0` | -0.12 dB | -1.02 dB | 1.28 dB | -1.43 dB | -18.15 LUFS | 0.15 LU |
| `line.live.slowTyping.0` | +1.73 dB | -1.02 dB | 2.80 dB | -1.07 dB | -18.15 LUFS | 0.15 LU |
| `line.step1.firstName.1` | -0.54 dB | -1.16 dB | 1.04 dB | -1.68 dB | -18.12 LUFS | 0.12 LU |
| `line.step1.tug.0` | -0.77 dB | -1.02 dB | 0.85 dB | -1.70 dB | -18.08 LUFS | 0.08 LU |
| `line.marketing.perks.0` | -0.65 dB | -1.02 dB | 0.38 dB | -1.06 dB | -18.06 LUFS | 0.06 LU |
| `line.pinball.launch.0` | +0.25 dB | -1.02 dB | 1.27 dB | -1.18 dB | -18.05 LUFS | 0.05 LU |
| `line.decision.metrics.0` | -0.28 dB | -1.02 dB | 0.75 dB | -1.39 dB | -18.04 LUFS | 0.04 LU |
| `line.step1.email.0` | +0.54 dB | -1.02 dB | 1.58 dB | -1.06 dB | -18.03 LUFS | 0.03 LU |
| `line.live.hit.1` | -0.66 dB | -1.02 dB | 0.36 dB | -1.02 dB | -18.02 LUFS | 0.02 LU |
| `line.live.idle.1` | -0.40 dB | -1.02 dB | 0.62 dB | -1.14 dB | -18.02 LUFS | 0.02 LU |
| `line.live.idle.0` | -0.64 dB | -1.02 dB | 0.47 dB | -1.11 dB | -18.01 LUFS | 0.01 LU |
| `line.step2.dial.0` | -0.49 dB | -1.02 dB | 0.53 dB | -1.02 dB | -18.01 LUFS | 0.01 LU |
| `line.pinball.drain.0` | -0.99 dB | -1.04 dB | 0.05 dB | -1.11 dB | -18.00 LUFS | 0.00 LU |

The other 10 lines are at -18 LUFS, unchanged. No gain is added after the limiter (the Builder's word), so a limited line is that much quieter than the others: 1.28 LU at most. Against it, from the numbers: nothing. Where the keen visit hears `line.pinball.fired.0` its margin over the bed is 20.83 dB (MEASURED, `--levels`), and the smallest margin of any line heard is over 13 dB, so 1.28 LU does not bring a line near the 8 dB that is wanted. The lower and upper bounds given before the run held for all nine clipped lines (for example `fired.0`: 0.98 to 1.88, real 1.28). By ear: UNKNOWN, nobody listened.

### The packed line, and why 64 kbit was wrong (17:50Z to 17:55Z)

FINDING of the Builder, MEASURED again here: the packed MP3 of a line peaks far over its kept WAV. With ffmpeg's decoder, true peak (`loudnorm` input_tp) and largest sample (`astats`), mono `libmp3lame` as the pack makes it:

| Line | Kept WAV | 64 kbit | 96 kbit | 128 kbit | 160 kbit |
| --- | --- | --- | --- | --- | --- |
| `line.live.pinball.flipper.0` (the kept WAV itself) | -1.48 | +1.52 | -0.29 | -1.84 | -1.99 |
| `line.pinball.fired.0` (a stand-in: the old kept WAV limited here) | -1.04 | +2.49 | +0.20 | -1.01 | -0.98 |
| `line.pinball.replyAll.0` (a stand-in, the same way) | -1.13 | +2.54 | -0.56 | -1.20 | -1.36 |
| `line.marketing.perks.0` (a stand-in, the same way) | -1.03 | +1.63 | -0.50 | -1.52 | -1.45 |

True peak in dB. The files: 64 kbit 49920, 44544, 24000, 54144 bytes; 128 kbit twice that. In the Builder's pack of 17:49Z, MEASURED here: `flipper.0` +1.52 dB, `fired.0` +3.42, `replyAll.0` +0.54.

Why it matters more than the number at the output: Chromium's decoder stops at full scale. MEASURED in `npm run sound -- --levels` on that pack (logs/levels5.log), the voice track alone: 7 of the 11 lines the keen visit hears have their largest sample at exactly 0 dB (`step1.firstName.0`, `step1.email.0`, `pinball.launch.0`, `pinball.coffee.0`, `pinball.fired.0`, `boss.verify.0`, `boss.slabs.0`). So the line that the chain now keeps whole is cut flat again, by the browser, because of the MP3. No gain after the engine mends that.

So `PACK.lineKbps` in `src/audio/levels.ts` is 128: the overshoot goes from about +3 dB to within 0.4 dB of the kept sound, and a line limited at -1 dB stays under full scale after the decoder. The cost: the 34 lines are 1305408 bytes at 64 kbit over 162.07 s, so about 2.61 MB at 128, and the pack goes from 5.42 MB to about 6.66 MB of `audio.appMaxMb` 14. `--pack` now prints the largest decoded sample of the packed lines and names every line that decodes over 0 dB.

On that 64 kbit pack `--levels` FAILS its peak line: +0.07 dB at the output in the keen visit as heard, at `line.boss.verify.0` (voice alone +0.62 dB, cut at full scale, over the bed's loudest moment), with the headroom at 2.5 dB. The keen visit is also not the one of 17:10Z: after merge 38 it has 839 events over 125.62 s and 14 lines booked (it was 124.05 s and 11).

### The headroom on the 128 kbit pack (18:14Z)

The pack is the Builder's of 18:09Z (main 38086db9; the tar is 7045120 bytes, sha256 9c4a1ac9...). All MEASURED here in Chromium 159.0.8154.6 with `npm run sound -- --levels`, three runs with only `LIVE.headroomDb` changed. The keen visit is the one after merge 38: 839 events, 125.62 s, 14 lines booked.

| `LIVE.headroomDb` | largest true peak of the output | keen, no line | keen, as heard | skipper, as heard |
|---|---|---|---|---|
| 2.5 | -2.49 dB | -26.71 LUFS | -20.53 LUFS | -19.43 LUFS |
| 2 | -1.99 dB | -26.21 LUFS | -20.03 LUFS | -18.93 LUFS |
| 1.5 (set) | -1.49 dB | -25.71 LUFS | -19.53 LUFS | -18.43 LUFS |

1.5 is the smallest half dB that holds `audio.truePeakDb` (-1 dB): at 1 dB the largest would be -0.99 dB, by the same sum, not run. The largest is always the keen visit as heard, at `line.boss.verify.0` (94.55 s, the voice alone at -1.29 dB over the bed's loudest moment). The other renders at 1.5: keen with no line -3.94 dB; step 1 under fire -2.82; the tug -2.73; the slot -2.96; the bumpers -2.99; the boss's hit -2.63; skipper with no line -4.42; skipper as heard -2.73.

No line is cut by the decoder any more: the voice alone has its largest sample between -1.04 and -4.1 dB (7 of 11 were at exactly 0 dB on the 64 kbit pack). The margins do not move with the headroom, it is one gain after everything: the voice over the bed, whole line, fire 14.41 dB, tug 13.89, slot 17.81, bumpers 13.89, the boss's hit 14.3, and 13.59 to 24.28 dB in the lines as heard; all over `audio.duckDb` (8 dB). At the bed's loudest 0.4 s under a line the smallest are 7.28 dB (the bumpers), 7.52 (`decision.letter.0`) and 8.24 (`boss.verify.0`); `--levels` judges the whole line, not that moment.

FINDING, MEASURED: the mp3 encoder turns a line down by about 0.45 dB at 128 kbit. `ffmpeg -af astats` on `line.boss.slabs.0`: kept WAV RMS -20.68 dB and -18.0 LUFS; packed at 128 kbit RMS -21.12 dB and -18.4 LUFS; the same at 96 to 160 kbit (-21.09 to -21.13), not at 64 (-20.78). `--pack` adds no gain, so it is the encoder's own. In the browser the lines come out 0.4 to 0.6 LU lower than on the 64 kbit pack (`step1.email.0` -14.98 to -15.52 at the voice track). Nothing is done about it: the margins hold, and a gain before the encoder would bring the peaks back up. The films do not use these files.

`--pack-check` now fails when a packed line decodes over 0 dB, when it cannot be decoded, and when ffmpeg is missing (the line says so): `linesOverFullScale` in `tools/lib/sound-packcheck.mjs`, `tests/audio-packcheck.test.ts`. MEASURED on this pack: pass, 38 files, the largest sample of the 34 lines at -1.12 dB (`line.marketing.perks.0.mp3`).

## The crank (point 5)

`src/pages/step2/index.ts` line 857: the page's volume is `max(0.1, level)` from the moment the Audio volume row opens until that row is done, and 1 otherwise; `level` is a tenth for each whole turn.

MEASURED, `tests/audio-visit.test.ts` "turns the crank from nothing to 100 percent" and `npm run sound -- --visit keen`: the engine's output gain is 1 from the first click until 42.57 s, then 0.1 when the row opens, 0.2, 0.3 as the visitor turns, 0.4 to 0.9 as the crank runs away, 1 at 45.32 s, and 1 on every page after step 2. The skipper never turns it: 1 all through.

## The edges (point 6)

Tests in `tests/audio-rules.test.ts`: the mute over a line and a loop, the fallback forced by an audio graph that throws and by a browser without one, the film and back, a skip in the middle of a line, a tab hidden and shown. A1, A2 and A11 are measured in a browser by `npm run sound -- --check`.

A2. MEASURED on a quiet VM of 4 cores, `npm run sound -- --browser --site`: the control changed its state 2.17 s, 2.68 s and 3.01 s after the press, each time after exactly one drawn frame. With 8 busy loops beside it the page drew one frame in over 20 s and the control was not shown in that time. So it is the control and not the check's timing: `src/ui/interface.ts` writes the state and the icon only in the draw tick, and the engine mutes at the press. The file is `/root/site_controls`' and the fix is theirs (the state written at the press). The check now waits for the sounds to load before it reads "as found", and records how late each answer came and how many frames were drawn.

## What is not done, and what is not known

- A6 and A9 wait for the mix; A10 is left as ruled.
- The lines with a peak over the bound were kept again by the Builder (24 of 34, main cc6329a6), not by me: the takes are not in this VM.
- The packed lines are about 0.45 dB under their kept level (the encoder, see above).
- `cut/CUTLIST.json` on main is older than the stage: 689 events against the 977 `npm run cut` gives now.
- What a phone does with the sound is UNKNOWN: everything here is measured in Chromium on a desk.
