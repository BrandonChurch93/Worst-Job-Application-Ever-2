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
| 1 | build | 2026-11-25T18:05:35.681Z | 5.341 s | -1.17 dB | -21.23 LUFS | 5 | 27 | no |  |

Words: Here we find / the applicant. / Rent is due.

### line.marketing.perks.0

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:05:37.060Z | 6.92 s | -1.88 dB | -19.14 LUFS | 6 | 30 | no |  |

Words: It spots unlimited PTO. / Poor thing / believes it.

### line.step1.firstName.0

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:05:38.537Z | 5.433 s | -2.67 dB | -20.28 LUFS | 3 | 29 | no |  |

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
| 1 | build | 2026-11-25T18:05:41.273Z | 9.706 s | -3.98 dB | -21.68 LUFS | 8 | 40 | no |  |

Words: A valid email. / Rejected. / The system / is working as designed.

### line.step1.tug.0

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:05:42.706Z | 8.081 s | -2.15 dB | -19.03 LUFS | 5 | 35 | no |  |

Words: It fights for the resume. / Two pages. / One of them is true.

### line.step2.dial.0

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:05:44.408Z | 6.037 s | -3.57 dB | -19.67 LUFS | 4 | 31 | no |  |

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
| 1 | build | 2026-11-25T18:05:47.066Z | 6.92 s | -4.3 dB | -18.78 LUFS | 6 | 32 | no |  |

Words: The skills assessment. / No skills / will be assessed.

### line.pinball.launch.0

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:05:48.292Z | 3.251 s | -3.42 dB | -20.26 LUFS | 3 | 14 | no |  |

Words: A career. / In reverse.

### line.pinball.lobby.0

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:05:49.565Z | 3.808 s | -2.92 dB | -19 LUFS | 4 | 19 | no |  |

Words: Corporate headquarters. / So close.

### line.pinball.coffee.0

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:05:50.805Z | 4.087 s | -2.83 dB | -20.86 LUFS | 3 | 17 | no |  |

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
| 1 | build | 2026-11-25T18:05:53.597Z | 5.759 s | -2.61 dB | -22.28 LUFS | 3 | 28 | no |  |

Words: Fired. / Before it was hired. / A new record.

### line.pinball.drain.0

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:05:55.128Z | 4.783 s | -3.96 dB | -20.2 LUFS | 2 | 23 | no |  |

Words: The unemployment office. / It knows the way.

### line.boss.verify.0

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:05:56.274Z | 5.387 s | -3.21 dB | -20.92 LUFS | 4 | 26 | no |  |

Words: Not a robot, / it claims. / We will see.

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
| 1 | build | 2026-11-25T18:05:58.979Z | 3.669 s | -4.29 dB | -20.92 LUFS | 5 | 17 | no |  |

Words: Session expired. / A classic.

### line.decision.letter.0

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:06:00.204Z | 3.529 s | -3.59 dB | -18.33 LUFS | 3 | 17 | no |  |

Words: Rejected. / In under a second.

### line.decision.metrics.0

Takes used: 1 of 3.

| Take | Round | Filed | Length | Peak | Loudness | Hits | Cost | Kept | Why |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | build | 2026-11-25T18:06:01.421Z | 5.898 s | -4.05 dB | -21.69 LUFS | 3 | 25 | no |  |

Words: It will apply again tomorrow. / They always do.
