# 00 · Read me first

Read `AGENTS.md` at the repo root before this file.

## Reading order

| File | What it settles |
| --- | --- |
| `config/showcase.json` | Every number, the units, the beats, the cameras, the keys, the sheets, the sounds |
| `content/copy.json` | Every word a page shows |
| `content/narration.json` | Every line the narrator speaks, and how it speaks |
| `kit/01-FILM.md` | The story beat by beat, the two ways it runs, the two cuts of the film, the sound bar, the card |
| `kit/02-SUBJECT.md` | The rule of the world, the materials, the cursor, every page, the pinball machine, the boss, the rules of the live site |
| `kit/03-METHOD.md` | How each part is made, and its fallback |
| `kit/04-LOOK.md` | The bar, the light, the lens, the grade, and the ladder of techniques to climb when a picture falls short |
| `kit/05-ARCHITECTURE.md` | Code structure, determinism, the stage and its drivers, modes, the harness, the clock, status, hosting, the local render |
| `kit/06-ASSETS.md` | The approved images, settled differences, generated and built assets, sounds, third-party sources |
| `kit/07-QUALITY-BAR.md` | Checks, critics, the pass bar, the table of limits |
| `kit/08-BUILD-ORDER.md` | The phases, the review stop, the budget report, and what ends the build |
| `kit/09-QA-GAUNTLET.md` | The final acceptance list |
| `kit/10-KICKOFF.md` | For Brandon. Not instructions for the Builder |
| `kit/PROGRESS.md` | The Builder's memory |
| `kit/addenda/` | Numbered changes made after the kit was written |
| `references/STATUS.md` | The record of the reference rounds: what was approved, what each image gets wrong, and what was rejected and why. Read "Rejected, and why" before Phase 2 and again before Phase 3 |

## When files disagree

| Topic | What wins |
| --- | --- |
| Any number, any id, any file path of an approved image | `config/showcase.json` |
| Any word on a page | `content/copy.json`. It beats every approved image and every kit file |
| Any word the narrator speaks | `content/narration.json` |
| How a picture should look | The approved image for that key or sheet, then `kit/04-LOOK.md` |
| A point listed under `settled` for a key or a sheet, or under `settledAll`, in the config | The kit. On that one point it beats the approved image |
| What a page holds, what an object is, how a gag goes, what the cursor may and may not do | `kit/02-SUBJECT.md` |
| The order of events and their timing | `kit/01-FILM.md` and `film.beats`. After the review, the kept takes of the narrator may move a beat inside its limits, and Brandon's notes decide the rest |
| How a part is made | `kit/03-METHOD.md`, unless the ladder in `kit/04-LOOK.md` has moved you to another technique |
| Whether something passes, and how many rounds it gets | `kit/07-QUALITY-BAR.md` |
| Code structure, the simulation and determinism | `kit/05-ARCHITECTURE.md` |
| When to stop, and how time is counted | `AGENTS.md` |
| A measurement of this workspace | Your own Phase 0 record, then `AGENTS.md` |

- An addendum beats every file above on its own topic. A higher number beats a lower one. A note from Brandon in the thread counts the same way.
- If a conflict is still open, pick the reading that gets the still closer to its approved image and keeps the page a real web page, and log the choice.

## Working protocol

1. Check stop condition 1 in `AGENTS.md`.
2. Read `kit/PROGRESS.md`, then every file in `kit/addenda/`.
3. Find the current phase in `kit/08-BUILD-ORDER.md`.
4. Re-read that phase's "Read first" files from disk.
5. Do the steps. Verify the gate with evidence, not with a feeling.
6. Log, commit, push, publish, post the status.
7. Go to the next phase without waiting, unless `AGENTS.md` says to stop.

## Vocabulary

