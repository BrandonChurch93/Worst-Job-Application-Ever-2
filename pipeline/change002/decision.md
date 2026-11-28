# Change 002, the Decision unit in the film: time for line 8, a place for line 9

Branch `agent/b-decision`, from `agent/merge55` at 1804108e. Every fact here is marked MEASURED (I ran it and read the number), STATED (someone told me, or a file says so) or UNKNOWN.

## What changed

1. The unit is 17.1 s (it was 12). The beats `decision.wait` and `decision.letter` are as they were. `decision.metrics` runs 6 to 13.8 (it was 6 to 10). `decision.reset` runs 13.8 to 17.1 (it was 10 to 12). `film.plannedSeconds` and `film.maxSeconds` are not touched.
2. The press of the button is no longer a number written down. `FILM.press` in `src/pages/step5/timeline.ts` is the first whole frame (of 30 a second) from which the page turns no sooner than the end of line 8 plus `audio.lineGapSeconds`. With today's words and pace that is 13.433 s, and the page turns at 13.8875 s.
3. The 8 s between the stamp and the press are acted (the table under "The acting").
4. `content/narration-drafts.json`: the draft line 9 starts at 0.02652 of `decision.reset` (it was 0). `npm run retime` wrote it. `content/narration.json` did not change: line 8 still starts on the stamp, at 0.85833 of `decision.letter`.
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

Why 17.1 s. Line 9 ends at 17.0125 s, and the unit's seconds times 30 must be whole, so 17.1 s is the shortest unit that holds the line: the film ends 0.0875 s (5 frames of 60) after the last word. The brief allows up to 0.4 s and names "about 17.4 s"; I tried the longer ends and each one cost something:

- 17.3 s broke four tests of other units by arithmetic alone: the sum of the six units in floating point is 200.20000000000002, and those tests ask that the sum times the frame rate be a whole number. 17.1 s gives 200 exactly.
- 17.4 s broke a test of the careers page's landing: in the last step of the unit the arrow, on its walk, starts to rise off the page (MEASURED: its height 10 where the test allows 6).
- More time after the line only shows more of a move that cannot finish inside the unit (next paragraph). The owner asked for the short end and no padding, so the short end it is.

A fault this left, mended by the Builder's ruling (see "After the ruling on the film's end" below). As it stood: the careers page, turned back to, plays its own script, which is another unit's and which I did not touch (MEASURED by stepping the unit): the page is entered at 14.3875 s; the arrow comes down and lies flat (14.61 to 15.16), stands, steps left and leans at the Apply button (15.52 to 16.07), holds there, and at 16.79 s (`LANDING.walk`, 2.4 s after it enters) it sets off to the place it stands at when the film starts, a walk of 0.85 s that ends at 17.6375 s. Before, the unit ended at 12 s, 1.75 s after the page was entered, on the lean; the walk was never in the film. Line 9 ends 0.22 s after the walk starts, so with any length the brief allows the film ended with the arrow in the middle of that walk: at 17.1 s it was 0.31 s into it (the arrow had gone about 40 px of the way). Two ways to mend it, both outside what I was given; the first is the one ruled:

- `LANDING.walk` in `src/pages/marketing/script.ts` later than the unit's end (it is read by the film only), so the film ends on the arrow leaning at the Apply button, held, under "the next application." That shows nothing the reset did not show before. It is the one I would take.
- The unit 17.9 s: the walk ends and the arrow stands 0.26 s at its opening place. That is 0.89 s after line 9 ends, more than the 0.4 s allowed.

## Every time that moved (seconds of the unit, the film)

