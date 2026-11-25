# Sound: notes and decisions

The sound side of the build. Owner: the sound builder. Branch `agent/audio`.

## What is here

| File | What it does |
| --- | --- |
| `src/audio/cues.ts` | The table of events to cues, the table of live lines to triggers, the level class of each cue, the order of the variants. Data only: it imports nothing, because `src/app.ts` reads it in every mode. |
| `src/audio/levels.ts` | Every number of the sound side that `config/showcase.json` does not hold. |
| `src/audio/dsp.ts` | Reading and writing sound files, the filters, loudness and true peak, the limiter, the chain, the loop seam. Plain arithmetic, shared by the tools and the tests. |
| `src/audio/narrator.ts` | The narrator's rules as arithmetic on times. |
| `src/audio/mix.ts` | The film's sound laid out from its events. The same inputs give the same samples. |
| `src/audio/index.ts` | The site's sound engine: `makeSound({ base })`. |
| `tools/sound.mjs` | `npm run sound`. |
| `tools/mix.mjs` | `npm run mix`, and the sound checks A1 to A11. |
| `tests/audio-*.test.ts` | Cues, chain, mix, narrator, engine. |

## The commands

```
npm run sound                                   what is kept and what is not
npm run sound -- --cue step --file take.mp3     measure a take and file it
npm run sound -- --line step1.tug:0 --file f    the same for a line of the film
npm run sound -- --line live.hit:1 --file f     the same for a live line
npm run sound -- --cue step --keep              run the chain on the last take and keep it
npm run sound -- --cue step --keep --take 2 --listener answers.json --prompt "..." --cost 0.2
npm run sound -- --pack                         build public/audio
npm run sound -- --sheet                        draw the kept sounds on one picture
npm run sound -- --check                        the sound checks, written to out/work/sound-checks.json
npm run sound -- --fixtures                     stand-in sounds made with ffmpeg, in a scratch root
npm run mix                                     audio/mix/review.wav
npm run mix -- --final                          audio/final/film-b.wav
```

`--root DIR` moves every place a sound file is written under one folder. The fixtures run under `out/work/audio/fixture-run`, so they never touch `audio/` or `public/audio/`.

## State

No sound is kept. `public/audio/index.json` lists nothing, the engine reports `available() === false` after `unlock()`, and `npm run mix` writes a silent file of the film's exact length. The day takes exist, the commands above file them, keep them, pack them and mix them with no code change. That path has been run end to end on fixtures.

`src/main.ts` does not load the engine yet. The wiring it needs is in `src/audio/WIRING.md`.

## Decisions

1. `available()` is true before `unlock()`, because nothing is known to have failed, and false once loading has found nothing to play. `onChange(listener)` tells the interface when that changes, so it can hide the control. `state()` gives `locked`, `loading`, `ready` or `silent`.
2. With `public/audio/index.json` itself deleted the browser writes its own line about the missing file to the console. The engine logs nothing and throws nothing. The repository always ships the index, so check A11 holds as long as the index stays.
3. The same cue twice within 12 ms sounds once. A page may emit both `bolt-hit` and `bolt-hit-cursor` for one contact. In the mix the rule is the same frame.
4. The room tone is not lowered under a line. The effects are, by `audio.duckDb`, over 0.08 s down and 0.3 s up.
5. The narrator. A line never interrupts another. The gap `audio.liveNarratorMinGapSeconds` binds a live line on both sides. Lines of a beat keep `audio.lineGapSeconds` between them. A line of a beat may start up to 1.5 s late, a live line up to 0.4 s late: later than that it is dropped, never queued. A new beat gives up the lines of the beat before that have not started. The place in a list of live lines moves on only when a line is spoken.
6. Kept sounds are 24 bit WAV at `audio.sampleRate`, written by the tool's own chain in plain arithmetic, with the level of the class in the file. Effects are mono, the room tone may stay stereo. The mix reads only those files and uses no outside program, which is why it gives the same bytes twice.
7. What the site ships. Short sounds are FLAC, 16 bit mono, joined into one file `public/audio/sfx.bin` with their places in `public/audio/index.json`. Loops are FLAC files of their own. The narrator's lines are MP3, 64 kbit mono. FLAC, because MP3 adds padding at both ends, which would move a contact off its frame and put a gap in a loop.
8. The takes are counted in `audio/TAKES.json`, a text file that is committed. `audio/RECIPE.md` is written from it under the heading `## Takes`: what stands above that heading is kept as it is. Check A8 reads the same file. `--round N` files a take against a review round.
9. `ASSETS.md` is not the sound builder's file. The tool writes the rows it needs to `audio/ASSETS-ROWS.md` for the Builder to copy. Check A5 fails for a kept sound until its row is in `ASSETS.md`.
10. A cue with one variant always plays at its own pitch. A cue with variants steps them in order, with the list of offsets in cents `0, 35, -30, 20, -45, 10, -15` laid over them in order. Nothing is random.
11. A loop stops at its stop event, at `page-turn`, or after 30 s. Hold music is cut dead, with no fade, after `audio.holdMusicSeconds` or at its stop event.
12. Variants are cut from one take where the level falls 30 dB under the take's peak for 60 ms. `--hits 1,3,4` picks which hits become the variants, `--slots 2` keeps one hit as one named variant.
13. `npm run mix` reads `cut/CUTLIST.json` when it holds `events` with a `name` and a `frame`, `seconds` or `step` each, and optionally `lines` with `beat`, `index` and `frame` or `start`. Anything else, and it says so and reads the stage.
14. The sound checks that need the site in a browser (A1, A2, A11, half of A3 and A4) say "not yet" until `src/main.ts` loads the engine. What the engine does before the unlock and with no sound files is held by `tests/audio-engine.test.ts` on a stand-in for the browser's audio graph.
15. The prompt line of the kit ends every effect prompt the tool records. For hold music the words about music are left out.

## Where the brief and the kit differ

Nothing found that changes the work. One point to know: the brief names a `skip` event for the live line, and `skip` is not a cue of `audio.sfx`, so a skip speaks a line and plays no effect.
