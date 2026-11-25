# References · what is approved, what is rejected, what is pending

Brandon approves pictures before anything is built. This file is the record. It is updated after every reference round.

Approved images are copied to `references/approved/` under the names the config uses. `MANIFEST.sha256` is written there when the set is complete. Until that file exists, and until `references.pendingRounds` in the config is empty, no build may start.

## Approved

Fifteen images. Brandon approved the first six on November 23 and 24, and the nine from round 5 on November 24. His words on round 5: probably the best we are going to get with image generation.

A key is a still the build has to match. A sheet is a picture of several states, matched state by state.

| File in `references/approved/` | Came from | Kind | What it settles |
| --- | --- | --- | --- |
| `page-look.png` | round 3, P1 | Sheet | Materials, color, type, the header and progress bar, the weight of the shadows, the straight-on view |
| `cursor-arms.png` | round 3, C1 | Sheet | Thin matte black rubber arms with small simple hands |
| `cursor-damage.png` | round 3, C4 | Sheet | Shredded, reassembled, scorched, punched, flattened |
| `cursor-acting.png` | round 4, E1 | Sheet | Sweat, the red tip and steam, the pale stony fear, the melted exhaustion, the burn hole |
| `machines.png` | round 4, D1 | Sheet | The look of the rotary dial, the slot machine and the hand crank. Also the clean lighting |
| `boss-stages.png` | round 5, B1 | Sheet | The Submit button becoming the boss, in four stages |
| `marketing-top.png` | round 5, M1 | Key `marketing-top` | The first screen of the careers page |
| `step1-fire.png` | round 5, K1 | Key `step1-fire` | Step 1 with the keyboard docked, the turrets up and bolts in flight |
| `step1-tug.png` | round 3, S1 | Key `step1-tug` | The shredder slot, the pose, the paper |
| `step2-rest.png` | round 5, D1 | Key `step2-rest` | Step 2 with three plain rows, closed |
| `step2-dial.png` | round 5, D2 | Key `step2-dial` | The Contact number row open, the rotary dial risen |
| `step2-crank.png` | round 5, D3 | Key `step2-crank` | The Audio volume row open, the crank and the meter |
| `boss-fight.png` | round 5, B2 | Key `boss-fight` | The fight: the boss, the health bar, the slabs, the darts |
| `boss-down.png` | round 5, B3 | Key `boss-down` | The beaten button lying outside its socket |
| `decision.png` | round 5, R1 | Key `decision` | The two-column rejection page |

### Where the build differs from these pictures on purpose

Image generation got some things wrong. Each one is a settled difference: on that point the kit wins and the picture does not. The lines live in the config, under `settledAll`, under each key's `settled`, and under each sheet's `settled`. `kit/06-ASSETS.md` has the rule.

| Image | What is wrong in it | What the build does |
| --- | --- | --- |
| All of them | The cursor is drawn at sizes from about 40 to 160 pixels | One size, from `cursor.heightPxAt1080` |
| All of them | Words are sometimes misspelled or punctuated wrongly. `boss-down.png` reads "I am not a rabot". `marketing-top.png` has mismatched quote marks | Every word comes from `content/copy.json` |
| `step2-rest.png`, `step2-dial.png`, `step2-crank.png` | A dark slab edge runs along the border of the frame | The page fills the frame evenly |
| `cursor-acting.png` and two rejected images | Bands of window light | Clean, even light |
| `step1-fire.png` | The bottom key row is cut off by the tray edge, with no lower rim. Three bolts are in flight | All five rows sit inside the tray. The number of bolts in flight is not fixed |
| `step1-tug.png` | It shows the round 3 page: old labels, a salary slider, a Submit button, no keyboard | The step 1 page, with the keyboard already slid away |
| `step2-dial.png` | The dial's numerals are wrong | 1 to 9 and then 0, in order |
| `step2-crank.png` | The input is empty | The input shows the level as a percentage |
| `boss-stages.png` | The cannon discs carry no numerals | They are the numbered buttons of the progress bar |
| `boss-fight.png` | A spark on the shield with no dart at it | Every spark has a dart |
| `boss-down.png` | The cursor stands upright. The button is scorched but not dented | The cursor sags. The button is dented too |
| `decision.png` | The stamp block is drawn in a three-quarter view. The cursor is cracked but not flat | The block is seen straight on. The cursor is flattened |
| `machines.png` | All three machines are open at once | One row is open at a time |
| `cursor-arms.png` | Photographed at an angle | It defines the arms, not the camera |

