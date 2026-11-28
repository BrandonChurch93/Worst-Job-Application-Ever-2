# Unit "shell": notes

Branch `agent/b-shell`, started from `origin/main` at dc3296b8 on 2026-11-27 at 21:26 UTC.

## 1. The field progress contract (contract 2 of the plan)

STATED by the note: "the progress bar counts fields".

The type, in `src/stage/types.ts`:

    export interface FieldProgress { done: number; total: number }

A page sets it by giving its `PageLogic` one more method, optional, beside `typing?()` and `volume?()`:

    fields?(): FieldProgress | null

It is read from the page's own state each time the stage makes a frame (`Stage.snap` in `src/stage/stage.ts`, through `railFields`), and nowhere else is anything kept. Example, in the object a page's `makePage` returns:

    const FIELDS = ['name', 'email', 'resume']
    // in the page's state: s.field, the index of the field in hand, saved and loaded with the rest
    fields: () => ({ done: s.field, total: FIELDS.length }),

How it is drawn: the stage writes `[done, total]` into `v` of the shape whose role is `progressRail` (the numbers a page hands the maker of a part; they are blended between two steps of the stage like every `v`). The rail's maker (`rail` and `railFill` in `src/shell/real/controls.ts`) lays a strip of `railSatin` over the `railFlat` bar: from the first button to the collar of the step in hand, and from that collar toward the next button by `done / total`. Both materials are the rail's own in `src/shell/materials.ts`; no prop, no new material, no new copy.

Decisions:
- `done` may be a fraction. A page that wants the fill to glide eases `done` in its own state; a page that reports whole numbers gets a fill that steps.
- `done / total` is clamped to 0..1. `total` of 0 or less, `null`, or no method at all: the rail is drawn as before, same key, same object.
- With `done` 0 on step 1 nothing is filled, so step 1 at rest looks as it did.
- The fraction is laid over the length of rail a visitor can see, from the collar of the step in hand to the far side of the next cap's edge (6 px under it), not from centre to centre: with three fields the three lengths seen are near 1 : 2 : 3. MEASURED in `tests/b-shell-fields.test.ts`.
- The steps behind the step in hand are filled too (`FILL_FROM_FIRST` in `controls.ts`). A page that reports nothing shows no fill at all, so steps 3, 4 and 5 show the bare rail until their pages report; `fields: () => ({ done: 0, total: 1 })` on a page with no fields keeps the fill behind its button. That line is for the owners of those pages, through the Builder.
- The fill has no eased motion of its own in the shell, because that would be state outside the page.

MEASURED: `npx vitest run tests/b-shell-fields.test.ts`: 8 tests passed. `npx tsc --noEmit -p .`: no output.
MEASURED by eye: `shell-pictures/rail-step2-2of3-draft.png`, a crop of `npm run still -- --page step2 --beat step2.open --at 0.9 --format hd --tier draft --force` with the stage told for that one render to report 2 of 3 on every page (not committed). The strip from 1 to 2 and two thirds of the way from 2 to 3 is the lighter satin; the rest is the flat grey of today.

### 1a. The Builder's rulings of 21:36 UTC on the rail, and what changed

- STATED by the Builder: `FILL_FROM_FIRST` stays true; a page with a rail and no `fields`, or `null`, is drawn as 0 of 1; the fill is the orange plastic of the button in hand, with a notch at each field's boundary.
- Done in `src/shell/real/controls.ts`: `railCount` gives 0 of 1 when the rail holds no count, so steps 3, 4 and 5 keep the fill up to the collar of their button with no line in their pages. The fill is `materials().orange`, the material of the cap of the step in hand. `railNotches` gives one notch at each boundary between two fields (total minus 1 of them), drawn as a strip of the `gap` material 2.5 px wide over the rail and the fill (`NOTCH_WIDE`, `NOTCH_OVER`). No new material.
- The fraction now runs from the collar of the step in hand to the edge of the next cap, so a notch stands exactly where the fill of that many fields ends; a full count goes 6 px under the cap.
- Found while doing it: two other shapes of the build carry the role `progressRail`, the boss's `health-track` (which uses `v` for its own lift) and the careers page's `process-rail`. `railFields` in `src/stage/stage.ts` and the fill in `controls.ts` now act only on the shape with id `progress-rail`. Before this, a boss page reporting fields would have had its health track's `v` overwritten.
- Test changed: `tests/b-shell-fields.test.ts`, "draws a page that reports nothing, null, or no fields at all with the key and the object of today" is now "draws a page with a rail that reports nothing, null, or no fields at all as 0 of 1: bare on step 1, filled up to the collar of the step in hand after it" (this note, 1a). Two tests added: the orange and the notches; the other rails left alone. The ratio of a full count to one field is now pinned between 3 and 3.3 (the 6 px under the cap).
- MEASURED: `npx vitest run tests/b-shell-fields.test.ts tests/b-shell-chrome.test.ts tests/ui.test.ts`: 3 files, 41 tests passed. `npx tsc --noEmit -p .`: no output.
- MEASURED on `out/work/stills/step2-step2_open-0p9-hd-draft.png` (hd, draft, 2 of 3 stamped for the render only): mean colour of the fill 213, 97, 37, relative luminance 0.228; of the bare rail 114, 117, 119, relative luminance 0.178. The difference is in hue more than in luminance.
- Picture: `shell-pictures/rail-orange-step1-1of3-step2-2of3.png`: step 1 at 1 of 3 and step 2 at 2 of 3 at 1920 wide (crops), and the same two frames scaled to 390 wide under them.

## 2. The header hook (asked by the Builder, 21:41 UTC)

The type, in `src/stage/types.ts`:

    export interface Chrome { header: number }

A page gives its `PageLogic` one more optional method:

    chrome?(): Chrome | null

`header` is how far the header is in: 1 in place, 0 off the top of the screen. It is read from the page's own state at each frame (`slideHeader` in `src/stage/stage.ts`, called in `Stage.snap` after `railFields`). Example:

    chrome: () => ({ header: 1 - easeOut(s.fightIn) }),

- The header is the shapes `header-title`, `header-rule`, `progress-rail`, `progress-1` to `progress-5` and their numerals (`isHeader`). Each is moved up by `(1 - header) * HEADER_OUT` page pixels (`HEADER_OUT` 240) and marked `moved`. The page's own shapes are not changed: the frame holds copies.
- No method, `null`, or `header` 1 or more: the frame is what the page drew. Values under 0 count as 0.
- The page eases the number itself; the shell keeps no state.
- MEASURED: `tests/b-shell-chrome.test.ts`, 6 tests passed. Picture `shell-pictures/chrome-header-0p55-step2-draft.png`: step 2 with `header` 0.55 stamped for one render (not committed), the header 108 px up.

### 2a. The caption's place in the hook (Builder, 21:57 UTC)

    export interface Chrome { header: number; caption?: number }

`caption` is the y of the lower edge of the caption panel in page px of the 1920 by 1080 design. Absent: `CAPTION.low`, 1044. `src/main.ts` passes it to the sound at each live frame (`sound.page(stage.page.id, stage.page.chrome?.()?.caption)`); the panel eases to it over `CAPTION.easeSeconds` (0.25 s) while words are shown and is simply there when none are (`easeCaption` in `src/ui/said.ts`).

The box the other units keep clear: 900 px wide by 96 px high in page px, centred, its lower edge at `caption` (1044 when a page names none). STATED limit: the type never goes under 13 px on the screen (`CAPTION.minFontPx`), so in a window narrower than 960 px the panel is higher than 96 page px. MEASURED in a window 640 px wide: `line.pinball.seal.0` on two rows, 300 by 43.1 screen px, which is 900 by 129 page px. In a window 1200 px wide every line is one row; the widest, `line.boss.slabs.0` (64 letters), is 479.7 by 38.6 screen px, which is 768 by 62 page px.

## 3. Item 1: the narrator speaks on events

STATED by Brandon: "right now it's constantly talking and I don't really want that. I want the voice over to actually play while the user is playing not necessarily on a timer but on an event basis."

The rule, as agreed by the Builder at 21:41 UTC, and where it lives:

1. A line is set off by an event a page emits and by nothing else. No beat, no stillness, no clock sets one off (`filmLive` and `liveTriggers` in `src/audio/cues.ts`).
2. It starts within 0.4 s of that event or not then (`LIVE.liveLateSeconds` and `LIVE.waitSeconds` in `src/audio/levels.ts`; all waits are 0.4 now).
3. A line that could not start stays owed while its page lasts: the next time its event comes it has its chance again. Leaving the page drops it. A line of the film that was said is not said again in that visit (`LiveDesk.ask` in `src/audio/narrator.ts` spends a line only when it is booked).
4. Two lines never overlap, and after a line there are 6 s with no voice (`audio.liveNarratorMinGapSeconds`, not changed). An event that comes inside a line or inside those 6 s does not get its line then.
5. `idle.0` and `idle.1` are not said on the live site: stillness is a clock. The site still tells the sound how long the visitor has been still (`quiet()`), and the sound does nothing with it.
6. The press of Skip and the press of Watch the film are presses of the visitor, so their lines stay.

