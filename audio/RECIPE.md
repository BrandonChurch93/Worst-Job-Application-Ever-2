# The log of every sound

Every sound of the site and the film is made the same way. This file is its log. The part under `## Takes` is written by `npm run sound` from `audio/TAKES.json`: do not edit it by hand.

## The way a sound is made

1. A take comes from the sound tool as a file. `npm run sound -- --cue ID --file F` measures it and files it under `out/work/audio/takes/`. A cue with variants: `--cue ID --variant N`. A line of the narrator: `--line BEAT:N`. Every take is paid for through `npm run credits` and no other way: `audio/CREDITS.md` is its ledger and `audio/PROMPTS.json` holds the prompt of every cue.
2. A listener answers the questions about it. The answers go in with `--listener answers.json`.
3. `npm run sound -- --cue ID --keep` runs the one chain and writes the kept sound to `audio/kept/` with its record beside it.
4. `npm run sound -- --pack` builds what the site ships. `npm run mix` lays the film.

A cue has at most `audio.maxTakesPerCue` takes, a line at most `audio.narratorMaxTakesPerLine`. A take past that is still filed, since it was made and paid for: the tool warns, the log shows it, and check A8 fails.

## The listener's questions

`npm run sound -- --cue ID` and `npm run sound -- --line BEAT:N` print them with the answers file to fill in. They are the same for every take.

An effect: what is heard, what it is made of, how many separate events there are, whether there is a voice, a word, music or a melody, and whether it fits the one line that describes the cue. That line is the cue's row in the table of `kit/03-METHOD.md` and is kept in the sound's record as `describes`. After two kept takes of other cues, also whether the three belong in the same room. The answers file: `by`, `heard`, `madeOf`, `events`, and yes or no for `voice`, `word`, `music`, `melody`, `fits`, `sameRoom`.

A line of the narrator: the listener is not told the line and writes down what is said, then says whether there is a whisper, a laugh, warmth or excitement, and whether the speaker sounds unimpressed and a little smug. The answers file: `by`, `transcript`, and yes or no for `whisper`, `laugh`, `warmth`, `excitement`, `unimpressedAndSmug`.

A question left unanswered counts against the take. `sameRoom` alone may stay open.

## The chain

Trim the silence, a short fade in, a fade out, a low cut, then the level of the sound's class. The numbers are in `src/audio/levels.ts`.

| Class | Level |
| --- | --- |
| Room tone | mean level -46 dB |
| Walking and small ticks | peak -16 dB |
| Mechanisms | peak -10 dB |
| Hits and slams | peak -5 dB |
| Hold music | peak -14 dB |
| The narrator | -18 LUFS |

A loop is crossfaded end into start, and its seam is checked by number. A variant is its own call to the sound tool and its own take, made with the cue's prompt and filed with `--variant N` (`kit/addenda/001-sound-budget-and-narrator.md`). Only the stand-in fixtures still cut one file apart.

## The line that ends every effect prompt

close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

For hold music the words about music are left out.

## Takes

### line.marketing.stroll.0

Takes used: 1 of 3 in the build, 1 of 3 in round script-003.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:05:35.681Z | 5.341 s | -1.17 dB | -21.23 LUFS | 5 | 27 | no | too long for its place: 5.13 s in 5.12 s, over by 0.010 s; tone not judged: 1 whole answers in 8 asks |
| 2 | script-003 | 2026-11-28T02:32:38.473Z | 19.783 s | -2.02 dB | -20.32 LUFS | 17 | 89 | yes, as line.marketing.stroll.0 | The listening check could not be made to hear this take: 0 whole answers in 25 asks (15 answers gave the words and said no sound was given). Its numbers hold: 1.131 words a second, 7 pauses for 7 marks. A speech-to-text read on this machine (Whisper base.en, out/work/audio/listen/s003-asr-base.en.json) gives every word of the line in order, with Ah for Ahh. Not judged by ear; how it sounds is not known until Brandon hears it. |

Words: Ahh. / Here we have / another job applicant. / Desperately hoping / to pay their rent. / Poor fool. / They must have forgotten / it is 2026.

### line.marketing.perks.0

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:05:37.060Z | 6.92 s | -1.88 dB | -19.14 LUFS | 6 | 30 | no |  |

Words: It spots unlimited PTO. / Poor thing / believes it.

### line.step1.firstName.0

Takes used: 1 of 3 in the build, 1 of 3 in round script-003.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:05:38.537Z | 5.433 s | -2.67 dB | -20.28 LUFS | 3 | 29 | no | too long for its place: 5.346 s in 4.5 s, over by 0.846 s; tone not judged: 1 whole answers in 8 asks |
| 2 | script-003 | 2026-11-28T02:32:39.901Z | 9.474 s | -1.26 dB | -17.58 LUFS | 8 | 40 | yes, as line.step1.firstName.0 | tone not judged: 1 whole answers in 25 asks |

Words: The application / has sensed / a candidate. / ATS turrets rise.

### line.step1.firstName.1

Takes used: 2 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:05:39.807Z | 5.387 s | -1.96 dB | -18.9 LUFS | 4 | 25 | no | two whole answers heard no whisper, laugh, warmth or excitement and called it deadpan, but did not answer unimpressed and a little smug; the Builder's ruling of 18:46Z: the listener's tone answers are not evidence |
| 2 | build | 2026-11-25T18:44:17.337Z | 5.526 s | -3.31 dB | -19.94 LUFS | 5 | 25 | no |  |

Words: Hit. / It keeps typing. / It has bills.

### line.step1.email.0

Takes used: 3 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:05:41.273Z | 9.706 s | -3.98 dB | -21.68 LUFS | 8 | 40 | no | too long for its place: 9.508 s in 7.325 s, over by 2.183 s; tone not judged: 1 whole answers in 8 asks |
| 2 | build | 2026-11-25T18:45:55.737Z | 7.663 s | -2.12 dB | -18.56 LUFS | 7 | 40 | no | the Builder's ruling of 19:11Z: take 2 is kept and the tug line moves 0.15 s later on main; transcript word for word in 2 of 2 answers that had one, 1 whole answer in 5 asks |
| 3 | build | 2026-11-25T18:46:21.814Z | 6.316 s | -2.77 dB | -19.09 LUFS | 5 | 40 | no |  |

Words: A valid email. / Rejected. / The system / is working as designed.

### line.step1.tug.0

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:05:42.706Z | 8.081 s | -2.15 dB | -19.03 LUFS | 5 | 35 | no | tone not judged: 0 whole answers in 8 asks |

Words: It fights for the resume. / Two pages. / One of them is true.

### line.step2.dial.0

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:05:44.408Z | 6.037 s | -3.57 dB | -19.67 LUFS | 4 | 31 | no | tone not judged: 0 whole answers in 8 asks |

Words: A rotary phone. / The applicant / has never seen one.

### line.step2.crank.0

Takes used: 3 of 3 in the build, 1 of 3 in round script-003.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:05:45.642Z | 6.084 s | -4.63 dB | -19.9 LUFS | 5 | 29 | no |  |
| 2 | build | 2026-11-25T18:44:18.654Z | 5.805 s | -3.54 dB | -22.28 LUFS | 6 | 29 | no |  |
| 3 | build | 2026-11-25T18:44:54.436Z | 6.641 s | -1.51 dB | -20.32 LUFS | 6 | 29 | no | tone not judged: 1 whole answers in 6 asks |
| 4 | script-003 | 2026-11-28T02:32:42.616Z | 6.502 s | -1.27 dB | -17.36 LUFS | 6 | 32 | yes, as line.step2.crank.0 | too long for its place: 6.282 s in 6.25 s, over by 0.032 s; listener: not unimpressed and a little smug (0 yes, 2 no; ["authoritative and formal","serious and instructional"]). The Builder's ruling of 18:46Z: the listener's tone answers are not evidence |

Words: The applicant / must turn the volume / all the way up.

### line.pinball.seal.0

Takes used: 1 of 3 in the build, 1 of 3 in round script-003.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:05:47.066Z | 6.92 s | -4.3 dB | -18.78 LUFS | 6 | 32 | no | tone not judged: 1 whole answers in 8 asks |
| 2 | script-003 | 2026-11-28T02:32:44.421Z | 9.102 s | -2.81 dB | -19.32 LUFS | 12 | 44 | yes, as line.pinball.seal.0 | tone not judged: 1 whole answers in 25 asks |

Words: The company / gently collects / the applicant / for an unpaid assessment.

### line.pinball.launch.0

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:05:48.292Z | 3.251 s | -3.42 dB | -20.26 LUFS | 3 | 14 | no | too long for its place: 3.094 s in 2.7 s, over by 0.394 s; tone not judged: 0 whole answers in 8 asks |

Words: A career. / In reverse.

### line.pinball.lobby.0

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:05:49.565Z | 3.808 s | -2.92 dB | -19 LUFS | 4 | 19 | no | tone not judged: 0 whole answers in 10 asks |

Words: Corporate headquarters. / So close.

### line.pinball.coffee.0

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:05:50.805Z | 4.087 s | -2.83 dB | -20.86 LUFS | 3 | 17 | no | tone not judged: 0 whole answers in 8 asks |

Words: It runs on coffee / and fear.

### line.pinball.replyAll.0

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:05:52.358Z | 3.111 s | -5.26 dB | -26.63 LUFS | 4 | 15 | no |  |

Words: Someone / hit reply all.

### line.pinball.fired.0

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:05:53.597Z | 5.759 s | -2.61 dB | -22.28 LUFS | 3 | 28 | no | tone not judged: 0 whole answers in 8 asks |

