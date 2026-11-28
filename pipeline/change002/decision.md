# Change 002, the Decision unit in the film: time for line 8, a place for line 9

Branch `agent/b-decision`, from `agent/merge55` at 1804108e. Every fact here is marked MEASURED (I ran it and read the number), STATED (someone told me, or a file says so) or UNKNOWN.

## What changed

1. The unit is 17.3 s (it was 12). The beats `decision.wait` and `decision.letter` are as they were. `decision.metrics` runs 6 to 13.8 (it was 6 to 10). `decision.reset` runs 13.8 to 17.3 (it was 10 to 12). `film.plannedSeconds` and `film.maxSeconds` are not touched.
2. The press of the button is no longer a number written down. `FILM.press` in `src/pages/step5/timeline.ts` is the first whole frame (of 30 a second) from which the page turns no sooner than the end of line 8 plus `audio.lineGapSeconds`. With today's words and pace that is 13.433 s, and the page turns at 13.8875 s.
3. The 8 s between the stamp and the press are acted (the table under "The acting").
4. `content/narration-drafts.json`: the draft line 9 starts at 0.025 of `decision.reset` (it was 0). `npm run retime` wrote it. `content/narration.json` did not change: line 8 still starts on the stamp, at 0.85833 of `decision.letter`.
5. `cut/` is rewritten by `npm run cut`.
6. A tool for the pictures, `pipeline/change002/decision-frames.mjs`: frames of the unit with the caption of that frame laid over, as a sheet.

What the reset does is as it was: the press, the hold, the turn back to the careers page, which then plays as it does at the start. Only its time moved.

## The live site

Nothing a visitor can do and no live timing changed. The stamp, the lift, the carry, the fling and the landing are shared by both modes and were not moved. One film number was also a live number and is split:

- How long the arrow, landed flat, takes to be whole. It was `STUCK.heal` (0.78 s) in both modes. The film now uses `FILM.heal` (2.3 s); a visitor still gets `STUCK.heal`. The split is one line in `src/pages/step5/index.ts` (`s.mode === 'film' ? FILM.heal : STUCK.heal`).

`READ`, `GIVE` and `CUES` in `script.ts` are read in the film only (STATED by the code: the cues run when the mode is film). MEASURED: the live tests of `tests/step5.test.ts` and `tests/decision-wait.test.ts` pass with no change to them.

## The acting, and why

| Phrase of line 8 | Starts (s of the unit) | What the arrow does |
| --- | --- | --- |
| "After careful consideration," | 5.433 | struck flat on the first word, carried off under the block, flung clear, lands flat at 7.067 |
| "the company" | 7.308 | lies flat, nothing else moving, to 8.217 |
| "has decided" | 8.558 | peels itself up (8.217 to 8.861), whole at 9.367, slumped (`exhausted`) and held 0.44 s |
| "to move forward" | 9.808 | puffs up (`proud`) and leans to the letter, the same word and the same lean as when the letter fell; held 1.875 s |
| "with other candidates." | 11.683 | sags (`exhausted`, the lean let go), held 0.33 s; looks at the one button (12.013); drags itself there (12.423 to 13.033); holds 0.3 s; strikes (13.333); the press at 13.433 |
| the line ends | 13.558 | the button is down; the page turns at 13.8875 |

Why this and not the reading in the brief word for word. The brief had the arrow look at the letter and then sag. The line is written as a rise and a fall: "to move forward" sounds like good news for 1.9 s, and "with other candidates." takes it away. So on the fourth phrase the arrow does not only look, it hopes: it puffs up and leans to the letter exactly as it did when the letter fell (3.06 to 3.94 s), which the viewer has already seen once and can read at once. On the fifth it lets go. One idea, one move, one pose, one hold each time; no cue starts inside another's pose (a test holds every cue 0.3 s or more after the one before it, and the two new holds at 0.2 s or more).

If the puffing up is too much, the other word is `nervous`: one word in `CUES` in `script.ts`.