Why the old build talked all the time, MEASURED on the old engine (fee1d033), `npm run sound -- --visit keen`: a line could wait up to 10 s for its turn, so nearly every event that came during a line or its 6 s still got its line, late. 12 lines heard in 132.58 s, 63.19 s of voice (47.7 percent of the visit), 8 of the 12 began more than 0.4 s after their event (5.27, 1.52, 4.15, 9.70, 7.48, 1.46, 8.60, 3.30 s after), the silences between lines were 6.0 to 9.0 s, and `step2.dial.0` and `step2.crank.0` hung on a beat, not on an event.

The same visit on this build: 11 lines heard, 47.04 s of voice (35.5 percent), every line within 0.35 s of its event (9 of 11 at 0.00 s), silences between lines 6.0 to 17.2 s. Lines heard and the event of each: `marketing.stroll.0` 0.03 s (`step`), `step1.firstName.0` 11.20 (`keyboard-rise`), `live.hit.0` 28.97 (hit), `step2.dial.0` 35.55 (`dial-wind`), `pinball.seal.0` 50.63 (`ball-seal`), `live.hit.1` 63.97, `live.hit.2` 70.73, `live.hit.3` 82.27 (hits), `pinball.drain.0` 93.78 (`drain`), `boss.slabs.0` 104.34 (`slab-fire`), `decision.letter.0` 129.57 (`stamp`).

What is NOT changed, and is the Builder's to rule: the count of lines in a keen visit is 11 where it was 12. The voice is on for a third of the visit, not for half. If that is still too much talk, the one number to raise is the 6 s of silence (`audio.liveNarratorMinGapSeconds` in the frozen `config/`), or the four `hit` lines can be taken off the live site (three of the 11 lines heard are `hit` lines).

The table: every line of `content/narration.json`, what set it off before, what sets it off now. "Now" is always: within 0.4 s of the event, or owed until the event comes again on that page.

| Line | Page | What set it off before (fee1d033) | What sets it off now |
| --- | --- | --- | --- |
| `line.marketing.stroll.0` | careers | event `step`, then up to 10 s of waiting for its turn | event `step` |
| `line.marketing.perks.0` | careers | event `card-flip`, then up to 10 s of waiting for its turn | event `card-flip` |
| `line.step1.firstName.0` | step 1 | event `keyboard-rise`, then up to 10 s of waiting for its turn | event `keyboard-rise` |
| `line.step1.firstName.1` | step 1 | event `bolt-hit-cursor`, then up to 10 s of waiting for its turn | event `bolt-hit-cursor` |
| `line.step1.email.0` | step 1 | event `slab-drop`, then up to 10 s of waiting for its turn | event `slab-drop` |
| `line.step1.tug.0` | step 1 | event `arms-out`, then up to 10 s of waiting for its turn | event `arms-out` |
| `line.step2.dial.0` | step 2 | the beat `step2.dial` being reached (no event of the page), then up to 10 s of waiting | event `dial-wind` |
| `line.step2.crank.0` | step 2 | the beat `step2.crank` being reached (no event of the page), then up to 10 s of waiting | event `volume-sign`, or `crank-turn` while step 2 does not yet give volume-sign |
| `line.pinball.seal.0` | step 3 | event `ball-seal`, then up to 10 s of waiting for its turn | event `ball-seal` |
| `line.pinball.launch.0` | step 3 | event `plunger`, then up to 10 s of waiting for its turn | event `plunger` |
| `line.pinball.lobby.0` | step 3 | event `carpet-roll`, then up to 10 s of waiting for its turn | event `carpet-roll` |
| `line.pinball.coffee.0` | step 3 | event `bumper`, then up to 10 s of waiting for its turn | event `bumper` |
| `line.pinball.replyAll.0` | step 3 | event `inbox-take`, then up to 10 s of waiting for its turn | event `inbox-take` |
| `line.pinball.fired.0` | step 3 | event `firehouse-take`, then up to 10 s of waiting for its turn | event `firehouse-take` |
| `line.pinball.drain.0` | step 3 | event `drain`, then up to 10 s of waiting for its turn | event `drain` |
| `line.boss.verify.0` | step 4 | event `checkbox`, then up to 10 s of waiting for its turn | event `checkbox` |
| `line.boss.slabs.0` | step 4 | event `slab-fire`, then up to 10 s of waiting for its turn | event `slab-fire` |
| `line.boss.lastStand.0` | step 4 | event `session-expired`, then up to 10 s of waiting for its turn | event `session-expired` |
| `line.decision.letter.0` | step 5 | event `stamp`, then up to 10 s of waiting for its turn | event `stamp` |
| `line.decision.metrics.0` | step 5 | event `count-run`, then up to 10 s of waiting for its turn | event `count-run` |
| `line.live.idle.0` | any | the clock: 12 s of stillness (`live.idleSeconds`), then up to 4 s of waiting | nothing: not said on the live site (the call is no longer made) |
| `line.live.idle.1` | any | the clock: 12 s of stillness (`live.idleSeconds`), then up to 4 s of waiting | nothing: not said on the live site (the call is no longer made) |
| `line.live.hit.0` | any | an event that hits the cursor, up to 0.4 s of waiting | the same: an event that hits the cursor |
| `line.live.hit.1` | any | an event that hits the cursor, up to 0.4 s of waiting | the same: an event that hits the cursor |
| `line.live.hit.2` | any | an event that hits the cursor, up to 0.4 s of waiting | the same: an event that hits the cursor |
| `line.live.hit.3` | any | an event that hits the cursor, up to 0.4 s of waiting | the same: an event that hits the cursor |
| `line.live.slowTyping.0` | step 1 | event `slow-typing`, up to 2 s of waiting | event `slow-typing` |
| `line.live.realKeyboard.0` | step 1 | event `real-keyboard`, up to 4 s of waiting | event `real-keyboard` |
| `line.live.tugLost.0` | step 1 | event `tug-lost`, up to 3 s of waiting | event `tug-lost` |
| `line.live.pinball.flipper.0` | step 3 | event `flipper`, the first time only, up to 4 s of waiting | event `flipper`, until it has been said once |
| `line.live.boss.verify.0` | step 4 | event `checkbox`, up to 4 s of waiting | event `checkbox` |
| `line.live.boss.slow.0` | step 4 | event `boss-slow`, up to 6 s of waiting | event `boss-slow` |
| `line.live.skip.0` | any | event `skip` (the press of Skip), up to 4 s of waiting | event `skip` |
| `line.live.watchFilm.0` | any | the press of Watch the film (a call of the interface), up to 3 s of waiting | the same press |

Lines whose event no page gives yet are in the table as owed for good until the page gives it; for step 2 the Builder named `volume-sign` as to come, and until it does `crank-turn` sets off `step2.crank.0`.

MEASURED in a real browser, every line by its event, `node pipeline/change002/shell-caption.mjs --lines-only` (the site's engine built as it is, a real AudioContext, each line's event sent to it; record in `shell-caption.json`): 32 of 34 lines said, each by its event (not said, as the rule has it: `line.live.idle.0`, `line.live.idle.1`); page errors 0; the page drew a frame every 16.7 ms (median).

Tests: `tests/b-shell-sound.test.ts`, "item 1" (3 tests): every film line hangs on an event of its own page and none on a beat; in a storm of every event on every page each line starts within 0.4 s of the event that set it off, never two at once, 6 s after each; every event name the units of change 002 gave has a cue or a named silence.

## 4. Item 10: no sound on the careers page but the press of Apply

STATED by the brief: "while the careers page is the page on screen no sound effect plays but that press. The narrator and the music are not sound effects and are not touched by this item." STATED by the Builder at 21:41 UTC: the room tone and `page-turn` are silent on that page.

Done, live site (`src/audio/index.ts`, `src/audio/cues.ts`, `src/main.ts`):
- `quietPage` is `marketing`, `quietPageCues` is `['button-press']`. While the page on screen is the careers page an event plays its cue only if the cue is in that list.
- The sound has to know the page on screen and not guess it from events, so `src/main.ts` tells it at each live frame and at a jump by the step control (`sound.page(id)`).
- The turn from the careers page to step 1 and the turn from step 5 back to it play no `page-turn` cue. Loops that still ring are stopped when the careers page is on screen.
- The room tone does not run on the careers page: it is not started at the first touch any more, starts half a turn (0.5 s, `LIVE.quietTurnSeconds`) after the turn away begins, and is taken out over the turn back (see item 9).