Words: Fired. / Before it was hired. / A new record.

### line.pinball.drain.0

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:05:55.128Z | 4.783 s | -3.96 dB | -20.2 LUFS | 2 | 23 | no | tone not judged: 0 whole answers in 8 asks |

Words: The unemployment office. / It knows the way.

### line.boss.verify.0

Takes used: 1 of 3 in the build, 1 of 3 in round script-003.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:05:56.274Z | 5.387 s | -3.21 dB | -20.92 LUFS | 4 | 26 | no |  |
| 2 | script-003 | 2026-11-28T02:32:49.546Z | 8.684 s | -1.77 dB | -19.34 LUFS | 6 | 37 | yes, as line.boss.verify.0 | too long for its place: 8.49 s in 6.875 s, over by 1.615 s |

Words: They declare themselves human. / The form / takes that as a threat.

### line.boss.slabs.0

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:05:57.883Z | 8.313 s | -2.71 dB | -19.59 LUFS | 13 | 37 | no |  |

Words: The submit button fights back. / Even it / does not want this job.

### line.boss.lastStand.0

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:05:58.979Z | 3.669 s | -4.29 dB | -20.92 LUFS | 5 | 17 | no | tone not judged: 0 whole answers in 8 asks |

Words: Session expired. / A classic.

### line.decision.letter.0

Takes used: 1 of 3 in the build, 1 of 3 in round script-003.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:06:00.204Z | 3.529 s | -3.59 dB | -18.33 LUFS | 3 | 17 | no |  |
| 2 | script-003 | 2026-11-28T02:32:55.302Z | 12.957 s | -2.17 dB | -18.81 LUFS | 10 | 59 | yes, as line.decision.letter.0 | too long for its place: 12.742 s in 8.154 s, over by 4.588 s |

Words: After careful consideration, / the company / has decided / to move forward / with other candidates.

### line.decision.metrics.0

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:06:01.421Z | 5.898 s | -4.05 dB | -21.69 LUFS | 3 | 25 | no | tone not judged: 1 whole answers in 8 asks |

Words: It will apply again tomorrow. / They always do.

### card-flip

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:12:56.125Z | 0.48 s | -21.45 dB | -33.06 LUFS | 1 | 6 | yes, as card-flip |  |

Prompt: A stiff card turning over on a hard surface, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### room-tone

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:13:06.909Z | 20 s | -58.67 dB | null LUFS | 1 | 220 | yes, as room-tone |  |

Prompt: The air of a quiet empty carpeted office room at night, a very soft steady hush of air, no hum, no clicks, no events, nothing else, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### step.1

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:13:09.179Z | 0.48 s | -40.11 dB | -55.54 LUFS | 1 | 6 | yes, as step.1 |  |

Prompt: One soft tap of a small glossy enamel coated metal tip on a glazed ceramic tile, a single light tick, very close microphone, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### step.2

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:13:11.111Z | 0.48 s | -16.44 dB | -34.84 LUFS | 1 | 6 | yes, as step.2 |  |

Prompt: One soft tap of a small glossy enamel coated metal tip on a glazed ceramic tile, a single light tick, very close microphone, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### step.3

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:13:13.083Z | 0.48 s | -48.93 dB | -61.5 LUFS | 1 | 6 | yes, as step.3 |  |

Prompt: One soft tap of a small glossy enamel coated metal tip on a glazed ceramic tile, a single light tick, very close microphone, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### step.4

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:13:14.774Z | 0.48 s | -9.78 dB | -27.74 LUFS | 1 | 6 | yes, as step.4 |  |

Prompt: One soft tap of a small glossy enamel coated metal tip on a glazed ceramic tile, a single light tick, very close microphone, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### button-press

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:13:17.137Z | 0.48 s | -43.45 dB | -60.92 LUFS | 1 | 6 | yes, as button-press |  |

Prompt: One large glossy plastic push button the size of a palm pressed down and bottoming out with a solid low clunk, a single press, close microphone, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### page-turn

Takes used: 2 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:13:19.397Z | 1.2 s | -10.76 dB | -24.86 LUFS | 2 | 13 | no |  |
| 2 | build | 2026-11-25T18:44:26.794Z | 1.2 s | -7.58 dB | -19.88 LUFS | 1 | 13 | yes, as page-turn | not judged by ear: 1 whole answers in 6 asks |

Prompt: A heavy stone slab the size of a tabletop flipping over on a pivot, a low whoosh of displaced air, then one solid ceramic knock as it seats, close microphone, no body sounds, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### keyboard-rise

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:13:22.148Z | 1 s | -35 dB | -48.96 LUFS | 1 | 11 | yes, as keyboard-rise |  |

Prompt: A brushed aluminium deck sliding up out of a slot on smooth rails and stopping with a soft metal stop, close microphone, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### key-press.1

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:13:24.650Z | 0.48 s | -7.72 dB | -27.84 LUFS | 1 | 6 | yes, as key-press.1 | not judged by ear: 1 whole answers in 6 asks |

Prompt: One mechanical keyboard key cap pressed down and released, a single crisp plastic click, very close microphone, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### key-press.2

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:13:26.557Z | 0.48 s | -10.18 dB | -31.32 LUFS | 2 | 6 | yes, as key-press.2 |  |

Prompt: One mechanical keyboard key cap pressed down and released, a single crisp plastic click, very close microphone, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### key-press.3

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:13:29.554Z | 0.48 s | -13.36 dB | -36.36 LUFS | 1 | 6 | yes, as key-press.3 |  |

Prompt: One mechanical keyboard key cap pressed down and released, a single crisp plastic click, very close microphone, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### key-press.4

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:13:31.496Z | 0.48 s | -0.74 dB | -21.04 LUFS | 1 | 6 | yes, as key-press.4 |  |

Prompt: One mechanical keyboard key cap pressed down and released, a single crisp plastic click, very close microphone, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### key-press.5

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:13:34.044Z | 0.48 s | -2.08 dB | -23.75 LUFS | 1 | 6 | yes, as key-press.5 |  |

Prompt: One mechanical keyboard key cap pressed down and released, a single crisp plastic click, very close microphone, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### key-press.6

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:13:35.878Z | 0.48 s | -49.15 dB | null LUFS | 1 | 6 | yes, as key-press.6 |  |

Prompt: One mechanical keyboard key cap pressed down and released, a single crisp plastic click, very close microphone, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### turret-rise

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:13:38.447Z | 0.6 s | -34.39 dB | -50.63 LUFS | 1 | 7 | yes, as turret-rise |  |

Prompt: A small metal hatch flipping open, then a small servo motor lifting a part with a short whirr, close microphone, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### bolt-fire.1

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:13:41.327Z | 0.48 s | -2.62 dB | -11.55 LUFS | 1 | 6 | yes, as bolt-fire.1 | clipped as delivered: true peak 1.43 dB |

Prompt: One short tight energy bolt shot, a quick dry zap like a small toy laser, small, not a cannon, a single shot, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### bolt-fire.2

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:13:43.528Z | 0.48 s | -12.57 dB | -26.19 LUFS | 1 | 6 | yes, as bolt-fire.2 |  |

Prompt: One short tight energy bolt shot, a quick dry zap like a small toy laser, small, not a cannon, a single shot, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### bolt-fire.3

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:13:45.332Z | 0.48 s | -21.19 dB | -40.88 LUFS | 1 | 6 | yes, as bolt-fire.3 | not judged by ear: 0 whole answers in 6 asks |

Prompt: One short tight energy bolt shot, a quick dry zap like a small toy laser, small, not a cannon, a single shot, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### bolt-hit.1

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:13:47.708Z | 0.48 s | 0.97 dB | -17.62 LUFS | 1 | 6 | yes, as bolt-hit.1 | clipped as delivered: true peak 1.21 dB; not judged by ear: 1 whole answers in 6 asks |

Prompt: One hot sharp crack of a small energy bolt striking hard plastic, a single dry snap with a tiny sizzle, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### bolt-hit.2

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:13:49.501Z | 0.48 s | -17.98 dB | -37.11 LUFS | 1 | 6 | yes, as bolt-hit.2 | not judged by ear: 1 whole answers in 6 asks |

Prompt: One hot sharp crack of a small energy bolt striking hard plastic, a single dry snap with a tiny sizzle, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### bolt-hit.3

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:13:51.212Z | 0.48 s | -21.73 dB | -42.72 LUFS | 1 | 6 | yes, as bolt-hit.3 |  |

Prompt: One hot sharp crack of a small energy bolt striking hard plastic, a single dry snap with a tiny sizzle, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### sizzle

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:13:53.463Z | 1.2 s | -27.89 dB | -36.76 LUFS | 1 | 13 | yes, as sizzle |  |

Prompt: A small burn hole fizzing out on plastic, a quiet short sizzle that dies away, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### keys-shuffle

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:13:55.625Z | 0.68 s | -5.05 dB | -24.87 LUFS | 1 | 8 | yes, as keys-shuffle | not judged by ear: 0 whole answers in 6 asks |

Prompt: Many plastic keyboard key caps clattering quickly as they change places on a metal tray, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### slab-drop.1

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:13:58.128Z | 0.8 s | -2.43 dB | -19.63 LUFS | 1 | 9 | yes, as slab-drop.1 |  |

Prompt: One very heavy ceramic block landing flat on a ceramic floor, a single deep hard thud, close microphone, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### slab-drop.2

