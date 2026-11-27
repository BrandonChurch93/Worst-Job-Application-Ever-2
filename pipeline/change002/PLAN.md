# Change note 002, section B: the plan

Written by the Builder on 2026-11-27 at 2:25 PM Mountain Time. The source is the note itself, word for word in `kit/PROGRESS.md` under "Change note 002 from Brandon, by Partner". Where this plan and the note differ, the note wins. Where the note and `kit/01-FILM.md` or addendum 001 differ, the note wins.

## The test for every item

Brandon: "This is already turning something that was slightly annoying, but funny and into just annoying". Each gag is one short beat, the visitor can win it, and it is fun to watch even while it is happening to you. A unit that makes a gag longer, unwinnable or dull has failed, however well it is drawn.

## Stopped (section A of the note)

No work of any kind on: the last name field and its shuffling keyboard (cut); the live, playable pinball view (replaced by item 8); the look of the careers page and the look of the boss and its page (pictures first; the boss rules of item 15 are built on a plain stand-in that is not polished); the narrator's lines (no new takes, no rewording, no retiming, no credits; every line is a stand-in until the new script arrives).

## Kept, in Brandon's words

- "The resume animation is great. I love how animated the mouse curse looks"
- "The pinball machine as an asset looks great" and "the overall like cameras here and showing off the beautiful mess of the pinball machine is done really really well."
- "I love the animation at the end of the rotary phone where it spins the mouse cursor off that's super animated and I love that." The start of the dial stays as it is.
- The crank's dialogue: "the dialogue here is pretty funny. I think it's hilarious."
- "you actually do click to shoot which is pretty cool."

## Units

One helper per unit, each in its own sandbox on its own branch from `origin/main`. A helper edits only the files of its unit. The Builder merges, runs the whole suite on the merged tree, publishes the site and shows Brandon.