Done, film (`src/audio/mix.ts`, and `tools/mix.mjs` by the NEEDS patch): the mix reads the page of each event of the cut, lays no cue while the careers page is on screen but `button-press`, no `page-turn` into or out of it, and no room tone there.

MEASURED, live: `npm run sound -- --visit keen` on this build: on the careers page 0.02 to 10.2 s and from 132.08 s, the room tone runs 10.2 to 132.08 s only. MEASURED by `shell-hum.mjs`: in the 10 s after each of three restarts every sample the site gives out is 0.
MEASURED, film, on `cut/CUTLIST.json` with `quietSpans` and `cueOfEvent` of this build: the careers page is on screen for frames 0 to 810 and 9075 to 9180; 34 events with a cue fall there (30 `step`, 3 `card-flip`, 1 `button-press`); 33 are silent and one plays, `button-press` at frame 751 (12.52 s). The `page-turn` at frames 810 and 9045 is silent.
NOT DONE: the film's sound file is not remade. `npm run mix` writes `audio/mix/*`, which is not this unit's; it is the Builder's run after `npm run cut`. Until then the film that exists still has the old sound.

Tests: `tests/b-shell-sound.test.ts`, "item 10" (8 tests).

## 5. Item 9: the hum after a restart

STATED by Brandon: "after the application ends and it restarts at the beginning, there's this weird like humming sound that should not be there super annoying."

