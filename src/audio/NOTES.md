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
| `tests/audio-*.test.ts` | Cues, chain, mix, narrator, engine, and the tool's reading of a name, of the listener's answers and of a line's numbers. |

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
14. `npm run sound -- --check` opens a browser, twice. First the engine alone: it is built onto a page of its own in `out/work/audio/harness/` and measured before and after a click, with the sound files of the root, with plain audio elements, with an index that lists nothing, and with the files removed. Then, once a file of the site loads the engine, the built site itself: what it makes and asks for before its first picture and before the first click (A1, A4), the sound control by a pointer click, by Tab, Enter and Space, with the level heard at the output in each state (A2), the site with every sound file answered as not found (A11), and one judged still in capture mode rendered with the audio code in the build and with it blocked, compared by sha256 (A3). Until the site loads the engine those five say "not yet" and give the engine's numbers. With `--root` the site is built again into `out/work/audio/site/` with the index and the files of that root, so the whole site can be checked with stand-ins. `npm run sound -- --browser` runs the engine part alone, `--browser --site` both. When the site has sound the same visit also plays the film on the site and reads the level and the count of running sounds while it plays, paused, playing again, after a seek, with the page hidden and back: `--check` prints that as its line before last and writes it under `also` in the record.
15. The prompt line of the kit ends every effect prompt the tool records. For hold music the words about music are left out.

16. Film A. `npm run mix -- --final` writes `audio/final/film-b.wav` and then `audio/final/film-a.wav`: the opening and then film B unchanged, every event and line of film B moved back by the opening's frames. The opening's own sounds come from `opening.events` of `cut/CUTLIST.json` if the cut list ever holds them, and otherwise from the times of `src/film/opening.ts`: a `key-tap` on the frame each letter of the prompt first shows, spaces too, a `ui-tick` when the level control opens, when the level is picked and as each line of the build screen is ticked off, and one `ui-send` on the frame the send control starts to go down. The room tone starts where the opening ends, with a 30 ms fade in. On the site the opening's sounds come with decision 24.
17. `audio/mix/review.json` carries a sha256 of the list of events and lines it was made from. Check A9 says "not yet, run npm run mix" when the cut list has changed since.
18. `stop()` stops everything, the room tone too, and the engine stays fully silent: a pause is silent. `start()` says that play runs again and brings the room tone back at once. An event or a beat does the same, so the engine also works with a site that never calls `start()`, only later. A live line set off while stopped is spoken without the tone. `start()` and `stop()` before the first click make nothing: they are remembered, so a film that starts paused stays silent after the click until it plays. The calls the site has to make are in `src/audio/WIRING.md`, and `src/main.ts` makes them since main at c5a09f6.
19. A take past the limit is still filed, with a warning, because it was made and paid for and the log must show it. Check A8 then fails. The tool never asks a service for a take, so it cannot refuse the spending, only show it.
20. While the page is hidden the engine holds: the sound graph is suspended and carries on from the same point when the page is back, so a line is never spoken to a tab nobody looks at. With plain audio elements everything is stopped instead, and the tone starts again at the next event.
21. The site calls `unlock()` at the first press. Some browsers, phones above all, let sound start only at the end of a touch or at a click. So once unlocked, the sound graph is asked to run again at every `pointerup`, `touchend`, `click` and `keydown` for as long as it is not running. Nothing listens before `unlock()`. MEASURED in Chromium only: what Safari on a phone does is UNKNOWN.
22. `share`, the press on the share control of the last page, plays `button-press`. `popup-close` is silent on purpose and is listed as such in `silentEvents`. `npm run sound` with no flag reads every event name the pages emit and names each one that has no cue, stops nothing, sets off no line and is not listed as silent. It is a line of the tool and not a test, because a missing sound must not turn `npm test` red for another builder.
23. `npm run sound -- --fixtures --answered --root DIR` makes the stand-ins with a stand-in answer of the listener on each and a table of rows in `DIR/ASSETS.md`, so the whole path can be seen to pass before a take exists: on such a folder all eleven checks pass. The answers say in their own words that nobody listened. With `--root` check A5 reads the rows from that folder, without it from `ASSETS.md`.
24. Film A on the site has the sounds of its opening. `opening(from, to)` takes the span of film time the page has just drawn, in seconds from the start of film A, and plays the sounds the film A mix lays there: a key tap for each letter, the ticks, the send tone. Their times come from the same table as the mix, `openingEvents` in `src/audio/cues.ts`. They are known before they are due, so each is set on the sound clock `LIVE.aheadSeconds` ahead and is on its time however slowly the page draws: the film moves at most 0.5 s in one drawn frame and the engine looks 0.6 s ahead. A pause takes back what was set ahead. The room tone stays out until the opening is over, as in the mix. `opening(T, T)` plays nothing and only says where the film stands, so `start()` knows whether the tone is due. It needs four lines in `src/main.ts`, which the Builder took on main at f4ba776. Film B and the live site never call it.
25. The record beside a kept sound is read by the review page, `tools/review.mjs`, so it carries the names that page reads: `kind` is `cue`, `line` or `live-line`, a live line has its key as `group`, a line has its words as `text`, and a cue has `describes`, its row of the table in `kit/03-METHOD.md`. Before this a live line was written as `line` and the review page listed it under other sounds. MEASURED with the stand-ins copied into `audio/kept/` for one run of `node tools/review.mjs` and taken out again: 37 film lines, 14 live lines and 61 cue rows with 93 players, nothing under other sounds, no cue without its describing line.
26. The listener's questions are fixed and printed by `npm run sound -- --cue ID` and `--line BEAT:N` with the answers file to fill in. The listener of a line is not told the line. A yes or no question left unanswered counts against the take, so an empty answers file does not pass. `sameRoom`, the family check, may stay open: it can only be asked once two other sounds are kept.
27. Gate G8 of `tools/gate.mjs` wants every file under `public/` named in `ASSETS.md`, all but `public/audio/index.json`. So `--pack` adds to `audio/ASSETS-ROWS.md` one row for each sound file the site ships: the packed file, each loop, each line. MEASURED on the answered stand-in folder: 54 shipped sound files, 0 not named in the rows. With no kept sound `--pack` writes no rows file.
28. A beat can be taken up in its middle. `beat(id, mode, into)` takes the seconds of the beat already past; lines whose place lies before that are left out, the others are booked at their place less `into`. Without the third value nothing changes. `src/main.ts` called `beat` only when the start of a beat lay in the span just drawn, so after a seek or a pause inside a beat the rest of its lines stayed unspoken. The call after `start()` in the film's `play()` and `seek()` was `src/audio/NEEDS.patch`; the Builder took it, on main at 37ee466, and the patch file is removed. Measured by `npm run sound -- --check --root DIR` on stand-ins, 2.4 s into `step1.firstName` with its second line wanted 2.4 s later: at play the site set 0 sounds ahead with the `src/main.ts` of main af2d22f, before the patch, and 1 with it, the line, in 2.4 s. The check prints this under "also measured, a seek into a beat on the site".