Why the peel starts 0.34 s before "has decided" and not on it. The arrow must be whole within `cursor.damageHealSeconds` (4 s) of the first hurt, which is the stamp at 5.433. With a film heal of 2.3 s it is whole 3.93 s after the stamp. A later peel breaks that rule. A second film hurt to put it off was not taken: every hurt kicks the arrow with a squash, and there would be no cause for it on the screen.

Why 17.3 s and not shorter. Line 9 ends at 17.0125 s. The unit's seconds times 30 must be whole, so the shortest unit that holds the line is 17.1 s (0.0875 s after the last word). I chose 17.3 s: 0.2875 s after the last word, just under the gap the film keeps after every other line, and inside the 0.4 s the brief allows. The line is a silent stand-in at the narrator's fastest pace; a real voice will not be faster. To take the shorter end: `seconds` of the unit and `to` of `decision.reset` to 17.1 in `config/showcase.json`, then `npm run retime` and `npm run cut`. No test pins 17.3.

## Every time that moved (seconds of the unit, the film)

| What | Old | New |
| --- | --- | --- |
| The unit's length | 12 | 17.3 |
| `decision.metrics` ends | 10 | 13.8 |
| `decision.reset` | 10 to 12 | 13.8 to 17.3 |
| The landed arrow is whole after (`FILM.heal`, was `STUCK.heal`) | 0.78 | 2.3 |
| It lies flat until | 7.457 | 8.217 |
| The event `peel-up` | 7.708 | 8.954 |
| It is whole at | 7.847 | 9.367 |
| Puffs up and leans to the letter (`READ.look`) | not there | 9.808 |
| Sags (`READ.sag`) | not there | 11.683 |
| Looks at the button (`GIVE.look`) | 7.88 | 12.013 |
| The walk to the button (`GIVE.walk`) | 8.29 to 8.9 | 12.423 to 13.033 |
| The strike (`GIVE.strike`) | 9.2 | 13.333 |
| The press, event `button-press` (`FILM.press`) | 9.3 | 13.433 |
| The page turns, event `page-turn` (`FILM.leave`) | 9.754 | 13.8875 |
| Line 8 (`decision.letter.0`), start to end | 5.433 to 13.558 | 5.433 to 13.558 (not moved; it now ends inside the unit) |
| Line 9 (draft, `decision.reset.0`), start to end | 13.858 to 16.983, past the unit's end, 4.104 s after its event | 13.8875 to 17.0125, on its event |
| Line 9's `at` in `content/narration-drafts.json` | 0 | 0.025 |
| The key `decision`, `at` of its beat | 0.3 | 0.15385 (still 7.2 s of the unit) |
| The film B | 194.9 s, 11694 frames | 200.2 s, 12012 frames |

Not moved: the wait, the letter's fall, the stamp (in 4.57, contact 5.433, lifted to 5.97, carried to 6.40, laid down by 6.63), the landing at 7.067, all live timings.

All of these are MEASURED from `cut/CUES.md`, `npm run retime` and the constants, except the three old times of the peel, which are worked out from the old 0.78 s by the shares in `src/cursor/act/damage.ts` (the old `peel-up` is MEASURED: 7.708).

## Every test re-pinned