Found, MEASURED by `node pipeline/change002/shell-hum.mjs` (the keen visit three times over through the site's own engine in a browser whose sound is rendered offline; record `shell-hum.json`, picture `shell-pictures/hum-after-restart-before-after.png`, clips in `shell-clips/`):
- Before the mend (the engine of fee1d033), the careers page 1 s to 11 s after it is back on screen: rms -47.6 dB, peak -33.3 dB after each of the three restarts; 100 Hz at -56.6, -56.9, -56.9 dB; 201, 198, 198 tones more than 10 dB over the noise beside them; the loudest are 100.3 Hz (-56.6 dB), 200 Hz (-62.6 dB), 399.9 Hz (-64.8 dB), 249.8 Hz (-68.3 dB), 599.9 Hz (-69.0 dB); 46 percent of the energy is between 80 and 160 Hz.
- Its source: the loop `room-tone` (`public/audio/room-tone.flac`, 19.0 s). The old engine started it at the first touch and never stopped it, and started it again at `start()`. During the application it lies under the effects, the voice and the hold music; back on the careers page it is the only thing that sounds, and the file itself carries a comb of tones at every multiple of 50 Hz up to about 8 kHz, strongest at 100 Hz. That is the hum.
- After the mend: every sample is 0 in those 10 s, after restart 1, 2 and 3.

The mend, two parts:
1. The tone stops at the turn back to the careers page (faded over 0.5 s) and does not start again until half a turn after the next turn away. So after a restart nothing sounds on the careers page (item 10 says the same).
2. Asked by the Builder: the tones are taken out of the room tone under steps 1 to 5 too, in the engine, behind one switch, `TONE.dehum` in `src/audio/levels.ts`, on. `dehum` in `src/audio/dsp.ts` is a comb at every multiple of 50 Hz (`TONE.humHz`, `TONE.combKeep` 0.9) and two notches (100 Hz q 6, 200 Hz q 12), run twice round the loop so that the join of the loop has no step. It is applied to the decoded `room-tone` only, in the site and in the film mix. The file is not changed.

MEASURED on the file with the switch off and on (picture `shell-pictures/room-tone-dehum-off-on.png`): rms -46.0 dB to -48.5 dB; 100 Hz -54.6 dB to -69.1 dB; tones more than 10 dB over the noise beside them 197 to 14; change of energy by band 20 to 80 Hz -0.27 dB, 80 to 160 Hz -4.75 dB, 160 to 640 Hz -2.16 dB, 640 to 5000 Hz -4.97 dB, 5000 to 20000 Hz -4.29 dB. The level is not raised again to make up for the 2.5 dB.
UNKNOWN: whether the room "still reads as a room" with the switch on. That is a judgement of the ear and the Builder's: the two clips are `shell-clips/room-tone-dehum-off-10s.flac` and `shell-clips/room-tone-dehum-on-10s.flac`. The broadband noise between the tones is left within 2 dB by test; what is taken out is the comb.

Tests: `tests/b-shell-sound.test.ts`, "item 9" (4 tests) and "stays so after a first, a second and a third restart".

## 6. The words on screen while they are spoken

STATED by the Builder at 21:41 UTC: the visible caption for the live site is built now, in `said.ts`, driven from the audio clock; "a soft panel at the bottom centre in the site's type, the same on every page, and above the pinball video and the boss fight too". The film's captions are not built now.

Done: `makeCaption` in `src/ui/said.ts`. One panel in the page over the canvas (z 40, takes no clicks), the site's Inter 500 drawn with the same outlines as the stage (`src/ui/glyphs`), ink `#262522` on the paper colour `rgba(231, 228, 221, 0.97)` with a hairline and a soft shade, scaled with the picture. The engine gives it, by `sound.said()`, each line that is booked with its words (as read: the pause mark is not shown), and the start and end of its voice on the sound's own clock. At each drawn frame the panel reads that clock: the words are on from the first frame at or after the start of the voice to the first frame at or after its end. Every word comes from `content/narration.json`; none is typed into code.

MEASURED, the panel against the voice (`shell-caption.mjs`; the voice is timed where it is handed to the browser, the caption by a watcher of the page that reads the same clock; neither from the panel's own log): 
- The engine and the panel in a browser that draws a frame every 16.7 ms, every line by its event (32 lines): the words come on 0.000 to 0.020 s after the start of the voice and go 0.007 to 0.043 s before the end of its sound. The sound as decoded is 0.024 to 0.046 s longer than the length in `public/audio/index.json` (the padding of the mp3), and the panel goes at the first frame after the length in the index. The words shown are the words of the line with the pause mark left out, for all 32.
- The whole site as built, the keen bot playing it in real time, in this sandbox, which has no graphics card and draws the site with a software renderer:
- Run `site` (mode live; a frame every 2.60 s, median): `line.marketing.perks.0` on 2.821 s after the voice starts, off 4.444 s after it ends; `line.marketing.stroll.0` on 2.961 s after the voice starts, off 0.599 s after it ends.
- Run `site-step3-low-640` (mode live, from step 3, quality low, 640 by 360; a frame every 0.55 s, median): `line.pinball.seal.0` on 0.012 s after the voice starts, off 0.490 s after it ends.
- Run `site-step3-low-960` (mode live, from step 3, quality low, 960 by 540; a frame every 1.02 s, median): `line.pinball.seal.0` on 0.009 s after the voice starts, off 0.171 s after it ends.
- Run `site-step4-low-960` (mode live, from step 4, quality low, 960 by 540; a frame every 1.10 s, median): `line.boss.verify.0` on 0.000 s after the voice starts, off 0.204 s after it ends.
- Run `site-step1-low-960` (mode live, from step 1, quality low, 960 by 540; a frame every 1.40 s, median): `line.step1.firstName.0` on 0.012 s after the voice starts, off 2.205 s after it ends.
- What that says: the panel can only change when the page draws a frame. Here a frame takes 0.55 to 2.6 s, so the words go off up to that much after the voice (0.17 to 4.4 s MEASURED); they come on at once when the line is booked inside a frame (0.000 to 0.012 s), and 2.8 to 3.0 s late in the run whose frames took 2.6 s. At 60 frames a second the same code is within 0.020 s at the start and 0.043 s at the end (first point).
- UNKNOWN: the numbers on the hosted site on a machine with a graphics card. The hosted pages answer 403 to this sandbox.
- NOT DONE: every line on the whole site. A keen visit says 11 of the 34, and in this sandbox the site runs at a few percent of its speed, so the runs above hold 5 lines on 4 pages. Every line is covered by the first point only.
- The film: no caption is built (the Builder's ruling), so nothing is measured there.

The look, by eye: `shell-pictures/caption-live-step3-step4.png`, the live site at 960 by 540 on step 3 and step 4 with a line's words on the panel. On step 4 the panel at its default place lies over the lower half of the Submit button: no page names its `caption` place yet. A picture on step 1 was not got (the sandbox took longer to take the picture than the line lasted).

Film captions, not built. Two ways:

(a) The caption is part of the picture the film renders. The film is made of frames read off the canvas, so a panel of the page (what the live site has) is not in them; the caption would be drawn in the scene. To stay fixed to the screen while the pinball cameras move it cannot be a shape of the page (those lie on the table and move with it): it is a quad placed at each frame from that frame's own camera (`CameraPose`: eye, target, up, fov), a fixed distance d down the view axis, 2 d tan(fov/2) high, drawn last with no depth test, and it must be left out of depth of field, grain and the camera's shake, or the words blur and tremble. That means a pass after the picture's finishing in the render engine, which is not this unit's. The words would come from `cut/CUTLIST.json` (`lines`: `first` and `last` frame of each line are there today) so no clock is read. About 5 to 7 hours: 2 for the pass and the quad, 1 for the panel drawn with the stage's type, 1 to 2 for looking at it over all five pages and the opening at both formats, 1 for tests and the determinism run; and the whole film is rendered again.

(b) The caption is laid over the finished frames in the cut. It is fixed to the screen by construction: it never enters the scene, so no camera touches it. What it needs from the cut: for each line its first and last frame (in `cut/CUTLIST.json` `lines` already), the y of the panel's lower edge for each stretch of the film (one number a unit, or the 1044 default; step 1's deck and the fight want it higher), and one step in the encode that lays a picture with alpha over frames `first` to `last` (ffmpeg `overlay` with `enable='between(n,first,last)'`, in `tools/film.mjs` or `tools/lib/film-encode.mjs`, not this unit's: a NEEDS patch). This unit would make the 20 panels as pictures with alpha from the same `said.ts` at each format's size. About 2 to 3 hours, no frame rendered again, one more encode. Exact to the frame (1/60 s).

(b) is the cheaper and the safer of the two; (a) is only worth it if the caption should take the scene's light.

## 7. The cue table for the event names of change 002

In `src/audio/cues.ts`, three lists the Builder fills in by file name: `newEventCues` (event to the nearest kept cue; the file to come is named in the row), `newSilent` (events with no sound until their file exists), `prefixCues` (`strike:` and what follows it: silent until the strikes have sounds). `cueOfEvent(name)` is a function now: exact name first, then prefix. Old event names keep their old cues.

| Event | Cue until its file exists |
| --- | --- |
| `shield-glance` | `bolt-hit` |
| `shot-round` | `dart-hit` |
| `cannon-fire`, `big-fire` | `slab-fire` |
| `boss-heal` | `power-on` |
| `bullet-fire` | `bolt-fire` |
| `turret-lock`, `turret-load` | `lever-pull` |
| `arena-break`, `keys-break`, `page-crack` | `button-crack` |
| `date-key` | `key-press` |
| `reel-stop` | `drop-target` |
| `date-hit`, `field-done` | `checkbox` |
| `date-miss` | `popup-close` |
| `crank-full` | `crank-runaway` |
| `vacuum-slip` | `ball-drop` |
| `vacuum-lose` | `scoop-kick` |
| `frenzy-on` | `flasher` |
| `loot` | `coins` |
| `boss-move`, `cannon-tell`, `big-tell`, `turret-off`, `slab-shadow`, `volume-sign`, `field-next`, `vacuum-on`, `frenzy-off`, every `strike:<id>:<n>` | silence |
| `turret-rise`, `flatten`, `peel-up` | the cue of that name, as before |

## 8. Decisions

- The turns into and out of the careers page play no `page-turn` cue; the room tone and `page-turn` count as sound effects there.
- The tone does not start until the sound knows the page on screen.
- The idle lines are never said on the live site. `liveTriggers.idle` stays in the table as a call the site no longer makes, so the take is still loaded and the film's tools still find it.
- A line whose event comes while another speaks is not queued: it stays owed until its event comes again, and is dropped when its page is left.
- The dehum does not raise the tone's level again.
- The film's careers spans are read from the page of each event, which is why `tools/mix.mjs` had to pass it (NEEDS).
- The caption is a panel of the page fed on the sound's clock, not a shape of the stage: it has to be the same over the pinball video and the fight, and a shape of the page would move with the page.
- `LIVE.quietTurnSeconds` 0.5 is half a turn: MEASURED, the stage reports the new page 0.5 s after the `page-turn` event (pages at 10.2, 33.72, 49.03, 96.43, 124.13, 132.08 s against turns 0.5 s before each).
- `step2.crank.0` hangs on `volume-sign`, with `crank-turn` beside it until step 2 gives `volume-sign`.

## 9. The NEEDS patch

`pipeline/change002/shell-NEEDS.patch`, applied as commit 76f33b97 ("NEEDS: ..."): `tools/mix.mjs` passes the `page` of each event of the cut to `mixFilm`, writes `hushed` and `quiet` into its record, and its check A9 does not count a hushed event as a cue that failed to sound. Told to the Builder at 22:04 UTC.

## 10. Tests changed or removed, each with the note that changed it

New: `tests/b-shell-sound.test.ts` (21 tests), `tests/b-shell-fields.test.ts`, `tests/b-shell-chrome.test.ts`.

Changed, because the rule each pinned was changed by section 3 (item 1) of this note:
- `tests/audio-live.test.ts`: "says by number how long ..." is now "lets every kind of line start at most liveLateSeconds ..."; "gives a line one chance" is now the owed rule; the tests of a trigger during a line, a trigger inside the gap, taking a waiting line back, leaving the old page, a pageless line through a turn, the step 2 rows (events, not beats), a trigger during another line in the engine, skip and page turn taking a waiting line back; "drops the line whose start would be later" is now "says it when its event comes again".
- `tests/audio-rules.test.ts`: the gag test is now "no line on a beat"; the idle test is now "no line by stillness"; the least gap test; the test of a skip in the middle of a line.

Changed by section 4 (item 10):
- `tests/audio-rules.test.ts`: the fall back test uses `button-press` on step 1 (a `step` on the careers page is silent now).
- `tests/audio-engine.test.ts`: four tests tell the sound the page first (`s.page('step1')`); the tone starts once the page is known.
- `tests/audio-visit.test.ts`: the room tone runs from the turn away from the careers page to the turn back, not from 0 to the end.

Removed, by the Builder's mail of 21:57 UTC (section 1a): `tests/b-shell-fields.test.ts`, "leaves every page of the build as it was: none reports fields". The test beside it holds what replaces it: a page that reports nothing draws as 0 of 1.

Red and left, by the same mail: `tests/cut-of-build.test.ts`, until the Builder runs `npm run cut` on the merged tree.

## 11. Change note 003: the script of eight spoken moments (mails of 22:29, 22:32 and 22:44 UTC)

Section 3 and the lines of section 6 that speak of takes are superseded by this section. Written 22:56 UTC on 2026-11-27.

### 11a. The rule as built

- Nothing recorded is played: `src/audio/index.ts` fetches no line file and the film mix (`src/audio/mix.ts`) lays no take under the id of a line of the script. Each line is a silent stand-in (`src/audio/standin.ts`): its length is its words divided by `audio.narratorMaxWordsPerSecond` (1.6), its caption is shown phrase by phrase, split at the pause mark of `content/narration.json`, each phrase for its share of the words.
- The words come from `content/narration.json` and `content/narration-drafts.json`; neither file is written by this unit. A line of the drafts file carries `draft: true` in `standIns()`, in `said()`, in `filmCaptions()` and in `shell-script-visit.json`.
- The table `spoken` in `src/audio/cues.ts` is the whole script. A line of the files with no row is said nowhere; `liveTriggers` is empty and no line is only for the live site.

| line | key | words | seconds | starts on | said only until | other |
|---|---|---|---|---|---|---|
| 1 | marketing.stroll.0 | 22 | 13.750 | sound allowed with the careers page at rest on screen | `button-press` | once a visit (11h) |
| 2 | step1.firstName.0 | 9 | 5.625 | `candidate-sensed` | `field-done` | |
| 3 | step1.shredded.0 | 20 | 12.500 | `resume-received` | | |
| 4a | step2.crank.0 | 10 | 6.250 | `volume-sign` | `field-done` | |
| 4b | step2.crank.1 | 4 | 2.500 | `crank-full`, no sooner than the end of 4a and 0.3 s | | a part of line 4; said until the page turns (11h) |
| 5 | pinball.seal.0 | 10 | 6.250 | `vacuum-on` | `ball-seal` | |
| 6 | boss.verify.0 | 11 | 6.875 | `checkbox` | `boss-formed` | |
| 7 | boss.unfold.0 | 29 | 18.125 | `boss-formed` | `turret-rise`, `power-down` | ends at its next pause on `boss-turn` |
| 7 | boss.unfold.1 | 7 | 4.375 | the end of boss.unfold.0 and 0.3 s | `turret-rise`, `power-down` | its last phrase starts the music (mark `music-in`) |
| 7 | boss.unfold.2 | 6 | 3.750 | the end of boss.unfold.1 and 0.3 s | `turret-rise`, `power-down` | |
| 8 | decision.letter.0 | 13 | 8.125 | `stamp` | | |
| 9 | decision.reset.0 (draft) | 5 | 3.125 | `page-turn` of the decision page | | kept over the turn back |

- Each line once in a run; a restart starts a new run.
- No line talks over another. A line whose event comes while another is being said is booked for that line's end and the kit's gap (`audio.liveNarratorMinGapSeconds`, 6 s); parts of line 7 follow at `audio.lineGapSeconds` (0.3 s). If one of its "said only until" events, a skip or a turn of its page comes before its start it is taken back and logged with the reason. A line that has started is never cut by these: line 2 runs on into the Email field.
- Line 1 is asked for when the sound is ready with the careers page on screen, and is owed through the loading of the sounds. Where the first click is Apply: see 11h, which supersedes what stood here.
- The jump of line 7: on `boss-turn` the phrase being said ends, the rest of boss.unfold.0 is dropped and the two later parts move up. With stand-ins the pause times are exact; with takes the engine will need a list of pause times a line.
- The music of the fight: stand-in cue `boss-loop` starts at the start of the last phrase of boss.unfold.1. The stage event `boss-music` maps to the same cue and is skipped while the narrator's is running. `unfold` no longer starts it, so on main, where the boss page emits neither `boss-formed` nor `boss-music`, there is no fight music until the boss helper's branch lands.
- The caption panel can show one phrase large and in capitals: `CaptionLine.loud`, `CAPTION.loudFontPx` 64, set by `loud: true` on a row of the table. No row has it yet.

### 11b. Decisions

- Stand-ins do not duck the effects (`LIVE.standInDucks` false): nothing is spoken.
- Superseded by 11h. After a restart line 1 is asked for again once line 9 and the gap are over, if the careers page is still on screen. The Builder wrote that the restart is silent apart from line 9; to make it so, line 1 must not be owed again in `atPage`. Left for his word.
- Superseded by 11h. 4a and 4b are two lines with the kit's gap, as the script has them. Making 4b a part (`after: 'step2.crank.0'`) is one word in the table and a ruling for Brandon.
- A waiting line that is taken back does not pull later waiting lines forward.
- `tests/audio-tools.test.ts` is a test of the tools, not of this unit. Two of its tests named `narration.liveOnly.hit[1]`, which the script emptied; they were moved to the new script in commit f2ab850f.

### 11c. Measured: whole visits with the helpers' events

`node pipeline/change002/shell-script-visit.mjs 20` on a throwaway merge of this branch with origin/agent/b-step1 a6084acf, b-step2 50bc9f1f, b-resume 6780a8fc, b-pinball 2dad3c71 and b-boss 48319d4f; numbers in `shell-script-visit.json`. The 20 seeds of a bot gave the same times, so this is one keen and one clumsy visit. Sound is allowed at once (line 1 starts at 0.017 s), as after a restart.

| | keen | clumsy |
|---|---|---|
| step 1 on screen | 10.20 s | 10.67 s |
| `candidate-sensed` | 12.53 s | 13.90 s |
| the Name's `field-done` after it | 0.17 s | 2.77 s |
| line 2 could start (line 1 start + 13.75 + 6) | 19.77 s, 7.23 s late | 19.77 s, 5.87 s late |
| line 2 | taken back | taken back |
| line 2 late if the first click is Apply (arithmetic on the same times) | 17.42 s | 16.52 s |
| line 3 | on its event | on its event |
| line 4a after `volume-sign` | 2.60 s late (line 3 and the gap) | on its event |
| `volume-sign` to `crank-full` | 3.30 s | 8.35 s |
| `crank-full` to the `field-done` that ends the crank | 1.55 s | 1.55 s |
| line 4b | taken back | taken back |
| line 5 | taken back (`ball-seal` first) | on its event |
| lines 6 and 8 | on their events | on their events |
| line 7 | not asked for: no `boss-formed` on that branch | the same |
| line 9 after the turn back | 11.61 s | 11.61 s |

- Line 2 is said on neither visit. Without the 6 s gap it could start at 14.07 s: still after the keen visitor's Name is done (12.70 s), before the clumsy one's (16.67 s).
- The kit's gap of 6 s does hurt 4a to 4b: 4b can start no sooner than 12.25 s after 4a starts and the crank is gone 1.55 s after `crank-full`. As a part of 4a (0.3 s) it would be said on the clumsy visit (4a ends 68.35 s, `crank-full` 70.45 s) and still not on the keen one (4a ends 57.63 s, the crank is gone at 53.63 s).
- Line 9 starts 11.61 s after the page turned back because line 8 starts on `stamp`, 2.52 s before the turn, lasts 8.125 s and the gap follows.

### 11d. The film: what the tools need for the preview of the opening (18 s)

- Done in this unit: `mixFilm` places every line of the script as kind `stand-in` with its seconds and lays no voice, whatever is kept under its id (`MixInput.standIns` overrides); `filmCaptions(lines, fps)` in `src/audio/standin.ts` gives each phrase its first and last frame, its words, `draft` and `loud`. Line 1 at frame 0 at 60 fps covers frames 0 to 824, inside the 1080 frames of the opening.
- `tools/mix.mjs` needs: to count and print `placed` of kind `stand-in` beside `linesLaid`, marking drafts; to pass check A10 for a line that is a stand-in (the kept takes are of the old words); to read `content/narration-drafts.json` for line 9; an option to end the plan at a time (18 s) so the opening alone is mixed.
- The caption writer does not exist in `tools/`. It needs: the plan's lines by frame (as `tools/mix.mjs` builds them), `filmCaptions` through `logic().load('/src/audio/standin.ts')`, a picture of the panel a phrase (the panel of `src/ui/said.ts` on a clear page, 1920 by 1080, lower edge at `CAPTION.low` 1044 or the `caption` of the page's chrome), and the encode laying each picture over frames first to last (`overlay` with `enable='between(n,first,last)'`). The encode is not a file of this unit.
- `timedLines` and the eight red tests of `tests/content.test.ts` wait for the Builder's beat times; with the beats as they are the built site does not start (MEASURED 22:55 UTC: "The site cannot start. 5 problems", all of them lines that run into the next).

### 11e. Tests changed or removed by this section

- Removed: `tests/audio-live.test.ts` (the old rule of live lines); in `tests/audio-rules.test.ts` the describe "the rules of the narrator on the live site" and the skip test; four tests of `tests/audio-engine.test.ts` on line files and ducking by takes; in `tests/audio-cues.test.ts` the describe "the triggers of the live lines"; three tests of `tests/b-shell-sound.test.ts` on the lines of section 3. Reason: 11a, no line only for the live site, no take played.
- Changed: `tests/audio-visit.test.ts` tests 1, 3 and 4 (lines of the script once, never two at once, the gap; fight music on the phrase or `boss-music`); `tests/audio-mix.test.ts` "gives the mix its events from the stage" (stand-ins, not missing lines); `tests/audio-tools.test.ts` two tests (11b); the remaining tests of `tests/audio-rules.test.ts` moved to `boss-music`.
- New: `tests/b-shell-script.test.ts` (21 tests) and "the lines of the narrator" in `tests/audio-cues.test.ts`.
- Red and not of this unit, left as they are: 8 in `tests/content.test.ts` and 1 in `tests/review.test.ts` (the old beats cannot hold the new lines), 2 in `tests/cut-of-build.test.ts` (waits for `npm run cut`).

### 11f. Pictures and scripts of this section

- `shell-script-caption.mjs` runs line 1 through the engine and the panel in a browser in real time: MEASURED 8 phrases, each read from the panel at the middle of its time and equal to the words of the script, 13.750 s from the first to the end of the last, the panel off after it, no page error (`shell-script-caption.json`). The page behind is a kept still of the careers page (`out/stills/key-marketing-top-hd-final.jpg`), not the running site, and the fonts of the site are not loaded in it. Pictures: `shell-pictures/script-line1-phrases.png` (the lowest fifth of the page at each phrase) and `shell-pictures/script-loud.png` (a phrase asked for loud: capitals, 40 px at a page 1200 wide, which is 64 px at 1920).
- Seen in the first picture: at `CAPTION.low` the panel lies on the strip of perks at the foot of the careers page. The careers page can name another place through `chrome().caption`.
- `shell-caption.mjs` is of the script before this section: its second part reads tables that are gone and its first part needs a site that starts. It is kept for the numbers of section 6 and not run again.

### 11g. The caption writer and the NEEDS commit (23:02 UTC)

- NEEDS commit 684c40d4, `tools/mix.mjs` (diff appended to `shell-NEEDS.patch`): the record and the last line count `standInsLaid`; check A9 looks at stand-ins too; check A10 leaves out kept takes of lines that are gone or reworded and says so; `--until SECONDS` mixes the first seconds alone. MEASURED on the throwaway tree after `npm run cut` there: `node tools/mix.mjs --until 18 --out /tmp/opening.wav` gave 18.000 s, 864000 samples at 48000 Hz, 2 stand-ins placed (line 1 at frame 0, 13.75 s; line 2 at frame 1022, 5.625 s), no voice. That tree has no kept sounds, so the file was silence; on this tree the mix is refused until `npm run cut` is run (the Builder's).
- `node pipeline/change002/shell-film-captions.mjs --until 18 --proof` is the caption writer: it takes the lines and frames from `timedLines`, the phrases from `filmCaptions`, draws each phrase with the panel of `src/ui/said.ts` and the site's baked fonts in a browser at 1920 by 1080 with a clear ground (`out/work/captions/*.png`), and writes the frames and the ffmpeg filter to `shell-film-captions.json`. `--onto FILM --out FILE` lays them over a film. MEASURED: 12 phrases of the 2 lines that start in the first 18 s under today's beats; line 1 on frames 0 to 824 in 8 phrases; the proof (the pictures over a kept still of the careers page for 18 s) has 1080 frames. Picture `shell-pictures/script-film-captions-opening.png`: frames 19, 94, 206, 300, 412, 525, 637, 768 and 900 of the proof, the lowest 200 lines of each; the last has no panel, as it must.
- The first run of the writer showed each phrase twice: the page lacked the style sheet that hides the words kept for screen readers. Mended by linking the style sheet the build writes.

### 11h. The rulings of 23:03 UTC (written 23:22 UTC)

- Line 1 is said at most once a visit, and only when sound becomes allowed while the careers page stands at rest on screen. A `button-press` or `page-turn` of the careers page, or leaving it, closes line 1 for the visit (`openingOpen` in `src/audio/index.ts`). So a visit whose first gesture is the press of Apply has no line 1.
- Line 1 starts `LIVE.openingWaitSeconds` (0.15 s) after sound is allowed. Reason: the gesture that allows sound is seen by the sound before the stage has stepped the press of Apply made by the same gesture; the wait lets that press arrive and take line 1 back. Own number, in `src/audio/levels.ts`.
- If Apply is pressed while line 1 is being said, line 1 runs to its end and line 2 follows the built rule.
- The restart is silent apart from line 9: arriving on the careers page from another page starts a new run of the script (`desk.restart()`), and line 1 is not owed again. Supersedes the second decision of 11b.
- Rows of one key with .0, .1, .2 are parts of one moment. The rule is by beat, in `Narrator.live`: a line waits `audio.lineGapSeconds` (0.3 s) after a line of the same beat and `audio.liveNarratorMinGapSeconds` (6 s) after any other. A part is not said if the part before it was not said in this run (logged: the part before it was not said); when a waiting part is taken back, the waiting parts after it go with it.
- 4b (`step2.crank.1`) waits for `crank-full` and for the end of 4a and 0.3 s. Its moment lasts until step 2's page turn begins; the crank's `field-done` no longer takes it back. Once started it is not cut.
- No kit number is changed. `audio.liveNarratorMinGapSeconds` stays 6.
- The measuring script takes the gap as arguments, in memory only: `node pipeline/change002/shell-script-visit.mjs 6 6 3 0.3` (runs, then one or more gaps) writes `shell-script-visit-gap-6.json`, `-gap-3.json`, `-gap-0.3.json`. Each bot's visit is run twice: with sound allowed while the careers page is at rest (first: page), and as a visit whose first press is Apply (first: apply; the press is given to the sound before sound is allowed).
- `tools/mix.mjs` (NEEDS commit b588f981): reads `content/narration-drafts.json`; a draft line of a beat with no settled line is laid as a silent stand-in at its beat, also when the cut list does not hold it, and is named in `draftsLaid` and in the last line. `shell-film-captions.mjs` reads the drafts the same way.

MEASURED 23:19 UTC on the throwaway merge of 11c with this branch's `src/audio/*` at 0cc60890, 6 seeds a bot (all seeds of a bot equal), said of 6 visits and seconds late after the line's event:

| gap | first | bot | 1 | 2 | 4a | 4b | 5 | 9 after the turn back |
|---|---|---|---|---|---|---|---|---|
| 6 | page | keen | 6 | 0 | 6, 2.60 | 0 | 0 | 11.61 |
| 6 | page | clumsy | 6 | 0 | 6, 0 | 6, 0 | 0 | 11.61 |
| 6 | apply | keen | 0 | 6, 0 | 6, 2.60 | 0 | 0 | 11.61 |
| 6 | apply | clumsy | 0 | 6, 0 | 6, 0 | 6, 0 | 0 | 11.61 |
| 3 | page | keen | 6 | 0 | 6, 0 | 0 | 6, 2.37 | 8.61 |
| 3 | page | clumsy | 6 | 0 | 6, 0 | 6, 0 | 6, 0.05 | 8.61 |
| 3 | apply | keen | 0 | 6, 0 | 6, 0 | 0 | 6, 2.37 | 8.61 |
| 3 | apply | clumsy | 0 | 6, 0 | 6, 0 | 6, 0 | 6, 0.05 | 8.61 |
| 0.3 | page | keen | 6 | 0 | 6, 0 | 0 | 6, 0 | 5.91 |
| 0.3 | page | clumsy | 6 | 6, 0.32 | 6, 0 | 6, 0 | 6, 0 | 5.91 |
| 0.3 | apply | keen | 0 | 6, 0 | 6, 0 | 0 | 6, 0 | 5.91 |
| 0.3 | apply | clumsy | 0 | 6, 0 | 6, 0 | 6, 0 | 6, 0 | 5.91 |

- Lines 3, 6 and 8 are said on their events on every visit at every gap. Line 7 is not asked for: no `boss-formed` on b-boss 48319d4f. Line 1 is said a second time on no visit.
- Line 2 is said on every visit whose first press is Apply, on its event. Where line 1 is said, line 2 is lost at 6 s and 3 s on both bots.
- 4b on the keen visit is lost at every gap: from `volume-sign` to the press of Continue is 5.68 s, 4a alone lasts 6.25 s. On the clumsy visit that time is 12.13 s and 4b is said on `crank-full`.
- At 6 s line 5 is lost on both bots; on the clumsy visit it is lost because 4b is now said (4b ends 72.95 s, `vacuum-on` 75.90 s, 6 s after 4b is 78.95 s, `ball-seal` comes first). Before this ruling the clumsy visit had line 5 and no 4b.
- On the whole film in that tree (`node tools/mix.mjs`): 12 stand-ins, 1 of them the draft; line 9 lies at frame 9060 (151.000 s) for 3.125 s, line 8 at frame 8580 (143.000 s) for 8.125 s, the film ends at 153.000 s. Under the present beats line 9 starts 0.125 s before line 8 ends and runs 1.125 s past the end of the film. The beats are the Builder's.

Tests changed by this section, all in commit 0cc60890: `tests/b-shell-script.test.ts` "says nothing before the first click..." (line 1 now starts 0.15 s after the unlock); "says line 1 when the first press is the Apply button" replaced by "says no line 1 on a visit whose first press is the Apply button..." and "lets line 1 run to its end when Apply is pressed while it is being said"; "says the line of the turn back ... and says line 1 again" now asserts line 1 once; "makes a line whose event comes while another is spoken wait" moved by 0.15 s; new describe "the parts of one moment" (2 tests). `tests/audio-visit.test.ts` test 1 and the skipper test: the start of line 1 is measured from the first turn of the visit and allows the 0.15 s.

### 11i. The Builder's mail of 23:19 UTC (written 23:27 UTC)

- The shout of the boss, `boss.finish.0`, a draft. NEEDS commit f5ab6179 adds its row to `content/narration-drafts.json` on the Builder's word (the diff is in `shell-NEEDS.patch`): text B "KA / ME / HA / ME / HA" as the stand-in, `loud: true`, `state: draft`, both candidates with the measured times he gave. Brandon picks A or B.
- Its times are not the narrator's pace: the row carries `standIn.starts` (0.10, 1.04, 2.09, 2.90, 4.13 s) and `standIn.seconds`. Decision: the whole is 6.26 s, the end of the last syllable as measured and the `gone` of the boss helper's SHOUT table, not the 6.24 s of the take's length. `phrasesAt` in `src/audio/standin.ts` reads them; a phrase lasts until the start of the next.
- `loud` now comes from the line (`StandIn.loud`: the row of the file or the row of the table).
- On the live site the words come on the marks of the boss page (names STATED by the boss helper at 23:25 UTC, to be on agent/b-boss; on e573c4bb the page emits `finish-arms`, one `finish-charge`, `finish-fire`): asked on `finish-arms`, nothing shown; each `finish-charge` shows the next syllable until the next mark; `finish-fire` shows the last syllable whatever came before; `boss-gone` ends the line, and takes it back if it had not begun. Table row `steps: { next, last, ends }` in `src/audio/cues.ts`, `step()` in `src/audio/index.ts`.
- Not done: the shout in the film. `config/showcase.json` has no beat `boss.finish`, so `timedLines` gives it no frame and the caption writer writes no picture for it. With a beat that starts on the frame of `finish-arms`, `filmCaptions` gives the five syllables at the stand-in's starts, which are the starts of the boss helper's table. The takes under `audio/shout-test/` are laid nowhere.
- Tests: `tests/b-shell-script.test.ts` new describe "the shout of the boss" (3 tests); "has the spoken moments of the script in twelve lines" now lists `boss.finish.0`; "marks as a draft every line that comes from the drafts file" now lists two drafts; the test of the pace leaves out a line with `steps`.
- After a restart line 1 is not owed again: built at 23:08 UTC in 0cc60890 (11h). `atPage` asks for line 1 only when the careers page is the first page of the visit; leaving the careers page closes line 1 for the visit, so a visit that starts on a later step has none either.
- A caption place for the careers page: lower edge at y 980 of the 1920 by 1080 page. MEASURED with `node pipeline/change002/shell-script-caption.mjs --place 980` on the kept still of the first screen: the panel of the longest phrase of line 1 lies from y 918 to 980, x 779 to 1141; at `CAPTION.low` it lies from 982 to 1044, on the ticker. Picture `shell-pictures/script-caption-place.png`: above, the place now; below, 980. Read off the still, not measured from the layout: the cards end near y 888 and the ticker starts near y 994, so a phrase of two rows (96 px) at 980 would touch the cards; line 1 has no phrase of two rows at this width. The careers page names the place through `chrome().caption`; that file is the careers helper's.
- The shout through the engine in a browser: `node pipeline/change002/shell-script-caption.mjs --shout` sends the marks at the stand-in's times over a kept still of the fallen boss. MEASURED 23:33 UTC (`shell-script-shout.json`): `finish-arms` nothing shown; the four `finish-charge` show KA, ME, HA, ME; `finish-fire` shows HA; after `boss-gone` nothing; each at 40 px in a view 1200 wide, which is 64 px of the page; no page error. Picture `shell-pictures/script-shout.png`, one strip a mark. Seen in it: at `CAPTION.low` the panel lies on the slot the boss fell into. The first `finish-charge` went out at 0.38 s, not 0.10 s: the script was still taking the picture before it.
- In the pictures of `shell-script-caption.mjs` the face is the browser's fallback: that script registers no baked font. The caption writer (`shell-film-captions.mjs`) and the site draw the baked face.

### 11j. The last whole run (23:27 to 23:32 UTC, at a91bbf18, the merge of origin/main e3bf85c5; `src/` unchanged after it)

- `npm run determinism`: exit 1. The built site does not start: the old beats cannot hold the new lines (the same refusals as the eight red tests of `tests/content.test.ts`). The beats are the Builder's.
- `npm run bots`: exit 0, "bots: all clear", keen reached every one of the 37 gags on every seed.
- `npm test`: 11 failed, 2181 passed, 17 skipped (2209): 8 in `tests/content.test.ts`, 1 in `tests/review.test.ts`, 2 in `tests/cut-of-build.test.ts` (the cut list on disk holds 20 lines, the build gives 11: waits for `npm run cut`). No other test red.
- `npx tsc --noEmit -p .`: exit 0. Tests of this unit: 17 files, 207 passed.

### 11k. The Builder's rulings stamped 23:46 UTC, item 3, with the addition of 23:39 UTC (built 23:36 to 23:41 UTC, 91b3c48e and 8337d74d)

- 3a, the shout drawn large. A line that is stepped by marks (`steps` in its row of `spoken`) is drawn as one syllable in the ordinary caption panel, large: `CAPTION.shout` in `src/ui/said.ts` holds `firstPx` 150, `grow` 1.12 for each next one, `lastPx` 240, `top` 306 (the panel's upper edge, under the health bar), `wide` 1100 (a longer word is drawn smaller to fit), `shakePx` 5 and `shakeHz` 17 for the last one. The syllables and their marks are read from the row of the line (`text` split at the pause mark, `standIn.starts`), any count: nothing of the word is in code. It shows the syllable of the newest mark whatever the gaps are, and is gone on `boss-gone`.
- MEASURED 23:41 UTC, `node pipeline/change002/shell-script-caption.mjs --shout`, baked face registered (true on every panel), page px: `finish-arms` nothing; KA 150 px, panel y 306 to 515, x 821 to 1099; ME 168 px, y 306 to 537; HA 188 px, y 306 to 562; ME 211 px, y 306 to 589; HA on `finish-fire` 240 px, y 303 to 621, x 748 to 1165, shaking; after `boss-gone` nothing. Pictures `shell-pictures/script-shout.png`, `script-shout-last.png`.
- UNKNOWN: whether the panel is clear of the fallen boss and of the arrow in the new finish. No still of the new finish exists on this branch. On the kept still of the old collapse the last panel covers the right end of the Human Verification panel (it ends near x 800) and one fallen part. STATED by the boss helper: the boss falls at (960, 650); the last panel's lower edge is y 621.
- 3b, the ordinary panel on the boss page. `CAPTION.lowOn = { step4: 828 }`: the lower edge of the panel on that page. MEASURED on two kept stills: dark pixels of the crack star start at y 836 to 840, the slot's body at y 930. Line 6 over the standing boss: panel y 766 to 828, x 721 to 1199. It does not cover the Submit button in that still (the boss stands at x 1470 to 1790, y 480 to 600); it lies over the red "Session expired" popup there. UNKNOWN: where the boss walks in the fight. Picture `script-boss-pill.png`.
- Line 8 is spoken on the decision page, not on the boss page: `lowOn` holds step 4 only. On the kept still of the decision page the panel at its ordinary place lies on the "Share Your Achievement" link. Not changed: not ruled.
- The harness `shell-script-caption.mjs` logs 3 console errors, each a 404 of a file. Not looked into.

### 11l. Item 7 of the same mail: the arrow at the film's first turn (23:42 to 23:49 UTC, 452f9146 and 1c3a9af8)

- Why it went there. It is not a place left from the old page. `Stage.advancePhase` lifts the film's arrow at every page turn to the hand over place, `HANDOFF` (960, 540 on the screen, 260 above the page), where the next page's script takes it up. MEASURED with a stepped whole film on this branch (old page), the arrow's place at the first and the last frame of each leaving half: careers (508, 440) to (960, 540); step 1 (877, 815) to (957, 551); step 2 (1645, 995) to (960, 540); step 3 (661, 559) to (947, 541); step 4 (1256, 620) to (960, 540); step 5 (1103, 940) to (973, 578); height 257 at the end of each. So the other turns do the same: the arrow does not ride the slab at any turn of the film. On the new careers page the middle of the screen at the bottom of the scroll is where the "Current wait time" pill lies, and the arrow has just pressed a button, so there it reads as a hop to the pill. MEASURED on `agent/b-careers` b13d25f9 before the mend: (1109.5, 893.5) at 18.483 s to (962.7, 546.4) at 18.633 s.
- The mend, in `src/stage/stage.ts` only: `STAYS_ON = ['marketing']` names the pages whose film arrow is not lifted at the turn. For those the stage does not call `cursor.lift`, and the frame's cursor pose says `rides` while the page leaves, so the view lays the arrow in the slab's plane (the way the live site's arrow already goes). The event `page-turn` and its place are as they were. The live site is untouched (`mode === 'film'` only). The other five turns are untouched.
- Decision: the page is named in the stage, not by a field of the page, so that no page file is touched. If the Builder wants the same at the other turns, their names go into `STAYS_ON`; each next page's script still starts at the hand over place.
- What it costs, MEASURED on b13d25f9 with the mend: through the whole leaving half the arrow is at (1109.5, 893.5), height 6.5 (frames 1109 to 1138); on the next frame (1139, 18.983 s, the slab edge on) it is at (960, 540), height 260, over the arriving page, as before. So the arrow's place changes in one step at the half turn, where before it was one path. Picture row 3, frame 19.000 s: the arrow is seen small in the middle under the slab's edge.
- Proof: twelve frames 18.533 to 19.267 s (film frames 1112 to 1156, every fourth, `npm run seq` in a tree of b13d25f9 with the mend): `shell-pictures/first-turn-rides.png`; the first eight near the button: `first-turn-rides-near.png`.
- Tests. New: `tests/b-shell-turn.test.ts` (3 tests: the name in `STAYS_ON`; on the careers page the arrow stays within 1 px and 1 px of height through the 30 leaving frames, rides, and is at (960, 540) on the next page; on step 1 it is lifted as before and does not ride). Changed, not mine, by `NEEDS:` 1c3a9af8: `tests/polish-hand.test.ts`, the test "the film's first turn..." is renamed and three of its nine rows are pinned again for this branch's old page (810, 819, 838: place 508.00 440.00, height 13.96). On the page of b13d25f9 the nine rows are: `1109 marketing leave 1109.50 893.50 6.54 13.42`, `1110 marketing leave 1109.50 893.50 6.54 13.11`, `1119 marketing leave 1109.50 893.50 6.54 -16.17`, `1138 marketing leave 1109.50 893.50 6.54 39.80`, `1139 step1 arrive 960.00 540.00 260.00 0.00`, `1157 step1 arrive 960.00 540.00 260.00 -11.10`, `1169 step1  960.00 540.00 260.00 -11.10`, `1179 step1  960.00 540.00 225.83 -11.10`, `1199 step1  960.00 540.00 4.00 -11.10`. The careers branch has not changed that test, so the rows are the merge's to set.

### 11m. The whole run after items 3 and 7 (23:48 to 23:54 UTC, at 1c3a9af8; only notes and a picture changed after it)

- `npm test`: 11 failed, 2185 passed, 17 skipped (2213): the same 8 in `tests/content.test.ts`, 1 in `tests/review.test.ts`, 2 in `tests/cut-of-build.test.ts`. No other red.
- `npm run bots`: exit 0, "bots: all clear". `npx tsc --noEmit -p .`: exit 0. Tests of this unit with `tests/polish-hand.test.ts`: 19 files, 262 passed.
- `npm run determinism` was not run again: at a91bbf18 the built site did not start (old beats, new lines) and nothing of that has changed. `origin/main` was not merged again after a91bbf18.


### 11n. The Builder's mail to the 23:54 UTC report (00:03 to 00:31 UTC; 6be6527d, 556e64ca, 13ae1d65, merge 27ec26e0, 3e44e134)

- Item 1, the shout. One line that builds: the engine gives the panel the parts joined up to the mark (`builtTo` in `src/audio/standin.ts`), with what joins them read from the row (`join`, `""` for candidate B, a space for A; `NEEDS:` 556e64ca in `content/narration-drafts.json`). No syllable is shown alone. Place: the top band, `CAPTION.shout.top` 96, `CAPTION.shout.low` 330, centred, drawn on the screen. The panel measures the whole line once and takes the last size from the band (width `wide` 1760, height `low - top - shakePx`), and each earlier size is the last divided by `grow` 1.12 per step, so the type only grows. End: the row's own mark, the time of `finish-fire` plus the last part's length (2.13 s for B); `until: ['boss-gone']` is kept so that a shout that has not begun is taken back and nothing outlasts the boss. A `finish-fire` that comes late does not lengthen the line.
- MEASURED (`node pipeline/change002/shell-script-caption.mjs --shout`, on the kept still, 1920 wide): KA 106 px, panel 852 to 1068 by 96 to 252; KAME 118 px, 754 to 1166 by 96 to 267; KAMEHA 132 px, 637 to 1283 by 96 to 284; KAMEHAME 148 px, 490 to 1430 by 96 to 303; KAMEHAMEHA 166 px, type 1220 px wide, panel 1287 px wide (320 to 1607), 229 px high, caught at 101 to 330 in its shake (5 px each way, so 91 to 330 at the most); 0.1 s after the row's end the panel shows nothing, with no mark sent. Picture `shell-pictures/script-shout.png`.
- SEEN on the approved pictures of main (`references/approved-002/finish-charge.png`, `finish-blast.png`) with the largest panel drawn as a frame (`shell-pictures/shout-band-on-approved-finish.png`): the frame lies clear of the arrow and of the beam's core, and its lower part lies on the two upper legs of the fallen boss and on a pillar's foot in the charge picture, and on flying pieces in the blast picture. UNKNOWN: the same in the built finish, since no frame of FINISH A exists on this branch.
- Item 2, the decision page. MEASURED on `out/stills/key-decision-hd-final.jpg` (rows with pixels darker than 150, x 128 to 1792): the head's rule ends at y 166, the heading "Step 5: Decision" is y 208 to 244 and ends at x 420, the letter and the metrics begin at y 300; below, the letter ends at y 862, the stamp at 898 and the button begins at 900, so no band below is free. Free: y 168 to 298 right of x 440. `CAPTION.lowOn.step5 = 264`: a one line panel is 202 to 264 (MEASURED, line 8, 756 to 1164 wide), and the widest panel (`CAPTION.wide` 900) is 510 to 1410. The top band 96 to 160 was not taken: the page's title (to x 845) and the rail lie in it. Picture `shell-pictures/script-decision-pill.png`.
- Item 3a. The upright stance at 18.600 to 18.733 is not `rides`. It is the careers page's own acting, `src/pages/marketing/script.ts` lines 183 to 184 on fb4ffcec: `{ at: TURN_AT - 0.2, react: 'anticipate' }` and `{ at: TURN_AT + 0.16, act: 'shocked', react: 'startle' }`; the second half of `anticipate` springs up (lean +0.28, squash 1.32) and `startle` swings it to lean -0.45. Not mine to change. Proposed to the careers owner through the Builder: drop the `anticipate` row, or move it before the press, so that the arrow goes once to the startle pose. Not verified.
- Item 3b. `src/stage/stage.ts`: `BROUGHT = { frames: 10, clear: 6 }`. At the end of a `STAYS_ON` page's leaving half the stage keeps the screen place of the riding arrow; over the first 10 frames of the arriving half the frame's pose goes from there to the hand over place, eased out (1 - (1 - u)^3), height likewise. The arrow's body is not moved (960, 540, 260 from the first arriving frame), so the next page's script and the pinned body rows are as before. The film makes one stage per unit, so `filmOptions(unit)` also names the unit before and the stage runs it once to its end for the place (MEASURED 82 ms). MEASURED on fb4ffcec with this stage, film frames 1140 to 1150: (1094.0, 534.0) height 6.5; (1057.7, 543.3) 75.3; (1028.6, 543.0) 130.2; (1006.0, 542.0) 173.1; (989.0, 541.3) 205.3; (976.8, 540.7) 228.3; (968.6, 540.4) 243.8; (963.6, 540.2) 253.2; (961.1, 540.0) 258.0; (960.1, 540.0) 259.7; (960, 540) 260. Last riding frame: (1094.2, 586.1). SEEN in `shell-pictures/first-turn-brought.png` (film frames 1130 to 1152, every frame): in 1140 to 1142 the arrow is small and partly covered by the lower half of the arriving slab; from 1143 it is whole.
- Item 4. `origin/main` 5ee40d5a merged (27ec26e0). `npm run determinism` on that head, 00:18 UTC: `EXIT determinism 1`, in 4 s. The built site does not start, by the site's own check of the narration against the beats: "The site cannot start. 5 problems", each a settled line of `content/narration.json` that at 1.6 words a second runs past the start of the next line on the beats of `config/showcase.json`: `step2.crank` to 66.25 s against 65.40 s; `step2.crank` to 67.90 s against `pinball.seal` at 67.68 s; `boss.verify` to 115.88 s against `boss.unfold` at 114.00 s; `boss.unfold` to 132.13 s against 116.4 s; `boss.unfold` to 120.78 s against 117.60 s. Both files are the Builder's. The 404s of the harness: four, all `/favicon.ico` of the harness's own page server (one per page load); the site's files answered.
- Tests. Changed by this ruling: the shout tests of `tests/b-shell-script.test.ts` (built words, the row's own end, `shoutPx` with the band's most, band 96 and 330, the decision page's place inside 168 to 298). Extended: `tests/b-shell-turn.test.ts` (5 tests: the brought path and the film's stage per unit).
- Not done: `pipeline/change002/shell-film-captions.mjs` does not draw the stepped line large. No clearance of the arrow's body over the arriving slab in frames 1140 to 1142.
- The whole run, at 3e44e134 (00:25 to 00:30 UTC): `npm run bots` exit 0, "bots: all clear"; `npm test` 11 failed, 2187 passed, 17 skipped (2215): 8 in `tests/content.test.ts`, 1 in `tests/review.test.ts`, 2 in `tests/cut-of-build.test.ts`, no other red; `npx tsc --noEmit -p .` exit 0. The run before it, at the merge 27ec26e0, had one more red, of this unit's making: `tests/polish-lamps.test.ts` "steps the machine and the page as before on every frame of the film" (the saved state had a new key, `brought`, also when it was empty). Mended in 3e44e134: the key is saved only when there is a place; that test was not changed.