Takes used: 3 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:14:00.392Z | 0.8 s | -24.58 dB | -44.11 LUFS | 1 | 9 | no |  |
| 2 | build | 2026-11-25T18:44:28.474Z | 0.8 s | -25.83 dB | -38.63 LUFS | 1 | 9 | no |  |
| 3 | build | 2026-11-25T19:11:34.125Z | 0.8 s | -6.62 dB | -27.83 LUFS | 1 | 9 | yes, as slab-drop.2 |  |

Prompt: One very heavy ceramic block landing flat on a ceramic floor, a single deep hard thud, close microphone, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### slab-drop.3

Takes used: 3 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:14:47.363Z | 0.8 s | -26.2 dB | -44.49 LUFS | 1 | 9 | no |  |
| 2 | build | 2026-11-25T18:47:18.098Z | 0.8 s | -3.63 dB | -24.59 LUFS | 1 | 9 | no |  |
| 3 | build | 2026-11-25T19:03:40.646Z | 0.8 s | -35.39 dB | -55.49 LUFS | 1 | 9 | yes, as slab-drop.3 |  |

Prompt: One very heavy ceramic block landing flat on a ceramic floor, a single deep hard thud, close microphone, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### paper-slide

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:14:49.491Z | 0.6 s | -14.64 dB | -21.67 LUFS | 1 | 7 | yes, as paper-slide |  |

Prompt: One sheet of paper sliding across a hard smooth desk, a single short soft hiss, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### shredder

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:14:52.937Z | 4 s | -8.8 dB | -16.73 LUFS | 1 | 44 | yes, as shredder |  |

Prompt: A small office paper shredder running steadily under load, its motor grinding through paper, a constant whirr, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### paper-strain

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:14:55.379Z | 1.48 s | -29.79 dB | -52.38 LUFS | 1 | 17 | yes, as paper-strain |  |

Prompt: A sheet of paper pulled tight between two grips, creaking and straining, quiet dry fibrous creaks, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### strips-zip

Takes used: 3 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:14:57.656Z | 1 s | -14.81 dB | -23.74 LUFS | 1 | 11 | no |  |
| 2 | build | 2026-11-25T18:44:31.223Z | 1 s | -8.5 dB | -28.91 LUFS | 2 | 11 | yes, as strips-zip | three takes used and no take fits by the listener; take 2 is the only one heard as paper (flipping the pages of a book, 0 of 2 fits), take 1 was a metal zipper, take 3 a wrapper, a zipper or Velcro (0 of 3) |
| 3 | build | 2026-11-25T19:03:42.604Z | 1 s | -11.19 dB | -32.63 LUFS | 1 | 11 | no |  |

Prompt: Many thin paper strips snapping back together side by side in one quick run, a fast rising papery flutter and rustle, paper only, no metal, no zipper, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### row-open

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:15:00.245Z | 0.6 s | -23.19 dB | -40.08 LUFS | 1 | 7 | yes, as row-open |  |

Prompt: A small drawer mechanism sliding open and stopping with a soft thunk, a single short movement, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### dial-wind

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:15:02.582Z | 0.8 s | -8.5 dB | -29.51 LUFS | 1 | 9 | yes, as dial-wind |  |

Prompt: A rotary telephone dial pulled round by a finger against its spring, a single ratcheting pull, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### dial-return

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:15:05.560Z | 0.88 s | -2.1 dB | -24.21 LUFS | 1 | 10 | yes, as dial-return |  |

Prompt: A rotary telephone dial let go and running back to rest, a fast mechanical purr ending in a soft stop, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### lever-pull

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:15:08.627Z | 0.68 s | -12.11 dB | -29.05 LUFS | 1 | 8 | yes, as lever-pull |  |

Prompt: A mechanical slot machine lever pulled down and released, a heavy metal ratchet and a spring clunk, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### reels-spin

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:15:11.476Z | 2.48 s | -11.36 dB | -25.65 LUFS | 1 | 28 | yes, as reels-spin |  |

Prompt: Three mechanical slot machine reels spinning with a whirr and stopping one after another with three separate clunks, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### coins.1

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:15:13.739Z | 1.48 s | -5.57 dB | -18.04 LUFS | 1 | 17 | yes, as coins.1 |  |

Prompt: A burst of metal coins pouring out and scattering on a hard metal tray, bright clinking, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### coins.2

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:15:15.541Z | 1.48 s | -7.28 dB | -22.25 LUFS | 2 | 17 | yes, as coins.2 |  |

Prompt: A burst of metal coins pouring out and scattering on a hard metal tray, bright clinking, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### crank-turn

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:15:17.918Z | 0.8 s | -1.91 dB | -20.06 LUFS | 1 | 9 | yes, as crank-turn |  |

Prompt: One turn of a small geared metal hand crank, ratcheting clicks, a single turn, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### crank-runaway

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:15:20.469Z | 2 s | -8.56 dB | -28.22 LUFS | 2 | 22 | yes, as crank-runaway |  |

Prompt: A small geared metal hand crank spinning faster and faster out of control, its ratchet clicks speeding up into a rattle, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### flatten

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:15:23.056Z | 0.48 s | -24.71 dB | -40.47 LUFS | 1 | 6 | yes, as flatten |  |

Prompt: A short wet flat comic splat, something soft slapped flat on a hard tile, a single splat, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### peel-up

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:15:25.326Z | 0.6 s | -24.01 dB | -36.95 LUFS | 1 | 7 | yes, as peel-up |  |

Prompt: Something thin and rubbery peeling off a smooth glass surface and popping back to shape, a short peel then a small pop, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### ball-seal

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:15:27.984Z | 1 s | -7.32 dB | -19.22 LUFS | 1 | 11 | yes, as ball-seal |  |

Prompt: A short suck of air, then a hard clear plastic shell snapping shut with one firm click, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### tube-run

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:15:30.540Z | 1.48 s | -23.5 dB | -41.64 LUFS | 1 | 17 | yes, as tube-run |  |

Prompt: A hard plastic ball rolling fast down a hollow plastic tube, a rattling hollow roll, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### lights-down

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:15:33.232Z | 1.48 s | -19.95 dB | -41.97 LUFS | 1 | 17 | yes, as lights-down |  |

Prompt: The lights of a big room dimming, a low electrical hum falling in pitch and one relay clack, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### power-on

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:15:36.314Z | 2.48 s | -12.77 dB | -26.84 LUFS | 4 | 28 | yes, as power-on |  |

Prompt: A pinball machine powering up, relays clacking, a transformer hum rising, then a short start up chime struck on mechanical bells, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### plunger

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:15:38.615Z | 0.8 s | -17.69 dB | -32.63 LUFS | 1 | 9 | yes, as plunger |  |

Prompt: A pinball spring plunger pulled back and released, the spring twanging and the rod knocking into a hard plastic ball, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### bumper.1

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:15:41.296Z | 0.48 s | -61.65 dB | null LUFS | 1 | 6 | yes, as bumper.1 |  |

Prompt: One pinball pop bumper firing, a sharp solenoid thwack with a single bell ding, one hit, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### bumper.2

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:15:43.319Z | 0.48 s | -33.24 dB | -49.68 LUFS | 1 | 6 | yes, as bumper.2 |  |

Prompt: One pinball pop bumper firing, a sharp solenoid thwack with a single bell ding, one hit, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### bumper.3

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:15:45.352Z | 0.48 s | -44.81 dB | -59.62 LUFS | 1 | 6 | yes, as bumper.3 |  |

Prompt: One pinball pop bumper firing, a sharp solenoid thwack with a single bell ding, one hit, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### bumper.4

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:15:47.533Z | 0.48 s | -3.75 dB | -27.1 LUFS | 1 | 6 | yes, as bumper.4 |  |

Prompt: One pinball pop bumper firing, a sharp solenoid thwack with a single bell ding, one hit, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### scoop-kick

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:16:21.138Z | 0.6 s | -9.12 dB | -28.19 LUFS | 1 | 7 | yes, as scoop-kick |  |

Prompt: A ball dropping into a hole in a pinball table and kicked out by a solenoid, a clunk then a sharp kick, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### flasher

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:16:23.429Z | 0.48 s | -1.32 dB | -23.45 LUFS | 1 | 6 | yes, as flasher |  |

Prompt: One electrical relay click and the snap of a bright flash lamp firing, a single short tick and snap, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### ramp-roll

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:16:26.107Z | 2 s | -15.56 dB | -31.22 LUFS | 1 | 22 | yes, as ramp-roll |  |

Prompt: A hard plastic ball rolling fast along a steel wire ramp of a pinball table, a ringing metallic roll, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### ball-drop

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:16:28.891Z | 0.48 s | -1.19 dB | -25.45 LUFS | 1 | 6 | yes, as ball-drop | not judged by ear: 1 whole answers in 6 asks |

Prompt: One steel ball dropping onto a wooden board, a single hard knock, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### flipper.1

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:16:31.215Z | 0.48 s | -24.56 dB | -38.61 LUFS | 1 | 6 | yes, as flipper.1 |  |

Prompt: One pinball flipper firing, a single sharp solenoid snap and the slap of a plastic bat, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### flipper.2

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:16:33.640Z | 0.48 s | 0.6 dB | -23.97 LUFS | 1 | 6 | yes, as flipper.2 | clipped as delivered: true peak 0.81 dB |

Prompt: One pinball flipper firing, a single sharp solenoid snap and the slap of a plastic bat, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### flipper.3

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:16:35.613Z | 0.48 s | -29.98 dB | -47.42 LUFS | 1 | 6 | yes, as flipper.3 |  |

