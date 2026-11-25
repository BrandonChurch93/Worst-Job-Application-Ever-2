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

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:05:35.681Z | 5.341 s | -1.17 dB | -21.23 LUFS | 5 | 27 | yes, as line.marketing.stroll.0 | too long for its place: 5.13 s in 5.12 s, over by 0.010 s; tone not judged: 1 whole answers in 8 asks |

Words: Here we find / the applicant. / Rent is due.

### line.marketing.perks.0

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:05:37.060Z | 6.92 s | -1.88 dB | -19.14 LUFS | 6 | 30 | yes, as line.marketing.perks.0 |  |

Words: It spots unlimited PTO. / Poor thing / believes it.

### line.step1.firstName.0

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:05:38.537Z | 5.433 s | -2.67 dB | -20.28 LUFS | 3 | 29 | yes, as line.step1.firstName.0 | too long for its place: 5.346 s in 4.5 s, over by 0.846 s; tone not judged: 1 whole answers in 8 asks |

Words: First name. / Under fire. / Standard onboarding.

### line.step1.firstName.1

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:05:39.807Z | 5.387 s | -1.96 dB | -18.9 LUFS | 4 | 25 | no |  |

Words: Hit. / It keeps typing. / It has bills.

### line.step1.email.0

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:05:41.273Z | 9.706 s | -3.98 dB | -21.68 LUFS | 8 | 40 | yes, as line.step1.email.0 | too long for its place: 9.508 s in 7.325 s, over by 2.183 s; tone not judged: 1 whole answers in 8 asks |

Words: A valid email. / Rejected. / The system / is working as designed.

### line.step1.tug.0

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:05:42.706Z | 8.081 s | -2.15 dB | -19.03 LUFS | 5 | 35 | yes, as line.step1.tug.0 | tone not judged: 0 whole answers in 8 asks |

Words: It fights for the resume. / Two pages. / One of them is true.

### line.step2.dial.0

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:05:44.408Z | 6.037 s | -3.57 dB | -19.67 LUFS | 4 | 31 | yes, as line.step2.dial.0 | tone not judged: 0 whole answers in 8 asks |

Words: A rotary phone. / The applicant / has never seen one.

### line.step2.crank.0

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:05:45.642Z | 6.084 s | -4.63 dB | -19.9 LUFS | 5 | 29 | no |  |

Words: Volume. / All the way up. / It will regret that.

### line.pinball.seal.0

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:05:47.066Z | 6.92 s | -4.3 dB | -18.78 LUFS | 6 | 32 | yes, as line.pinball.seal.0 | tone not judged: 1 whole answers in 8 asks |

Words: The skills assessment. / No skills / will be assessed.

### line.pinball.launch.0

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:05:48.292Z | 3.251 s | -3.42 dB | -20.26 LUFS | 3 | 14 | yes, as line.pinball.launch.0 | too long for its place: 3.094 s in 2.7 s, over by 0.394 s; tone not judged: 0 whole answers in 8 asks |

Words: A career. / In reverse.

### line.pinball.lobby.0

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:05:49.565Z | 3.808 s | -2.92 dB | -19 LUFS | 4 | 19 | yes, as line.pinball.lobby.0 | tone not judged: 0 whole answers in 10 asks |

Words: Corporate headquarters. / So close.

### line.pinball.coffee.0

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:05:50.805Z | 4.087 s | -2.83 dB | -20.86 LUFS | 3 | 17 | yes, as line.pinball.coffee.0 | tone not judged: 0 whole answers in 8 asks |

Words: It runs on coffee / and fear.

### line.pinball.replyAll.0

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:05:52.358Z | 3.111 s | -5.26 dB | -26.63 LUFS | 4 | 15 | yes, as line.pinball.replyAll.0 |  |

Words: Someone / hit reply all.

### line.pinball.fired.0

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:05:53.597Z | 5.759 s | -2.61 dB | -22.28 LUFS | 3 | 28 | yes, as line.pinball.fired.0 | tone not judged: 0 whole answers in 8 asks |

