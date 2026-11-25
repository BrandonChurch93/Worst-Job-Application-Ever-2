# Notes of the sound side

Kept by the sound agent on the branch `agent/sound`. A fact here is MEASURED (the command and the number are given, or it is a number the chain wrote into `audio/TAKES.json` or `audio/kept/`), STATED (read somewhere, or said by the listener) or UNKNOWN. No sound is called good here: what is given is what was measured and what the listener answered.

The second half of this file, from "Every take" on, is written by `node tools/lib/sound-notes.mjs`. It holds every take with its call, its cost, its break N, its numbers, the listener's answers, whether it is kept, and every effect's prompt beside its takes.

## Where things stand (19:36Z, 25 November 2026)

- MEASURED, `npm run credits`: 2659 of 10000 credits in 177 calls. All 177 calls answered 200. The limit of this stretch is 8000; extras stop at 3500.
- MEASURED, `npm run sound`: 139 of 139 sounds kept (73 cues with their variants, the 20 lines of the film, the 14 lines only the live site has). 166 takes filed.
- MEASURED, `npm run sound -- --pack`: 102 short sounds in one file, 3 loops, 34 narrator lines, 5.42 MB of 14 MB.
- MEASURED, `npx vitest run tests/audio tests/credits.test.ts`: 170 passed. `npx tsc --noEmit -p .`: clean.
- Of the 139 kept, 57 are kept by force, each with its reason in `audio/kept/<id>.json` (`why`, `problems`). 29 of the 34 lines are forced, nearly all because the listener gave fewer than two whole answers on tone.
- `npm run sound -- --check` last ran at 18:34Z: 7 pass, A2 and A5 fail, A6 and A9 not yet (there is no mix). The Builder fixed A2 on main (4324717) and copies the rows for A5. Not run again yet: the Builder asked for none between 19:15Z and 20:00Z.

## Decisions

