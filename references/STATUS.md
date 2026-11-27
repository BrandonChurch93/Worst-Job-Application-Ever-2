# References · what is approved, what is rejected, what is pending

Brandon approves pictures before anything is built. This file is the record. It is updated after every reference round.

Approved images are copied to `references/approved/` under the names the config uses. `MANIFEST.sha256` is written there when the set is complete. Until that file exists, and until `references.pendingRounds` in the config is empty, no build may start.

## Approved

Twenty-seven images. Brandon approved the first six on November 23 and 24 and the nine from round 5 on November 24. His words on round 5: probably the best we are going to get with image generation. On a second look that evening he found them still a bit wonky: the keyboard goes into the page where it should stand out of it, and sizes change from image to image. He did not want more images made. Those points are settled in writing below. The twelve from round 6, the pinball machine, came in that night. He left the calls on them to the planning chat, and all twelve are approved as the target for step 3.

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
| `loader-page.png` | round 6, G6 | Key `loader-page` | The first screen of step 3: the loader port, the ball in it, the feed tube |
| `table-wide.png` | round 6, G1 | Key `table-wide` | The whole machine from the player's end: three tiers, the marquee, the frame, the dark round it |
| `tier-corporate.png` | round 6, G3 | Key `tier-corporate` | Tier 3 as one screen of the game |
| `tier-office.png` | round 6, G4 | Key `tier-office` | Tier 2 as one screen of the game |
| `tier-street.png` | round 6, G5 | Key `tier-street` | Tier 1 as one screen of the game |
| `lobby-doors.png` | round 6, G9 | Key `lobby-doors` | The doors of Corporate HQ, the carpet, the ball |
| `reply-all.png` | round 6, G10 | Key `reply-all` | Steel balls pouring out of the inbox |
| `youre-fired.png` | round 6, G11 | Key `youre-fired` | The firehouse scoop and its beacon |
| `rail-cam.png` | round 6, G8 | Key `rail-cam` | The camera riding above the ball on the highway. Also what a wire ramp is |
| `last-save.png` | round 6, G12 | Key `last-save` | The bottom flippers, the save and the drain |
| `clear-ball.png` | round 6, G7 | Sheet | The clear ball with the cursor in it, in three states |
| `table-map.png` | round 6, G2 | Sheet | The whole machine from straight above: where everything is |

### Where the build differs from these pictures on purpose

Image generation got some things wrong. Each one is a settled difference: on that point the kit wins and the picture does not. The lines live in the config, under `settledAll`, under `settledUnit` for a whole unit, under each key's `settled`, and under each sheet's `settled`. `kit/06-ASSETS.md` has the rule.