## Rejected, and why

Read this before generating or building anything. Each of these was tried.

| Round | What was tried | Why it failed | The rule that came out of it |
| --- | --- | --- | --- |
| 1 | An angled camera with depth of field on "a page made of physical objects" | It produced 3D renders of a scene, not a web page a person could use | Straight on, sharp edge to edge, a real layout. The realism lives in the controls, not in the camera |
| 2 | Four looks: tactile modern, paper and ink, dark premium, retro hardware | Modern had the right design and looked flat. Paper and ink looked real and was retro. Dark and retro were not wanted | The modern design, with what made paper and ink real: one strong key light, parts with real height, a surface with grain |
| 3 | The cursor changing into cursor hands, and a hybrid with a hand on an arm | They came out as white cartoon gloves with cuffs | Arms only, in black rubber, and only for the tug of war. No gloves |
| 3 | Aluminum and cast resin page surfaces | Aluminum was cold and heavy. Resin was the same as ceramic with less grain | The ceramic surface |
| 4 | A pinball table built out of the form's own parts, twice | Sparse and generic. Nothing like a machine in an arcade | A real arcade machine, crowded and themed, in its own palette |
| 4 | The keyboard page | The keyboard sat in the middle, one field was huge, the others were pushed below. The turrets fired beams. The keyboard had no Backspace or other normal keys | Layout first. A complete keyboard docked at the bottom. Bolts that can be dodged |
| 4 | All three machines on the page at once | No context for any of them | Plain fields first. Click one and its machine appears. Every field says why it is asking |
| 4 | The Submit button running away among decoys | Replaced by a better idea | The Submit button becomes a boss with a health bar |
| 4 | The rejection page: one line of text on a glass slab and a stamp | Empty and unbalanced. Not a good looking page | A full two-column page: the letter, the metrics, one button |
| 4 | Window light falling across the page in three images | Inconsistent, and it reads less like an interface | Clean, even light |
| Idea | Turning the cursor into a ball for the pinball scene | A ball cannot act | It stays an arrow and gets batted around as itself |
| Idea | Damage that stays on the cursor for the whole film | Brandon wants cartoon rules | Damage heals in seconds |
| Idea | A face or eyes on the cursor | Brandon said no | It acts with its body |
| Idea | A lie detector page | Hard to pull off | One checkbox on the Submit page carries the robot joke |

## Pending

| Round | Folder | Images | Becomes |
| --- | --- | --- | --- |
| 6, the pinball machine | `references/drafts/round-6/` | Twelve images, G1 to G12. The brief is `references/BRIEF-round-6.md`. The layout guides are in `references/guides/round-6/` | The keys for step 3, and a sheet for the clear ball |

What changed on November 24, from Brandon. It is in the brief and not yet in the kit:

- The arcade machine is scrapped. The bar is a pinball video game that has shipped. The machine is now a three-tier table, one screen to a tier, each with its own flippers and a centerpiece: Corporate at the top, the Office in the middle, the Street at the bottom. The ball is launched to the top and falls a tier at a time into the Unemployment Office. The format comes from a long line of tall, multi-tier pinball video games. The layout, the art and the theme are our own.
- The cursor is sealed inside a clear ball, and that ball is the pinball. This replaces the earlier ruling in the table above that it stays a bare arrow: inside a clear ball it can still be seen and can still act.
- The machine is built into a tall Step 3 page. There is no cabinet. The cursor is taken in at a loader port on the first screen.
- The camera pulls back to show the whole machine, pushes in on the part where the ball is, follows it, and rides above it on the wire ramp.

After Brandon approves round 6:

1. This file is updated.
2. `kit/01-FILM.md`, `kit/02-SUBJECT.md`, `kit/03-METHOD.md` and the config are brought into line with the changes above: the beats of step 3, the parts of the table, its cameras and its keys.
3. The approved images are copied to `references/approved/`, and the keys for step 3 in the config are set to match them and get their settled lines.
4. `references/approved/contact-sheet.jpg` and `references/approved/MANIFEST.sha256` are made.
5. `references.pendingRounds` in the config is emptied.
6. The kit is audited once more and the kickoff prompt is handed over.

## Not pictures, but still to approve

- The sound board: every effect and every narrator line, with its kept take. Brandon hears it at the review stop, before the films are cut.
- The narrator's lines in `content/narration.json`. A draft.