| File | Test | Old value | New value | Why |
| --- | --- | --- | --- | --- |
| `tests/step5.test.ts` | names every state a node waits for, and the page reaches every one of them | film run for 9.7 s | `FILM.leave + 0.25` (14.13 s) | the film page must be run to just past its page turn, which moved |
| `tests/step5.test.ts` | keeps every drawn part on the page and every run of type readable, in every state | 9.7 s | `FILM.leave + 0.25` | the same |
| `tests/step5.test.ts` | resolves every word it shows to a key | 9.7 s | `FILM.leave + 0.25` | the same |
| `tests/step5.test.ts` | lets the film cursor walk to the letter by itself, and holds it only while the stamp is over it or carries it | 9.7 s | `FILM.leave + 0.25` | the same |
| `tests/step5.test.ts` | reports the event of every beat inside its beat | film run for 12 s | the unit's seconds from the config (17.3) | the unit is longer; at 12 s the press had not happened |
| `tests/step5.test.ts` | plays the beats in the order the film tells them | 12 s | the unit's seconds (17.3) | the same; the order asked for is not changed |
| `tests/step5.test.ts` | flattens the cursor under the stamp, shows it flat at the key moment and whole again before the button | press 9.3 | `FILM.press` (13.433) | the press moved |
| `tests/step5.test.ts` | never gives the cursor arms and never changes its size | 12 s | the unit's seconds (17.3) | so the whole unit is looked at |
| `tests/step5.test.ts` | is a pure function of time in its script | 12 s | the unit's seconds (17.3) | the same |
| `tests/step5.test.ts` | continues exactly after load(save()), in the film | run to 11 s, cuts to 9.35 | run to 15 s, three more cuts: 10.5, 12.2, 13.5 | so a save is taken inside each new pose and after the new press |
| `tests/step5.test.ts` | gives the same frames by seeking as by playing | first seek to 11 s, times to 9.4 | first seek to 15 s, three more times: 13.5, 10.5, 12.2 | the same |
| `tests/decision-fix.test.ts` | the flat arrow comes down over at least 14 frames, after the block is down, and lies still before the key | `STUCK.heal` (0.78) in two lines | `FILM.heal` (2.3) | the test is of the film; the film's heal is its own number now |
| `tests/decision-acting.test.ts` | every cue of the acting sits inside the twelve seconds and in order, now named "every cue of the acting sits before the press and in order" | every cue before 10 s | every cue before `FILM.press` (13.433) | the unit is not twelve seconds and two cues are after 10 s |

New tests in `tests/decision-acting.test.ts`: "the phrase times the acting keeps are those of line 8 at the narrator's rate" (holds `SAID` to the words of `content/narration.json` and `audio.narratorMaxWordsPerSecond`) and "the arrow acts the line: flat through the first two phrases, whole in the third, up on the fourth, down on the fifth, each pose held" (the holds, the heal inside 4 s, the press on a whole frame at or before the line's end, the page turn no sooner than the line's end plus the gap and less than one frame of 30 after it).

No test was loosened to pass: where a number was a film time that moved, the test now reads it from the config or from `FILM`.

## Outside the list I was given

- The key `decision` in `config/showcase.json`: `at` 0.3 to 0.15385. I was told I may change the unit's seconds and the `decision.*` beats. The key's `at` is a share of its beat; with the beat longer, 0.3 would be 8.34 s, where the arrow is half peeled, and the approved image and `tests/decision-fix.test.ts` want it lying flat. 0.15385 is the same 7.2 s of the unit as before. The Builder has accepted this (STATED, his mail during the work).

## What follows from the longer film, not mended here

- The film B is 200.2 s. `film.maxSeconds` is 165 and `film.plannedSeconds` is the owner's; it was over before (194.9 s). Not touched.
- "Your Time" on the metrics panel is the film's length in film mode, so it reads 03:20 where it read 03:14 (STATED by the code, `filmSeconds()`; read off the sheet).

## UNKNOWN

- How any of it moves. I looked at stills only. Whether the peel reads as a peel, whether the puff and the lean on "to move forward" read as hope, whether the sag reads, whether the hold before the press feels held or dead: UNKNOWN in motion.
- How it sounds. The two lines are silent stand-ins; no sound was made or heard.
- Whether a real voice fits. The times are the soonest the lines can end at 1.6 words a second. A slower voice makes line 8 end after the press and line 9 run past the unit; `npm run retime` will say so when the real lengths are in.
- Whether the caption sits well on this page. On the stills it lies just under the Accept Rejection button, over the share link, and the arrow presses the button right beside it. The caption's place is the shell's, not this page's; I did not move it.
- Whether the owner wants line 9 over the careers page as it plays at its start (the hero and the Apply button rising), which is what the reset shows.

## Not done

- Not pushed. This sandbox has no sign-in to GitHub (MEASURED: `git push` exits 128, "could not read Username"). The commit is local; a git bundle and a patch against 1804108e go with the report.
- The reset itself: untouched, as told.
- No film render, no sound.
- The one fault `npm run retime -- --check` still names on this base, boss.unfold.0, is not mine and not touched. The Builder says it is already mended on origin `agent/merge55` (STATED).