## Not done

1. After a seek or a pause inside a beat, a line that had begun before that point is not spoken from its middle. The lines still to come are spoken (decision 28).
2. Film B on a page that draws far under 60 pictures a second: two events with the same cue that arrive in one drawn picture sound once, by decision 3. Only the opening of film A is set ahead on the sound clock (decision 24). The mix is not touched by this: it lays every event on its frame.
3. The count of film A on the site, 78 sounds played of 78 laid, is measured in headless Chromium with stand-ins. Safari, Firefox and a real phone are not measured: only Chromium is in the workspace.
4. Two early merge commits of this branch, 3731ac1 and 56cfcf0, lack the trailer. History is not rewritten.

## Where the kit and the code differed

`kit/05-ARCHITECTURE.md` says under "Hashes and records" that commits which touch only sound change no hash. `tools/lib/hashes.mjs` put every file of `src/` outside the page folders into the engine hash, `src/audio/` too, so a change to the sound engine made every kept picture stale. The Builder took the patch that leaves `src/audio/` out of the engine hash, on main at 5632d86. Sound changes no pixel: check A3 renders a judged still with the audio code in the build and with it blocked, and the two are byte equal. The sound files and their index are in `public/audio/` and were never in the hash.

## Where the brief and the kit differ

Nothing found that changes the work. One point to know: the brief names a `skip` event for the live line, and `skip` is not a cue of `audio.sfx`, so a skip speaks a line and plays no effect.
