# Round 12, unit `pinball`: the second round of step 3, the pinball machine

Judged commit: 7e7ddb05 (merge 31 on main at ee84463c, with round 11's records on top). Started 2026-11-26T09:20Z, the unit's second round of at most `quality.pinballMaxRounds` (5) and an extra round (the clock printed `extra rounds: yes` at 09:19Z). Machine checks on the merged tree before the push, 09:11Z to 09:17Z (MEASURED): type check clean, 1461 of 1461 tests in 115 files, build, bots all clear, paths all clear, each of the take's 10 beat events inside its beat. Packs: the stills of R1, R2, R3 and R8 were drawn at the final tier by eight render agents in their own VMs and put together 09:28Z to 09:29Z; the 478 film frames of R4 and R9 came in eight slices between 10:00Z and 10:22Z and those packs were put together at 10:23Z and 10:24Z. The critics on the stills were asked between 09:32Z and 09:39Z and answered between 09:34Z and 09:40Z; the critics of R4 and R9 were asked at 10:27Z and answered between 10:28Z and 10:30Z. The jury's 20 answers on the build came between 09:39Z and 09:42Z, none replaced; the ten controls are the same ten approved images as in round 11 (MEASURED: equal sha256, file by file), so their 50 votes are used again and are set out in `R2-2.json`. The measures ran at the final tier in a measuring agent's own VM from 09:20:48Z to 09:57:31Z. Keys released 11:20Z (`KEY-R1.json` to `KEY-R9.json`, the pack manifests as `PACK-*.json`, the measures as `MEASURES.json`).

## Scores

| Critic | What it saw | Model family | Score | Severe | Major | Minor |
|---|---|---|---|---|---|---|
| R1-1 | the key `loader-page`, the key `table-wide` and the sheet `clear-ball`, whole and in native crops, each beside the approved image | GPT | 5 | 3 | 15 | 0 |
| R1-2 | the keys `tier-corporate` and `lobby-doors` and the sheet `table-map`, whole and in native crops, each beside the approved image | Kimi | 5 | 1 | 10 | 3 |
| R1-3 | the keys `tier-office` and `reply-all`, whole and in native crops, each beside the approved image | GLM | 4 | 6 | 22 | 0 |
| R1-4 | the keys `tier-street` and `youre-fired`, whole and in native crops, each beside the approved image | Claude | 3 | 4 | 11 | 4 |
| R1-5 | the keys `rail-cam` and `last-save`, whole and in native crops, each beside the approved image | Kimi | 3 | 4 | 8 | 2 |
| R2 | jury on four stills of the build (the seal, the whole machine, the Corporate tier, the lobby doors), 5 answers each: 20 answers; the ten approved keys as controls with round 11's 50 votes used again | Kimi, GPT, Claude, GLM | does not pass by the rule | | 1, the failed jury | |
| R3-1 | surface and detail, the ten keys as the build draws them | GLM | 8 | 0 | 5 | 1 |
| R3-2 | surface and detail, the two sheets and the page at rest and scrolled, whole and in native crops | Claude | 6 | 1 | 4 | 3 |
| R3-3 | surface and detail, native crops of the ten keys | GPT | 7 | 0 | 6 | 0 |
| R4-1 | motion, one sheet of frames spread across each of the ten beats | Claude | 6 | 0 | 7 | 2 |
| R4-2 | motion, the way in, the way out, the page turn and five sheets of consecutive frames | GPT | 7 | 0 | 4 | 0 |
| R4-3 | motion, ten sheets of consecutive frames at hits on the arrow, 1:09 to 1:26 | Kimi | 4 | 3 | 6 | 1 |
| R4-4 | motion, ten sheets of consecutive frames at hits on the arrow and at the ball drop, 1:27 to 1:36 | GLM | 6 | 1 | 3 | 0 |
| R8-1 | the page as a web page, at rest, scrolled and in eight of the ten keys, no approved image beside them | Claude | 6 | 0 | 5 | 4 |
| R8-2 | the page as a web page, two keys and the text and controls at their real size | GLM | 8 | 0 | 2 | 0 |
| R9-1 | acting, one sheet a beat, read with no words | GPT | 6 | 0 | 5, and 5 "did not read" | 0 |
| R9-2 | acting, one sheet of each of the six states the page uses, read with no words | Kimi | 5 | 0 | 4, and 5 "did not read" | 2 |

Together: 23 severe, 128 major with the failed jury as one, 22 minor. Ten of the major issues are reads that R9 did not make, added by the Builder.

Measures on 7e7ddb05 at the final tier (MEASURED 09:20:48Z to 09:57:31Z): 8 green, 2 red. Red: M3, the least ratio of fine detail to the approved image over the unit's ten keys, 0.467 (`tier-corporate`) against at least 0.8; under it too are `youre-fired` 0.4942, `rail-cam` 0.6732, `tier-office` 0.6859, `tier-street` 0.7485 and `reply-all` 0.7667. `lobby-doors`, round 11's lowest at 0.3539, is no longer among the keys under 0.8. Red: M4, type: of 256 runs of type in 11 stills the least contrast is 1.3, the firehouse sign "You're Fired"; "THE DAILY GRIND" stands at 1.68 and "Corporate HQ" at 4.25, all against at least 4.5; the smallest type is 16 px against at least 14. Green: M1, M2 (14 stills, 6262450 textured pixels, largest soft share 0.0008), M5, M6 (the furthest 3.43 px from its size, of 6), M7 (2520 frames read, 22 events strike the cursor, each answered), M8 (Corporate 27 parts and 0.0275 bare, Office 26 and 0.0107, Street 31 and 0.008), M9, M10 (63 openings, the narrowest 1.25 balls). G13 and G15 on the unit were not run in this round.

Not passed. The pass is 9 from every critic with no severe or major issue open, and R2 by its rule. The lowest score is 3 (R1-4, R1-5).

## The 23 severe issues

Each in the critic's own words, with the picture it is on.

1. R1-1 issue 1, key `table-wide`: "Broad, flat gray metal faces and boxy tier dividers dominate the build, interrupting a view that reads as one continuous dark teal, warmly lit miniature in the target. The rails and inserts are isolated points of light rather than a coherent field of reflections."
2. R1-1 issue 2, sheet `clear-ball`: "The arrow reads as another straight, hard, mostly matte pointer; the target is visibly warped and pinched, with an irregular glossy face and heavy dark edge."
3. R1-1 issue 3, sheet `clear-ball`: "The spheres read as clear graphic outlines with repeated rims, over relatively flat and sparsely reflected surfaces. The target has deep curved refraction, dense warm light reflections, tangible ball-to-table contact and a soft photographic falloff."
4. R1-2 issue 1, key `tier-corporate`: "-b is a strictly flat top-down shot; -a is a near-vertical but clearly oblique shot in which the tower, the lift tube, the Retirement box and the flippers rise off the playfield with visible sides, so the two do not read as the same table photographed twice"
5. R1-3 issue 1, key `tier-office`: "The build looks almost straight down, flattening the front faces of the office props and bumpers into a diagram. The target is an oblique tabletop photograph looking toward the back wall."
6. R1-3 issue 2, key `reply-all`: "The more oblique build is still framed closer and higher over the active field: the left elbow and outer rails are cut away and the foreground shoulder construction falls out of frame. The target shows the table perimeter wrapping around the scene."
7. R1-3 issue 3, key `tier-office`: "Cool, hard-edged shadows and muted, synthetic surfaces dominate the build. The target has warm pinball-light reflections, luminous underside trims and softer, more naturally graduated shadows falling largely down and right."
8. R1-3 issue 4, key `reply-all`: "The target reads as warm, deep and reflective; the build is cooler and flatter, with long dark shadows around the top row and almost no warm reflected light beneath the main mechanisms."
9. R1-3 issue 5, key `reply-all`: "The three balls look cloudy, silvery gray and nearly translucent, and carry the same conspicuous white halo pattern. The target's are dark, opaque, mirror-polished steel with sharp warm, teal and blue reflections and a strong grounded contact."
10. R1-3 issue 6, key `tier-office`: "The flippers point in almost the same direction, breaking the shallow mirrored V that immediately defines the target's playfield."
11. R1-4 issue 1, key `youre-fired`: "the cabinet walls behind are bright pale grey-white and evenly lit, so the close view reads as a daylit showroom; -a is a dark night scene where only the beacon, windows and door glow"
12. R1-4 issue 2, key `tier-street`: "the camera looks straight down, flat and orthographic, so every building shows only its roof and the page reads as a plan drawing; -a is a low oblique view in perspective where the brick and stone facades, windows and doors of each building are seen"
13. R1-4 issue 3, key `tier-street`: "the garage is a large round drum with spokes like a bicycle wheel, seen from above, covering the police station's front; -a has a stacked clear-plastic spiral ramp on grey posts standing beside the police station"
14. R1-4 issue 4, key `youre-fired`: "the page is matte with fine blueprint lines; -a's floor is dark glossy, wet-looking tiles with strong red and warm reflections spilling from the door and beacon"
15. R1-5 issue 1, key `rail-cam`: "the approved still is a warm night city: deep teal glossy streets, warm lamp glow, dark mood; the build is a bright, cool, grey daylight scene with flat pale ambience and no warm pools of light"
16. R1-5 issue 2, key `rail-cam`: "the build's background is a spiral glass tower, a hazard-striped yellow wedge and bare grey railings where the approved still has the columned bank and the red firehouse on dark reflective streets"
17. R1-5 issue 3, key `rail-cam`, crops: "under matching labels the build shows a yellow hazard wedge for 'the bank' and a glass bubble with wireframe for 'the firehouse'; the approved crops show the lit columned bank and the red firehouse"
18. R1-5 issue 4, key `last-save`: "the approved key is a dark, warm night table with glowing lamps and mirror-gloss streets; the build is a bright, flat, cool-grey daylight render with dim lamps and little reflection"
19. R3-2 issue 1, picture `step3-result`: "the pointer is a lumpy, melted white shape like a glove or a hand, with a broken outline and no clean arrow form. It reads as a hand on the button and gives the render away at once"
20. R4-3 issue 1, the sheet of consecutive frames at 1:26.02 (hit on the arrow): "the ball arrives at speed, then parks and balances on the sloped edge of a raised dome for a quarter of a second; a steel ball would roll off or drop in, so it reads as placed by hand, not loose in a machine"
21. R4-3 issue 2, the sheet of consecutive frames at 1:21.93 (hit on the arrow): "the ball strikes the bumper and bounces, but the bumper does nothing at the contact frame: no flash, no pop, no movement inside the lamp; only one thing reacts to a hit that should move both, and the three frames after the ball leaves are dead stills"
22. R4-3 issue 3, the sheet of consecutive frames at 1:26.02 (hit on the arrow): "the ball's fastest arrival in the set meets an inert target and a flipper that never fires; nothing answers the impact, so the climax of the sheet lands flat"
23. R4-4 issue 1, the sheet of consecutive frames at 1:27.87 (ball-drop): "The clear arrow ball pulls away while several evenly spaced pale ball-shaped copies follow it. They read as solid duplicate balls, not one steel-speed roll, and it's unclear which ball is making contact."

What the 23 say together. Eighteen are R1's, on pictures beside their approved images, and they are of five kinds. The cameras, four: the three tier views read as plans where the approved tier images look down at a slant (R1-2 issue 1, R1-3 issue 1, R1-4 issue 2, declined as in round 11), and Reply All is framed closer and higher than approved (R1-3 issue 2). The light, seven: the build reads as a bright, cool, grey daylight scene where approved is a warm night table with glowing lamps and mirror gloss (R1-1 issue 1, R1-3 issues 3 and 4, R1-4 issues 1 and 4, R1-5 issues 1 and 4). The ball and the arrow in it, three (R1-1 issues 2 and 3, R1-3 issue 5). Single parts, two: the garage read as a drum with spokes (R1-4 issue 3) and the two flippers of the Office tier pointing the same way (R1-3 issue 6). The city behind the rail camera, two, which follows the build's layout by a settled line (R1-5 issues 2 and 3, declined). One is R3-2's: the arrow on Continue at the end of the page reads as a lumpy, melted hand. Four are of the motion: the ball parks on the slope of a dome for a quarter of a second (R4-3 issue 1), a bumper and a target do nothing on the frame of contact (R4-3 issues 2 and 3), and pale copies follow the ball at the Coffee socket (R4-4 issue 1).

## R2, the jury

Judged: seal from `home` d d d d d; reveal from `table-wide` c d c c c; lobby from `tier-3` d d c d d; lobby from `table-lobby` c d d d c. Controls, the approved images, with round 11's votes: `loader-page` c d c d c; `table-wide` c a c c b; `tier-corporate` a c a b a; `lobby-doors` b c b a b; `tier-office` b b a b c; `reply-all` b a b c c; `tier-street` a b a b a; `youre-fired` b b b a b; `rail-cam` c b a b b; `last-save` b a b a b. The share of (a) and (b) is 0 of 20 on the judged pictures against 36 of 50 on the controls, 0 against 0.72, and the judged share is lower than the control share less `quality.jury.maxShareGap` (0.2), so R2 does not pass. In round 11 the build had 1 of 20. Per picture: the loader page reads as a web demo to 5 of 5; the whole machine as a product render to 4 and as a web demo to 1; the Corporate tier from straight above as a web demo to 4 and as a product render to 1; the lobby doors as a web demo to 3 and as a product render to 2. What the jurors named most: the page's own text and numbered row on the loader page; the machine alone on plain black, lit evenly; the arrow in the ball read as a mouse pointer drawn into the scene; simple, even shading and flat printed marks.

## R9, the reads against what the beats mean

Five of the ten beats read as meant (the seal, the launch, the firehouse, the highway, the drain) and one of the six states (plain). In round 11 the five were the seal, the reveal, Reply All, the firehouse and the highway. Each miss is added to its card as a major issue by the Builder, in these words:

- R9-1 issue 6, `set-A-02`: the travel from the tube into the machine is read; that the page's light goes down to dusk, the marquee lights and the three tiers light in a wave, lamp by lamp, until the whole machine stands in the frame is not: the read is of a ball carried along, with no feeling and no event.
- R9-1 issue 7, `set-A-04`: the hope at the Corporate HQ doors is read; that the doors slam, that the ball hits them and that the arrow is pressed flat against the inside of the glass is not: the read goes from hopeful to being sent down to the next field.
- R9-1 issue 8, `set-A-05`: the battering is read; that the three coffee bumpers rattle the ball between them and that the arrow is thrown flat on each hit is not: the read has flippers batting it and says that the single reactions are hard to read.
- R9-1 issue 9, `set-A-06`: that balls like it spill out is read; that it lands in the inbox, that the steel balls chase it and hit it and that the whole tier strobes is not: the read has it seat itself at the coffee station and spring away.
- R9-1 issue 10, `set-A-09`: the read is of a woozy, battered arrow that crumples at the right flipper and is knocked across the field again. The fall toward the gap, the catch at the last instant and the sag of relief are not in the read.
- R9-2 issue 7, `set-B-02`: nervous reads as frightened and overwhelmed by what the port does to it. Beads of sweat, the small tremble and the gulp are not in the read.
- R9-2 issue 8, `set-B-03`: scared reads as calm and passive, riding upright and reacting to nothing. Pale and stony, the lean back and the hiding are not in the read.
- R9-2 issue 9, `set-B-04`: shocked reads as panicked and jostled, which is what the bumpers and the stapler do to the ball. The double take, the stretch tall and the snap back are not in the read.
- R9-2 issue 10, `set-B-05`: confident reads as tense but mostly passive. Upright with a slight bounce and a strut is not in the read.
- R9-2 issue 11, `set-B-06`: exhausted reads as dazed and batted around. The sag, the melt at the edges and the slump are not in the read.

The two acting critics' own issues say why: the arrow is lost among the reflections and rings of the glass on the wide views, it holds one upright pose while the ball and the background move (on the lane, on the spiral, after each flipper hit), and a hit moves the ball without a squash, a jolt or a held pose in the arrow.

## Declined

Logged under "Declined issues" in `kit/PROGRESS.md`, each with the critic's words:

1. R1-2 issue 1, severe, key `tier-corporate`. Declined: the tier cameras stay straight down, as ruled at 00:37Z and declined in round 11. `kit/03-METHOD.md`, "The cameras", makes each tier camera the `home` camera moved down the page to its tier, looking straight down with one pixel of the floor on one screen pixel, `kit/08-BUILD-ORDER.md` says the tier cameras are not fitted, and it is Brandon's stated choice that every page is seen straight on. The models must read from straight above, and that half stays open with their owners. The question is under "For Brandon to decide".
2. R1-3 issue 1, severe, key `tier-office`. Declined: the tier cameras stay straight down, as for R1-2 issue 1.
3. R1-4 issue 2, severe, key `tier-street`. Declined: the tier cameras stay straight down, as for R1-2 issue 1.
4. R1-5 issue 2, severe, key `rail-cam`. Declined: it repeats a settled line of `rail-cam` in `config/showcase.json`: "Which buildings pass below the ramp, and on which side, follows the layout of tier-street and not this image." The light and the gloss of the streets under the rail are not declined and are R1-5 issue 1.
5. R1-5 issue 3, severe, key `rail-cam`, crops. Declined: the same settled line of `rail-cam` as for R1-5 issue 2: the crops named for the bank and the firehouse show what stands at those places in the build's layout.
6. R1-5 issue 9, major, key `last-save`. Declined: it repeats a settled line of `table-wide`: "The image carries words only on the marquee and the drain plate. The build carries every sign." The display and the apron card are signs the build carries with words from `content/copy.json`.
7. R1-5 issue 11, major, key `last-save`, crops. Declined: the same settled line of `table-wide` as for R1-5 issue 9; the pairing of the build's apron card with the image's drain plate in the crop list is listed for Brandon.
8. R1-4 issue 15, major, key `tier-street`, as far as it asks for the text on the apron to go. Declined: the same settled line of `table-wide` as for R1-5 issue 9. The warmth of the apron and its insets stay open with the frame's owner.
9. R8-1 issue 1, major, picture `rest-step3`, as to its fix. Declined: `content/copy.json` has no "Begin assessment" and no line that tells the visitor to place the cursor in the port, and no word is on a page that is not in it (Brandon's choice: his own words, exactly). The issue itself is not declined: the first screen must show where to go with the words it has, and that is open with the page's owner.
10. R8-1 issue 2, major, picture `step3-result`, as far as it asks for a label. Declined: the same ground as R8-1 issue 1: neither "Specimen received" nor an applicant number is in `content/copy.json`. The frame of the plaque and its left edge against the results panel stay open.
11. R8-1 issue 4, major, picture `step3-result`, as far as it asks for the words "Step 3 · Result" or a label on the second port. Declined: the same ground as R8-1 issue 1. How the second port reads as the way out stays open with the page's owner.

Not declined, and the Builder's: R3-2 issue 1 (the arrow on Continue at the end of the page), which is the flat arrow of the page turn and is with the shared look's owner since 11:09Z.

## Where the issues went

Every issue went to its owner word for word.

- The still cards (R1, R3, R8) went to the owners of the parts as each came, 09:34Z to 09:40Z, and again whole to the six successors that started at 10:02Z, in their briefs: `machine_finisher` (cameras, layout, physics, the page's own screens), `frame_finisher` (the cabinet, the hardware, the parts in play), `lamp_finisher` (the lamps, the floor art, the two red measures), `ball_finisher` (the glass, the arrow in it, the displays), and for their own units `step2_finisher` and `boss_finisher`.
- The 38 motion and acting issues of R4 and R9 went to the four agents of the machine in one message at 10:31Z, with who takes which (the entry of 10:31Z in the decision log): `machine_finisher` the physics, the director, the take, the cameras, the cuts and the acting in the ball; `lamp_finisher` how a lamp answers a hit; `frame_finisher` the bumper's cap and the target on the frame of contact, a gate at the You're Fired seat and the steel balls of the Coffee release; `ball_finisher` the ball's shape through a hit and how the arrow reads through the glass.
- The models of the three floors: the issues that name the Street tier went to `street_finisher`, those that name the Corporate and Office tiers to `corporate_finisher`, in their briefs at 11:09Z.
- The issues that name the shared look and the cursor's own model (the shell that forms and breaks at the port, the arrow on Continue) went to `look_finisher` in its brief at 11:09Z.
- The ten reads that R9 did not make went to `machine_finisher` and `ball_finisher` when the round closed.
- For Brandon, in the review block: the tier cameras straight down; the three floors stepping down inside tall walls; the crop that pairs the build's apron card with the image's drain plate; the length of the shadows (`look.shadowHeights.keep`).

## What comes next for the unit

Round 15, the unit's third round of at most `quality.pinballMaxRounds` (5), starts after the last merge of the ten build agents' work (their limit is 13:02Z) and before 13:32Z. The controls' 50 votes of round 11 are used again, so its jury asks 20 jurors.