Words: Fired. / Before it was hired. / A new record.

### line.pinball.drain.0

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:05:55.128Z | 4.783 s | -3.96 dB | -20.2 LUFS | 2 | 23 | yes, as line.pinball.drain.0 | tone not judged: 0 whole answers in 8 asks |

Words: The unemployment office. / It knows the way.

### line.boss.verify.0

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:05:56.274Z | 5.387 s | -3.21 dB | -20.92 LUFS | 4 | 26 | yes, as line.boss.verify.0 |  |

Words: Not a robot, / it claims. / We will see.

### line.boss.slabs.0

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:05:57.883Z | 8.313 s | -2.71 dB | -19.59 LUFS | 13 | 37 | yes, as line.boss.slabs.0 |  |

Words: The submit button fights back. / Even it / does not want this job.

### line.boss.lastStand.0

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:05:58.979Z | 3.669 s | -4.29 dB | -20.92 LUFS | 5 | 17 | yes, as line.boss.lastStand.0 | tone not judged: 0 whole answers in 8 asks |

Words: Session expired. / A classic.

### line.decision.letter.0

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:06:00.204Z | 3.529 s | -3.59 dB | -18.33 LUFS | 3 | 17 | yes, as line.decision.letter.0 |  |

Words: Rejected. / In under a second.

### line.decision.metrics.0

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:06:01.421Z | 5.898 s | -4.05 dB | -21.69 LUFS | 3 | 25 | yes, as line.decision.metrics.0 | tone not judged: 1 whole answers in 8 asks |

Words: It will apply again tomorrow. / They always do.

### card-flip

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:12:56.125Z | 0.48 s | -21.45 dB | -33.06 LUFS | 1 | 6 | no |  |

Prompt: A stiff card turning over on a hard surface, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### room-tone

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:13:06.909Z | 20 s | -58.67 dB | null LUFS | 1 | 220 | no |  |

Prompt: The air of a quiet empty carpeted office room at night, a very soft steady hush of air, no hum, no clicks, no events, nothing else, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### step.1

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:13:09.179Z | 0.48 s | -40.11 dB | -55.54 LUFS | 1 | 6 | no |  |

Prompt: One soft tap of a small glossy enamel coated metal tip on a glazed ceramic tile, a single light tick, very close microphone, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### step.2

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:13:11.111Z | 0.48 s | -16.44 dB | -34.84 LUFS | 1 | 6 | no |  |

Prompt: One soft tap of a small glossy enamel coated metal tip on a glazed ceramic tile, a single light tick, very close microphone, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### step.3

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:13:13.083Z | 0.48 s | -48.93 dB | -61.5 LUFS | 1 | 6 | no |  |

Prompt: One soft tap of a small glossy enamel coated metal tip on a glazed ceramic tile, a single light tick, very close microphone, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### step.4

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:13:14.774Z | 0.48 s | -9.78 dB | -27.74 LUFS | 1 | 6 | no |  |

Prompt: One soft tap of a small glossy enamel coated metal tip on a glazed ceramic tile, a single light tick, very close microphone, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### button-press

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:13:17.137Z | 0.48 s | -43.45 dB | -60.92 LUFS | 1 | 6 | no |  |

Prompt: One large glossy plastic push button the size of a palm pressed down and bottoming out with a solid low clunk, a single press, close microphone, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### page-turn

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:13:19.397Z | 1.2 s | -10.76 dB | -24.86 LUFS | 2 | 13 | no |  |

Prompt: A heavy ceramic slab the size of a tabletop turning over, a low rush of air, then one solid knock as it seats, close microphone, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### keyboard-rise

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:13:22.148Z | 1 s | -35 dB | -48.96 LUFS | 1 | 11 | no |  |

Prompt: A brushed aluminium deck sliding up out of a slot on smooth rails and stopping with a soft metal stop, close microphone, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### key-press.1

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:13:24.650Z | 0.48 s | -7.72 dB | -27.84 LUFS | 1 | 6 | no |  |