Prompt: One pinball flipper firing, a single sharp solenoid snap and the slap of a plastic bat, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### doors-slam

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:16:37.797Z | 0.6 s | -4.74 dB | -21.63 LUFS | 1 | 7 | yes, as doors-slam |  |

Prompt: Two heavy glass doors slamming shut together, one deep slam with a rattle of glass in metal frames, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### drain

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:16:40.450Z | 1.2 s | -9.43 dB | -31.52 LUFS | 2 | 13 | yes, as drain | the listener names its falling bells as music and melody (2 of 3) and says it fits its row (3 of 3); the row itself asks for a falling tone of bells, so the melody answer is the row, not a fault |

Prompt: A pinball rolling down the drain and dropping into the trough with a clunk, with a falling run of mechanical bells, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### tier-fall

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:16:42.974Z | 0.8 s | -17.94 dB | -37.48 LUFS | 1 | 9 | yes, as tier-fall |  |

Prompt: A ball dropping down a short metal chute and landing on a wooden board, a metallic rattle then a knock, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### lift

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:16:45.628Z | 1 s | -10.61 dB | -23.41 LUFS | 1 | 11 | yes, as lift |  |

Prompt: A ball sucked up a tube by air, a rising whoosh of air ending in a soft pop at the top, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### spiral

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:16:48.477Z | 2 s | -14.53 dB | -38.33 LUFS | 2 | 22 | yes, as spiral |  |

Prompt: A hard plastic ball rolling round and round down a plastic spiral ramp, slowing as it goes, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### spinner

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:16:50.730Z | 0.8 s | -12.06 dB | -31.12 LUFS | 1 | 9 | yes, as spinner |  |

Prompt: A pinball spinner target hit hard and spinning down, fast metallic ticking that slows, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### drop-target.1

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:16:53.749Z | 0.48 s | -2.53 dB | -21.75 LUFS | 1 | 6 | yes, as drop-target.1 |  |

Prompt: One pinball drop target knocked down, a single flat plastic clack, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### drop-target.2

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:16:55.949Z | 0.48 s | -25.41 dB | -43.39 LUFS | 1 | 6 | yes, as drop-target.2 |  |

Prompt: One pinball drop target knocked down, a single flat plastic clack, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### sling.1

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:16:58.830Z | 0.48 s | -21.62 dB | -37.09 LUFS | 1 | 6 | yes, as sling.1 | not judged by ear: 1 whole answers in 6 asks |

Prompt: One pinball slingshot firing, a single short rubber snap, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### sling.2

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:17:00.658Z | 0.48 s | -22.93 dB | -39.28 LUFS | 1 | 6 | yes, as sling.2 | not judged by ear: 1 whole answers in 6 asks |

Prompt: One pinball slingshot firing, a single short rubber snap, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### ball-open

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:17:02.906Z | 0.68 s | -15.2 dB | -40.66 LUFS | 1 | 8 | yes, as ball-open | not judged by ear: 0 whole answers in 6 asks |

Prompt: A hard clear plastic shell cracking open and its two halves rattling on a hard floor, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### checkbox

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:17:05.347Z | 0.48 s | -5.85 dB | -31.2 LUFS | 1 | 6 | yes, as checkbox | not judged by ear: 1 whole answers in 6 asks |

Prompt: A small crisp tick, a tiny plastic switch clicking once, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### button-crack

Takes used: 2 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:17:07.701Z | 1 s | -13.45 dB | -36.02 LUFS | 2 | 11 | no |  |
| 2 | build | 2026-11-25T18:44:34.418Z | 1 s | -5.37 dB | -25.8 LUFS | 1 | 11 | yes, as button-crack |  |

Prompt: A thick ceramic plate and hard plastic cracking and breaking apart as a large button is torn out of its housing, sharp cracks then small falling fragments, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### unfold

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:17:10.421Z | 2 s | -10.9 dB | -31.5 LUFS | 2 | 22 | yes, as unfold |  |

Prompt: Metal plates and joints unfolding and locking into place one after another with small servo motors whirring, a machine putting itself together, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### boss-loop

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:17:14.932Z | 8 s | -11.62 dB | -25.39 LUFS | 1 | 88 | yes, as boss-loop |  |

Prompt: A short loop of tense, slightly silly fight music, a fast plucked string and staccato bassoon figure over a snare drum march, comic cartoon chase tension, steady tempo, close and dry, recorded in a quiet room, real materials, no voice

### dart-fire.1

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:17:17.624Z | 0.48 s | -14.03 dB | -35.82 LUFS | 1 | 6 | yes, as dart-fire.1 | not judged by ear: 1 whole answers in 6 asks |

Prompt: One tiny bright pew, almost a click, a very small toy dart launcher firing once, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### dart-fire.2

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:17:19.657Z | 0.48 s | -16.33 dB | -37.5 LUFS | 1 | 6 | yes, as dart-fire.2 |  |

Prompt: One tiny bright pew, almost a click, a very small toy dart launcher firing once, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### dart-fire.3

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:17:21.765Z | 0.48 s | -19.25 dB | -40.71 LUFS | 1 | 6 | yes, as dart-fire.3 | not judged by ear: 1 whole answers in 6 asks |

Prompt: One tiny bright pew, almost a click, a very small toy dart launcher firing once, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### dart-fire.4

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:17:54.689Z | 0.48 s | -12.45 dB | -31.42 LUFS | 1 | 6 | yes, as dart-fire.4 | not judged by ear: 1 whole answers in 6 asks |

Prompt: One tiny bright pew, almost a click, a very small toy dart launcher firing once, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### dart-hit.1

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:17:56.933Z | 0.48 s | -24.29 dB | -40.37 LUFS | 1 | 6 | yes, as dart-hit.1 | not judged by ear: 1 whole answers in 6 asks |

Prompt: One small dart striking a metal plate, a tiny bright tick with a spark, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### dart-hit.2

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:17:58.873Z | 0.48 s | -46.86 dB | -55.1 LUFS | 1 | 6 | yes, as dart-hit.2 |  |

Prompt: One small dart striking a metal plate, a tiny bright tick with a spark, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### dart-hit.3

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:18:00.709Z | 0.48 s | -55.08 dB | null LUFS | 1 | 6 | yes, as dart-hit.3 |  |

Prompt: One small dart striking a metal plate, a tiny bright tick with a spark, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### dart-hit.4

Takes used: 3 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:18:02.918Z | 0.48 s | -45.63 dB | -62.52 LUFS | 1 | 6 | no |  |
| 2 | build | 2026-11-25T18:44:37.056Z | 0.48 s | -38.58 dB | -52.27 LUFS | 1 | 6 | no |  |
| 3 | build | 2026-11-25T19:03:44.661Z | 0.48 s | -45.01 dB | -56.2 LUFS | 1 | 6 | yes, as dart-hit.4 |  |

Prompt: One small dart striking a metal plate, a tiny bright tick with a spark, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### slab-fire.1

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:18:05.602Z | 0.48 s | -31.79 dB | -51.09 LUFS | 1 | 6 | yes, as slab-fire.1 | not judged by ear: 0 whole answers in 6 asks |

Prompt: One heavy stone block launched hard by a machine, a deep pneumatic thump and a short rush of air, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### slab-fire.2

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:18:07.837Z | 0.48 s | -15.99 dB | -28.7 LUFS | 1 | 6 | yes, as slab-fire.2 | not judged by ear: 0 whole answers in 6 asks |

Prompt: One heavy stone block launched hard by a machine, a deep pneumatic thump and a short rush of air, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### slab-fire.3

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:18:10.218Z | 0.48 s | -23.33 dB | -33.85 LUFS | 1 | 6 | yes, as slab-fire.3 | not judged by ear: 1 whole answers in 6 asks |

Prompt: One heavy stone block launched hard by a machine, a deep pneumatic thump and a short rush of air, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### popup.1

Takes used: 2 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:18:13.024Z | 0.48 s | -36.73 dB | -54.29 LUFS | 1 | 6 | no |  |
| 2 | build | 2026-11-25T18:44:39.242Z | 0.48 s | -10.41 dB | -34.29 LUFS | 1 | 6 | yes, as popup.1 |  |

Prompt: A flat rigid plastic panel snapping upright on a spring hinge, a single quick flap and clack, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### popup.2

Takes used: 2 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:18:14.885Z | 0.48 s | -38.01 dB | -50.07 LUFS | 1 | 6 | no |  |
| 2 | build | 2026-11-25T18:44:41.144Z | 0.48 s | -10.09 dB | -33.19 LUFS | 1 | 6 | yes, as popup.2 | not judged by ear: 1 whole answers in 6 asks |

Prompt: A flat rigid plastic panel snapping upright on a spring hinge, a single quick flap and clack, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### popup.3

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:18:16.795Z | 0.48 s | -46.37 dB | -66.31 LUFS | 1 | 6 | yes, as popup.3 |  |

Prompt: A flat rigid plastic panel snapping upright on a spring hinge, a single quick flap and clack, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### power-down

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:18:19.276Z | 1.76 s | -1.23 dB | -12.68 LUFS | 1 | 20 | yes, as power-down |  |

Prompt: A machine losing power, its motors winding down in pitch, ending with one last metal clank, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### hold-music

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:18:22.979Z | 4 s | -7.92 dB | -17.6 LUFS | 1 | 44 | yes, as hold-music |  |

Prompt: Bland, tinny telephone hold music heard through a small phone speaker, a simple cheerful electric piano tune, thin and narrow, close and dry, recorded in a quiet room, real materials, no voice

