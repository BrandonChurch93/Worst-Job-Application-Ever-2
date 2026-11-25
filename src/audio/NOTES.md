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
npm run sound -- --browser                      the engine in a real browser, before and after a click
npm run mix -- --picture                        the mix drawn on one picture
npm run sound -- --fixtures                     stand-in sounds made with ffmpeg, in a scratch root
npm run mix                                     audio/mix/review.wav
npm run mix -- --final                          audio/final/film-b.wav and audio/final/film-a.wav
```

`--root DIR` moves every place a sound file is written under one folder. The fixtures run under `out/work/audio/fixture-run`, so they never touch `audio/` or `public/audio/`.

## State

No sound is kept. `public/audio/index.json` lists nothing, the engine reports `available() === false`, and `npm run mix` writes a silent file of the film's exact length. The day takes exist, the commands above file them, keep them, pack them and mix them with no code change. That path has been run end to end on fixtures.

`src/main.ts` loads the engine by a dynamic import in the modes live, film and loop, since main f28f064. `src/audio/WIRING.md` says what the engine expects of that wiring.

## Decisions

1. The index of the sound files, `public/audio/index.json`, is a text file and is part of the build: the engine imports it. So the engine knows from the start whether there is any sound. With an index that lists nothing `available()` is false from the first moment, `state()` is `silent`, and `unlock()` makes nothing and asks for nothing. With an index that lists sounds `available()` is true until loading has found nothing to play. `onChange(listener)` tells the interface when that changes. `makeSound({ base, index })` takes another index, which the tests and the browser check use.
2. With the sound files deleted and the index still naming them, the engine asks for the packed file, does not find it, stops there, turns silent and throws nothing. The browser itself writes one line about the file it did not find: no code can stop that line. `npm run sound -- --pack` writes the index and the files together, so the two only part when a file is deleted by hand.
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
14. `npm run sound -- --check` opens a browser, twice. First the engine alone: it is built onto a page of its own in `out/work/audio/harness/` and measured before and after a click, with the sound files of the root, with plain audio elements, with an index that lists nothing, and with the files removed. Then, once a file of the site loads the engine, the built site itself: what it makes and asks for before its first picture and before the first click (A1, A4), the sound control by a pointer click, by Tab, Enter and Space, with the level heard at the output in each state (A2), the site with every sound file answered as not found (A11), and one judged still in capture mode rendered with the audio code in the build and with it blocked, compared by sha256 (A3). Until the site loads the engine those five say "not yet" and give the engine's numbers. With `--root` the site is built again into `out/work/audio/site/` with the index and the files of that root, so the whole site can be checked with stand-ins. `npm run sound -- --browser` runs the engine part alone, `--browser --site` both.
15. The prompt line of the kit ends every effect prompt the tool records. For hold music the words about music are left out.

16. Film A. `npm run mix -- --final` writes `audio/final/film-b.wav` and then `audio/final/film-a.wav`: the opening and then film B unchanged, every event and line of film B moved back by the opening's frames. The opening's own sounds come from `opening.events` of `cut/CUTLIST.json` if the cut list ever holds them, and otherwise from the times of `src/film/opening.ts`: a `key-tap` on the frame each letter of the prompt first shows, spaces too, a `ui-tick` when the level control opens, when the level is picked and as each line of the build screen is ticked off, and one `ui-send` on the frame the send control starts to go down. The room tone starts where the opening ends, with a 30 ms fade in. The live site plays no sound over the opening: `src/main.ts` sends the engine nothing before film B starts.
17. `audio/mix/review.json` carries a sha256 of the list of events and lines it was made from. Check A9 says "not yet, run npm run mix" when the cut list has changed since.
18. `stop()` stops everything, the room tone too. The tone starts again at the next event, beat or trigger.
19. A take past the limit is still filed, with a warning, because it was made and paid for and the log must show it. Check A8 then fails. The tool never asks a service for a take, so it cannot refuse the spending, only show it.
20. While the page is hidden the engine holds: the sound graph is suspended and carries on from the same point when the page is back, so a line is never spoken to a tab nobody looks at. With plain audio elements everything is stopped instead, and the tone starts again at the next event.
21. The site calls `unlock()` at the first press. Some browsers, phones above all, let sound start only at the end of a touch or at a click. So once unlocked, the sound graph is asked to run again at every `pointerup`, `touchend`, `click` and `keydown` for as long as it is not running. Nothing listens before `unlock()`. MEASURED in Chromium only: what Safari on a phone does is UNKNOWN.
22. `share`, the press on the share control of the last page, plays `button-press`. `popup-close` is silent on purpose and is listed as such in `silentEvents`. `npm run sound` with no flag reads every event name the pages emit and names each one that has no cue, stops nothing, sets off no line and is not listed as silent. It is a line of the tool and not a test, because a missing sound must not turn `npm test` red for another builder.

## Where the brief and the kit differ

Nothing found that changes the work. One point to know: the brief names a `skip` event for the live line, and `skip` is not a cue of `audio.sfx`, so a skip speaks a line and plays no effect.