Prompt: One mechanical keyboard key cap pressed down and released, a single crisp plastic click, very close microphone, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### key-press.2

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:13:26.557Z | 0.48 s | -10.18 dB | -31.32 LUFS | 2 | 6 | no |  |

Prompt: One mechanical keyboard key cap pressed down and released, a single crisp plastic click, very close microphone, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### key-press.3

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:13:29.554Z | 0.48 s | -13.36 dB | -36.36 LUFS | 1 | 6 | no |  |

Prompt: One mechanical keyboard key cap pressed down and released, a single crisp plastic click, very close microphone, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### key-press.4

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:13:31.496Z | 0.48 s | -0.74 dB | -21.04 LUFS | 1 | 6 | no |  |

Prompt: One mechanical keyboard key cap pressed down and released, a single crisp plastic click, very close microphone, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### key-press.5

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:13:34.044Z | 0.48 s | -2.08 dB | -23.75 LUFS | 1 | 6 | no |  |

Prompt: One mechanical keyboard key cap pressed down and released, a single crisp plastic click, very close microphone, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### key-press.6

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:13:35.878Z | 0.48 s | -49.15 dB | null LUFS | 1 | 6 | no |  |

Prompt: One mechanical keyboard key cap pressed down and released, a single crisp plastic click, very close microphone, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### turret-rise

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:13:38.447Z | 0.6 s | -34.39 dB | -50.63 LUFS | 1 | 7 | no |  |

Prompt: A small metal hatch flipping open, then a small servo motor lifting a part with a short whirr, close microphone, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### bolt-fire.1

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:13:41.327Z | 0.48 s | -2.62 dB | -11.55 LUFS | 1 | 6 | no |  |

Prompt: One short tight energy bolt shot, a quick dry zap like a small toy laser, small, not a cannon, a single shot, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### bolt-fire.2

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:13:43.528Z | 0.48 s | -12.57 dB | -26.19 LUFS | 1 | 6 | no |  |

Prompt: One short tight energy bolt shot, a quick dry zap like a small toy laser, small, not a cannon, a single shot, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### bolt-fire.3

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:13:45.332Z | 0.48 s | -21.19 dB | -40.88 LUFS | 1 | 6 | no |  |

Prompt: One short tight energy bolt shot, a quick dry zap like a small toy laser, small, not a cannon, a single shot, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### bolt-hit.1

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:13:47.708Z | 0.48 s | 0.97 dB | -17.62 LUFS | 1 | 6 | no |  |

Prompt: One hot sharp crack of a small energy bolt striking hard plastic, a single dry snap with a tiny sizzle, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### bolt-hit.2

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:13:49.501Z | 0.48 s | -17.98 dB | -37.11 LUFS | 1 | 6 | no |  |

Prompt: One hot sharp crack of a small energy bolt striking hard plastic, a single dry snap with a tiny sizzle, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### bolt-hit.3

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:13:51.212Z | 0.48 s | -21.73 dB | -42.72 LUFS | 1 | 6 | no |  |

Prompt: One hot sharp crack of a small energy bolt striking hard plastic, a single dry snap with a tiny sizzle, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### sizzle

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:13:53.463Z | 1.2 s | -27.89 dB | -36.76 LUFS | 1 | 13 | no |  |

Prompt: A small burn hole fizzing out on plastic, a quiet short sizzle that dies away, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### keys-shuffle

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:13:55.625Z | 0.68 s | -5.05 dB | -24.87 LUFS | 1 | 8 | no |  |

Prompt: Many plastic keyboard key caps clattering quickly as they change places on a metal tray, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### slab-drop.1

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:13:58.128Z | 0.8 s | -2.43 dB | -19.63 LUFS | 1 | 9 | no |  |

Prompt: One very heavy ceramic block landing flat on a ceramic floor, a single deep hard thud, close microphone, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### slab-drop.2

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:14:00.392Z | 0.8 s | -24.58 dB | -44.11 LUFS | 1 | 9 | no |  |

