# The log of every sound

Every sound of the site and the film is made the same way. This file is its log. The part under `## Takes` is written by `npm run sound` from `audio/TAKES.json`: do not edit it by hand.

## The way a sound is made

1. A take comes from the sound tool as a file. `npm run sound -- --cue ID --file F` measures it and files it under `out/work/audio/takes/`. A line of the narrator: `--line BEAT:N`.
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

A loop is crossfaded end into start, and its seam is checked by number. Variants are cut apart from one take.

## The line that ends every effect prompt

close and dry, recorded in a quiet room, real materials, no music, no melody, no voice

For hold music the words about music are left out.