| Image | What is wrong in it | What the build does |
| --- | --- | --- |
| All of them | The cursor is drawn at sizes from about 40 to 160 pixels | One size, from `cursor.heightPxAt1080` |
| All of them | Words are sometimes misspelled or punctuated wrongly. `boss-down.png` reads "I am not a rabot". `marketing-top.png` has mismatched quote marks | Every word comes from `content/copy.json` |
| `step2-rest.png`, `step2-dial.png`, `step2-crank.png` | A dark slab edge runs along the border of the frame | The page fills the frame evenly |
| `cursor-acting.png` and two rejected images | Bands of window light | Clean, even light |
| All of them | The same part is drawn at different sizes and heights from image to image | Every size and height is a number in `scale` or in a layout tree. None is taken from an image |
| `step1-fire.png` | The keyboard is sunk in a well, with each turret in a well of its own. The bottom key row is cut off. Three bolts are in flight | The keyboard stands above the page on a deck, with the turrets rising from the ends of the deck. All five rows are on it. The number of bolts in flight is not fixed |
| `step1-tug.png` | It shows the round 3 page: old labels, a salary slider, a Submit button, no keyboard | The step 1 page, with the keyboard already slid away |
| `step2-dial.png` | The dial's numerals are wrong | 1 to 9 and then 0, in order |
| `step2-crank.png` | The input is empty | The input shows the level as a percentage |
| `boss-stages.png` | The cannon discs carry no numerals | They are the numbered buttons of the progress bar |
| `boss-fight.png` | A spark on the shield with no dart at it | Every spark has a dart |
| `boss-down.png` | The cursor stands upright. The button is scorched but not dented | The cursor sags. The button is dented too |
| `decision.png` | The stamp block is drawn in a three-quarter view. The cursor is cracked but not flat | The block is seen straight on. The cursor is flattened |
| `machines.png` | All three machines are open at once | One row is open at a time |
| `cursor-arms.png` | Photographed at an angle | It defines the arms, not the camera |
| Every pinball image | The ball is drawn larger and the cursor in it smaller than they are | The ball is `table.ballPx` across in a tier view and the cursor's length is `table.cursorInBallFraction` of that |
| Every pinball image with the lift | The lift tube is closed at both ends | It is open at each orange door and each elbow, and it carries a ball up one tier |
| The tier and close views | No score display anywhere but the marquee | Every tier has a display in its lower right shoulder |
| The tier and close views | Signs lie flat on roofs in some and stand on the roof edge in others. Some lane arrows point against the ball | A sign stands on the front edge of its roof, tilted back. Arrows point the way the ball travels |
| `tier-street.png`, `table-map.png` | The highway is a handrail on posts. The garage spiral is too tight for a ball. The plunger is inside the frame. One hat on the third insert | The highway is the track of `rail-cam.png`, with a way on and a way off. Every turn of the spiral clears a ball. The plunger's knob stands outside the rail. Three hats |
| `tier-corporate.png` | The lobby doors are shut. The clipboard insert has ruled lines | The doors stand open until the ball reaches them. A clipboard with one tick |
| `tier-office.png` | A blank card in the lower right shoulder | The tier's display is there |
| `lobby-doors.png` | The revolving door stands beside the carpet | It stands on the carpet, as in the tier view |
| `rail-cam.png` | The buildings below are not where the tier view has them | The tier view's layout wins |
| `table-wide.png` | No feed tube at the plunger. Words only on the marquee and the drain plate | The feed tube ends at the plunger. Every sign is there |
| `loader-page.png` | Grey bars for text. The ball about 126 pixels across. A smaller header. Seams across the lower part | The real text. The ball at `table.ballPx`. The shared header. No seams |

## Approved by change note 002

Change note 002 (2026-11-27) reopened the look of the careers page and of the boss. Its item 16 says of the careers page: "His pick becomes the approved picture the page is built and judged against."

| File in `references/approved-002/` | Came from | Kind | What it settles |
| --- | --- | --- | --- |
| `careers-page.png` | round 7, PAGE B, the entire page (five takes joined in code), 1920 by 5357 | Sheet, top to bottom | The careers page as a flat white company website: navigation, hero, awards, ticker, benefits, quotes, questions, comparison, the five steps, the closing call, the footer |
| `careers-top.png` | the top 1920 by 1080 of the same picture | Key `marketing-top` from now on | The first screen of the site |

Brandon approved it in the thread on 2026-11-27, about 2:27 PM MT. His words: "Marketing site mock up looks great. I love it replace the first screen with the marketing site upon clicking apply on the marketing site it essentially takes you to the first step."

The two files stand in a folder of their own because `references/approved/` and its `MANIFEST.sha256` are checked by a test and listed in the config, which only Brandon changes. `references/approved/marketing-top.png` stays where it is and is no longer the target of the careers page.

Where the build differs from this picture on purpose: the heading sizes differ from section to section in the picture and the build has one type scale; the letters of the benefits section are narrower in the picture and the build has one typeface; a faint second copy of the hero's glow lies across the second join and the build has one glow; the arrow in the picture is larger and softer than the approved cursor and the build keeps its own; every word comes from `content/copy.json`.

For the boss, the same message picks a direction and approves no picture yet: "At the arena in Boss options boss six looks like the best arena. I'm not sold on any of the bosses though. I think we need to go back to the drawing board and regenerate what that Boss looks like. He's also a bit big. He takes up a lot of the screen his health bar is being covered up in the images that you shown. I also think we should remove the top part. The whole screen should kinda changed to be like a video game. The only thing up top should be the bosses health bar." BOSS 6 is `references/drafts/round-7b/BOSS-6.png`. Round 9 follows it.