| Word | Meaning |
| --- | --- |
| The site | The whole website: the careers page and the five steps of the application |
| Page | One screen of the site: the careers page, or one of the five steps |
| Step | One of the five pages of the application, numbered as the progress bar numbers them |
| The page surface | The ceramic slab that every page is. The camera looks straight down at it |
| Shell | What every step shares: the surface, the header, the progress bar, the heading, the subline |
| Control | A field, a button, a card, a row: a physical part a visitor can use |
| Layout tree | The one description of where every part of a page sits, in page pixels at 1920 by 1080. Geometry, type and the checks all read it |
| Page pixel | One pixel of a page seen from the `home` camera in `formats.hd` |
| The cursor | The hero: the white enamel arrow. Never "the pointer" |
| The pointer | The position the cursor is being asked to go to: the visitor's mouse in live mode, the script in film mode |
| Acting state | One of the cursor's states in `kit/02-SUBJECT.md`: confident, nervous, shocked, angry, scared, proud, exhausted |
| Damage | What a hit leaves on the cursor: a burn hole, strips, a flat body, a scorched tip. It heals |
| Gag | One thing a page does to the cursor: the turrets, the shuffling keys, the slabs, the shredder, each machine, each phase of the boss |
| Machine | One of the three contraptions of step 2: the dial, the slot machine, the crank |
| The table | The pinball machine, `table.name` |
| Playfield | The sloped board of the table, with its printed artwork under a clear coat |
| Standing part | Anything on the table that rises off the playfield: a bumper, a post, a ramp, a building, a target |
| Insert | A translucent window set flush in the playfield and lit from below |
| Light group | A set of the table's lamps that switch together: the general lighting, a flasher, a run of inserts |
| Director | The code that makes the pinball scene hit its story beats in order, in both modes |
| Take | For the table: one recorded run of the scene in film mode that hits every beat on time. For a sound or a picture: one generation |
| The boss | The Submit button after it tears loose, until it is beaten |
| Dart | The small glowing cursor the hero fires with each click during the boss fight |
| Slab | A heavy red block with an error message on it |
| Film mode | The site playing itself from a script. What the films record |
| Live mode | The site driven by a visitor |
| Driver | What moves the pointer and presses the button: the visitor's mouse, the film script, or a bot |
| Stage | The running site: its pages, its gags, its simulation and its cameras. Both modes run the same stage |
| Bot | A scripted visitor used to prove that every visitor can finish. `live.bots` names them |
| Unit | A piece of the build that gets its own critic rounds, from `units` in the config: the six pages, then `site`, then `film` |
| Beat | One timed gag inside a page, from `film.beats`. Times are seconds from the start of its page |
| Event | A moment the stage reports by name: a key press, a bolt hit, a bumper hit, a stamp. Sound and checks hang on events |
| Key | One entry of `keys` in the config: a still with an approved image as its target |
| Sheet | One entry of `sheets` in the config: an approved image that shows several states at once. The build renders the same states in the same arrangement |
| Approved image | An image in `references/approved/` |
| Settled difference | A point where the build differs from an approved image on purpose. `kit/06-ASSETS.md` has the rule |
| Still | One picture of one page in one state from one camera. Not a film frame |
| Judged still | A still on the fixed list the critics score |
| Frame | One output image of a film or of the card loop. Index 0 is the first |
| Film B | The film itself, with no opening. The `without-prompt` cut |
| Film A | Film B with the prompt opening in front of it. The `with-prompt` cut |
| Prompt opening | The typed prompt and the build screen that open film A |
| Narrator | The voice. Its lines are in `content/narration.json` |
| Line | One thing the narrator says |
| Cue | One sound effect, from `audio.sfx` |
| Variant | One of several kept versions of a cue that repeats, so ten key presses are not one sound ten times |
| Mix | The narrator, the effects and the room tone laid on the cut list as one sound file |
| Sound board | The part of the review page that plays every line and every cue on its own |
| Review cut | The whole film at a low tier with the mix, made for the review |
| Card loop | The seamless clip for the portfolio card |
| Stand-in | A placeholder for a part not built yet. Every system reports whether it is one |
| Part | One thing that is built and can be a stand-in. `kit/03-METHOD.md` lists them |
| Fallback | The technique from `kit/03-METHOD.md` that always works for a part, used when the planned one has not produced a finished part in time |
| Tier | A render quality level for computed pictures, from `tiers` in the config |
| Quality | A level of the live site on a visitor's machine, from `live.quality` in the config. Not a tier |
| Sample | One jittered sub-render. A computed picture is the average of its samples |
| Sim step | One step of the simulation, `sim.stepHz` of them a second |
| Asset set | A size class of textures from `assetSets` in the config: `web` is what ships, `full` is what the films and the judged stills use |
| Harness | The scripts in `tools/` that render pictures in a headless browser |
| Local render | The films and the loop rendered frame by frame on Brandon's computer, at `formats.master` |
| Look | Any picture someone rendered in order to look at it. The harness logs every one |
| Status | A short message with pictures in the task thread |
| Comparison image | A key's still beside its approved image, made by `npm run compare` |
| Machine check | An automated check on the code and the files. Red means a bug |
| Measure | An automated number on the picture or the motion. Red means a severe issue for the round, not a blocker |
| Deliverable check | An automated check on a file that takes long to make, run only at the end of the phases that name it |
| Gate | What has to be true before a phase ends. Listed at the end of each phase in `kit/08-BUILD-ORDER.md` |
| Critic | A fresh agent that scores files against a rubric |
| Listener | A fresh agent, or the audio evaluation tool, that answers fixed questions about a sound file |
| Round | One pass of build, checks, pack, critics, fixes |
| Floor round | A round that always happens: the first round of each unit, one blockout round, one round on the whole site, one film round, the record round |
| Extra round | Any other round. It starts only while its count and the clock allow |
| Review round | A bounded piece of work Brandon asks for while the review is open, with the line `Review notes.` |
| Open item | An issue still unresolved when a limit was reached |
| Probe | The page that measures frame rate on a real machine. Brandon may run it at the review stop |