Prompt: One very heavy ceramic block landing flat on a ceramic floor, a single deep hard thud, close microphone, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### slab-drop.3

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:14:47.363Z | 0.8 s | -26.2 dB | -44.49 LUFS | 1 | 9 | no |  |

Prompt: One very heavy ceramic block landing flat on a ceramic floor, a single deep hard thud, close microphone, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### paper-slide

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:14:49.491Z | 0.6 s | -14.64 dB | -21.67 LUFS | 1 | 7 | no |  |

Prompt: One sheet of paper sliding across a hard smooth desk, a single short soft hiss, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### shredder

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:14:52.937Z | 4 s | -8.8 dB | -16.73 LUFS | 1 | 44 | no |  |

Prompt: A small office paper shredder running steadily under load, its motor grinding through paper, a constant whirr, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### paper-strain

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:14:55.379Z | 1.48 s | -29.79 dB | -52.38 LUFS | 1 | 17 | no |  |

Prompt: A sheet of paper pulled tight between two grips, creaking and straining, quiet dry fibrous creaks, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### strips-zip

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:14:57.656Z | 1 s | -14.81 dB | -23.74 LUFS | 1 | 11 | no |  |

Prompt: Many thin paper strips zipping back together quickly, a fast rising papery zip, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### row-open

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:15:00.245Z | 0.6 s | -23.19 dB | -40.08 LUFS | 1 | 7 | no |  |

Prompt: A small drawer mechanism sliding open and stopping with a soft thunk, a single short movement, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### dial-wind

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:15:02.582Z | 0.8 s | -8.5 dB | -29.51 LUFS | 1 | 9 | no |  |

Prompt: A rotary telephone dial pulled round by a finger against its spring, a single ratcheting pull, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### dial-return

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:15:05.560Z | 0.88 s | -2.1 dB | -24.21 LUFS | 1 | 10 | no |  |

Prompt: A rotary telephone dial let go and running back to rest, a fast mechanical purr ending in a soft stop, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### lever-pull

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:15:08.627Z | 0.68 s | -12.11 dB | -29.05 LUFS | 1 | 8 | no |  |

Prompt: A mechanical slot machine lever pulled down and released, a heavy metal ratchet and a spring clunk, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### reels-spin

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:15:11.476Z | 2.48 s | -11.36 dB | -25.65 LUFS | 1 | 28 | no |  |

Prompt: Three mechanical slot machine reels spinning with a whirr and stopping one after another with three separate clunks, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### coins.1

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:15:13.739Z | 1.48 s | -5.57 dB | -18.04 LUFS | 1 | 17 | no |  |

Prompt: A burst of metal coins pouring out and scattering on a hard metal tray, bright clinking, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### coins.2

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:15:15.541Z | 1.48 s | -7.28 dB | -22.25 LUFS | 2 | 17 | no |  |

Prompt: A burst of metal coins pouring out and scattering on a hard metal tray, bright clinking, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### crank-turn

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:15:17.918Z | 0.8 s | -1.91 dB | -20.06 LUFS | 1 | 9 | no |  |

Prompt: One turn of a small geared metal hand crank, ratcheting clicks, a single turn, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### crank-runaway

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:15:20.469Z | 2 s | -8.56 dB | -28.22 LUFS | 2 | 22 | no |  |

Prompt: A small geared metal hand crank spinning faster and faster out of control, its ratchet clicks speeding up into a rattle, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### flatten

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:15:23.056Z | 0.48 s | -24.71 dB | -40.47 LUFS | 1 | 6 | no |  |

Prompt: A short wet flat comic splat, something soft slapped flat on a hard tile, a single splat, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### peel-up

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:15:25.326Z | 0.6 s | -24.01 dB | -36.95 LUFS | 1 | 7 | no |  |

Prompt: Something thin and rubbery peeling off a smooth glass surface and popping back to shape, a short peel then a small pop, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### ball-seal

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:15:27.984Z | 1 s | -7.32 dB | -19.22 LUFS | 1 | 11 | no |  |