## Rejected, and why

Read this before generating or building anything. Each of these was tried.

| Round | What was tried | Why it failed | The rule that came out of it |
| --- | --- | --- | --- |
| 1 | An angled camera with depth of field on "a page made of physical objects" | It produced 3D renders of a scene, not a web page a person could use | Straight on, sharp edge to edge, a real layout. The realism lives in the controls, not in the camera |
| 2 | Four looks: tactile modern, paper and ink, dark premium, retro hardware | Modern had the right design and looked flat. Paper and ink looked real and was retro. Dark and retro were not wanted | The modern design, with what made paper and ink real: one strong key light, parts with real height, a surface with grain |
| 3 | The cursor changing into cursor hands, and a hybrid with a hand on an arm | They came out as white cartoon gloves with cuffs | Arms only, in black rubber, and only for the tug of war. No gloves |
| 3 | Aluminum and cast resin page surfaces | Aluminum was cold and heavy. Resin was the same as ceramic with less grain | The ceramic surface |
| 4 | A pinball table built out of the form's own parts, twice | Sparse and generic. Nothing like a machine in an arcade | A crowded, themed machine in its own palette |
| Idea, before round 6 | A real arcade cabinet rising out of the page | Brandon: it looked like something that would not exist within a web application. He was not sold on a second version built into a tall page either | The bar is a pinball video game that has shipped. A three-tier table set into the page, one screen to a tier |
| 4 | The keyboard page | The keyboard sat in the middle, one field was huge, the others were pushed below. The turrets fired beams. The keyboard had no Backspace or other normal keys | Layout first. A complete keyboard docked at the bottom. Bolts that can be dodged |
| 4 | All three machines on the page at once | No context for any of them | Plain fields first. Click one and its machine appears. Every field says why it is asking |
| 4 | The Submit button running away among decoys | Replaced by a better idea | The Submit button becomes a boss with a health bar |
| 4 | The rejection page: one line of text on a glass slab and a stamp | Empty and unbalanced. Not a good looking page | A full two-column page: the letter, the metrics, one button |
| 4 | Window light falling across the page in three images | Inconsistent, and it reads less like an interface | Clean, even light |
| Idea | Turning the cursor into a ball for the pinball scene | A ball cannot act | It stays an arrow. Brandon's later idea keeps that and solves the scale: the arrow is sealed in a clear ball, where it can still be seen and can still act |
| Idea | Damage that stays on the cursor for the whole film | Brandon wants cartoon rules | Damage heals in seconds |
| Idea | A face or eyes on the cursor | Brandon said no | It acts with its body |
| Idea | A lie detector page | Hard to pull off | One checkbox on the Submit page carries the robot joke |
| 7 | Four looks of the careers page as a real website (PAGE A to D) and six worlds for the boss and its arena (BOSS A to F), each asked for as a clearly different world with real depth. Ten first takes were made; they stay under `references/drafts/round-7/` | Brandon, on the first look: "the output trash they're all like hyper 3-D. They don't look like something on the application at all." Partner: the fault was in the brief, which never locked the pictures to the look of the site | Every reference starts from a real 1920x1080 screenshot of the build and must pass as a screenshot of this site beside a real one: straight on, flat to the screen, the same materials, light and type, the header and rail, the cursor at its real size. Depth is relief and shadow, the way the pinball machine has it. No camera angle, no room in perspective, no concept-art light, no photographs (Partner's reading of his words, mail of 2026-11-27) |

## Round 6, and what its blind judge said

Round 6 made twelve images of the pinball machine from `references/BRIEF-round-6.md`. Its notes are `references/drafts/round-6/NOTES.md`.

- No image passed the round's blind judge, and all twelve are approved anyway. The judge was asked two things: what kind of picture is this, and what in it could not work. Every judge named things a ball could not do: a lift closed at both ends, a ramp with no way on, a spiral too tight, nothing to carry a ball back up. Image generation cannot draw a path that works. The build can, and "Ball paths" in `kit/02-SUBJECT.md` is the rule it follows.
- Most judges gave the missing score display as their reason for not calling a tier a game screenshot. The build puts a display on every tier.
- Judges of eight of the twelve used the word miniature. `kit/04-LOOK.md` has a ladder for that.
- The same picture got different first answers from different fresh judges when only a small patch had changed, so that answer is not a steady measure. The faults they named were steady.
- For finish, fullness, light and theme, these are the strongest images of the project. That is what they are the target for.

## Pending

Nothing. Every reference round is closed and `references.pendingRounds` in the config is empty.

Since 2026-11-27, by change note 002 and Partner's mail of that day for Brandon: round 7b, a redo of the rejected round 7 with locks. BOSS 1 to BOSS 6 (the boss and its arena) and PAGE 1 to PAGE 4 (the careers page as a real website, first screens only), every image made from a real screenshot of the build. Drafts go under `references/drafts/round-7b/`. Nothing from it is approved or built until Brandon picks. The config's list is a number of the kit and is not changed by the Builder. Made on 2026-11-27 and delivered to Brandon with Status 169 (about 1:58 PM MT): ten images, one take each, none retaken, every lock holding by the Builder's look; the sheets and one line per code are in `references/drafts/round-7b/NOTES.md`. Before it was delivered, Brandon wrote in the thread (about 1:49 PM MT), having seen round 7's first look: for the careers page "page B looks the best to me. I'd like to see you generate the entire page of what the marketing site is going to look like with that design"; for the boss, none of round 7's, but "a top down arena similar to what it looks like now as far as the camera angle, but an actual arena that we fight in with a 3-D environment that is breakable when the Boss fires his big Canon", and "a couple images of what the new boss will look like", made apart from the arena. So: round 7's PAGE B is his pick of a direction for the careers page; its entire page is `references/drafts/round-7/PAGE-B-full-page.png` (five takes joined in code), delivered with Status 169 and waiting for his yes, on which it becomes the approved picture the careers page is built and judged against. Round 7b's PAGE 1 to PAGE 4 are overtaken by that pick. Round 7b's BOSS 1 to BOSS 6 went to him as a first answer made before his message. The next pictures are ARENA 1 to ARENA 4 (the arena from above, whole and then broken by the cannon) and LOOK 1 to LOOK 4 (the new boss alone), drafts under `references/drafts/round-8/`. Nothing is approved or built until he says so. Round 8 was made on 2026-11-27 and delivered to Brandon with Status 170 (about 2:42 PM MT): sixteen pictures. ARENA 1 to ARENA 4, each whole and then after the cannon, seen from above; LOOK 1 to LOOK 4, each from above and from the side. Three arenas were retaken once and one side view twice, each for a broken lock or a view that did not agree with its pair, none for taste; the faults that remain, the inputs and one line per code are in `references/drafts/round-8/NOTES.md`. He picks an arena and a boss by code and may mix.

Brandon answered round 8 in the thread on 2026-11-27, about 2:47 PM MT: "I think my favorite is like one." LOOK 1, the walker, is his pick for the boss; it is a direction and no picture of it is approved yet. In the same message: the big turret rises once the body is fully formed, the word Submit is not moved, the guns fire bullets the visitor dodges, and of the arenas "None of the arenas you gave me actually look good", so ARENA 1 to ARENA 4 of round 8 are not picked and that set is closed. Round 9 was made to those words on 2026-11-27 and delivered with Status 171 (about 3:10 PM MT): ARENA 5 to ARENA 8, each in the fight and after the big cannon, made from BOSS 6 with the top of the page removed, and LOOK 1 in three states (turret inside, turret out, beaten). Seventeen calls, five retakes for broken locks or broken text, none for taste. Drafts, the inputs, the faults that remain and one line per code are in `references/drafts/round-9/NOTES.md`. Nothing from it is approved or built until he picks.

## Not pictures, but still to approve

- The sound board: every effect and every narrator line, with its kept take. Brandon hears it at the review stop, before the films are cut.
- The narrator's lines in `content/narration.json`. A draft.