1. Every call to the sound service goes through `npm run credits`. `tools/lib/sound-batch.mjs` builds the text or prompt file, runs that command, files the take with `tools/sound.mjs` and copies the take to `/home/user/workspace/wja-scratch/sound/takes/`. Nothing else calls the service.
2. A line is sent with each ` / ` replaced by ` <break time="N.Ns" /> `. N is chosen per line so the take runs at or under 1.5 words a second by estimate, between 1.0 and 3.0 in steps of 0.1, the same at every mark of the line. MEASURED over the first takes: a break of N gives a gap of about N + 0.17 to N + 0.39 s. The one exception is `step1.email` takes 2 and 3, sent with N 0.1 on the Builder's ruling of 18:46Z (shorter breaks, to end inside 7.2 s; the pace rule is a ceiling with no floor).
3. A line with no ` / ` (`live.hit` 0 and 1) is sent as it is.
4. A take of a line is kept without force when: every word of the transcript is the line's (the listener's "defense" counts as "defence"); it measures at most 1.6 words a second from its first sound to its last; a gap of at least 0.12 s under -35 dB is found for each mark; two whole answers of the listener say no whisper, no laugh, no warmth, no excitement, and unimpressed and a little smug; and it ends 0.3 s before the next line of the film starts. Anything else is a failure or a keep by force with the reason written down. `tools/lib/sound-judge.mjs` applies this.
5. The Builder's ruling of 18:46Z: the listener's tone answers are not evidence. A take is not retaken for tone unless two whole answers agree that it laughs, whispers or is excited. No take had that.
6. A take of an effect is kept without force when two whole answers say no voice, no word, no music (but for the two music cues), and that it fits the line that describes the cue, with a tie counting against. A take whose peak as delivered is under -36 dB and that got no whole answer fails.
7. Effects are asked for as the cue table's row made concrete, ending with the recipe line. Each variant is its own call with the same prompt. Loops are asked for with the loop flag. Where a take was heard as something else, the prompt was made more exact once and the earlier prompt is kept in `audio/PROMPTS.json` under `earlier`: `page-turn`, `strips-zip`, `button-crack`.
8. The listener is asked neutrally and is never told the line. It gets a copy raised to a peak of -3 dB. Its counts and times are not used: counts and times come from the chain and from ffmpeg.
9. `boss-loop`: made with the sound effect endpoint, as a loop. Decided: the fight has it (the Builder agreed at 19:11Z). The numbers are under "The boss loop".
10. `drain` is kept by force: the row asks for falling bells and the take is not bells; the listener said it fits 3 of 3.
11. A hit, and a tick shorter than 0.6 s, starts 4 ms before its first sample within 9 dB of its peak, measured after the low cut (`CHAIN.contactStartDb`, `contactLeadMs`, `contactMaxSeconds` in `src/audio/levels.ts`). Before this `bumper.4` started 39 ms after its event; MEASURED after it: 4 ms. All kept effects were put through the chain again (`node tools/lib/sound-judge.mjs --rekeep --kind cue`: 86 takes).
12. The line of the visitor who would rather watch (`watchFilm`) is said only while the film's opening plays, and only if it ends 0.3 s before the film's first line. With no opening it is not said. A line of the film is never moved by it. The Builder agreed at 19:11Z.
13. "The button is winning" (`boss.slow`): the page emits no `boss-slow` yet. Until it does, the engine says the line once, at the first event or beat of the fight that comes after the fight has lasted as long as the film's own fight (`boss.collapse.from` minus `boss.unfold.from`, 22 s now), counted on the sound clock from the event `unfold`. `power-down`, a skip, a page turn or leaving the page ends the count. From the first `boss-slow` the page emits, the engine leaves the line to the page for the rest of the visit.
14. The pack is not committed (the Builder's ruling of 19:11Z). `public/audio/index.json` is committed and carries the size and the sha256 of every file. `npm run sound -- --pack-check` compares `public/audio/` of the tree it runs in with the index committed at HEAD, file by file, and prints a pass or the list. The pack is copied to `/home/user/workspace/wja-scratch/sound/takes/public-audio/` after every pack.
15. With the committed index and none of its files there, the engine runs silent and throws nothing (`tests/audio-engine.test.ts`, "runs silent and throws nothing on the committed index when none of its files is there").

16. Eleven extra cues were made on the Builder's ruling of 19:23Z, each on the event of its own name. They are listed under "Extra cues". A second or third take was made only where a take failed: `popup-close` (silence), `session-expired` (does not fit, twice), `carpet-roll` (does not fit, three times). The Builder closed the extras at eleven at 19:39Z.
17. A retake of an effect the listener heard as something else may have its prompt made more exact; the earlier prompt stays in `audio/PROMPTS.json` under `earlier` with the takes it made. Done for `session-expired` take 3 and `carpet-roll` take 3.

## The live narrator, by number

All of it is in `src/audio/narrator.ts`, `src/audio/cues.ts` and `src/audio/index.ts`, tested on a fake clock in `tests/audio-live.test.ts` (35 tests).

- Every line of the film is said once in a visit, the first time its trigger happens (`filmLive` in `src/audio/cues.ts`). A second trigger says nothing.
- The lines only the live site has go through their list in order and round again, never at random.
- A line never interrupts a line. A line starts no sooner than 6 s (`audio.liveNarratorMinGapSeconds`) after the end of the last one.
- A trigger that comes during a line or inside the gap waits. "Its moment has passed" means: the soonest it could start is later than its trigger by more than its wait, and then it is dropped at once. The waits, in seconds (`LIVE.waitSeconds`):

| What set it off | Wait | Why this number |
| --- | --- | --- |
| a line of the film | 10 | the line belongs to a whole gag, which lasts longer than any line; 10 s is the longest line (9.5 s) and still inside the shortest page |
| `hit` | 0.4 | "Hit." half a second after the hit is about another hit |
| `idle` | 4 | the visitor is still frozen 4 s later or the line is wrong |
| `slowTyping` | 2 | it is about one letter; the next key is seconds away |
| `realKeyboard` | 4 | the deck is still up |
| `tugLost` | 3 | the paper is gone within 3 s |
| `pinball.flipper` | 4 | the ball is still in play |
| `boss.verify` | 4 | the button cracks about 4 s after the tick |
| `boss.slow` | 6 | the fight goes on |
| `skip` | 4 | the new page has only just come |
| `watchFilm` | 3 | and never later than the room the opening leaves |

- A visitor who skips a step, or whose page turns, never hears that step's lines afterwards: a waiting line of the page is taken back, a line that has begun runs to its end, and the page is closed for the rest of the visit. `idle`, `skip` and `watchFilm` belong to no page and are not taken back.
- Film mode is unchanged: lines are placed by their beats, events set none off.
- Four events the lines want do not exist yet (`carpet-roll`, `inbox-take`, `firehouse-take`, `metrics-card`); the lines fire on their gag until Phase 4 brings them. `pipeline/sound/NEEDS.md` has each.

## The boss loop

MEASURED by the chain (`src/audio/dsp.ts`, `pulse` and `seamAgainstPulse`; `tests/audio-pulse.test.ts`), recorded in `audio/kept/boss-loop.json`:

- The take as delivered: 8 s with a steady pulse of 0.2142 s, so 37.35 pulses. It could not repeat on its pulse.
- The chain cuts a music loop to whole groups of pulses: kept 6.857 s = 32 pulses, with a blend of one pulse (214.3 ms) taken one loop apart.
- Seam step 2.72 dB over the usual step between pulses (limit 10). Seam level 0.93 dB under the other pulses (limit 3). Played three times in a row the pulse phase stays within 0.04 pulse across the seams.
- The listener on take 1: music, fits, 2 of 2.
- Harmony across the seam: UNKNOWN. Nothing here measures it and the listener was not asked.

## Lines and their place in the film

MEASURED at 19:16Z against `content/narration.json` and `config/showcase.json` of main d060579's parent (room = the next line's start minus this line's start minus 0.3 s):

- `step1.email`: take 2 kept, 7.470 s, room 7.481 s after the Builder moved the tug line to `at` 0.125. Fits by 0.011 s.
- `pinball.launch`: take 1, 3.094 s, room 2.700 s, over by 0.394 s. No new take: Phase 4 fits the pinball's beat times.
- `marketing.stroll` fits by 0.050 s, `step1.firstName` 0 by 0.114 s, `pinball.lobby` by 0.026 s. All others have more.
- `step1.email` used its three takes: take 1 9.508 s (N 1.0), take 2 7.470 s (N 0.1, 1.339 words a second), take 3 6.186 s (N 0.1, 1.617 words a second, over the ceiling by 0.017).

## The listener

- The listener is the audio evaluation tool. MEASURED over all takes: 797 asks, 259 whole answers. The rest said no audio reached it or were cut off.
- It was least reliable between 19:02Z and 19:05Z: 1 whole answer in 30 asks.
- `line.live.tugLost.0` got no whole answer in 18 asks. Two answers that were cut off before their end wrote the line word for word; one of them said it had no audio and worked from text. The take is kept by force on its numbers (4.016 s, 1.245 words a second, 1 pause of 1).
- Tone words the listener used for kept lines include "deadpan", "cynical", "sarcastic", "detached", "ominous and threatening" (crank take 3), "abrupt and commanding" (hit 0). By the Builder's ruling they decide nothing.

## Moments with no sound

- None of the 73 cues and none of the 34 lines is without a kept take.
- STATED from the page code: no event is silent on purpose any more (`silentEvents` is empty). `share` plays `button-press`.
- The cues `carpet-roll`, `inbox-take`, `firehouse-take` and `metrics-card` are packed and mapped to events of their own names. No page emits those events yet, so they are not heard until Phase 4. A test holds that an event with no cue, and an added cue whose sound is not loaded, play nothing and throw nothing (`tests/audio-engine.test.ts`).
- `count-run`, the numbers of the metrics card counting up, has no sound and no event.
- `marketing.stroll` cannot sound before the visitor's first click: a browser lets no sound start before it.

## Extra cues

Eleven cues added on the Builder's ruling of 19:23Z, inside `audio.extraCuesMax` (12). Every call was made with `--extra`. MEASURED from the ledger: calls 162 to 177, 16 calls, 126 credits (2533 to 2659). The recipe line is added to the end of each prompt. Every take, kept or not, with its prompt, is under "Every take" below; an earlier prompt of a cue is in `audio/PROMPTS.json` under `earlier`.

| # | Cue | The row | Prompt of the kept take | Event | Length | Take kept | Class |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `tug-lost` | One sheet of thick paper torn out of a grip and ripped in two | One sheet of thick paper ripped out of a grip and torn in two in one fast pull, a sharp dry paper tear | `tug-lost`: emitted by step 1 on the live site only; wired | 0.6 s set, 0.6 s kept | take 1 of 1 (call 162), kept. Listener: 2 asks, 2 whole, fits 2 yes, 0 no | mechanism |
| 2 | `arms-out` | Two small sprung arms snapping out | Two small spring-loaded metal arms snapping out of a housing, two quick clicks close together, a light mechanical snap | `arms-out`: emitted by step 1; wired | 0.5 s set, 0.13 s kept | take 1 of 1 (call 163), kept. Listener: 4 asks, 2 whole, fits 2 yes, 0 no | mechanism |
| 3 | `dial-fling` | A telephone dial hitting its stop hard | A rotary telephone dial hitting its metal stop hard at the end of its run back, one sharp metal knock with a short spring rattle after it | `dial-fling`: emitted by step 2; wired | 0.8 s set, 0.601 s kept | take 1 of 1 (call 164), kept. Listener: 2 asks, 2 whole, fits 2 yes, 0 no | hit |
| 4 | `flipper-save` | A flipper striking a steel ball hard | A pinball flipper snapping up and striking a steel ball hard, a solenoid clack with a solid steel knock on top | `flipper-save`: emitted by the pinball; wired | 0.4 s set, 0.102 s kept | take 1 of 1 (call 165), kept. Listener: 5 asks, 2 whole, fits 2 yes, 0 no | hit |
| 5 | `session-expired` | A wide heavy panel slamming into place | A heavy stone slab dropped flat into a wide wooden frame, one deep low slam with weight, dull and broad, no ring | `session-expired`: emitted by the boss page; wired | 0.8 s set, 0.8 s kept | take 3 of 3 (call 175), kept. Listener: 4 asks, 2 whole, fits 2 yes, 0 no | hit |
| 6 | `popup-close` | A small flat panel snapping shut | A small flat ceramic panel snapping shut flush into a frame, one short dull click | `popup-close`: emitted by the boss page; wired | 0.3 s set, 0.082 s kept | take 2 of 2 (call 173), kept. Listener: 3 asks, 2 whole, fits 2 yes, 0 no | tick |
| 7 | `carpet-roll` | A steel ball rolling off a hard floor onto thick carpet | A steel ball rolling off a hard floor onto thick carpet, the bright roll turning soft and muffled, then stopping | `carpet-roll`: not emitted yet (Phase 4); mapped, silent until then | 1.0 s set, 0.866 s kept | take 1 of 3 (call 168), kept by force: three takes made and none holds: take 1 fits by 1 yes to 2 no (heard as a metal thing rolling on a hard floor and then going muffled), take 2 by 0 to 2 (liquid, or a coin settling), take 3 with the changed prompt by 0 to 2 (a coin or a light ball settling). Take 1 is the nearest to the row. The cue is silent until Phase 4 emits carpet-roll. Listener: 3 asks, 3 whole, fits 1 yes, 2 no | mechanism |
| 8 | `inbox-take` | A steel ball dropping into a shallow metal tray | A steel ball dropping into a shallow metal tray and settling, one metal clatter and a short rattle | `inbox-take`: not emitted yet (Phase 4); mapped, silent until then | 0.6 s set, 0.399 s kept | take 1 of 1 (call 169), kept by force: not judged by ear: 0 whole answers in 6 asks. Listener: 6 asks, 0 whole, fits 0 yes, 0 no | hit |
| 9 | `firehouse-take` | A steel ball dropping into a deep hole in a wooden board | A steel ball dropping into a deep hole in a wooden board, a hollow knock and a short roll below | `firehouse-take`: not emitted yet (Phase 4); mapped, silent until then | 0.6 s set, 0.589 s kept | take 1 of 1 (call 170), kept. Listener: 4 asks, 2 whole, fits 2 yes, 0 no | hit |
| 10 | `metrics-card` | A stiff card laid flat on a hard desk | A stiff card laid flat on a ceramic desk, a short slide and one soft flat tap | `metrics-card`: not emitted yet (Phase 4); mapped, silent until then | 0.5 s set, 0.312 s kept | take 1 of 1 (call 171), kept by force: not judged by ear: 0 whole answers in 6 asks. Listener: 6 asks, 0 whole, fits 0 yes, 0 no | tick |
| 11 | `skip` | One firm press of a wide plastic key | One firm press of a wide plastic key bottoming out on a ceramic base, a single low click | `skip`: emitted by the stage on the live site; wired | 0.3 s set, 0.3 s kept | take 1 of 1 (call 172), kept by force: not judged by ear: 0 whole answers in 6 asks. Listener: 6 asks, 0 whole, fits 0 yes, 0 no | tick |

- The rows for `audio.sfx` were sent as `pipeline/sound/NEEDS-sfx.patch`, a diff of `config/showcase.json` that applied on main 4fbcdc7 (MEASURED: `git apply --check`). With the patch applied, `npx vitest run tests/audio tests/credits.test.ts tests/config.test.ts` passes (MEASURED at 19:33Z: 267 passed; the patch was then taken off again, `config/` is unchanged in this tree).
- The rows are in `audio.sfx` on main since 9267c2b (the Builder applied `pipeline/sound/NEEDS-sfx.patch` as written). Since then the eleven are in `eventCues` of `src/audio/cues.ts` too, so the field `cue` that `src/film/cut.ts` writes names them. `extraCues` stays as the list of what the build added; `cueOfEvent` reads both tables and `allCues` lists each cue once.
- The borrowed sounds are gone: `arms-out` no longer plays `paper-strain`, `dial-fling` no longer `dial-return`, `flipper-save` no longer `flipper`, `session-expired` no longer `popup`. `share` still plays `button-press` (it was not in the list).
- `dial-fling`: the prompt sent is not the one proposed at 19:21Z. The event comes at the stop, after `dial-return` has sounded the run back, so the proposed whirr before the knock would have put the knock late. STATED by the listener of take 1, 2 of 2: a dial spinning back and hitting its stop. MEASURED: the kept sound's peak is 6 ms from its start.
- `flipper-save`: when a visitor's own flip makes the save, the page emits `flipper` and `flipper-save` in the same step, so the flipper's sound and this one start together. When the closed exit kicks the ball, `flipper-save` sounds alone.
- The Builder ruled at 19:39Z that `flipper` and `flipper-save` both sound at a save made by the visitor's own flip. MEASURED on the kept files started together, `ffmpeg -i audio/kept/flipper.N.wav -i audio/kept/flipper-save.wav -filter_complex "amix=inputs=2:duration=longest:normalize=0,astats"`: the peak of the sum is -2.68 dB with variant 1, -3.07 dB with variant 2, -3.85 dB with variant 3 (each alone is at -5 dB). None clips, so `flipper-save` is not lowered. Whether one masks the other is UNKNOWN by ear.
- `popup-close` take 1 was silence (MEASURED: peak -62.72 dB as delivered); take 2 is kept.
- `session-expired`: takes 1 and 2 were heard as a small click and a small thing set down (fits 0 of 2 each). Take 3 has a changed prompt. MEASURED: it came at a peak of -33.95 dB and is raised 28.82 dB; the last 100 ms of the kept sound are at -62.58 dB RMS.
- `arms-out` is of the class mechanism, which is not moved to its first contact. MEASURED: its peak is 21 ms after its start.
- `inbox-take`, `metrics-card` and `skip` got no whole answer from the listener in 6 asks each. They are kept by force on their numbers and are not judged by ear.
- `count-run` (the numbers counting up) is not made: the Builder ruled that it is not a contact and its event does not exist. It is open for step 5 in `pipeline/sound/NEEDS.md`.

## For Brandon to decide

- `strips-zip` (the shredded strips zipping out): take 2 is kept by force. It is the one effect of the cue table the listener says does not fit its row, after three takes. The takes and the listener's words are under "Every take".
- `carpet-roll` (extra cue 7): take 1 is kept by force after three takes. The listener says none of the three fits: take 1 by 1 yes to 2 no, takes 2 and 3 by 0 to 2. It is not heard on the site until Phase 4 emits its event.
- `inbox-take`, `metrics-card` and `skip` (extra cues 8, 10 and 11): take 1 of each is kept by force and is not judged by ear. The listener gave no whole answer in 6 asks for any of the three. What is known of them is MEASURED only: 0.399 s, 0.312 s and 0.300 s long, one hit found in each. The Builder ruled at 19:39Z: no more calls on them.
- `dart-hit.4` (the fourth variant of the dart's hit): its noise floor is UNKNOWN by ear. The take came at a peak of -45.01 dB and the chain raises it 28.88 dB (`audio/kept/dart-hit.4.json`). MEASURED on `audio/kept/dart-hit.4.wav` against `audio/kept/dart-hit.1.wav`, both 0.2 s long and at a peak of -16 dB after the chain, with `ffmpeg -i F -af "atrim=start=0.1,astats=measure_overall=RMS_level+Peak_level:measure_perchannel=none" -f null -`: the last 100 ms of `dart-hit.4` are at -41.63 dB RMS (peak -27.86 dB), those of `dart-hit.1` at -64.53 dB RMS (peak -48.24 dB). So the tail of variant 4 is 22.9 dB louder than that of variant 1, 25.6 dB under its own peak. Whether that tail is the tick ringing or the raised floor is UNKNOWN.

## My mistakes

- 18:44Z: I passed `--n` three times to `tools/lib/sound-batch.mjs` instead of one comma list. Only the last was read, so `step2.crank` take 2 and `live.idle.1` take 2 went out with the same break as take 1 (1.0 and 1.9). Both measured too fast again (1.622 and 1.658 words a second), 50 credits were spent for nothing, and `idle.1` take 2 broke the rule that the next take has a longer N. The third takes had the longer break (1.3 and 2.4) and measure 1.394 and 1.550.
- The commit 9bc69a4 was pushed with a test of the engine failing (it took the committed index to be empty). Fixed in 743bfe5.
- `public/audio/index.json` was committed listing sounds whose files are ignored, and I did not say so until 19:07Z. Decision 14 is the answer.

## Every take

This part is written by `node tools/lib/sound-notes.mjs` from `audio/TAKES.json` and `audio/kept/`. Do not edit it by hand: edit above it.

166 takes: 25 of the film's lines, 19 of the lines only the live site has, 122 of effects.

A line is sent with every ` / ` of the script replaced by ` <break time="N.Ns" /> `, N being the number in the column Break N, the same at every mark of the line. Speed 0.7, stability 0.75, the default voice, no model named. The listener's words are STATED by the listener; every number is MEASURED by the chain.

### The lines of the film

| Line | Take | Call | Credits | Break N | Seconds | Words a second | Pauses found of marks (s) | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `line.marketing.stroll.0` | 1 | 13 | 27 | 1 | 5.13 | 1.559 | 2 of 2 (1.11, 1.18) | 8 asks, 1 whole; transcript "Here we find the applicant. Rent is due." (3 of 3); whisper 0 yes, 1 no; laugh 0 yes, 1 no; warmth 0 yes, 1 no; excitement 0 yes, 1 no; unimpressed and smug 1 yes, 0 no; attitude aloof and demanding | yes, by force: too long for its place: 5.13 s in 5.12 s, over by 0.010 s; tone not judged: 1 whole answers in 8 asks. Forced over: the listener left "whisper" unanswered; the listener left "laugh" unanswered; the listener left "warmth" unanswered; the listener left "excitement" unanswered; the listener left "unimpressedAndSmug" unanswered; it is 5.13 s long and its place in the film has 5.12 s |
| `line.marketing.perks.0` | 1 | 14 | 30 | 1 | 6.732 | 1.188 | 2 of 2 (1.248, 1.196) | 8 asks, 2 whole; transcript "It spots unlimited PTO. Poor thing. Believes it." (7 of 7); whisper 0 yes, 2 no; laugh 0 yes, 2 no; warmth 0 yes, 2 no; excitement 0 yes, 2 no; unimpressed and smug 2 yes, 0 no; attitude cynical and condescending / cynical and condescending | yes |
| `line.step1.firstName.0` | 1 | 15 | 29 | 1 | 5.346 | 1.122 | 2 of 2 (1.132, 1.128) | 8 asks, 1 whole; transcript "First name. Under fire. Standard onboarding." (3 of 3); whisper 0 yes, 1 no; laugh 0 yes, 1 no; warmth 0 yes, 1 no; excitement 0 yes, 1 no; unimpressed and smug 0 yes, 1 no; attitude serious and factual | yes, by force: too long for its place: 5.346 s in 4.5 s, over by 0.846 s; tone not judged: 1 whole answers in 8 asks. Forced over: the listener left "whisper" unanswered; the listener left "laugh" unanswered; the listener left "warmth" unanswered; the listener left "excitement" unanswered; the listener left "unimpressedAndSmug" unanswered; it is 5.346 s long and its place in the film has 4.5 s |
| `line.step1.firstName.1` | 1 | 16 | 25 | 1 | 5.186 | 1.35 | 2 of 2 (1.21, 1.202) | 6 asks, 2 whole; transcript "Hit. It keeps typing. It has bills." (4 of 4); whisper 0 yes, 2 no; laugh 0 yes, 2 no; warmth 0 yes, 2 no; excitement 0 yes, 2 no; unimpressed and smug 0 yes, 2 no; attitude deadpan and matter-of-fact / serious and detached | yes, by force: two whole answers heard no whisper, laugh, warmth or excitement and called it deadpan, but did not answer unimpressed and a little smug; the Builder's ruling of 18:46Z: the listener's tone answers are not evidence. Forced over: the listener did not hear an unimpressed, slightly smug speaker |
| `line.step1.email.0` | 1 | 17 | 40 | 1 | 9.508 | 1.052 | 3 of 3 (1.186, 1.286, 1.166) | 8 asks, 1 whole; transcript "A valid email rejected. The system is working as designed." (4 of 4); whisper 0 yes, 1 no; laugh 0 yes, 1 no; warmth 0 yes, 1 no; excitement 0 yes, 1 no; unimpressed and smug 1 yes, 0 no; attitude deadpan, cynical, and smug | no |
| `line.step1.tug.0` | 1 | 18 | 35 | 1.4 | 7.816 | 1.535 | 2 of 2 (1.634, 1.608) | 8 asks, 0 whole; transcript "It fights for the resume. Two pages. One of them is true." (3 of 3); whisper 0 yes, 0 no; laugh 0 yes, 0 no; warmth 0 yes, 0 no; excitement 0 yes, 0 no; unimpressed and smug 0 yes, 0 no; attitude none | yes, by force: tone not judged: 0 whole answers in 8 asks. Forced over: the listener left "whisper" unanswered; the listener left "laugh" unanswered; the listener left "warmth" unanswered; the listener left "excitement" unanswered; the listener left "unimpressedAndSmug" unanswered |
| `line.step2.dial.0` | 1 | 19 | 31 | 1 | 5.864 | 1.535 | 2 of 2 (1.154, 1.128) | 8 asks, 0 whole; transcript "A rotary phone. The applicant has never seen one." (4 of 4); whisper 0 yes, 0 no; laugh 0 yes, 0 no; warmth 0 yes, 0 no; excitement 0 yes, 0 no; unimpressed and smug 0 yes, 0 no; attitude none | yes, by force: tone not judged: 0 whole answers in 8 asks. Forced over: the listener left "whisper" unanswered; the listener left "laugh" unanswered; the listener left "warmth" unanswered; the listener left "excitement" unanswered; the listener left "unimpressedAndSmug" unanswered |
| `line.step2.crank.0` | 1 | 20 | 29 | 1 | 5.954 | 1.512 | 1 of 2 (1.208) | 10 asks, 0 whole; transcript "Volume all the way up. It will regret that." (4 of 4); whisper 0 yes, 0 no; laugh 0 yes, 0 no; warmth 0 yes, 0 no; excitement 0 yes, 0 no; unimpressed and smug 0 yes, 0 no; attitude none | no |
| `line.pinball.seal.0` | 1 | 21 | 32 | 1 | 6.698 | 1.194 | 2 of 2 (1.104, 1.138) | 8 asks, 1 whole; transcript "The skills assessment. No skills will be assessed." (4 of 4); whisper 0 yes, 1 no; laugh 0 yes, 1 no; warmth 0 yes, 1 no; excitement 0 yes, 1 no; unimpressed and smug 1 yes, 0 no; attitude deadpan and bureaucratic | yes, by force: tone not judged: 1 whole answers in 8 asks. Forced over: the listener left "whisper" unanswered; the listener left "laugh" unanswered; the listener left "warmth" unanswered; the listener left "excitement" unanswered; the listener left "unimpressedAndSmug" unanswered |
| `line.pinball.launch.0` | 1 | 22 | 14 | 1 | 3.094 | 1.293 | 1 of 1 (1.128) | 8 asks, 0 whole; transcript "A career In reverse" (2 of 2); whisper 0 yes, 0 no; laugh 0 yes, 0 no; warmth 0 yes, 0 no; excitement 0 yes, 0 no; unimpressed and smug 0 yes, 0 no; attitude none | yes, by force: too long for its place: 3.094 s in 2.7 s, over by 0.394 s; tone not judged: 0 whole answers in 8 asks. Forced over: the listener left "whisper" unanswered; the listener left "laugh" unanswered; the listener left "warmth" unanswered; the listener left "excitement" unanswered; the listener left "unimpressedAndSmug" unanswered; it is 3.094 s long and its place in the film has 2.7 s |
| `line.pinball.lobby.0` | 1 | 23 | 19 | 1 | 3.674 | 1.089 | 1 of 1 (1.094) | 10 asks, 0 whole; transcript "Corporate headquarters. So close." (4 of 4); whisper 0 yes, 0 no; laugh 0 yes, 0 no; warmth 0 yes, 0 no; excitement 0 yes, 0 no; unimpressed and smug 0 yes, 0 no; attitude none | yes, by force: tone not judged: 0 whole answers in 10 asks. Forced over: the listener left "whisper" unanswered; the listener left "laugh" unanswered; the listener left "warmth" unanswered; the listener left "excitement" unanswered; the listener left "unimpressedAndSmug" unanswered |
| `line.pinball.coffee.0` | 1 | 24 | 17 | 1.4 | 3.944 | 1.521 | 1 of 1 (1.528) | 8 asks, 0 whole; transcript "It runs on coffee and fear." (2 of 2); whisper 0 yes, 0 no; laugh 0 yes, 0 no; warmth 0 yes, 0 no; excitement 0 yes, 0 no; unimpressed and smug 0 yes, 0 no; attitude none | yes, by force: tone not judged: 0 whole answers in 8 asks. Forced over: the listener left "whisper" unanswered; the listener left "laugh" unanswered; the listener left "warmth" unanswered; the listener left "excitement" unanswered; the listener left "unimpressedAndSmug" unanswered |
| `line.pinball.replyAll.0` | 1 | 25 | 15 | 1 | 2.968 | 1.348 | 1 of 1 (1.116) | 5 asks, 2 whole; transcript "Someone hit reply all." (4 of 4); whisper 0 yes, 2 no; laugh 0 yes, 2 no; warmth 0 yes, 2 no; excitement 0 yes, 2 no; unimpressed and smug 2 yes, 0 no; attitude deadpan and cynical / cynical and exasperated | yes |
| `line.pinball.fired.0` | 1 | 26 | 28 | 1 | 5.544 | 1.443 | 2 of 2 (1.252, 1.238) | 8 asks, 0 whole; transcript "Fired before it was hired. A new record." (3 of 3); whisper 0 yes, 0 no; laugh 0 yes, 0 no; warmth 0 yes, 0 no; excitement 0 yes, 0 no; unimpressed and smug 0 yes, 0 no; attitude none | yes, by force: tone not judged: 0 whole answers in 8 asks. Forced over: the listener left "whisper" unanswered; the listener left "laugh" unanswered; the listener left "warmth" unanswered; the listener left "excitement" unanswered; the listener left "unimpressedAndSmug" unanswered |
| `line.pinball.drain.0` | 1 | 27 | 23 | 1.6 | 4.558 | 1.536 | 1 of 1 (1.77) | 8 asks, 0 whole; transcript "The unemployment office. It knows the way." (2 of 2); whisper 0 yes, 0 no; laugh 0 yes, 0 no; warmth 0 yes, 0 no; excitement 0 yes, 0 no; unimpressed and smug 0 yes, 0 no; attitude none | yes, by force: tone not judged: 0 whole answers in 8 asks. Forced over: the listener left "whisper" unanswered; the listener left "laugh" unanswered; the listener left "warmth" unanswered; the listener left "excitement" unanswered; the listener left "unimpressedAndSmug" unanswered |
| `line.boss.verify.0` | 1 | 28 | 26 | 1 | 5.222 | 1.532 | 2 of 2 (1.144, 1.214) | 8 asks, 2 whole; transcript "Not a robot, it claims. We will see." (4 of 4); whisper 0 yes, 2 no; laugh 0 yes, 2 no; warmth 0 yes, 2 no; excitement 0 yes, 2 no; unimpressed and smug 2 yes, 0 no; attitude skeptical and cynical / suspicious and cynical | yes |
| `line.boss.slabs.0` | 1 | 29 | 37 | 1.4 | 8.038 | 1.493 | 2 of 2 (1.534, 1.53) | 6 asks, 2 whole; transcript "The submit button fights back. Even it does not want this job." (4 of 4); whisper 0 yes, 2 no; laugh 0 yes, 2 no; warmth 0 yes, 2 no; excitement 0 yes, 2 no; unimpressed and smug 2 yes, 0 no; attitude cynical and weary / cynical, deadpan, and unamused | yes |
| `line.boss.lastStand.0` | 1 | 30 | 17 | 1 | 3.512 | 1.139 | 1 of 1 (1.188) | 8 asks, 0 whole; transcript "Session expired. A classic." (2 of 2); whisper 0 yes, 0 no; laugh 0 yes, 0 no; warmth 0 yes, 0 no; excitement 0 yes, 0 no; unimpressed and smug 0 yes, 0 no; attitude none | yes, by force: tone not judged: 0 whole answers in 8 asks. Forced over: the listener left "whisper" unanswered; the listener left "laugh" unanswered; the listener left "warmth" unanswered; the listener left "excitement" unanswered; the listener left "unimpressedAndSmug" unanswered |
| `line.decision.letter.0` | 1 | 31 | 17 | 1.1 | 3.474 | 1.439 | 1 of 1 (1.252) | 6 asks, 2 whole; transcript "Rejected. In under a second." (4 of 4); whisper 0 yes, 2 no; laugh 0 yes, 2 no; warmth 0 yes, 2 no; excitement 0 yes, 2 no; unimpressed and smug 2 yes, 0 no; attitude dismissive and smug / smug and dismissive | yes |
| `line.decision.metrics.0` | 1 | 32 | 25 | 1.9 | 5.742 | 1.393 | 1 of 1 (2.046) | 8 asks, 1 whole; transcript "It will apply again tomorrow. They always do." (3 of 3); whisper 0 yes, 1 no; laugh 0 yes, 1 no; warmth 0 yes, 1 no; excitement 0 yes, 1 no; unimpressed and smug 1 yes, 0 no; attitude cynical and matter-of-fact | yes, by force: tone not judged: 1 whole answers in 8 asks. Forced over: the listener left "whisper" unanswered; the listener left "laugh" unanswered; the listener left "warmth" unanswered; the listener left "excitement" unanswered; the listener left "unimpressedAndSmug" unanswered |
| `line.step1.firstName.1` | 2 | 140 | 25 | 1 | 5.404 | 1.295 | 2 of 2 (1.172, 1.126) | 6 asks, 0 whole; transcript none; whisper 0 yes, 0 no; laugh 0 yes, 0 no; warmth 0 yes, 0 no; excitement 0 yes, 0 no; unimpressed and smug 0 yes, 0 no; attitude none | no |
| `line.step2.crank.0` | 2 | 141 | 29 | 1 | 5.548 | 1.622 | 2 of 2 (1.172, 1.262) | not asked | no |
| `line.step2.crank.0` | 3 | 152 | 29 | 1.3 | 6.454 | 1.394 | 2 of 2 (1.478, 1.562) | 6 asks, 1 whole; transcript "Volume all the way up. It will regret that." (1 of 1); whisper 0 yes, 1 no; laugh 0 yes, 1 no; warmth 0 yes, 1 no; excitement 0 yes, 1 no; unimpressed and smug 1 yes, 0 no; attitude ominous and threatening | yes, by force: tone not judged: 1 whole answers in 6 asks. Forced over: the listener left "whisper" unanswered; the listener left "laugh" unanswered; the listener left "warmth" unanswered; the listener left "excitement" unanswered; the listener left "unimpressedAndSmug" unanswered |
| `line.step1.email.0` | 2 | 155 | 40 | 0.1 | 7.47 | 1.339 | 3 of 3 (0.34, 0.494, 0.352) | 5 asks, 1 whole; transcript "A valid email rejected the system is working as designed." (2 of 2); whisper 0 yes, 1 no; laugh 0 yes, 1 no; warmth 0 yes, 1 no; excitement 0 yes, 1 no; unimpressed and smug 1 yes, 0 no; attitude deadpan and dismissive | yes, by force: the Builder's ruling of 19:11Z: take 2 is kept and the tug line moves 0.15 s later on main; transcript word for word in 2 of 2 answers that had one, 1 whole answer in 5 asks. Forced over: the listener left "whisper" unanswered; the listener left "laugh" unanswered; the listener left "warmth" unanswered; the listener left "excitement" unanswered; the listener left "unimpressedAndSmug" unanswered; it is 7.47 s long and its place in the film has 7.325 s |
| `line.step1.email.0` | 3 | 156 | 40 | 0.1 | 6.186 | 1.617 | 3 of 3 (0.29, 0.352, 0.36) | 4 asks, 2 whole; transcript "A valid email, rejected. The system is working as designed." (2 of 2); whisper 0 yes, 2 no; laugh 0 yes, 2 no; warmth 0 yes, 2 no; excitement 0 yes, 2 no; unimpressed and smug 2 yes, 0 no; attitude cynical, sarcastic, and deadpan / sarcastic and cynical | no |

### The lines only the live site has

| Line | Take | Call | Credits | Break N | Seconds | Words a second | Pauses found of marks (s) | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `line.live.idle.0` | 1 | 126 | 37 | 1.3 | 8.014 | 1.373 | 2 of 2 (1.478, 1.526) | 6 asks, 0 whole; transcript "The applicant has frozen. A common defense. It does not work." (4 of 4); whisper 0 yes, 0 no; laugh 0 yes, 0 no; warmth 0 yes, 0 no; excitement 0 yes, 0 no; unimpressed and smug 0 yes, 0 no; attitude none | yes, by force: the listener wrote "The applicant has frozen. A common defense. It does not work.": the same words in another spelling; tone not judged: 0 whole answers in 6 asks. Forced over: the listener wrote "The applicant has frozen. A common defense. It does not work.", which is not the line; the listener left "whisper" unanswered; the listener left "laugh" unanswered; the listener left "warmth" unanswered; the listener left "excitement" unanswered; the listener left "unimpressedAndSmug" unanswered |
| `line.live.idle.1` | 1 | 127 | 21 | 1.9 | 4.8 | 1.667 | 1 of 1 (1.862) | 6 asks, 0 whole; transcript none; whisper 0 yes, 0 no; laugh 0 yes, 0 no; warmth 0 yes, 0 no; excitement 0 yes, 0 no; unimpressed and smug 0 yes, 0 no; attitude none | no |
| `line.live.hit.0` | 1 | 128 | 2 | 0 | 0.586 | 1.706 | 0 of 0 () | 6 asks, 3 whole; transcript "Hit." (3 of 3); whisper 0 yes, 3 no; laugh 0 yes, 3 no; warmth 0 yes, 3 no; excitement 0 yes, 3 no; unimpressed and smug 0 yes, 3 no; attitude firm and direct / neutral and direct / abrupt and commanding | yes, by force: one word in 0.586 s is 1.706 words a second by the arithmetic of the pace rule and take 2 at 0.542 s is faster; a single word has no pace to slow, and three whole answers heard no whisper, laugh, warmth or excitement. Forced over: the listener did not hear an unimpressed, slightly smug speaker; it is spoken at 1.706 words a second and the limit is 1.6 |
| `line.live.hit.1` | 1 | 129 | 3 | 0 | 0.72 | 1.389 | 0 of 0 () | 6 asks, 2 whole; transcript "Again." (2 of 2); whisper 0 yes, 2 no; laugh 0 yes, 2 no; warmth 0 yes, 2 no; excitement 0 yes, 2 no; unimpressed and smug 0 yes, 2 no; attitude stern and demanding / stern and commanding | yes, by force: listener: not unimpressed and a little smug (0 yes, 2 no; ["stern and demanding","stern and commanding"]). The Builder's ruling of 18:46Z: the listener's tone answers are not evidence. Forced over: the listener did not hear an unimpressed, slightly smug speaker |
| `line.live.hit.2` | 1 | 130 | 17 | 1.1 | 3.484 | 1.435 | 1 of 1 (1.294) | 12 asks, 2 whole; transcript "Still typing. It has bills." (2 of 2); whisper 0 yes, 2 no; laugh 0 yes, 2 no; warmth 0 yes, 2 no; excitement 0 yes, 2 no; unimpressed and smug 1 yes, 1 no; attitude detached and deadpan / deadpan and serious | yes, by force: listener: not unimpressed and a little smug (1 yes, 1 no; ["detached and deadpan","deadpan and serious"]). The Builder's ruling of 18:46Z: the listener's tone answers are not evidence. Forced over: the listener did not hear an unimpressed, slightly smug speaker |
| `line.live.hit.3` | 1 | 131 | 15 | 1 | 3.164 | 0.948 | 1 of 1 (1.146) | 6 asks, 1 whole; transcript "Resilient or desperate." (1 of 1); whisper 0 yes, 1 no; laugh 0 yes, 1 no; warmth 0 yes, 1 no; excitement 0 yes, 1 no; unimpressed and smug 1 yes, 0 no; attitude cynical and evaluating | yes, by force: tone not judged: 1 whole answers in 6 asks. Forced over: the listener left "whisper" unanswered; the listener left "laugh" unanswered; the listener left "warmth" unanswered; the listener left "excitement" unanswered; the listener left "unimpressedAndSmug" unanswered |
| `line.live.slowTyping.0` | 1 | 132 | 15 | 1 | 2.766 | 1.446 | 1 of 1 (1.156) | 6 asks, 1 whole; transcript "One letter. Well done." (2 of 2); whisper 0 yes, 1 no; laugh 0 yes, 1 no; warmth 0 yes, 1 no; excitement 0 yes, 1 no; unimpressed and smug 1 yes, 0 no; attitude sarcastic and dismissive | yes, by force: tone not judged: 1 whole answers in 6 asks. Forced over: the listener left "whisper" unanswered; the listener left "laugh" unanswered; the listener left "warmth" unanswered; the listener left "excitement" unanswered; the listener left "unimpressedAndSmug" unanswered |
| `line.live.realKeyboard.0` | 1 | 133 | 19 | 1.1 | 3.634 | 1.376 | 1 of 1 (1.258) | 6 asks, 1 whole; transcript "A real keyboard. How optimistic." (3 of 3); whisper 0 yes, 1 no; laugh 0 yes, 1 no; warmth 0 yes, 1 no; excitement 0 yes, 1 no; unimpressed and smug 1 yes, 0 no; attitude sarcastic and cynical | yes, by force: tone not judged: 1 whole answers in 6 asks. Forced over: the listener left "whisper" unanswered; the listener left "laugh" unanswered; the listener left "warmth" unanswered; the listener left "excitement" unanswered; the listener left "unimpressedAndSmug" unanswered |
| `line.live.tugLost.0` | 1 | 134 | 18 | 1.1 | 4.016 | 1.245 | 1 of 1 (1.16) | 18 asks, 0 whole; transcript none; whisper 0 yes, 0 no; laugh 0 yes, 0 no; warmth 0 yes, 0 no; excitement 0 yes, 0 no; unimpressed and smug 0 yes, 0 no; attitude none | yes, by force: 18 asks brought no whole answer; two answers that were cut off before their end both wrote the transcript The shredder always eats first, word for word, one of them saying it had no audio; pace 1.245 words a second and 1 pause of 1 measured. Forced over: the listener wrote "", which is not the line; the listener left "whisper" unanswered; the listener left "laugh" unanswered; the listener left "warmth" unanswered; the listener left "excitement" unanswered; the listener left "unimpressedAndSmug" unanswered |
| `line.live.pinball.flipper.0` | 1 | 135 | 31 | 1 | 6.186 | 1.455 | 2 of 2 (1.228, 1.188) | 6 asks, 1 whole; transcript "It found the flippers. Hope is a powerful thing." (2 of 2); whisper 0 yes, 1 no; laugh 0 yes, 1 no; warmth 0 yes, 1 no; excitement 0 yes, 1 no; unimpressed and smug 0 yes, 1 no; attitude solemn and dramatic | yes, by force: tone not judged: 1 whole answers in 6 asks. Forced over: the listener left "whisper" unanswered; the listener left "laugh" unanswered; the listener left "warmth" unanswered; the listener left "excitement" unanswered; the listener left "unimpressedAndSmug" unanswered |
| `line.live.boss.verify.0` | 1 | 136 | 17 | 1.4 | 3.98 | 1.508 | 0 of 1 () | 6 asks, 0 whole; transcript none; whisper 0 yes, 0 no; laugh 0 yes, 0 no; warmth 0 yes, 0 no; excitement 0 yes, 0 no; unimpressed and smug 0 yes, 0 no; attitude none | no |
| `line.live.boss.slow.0` | 1 | 137 | 20 | 1.4 | 3.57 | 1.681 | 1 of 1 (1.582) | 6 asks, 3 whole; transcript "The button is winning. The button." (3 of 3); whisper 0 yes, 3 no; laugh 0 yes, 3 no; warmth 0 yes, 3 no; excitement 1 yes, 2 no; unimpressed and smug 2 yes, 1 no; attitude detached and unimpressed / smug and detached / enthusiastic and slightly dramatic | no |
| `line.live.skip.0` | 1 | 138 | 29 | 1 | 5.646 | 1.063 | 2 of 2 (1.198, 1.122) | 6 asks, 1 whole; transcript "It skips ahead. Efficient. Still unemployed." (4 of 4); whisper 0 yes, 1 no; laugh 0 yes, 1 no; warmth 0 yes, 1 no; excitement 0 yes, 1 no; unimpressed and smug 1 yes, 0 no; attitude deadpan and cynical | yes, by force: tone not judged: 1 whole answers in 6 asks. Forced over: the listener left "whisper" unanswered; the listener left "laugh" unanswered; the listener left "warmth" unanswered; the listener left "excitement" unanswered; the listener left "unimpressedAndSmug" unanswered |
| `line.live.watchFilm.0` | 1 | 139 | 22 | 1.1 | 4.018 | 1.244 | 1 of 1 (1.188) | 6 asks, 1 whole; transcript "It would rather watch. Understandable." (1 of 1); whisper 0 yes, 1 no; laugh 0 yes, 1 no; warmth 0 yes, 1 no; excitement 0 yes, 1 no; unimpressed and smug 1 yes, 0 no; attitude dry and dismissive | yes, by force: tone not judged: 1 whole answers in 6 asks. Forced over: the listener left "whisper" unanswered; the listener left "laugh" unanswered; the listener left "warmth" unanswered; the listener left "excitement" unanswered; the listener left "unimpressedAndSmug" unanswered |
| `line.live.idle.1` | 2 | 142 | 21 | 1.9 | 4.824 | 1.658 | 0 of 1 () | not asked | no |
| `line.live.hit.0` | 2 | 143 | 2 | 0 | 0.542 | 1.845 | 0 of 0 () | 2 asks, 2 whole; transcript "Hit." (2 of 2); whisper 0 yes, 2 no; laugh 0 yes, 2 no; warmth 0 yes, 2 no; excitement 0 yes, 2 no; unimpressed and smug 0 yes, 2 no; attitude abrupt and commanding / abrupt and direct | no |
| `line.live.boss.slow.0` | 2 | 144 | 20 | 1.9 | 4.192 | 1.431 | 1 of 1 (2.066) | 6 asks, 1 whole; transcript "The button is winning. The button." (1 of 1); whisper 0 yes, 1 no; laugh 0 yes, 1 no; warmth 0 yes, 1 no; excitement 0 yes, 1 no; unimpressed and smug 0 yes, 1 no; attitude deadpan and monotonous | yes, by force: tone not judged: 1 whole answers in 6 asks. Forced over: the listener left "whisper" unanswered; the listener left "laugh" unanswered; the listener left "warmth" unanswered; the listener left "excitement" unanswered; the listener left "unimpressedAndSmug" unanswered |
| `line.live.idle.1` | 3 | 153 | 21 | 2.4 | 5.162 | 1.55 | 1 of 1 (2.602) | 12 asks, 1 whole; transcript "Take your time. The job is not real." (1 of 1); whisper 0 yes, 1 no; laugh 0 yes, 1 no; warmth 0 yes, 1 no; excitement 0 yes, 1 no; unimpressed and smug 1 yes, 0 no; attitude calm and detached | yes, by force: tone not judged: 1 whole answers in 12 asks. Forced over: the listener left "whisper" unanswered; the listener left "laugh" unanswered; the listener left "warmth" unanswered; the listener left "excitement" unanswered; the listener left "unimpressedAndSmug" unanswered |
| `line.live.boss.verify.0` | 2 | 154 | 17 | 1.4 | 4.076 | 1.472 | 1 of 1 (1.602) | 6 asks, 1 whole; transcript "It claims to be human. Bold." (2 of 2); whisper 0 yes, 1 no; laugh 0 yes, 1 no; warmth 0 yes, 1 no; excitement 0 yes, 1 no; unimpressed and smug 1 yes, 0 no; attitude cynical and skeptical | yes, by force: tone not judged: 1 whole answers in 6 asks. Forced over: the listener left "whisper" unanswered; the listener left "laugh" unanswered; the listener left "warmth" unanswered; the listener left "excitement" unanswered; the listener left "unimpressedAndSmug" unanswered |

## Every effect: its prompt beside its takes

### card-flip

Prompt of card-flip take 1:

> A stiff card turning over on a hard surface, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `card-flip` | 1 |  | 6 | 0.5 | no | -21.45 | 3 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A stiff card turning over on a hard surface. / A stiff card is flipped over and slaps against a hard surface. | yes |

### room-tone

Prompt of room-tone take 1:

> The air of a quiet empty carpeted office room at night, a very soft steady hush of air, no hum, no clicks, no events, nothing else, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `room-tone` | 1 | 33 | 220 | 20 | yes | -58.67 | 2 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A continuous, faint hiss of ambient room tone is heard. / The recording contains only a very faint, continuous room tone or silence. | yes |

### step

Prompt of step.1 take 1, step.2 take 1, step.3 take 1, step.4 take 1:

> One soft tap of a small glossy enamel coated metal tip on a glazed ceramic tile, a single light tick, very close microphone, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `step.1` | 1 | 34 | 6 | 0.5 | no | -40.11 | 6 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A single, high-pitched clink of a hard object striking another. / A single, clear tap of a hard object against a ceramic surface. | yes |
| `step.2` | 1 | 35 | 6 | 0.5 | no | -16.44 | 3 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A single soft clink is heard. / A single soft clink or tap of a hard object against tableware. | yes |
| `step.3` | 1 | 36 | 6 | 0.5 | no | -48.93 | 4 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A single, sharp tap of a hard object against a ceramic surface. / A single, sharp clink is produced by a light impact between two hard, brittle surfaces. | yes |
| `step.4` | 1 | 37 | 6 | 0.5 | no | -9.78 | 2 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A single, sharp clink of a hard object lightly striking a ceramic surface. / A single soft tap of an enamel object striking a ceramic surface. | yes |

### button-press

Prompt of button-press take 1:

> One large glossy plastic push button the size of a palm pressed down and bottoming out with a solid low clunk, a single press, close microphone, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `button-press` | 1 | 38 | 6 | 0.5 | no | -43.45 | 2 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A sharp, quick click of a button being pressed. / A sharp mechanical click occurs as a button is pressed. | yes |

### page-turn

Prompt of page-turn take 1:

> A heavy ceramic slab the size of a tabletop turning over, a low rush of air, then one solid knock as it seats, close microphone, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

Prompt of page-turn take 2:

> A heavy stone slab the size of a tabletop flipping over on a pivot, a low whoosh of displaced air, then one solid ceramic knock as it seats, close microphone, no body sounds, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `page-turn` | 1 | 39 | 13 | 1.2 | no | -10.76 | 3 asks, 2 whole; fits 0 yes, 2 no; voice 2 yes, 0 no; music 0 yes, 2 no; heard: A male belches. / A person lets out a single, distinct burp. | no |
| `page-turn` | 2 | 145 | 13 | 1.2 | no | -7.58 | 6 asks, 1 whole; fits 1 yes, 0 no; voice 0 yes, 1 no; music 0 yes, 1 no; heard: A heavy object moves through the air and lands with a solid impact. | yes, by force: not judged by ear: 1 whole answers in 6 asks. Forced over: the listener left "voice" unanswered; the listener left "word" unanswered; the listener left "music" unanswered; the listener left "melody" unanswered; the listener left "fits" unanswered |

### keyboard-rise

Prompt of keyboard-rise take 1:

> A brushed aluminium deck sliding up out of a slot on smooth rails and stopping with a soft metal stop, close microphone, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `keyboard-rise` | 1 | 40 | 11 | 1 | no | -35 | 4 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A metallic object sliding and abruptly clicking to a stop. / A short, sharp metallic scraping sound followed by a sudden stop or click. | yes |

### key-press

Prompt of key-press.1 take 1, key-press.2 take 1, key-press.3 take 1, key-press.4 take 1, key-press.5 take 1, key-press.6 take 1:

> One mechanical keyboard key cap pressed down and released, a single crisp plastic click, very close microphone, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `key-press.1` | 1 | 41 | 6 | 0.5 | no | -7.72 | 6 asks, 1 whole; fits 1 yes, 0 no; voice 0 yes, 1 no; music 0 yes, 1 no; heard: A mechanical keyboard key is pressed down and then released. | yes, by force: not judged by ear: 1 whole answers in 6 asks. Forced over: the listener left "voice" unanswered; the listener left "word" unanswered; the listener left "music" unanswered; the listener left "melody" unanswered; the listener left "fits" unanswered |
| `key-press.2` | 1 | 42 | 6 | 0.5 | no | -10.18 | 5 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A mechanical keyboard key is pressed down and released. / A single mechanical keyboard key is pressed down and released. | yes |
| `key-press.3` | 1 | 43 | 6 | 0.5 | no | -13.36 | 5 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A single mechanical keyboard key is pressed down and then released. / A single mechanical keyboard key is pressed down and released. | yes |
| `key-press.4` | 1 | 44 | 6 | 0.5 | no | -0.74 | 3 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A single press and release of a mechanical keyboard key. / A mechanical keyboard key is pressed down and released. | yes |
| `key-press.5` | 1 | 45 | 6 | 0.5 | no | -2.08 | 4 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A single mechanical key is pressed down and springs back up. / A single mechanical keyboard key is pressed down and released. | yes |
| `key-press.6` | 1 | 46 | 6 | 0.5 | no | -49.15 | 2 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A single mechanical keyboard key is pressed down and then released. / A mechanical keyboard key is pressed down and released. | yes |

### turret-rise

Prompt of turret-rise take 1:

> A small metal hatch flipping open, then a small servo motor lifting a part with a short whirr, close microphone, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `turret-rise` | 1 | 47 | 7 | 0.6 | no | -34.39 | 4 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A motorized servo whirs and engages with a distinct mechanical click. / A mechanical click of a latch opening followed by the distinct whirring of a small servo motor. | yes |

### bolt-fire

Prompt of bolt-fire.1 take 1, bolt-fire.2 take 1, bolt-fire.3 take 1:

> One short tight energy bolt shot, a quick dry zap like a small toy laser, small, not a cannon, a single shot, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `bolt-fire.1` | 1 | 48 | 6 | 0.5 | no | -2.62 | 5 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A short, synthesized laser or energy weapon sound effect is heard. / A quick, synthesized laser blast or energy shot. | yes, by force: clipped as delivered: true peak 1.43 dB. Forced over: the take is clipped: its true peak is 1.43 dB |
| `bolt-fire.2` | 1 | 49 | 6 | 0.5 | no | -12.57 | 5 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A short, synthesized retro laser or energy blast sound. / A short, synthesized sound effect resembling a retro sci-fi laser or energy weapon blast. | yes |
| `bolt-fire.3` | 1 | 50 | 6 | 0.5 | no | -21.19 | 6 asks, 0 whole; fits 0 yes, 0 no; voice 0 yes, 0 no; music 0 yes, 0 no; heard: nothing | yes, by force: not judged by ear: 0 whole answers in 6 asks. Forced over: the listener left "voice" unanswered; the listener left "word" unanswered; the listener left "music" unanswered; the listener left "melody" unanswered; the listener left "fits" unanswered |

### bolt-hit

Prompt of bolt-hit.1 take 1, bolt-hit.2 take 1, bolt-hit.3 take 1:

> One hot sharp crack of a small energy bolt striking hard plastic, a single dry snap with a tiny sizzle, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `bolt-hit.1` | 1 | 51 | 6 | 0.5 | no | 0.97 | 6 asks, 1 whole; fits 1 yes, 0 no; voice 0 yes, 1 no; music 0 yes, 1 no; heard: A single sharp crack or click. | yes, by force: clipped as delivered: true peak 1.21 dB; not judged by ear: 1 whole answers in 6 asks. Forced over: the listener left "voice" unanswered; the listener left "word" unanswered; the listener left "music" unanswered; the listener left "melody" unanswered; the listener left "fits" unanswered; the take is clipped: its true peak is 1.21 dB |
| `bolt-hit.2` | 1 | 52 | 6 | 0.5 | no | -17.98 | 6 asks, 1 whole; fits 1 yes, 0 no; voice 0 yes, 1 no; music 0 yes, 1 no; heard: A single, sharp crack or click sound. | yes, by force: not judged by ear: 1 whole answers in 6 asks. Forced over: the listener left "voice" unanswered; the listener left "word" unanswered; the listener left "music" unanswered; the listener left "melody" unanswered; the listener left "fits" unanswered |
| `bolt-hit.3` | 1 | 53 | 6 | 0.5 | no | -21.73 | 3 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A sharp, resonant cracking sound is heard. / A sharp, sudden cracking sound as if hard plastic or ceramic is snapping. | yes |

### sizzle

Prompt of sizzle take 1:

> A small burn hole fizzing out on plastic, a quiet short sizzle that dies away, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `sizzle` | 1 | 54 | 13 | 1.2 | no | -27.89 | 2 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A short sizzling or fizzing sound. / A short sizzling sound like a small burn fizzing out. | yes |

### keys-shuffle

Prompt of keys-shuffle take 1:

> Many plastic keyboard key caps clattering quickly as they change places on a metal tray, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `keys-shuffle` | 1 | 55 | 8 | 0.7 | no | -5.05 | 6 asks, 0 whole; fits 0 yes, 0 no; voice 0 yes, 0 no; music 0 yes, 0 no; heard: nothing | yes, by force: not judged by ear: 0 whole answers in 6 asks. Forced over: the listener left "voice" unanswered; the listener left "word" unanswered; the listener left "music" unanswered; the listener left "melody" unanswered; the listener left "fits" unanswered |

### slab-drop

Prompt of slab-drop.1 take 1, slab-drop.2 take 1, slab-drop.3 take 1, slab-drop.2 take 2, slab-drop.3 take 2, slab-drop.3 take 3, slab-drop.2 take 3:

> One very heavy ceramic block landing flat on a ceramic floor, a single deep hard thud, close microphone, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `slab-drop.1` | 1 | 56 | 9 | 0.8 | no | -2.43 | 4 asks, 3 whole; fits 2 yes, 1 no; voice 0 yes, 3 no; music 0 yes, 3 no; heard: A heavy object makes a single, deep thud as it lands on a hard surface. / A single, abrupt thud of a solid object hitting a hard surface. / A heavy block lands flat on a hard surface. | yes |
| `slab-drop.2` | 1 | 57 | 9 | 0.8 | no | -24.58 | 5 asks, 2 whole; fits 0 yes, 2 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A short, synthesized descending tone resembling a sci-fi sound effect. / A single, high-pitched metallic ding like a small service bell being struck. | no |
| `slab-drop.3` | 1 | 58 | 9 | 0.8 | no | -26.2 | 12 asks, 2 whole; fits 1 yes, 1 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A single, heavy, muffled thud or dull impact. / A heavy solid block lands flatly on a hard surface. | no |
| `slab-drop.2` | 2 | 146 | 9 | 0.8 | no | -25.83 | 8 asks, 3 whole; fits 1 yes, 2 no; voice 0 yes, 3 no; music 0 yes, 3 no; heard: A single sharp tap of a small hard object against a surface. / A heavy block dropping flat onto a hard surface. / A single sharp strike on a wooden block. | no |
| `slab-drop.3` | 2 | 157 | 9 | 0.8 | no | -3.63 | 3 asks, 2 whole; fits 0 yes, 2 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A single, sharp impact sound, resembling a small piece of wood or hard plastic being struck. / A single, brief, high-pitched plink sound resembling a water droplet. | no |
| `slab-drop.3` | 3 | 158 | 9 | 0.8 | no | -35.39 | 3 asks, 3 whole; fits 3 yes, 0 no; voice 0 yes, 3 no; music 0 yes, 3 no; heard: A heavy object forcefully drops and lands flat on a resonant hard surface. / A heavy object forcefully drops and lands flat on a hard, resonant surface. / A heavy solid block landing flatly with a loud thud on a hard floor. | yes |
| `slab-drop.2` | 3 | 161 | 9 | 0.8 | no | -6.62 | 6 asks, 3 whole; fits 3 yes, 0 no; voice 0 yes, 3 no; music 0 yes, 3 no; heard: A solid object strikes a hard surface with a single, resonant thwack. / A very heavy block drops and lands flat on a hard ceramic surface. / A heavy object dropping onto a hard surface. | yes |

### paper-slide

Prompt of paper-slide take 1:

> One sheet of paper sliding across a hard smooth desk, a single short soft hiss, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `paper-slide` | 1 | 59 | 7 | 0.6 | no | -14.64 | 3 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A sheet of paper slides across a hard surface. / A sheet of paper slides continuously across a hard surface. | yes |

### shredder

Prompt of shredder take 1:

> A small office paper shredder running steadily under load, its motor grinding through paper, a constant whirr, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `shredder` | 1 | 60 | 44 | 4 | yes | -8.8 | 2 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: An electric office shredder running continuously under a load. / An office paper shredder is running under load. | yes |

### paper-strain

Prompt of paper-strain take 1:

> A sheet of paper pulled tight between two grips, creaking and straining, quiet dry fibrous creaks, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `paper-strain` | 1 | 61 | 17 | 1.5 | no | -29.79 | 2 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A piece of paper creaks sharply as it is pulled tight. / A piece of thick paper is pulled tight, producing a strained, creaking noise. | yes |

### strips-zip

Prompt of strips-zip take 1:

> Many thin paper strips zipping back together quickly, a fast rising papery zip, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

Prompt of strips-zip take 2, strips-zip take 3:

> Many thin paper strips snapping back together side by side in one quick run, a fast rising papery flutter and rustle, paper only, no metal, no zipper, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `strips-zip` | 1 | 62 | 11 | 1 | no | -14.81 | 2 asks, 2 whole; fits 0 yes, 2 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A zipper is quickly pulled open or closed in a single motion. / A zipper is quickly pulled closed. | no |
| `strips-zip` | 2 | 147 | 11 | 1 | no | -8.5 | 2 asks, 2 whole; fits 0 yes, 2 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: Someone rapidly flipping through the pages of a book. / A rapid riffling or flipping through the pages of a small book or notepad. | yes, by force: three takes used and no take fits by the listener; take 2 is the only one heard as paper (flipping the pages of a book, 0 of 2 fits), take 1 was a metal zipper, take 3 a wrapper, a zipper or Velcro (0 of 3). Forced over: the listener says it does not fit the line that describes the cue |
| `strips-zip` | 3 | 159 | 11 | 1 | no | -11.19 | 3 asks, 3 whole; fits 0 yes, 3 no; voice 0 yes, 3 no; music 0 yes, 3 no; heard: A thin plastic wrapper is torn open. / A zipper is rapidly opened or closed. / A short, rapid ripping sound, much like a strip of Velcro being quickly pulled apart. | no |

### row-open

Prompt of row-open take 1:

> A small drawer mechanism sliding open and stopping with a soft thunk, a single short movement, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `row-open` | 1 | 63 | 7 | 0.6 | no | -23.19 | 3 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A drawer slides open and stops with a soft thud. / A drawer is opened, producing a sliding noise that ends with a soft thunk. | yes |

### dial-wind

Prompt of dial-wind take 1:

> A rotary telephone dial pulled round by a finger against its spring, a single ratcheting pull, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `dial-wind` | 1 | 64 | 9 | 0.8 | no | -8.5 | 3 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A rotary phone dial is pulled around and released to spin back to its starting position. / A rotary phone dial is pulled round and released to spin back. | yes |

### dial-return

Prompt of dial-return take 1:

> A rotary telephone dial let go and running back to rest, a fast mechanical purr ending in a soft stop, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `dial-return` | 1 | 65 | 10 | 0.9 | no | -2.1 | 3 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: The mechanical purring and rapid clicking of a rotary phone dial returning to its resting position. / A rapid, mechanical purring and clicking sound is heard as a spring-loaded mechanism returns to its resting place. | yes |

### lever-pull

Prompt of lever-pull take 1:

> A mechanical slot machine lever pulled down and released, a heavy metal ratchet and a spring clunk, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `lever-pull` | 1 | 66 | 8 | 0.7 | no | -12.11 | 5 asks, 3 whole; fits 2 yes, 1 no; voice 0 yes, 3 no; music 0 yes, 3 no; heard: A mechanical lever is pulled and released. / A very brief mechanical click or snap. / A mechanical lever is pulled down and released. | yes |

### reels-spin

Prompt of reels-spin take 1:

> Three mechanical slot machine reels spinning with a whirr and stopping one after another with three separate clunks, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `reels-spin` | 1 | 67 | 28 | 2.5 | no | -11.36 | 2 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: Three mechanical reels spin rapidly and sequentially click to a stop. / A mechanical slot machine is activated, causing its reels to spin before stopping with three sequential clunks. | yes |

### coins

Prompt of coins.1 take 1, coins.2 take 1:

> A burst of metal coins pouring out and scattering on a hard metal tray, bright clinking, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `coins.1` | 1 | 68 | 17 | 1.5 | no | -5.57 | 2 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A burst of metal coins is dropped and scatters across a hard surface. / A handful of metal coins bursts out and scatters across a hard surface. | yes |
| `coins.2` | 1 | 69 | 17 | 1.5 | no | -7.28 | 2 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: Multiple metallic items drop and scatter across a hard surface. / A collection of metallic objects hits a hard surface and scatters. | yes |

### crank-turn

Prompt of crank-turn take 1:

> One turn of a small geared metal hand crank, ratcheting clicks, a single turn, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `crank-turn` | 1 | 70 | 9 | 0.8 | no | -1.91 | 3 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A geared hand crank is turned, producing a mechanical ratcheting sound. / A geared hand crank is turned, producing a mechanical ratcheting sound. | yes |

### crank-runaway

Prompt of crank-runaway take 1:

> A small geared metal hand crank spinning faster and faster out of control, its ratchet clicks speeding up into a rattle, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `crank-runaway` | 1 | 71 | 22 | 2 | no | -8.56 | 2 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A mechanical crank or ratchet spins rapidly, its clicking accelerating as if losing control. / A mechanical crank or ratchet rapidly spins and accelerates, producing a continuous, high-speed clicking sound. | yes |

### flatten

Prompt of flatten take 1:

> A short wet flat comic splat, something soft slapped flat on a hard tile, a single splat, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `flatten` | 1 | 72 | 6 | 0.5 | no | -24.71 | 4 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A single, short, and comical wet splat sound is heard. / A short, wet splat sound. | yes |

### peel-up

Prompt of peel-up take 1:

> Something thin and rubbery peeling off a smooth glass surface and popping back to shape, a short peel then a small pop, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `peel-up` | 1 | 73 | 7 | 0.6 | no | -24.01 | 3 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A thin object is peeled off a smooth surface and sharply pops back into shape. / A thin material peeling off a surface and then snapping or popping back into place. | yes |

### ball-seal

Prompt of ball-seal take 1:

> A short suck of air, then a hard clear plastic shell snapping shut with one firm click, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `ball-seal` | 1 | 74 | 11 | 1 | no | -7.32 | 3 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A short suck of air is followed by a hard plastic shell snapping shut with a click. / A short intake of air is immediately followed by a sharp click of a plastic shell snapping shut. | yes |

### tube-run

Prompt of tube-run take 1:

> A hard plastic ball rolling fast down a hollow plastic tube, a rattling hollow roll, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `tube-run` | 1 | 75 | 17 | 1.5 | no | -23.5 | 3 asks, 3 whole; fits 2 yes, 1 no; voice 0 yes, 3 no; music 0 yes, 3 no; heard: A hard plastic ball rolls rapidly down a plastic tube. / A rapid riffling or shuffling of a deck of cards or thick paper pages. / A hard plastic ball rolling rapidly down a corrugated plastic tube. | yes |

### lights-down

Prompt of lights-down take 1:

> The lights of a big room dimming, a low electrical hum falling in pitch and one relay clack, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `lights-down` | 1 | 76 | 17 | 1.5 | no | -19.95 | 6 asks, 3 whole; fits 2 yes, 1 no; voice 0 yes, 3 no; music 0 yes, 3 no; heard: A sharp mechanical click, such as flipping a firm light switch or pressing a heavy button. / A distinct mechanical click is followed immediately by a low, fading electrical hum. / A mechanical relay clicks followed by a low, descending electrical hum. | yes |

### power-on

Prompt of power-on take 1:

> A pinball machine powering up, relays clacking, a transformer hum rising, then a short start up chime struck on mechanical bells, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `power-on` | 1 | 77 | 28 | 2.5 | no | -12.77 | 2 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A pinball machine powers up with the sound of clicking relays, an electrical hum, and a mechanical bell chime. / A machine powers up with a sequence of clicking relays, a low electrical hum, and a chime of mechanical bells. | yes |

### plunger

Prompt of plunger take 1:

> A pinball spring plunger pulled back and released, the spring twanging and the rod knocking into a hard plastic ball, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `plunger` | 1 | 78 | 9 | 0.8 | no | -17.69 | 2 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A tensioned spring plunger is released and sharply strikes a hard plastic ball. / A spring-loaded plunger is pulled back with a ratcheting noise and suddenly released to strike a hard object. | yes |

### bumper

Prompt of bumper.1 take 1, bumper.2 take 1, bumper.3 take 1, bumper.4 take 1:

> One pinball pop bumper firing, a sharp solenoid thwack with a single bell ding, one hit, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `bumper.1` | 1 | 79 | 6 | 0.5 | no | -61.65 | 6 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A mechanical solenoid forcefully engages with a sharp clack alongside a ringing bell. / A single pinball machine pop bumper firing with a mechanical thwack and a bell ring. | yes |
| `bumper.2` | 1 | 80 | 6 | 0.5 | no | -33.24 | 6 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A sharp mechanical solenoid strike sounding simultaneously with a brief bell chime. / A mechanical solenoid thwacks and a metal bell rings, characteristic of a pinball machine pop bumper. | yes |
| `bumper.3` | 1 | 81 | 6 | 0.5 | no | -44.81 | 5 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A sharp mechanical thwack followed immediately by a ringing bell. / A sharp mechanical thwack of a solenoid firing accompanied by a brief bell ring. | yes |
| `bumper.4` | 1 | 82 | 6 | 0.5 | no | -3.75 | 5 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A mechanical solenoid thwacks and simultaneously strikes a small bell. / A pinball pop bumper fires, producing a distinct mechanical thwack and a ringing bell. | yes |

### scoop-kick

Prompt of scoop-kick take 1:

> A ball dropping into a hole in a pinball table and kicked out by a solenoid, a clunk then a sharp kick, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `scoop-kick` | 1 | 83 | 7 | 0.6 | no | -9.12 | 2 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A hard ball drops into a mechanism and is immediately struck and ejected. / A ball dropping into a hole and being forcefully ejected by a mechanical mechanism. | yes |

### flasher

Prompt of flasher take 1:

> One electrical relay click and the snap of a bright flash lamp firing, a single short tick and snap, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `flasher` | 1 | 84 | 6 | 0.5 | no | -1.32 | 6 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A sharp mechanical click and snap of an electrical switch or relay. / A sharp mechanical click followed immediately by a distinct electrical snap. | yes |

### ramp-roll

Prompt of ramp-roll take 1:

> A hard plastic ball rolling fast along a steel wire ramp of a pinball table, a ringing metallic roll, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `ramp-roll` | 1 | 85 | 22 | 2 | no | -15.56 | 2 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A hard plastic ball rolls rapidly along a wire ramp. / A hard plastic ball rolls rapidly along a metallic wire ramp. | yes |

### ball-drop

Prompt of ball-drop take 1:

> One steel ball dropping onto a wooden board, a single hard knock, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `ball-drop` | 1 | 86 | 6 | 0.5 | no | -1.19 | 6 asks, 1 whole; fits 1 yes, 0 no; voice 0 yes, 1 no; music 0 yes, 1 no; heard: A single sharp impact of a hard object striking a solid surface. | yes, by force: not judged by ear: 1 whole answers in 6 asks. Forced over: the listener left "voice" unanswered; the listener left "word" unanswered; the listener left "music" unanswered; the listener left "melody" unanswered; the listener left "fits" unanswered |

### flipper

Prompt of flipper.1 take 1, flipper.2 take 1, flipper.3 take 1:

> One pinball flipper firing, a single sharp solenoid snap and the slap of a plastic bat, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `flipper.1` | 1 | 87 | 6 | 0.5 | no | -24.56 | 2 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A sharp mechanical click or snap, resembling a pinball flipper firing. / A single mechanical click of a pinball machine flipper engaging is heard. | yes |
| `flipper.2` | 1 | 88 | 6 | 0.5 | no | 0.6 | 4 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A single mechanical flipper firing. / A sharp, mechanical clacking sound of a single pinball machine flipper firing. | yes, by force: clipped as delivered: true peak 0.81 dB. Forced over: the take is clipped: its true peak is 0.81 dB |
| `flipper.3` | 1 | 89 | 6 | 0.5 | no | -29.98 | 3 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A sharp, quick mechanical snap or impact sound. / A single mechanical clack of a pinball flipper firing. | yes |

### doors-slam

Prompt of doors-slam take 1:

> Two heavy glass doors slamming shut together, one deep slam with a rattle of glass in metal frames, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `doors-slam` | 1 | 90 | 7 | 0.6 | no | -4.74 | 5 asks, 3 whole; fits 2 yes, 1 no; voice 0 yes, 3 no; music 0 yes, 3 no; heard: Two heavy glass doors slam shut one after the other. / A single heavy thud, such as a thick book dropping on a wooden surface or a wooden door slamming. / Two heavy glass doors slamming shut in quick succession. | yes |

### drain

Prompt of drain take 1:

> A pinball rolling down the drain and dropping into the trough with a clunk, with a falling run of mechanical bells, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `drain` | 1 | 91 | 13 | 1.2 | no | -9.43 | 3 asks, 3 whole; fits 3 yes, 0 no; voice 0 yes, 3 no; music 2 yes, 1 no; heard: A rapid, descending sequence of metallic bell tones. / A ball rolls down a hollow surface and lands, accompanied by a descending cascade of bell chimes. / A small object rolls down a descending path, rapidly striking metallic elements to create a cascading, bell-like glissando. | yes, by force: the listener names its falling bells as music and melody (2 of 3) and says it fits its row (3 of 3); the row itself asks for a falling tone of bells, so the melody answer is the row, not a fault. Forced over: the listener heard music; the listener heard melody |

### tier-fall

Prompt of tier-fall take 1:

> A ball dropping down a short metal chute and landing on a wooden board, a metallic rattle then a knock, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `tier-fall` | 1 | 92 | 9 | 0.8 | no | -17.94 | 6 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A hard object rolls down a metallic surface and culminates in a hollow thump against a wooden surface. / A small solid object rolls down a metal slide and hits a wooden surface. | yes |

### lift

Prompt of lift take 1:

> A ball sucked up a tube by air, a rising whoosh of air ending in a soft pop at the top, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `lift` | 1 | 93 | 11 | 1 | no | -10.61 | 2 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A rising whooshing sound of air culminating in a distinct, soft pop. / A continuous rising whistling sound that abruptly ends with a soft pop. | yes |

### spiral

Prompt of spiral take 1:

> A hard plastic ball rolling round and round down a plastic spiral ramp, slowing as it goes, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `spiral` | 1 | 94 | 22 | 2 | no | -14.53 | 3 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A hard ball rolls continuously along a resonant track. / A hard plastic ball is heard rolling around and down a plastic spiral, gradually slowing to a stop. | yes |

### spinner

Prompt of spinner take 1:

> A pinball spinner target hit hard and spinning down, fast metallic ticking that slows, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `spinner` | 1 | 95 | 9 | 0.8 | no | -12.06 | 2 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A mechanical spinner ticking rapidly and slowing down to a stop. / A mechanical pinball spinner is struck hard and rapidly ticks as it gradually spins down. | yes |

### drop-target

Prompt of drop-target.1 take 1, drop-target.2 take 1:

> One pinball drop target knocked down, a single flat plastic clack, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `drop-target.1` | 1 | 96 | 6 | 0.5 | no | -2.53 | 5 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A single flat plastic clack is heard, characteristic of a pinball drop target being knocked down. / A single, sharp, flat clack of a plastic object being struck. | yes |
| `drop-target.2` | 1 | 97 | 6 | 0.5 | no | -25.41 | 5 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A single, sharp, flat plastic clack. / A sharp, brief clack of a mechanical plastic piece snapping down. | yes |

### sling

Prompt of sling.1 take 1, sling.2 take 1:

> One pinball slingshot firing, a single short rubber snap, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `sling.1` | 1 | 98 | 6 | 0.5 | no | -21.62 | 6 asks, 1 whole; fits 1 yes, 0 no; voice 0 yes, 1 no; music 0 yes, 1 no; heard: A short rubber snap of a pinball slingshot firing. | yes, by force: not judged by ear: 1 whole answers in 6 asks. Forced over: the listener left "voice" unanswered; the listener left "word" unanswered; the listener left "music" unanswered; the listener left "melody" unanswered; the listener left "fits" unanswered |
| `sling.2` | 1 | 99 | 6 | 0.5 | no | -22.93 | 6 asks, 1 whole; fits 1 yes, 0 no; voice 0 yes, 1 no; music 0 yes, 1 no; heard: A short, snappy mechanical rubber strike occurs. | yes, by force: not judged by ear: 1 whole answers in 6 asks. Forced over: the listener left "voice" unanswered; the listener left "word" unanswered; the listener left "music" unanswered; the listener left "melody" unanswered; the listener left "fits" unanswered |

### ball-open

Prompt of ball-open take 1:

> A hard clear plastic shell cracking open and its two halves rattling on a hard floor, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `ball-open` | 1 | 100 | 8 | 0.7 | no | -15.2 | 6 asks, 0 whole; fits 0 yes, 0 no; voice 0 yes, 0 no; music 0 yes, 0 no; heard: nothing | yes, by force: not judged by ear: 0 whole answers in 6 asks. Forced over: the listener left "voice" unanswered; the listener left "word" unanswered; the listener left "music" unanswered; the listener left "melody" unanswered; the listener left "fits" unanswered |

### checkbox

Prompt of checkbox take 1:

> A small crisp tick, a tiny plastic switch clicking once, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `checkbox` | 1 | 101 | 6 | 0.5 | no | -5.85 | 6 asks, 1 whole; fits 1 yes, 0 no; voice 0 yes, 1 no; music 0 yes, 1 no; heard: A single short, crisp tick or click. | yes, by force: not judged by ear: 1 whole answers in 6 asks. Forced over: the listener left "voice" unanswered; the listener left "word" unanswered; the listener left "music" unanswered; the listener left "melody" unanswered; the listener left "fits" unanswered |

### button-crack

Prompt of button-crack take 1:

> Hard plastic and ceramic cracking and splintering as a large button tears loose from its housing, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

Prompt of button-crack take 2:

> A thick ceramic plate and hard plastic cracking and breaking apart as a large button is torn out of its housing, sharp cracks then small falling fragments, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `button-crack` | 1 | 102 | 11 | 1 | no | -13.45 | 2 asks, 2 whole; fits 0 yes, 2 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A hard plastic buckle or clip snapping shut. / A quick ripping or tearing sound, similar to Velcro being pulled apart or tape being ripped off. | no |
| `button-crack` | 2 | 148 | 11 | 1 | no | -5.37 | 5 asks, 3 whole; fits 2 yes, 1 no; voice 0 yes, 3 no; music 0 yes, 3 no; heard: A quick, sharp ripping sound similar to pulling apart Velcro or adhesive tape. / A sharp, rapid ripping and cracking noise, like a piece of heavy tape being torn or stiff material snapping loose. / Plastic and ceramic crack and break as something tears loose. | yes |

### unfold

Prompt of unfold take 1:

> Metal plates and joints unfolding and locking into place one after another with small servo motors whirring, a machine putting itself together, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `unfold` | 1 | 103 | 22 | 2 | no | -10.9 | 2 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: Mechanical sounds of metal parts moving, sliding, and locking into place. / Metal plates and joints unfolding and locking with servo sounds. | yes |

### boss-loop

Prompt of boss-loop take 1:

> A short loop of tense, slightly silly fight music, a fast plucked string and staccato bassoon figure over a snare drum march, comic cartoon chase tension, steady tempo, close and dry, recorded in a quiet room, real materials, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `boss-loop` | 1 | 104 | 88 | 8 | yes | -11.62 | 2 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 2 yes, 0 no; heard: A short, fast-paced, and slightly silly piece of tense music plays. / A short, quirky, and slightly tense synthesized musical loop. | yes |

### dart-fire

Prompt of dart-fire.1 take 1, dart-fire.2 take 1, dart-fire.3 take 1, dart-fire.4 take 1:

> One tiny bright pew, almost a click, a very small toy dart launcher firing once, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `dart-fire.1` | 1 | 105 | 6 | 0.5 | no | -14.03 | 6 asks, 1 whole; fits 1 yes, 0 no; voice 0 yes, 1 no; music 0 yes, 1 no; heard: A single, brief, high-pitched electronic ping or click. | yes, by force: not judged by ear: 1 whole answers in 6 asks. Forced over: the listener left "voice" unanswered; the listener left "word" unanswered; the listener left "music" unanswered; the listener left "melody" unanswered; the listener left "fits" unanswered |
| `dart-fire.2` | 1 | 106 | 6 | 0.5 | no | -16.33 | 3 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A single, very brief and high-pitched synthetic click or zap. / A single, sharp, high-pitched mechanical click or pew sound is heard. | yes |
| `dart-fire.3` | 1 | 107 | 6 | 0.5 | no | -19.25 | 6 asks, 1 whole; fits 1 yes, 0 no; voice 0 yes, 1 no; music 0 yes, 1 no; heard: A single, very brief and high-pitched synthetic sound effect is played. | yes, by force: not judged by ear: 1 whole answers in 6 asks. Forced over: the listener left "voice" unanswered; the listener left "word" unanswered; the listener left "music" unanswered; the listener left "melody" unanswered; the listener left "fits" unanswered |
| `dart-fire.4` | 1 | 108 | 6 | 0.5 | no | -12.45 | 6 asks, 1 whole; fits 1 yes, 0 no; voice 0 yes, 1 no; music 0 yes, 1 no; heard: A short, high-pitched synthetic blip or pew sound. | yes, by force: not judged by ear: 1 whole answers in 6 asks. Forced over: the listener left "voice" unanswered; the listener left "word" unanswered; the listener left "music" unanswered; the listener left "melody" unanswered; the listener left "fits" unanswered |

### dart-hit

Prompt of dart-hit.1 take 1, dart-hit.2 take 1, dart-hit.3 take 1, dart-hit.4 take 1, dart-hit.4 take 2, dart-hit.4 take 3:

> One small dart striking a metal plate, a tiny bright tick with a spark, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `dart-hit.1` | 1 | 109 | 6 | 0.5 | no | -24.29 | 6 asks, 1 whole; fits 1 yes, 0 no; voice 0 yes, 1 no; music 0 yes, 1 no; heard: A single, extremely brief and sharp click resembling a spark. | yes, by force: not judged by ear: 1 whole answers in 6 asks. Forced over: the listener left "voice" unanswered; the listener left "word" unanswered; the listener left "music" unanswered; the listener left "melody" unanswered; the listener left "fits" unanswered |
| `dart-hit.2` | 1 | 110 | 6 | 0.5 | no | -46.86 | 3 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A single, sharp, high-pitched metallic ping or spark. / A sharp, brief metallic clink or snapping sound. | yes |
| `dart-hit.3` | 1 | 111 | 6 | 0.5 | no | -55.08 | 2 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A brief, sharp snap or click is heard, resembling a tiny electrical discharge hitting a hard surface. / A single, brief, high-pitched metallic clink or strike. | yes |
| `dart-hit.4` | 1 | 112 | 6 | 0.5 | no | -45.63 | 6 asks, 0 whole; fits 0 yes, 0 no; voice 0 yes, 0 no; music 0 yes, 0 no; heard: nothing | no |
| `dart-hit.4` | 2 | 149 | 6 | 0.5 | no | -38.58 | 6 asks, 0 whole; fits 0 yes, 0 no; voice 0 yes, 0 no; music 0 yes, 0 no; heard: nothing | no |
| `dart-hit.4` | 3 | 160 | 6 | 0.5 | no | -45.01 | 5 asks, 3 whole; fits 3 yes, 0 no; voice 0 yes, 3 no; music 0 yes, 3 no; heard: A single, high-pitched metallic ping or spark sound. / A very brief and sharp metallic click or strike is heard. / A very brief, faint snapping or clicking sound. | yes |

### slab-fire

Prompt of slab-fire.1 take 1, slab-fire.2 take 1, slab-fire.3 take 1:

> One heavy stone block launched hard by a machine, a deep pneumatic thump and a short rush of air, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `slab-fire.1` | 1 | 113 | 6 | 0.5 | no | -31.79 | 6 asks, 0 whole; fits 0 yes, 0 no; voice 0 yes, 0 no; music 0 yes, 0 no; heard: nothing | yes, by force: not judged by ear: 0 whole answers in 6 asks. Forced over: the listener left "voice" unanswered; the listener left "word" unanswered; the listener left "music" unanswered; the listener left "melody" unanswered; the listener left "fits" unanswered |
| `slab-fire.2` | 1 | 114 | 6 | 0.5 | no | -15.99 | 6 asks, 0 whole; fits 0 yes, 0 no; voice 0 yes, 0 no; music 0 yes, 0 no; heard: nothing | yes, by force: not judged by ear: 0 whole answers in 6 asks. Forced over: the listener left "voice" unanswered; the listener left "word" unanswered; the listener left "music" unanswered; the listener left "melody" unanswered; the listener left "fits" unanswered |
| `slab-fire.3` | 1 | 115 | 6 | 0.5 | no | -23.33 | 6 asks, 1 whole; fits 1 yes, 0 no; voice 0 yes, 1 no; music 0 yes, 1 no; heard: A heavy wooden block forcefully strikes a hard surface. | yes, by force: not judged by ear: 1 whole answers in 6 asks. Forced over: the listener left "voice" unanswered; the listener left "word" unanswered; the listener left "music" unanswered; the listener left "melody" unanswered; the listener left "fits" unanswered |

### popup

Prompt of popup.1 take 1, popup.2 take 1, popup.3 take 1, popup.1 take 2, popup.2 take 2:

> A flat rigid plastic panel snapping upright on a spring hinge, a single quick flap and clack, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `popup.1` | 1 | 116 | 6 | 0.5 | no | -36.73 | 6 asks, 0 whole; fits 0 yes, 0 no; voice 0 yes, 0 no; music 0 yes, 0 no; heard: nothing | no |
| `popup.2` | 1 | 117 | 6 | 0.5 | no | -38.01 | 6 asks, 1 whole; fits 1 yes, 0 no; voice 0 yes, 1 no; music 0 yes, 1 no; heard: A flat panel snapping upright. | no |
| `popup.3` | 1 | 118 | 6 | 0.5 | no | -46.37 | 2 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A sharp snap is heard as a flat panel locks into an upright position. / A sharp snap or click, like a flat panel snapping upright. | yes |
| `popup.1` | 2 | 150 | 6 | 0.5 | no | -10.41 | 6 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A flat panel snaps sharply into an upright position. / A sharp, quick mechanical snapping sound. | yes |
| `popup.2` | 2 | 151 | 6 | 0.5 | no | -10.09 | 6 asks, 1 whole; fits 1 yes, 0 no; voice 0 yes, 1 no; music 0 yes, 1 no; heard: A single, sharp snap of a flat panel springing into position. | yes, by force: not judged by ear: 1 whole answers in 6 asks. Forced over: the listener left "voice" unanswered; the listener left "word" unanswered; the listener left "music" unanswered; the listener left "melody" unanswered; the listener left "fits" unanswered |

### power-down

Prompt of power-down take 1:

> A machine losing power, its motors winding down in pitch, ending with one last metal clank, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `power-down` | 1 | 119 | 20 | 1.8 | no | -1.23 | 2 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A mechanical device powers down with a decelerating hum and comes to a complete stop with a distinct metallic clank. / A machine whirs to a halt, ending with a distinct mechanical clank. | yes |

### hold-music

Prompt of hold-music take 1:

> Bland, tinny telephone hold music heard through a small phone speaker, a simple cheerful electric piano tune, thin and narrow, close and dry, recorded in a quiet room, real materials, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `hold-music` | 1 | 120 | 44 | 4 | yes | -7.92 | 2 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 2 yes, 0 no; heard: Tinny, low-fidelity electronic music plays continuously before abruptly cutting off. / Bland, tinny hold music plays through a phone speaker and cuts off abruptly. | yes |

### letter-drop

Prompt of letter-drop take 1:

> One sheet of paper landing softly on a wooden desk, a single light papery pat, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `letter-drop` | 1 | 121 | 6 | 0.5 | no | -35.33 | 4 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A sheet of paper is dropped and lands flat on a hard surface. / A single, sharp slap sound of a flat object striking a hard surface. | yes |

### stamp

Prompt of stamp take 1:

> A big rubber stamp slammed down on paper on a hard wooden desk, a single heavy thump, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `stamp` | 1 | 122 | 7 | 0.6 | no | -39.57 | 6 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A heavy rubber stamp is forcefully slammed down onto a hard desk. / A heavy rubber stamp is forcefully slammed onto a piece of paper on a desk. | yes |

### ui-tick

Prompt of ui-tick take 1:

> A small soft tick, a single tiny soft click, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `ui-tick` | 1 | 123 | 6 | 0.5 | no | -0.42 | 2 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A single, short tick or click. / A single, short, soft tick or click is heard. | yes |

### key-tap

Prompt of key-tap take 1:

> A single soft tap on a laptop key, quiet and dull, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `key-tap` | 1 | 124 | 6 | 0.5 | no | -18.14 | 6 asks, 1 whole; fits 1 yes, 0 no; voice 0 yes, 1 no; music 0 yes, 1 no; heard: A single soft tap on a plastic computer keyboard. | yes, by force: not judged by ear: 1 whole answers in 6 asks. Forced over: the listener left "voice" unanswered; the listener left "word" unanswered; the listener left "music" unanswered; the listener left "melody" unanswered; the listener left "fits" unanswered |

### ui-send

Prompt of ui-send take 1:

> A short soft send tone, a single gentle rising pop like a message being sent, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `ui-send` | 1 | 125 | 6 | 0.5 | no | -26.42 | 6 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A short, synthesized two-note electronic notification sound is heard. / A brief, synthesized notification tone plays once. | yes |

### tug-lost

Prompt of tug-lost take 1:

> One sheet of thick paper ripped out of a grip and torn in two in one fast pull, a sharp dry paper tear, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `tug-lost` | 1 | 162 | 7 | 0.6 | no | -1.01 | 2 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A single, quick tear of thick paper is heard. / A quick, sharp tear of thick paper or cardboard. | yes |

### arms-out

Prompt of arms-out take 1:

> Two small spring-loaded metal arms snapping out of a housing, two quick clicks close together, a light mechanical snap, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `arms-out` | 1 | 163 | 6 | 0.5 | no | -1.34 | 4 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A sharp clicking or snapping sound of a small mechanism. / A sharp, quick mechanical snapping sound of a spring-loaded mechanism is heard. | yes |

### dial-fling

Prompt of dial-fling take 1:

> A rotary telephone dial hitting its metal stop hard at the end of its run back, one sharp metal knock with a short spring rattle after it, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `dial-fling` | 1 | 164 | 9 | 0.8 | no | -8.94 | 2 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A rotary telephone dial spins back to its resting position and strikes the finger stop with a sharp click. / A rotary telephone dial spinning back and hitting its finger stop. | yes |

### flipper-save

Prompt of flipper-save take 1:

> A pinball flipper snapping up and striking a steel ball hard, a solenoid clack with a solid steel knock on top, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `flipper-save` | 1 | 165 | 6 | 0.5 | no | -2.52 | 5 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A sharp click or clack of a mechanical device striking. / A mechanical flipper sharply strikes a steel ball. | yes |

### session-expired

Prompt of session-expired take 1, session-expired take 2:

> A wide heavy ceramic panel dropping into place across a frame, one broad flat slam, larger and lower than a small panel, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

Prompt of session-expired take 3:

> A heavy stone slab dropped flat into a wide wooden frame, one deep low slam with weight, dull and broad, no ring, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `session-expired` | 1 | 166 | 9 | 0.8 | no | -1.09 | 2 asks, 2 whole; fits 0 yes, 2 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A single, sharp click resembling a small latch or switch engaging. / A sharp, high-pitched metallic clinking or clicking sound is heard. | no |
| `session-expired` | 2 | 174 | 9 | 0.8 | no | -2.26 | 2 asks, 2 whole; fits 0 yes, 2 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A ceramic or glass object is set down onto a hard surface. / A small ceramic or glass object clinking as it is set down on a hard surface. | no |
| `session-expired` | 3 | 175 | 9 | 0.8 | no | -33.95 | 4 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A heavy door or panel slamming shut. / A heavy panel or door forcefully slamming shut. | yes |

### popup-close

Prompt of popup-close take 1, popup-close take 2:

> A small flat ceramic panel snapping shut flush into a frame, one short dull click, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `popup-close` | 1 | 167 | 6 | 0.5 | no | -62.72 | not asked | no |
| `popup-close` | 2 | 173 | 6 | 0.5 | no | -1.64 | 3 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A sharp, quick snap or clack sound. / A single, sharp snapping sound of a hard object abruptly closing. | yes |

### carpet-roll

Prompt of carpet-roll take 1, carpet-roll take 2:

> A steel ball rolling off a hard floor onto thick carpet, the bright roll turning soft and muffled, then stopping, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

Prompt of carpet-roll take 3:

> A heavy steel ball rolling onto thick carpet and slowing to a stop, a soft muffled low rumble, no bounce, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `carpet-roll` | 1 | 168 | 11 | 1 | no | -14.83 | 3 asks, 3 whole; fits 1 yes, 2 no; voice 0 yes, 3 no; music 0 yes, 3 no; heard: A metallic object rolls continuously across a hard surface before abruptly becoming muffled. / A small, hollow object rolling and rapidly wobbling to a complete stop on a hard surface. / A hard metallic object rapidly spinning and settling to a stop on a solid surface. | yes, by force: three takes made and none holds: take 1 fits by 1 yes to 2 no (heard as a metal thing rolling on a hard floor and then going muffled), take 2 by 0 to 2 (liquid, or a coin settling), take 3 with the changed prompt by 0 to 2 (a coin or a light ball settling). Take 1 is the nearest to the row. The cue is silent until Phase 4 emits carpet-roll. Forced over: the listener says it does not fit the line that describes the cue |
| `carpet-roll` | 2 | 176 | 11 | 1 | no | -5.91 | 2 asks, 2 whole; fits 0 yes, 2 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A rapid sound of liquid bubbling or pouring. / A small metal object like a coin or washer bouncing rapidly and settling on a hard surface. | no |
| `carpet-roll` | 3 | 177 | 11 | 1 | no | -20.94 | 2 asks, 2 whole; fits 0 yes, 2 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A small metallic object, likely a coin, spinning, wobbling, and finally settling flat on a hard surface. / A small, lightweight object, such as a ping pong ball, rapidly bouncing to a rest on a hard surface. | no |

### inbox-take

Prompt of inbox-take take 1:

> A steel ball dropping into a shallow metal tray and settling, one metal clatter and a short rattle, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `inbox-take` | 1 | 169 | 7 | 0.6 | no | -3.75 | 6 asks, 0 whole; fits 0 yes, 0 no; voice 0 yes, 0 no; music 0 yes, 0 no; heard: nothing | yes, by force: not judged by ear: 0 whole answers in 6 asks. Forced over: the listener left "voice" unanswered; the listener left "word" unanswered; the listener left "music" unanswered; the listener left "melody" unanswered; the listener left "fits" unanswered |

### firehouse-take

Prompt of firehouse-take take 1:

> A steel ball dropping into a deep hole in a wooden board, a hollow knock and a short roll below, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `firehouse-take` | 1 | 170 | 7 | 0.6 | no | -12.99 | 4 asks, 2 whole; fits 2 yes, 0 no; voice 0 yes, 2 no; music 0 yes, 2 no; heard: A single resonant thud of a hard object hitting a hollow wooden cavity. / A steel ball drops into a deep hole within a wooden board. | yes |

### metrics-card

Prompt of metrics-card take 1:

> A stiff card laid flat on a ceramic desk, a short slide and one soft flat tap, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `metrics-card` | 1 | 171 | 6 | 0.5 | no | -7.03 | 6 asks, 0 whole; fits 0 yes, 0 no; voice 0 yes, 0 no; music 0 yes, 0 no; heard: nothing | yes, by force: not judged by ear: 0 whole answers in 6 asks. Forced over: the listener left "voice" unanswered; the listener left "word" unanswered; the listener left "music" unanswered; the listener left "melody" unanswered; the listener left "fits" unanswered |

### skip

Prompt of skip take 1:

> One firm press of a wide plastic key bottoming out on a ceramic base, a single low click, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

| Sound | Take | Call | Credits | Asked s | Loop | Peak dB as delivered | Listener | Kept |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `skip` | 1 | 172 | 6 | 0.5 | no | -17.92 | 6 asks, 0 whole; fits 0 yes, 0 no; voice 0 yes, 0 no; music 0 yes, 0 no; heard: nothing | yes, by force: not judged by ear: 0 whole answers in 6 asks. Forced over: the listener left "voice" unanswered; the listener left "word" unanswered; the listener left "music" unanswered; the listener left "melody" unanswered; the listener left "fits" unanswered |