### letter-drop

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:18:26.052Z | 0.48 s | -35.33 dB | -52.95 LUFS | 1 | 6 | yes, as letter-drop |  |

Prompt: One sheet of paper landing softly on a wooden desk, a single light papery pat, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### stamp

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:18:28.569Z | 0.6 s | -39.57 dB | -60.14 LUFS | 1 | 7 | yes, as stamp |  |

Prompt: A big rubber stamp slammed down on paper on a hard wooden desk, a single heavy thump, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### ui-tick

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:18:31.129Z | 0.48 s | -0.42 dB | -24.85 LUFS | 1 | 6 | yes, as ui-tick |  |

Prompt: A small soft tick, a single tiny soft click, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### key-tap

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:18:33.926Z | 0.48 s | -18.14 dB | -42.66 LUFS | 1 | 6 | yes, as key-tap | not judged by ear: 1 whole answers in 6 asks |

Prompt: A single soft tap on a laptop key, quiet and dull, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### ui-send

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:18:36.499Z | 0.48 s | -26.42 dB | -41.18 LUFS | 1 | 6 | yes, as ui-send |  |

Prompt: A short soft send tone, a single gentle rising pop like a message being sent, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### line.live.idle.0

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:30:10.441Z | 8.22 s | -3.48 dB | -19.67 LUFS | 6 | 37 | no | the listener wrote "The applicant has frozen. A common defense. It does not work.": the same words in another spelling; tone not judged: 0 whole answers in 6 asks |

Words: The applicant has frozen. / A common defence. / It does not work.

### line.live.idle.1

Takes used: 3 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:30:11.613Z | 5.016 s | -4.33 dB | -19.75 LUFS | 2 | 21 | no |  |
| 2 | build | 2026-11-25T18:44:20.193Z | 4.923 s | -5.13 dB | -19.81 LUFS | 1 | 21 | no |  |
| 3 | build | 2026-11-25T18:44:55.752Z | 5.294 s | -4.27 dB | -21.51 LUFS | 2 | 21 | no | tone not judged: 1 whole answers in 12 asks |

Words: Take your time. / The job is not real.

### line.live.hit.0

Takes used: 2 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:30:12.693Z | 0.789 s | -1.42 dB | -14.77 LUFS | 2 | 2 | no | one word in 0.586 s is 1.706 words a second by the arithmetic of the pace rule and take 2 at 0.542 s is faster; a single word has no pace to slow, and three whole answers heard no whisper, laugh, warmth or excitement |
| 2 | build | 2026-11-25T18:44:21.551Z | 0.604 s | -0.36 dB | -12.15 LUFS | 2 | 2 | no |  |

Words: Hit.

### line.live.hit.1

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:30:13.711Z | 0.789 s | -1.46 dB | -17.36 LUFS | 1 | 3 | no | listener: not unimpressed and a little smug (0 yes, 2 no; ["stern and demanding","stern and commanding"]). The Builder's ruling of 18:46Z: the listener's tone answers are not evidence |

Words: Again.

### line.live.hit.2

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:30:14.847Z | 3.669 s | -5.15 dB | -23.81 LUFS | 3 | 17 | no | listener: not unimpressed and a little smug (1 yes, 1 no; ["detached and deadpan","deadpan and serious"]). The Builder's ruling of 18:46Z: the listener's tone answers are not evidence |

Words: Still typing. / It has bills.

### line.live.hit.3

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:30:15.918Z | 3.344 s | -5.68 dB | -22.02 LUFS | 3 | 15 | no | tone not judged: 1 whole answers in 6 asks |

Words: Resilient. / Or desperate.

### line.live.slowTyping.0

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:30:16.953Z | 2.926 s | -3.8 dB | -21.88 LUFS | 2 | 15 | no | tone not judged: 1 whole answers in 6 asks |

Words: One letter. / Well done.

### line.live.realKeyboard.0

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:30:18.169Z | 3.808 s | -4.14 dB | -22.62 LUFS | 4 | 19 | no | tone not judged: 1 whole answers in 6 asks |

Words: A real keyboard. / How optimistic.

### line.live.tugLost.0

Takes used: 2 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:30:19.369Z | 4.226 s | -3.31 dB | -19.26 LUFS | 4 | 18 | no | 18 asks brought no whole answer; two answers that were cut off before their end both wrote the transcript The shredder always eats first, word for word, one of them saying it had no audio; pace 1.245 words a second and 1 pause of 1 measured |
| 2 | build | 2026-11-25T20:06:02.082Z | 4.04 s | -2.86 dB | -18.12 LUFS | 4 | 18 | no |  |

Words: The shredder / always eats first.

### line.live.pinball.flipper.0

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:30:20.759Z | 6.362 s | -2.31 dB | -18.58 LUFS | 6 | 31 | no | tone not judged: 1 whole answers in 6 asks |

Words: It found the flippers. / Hope / is a powerful thing.

### line.live.boss.verify.0

Takes used: 2 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:30:21.937Z | 4.18 s | -4.29 dB | -19.86 LUFS | 2 | 17 | no |  |
| 2 | build | 2026-11-25T18:44:57.007Z | 4.18 s | -4.72 dB | -21.97 LUFS | 3 | 17 | no | tone not judged: 1 whole answers in 6 asks |

Words: It claims to be human. / Bold.

### line.live.boss.slow.0

Takes used: 2 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:30:23.133Z | 3.715 s | -1.77 dB | -18.95 LUFS | 4 | 20 | no |  |
| 2 | build | 2026-11-25T18:44:22.709Z | 4.319 s | -2.55 dB | -18.55 LUFS | 4 | 20 | no | tone not judged: 1 whole answers in 6 asks |

Words: The button is winning. / The button.

### line.live.skip.0

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:30:24.375Z | 5.898 s | -2.06 dB | -19.23 LUFS | 4 | 29 | no | tone not judged: 1 whole answers in 6 asks |

Words: It skips ahead. / Efficient. / Still unemployed.

### line.live.watchFilm.0

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:30:25.468Z | 4.087 s | -3.11 dB | -20.3 LUFS | 3 | 22 | no | tone not judged: 1 whole answers in 6 asks |

Words: It would rather watch. / Understandable.

### tug-lost

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T19:24:26.438Z | 0.6 s | -1.01 dB | -11.13 LUFS | 1 | 7 | yes, as tug-lost |  |

Prompt: One sheet of thick paper ripped out of a grip and torn in two in one fast pull, a sharp dry paper tear, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### arms-out

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T19:24:28.933Z | 0.48 s | -1.34 dB | -24.84 LUFS | 1 | 6 | yes, as arms-out |  |

Prompt: Two small spring-loaded metal arms snapping out of a housing, two quick clicks close together, a light mechanical snap, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### dial-fling

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T19:24:31.752Z | 0.8 s | -8.94 dB | -30.27 LUFS | 1 | 9 | yes, as dial-fling |  |

Prompt: A rotary telephone dial hitting its metal stop hard at the end of its run back, one sharp metal knock with a short spring rattle after it, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### flipper-save

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T19:24:34.411Z | 0.48 s | -2.52 dB | -23.53 LUFS | 1 | 6 | yes, as flipper-save |  |

Prompt: A pinball flipper snapping up and striking a steel ball hard, a solenoid clack with a solid steel knock on top, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### session-expired

Takes used: 3 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T19:24:36.962Z | 0.8 s | -1.09 dB | -19.53 LUFS | 1 | 9 | no |  |
| 2 | build | 2026-11-25T19:27:32.827Z | 0.8 s | -2.26 dB | -21.67 LUFS | 1 | 9 | no |  |
| 3 | build | 2026-11-25T19:29:01.318Z | 0.8 s | -33.95 dB | -55.69 LUFS | 1 | 9 | yes, as session-expired |  |

Prompt: A heavy stone slab dropped flat into a wide wooden frame, one deep low slam with weight, dull and broad, no ring, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### popup-close

Takes used: 2 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T19:24:39.663Z | 0.48 s | -62.72 dB | null LUFS | 1 | 6 | no |  |
| 2 | build | 2026-11-25T19:25:05.332Z | 0.48 s | -1.64 dB | -25.57 LUFS | 1 | 6 | yes, as popup-close |  |

Prompt: A small flat ceramic panel snapping shut flush into a frame, one short dull click, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### carpet-roll

Takes used: 3 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T19:24:42.208Z | 1 s | -14.83 dB | -28.76 LUFS | 1 | 11 | yes, as carpet-roll | three takes made and none holds: take 1 fits by 1 yes to 2 no (heard as a metal thing rolling on a hard floor and then going muffled), take 2 by 0 to 2 (liquid, or a coin settling), take 3 with the changed prompt by 0 to 2 (a coin or a light ball settling). Take 1 is the nearest to the row. The cue is silent until Phase 4 emits carpet-roll |
| 2 | build | 2026-11-25T19:29:03.285Z | 1 s | -5.91 dB | -19.48 LUFS | 1 | 11 | no |  |
| 3 | build | 2026-11-25T19:30:14.585Z | 1 s | -20.94 dB | -34.7 LUFS | 1 | 11 | no |  |

Prompt: A heavy steel ball rolling onto thick carpet and slowing to a stop, a soft muffled low rumble, no bounce, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### inbox-take

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T19:24:45.030Z | 0.6 s | -3.75 dB | -29.23 LUFS | 1 | 7 | yes, as inbox-take | not judged by ear: 0 whole answers in 6 asks |

