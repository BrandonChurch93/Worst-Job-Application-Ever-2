# Times of captions and cues that are numbers of their own

Asked by the Builder at 09:05 UTC, November 28, for the sound wiring that follows. A list, no code change.
Read from the code at 8abf4f05 (`agent/b-shell`). Every row is MEASURED from the code: file and line, the number as it stands there. Where a row says two numbers are equal or differ, the command that showed it is named.
Scope: `src/audio/*.ts` and `src/ui/*.ts`. Two places outside that scope are named in part C because the rows there cannot be read without them.

The places a time is meant to be read from, as the code has them now:
- `config/showcase.json` `audio.*` (lineGapSeconds 0.3, liveNarratorMinGapSeconds 0.3, holdMusicSeconds 2, narratorMaxWordsPerSecond 1.6, the asked length of each cue in `audio.sfx`).
- `public/audio/index.json` (the kept length of each sound and line, and each line's phrase starts).
- `src/audio/levels.ts` (`DUCK`, `LIVE`, `CHAIN`, `MIX`: "every number of the sound side that the config does not hold").
- `src/ui/said.ts` `CAPTION` (the panel).

## A. A time typed where it is used

| File and line | Number | What it is |
| --- | --- | --- |
| `src/audio/index.ts:261` | `0.005` s | A sound on the plain audio element that is due no more than this far ahead is started at once and not put on a timer. No name. |
| `src/audio/mix.ts:97` | `0.03` s | The film mix's fade in and out of a loop and of a sound cut short. No name; the live site reads `LIVE.loopFadeSeconds` (0.03, `src/audio/levels.ts:83`) for the same thing. Two places, equal now. |
| `src/audio/dsp.ts:458` | `lengthSeconds * 500` | A fade in or out is at most half of the sound (500 ms a second of length). No name. |
| `src/audio/dsp.ts:369` | `0.002` s | The window in which the chain looks for where a sound is loud: it sets where a kept cue starts and ends, and where a line's pauses are found. No name. |
| `src/audio/dsp.ts:206`, `:207` | `0.4` s, `0.1` s | The block and the hop of the loudness measure. No name. |
| `src/audio/dsp.ts:491`, `:538` | `0.05` s | The window round a loop's seam in which its level is compared. Typed twice. |
| `src/audio/dsp.ts:524`, `:528` | `0.0005` s, `0.00002` s | The steps in which a loop's pulse is searched. No name (`CHAIN.pulseStepMs` is another number: the hop of the envelope). |
| `src/ui/interface.ts:17` | `HIDE_AFTER_MS = 2600` | The film's control bar goes to sleep this long after the last pointer move. Named beside its use, in no table. |
| `src/ui/interface.ts:18` | `SEEK_KEY_SECONDS = 5` | An arrow key moves the film by this much. Named beside its use. |
| `src/ui/interface.ts:24` | `SOUND_LOOK_MS = 250` | How often the sound controls look for the sound by themselves. Named beside its use. |
| `src/ui/said.ts:4` | `SAY = { baseSeconds: 0.6, secondsPerLetter: 0.03, capSeconds: 3 }` | How long a message of the page is given in the live region for screen readers before the next one. Its own table, apart from `CAPTION`; not read by the sound side. |
| `src/ui/said.ts:89` | `shakeHz: 17` | The rate of the shout's shake (in `CAPTION.shout`). One place; listed because it is a rate of the caption that no take or mark gives. |
| `src/ui/said.ts:101` | `easeSeconds: 0.25` | The time over which the panel moves to a new place (in `CAPTION`). One place. |

## B. A time that has a name here and its home somewhere else: two places to keep equal

| File and line | Number | Its home | State now |
| --- | --- | --- | --- |
| `src/audio/cues.ts:384` | `SENTENCE_WAIT_SECONDS = 5.2` | The end of the first sentence of line 7 in its kept take: `public/audio/index.json`, `line.boss.unfold.0`, `starts[2]` = 5.182. | 5.2 covers 5.182 by 0.018 s. A new take of line 7 with a first sentence longer than 5.2 s breaks the rule the comment states; nothing reads the index to check it. (`node -e` on the index: starts 0.006, 2.208, 5.182, 8.524.) |
| `src/audio/cues.ts:85` to `:95` | The lengths of the 11 added cues (0.6, 0.5, 0.8, 0.4, 0.8, 0.3, 1.0, 0.6, 0.6, 0.5, 0.3) | The asked lengths in `config/showcase.json` `audio.sfx`; the kept lengths in `public/audio/index.json`. | Equal to `audio.sfx` for all 11. Not the kept lengths for 8 of 11: arms-out 0.13, dial-fling 0.601, flipper-save 0.1024, popup-close 0.082, carpet-roll 0.866, inbox-take 0.3988, firehouse-take 0.5887, metrics-card 0.3116 (`node -e` on the two files). The site plays the kept file; these lengths are what was asked. |
| `src/audio/cues.ts:101` | `finish-fire`, `seconds: 2.2` | No row in `audio.sfx`, no file in the index (`node -e`: false, false). | The only place this length stands. Nothing plays for it yet. |
| `src/audio/cues.ts:128` to `:176` | Lengths in comments ("file to come: ..., 0.2" and so on: 13 lines with one length each, and line 176 with five) | Nowhere else. | Comments only: no code reads them. Listed so they are not taken for the lengths of kept sounds. |
| `src/audio/levels.ts:87` | `LIVE.quietTurnSeconds: 0.5` | Half a page turn: `TURN_HALF = 0.5`, `src/stage/stage.ts:10`. | Equal now. Read at `src/audio/index.ts:444`, `:448` and `src/audio/mix.ts:62`, `:105`; nothing holds the two together. |
| `src/audio/levels.ts:95` | `LIVE.aheadSeconds: 0.6` | "Longer than the longest step the film takes in one drawn frame": a property of the film's clock, named nowhere. | A number chosen against a length that is not written down. |
| `src/audio/levels.ts:77` | `LIVE.openingWaitSeconds: 0.15` | The wait before line 1 so that a press of Apply by the same gesture is seen first. | One place; a guess about the gesture, not a length of anything kept. |
| `src/ui/rise.ts:4` | `RISE_FALLBACK = 0.8` | `CAMERA.rise[0]` of `src/boss/tune.ts` on `agent/b-camera`. | Used only while the tune file has no `CAMERA`; after the merge the camera's number is read and this one is dead. A test holds the used number equal to `CAMERA.rise[0]`. |
| `src/ui/interface.ts:26` | `NOTICE_LEAVE_MS = 260` | The move of the sound bar in the style sheet: `transition: transform 0.26s`, `src/ui/interface.module.css:353`. | Equal now; two places. |

## C. The shout (`boss.finish.0`): its times are not read from the index

| File and line | What stands there | What follows from it |
| --- | --- | --- |
| `src/audio/standin.ts:76` | `kept = ... && spoken[key]?.steps === undefined` | A line with `steps` is never taken as kept: its length and phrase starts are not read from `public/audio/index.json` even when a take is there. Today the index has no `line.boss.finish.0` (`node -e`: null). When the take is kept, this condition decides whether its length is used. |
| `src/audio/standin.ts:77` | `line.standIn ? phrasesAt(..., line.standIn.starts, line.standIn.seconds)` | The shout's times come from `content/narration-drafts.json`, `film['boss.finish'][0].standIn`: seconds 6.26, starts 0.1, 1.04, 4.13. |
| `src/audio/index.ts:624` | `lasts = l.seconds - (last phrase).from` | On the live site the shout ends this long after the fire mark: 6.26 - 4.13 = 2.13 s, from the stand-in above. |
| `src/boss/tune.ts:175` to `:179` (not `src/audio`, not mine) | `SHOUT = { beats: [0.1, 1.04, 2.09, 2.9], fire: 4.13, gone: 6.26 }` | The same three numbers (0.1, 1.04, 4.13) and the same end (6.26) as the stand-in in the drafts file: two places typed by hand, equal now. The page sends its marks from this table; the caption's film frames come from the drafts file. |
| `src/audio/standin.ts:66` | `wordsPerSecond = config.audio.narratorMaxWordsPerSecond` | A line with no take and no stand-in is paced at 1.6 words a second from the config. One place; listed because such a line's length is a count of words, not a length of sound. |

## D. Not times of a caption or a cue

- Tolerances of the arithmetic, not times: `1e-9` (`src/audio/narrator.ts:51`, `:68`; `src/audio/index.ts:822`), `1e-6` (`src/audio/cues.ts:371`, `:389`, `:390`).
- The log rounds to a thousandth of a second: `src/audio/index.ts:357`.
- `src/ui/picker.ts` (`stallSeconds`, `firstWindowSeconds`, `steadyWindowSeconds`) and `src/ui/dev.ts` are the picture's quality picker and the development page: no caption, no cue.

## What I did not find

- In `src/audio/index.ts` every fade, wait and gap of the live site but the one at line 261 is read from `LIVE`, `DUCK` or `config.audio`.
- In `src/audio/narrator.ts` no time is typed: the rules are given to it (`src/audio/index.ts:312`).
- The panel shows and hides on the engine's times only: `src/ui/said.ts` has no time of its own for when a caption comes or goes.