| Unit | Branch | Items of the note | Files it owns |
| --- | --- | --- | --- |
| shell | `agent/b-shell` | 12 the progress bar counts fields (the shell's half, landed first); 1 voiceover on events with the spoken words on screen; 10 no sound on the careers page except the press of Apply; 9 the hum after a restart | `src/audio/*`, `src/ui/said.ts`, `src/shell/*`, the restart path in `src/app.ts` and `src/main.ts` |
| careers | `agent/b-careers` | 9 cards flip back when the pointer leaves; 9 the quotes strip runs the full width of the page. The page's new look waits for Brandon's yes to PAGE B and is not built yet | `src/pages/marketing/*` |
| step 1 | `agent/b-step1` | 11 one Name field; 12 one field at a time (Name, Email, Resume); 2 turret blasts; 7 the email slabs; 9 the arrow glitching behind Continue | `src/pages/step1/*` except `src/pages/step1/resume/` |
| resume | `agent/b-resume` | 3 the resume, in order | `src/pages/step1/resume/*` (new); starts from the step 1 unit's first push |
| step 2 | `agent/b-step2` | 12 one field at a time (Contact number, Date of birth, Audio volume), the rotary phone as the stage; 6 keep the fling; 13 the reels with stop buttons; 14 the crank as the whole stage with its sign | `src/pages/step2/*` |
| pinball | `agent/b-pinball` | 4 the vacuum as a fight; 5 the pinball scene: chaos, particles, lights, sounds, coins, a slower pace, signs on the buildings | `src/pages/step3/*` on the film's path, `src/table/*` |
| video | `agent/b-video` | 8 the pinball on the live site as pre-rendered video with seamless joins | `src/pages/step3/video/*` (new), `tools/pinball-video.mjs` (new), the live path of step 3 |
| boss | `agent/b-boss` | 15 how the boss plays, on the stand-in | `src/boss/*`, `src/pages/step4/*` |

Each unit also owns its own tests (`tests/b-<unit>*.test.ts`), its own scripts (`pipeline/change002/<unit>-*.mjs`), its notes (`pipeline/change002/<unit>.md`) and the tests of its own page that pin a thing the note has cut or changed. A test that is changed or removed is named in the unit's notes with the line of the note that changed it.

## Contracts between units

1. Words. Every word a visitor can read comes from the copy. The locked copy `content/copy.json` is not edited by anyone. The new words of the note are drafts in `content/copy-drafts.json`, read in code as `copy.drafts` (`src/copy.ts`) and in the tools as `copy.drafts` (`tools/lib/story.mjs`). A unit that needs a word neither file holds tells the Builder, who adds it to the drafts and lists it for Brandon. No string typed into code.
2. Field progress. The page reports how many of its fields are done and how many there are, as plain data of its own state; the shell reads it when it draws the rail. No hidden state outside the page. The shell unit lands this contract in its first push (in `src/shell/` and, as little as it takes, in `src/stage/types.ts` and `src/stage/stage.ts`, which it may touch for this and nothing else) and the Builder merges it at once. Until then step 1 and step 2 keep the two numbers in their own state and wire them in afterwards.
3. Events. A page says what happened by `emit(name, x, y)`, as today. Every new gag emits a named event at its moment (for example the blast leaving a turret, the slab landing, a reel stopped, the arrow flattened). Each unit lists its event names in its notes. The shell unit ties narrator lines and captions to events and leaves silence between; it does not change a line.
4. Sounds. New sound effects stay inside addendum 001's cap of 10,000 credits, counted in the ledger `audio/CREDITS.md`. Only the Builder spends credits. A unit that needs a sound writes in its first message: a name, what it is, and its length in seconds. Until the file arrives it uses the nearest cue the build has.
5. The film and the live site. A page is one piece of logic played in two modes. Every item works in both: the film shows the gag, the live site lets the visitor do it and win it. The one exception is item 8. The film's beats in `config/showcase.json` are numbers of the kit and are not changed: where the new stages do not fit the time the film gives a page today, fit what can be fitted, say which beat is short and by how much, and carry on. The film is retimed when Brandon's new script arrives.
6. Step 3 has two owners. The pinball unit owns the scene and the film's path; the video unit owns what the live site does. Both keep their edits to `src/pages/step3/index.ts` small and put new code in new files.

## Decisions

- D1. Step 1 runs Name, Email, Resume (Partner's reading under item 7: email is the last field that uses the keyboard).
- D2. Step 2 runs Contact number, Date of birth, Audio volume, the order of the build today.
- D3. Date of birth: the ordinary field asks for the date as "MM / DD / YYYY" and the visitor types it; that typed date is "your own date" of item 13. Then the field turns into the reels, each with its own STOP button. All three reels stopped on the typed date pays out coins; anything else is accepted with the line "Close enough. Date of birth recorded."
- D4. A blast that hits the arrow in step 1 does what a bolt does today. Item 2 changes the blast's shape, its speed, how often it comes and its sound, not the price of being hit.
- D5. The signs of item 5 carry the eight building names the locked copy already holds under `step3.table.buildings`.
- D6. Item 8's video is rendered from the film's own frames at the final setting, so nothing is given up in the picture. The mechanism and its measurements are built now on a stand-in render of the scene as it is today; the real render is made when item 5 has landed.
- D7. The boss rules of item 15 live in the fight's logic, apart from how the boss and the arena are drawn, so they carry over unchanged when Brandon has picked the new boss and arena.
- D8. Being hit in step 4 flattens the arrow for a moment, it peels itself up, and the boss wins back a little health. There is no health bar for the visitor and no way to lose outright.

## Rules for every helper

- Your own files only. Everything else is frozen for you: `config/`, `content/`, `references/`, `kit/`, `parts/`, `package.json`, `package-lock.json`, and every file another unit owns. No new npm package. If you need a change outside your files, write it as `pipeline/change002/<unit>-NEEDS.patch` (a `git diff` that applies on your starting commit), tell the Builder at once what and why, and carry on; you may apply it on your branch as one commit of its own whose subject starts with `NEEDS:`.
- Only Brandon changes a number the kit sets. A number you need that the kit does not set lives in your own file, named, with one line saying what it is.
- Conventions of `AGENTS.md`: no em dashes and no added exclamation points in any file; almost no code comments; no `Math.random`, `Date.now` or `performance.now` in anything a frame of the film or a step of the stage is computed from; no model or tool names in the site.
- A fact in a report is MEASURED (you ran it: give the command and the number), STATED (you read it somewhere) or UNKNOWN. Never call a thing good: say what was measured and what the picture shows.
- A fault of motion is judged on frames drawn in a row, never on single frames picked apart. Look at every picture yourself before you send it, at its real size where the thing is small.
- Before every push, one at a time, never two heavy jobs together (a sandbox that ran the suite, the bots and stills at once stopped answering and lost its work): the tests of your unit, then `npx tsc --noEmit -p .`. Before your last push: merge `origin/main`, then `npm run determinism`, `npm run bots`, the whole `npm test`, and `npx tsc --noEmit -p .` last. Where a check fails because the note cut the thing it checks, say so with the check's own line and what you did.
- One browser job at a time. Run a long job detached and poll it with short waits: `(set -m; ( <command>; echo "exit $?" ) > /tmp/job.log 2>&1 &)`.
- Commit and push your branch at least every 15 minutes, half done or not (a subject starting with `WIP:` is welcome). What is not pushed is lost. Never push to `main`, never force push, never rewrite history, never touch `parts/PARTS.json`. If a push fails, mail the Builder a git bundle of your branch.
- `git config user.name "Brandon Church"` and `git config user.email "200545962+BrandonChurch93@users.noreply.github.com"`. Every commit message, merges included (always give `-m`), ends with the trailer `Co-authored-by: Perplexity <noreply@perplexity.ai>` exactly once.
- Read the time with `date -u` before you write any time.
- Do not start agents of your own. Do not ask questions unless you are blocked: decide, write the decision in your notes, and carry on.

## How to look

- `npm run still -- --key <key> --format hd --tier draft` renders a key at 1920 by 1080 into `out/work/stills/` in a few seconds (`--force` renders again when nothing changed); `--page <page> --beat <beat> --at 0.5` renders any moment of the film, but never the middle of a page turn. The keys are listed in `config/showcase.json` under `stills`.
- `npm run sheet -- --beat <beat> --tier draft` lays twelve film frames across a beat on one sheet; `--every-frame` makes them consecutive frames. `npm run sheet -- --motion <event> --tier draft` lays twelve frames round an event of the film (`--nth K` takes the K-th, `--unit <page>` looks in one page). `npm run sheet -- --live --bot keen --step 1` (or `clumsy`, `random`, `skipper`; `--step N` for one step) lays twelve pictures of a bot's run of the live site: it is how you see what a visitor sees.
- `npm run bots` plays the whole live site with its four bots on every seed, without rendering, and fails when a run is stuck.

## Reports

A first short message 30 minutes after the start: what you read, how you will do each item, the events you will emit, the sounds and words you need, and anything in the note that cannot be done as written. A message at the first pass, pushed, with pictures. A last message at the limit. Each holds: branch and last commit; each item with what was done, MEASURED with its command, STATED or UNKNOWN; what is not done and why; decisions taken; the checks run with their numbers. Attach 1 to 4 pictures, each at most 1200 px on the long edge, as PNG or JPG files: frames in a row of the gag in the film and of a visitor doing it on the live site.

## Order

1. The shell unit's field contract, merged first.
2. Units merge as their first passes land: the Builder merges into `main`, runs the suite, publishes the site and shows Brandon in the next status.
3. The resume unit starts when step 1's stage flow is pushed.
4. When items 4 and 5 have landed, the video unit renders the real video and the joins are measured again at desktop and phone sizes.
5. Then the critic rounds on the whole site start again, on the new experience.