Prompt: A steel ball dropping into a shallow metal tray and settling, one metal clatter and a short rattle, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### firehouse-take

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T19:24:47.677Z | 0.6 s | -12.99 dB | -32.58 LUFS | 1 | 7 | yes, as firehouse-take |  |

Prompt: A steel ball dropping into a deep hole in a wooden board, a hollow knock and a short roll below, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### metrics-card

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T19:24:50.350Z | 0.48 s | -7.03 dB | -25.28 LUFS | 1 | 6 | yes, as metrics-card | not judged by ear: 0 whole answers in 6 asks |

Prompt: A stiff card laid flat on a ceramic desk, a short slide and one soft flat tap, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### skip

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T19:24:52.881Z | 0.48 s | -17.92 dB | -39.53 LUFS | 1 | 6 | yes, as skip | not judged by ear: 0 whole answers in 6 asks |

Prompt: One firm press of a wide plastic key bottoming out on a ceramic base, a single low click, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### line.step2.crank.1

Takes used: 1 of 3 in round script-003.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | script-003 | 2026-11-28T02:32:29.100Z | 1.765 s | -5.77 dB | -21.81 LUFS | 3 | 10 | yes, as line.step2.crank.1 | Four words said in 1.586 s without a pause mark, 2.522 words a second against the limit of 1.6. The limit is there so that a line has room in the film, and this take is 2.24 s shorter than its room. Kept as a known deviation; two whole answers of the listener hold its words. How it sounds is not known until Brandon hears it. |

Words: They will regret that.

### line.step1.shredded.0

Takes used: 1 of 3 in round script-003.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | script-003 | 2026-11-28T02:32:41.480Z | 13.7 s | -1.82 dB | -20.99 LUFS | 11 | 70 | yes, as line.step1.shredded.0 | tone not judged: 1 whole answers in 25 asks |

Words: The applicant / need not worry / about the shredded resume. / They will have to type it all in / by hand / anyway.

### line.boss.unfold.0

Takes used: 1 of 3 in round script-003.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | script-003 | 2026-11-28T02:32:51.500Z | 23.638 s | -3.36 dB | -20.6 LUFS | 16 | 101 | yes, as line.boss.unfold.0 | too long for its place: 23.324 s in 18.125 s, over by 5.199 s; listener: not unimpressed and a little smug (1 yes, 1 no; ["serious and dramatic","detached, dramatic, and cold"]). The Builder's ruling of 18:46Z: the listener's tone answers are not evidence |

Words: The applicant / is ready to give up. / There is no salary listed. / No guarantee / their resume / makes it past the ATS. / Their hand moves / to close the Chrome tab.

### line.boss.unfold.1

Takes used: 1 of 3 in round script-003.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | script-003 | 2026-11-28T02:32:52.759Z | 5.851 s | -3.39 dB | -20.07 LUFS | 4 | 29 | yes, as line.boss.unfold.1 | too long for its place: 5.592 s in 4.375 s, over by 1.217 s; listener: not unimpressed and a little smug (1 yes, 1 no; ["cynical and bleak","dramatic and cynical"]). The Builder's ruling of 18:46Z: the listener's tone answers are not evidence |

Words: But then / they remember / their student loans.

### line.boss.unfold.2

Takes used: 1 of 3 in round script-003.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | script-003 | 2026-11-28T02:32:53.837Z | 4.087 s | -4.37 dB | -18.85 LUFS | 3 | 18 | yes, as line.boss.unfold.2 | listener: not unimpressed and a little smug (0 yes, 3 no; ["narrative and serious","serious and focused","serious and narrative"]). The Builder's ruling of 18:46Z: the listener's tone answers are not evidence |

Words: They turn back. / One more round.

### line.decision.reset.0

Takes used: 2 of 3 in round script-003.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | script-003 | 2026-11-28T02:32:56.402Z | 3.204 s | -2.24 dB | -20.22 LUFS | 3 | 17 | no |  |
| 2 | script-003 | 2026-11-28T02:46:12.582Z | 3.39 s | -1.99 dB | -17.8 LUFS | 2 | 17 | yes, as line.decision.reset.0 | The listening check could not be made to hear this take: 0 whole answers in 25 asks, each said no sound was given. Its numbers hold: 1.563 words a second, 1 pause for 1 mark. A speech-to-text read on this machine (Whisper base.en, out/work/audio/listen/s003-asr-base.en.json) gives the words: on to the next application. Not judged by ear; how it sounds is not known until Brandon hears it. |

Words: On to / the next application.

### turret-cannon

Takes used: 2 of 3 in round change-002, 1 of 3 in round change-002-layer.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | change-002 | 2026-11-28T10:51:33.713Z | 0.8 s | -12.22 dB | -29.34 LUFS | 1 | 9 | no |  |
| 2 | change-002 | 2026-11-28T10:51:35.368Z | 0.8 s | -26.61 dB | -41.73 LUFS | 1 | 9 | no |  |
| 3 | change-002-layer | 2026-11-28T10:51:36.884Z | 0.8 s | -1.01 dB | -15.7 LUFS | 1 | 0 | yes, as turret-cannon | Chosen by measure for Brandon's words in change note 002 (powerful, not a laser pew): on a laptop it is the loudest and fullest of the takes and layers of this cue. A layer made for free from the paid takes; a listener told nothing did not name it by its line |

Prompt: Made for free from paid takes, with no call to the sound service (layer L5 of the free layering rounds of November 28): big-fire take 2 lowered by a minor third and so longer, from its loudest moment, cut to 0.8 s with a fade of 0.2 s, with the smack of turret-cannon take 2 4 dB under and take 1 lowered by a sixth 5 dB under, overtones of the deep part, a gentle saturation. The takes named are filed under their own cues.

### slab-slam

Takes used: 2 of 3 in round change-002, 1 of 3 in round change-002-layer.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | change-002 | 2026-11-28T10:51:47.843Z | 1 s | -22.62 dB | -43.65 LUFS | 1 | 11 | no |  |
| 2 | change-002 | 2026-11-28T10:51:49.703Z | 1 s | -26.91 dB | -45.91 LUFS | 1 | 11 | no |  |
| 3 | change-002-layer | 2026-11-28T10:51:51.496Z | 1 s | -1.01 dB | -16.56 LUFS | 1 | 0 | yes, as slab-slam | Chosen by measure for Brandon's words in change note 002 (powerful, not a laser pew): on a laptop it is the loudest and fullest of the takes and layers of this cue. A layer made for free from the paid takes; a listener told nothing did not name it by its line |

Prompt: Made for free from paid takes, with no call to the sound service (layer L1 of the free layering rounds of November 28): slab-slam take 1 (body) and take 2 (boom), the thud of turret-cannon take 1 a fourth lower, the smack of turret-cannon take 2, the shatter of button-burst take 2 far under, overtones of the deep part, soft saturation. The takes named are filed under their own cues.

### keys-break

Takes used: 2 of 3 in round change-002, 1 of 3 in round change-002-layer.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | change-002 | 2026-11-28T10:51:56.334Z | 0.6 s | -5.22 dB | -26.89 LUFS | 2 | 7 | no |  |
| 2 | change-002 | 2026-11-28T10:51:57.911Z | 0.6 s | 0.78 dB | -15.58 LUFS | 1 | 7 | no |  |
| 3 | change-002-layer | 2026-11-28T10:51:59.530Z | 0.6 s | -1.01 dB | -18.48 LUFS | 1 | 0 | yes, as keys-break | Chosen by measure for Brandon's words in change note 002 (powerful, not a laser pew): on a laptop it is the loudest and fullest of the takes and layers of this cue. A layer made for free from the paid takes; a listener told nothing did not name it by its line |

Prompt: Made for free from paid takes, with no call to the sound service (layer L2 of the free layering rounds of November 28): keys-break takes 1 and 2 with the stop-press click and a short smack of turret-cannon take 2 as one crunch, then eleven larger pieces of the same snaps and clicks, each lowered by its own amount, with gaps between them over half a second. The takes named are filed under their own cues.

### button-burst

Takes used: 2 of 3 in round change-002, 1 of 3 in round change-002-layer.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | change-002 | 2026-11-28T10:52:04.441Z | 1.2 s | -5.62 dB | -14.34 LUFS | 1 | 13 | no |  |
| 2 | change-002 | 2026-11-28T10:52:06.111Z | 1.2 s | -17.07 dB | -34.83 LUFS | 1 | 13 | no |  |
| 3 | change-002-layer | 2026-11-28T10:52:07.685Z | 1.2 s | -1.01 dB | -18.15 LUFS | 1 | 0 | yes, as button-burst | Chosen by measure for Brandon's words in change note 002 (powerful, not a laser pew): on a laptop it is the loudest and fullest of the takes and layers of this cue. A layer made for free from the paid takes; a listener told nothing did not name it by its line |

Prompt: Made for free from paid takes, with no call to the sound service (layer L3 of the free layering rounds of November 28): as L2 (the crack of take 2, the deep boom of big-fire take 1, the thud of turret-cannon take 1 lower, the clank of boss-fall take 1, a second boom from slab-slam take 2, six small thuds as chunks falling, take 1 laid 8 dB under), with the crack 3 dB up and a gentler saturation. The takes named are filed under their own cues.

### big-fire

