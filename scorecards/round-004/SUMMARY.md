# Round 4, unit `step1`: the second round of the look lock

Judged commit: 3f7f15d (merge 18). Started 2026-11-25T19:13Z. Packs at the review tier, built from 5e2a59d (3f7f15d plus the pack tool's fix and its test, nothing of the site). The last answer came at 19:51Z. Keys released 19:53Z (`KEY-R1.json` to `KEY-R9.json`, the pack manifests as `PACK-*.json`).

## Scores

| Critic | What it saw | Model family | Score | Severe | Major | Minor |
|---|---|---|---|---|---|---|
| R1-1 | the two keys beside the approved images, whole and in crops | GPT | 5 | 3 | 10 | 1 |
| R1-2 | the three cursor sheets beside the approved sheets | Kimi | 4 | 4 | 9 | 4 |
| R2 | jury of 15 on the judged pictures, one picture each; the 10 votes of round 3 on the two controls carried over | Kimi, GPT, Claude, GLM | passes by the rule | | | |
| R3-1 | surface and detail, real-size crops | Claude | 6 | 0 | 6 | 4 |
| R4-1 | motion across the seven beats, the page turn and the slab's seating | Claude | 6 | 1 | 4 | 2 |
| R4-2 | motion across four hits | GLM | 6 | 0 | 4 | 0 |
| R8-1 | the page as a web page | GLM | 8 | 0 | 3 | 0 |
| R9-1 | acting, one sheet a beat, read with no words | Kimi | 4 | 1 | 4, and 4 "did not read" | 1 |
| R9-2 | acting, one sheet a state, read with no words | GPT | 5 | 2 | 6, and 5 "did not read" | 0 |

Measures on 3f7f15d at the review tier (MEASURED 19:21Z): 8 green, 0 red (M3 0.8454 against a least of 0.8, M4 smallest type 14 px and least contrast 4.67).

Not passed. The pass is 9 from every critic with no severe or major issue open. The lowest scores are 4 (R1-2, R9-1).

Against round 3 (the model families changed places, so one critic's number is not the same critic's number): R1 4 and 5 then, 5 and 4 now; R3 6 then, 6 now; R4 7 and 4 then, 6 and 6 now; R8 6 then, 8 now; R9 5 and 6 then, 4 and 5 now. Severe issues: 16 then, 11 now. Of the 11, five are lines declined in whole or in half (the whole page in the tug's frame, the flush slit, the three captions), three are the hands, and the other three are the arrow at 6.0 s, the damage row and the tug's camera.

## R2, the jury

Judged: `step1-fire` d d d d d; `step1-tug` c d c c c; the page at rest d d d d d. Controls, carried over from round 3 because the two approved files are the same bytes: approved `step1-fire` c d c d c; approved `step1-tug` c c c c c. The share of (a) and (b) is 0 of 15 on the judged pictures and 0 of 10 on the controls, so R2 passes by its rule (judged share no lower than the control share less 0.2). What the rule does not see: ten of ten jurors on the build's two pictures from the home camera chose (d), "a web 3D demo, a mobile game or a low-budget app", where the approved key from the same camera drew (d) from two of five.

## R9, the reads against what the beats mean

Read as meant: the keyboard beat (calm, about to fill in its name), the last name (confused but pushing on while the keys scatter), the resume beat in what happens (it carries its resume to the drop zone, hopeful and determined), shocked (hit, a round hole, it freezes), scared (alarmed, it sweats, buckles and is pulled into the slot). The plain state carries no feeling to read. The read of exhausted names the mend for the first time ("shredded into strips, then pulls back into its arrow shape").

Did not read, each added to its critic's card as a major issue by the Builder: the first name as a beat (read as patient typing: no turrets, bolts, dodges or hit in it), the email as a beat (the slabs read as labels the form slaps back, no dives), the tug as a beat and angry in it (both read as the arrow feeding its sheet in; angry read as determined), the shredded beat (no pile, stand or zip in the read; the arrow slinks away), confident (cautious and hesitant), nervous (panicked), proud (relieved, then purposeful), exhausted (dazed, drifting).

## Declined

Logged under "Declined issues" in `kit/PROGRESS.md`:

1. R1-1 issue 1, severe: the whole page in the tug's frame. Declined in round 3 for the same line of kit/02 (the camera pushes in for that beat).
2. R1-1 issue 2, severe, in one half, and R1-2 issue 11, major: a flush slit in place of the machine. "Things come out of the page" (kit/07), and M9 measures it. The other half of R1-1 issue 2, the block of shadow, is open.
3. R1-2 issues 1, 2 and 3, severe: the captions of the approved sheets. The approved sheets' own words are not copy.
4. R8-1 issue 1, major: the open keyboard stands where Continue sits at rest. Approved `step1-fire.png` shows it so, with Enter as the one orange key.
5. R9-1 issue 1 and R9-2 issues 1 and 2, severe, the fix only: "remove the arms". The arms are approved and stated. The fault the three name, hands that read as gloves, stays open as severe.

The briefs carry only the config's settled lines, so a declined line is raised again by each new critic. No settled line was added.

## Where the open issues went

- `keys_fixer`: the keyboard under fire and the slabs. R1-1 issues 3 to 6 (the hot key and the smoke under the arrow, the deck's finish, the caps, the turrets); R3-1 issue 1 (the bullet holes are flat); R4-2 issues 1 to 4 and R4-1 issues 5 to 7 (a slab's landing has no weight: the keys under it do not bottom out and the deck does not answer; a key struck by a bolt does not go down; the shuffle floats; the slabs leave in one frame).
- `acting_fixer`: R1-1 issue 3 in its half (the arrow at 6.0 s is at the number row and clean; the approved has it scorched over the letter rows: the hit moves to 5.746 s). R9-1 issues 2 to 8 and 10, R9-2 issues 3 to 6, 8 to 11 and 13: reactions that are missing or too short for a sheet to catch (the first slab, the first shuffle, the wiped form), the hit's pose, the states read as something else, the mend.
- `cursor_fixer`: R1-1 issue 7 in its half (the arrow's face and edge in the tug); R1-2 issues 4 and 13 to 17 (the damage row on one line, Reassembled as an arrow, the laser's rim, Angry, Nervous, Scorched); R3-1 issues 2, 3, 4, 7 and 9 (the hole's wall, the cracks, the tape, the scared face).
- `surface_fixer`: R1-1 issues 9 to 13 (the page cool with a cloudy grain, the discs, the glass, the wells, the Browse pill); R1-2 issues 5 to 7; R3-1 issue 5; R8-1 issue 2 (Browse files and the grey Continue look alike).
- `tug_finisher`: R1-1 issues 2, 7 and 8, R3-1 issues 6, 8 and 10, R8-1 issue 3 (the machine joined to the drop zone's rim, the block of shadow, bowed arms, a crumpled sheet); R4-1 issues 1 to 3 (severe: the tug's camera follows the arrow and slides sideways on its way in and out; kit/07 has it move straight in and straight out); R9-1 issues 1 and 9, R9-2 issues 1, 2, 7 and 12 (the hands, the bite before the pull, the whole arrow and the slot in frame).
- The Builder: R1-2 issue 12 (the Holding paper pose: done in 79efe7f, the print stays); R1-1 issue 12 in its half (the labels at regular weight: done in 3ab8b81).

## Left open by the Builder, and why

- R1-2 issues 8 to 10 (long, dark, hard shadows on the three sheets) and R4-1 issue 4 (the arrow's shadow reads as a detached smear). The key light is not changed for the last round: on the page the arrow's shadow is in proportion to the approved, the sheets push in 5.2 times, a light for the sheets alone would show what the site never shows, and five fix agents are tuned to this light.
- R1-1 issue 14, minor: the title row sits about 10 px higher than approved.

## What the Builder saw that no critic named

- A sheet at a hit started three frames before the hit, so a falling slab was already down in its first frame. From round 5 half of a hit sheet's frames come before the hit.
- R9 reads a beat from 12 frames 461 px wide: on the first name that is a frame every 0.7 s. A reaction shorter than that is not in the sheet at all.
- R4-1 calls the turrets "paddles" and the bolts "balls": at that size the fire across the keys is not read as fire.

## What changes next

Round 5 is the last round of the look lock on this unit. The fix agents push by 20:35Z; merge 20 follows, then the checks, the measures and the packs. The model families change places again.