Prompt: A short suck of air, then a hard clear plastic shell snapping shut with one firm click, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### tube-run

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:15:30.540Z | 1.48 s | -23.5 dB | -41.64 LUFS | 1 | 17 | no |  |

Prompt: A hard plastic ball rolling fast down a hollow plastic tube, a rattling hollow roll, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### lights-down

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:15:33.232Z | 1.48 s | -19.95 dB | -41.97 LUFS | 1 | 17 | no |  |

Prompt: The lights of a big room dimming, a low electrical hum falling in pitch and one relay clack, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### power-on

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:15:36.314Z | 2.48 s | -12.77 dB | -26.84 LUFS | 4 | 28 | no |  |

Prompt: A pinball machine powering up, relays clacking, a transformer hum rising, then a short start up chime struck on mechanical bells, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### plunger

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:15:38.615Z | 0.8 s | -17.69 dB | -32.63 LUFS | 1 | 9 | no |  |

Prompt: A pinball spring plunger pulled back and released, the spring twanging and the rod knocking into a hard plastic ball, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### bumper.1

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:15:41.296Z | 0.48 s | -61.65 dB | null LUFS | 1 | 6 | no |  |

Prompt: One pinball pop bumper firing, a sharp solenoid thwack with a single bell ding, one hit, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### bumper.2

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:15:43.319Z | 0.48 s | -33.24 dB | -49.68 LUFS | 1 | 6 | no |  |

Prompt: One pinball pop bumper firing, a sharp solenoid thwack with a single bell ding, one hit, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### bumper.3

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:15:45.352Z | 0.48 s | -44.81 dB | -59.62 LUFS | 1 | 6 | no |  |

Prompt: One pinball pop bumper firing, a sharp solenoid thwack with a single bell ding, one hit, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### bumper.4

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:15:47.533Z | 0.48 s | -3.75 dB | -27.1 LUFS | 1 | 6 | no |  |

Prompt: One pinball pop bumper firing, a sharp solenoid thwack with a single bell ding, one hit, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### scoop-kick

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:16:21.138Z | 0.6 s | -9.12 dB | -28.19 LUFS | 1 | 7 | no |  |

Prompt: A ball dropping into a hole in a pinball table and kicked out by a solenoid, a clunk then a sharp kick, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### flasher

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:16:23.429Z | 0.48 s | -1.32 dB | -23.45 LUFS | 1 | 6 | no |  |

Prompt: One electrical relay click and the snap of a bright flash lamp firing, a single short tick and snap, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### ramp-roll

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:16:26.107Z | 2 s | -15.56 dB | -31.22 LUFS | 1 | 22 | no |  |

Prompt: A hard plastic ball rolling fast along a steel wire ramp of a pinball table, a ringing metallic roll, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### ball-drop

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:16:28.891Z | 0.48 s | -1.19 dB | -25.45 LUFS | 1 | 6 | no |  |

Prompt: One steel ball dropping onto a wooden board, a single hard knock, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### flipper.1

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:16:31.215Z | 0.48 s | -24.56 dB | -38.61 LUFS | 1 | 6 | no |  |

Prompt: One pinball flipper firing, a single sharp solenoid snap and the slap of a plastic bat, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### flipper.2

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:16:33.640Z | 0.48 s | 0.6 dB | -23.97 LUFS | 1 | 6 | no |  |

Prompt: One pinball flipper firing, a single sharp solenoid snap and the slap of a plastic bat, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### flipper.3

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:16:35.613Z | 0.48 s | -29.98 dB | -47.42 LUFS | 1 | 6 | no |  |

Prompt: One pinball flipper firing, a single sharp solenoid snap and the slap of a plastic bat, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### doors-slam

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:16:37.797Z | 0.6 s | -4.74 dB | -21.63 LUFS | 1 | 7 | no |  |

Prompt: Two heavy glass doors slamming shut together, one deep slam with a rattle of glass in metal frames, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### drain

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:16:40.450Z | 1.2 s | -9.43 dB | -31.52 LUFS | 2 | 13 | no |  |