Takes used: 2 of 3 in round change-002, 1 of 3 in round change-002-layer.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | change-002 | 2026-11-28T10:52:12.390Z | 1.48 s | -15.85 dB | -33.14 LUFS | 1 | 17 | no |  |
| 2 | change-002 | 2026-11-28T10:52:13.951Z | 1.48 s | -1.94 dB | -15.06 LUFS | 1 | 17 | no |  |
| 3 | change-002-layer | 2026-11-28T10:52:15.709Z | 1.5 s | -1.01 dB | -14.45 LUFS | 1 | 0 | yes, as big-fire | Chosen by measure for Brandon's words in change note 002 (powerful, not a laser pew): on a laptop it is the loudest and fullest of the takes and layers of this cue. A layer made for free from the paid takes; a listener told nothing did not name it by its line |

Prompt: Made for free from paid takes, with no call to the sound service (layer L1 of the free layering rounds of November 28): big-fire take 2 as it is, the deep boom of take 1 3 dB under at its loudest moment, the thud of turret-cannon take 1 an octave lower 5 dB under, overtones of the deep part, a gentle saturation. The takes named are filed under their own cues.

### pin-bumper

Takes used: 1 of 3 in round change-002.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | change-002 | 2026-11-28T11:38:10.942Z | 0.48 s | -18.51 dB | -36.56 LUFS | 1 | 6 | yes, as pin-bumper | First take, the only one: a listening model that was told the cue's line said it fits, 3 of 3, on the sound as the site plays it after the chain. A model cannot hear as a person does; Brandon's ear decides on the live site. |

Prompt: One pinball pop bumper struck by a steel ball, a short rubber and solenoid thwack, no bell, medium weight, inside a wooden cabinet, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### pin-target

Takes used: 1 of 3 in round change-002.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | change-002 | 2026-11-28T11:38:14.110Z | 0.48 s | -9.44 dB | -30.32 LUFS | 1 | 6 | yes, as pin-target | First take, the only one: a listening model that was told the cue's line said it fits, 3 of 3, on the sound as the site plays it after the chain. A model cannot hear as a person does; Brandon's ear decides on the live site. |

Prompt: One steel ball striking a small plastic standup target on a pinball table, a short hard clack, light, inside a wooden cabinet, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### pin-bell

Takes used: 1 of 3 in round change-002.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | change-002 | 2026-11-28T11:38:17.341Z | 0.48 s | -5.58 dB | -17.49 LUFS | 1 | 6 | yes, as pin-bell | First take, the only one: a listening model that was told the cue's line said it fits, 3 of 3, on the sound as the site plays it after the chain. A model cannot hear as a person does; Brandon's ear decides on the live site. |

Prompt: One steel ball striking a small brass bell on a pinball table, a single clear ding that dies fast, light, inside a wooden cabinet, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### pin-kick

Takes used: 1 of 3 in round change-002.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | change-002 | 2026-11-28T11:38:20.461Z | 0.48 s | -0.25 dB | -20.53 LUFS | 1 | 6 | yes, as pin-kick | First take, the only one: a listening model that was told the cue's line said it fits, 3 of 3, on the sound as the site plays it after the chain. A model cannot hear as a person does; Brandon's ear decides on the live site. |

Prompt: One pinball kicker firing a steel ball out of a saucer hole, a hard solenoid clunk and the ball leaving on wood, medium weight, inside a wooden cabinet, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### pin-coins

Takes used: 1 of 3 in round change-002.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | change-002 | 2026-11-28T11:38:23.491Z | 0.88 s | -4.54 dB | -15.04 LUFS | 2 | 10 | yes, as pin-coins | First take, the only one: a listening model that was told the cue's line said it fits, 3 of 3, on the sound as the site plays it after the chain. A model cannot hear as a person does; Brandon's ear decides on the live site. |

Prompt: A short spill of metal coins into a steel tray, bright and quick, light weight, inside a wooden cabinet, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### pin-frenzy

Takes used: 1 of 3 in round change-002, 1 of 3 in round change-002-layer.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | change-002 | 2026-11-28T11:38:26.712Z | 2.4 s | -4.4 dB | -17.24 LUFS | 1 | 26 | no |  |
| 2 | change-002-layer | 2026-11-28T12:18:58.380Z | 2.4 s | -1.01 dB | -12.31 LUFS | 1 | 0 | yes, as pin-frenzy | A layer made for free from paid first takes. A listening model that was told the cue's line said it fits, 3 of 3, on the sound as the site plays it after the chain (heard as relays chattering with a fast rising run of bell chimes); the first take fit 0 of 3 (heard as an alarm bell). A model cannot hear as a person does; Brandon's ear decides on the live site. |

Prompt: Made for free from paid takes, with no call to the sound service (layer L1 of the free layering round of November 28 on the ten first takes that did not hold): 47 short pieces of the clunk of pin-kick, the click of stop-press, the clack of reel-stop and of pin-target as relays chattering, from 14 to 27 a second; 19 strokes of the pin-bell ding at three pitches in no order, from 4 to 12 a second and louder to the end, the pitch drifting up by a tenth; five thwacks of pin-bumper. All first takes.. The takes named are filed under their own cues.

### vacuum-roar

Takes used: 1 of 3 in round change-002.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | change-002 | 2026-11-28T11:38:30.063Z | 3 s | -1.85 dB | -9.87 LUFS | 1 | 33 | yes, as vacuum-roar | First take, the only one: a listening model that was told the cue's line said it fits, 3 of 3, on the sound as the site plays it after the chain. A model cannot hear as a person does; Brandon's ear decides on the live site. |

Prompt: A large shop vacuum running at full power, a steady roar of air through a wide plastic hose, even from start to end so it can loop, heavy, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### vacuum-gulp

Takes used: 1 of 3 in round change-002, 1 of 3 in round change-002-layer.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | change-002 | 2026-11-28T11:38:33.215Z | 0.48 s | -15.54 dB | -28.56 LUFS | 2 | 6 | no |  |
| 2 | change-002-layer | 2026-11-28T12:19:08.278Z | 0.5 s | -1.01 dB | -15.24 LUFS | 1 | 0 | yes, as vacuum-gulp | A layer made for free from paid first takes. A listening model that was told the cue's line said it fits, 2 of 3, on the sound as the site plays it after the chain (two hearings: a hollow intake of air followed by a muffled thud; one: a zap); the first take fit 1 of 3 (heard as a liquid bloop). A model cannot hear as a person does; Brandon's ear decides on the live site. |

Prompt: Made for free from paid takes, with no call to the sound service (layer L1 of the free layering round of November 28 on the ten first takes that did not hold): a fifth of a second of vacuum-roar take 1, lowered and with its hollow band lifted, at full from its start (a hit starts at its contact) and swelling a little to a sudden stop; the pop of vacuum-slip played backwards under it; then the clunk of pin-kick lowered and dulled and the thunk of row-close lowered and dulled as the knock inside. The takes named are filed under their own cues.

### vacuum-slip

Takes used: 1 of 3 in round change-002.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | change-002 | 2026-11-28T11:38:36.403Z | 0.48 s | -20.93 dB | -36.13 LUFS | 1 | 6 | yes, as vacuum-slip | First take, the only one: a listening model that was told the cue's line said it fits, 3 of 3, on the sound as the site plays it after the chain. A model cannot hear as a person does; Brandon's ear decides on the live site. |

Prompt: A steel ball slipping free of a suction hose mouth, one short wet pop of air on rubber, light, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### cannon-fire

Takes used: 1 of 3 in round change-002, 1 of 3 in round change-002-layer.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | change-002 | 2026-11-28T11:38:39.467Z | 0.48 s | -16.11 dB | -28.7 LUFS | 1 | 6 | no |  |
| 2 | change-002-layer | 2026-11-28T12:38:58.680Z | 0.5 s | -1.01 dB | -19.11 LUFS | 1 | 0 | yes, as cannon-fire | A layer made for free from paid first takes. A listening model that was told the cue's line said it fits, 3 of 3, on the sound as the site plays it after the chain (heard as a deep, heavy thud with a quick rush of air, and as a low heavy metallic thump with a short burst of air); the first take and the first layer each fit 1 of 3. A model cannot hear as a person does; Brandon's ear decides on the live site. |

Prompt: Made for free from paid takes, with no call to the sound service (layer L2, the second free layering round of November 28 on the seven that did not hold): cannon-fire take 1 (the muffled thump); slab-slam take 2 an octave up and big-fire take 1 a fifth up, both from their loudest moment, as a body a small speaker can play; a burst of noise with the colour of turret-cannon take 2, 0.06 s long, as the blast; noise with the colour of vacuum-roar take 1, 0.09 s long, as the push of air; the smack of turret-cannon take 2 far under; the clank of healthbar-drop an octave lower far under, as the ring of the barrel; overtones of the deep part; the loudest moments held down by a compressor. No saturation (round L1 was heard as a buzz). The takes named are filed under their own cues.

### cannon-tell

Takes used: 1 of 3 in round change-002.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | change-002 | 2026-11-28T11:38:42.531Z | 0.8 s | -9.99 dB | -27.14 LUFS | 1 | 9 | yes, as cannon-tell | First take, the only one: a listening model that was told the cue's line said it fits, 2 of 3, on the sound as the site plays it after the chain. A model cannot hear as a person does; Brandon's ear decides on the live site. |

Prompt: A heavy cannon winding up before it fires, a low motor whine rising with a steel ratchet clicking faster, large, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### boss-heal