| What | Old | New |
| --- | --- | --- |
| The unit's length | 12 | 17.1 |
| `decision.metrics` ends | 10 | 13.8 |
| `decision.reset` | 10 to 12 | 13.8 to 17.1 |
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
| Line 9's `at` in `content/narration-drafts.json` | 0 | 0.02652 |
| The careers page, once entered (0.5 s after the turn), is seen for | 1.746 s (ends on its lean at the button) | 2.7125 s (ends on its lean at the button, held from 16.07; the walk to the opening place is past the unit's end, at 17.1) |
| The key `decision`, `at` of its beat | 0.3 | 0.15385 (still 7.2 s of the unit) |
| The film B | 194.9 s, 11694 frames | 200 s, 12000 frames |

Not moved: the wait, the letter's fall, the stamp (in 4.57, contact 5.433, lifted to 5.97, carried to 6.40, laid down by 6.63), the landing at 7.067, all live timings.

All of these are MEASURED from `cut/CUES.md`, `npm run retime` and the constants, except the three old times of the peel, which are worked out from the old 0.78 s by the shares in `src/cursor/act/damage.ts` (the old `peel-up` is MEASURED: 7.708).

## Every test re-pinned

| File | Test | Old value | New value | Why |
| --- | --- | --- | --- | --- |
| `tests/step5.test.ts` | names every state a node waits for, and the page reaches every one of them | film run for 9.7 s | `FILM.leave + 0.25` (14.13 s) | the film page must be run to just past its page turn, which moved |
| `tests/step5.test.ts` | keeps every drawn part on the page and every run of type readable, in every state | 9.7 s | `FILM.leave + 0.25` | the same |
| `tests/step5.test.ts` | resolves every word it shows to a key | 9.7 s | `FILM.leave + 0.25` | the same |
| `tests/step5.test.ts` | lets the film cursor walk to the letter by itself, and holds it only while the stamp is over it or carries it | 9.7 s | `FILM.leave + 0.25` | the same |
| `tests/step5.test.ts` | reports the event of every beat inside its beat | film run for 12 s | the unit's seconds from the config (17.1) | the unit is longer; at 12 s the press had not happened |
| `tests/step5.test.ts` | plays the beats in the order the film tells them | 12 s | the unit's seconds (17.1) | the same; the order asked for is not changed |
| `tests/step5.test.ts` | flattens the cursor under the stamp, shows it flat at the key moment and whole again before the button | press 9.3 | `FILM.press` (13.433) | the press moved |
| `tests/step5.test.ts` | never gives the cursor arms and never changes its size | 12 s | the unit's seconds (17.1) | so the whole unit is looked at |
| `tests/step5.test.ts` | is a pure function of time in its script | 12 s | the unit's seconds (17.1) | the same |
| `tests/step5.test.ts` | continues exactly after load(save()), in the film | run to 11 s, cuts to 9.35 | run to 15 s, three more cuts: 10.5, 12.2, 13.5 | so a save is taken inside each new pose and after the new press |
| `tests/step5.test.ts` | gives the same frames by seeking as by playing | first seek to 11 s, times to 9.4 | first seek to 15 s, three more times: 13.5, 10.5, 12.2 | the same |
| `tests/decision-fix.test.ts` | the flat arrow comes down over at least 14 frames, after the block is down, and lies still before the key | `STUCK.heal` (0.78) in two lines | `FILM.heal` (2.3) | the test is of the film; the film's heal is its own number now |
| `tests/decision-acting.test.ts` | every cue of the acting sits inside the twelve seconds and in order, now named "every cue of the acting sits before the press and in order" | every cue before 10 s | every cue before `FILM.press` (13.433) | the unit is not twelve seconds and two cues are after 10 s |
| `tests/careers-fix-landing.test.ts` | the landing back on the careers page: holds three poses long enough to be read: flat on landing, stood again, leant at the button | the deep lean (under -0.45) ends on the unit's last step | the arrow stays at the leant place to the unit's last step, exactly | the reset is longer: the `recoil` that makes the deep lean ends 0.62 s after it starts and the lean eases; after the ruling the walk is past the unit's end, so the line asks the last step itself; the three holds of 0.4 s and their order are asked as before |

New tests in `tests/decision-acting.test.ts`: "the phrase times the acting keeps are those of line 8 at the narrator's rate" (holds `SAID` to the words of `content/narration.json` and `audio.narratorMaxWordsPerSecond`) and "the arrow acts the line: flat through the first two phrases, whole in the third, up on the fourth, down on the fifth, each pose held" (the holds, the heal inside 4 s, the press on a whole frame at or before the line's end, the page turn no sooner than the line's end plus the gap and less than one frame of 30 after it).

No test was loosened to pass: where a number was a film time that moved, the test now reads it from the config or from `FILM`.

## After the ruling on the film's end

RULED by the Builder (STATED, his mail of 01:59Z): in the film the arrow holds its lean at the Apply button to the unit's last frame; the unit stays 17.1 s.

- `LANDING.walk` in `src/pages/marketing/script.ts` was 2.4. It is now `Math.max(2.4, lastUnit.seconds - lastBeat.from)`: the seconds the film's last beat runs, 3.3 with today's config. The careers page is on screen for 2.7125 s of that beat, so the walk is past the end.
- The live site is not changed (MEASURED by reading the code): `rejectedPath` is read only through the page's `script()`, which only the film's driver runs. A visitor's arrow is the visitor's; the site has no scripted walk.
- New test in `tests/careers-fix-landing.test.ts`: "ends the film on the lean: over the last 0.3 s of the unit the arrow does not change its place or its pose, and the walk to the opening place is past the end". It asks the same acting, no reaction, y, z and spin exact, x within 0.01 px, lean within 0.005 rad, squash within 0.001. MEASURED over those 0.3 s: x moves 0.00004 px, lean 0.0028 rad (the tail of the ease into the lean), squash 0.00003; the acting is `exhausted` throughout.
- The frames of the unit from 16.79 s on changed. `cut/` is the same after `npm run cut` (MEASURED). The frames before 16.79 s were not compared one by one; the walk is the only thing whose time moved.

## The caption on the sheets

The Builder saw the caption on `decision-line.jpg` lying under the Accept Rejection button and over the share link. That was the sheet, not the page (MEASURED): the shell already puts the panel on this page in the free band under the title rule (`CAPTION.lowOn.step5` 264 in `src/ui/said.ts`, the panel at y 202 to 264), and on the boss page at 828. The tool that draws the film's captions, `pipeline/change002/shell-film-captions.mjs`, drew every one at the foot (`CAPTION.low`, 1044) whatever the page. The button and the link were not moved (the Builder withdrew that, STATED, 02:02Z).

- `captionLow(page)` in `src/ui/said.ts`: the lower edge the panel has on a page. `filmLinePage(key, unit)` in `src/audio/cues.ts`: the page a line of the film is said over (the page of its unit; for a line set off by the turn of the page, the page turned to).
- The tool now gives each phrase its `page` and `lowerEdgeY`, tells the panel that place as the live site does, and draws a line that builds on marks (the boss's shout) as the panel does. It was run for the whole film: `pipeline/change002/shell-film-captions.json` holds 54 phrases of 13 lines (it held 12, the first 18 s).
- New file `tests/film-captions-place.test.ts`, three tests: the page of each line; every phrase's kept box against the live place for its page (lower edge within half a pixel, centred on 960, no wider or higher than the panel may be; line 8's five phrases at y 202 to 264 exactly); and the panel itself, made as the site makes it, puts its lower edge at `captionLow(page)` on each of the six pages.

The three boxes at 9 s of the unit, [left, top, width, height] in the 1920 by 1080 frame (MEASURED):

| | Before | After |
| --- | --- | --- |
| Caption "has decided" | 850.2, 982, 219.6, 62 (over the button's lower 18 px and the top 10 px of the link's words) | 850.2, 202, 219.6, 62 |
| Accept Rejection button (`accept-cap`) | 773, 904, 374, 96 | the same |
| Share Your Achievement link (`share`, the words and the rule) | 842.3, 1034, 235.3, 19.1 | the same |

What this leaves, not mended:

- Line 9 is given the careers page's place (the foot) for its whole length. For the half second the decision page is still turning away (film frames 11807 to 11836) "On to" lies at the foot. The live panel eases to a new place over about a quarter of a second; the stills do not model that ease.
- On the careers page the panel at the foot lies partly over the page's ticker band (seen at real size at 16.4 s). That is the shell's place for that page, the same as at the film's start; not this unit's.

## Outside the list I was given

- The key `decision` in `config/showcase.json`: `at` 0.3 to 0.15385. I was told I may change the unit's seconds and the `decision.*` beats. The key's `at` is a share of its beat; with the beat longer, 0.3 would be 8.34 s, where the arrow is half peeled, and the approved image and `tests/decision-fix.test.ts` want it lying flat. 0.15385 is the same 7.2 s of the unit as before. The Builder has accepted this (STATED, his mail during the work).

## What follows from the longer film, not mended here

- The film B is 200 s. `film.maxSeconds` is 165 and `film.plannedSeconds` is the owner's; it was over before (194.9 s). Not touched.
- "Your Time" on the metrics panel is the film's length in film mode, so it reads 03:20 where it read 03:14 (STATED by the code, `filmSeconds()`; read off the sheet).

## UNKNOWN

- How any of it moves. I looked at stills only. Whether the peel reads as a peel, whether the puff and the lean on "to move forward" read as hope, whether the sag reads, whether the hold before the press feels held or dead: UNKNOWN in motion.
- How it sounds. The two lines are silent stand-ins; no sound was made or heard.
- Whether a real voice fits. The times are the soonest the lines can end at 1.6 words a second. A slower voice makes line 8 end after the press and line 9 run past the unit; `npm run retime` will say so when the real lengths are in.
- Whether the caption sits well on this page, in motion. On the stills it now lies where the shell puts it on this page, in the free band under the title rule (see "The caption on the sheets" below).
- How the held lean at the very end reads, and whether a film that ends on a still arrow feels ended. On the stills nothing moves in the last 0.3 s but the page's own ticker.
- Whether the owner wants line 9 over the careers page as it plays at its start (the hero and the Apply button rising), which is what the reset shows.

## Not done

- Pushed to `agent/b-decision` only. Early in the work `git push` exited 128 (no sign-in in the sandbox); at the end it went through.
- The reset itself: untouched, as told.
- No film render, no sound.
- The one fault `npm run retime -- --check` still names on this base, boss.unfold.0, is not mine and not touched. The Builder says it is already mended on origin `agent/merge55` (STATED).

## After the real take of line 8 (the Builder's task of 04:10Z, branch `agent/b-decision2`)

The times, the reasons and what is not as asked are in `src/pages/step5/NOTES.md`, section "After the real take of line 8". In short: `SAID` is the take's five starts and its end; the unit is 21.7 s; `stamp` 5.433, `button-press` 18.033, `page-turn` 18.4875; the live site holds a press made under the line to the end of the phrase being said.

Numbers in tests that changed, and why:

| Test file | Test | Was | Is | Why |
| --- | --- | --- | --- | --- |
| `tests/decision-acting.test.ts` | the phrase times the acting keeps | `SAID` against the words of the script at 1.6 words a second | `SAID` against `standIns().get('decision.letter.0')`, exactly | asked: a new take must fail it |
| `tests/decision-acting.test.ts` | the arrow acts the line | still flat 0.5 s before the third phrase; whole after the third starts and 0.2 s before the fourth | flat a second or more; the peel starts under 0.7 s before the second phrase; whole after the second starts, inside 4 s of the hit and 0.2 s before its next move; a move in each pause; the eight cues in order | the three old lines cannot hold with the take, and the first two cannot hold at all under the 4 s a damage may last |
| `tests/decision-acting.test.ts` | the beaten walk to the button | the walk starts 0.4 s or more after the look | 0.25 s or more | the last phrase is 1.73 s and the press 0.14 s before its end: the sag, the look, the walk of 0.6 s and the hold of 0.4 s must fit in 1.59 s |
| `tests/step5.test.ts` | waits for the press of the button and takes it as soon as the button is up | turned inside 8.5 s | turned no sooner than the first phrase's end and the gap, and inside 0.6 s of it; the press itself is as early as before | the ruling on the live site |
| `tests/step5.test.ts` | hands the cursor on whole, however early the button is pressed | done inside 7.6 s | done by the first phrase's end and the gap | the same ruling |

New tests: "a press while the line is being said holds the page to the end of the phrase being said and the gap; a press after the line turns as before" (`tests/decision-acting.test.ts`), "turns as before when the button is pressed after the narrator's line has ended" (`tests/step5.test.ts`), and in the keen bot's test that the page holds with the button down and control not taken.

Not committed, as told: `content/narration.json` and `cut/`.

## The push-in under the line (the Builder's task of 04:29Z)

The film only. `VIEW` in `src/pages/step5/timeline.ts` holds the numbers: zoom 1.5 centred on page (960, 720), in from 7.067 s to 13.599 s, held to 16.643 s, out by 17.013 s. The reasons, the caption's place and what is not as asked are in `src/pages/step5/NOTES.md`, section "The push-in under the line". Tests: `tests/decision-view.test.ts`. Strip: `node pipeline/change002/decision-frames.mjs --name push --at 5.5,6.0,...,18.5 --columns 5`.