Prompt: A pinball rolling down the drain and dropping into the trough with a clunk, with a falling run of mechanical bells, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### tier-fall

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:16:42.974Z | 0.8 s | -17.94 dB | -37.48 LUFS | 1 | 9 | no |  |

Prompt: A ball dropping down a short metal chute and landing on a wooden board, a metallic rattle then a knock, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### lift

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:16:45.628Z | 1 s | -10.61 dB | -23.41 LUFS | 1 | 11 | no |  |

Prompt: A ball sucked up a tube by air, a rising whoosh of air ending in a soft pop at the top, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### spiral

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:16:48.477Z | 2 s | -14.53 dB | -38.33 LUFS | 2 | 22 | no |  |

Prompt: A hard plastic ball rolling round and round down a plastic spiral ramp, slowing as it goes, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### spinner

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:16:50.730Z | 0.8 s | -12.06 dB | -31.12 LUFS | 1 | 9 | no |  |

Prompt: A pinball spinner target hit hard and spinning down, fast metallic ticking that slows, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### drop-target.1

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:16:53.749Z | 0.48 s | -2.53 dB | -21.75 LUFS | 1 | 6 | no |  |

Prompt: One pinball drop target knocked down, a single flat plastic clack, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### drop-target.2

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:16:55.949Z | 0.48 s | -25.41 dB | -43.39 LUFS | 1 | 6 | no |  |

Prompt: One pinball drop target knocked down, a single flat plastic clack, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### sling.1

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:16:58.830Z | 0.48 s | -21.62 dB | -37.09 LUFS | 1 | 6 | no |  |

Prompt: One pinball slingshot firing, a single short rubber snap, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### sling.2

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:17:00.658Z | 0.48 s | -22.93 dB | -39.28 LUFS | 1 | 6 | no |  |

Prompt: One pinball slingshot firing, a single short rubber snap, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### ball-open

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:17:02.906Z | 0.68 s | -15.2 dB | -40.66 LUFS | 1 | 8 | no |  |

Prompt: A hard clear plastic shell cracking open and its two halves rattling on a hard floor, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### checkbox

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:17:05.347Z | 0.48 s | -5.85 dB | -31.2 LUFS | 1 | 6 | no |  |

Prompt: A small crisp tick, a tiny plastic switch clicking once, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### button-crack

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:17:07.701Z | 1 s | -13.45 dB | -36.02 LUFS | 2 | 11 | no |  |

Prompt: Hard plastic and ceramic cracking and splintering as a large button tears loose from its housing, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### unfold

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:17:10.421Z | 2 s | -10.9 dB | -31.5 LUFS | 2 | 22 | no |  |

Prompt: Metal plates and joints unfolding and locking into place one after another with small servo motors whirring, a machine putting itself together, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### boss-loop

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:17:14.932Z | 8 s | -11.62 dB | -25.39 LUFS | 1 | 88 | no |  |

Prompt: A short loop of tense, slightly silly fight music, a fast plucked string and staccato bassoon figure over a snare drum march, comic cartoon chase tension, steady tempo, close and dry, recorded in a quiet room, real materials, no voice

### dart-fire.1

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:17:17.624Z | 0.48 s | -14.03 dB | -35.82 LUFS | 1 | 6 | no |  |

Prompt: One tiny bright pew, almost a click, a very small toy dart launcher firing once, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### dart-fire.2

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:17:19.657Z | 0.48 s | -16.33 dB | -37.5 LUFS | 1 | 6 | no |  |

Prompt: One tiny bright pew, almost a click, a very small toy dart launcher firing once, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### dart-fire.3

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:17:21.765Z | 0.48 s | -19.25 dB | -40.71 LUFS | 1 | 6 | no |  |

Prompt: One tiny bright pew, almost a click, a very small toy dart launcher firing once, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### dart-fire.4

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:17:54.689Z | 0.48 s | -12.45 dB | -31.42 LUFS | 1 | 6 | no |  |