Takes used: 1 of 3 in round change-002, 1 of 3 in round change-002-layer.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | change-002 | 2026-11-28T11:38:45.692Z | 0.6 s | -3.32 dB | -13.6 LUFS | 1 | 7 | no |  |
| 2 | change-002-layer | 2026-11-28T12:39:03.451Z | 0.6 s | -1.01 dB | -13.31 LUFS | 1 | 0 | yes, as boss-heal | A layer made for free from paid first takes. A listening model that was told the cue's line said it fits, 3 of 3, on the sound as the site plays it after the chain (heard as a warm low hum that sweeps quickly upward and ends in a bright shimmer; all three call it synthesized); the first take and the first layer each fit 0 of 3, and the first layer was heard as a voice saying a word. A model cannot hear as a person does; Brandon's ear decides on the live site. |

Prompt: Made for free from paid takes, with no call to the sound service (layer L2, the second free layering round of November 28 on the seven that did not hold): boss-heal take 1 (a low hum) played from 0.9 to 1.7 times its speed and kept under 1.1 kHz, so that the hum rises; the same take an octave higher, twice, under it, for warmth that a small speaker plays; from 0.33 s the chime at the end of power-up take 1, softened, and the pin-bell ding a fifth and an octave up far under, as the soft shimmer; overtones of the deep part; a little room. The takes named are filed under their own cues.

### shield-glance

Takes used: 1 of 3 in round change-002.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | change-002 | 2026-11-28T11:38:48.805Z | 0.48 s | -43.53 dB | -59.28 LUFS | 1 | 6 | yes, as shield-glance | First take, the only one: a listening model that was told the cue's line said it fits, 3 of 3, on the sound as the site plays it after the chain. A model cannot hear as a person does; Brandon's ear decides on the live site. |

Prompt: One small dart glancing off a curved glass shield, a tiny bright ping that slides away, light, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### arena-split

Takes used: 1 of 3 in round change-002, 1 of 3 in round change-002-layer.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | change-002 | 2026-11-28T11:38:51.939Z | 0.6 s | -0.23 dB | -17.37 LUFS | 1 | 7 | no |  |
| 2 | change-002-layer | 2026-11-28T12:19:03.478Z | 0.6 s | -1.01 dB | -17 LUFS | 1 | 0 | yes, as arena-split | A layer made for free from paid first takes. A listening model that was told the cue's line said it fits, 3 of 3, on the sound as the site plays it after the chain (heard as a sharp, dry crack); the first take fit 1 of 3. A model cannot hear as a person does; Brandon's ear decides on the live site. |

Prompt: Made for free from paid takes, with no call to the sound service (layer L1 of the free layering round of November 28 on the ten first takes that did not hold): arena-split take 1 (the snap); the crack of button-burst take 2 raised by a third 4 dB under; the deep part of slab-slam take 2 under it; fourteen small snaps of keys-break takes 1 and 2 running on for 0.4 s and thinning, as the crack running along the line; the ping of shield-glance lowered and the flap of folder-open far under as glass and paper; overtones of the deep part, a gentle saturation. The takes named are filed under their own cues.

### arena-rise

Takes used: 1 of 3 in round change-002.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | change-002 | 2026-11-28T11:38:55.004Z | 0.88 s | -29.66 dB | -41.72 LUFS | 1 | 10 | no |  |

Prompt: A heavy stone and steel platform rising out of the floor, a low grinding rumble that ends in a locking thud, very heavy, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### healthbar-drop

Takes used: 1 of 3 in round change-002.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | change-002 | 2026-11-28T11:38:58.326Z | 0.48 s | -24.91 dB | -39.46 LUFS | 1 | 6 | yes, as healthbar-drop | First take, the only one: a listening model that was told the cue's line said it fits, 3 of 3, on the sound as the site plays it after the chain. A model cannot hear as a person does; Brandon's ear decides on the live site. |

Prompt: A long steel bar dropping into two brackets, one solid clank with a short ring, heavy, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### power-up

Takes used: 1 of 3 in round change-002, 1 of 3 in round change-002-layer.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | change-002 | 2026-11-28T11:39:01.534Z | 0.8 s | -22.92 dB | -28.35 LUFS | 1 | 9 | no |  |
| 2 | change-002-layer | 2026-11-28T12:39:08.433Z | 0.8 s | -1.01 dB | -9.16 LUFS | 1 | 0 | yes, as power-up | A layer made for free from paid first takes. The cue is the arrow's gold power-up on the words One more round, so its line now says that. A listening model that was told the new line said it fits, 3 of 3, on the sound as the site plays it after the chain (heard as a fast swell of energy rising into a bright ringing chime; all three call it synthesized). The first take fit the old line 2 of 3 and the first layer 0 of 3. A model cannot hear as a person does; Brandon's ear decides on the live site. |

Prompt: Made for free from paid takes, with no call to the sound service (layer L2, the second free layering round of November 28 on the seven that did not hold): power-up take 1 (a rising hum into a chime) kept under 5.2 kHz so that its edge is softer; under it noise with the colour of vacuum-roar take 1, rising in level and in brightness over 0.66 s with a slow flutter, as a rush of air; boss-heal take 1 (a low hum) played from 0.9 to 2.2 times its speed and kept under 900 Hz, as a low hum rising with it; at 0.6 s the pin-bell ding and the ping of shield-glance an octave up far under the chime; a little room. The takes named are filed under their own cues.

### boss-fall

Takes used: 1 of 3 in round change-002.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | change-002 | 2026-11-28T11:39:04.763Z | 0.8 s | -0.92 dB | -17.29 LUFS | 1 | 9 | no |  |

Prompt: A large machine of glass and steel collapsing to the floor, a heavy slump of plates and one deep thud, very heavy, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### pillar-break

Takes used: 1 of 3 in round change-002.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | change-002 | 2026-11-28T11:39:07.974Z | 0.8 s | -11.15 dB | -34.29 LUFS | 2 | 9 | no |  |

Prompt: One stone pillar breaking in two and its top half falling, a hard crack and a heavy tumble of rubble, very heavy, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### reel-stop

Takes used: 1 of 3 in round change-002.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | change-002 | 2026-11-28T11:39:11.348Z | 0.48 s | -4.11 dB | -24.54 LUFS | 1 | 6 | yes, as reel-stop | First take, the only one: a listening model that was told the cue's line said it fits, 3 of 3, on the sound as the site plays it after the chain. A model cannot hear as a person does; Brandon's ear decides on the live site. |

Prompt: One slot machine reel stopping, a hard plastic and steel clack with a short ratchet tick, small and firm, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### stop-press

Takes used: 1 of 3 in round change-002.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | change-002 | 2026-11-28T11:39:14.461Z | 0.48 s | -38.07 dB | -55.39 LUFS | 1 | 6 | yes, as stop-press | First take, the only one: a listening model that was told the cue's line said it fits, 3 of 3, on the sound as the site plays it after the chain. A model cannot hear as a person does; Brandon's ear decides on the live site. |

Prompt: One small plastic stop button pressed, a short dry click, very light, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### date-miss

Takes used: 1 of 3 in round change-002.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | change-002 | 2026-11-28T11:39:17.614Z | 0.6 s | -17.7 dB | -38.21 LUFS | 2 | 7 | yes, as date-miss | First take, the only one: a listening model that was told the cue's line said it fits, 3 of 3, on the sound as the site plays it after the chain. A model cannot hear as a person does; Brandon's ear decides on the live site. |

Prompt: A slot machine reel slipping past its stop, a short descending ratchet rattle that ends in a dull plastic thud, small, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### volume-sign

Takes used: 1 of 3 in round change-002.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | change-002 | 2026-11-28T11:39:20.704Z | 0.48 s | -8.76 dB | -27.2 LUFS | 1 | 6 | yes, as volume-sign | First take, the only one: a listening model that was told the cue's line said it fits, 3 of 3, on the sound as the site plays it after the chain. A model cannot hear as a person does; Brandon's ear decides on the live site. |

Prompt: A small lit sign switching on, one soft relay click and a short faint electric buzz that settles, light, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### row-close

Takes used: 1 of 3 in round change-002.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | change-002 | 2026-11-28T11:39:23.823Z | 0.48 s | -20.8 dB | -35.33 LUFS | 1 | 6 | yes, as row-close | First take, the only one: a listening model that was told the cue's line said it fits, 3 of 3, on the sound as the site plays it after the chain. A model cannot hear as a person does; Brandon's ear decides on the live site. |

Prompt: A small drawer mechanism sliding shut and stopping with a soft thunk, a single short movement, light, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### folder-open

Takes used: 1 of 3 in round change-002.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | change-002 | 2026-11-28T11:39:26.939Z | 0.48 s | -25.84 dB | -44.25 LUFS | 1 | 6 | yes, as folder-open | First take, the only one: a listening model that was told the cue's line said it fits, 3 of 3, on the sound as the site plays it after the chain. A model cannot hear as a person does; Brandon's ear decides on the live site. |

Prompt: A stiff paper folder flipped open on a desk, one soft flap of card and paper, light, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### slot-in

Takes used: 1 of 3 in round change-002.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | change-002 | 2026-11-28T11:39:30.204Z | 0.48 s | -25.28 dB | -36.76 LUFS | 1 | 6 | yes, as slot-in | First take, the only one: a listening model that was told the cue's line said it fits, 3 of 3, on the sound as the site plays it after the chain. A model cannot hear as a person does; Brandon's ear decides on the live site. |

Prompt: A sheet of paper fed into the slot of a machine, a short slide of paper on steel and a soft catch, light, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### wind-gust

Takes used: 1 of 3 in round change-002.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | change-002 | 2026-11-28T11:39:33.368Z | 1.2 s | -33.15 dB | -50.47 LUFS | 1 | 13 | no |  |

Prompt: One gust of wind through an open office window, a soft rush of air that swells and fades with loose paper lifting, light, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice
