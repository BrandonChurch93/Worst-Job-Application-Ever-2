# Round 14, unit `boss`: the second round of step 4, the boss fight

Judged commit: cfd83123 (merge 32, whose code is that of 01a231e3, with Status 78's records on top). Started 2026-11-26T10:03Z, the unit's second round of at most `quality.maxRoundsPerUnit` (3) and an extra round (the clock printed `extra rounds: yes` at 10:06Z). Machine checks on 01a231e3, 09:43Z to 09:49Z (MEASURED): type check clean, 1461 of 1461 tests in 115 files, build, bots all clear, paths all clear, each of the take's 10 beat events inside its beat and no hit within 0.15 s of a cut. Packs: the stills of R1, R2, R3 and R8 were drawn at the final tier by two render agents in their own VMs, every file that both drew byte equal, and put together 10:09Z to 10:11Z; the 494 film frames of R4 and R9 were taken by 10:45Z (three not byte equal between the two VMs, the entry of 10:45Z) and those packs were put together from 10:45Z. The critics on the stills were asked between 10:17Z and 10:24Z and answered between 10:19Z and 10:26Z; the critics of R4 and R9 were asked between 10:50Z and 10:52Z and answered at 10:53Z and 10:54Z. The jury's 15 answers on the build came at 10:43Z and 10:44Z, none replaced; the two controls carry round 10's 10 votes, used again. The measures ran at the final tier in the Builder's worktree of the judged commit from 10:14:20Z to 10:22:21Z. Keys released 11:20Z (`KEY-R1.json` to `KEY-R9.json`, the pack manifests as `PACK-*.json`, the measures as `MEASURES.json`).

## Scores

| Critic | What it saw | Model family | Score | Severe | Major | Minor |
|---|---|---|---|---|---|---|
| R1-1 | the keys `boss-fight` and `boss-down` and the sheet `boss-stages`, whole and in native crops, each beside the approved image | GPT | 5 | 8 | 9 | 0 |
| R2 | jury on three stills of the build (the fight, the boss down, the page at rest), 5 answers each: 15 answers; the two approved keys as controls with round 10's 10 votes used again | Claude, GLM, Kimi, GPT | passes by the rule | | | |
| R3-1 | surface and detail, the two keys, the sheet and the page at rest, whole and in native crops | Kimi | 7 | 0 | 2 | 2 |
| R4-1 | motion, one sheet of frames across each of the seven beats, the page turn and the slab seating | Claude | 7 | 0 | 3 | 3 |
| R4-2 | motion, eight sheets of consecutive frames: seven at slabs that land and one at a hit on the arrow | GLM | 5 | 1 | 3 | 0 |
| R8-1 | the page as a web page, at rest and in the two keys, and the text and controls at their real size | GLM | 7 | 1 | 2 | 0 |
| R9-1 | acting, one sheet a beat, read with no words | Kimi | 4 | 0 | 4, and 3 "did not read" | 2 |
| R9-2 | acting, one sheet of each of the eight states the page uses, read with no words | GLM | 6 | 0 | 7, and 5 "did not read" | 1 |

Together: 10 severe, 38 major, 8 minor. Eight of the major issues are reads that R9 did not make, added by the Builder.

Measures on cfd83123 at the final tier (MEASURED 10:14:20Z to 10:22:21Z): 8 green, 0 red. M1; M2 (4 stills, 260304 textured pixels, largest soft share 0.011 of at most 0.02); M3, the least ratio of fine detail to the approved image over the two keys 0.9578 against at least 0.8; M4, 41 runs of type in 3 stills, the smallest 18 px (least 14), the least contrast 4.62 (least 4.5); M5 (29 parts, the furthest 0 px from the layout tree); M6 (the furthest 0 px from its size); M7 (1920 frames read, 1 event strikes the cursor, answered); M9 (24 of 29 parts checked, the furthest 0 px). M8 and M10 are the machine's and do not apply. G13 and G15 on the unit were not run in this round.

Not passed. The pass is 9 from every critic with no severe or major issue open, and R2 by its rule. The lowest score is 4 (R9-1).

## The 10 severe issues

Each in the critic's own words, with the picture it is on.

1. R1-1 issue 1, key `boss-fight`: "The pale multi-hinged legs, broad bright screw trim, uniform dark plates and ladder-like shield mounts give the boss a noticeably different silhouette and surface character. The reference has straighter dark steel arms, an angular solid face frame, heavier polished cannon barrels and a compact side mount."
2. R1-1 issue 2, key `boss-fight`: "The central red tile drops left into the projectile lane and the lowest tile nearly sits on the open socket. The tiles no longer form the staggered group rising toward the boss; the middle tile also tilts the opposite way."
3. R1-1 issue 3, key `boss-fight`: "The page is cooler and more evenly gray, with more uniform stipple. The boss, raised tiles, progress marker and arrow cast much shorter, weaker shadows, losing the strong upper-left illumination and dark lower-right weight."
4. R1-1 issue 4, key `boss-down`: "The debris and hot orange cap sit in weak gray shadows. The target has hard contact, pronounced soft-ended lower-right shadows and stronger warm highlights, making the pieces look much heavier."
5. R1-1 issue 5, key `boss-fight`: "The first two stations are bare, leaving a long empty stretch where the reference has a continuous row of five visible discs."
6. R1-1 issue 6, key `boss-down`: "Only the last three stations are visible, while the reference retains all five throughout the wreckage state."
7. R1-1 issue 7, sheet `boss-stages`: "All four states sit lower than in the reference, the first three sit noticeably farther left, and the reference's small centered dark captions are entirely absent."
8. R1-1 issue 8, sheet `boss-stages`: "The unfolding arms flare as shallow sideways zigzags rather than corner-folded legs. In the boss state they splay less diagonally, and the pale rails, rectangular shoulder geometry, ladder shield mount and prominent screws create a different read from the dark metal reference."
9. R4-2 issue 1, the sheet of consecutive frames at 2:00.30 (slab-drop): "The blocks travel diagonally in near-equal steps and stop in open space. The arrow, slot and surrounding page give no cue for what stopped them, so the supposed hits read as slides rather than impacts."
10. R8-1 issue 1, picture `rest-step4`: "The two controls in the entire form sit on different axes with a large blank area between them. The button reads as a freestanding object rather than the next action after verification."

What the ten say together. Eight are R1's, beside the approved images: the boss's own shape and finish (pale legs with many hinges, bright screw trim and ladder mounts where approved has straighter dark steel arms, an angular face frame and heavier barrels: issues 1 and 8); where the red slabs stand (issue 2); the paper and the shadows, cooler and weaker than approved (issues 3 and 4, the shared look and the kit's shadow length); the progress row with stations bare where approved shows five discs (issues 5 and 6, declined as far as they ask for caps on the two stations that the kit makes the boss's cannons); and the sheet of four stages standing lower and further left, without captions (issue 7, declined as far as it asks for words that are not in the copy). One is of the motion: the slabs travel in near equal steps and stop in open space, so they read as slides and not as impacts (R4-2 issue 1). One is of the page as a web page: the verification card and Submit on different axes (R8-1 issue 1, declined: the approved image has them so).

## R2, the jury

Judged: slabs from `home` d d c d d; collapse from `home` d c d d d; at rest from `home` d d d d d. Controls, the approved images, with round 10's votes: `boss-fight` c c c c c; `boss-down` c c c c c. The share of (a) and (b) is 0 of 15 on the judged pictures against 0 of 10 on the controls, and the judged share is no lower than the control share less `quality.jury.maxShareGap` (0.2), so R2 passes by the rule. It passes because the approved images of this page are not taken for a photograph or a film frame either: all 10 answers on the controls are (c), a product render, where the build has 11 of 15 at (d), a web demo, and 4 at (c).

## R9, the reads against what the beats mean

Four of the seven beats read as meant (the verification, the unfolding, the collapse, the press) and three of the eight states (nervous, exhausted, plain). In round 10 it was five of the seven beats and five of the seven states. Each miss is added to its card as a major issue by the Builder, in these words:

- R9-1 issue 7, `set-A-03`: that the boss hurls error messages at the arrow is read; that the arrow dodges them and shoots a stream of small darts back with each click, and that the bar starts to drop, is not: the read has it shocked and knocked about beside the hole.
- R9-1 issue 8, `set-A-04`: the dialogs are read as more bombardment; that the boss raises them as shields, that the arrow shoots them down or goes round them, and that it takes a hit and shakes it off is not in the read.
- R9-1 issue 9, `set-A-05`: the 'Session expired' banner and the arrow firing on are read; that the boss's health jumps back up and that the arrow's whole body says 'really' is not: the read has the bar draining while it is stubborn and worn down.
- R9-2 issue 9, `set-B-02`: scared reads as tentatively relieved, or simply waiting, frozen at the panel's left edge. Pale and stony, the lean back and the hiding are not in the read.
- R9-2 issue 10, `set-B-03`: confident reads as alert and uncertain, and the reader cannot tell whether the arrow is firing or being fired at. Upright with a slight bounce and a strut is not in the read.
- R9-2 issue 11, `set-B-04`: angry reads as alarmed and hurt, with a point that flares orange and smokes. A tip that glows red and steam vented in anger are not in the read.
- R9-2 issue 12, `set-B-06`: shocked reads as shaken but recovering: the point cools, the arrow straightens and stays still. The double take, the stretch tall and the snap back are not in the read.
- R9-2 issue 13, `set-B-08`: proud reads as strained and determined, then startled. Puffing up and dusting itself off are not in the read.

The two acting critics' own issues say why: the arrow holds its pointer pose through the largest event of the page, the button rising as the boss; the slabs fly past it with no frame of contact, no squash and no knock back; the last stand is twelve near equal frames; and the scorched tip and the smoke say more than the body does. The arrow is about a twentieth of the frame's width, so the tilts that are there read only on a close look.

## Declined

Logged under "Declined issues" in `kit/PROGRESS.md`, each with the critic's words:

1. R8-1 issue 1, severe, picture `rest-step4`. Declined: it moves away from the approved image: `boss-fight` has the verification card at the upper left and the socket of Submit at the lower middle, as the build has.
2. R8-1 issue 2, major, key `boss-down`. Declined: no word is on a page that is not in `content/copy.json`, and the approved `boss-down` shows the empty track with its one label.
3. R8-1 issue 3, major, picture `rest-step4`, crops. Declined: it moves away from the approved images: each of them shows the done and the coming stations of the progress row as the same steel caps.
4. R1-1 issue 7, severe, sheet `boss-stages`, as far as it asks for the four captions under the stages of the sheet `boss-stages`. Declined: the four words are not in `content/copy.json`; listed for Brandon. Where the four stages stand on the sheet stays open with the boss's owner.
5. R1-1 issue 5, severe, key `boss-fight`, as far as it asks for caps on stations 1 and 2 during the fight. Declined: the kit makes those two buttons the boss's cannons, a settled line of the sheet `boss-stages`; listed for Brandon.
6. R1-1 issue 6, severe, key `boss-down`, as far as it asks for caps on stations 1 and 2 after the fight. Declined: the same settled line as for R1-1 issue 5.
7. R1-1 issue 16, major, sheet `boss-stages`, as far as it asks for a larger label. Declined: the sizes of type come from the kit's one scale.
8. R9-1 issue 5, minor, set-A-01, as far as it asks for a larger arrow or a tighter view. Declined: the arrow's size on the page is a number the kit sets and M6 measures, and the page is seen from `home`, straight on (Brandon's stated choice). Larger tilts that a glance reads stay open with the boss's owner.
## Where the issues went

Every issue went to its owner word for word.

- Each card went to `boss_finisher` as it came (10:21Z, 10:29Z, the film cards in one file at 10:56Z), with the rulings and the declined points.
- The issues that name the shared look (the paper, the shadows' weight, the arrow, the progress row's caps) went to `look_finisher` in its brief at 11:09Z.
- The eight reads that R9 did not make went to `boss_finisher` when the round closed.
- The Builder's own: the page turn that ends the page, the three film frames whose bytes differ between two sessions (7764 and two more), and the red slab that shows a face with no words at film frame 7346, which was asked of `boss_finisher`.
- For Brandon, in the review block: the four captions of the sheet `boss-stages`, the two stations that are the boss's cannons, and the length of the shadows (`look.shadowHeights.keep`).

## What comes next for the unit

Round 17, the unit's third and last round (`quality.maxRoundsPerUnit` 3), starts after the last merge of the build agents' work (their limit is 13:02Z) and before 13:32Z. The controls' 10 votes of round 10 are used again.