Prompt: One tiny bright pew, almost a click, a very small toy dart launcher firing once, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### dart-hit.1

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:17:56.933Z | 0.48 s | -24.29 dB | -40.37 LUFS | 1 | 6 | no |  |

Prompt: One small dart striking a metal plate, a tiny bright tick with a spark, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### dart-hit.2

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:17:58.873Z | 0.48 s | -46.86 dB | -55.1 LUFS | 1 | 6 | no |  |

Prompt: One small dart striking a metal plate, a tiny bright tick with a spark, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### dart-hit.3

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:18:00.709Z | 0.48 s | -55.08 dB | null LUFS | 1 | 6 | no |  |

Prompt: One small dart striking a metal plate, a tiny bright tick with a spark, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### dart-hit.4

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:18:02.918Z | 0.48 s | -45.63 dB | -62.52 LUFS | 1 | 6 | no |  |

Prompt: One small dart striking a metal plate, a tiny bright tick with a spark, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### slab-fire.1

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:18:05.602Z | 0.48 s | -31.79 dB | -51.09 LUFS | 1 | 6 | no |  |

Prompt: One heavy stone block launched hard by a machine, a deep pneumatic thump and a short rush of air, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### slab-fire.2

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:18:07.837Z | 0.48 s | -15.99 dB | -28.7 LUFS | 1 | 6 | no |  |

Prompt: One heavy stone block launched hard by a machine, a deep pneumatic thump and a short rush of air, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### slab-fire.3

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:18:10.218Z | 0.48 s | -23.33 dB | -33.85 LUFS | 1 | 6 | no |  |

Prompt: One heavy stone block launched hard by a machine, a deep pneumatic thump and a short rush of air, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### popup.1

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:18:13.024Z | 0.48 s | -36.73 dB | -54.29 LUFS | 1 | 6 | no |  |

Prompt: A flat rigid plastic panel snapping upright on a spring hinge, a single quick flap and clack, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### popup.2

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:18:14.885Z | 0.48 s | -38.01 dB | -50.07 LUFS | 1 | 6 | no |  |

Prompt: A flat rigid plastic panel snapping upright on a spring hinge, a single quick flap and clack, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### popup.3

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:18:16.795Z | 0.48 s | -46.37 dB | -66.31 LUFS | 1 | 6 | no |  |

Prompt: A flat rigid plastic panel snapping upright on a spring hinge, a single quick flap and clack, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### power-down

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:18:19.276Z | 1.76 s | -1.23 dB | -12.68 LUFS | 1 | 20 | no |  |

Prompt: A machine losing power, its motors winding down in pitch, ending with one last metal clank, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### hold-music

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:18:22.979Z | 4 s | -7.92 dB | -17.6 LUFS | 1 | 44 | no |  |

Prompt: Bland, tinny telephone hold music heard through a small phone speaker, a simple cheerful electric piano tune, thin and narrow, close and dry, recorded in a quiet room, real materials, no voice

### letter-drop

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:18:26.052Z | 0.48 s | -35.33 dB | -52.95 LUFS | 1 | 6 | no |  |

Prompt: One sheet of paper landing softly on a wooden desk, a single light papery pat, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### stamp

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:18:28.569Z | 0.6 s | -39.57 dB | -60.14 LUFS | 1 | 7 | no |  |

Prompt: A big rubber stamp slammed down on paper on a hard wooden desk, a single heavy thump, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### ui-tick

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:18:31.129Z | 0.48 s | -0.42 dB | -24.85 LUFS | 1 | 6 | no |  |

Prompt: A small soft tick, a single tiny soft click, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### key-tap

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:18:33.926Z | 0.48 s | -18.14 dB | -42.66 LUFS | 1 | 6 | no |  |

Prompt: A single soft tap on a laptop key, quiet and dull, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

### ui-send

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:18:36.499Z | 0.48 s | -26.42 dB | -41.18 LUFS | 1 | 6 | no |  |

Prompt: A short soft send tone, a single gentle rising pop like a message being sent, close and dry, recorded in a quiet room, real materials, no music, no melody, no voice
