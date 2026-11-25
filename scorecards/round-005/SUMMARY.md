# Round 5, unit `step1`: the third round of the look lock

Judged commit: 11a1cd6 (merge 20, with the cut list made again). Started 2026-11-25T20:34Z. Packs at the review tier, built 20:36Z to 20:50Z from 3215d8b (11a1cd6 plus the pack tool's fix for the acting sheet's tile and its test, nothing of the site). The last critic's answer came at 21:07Z. Keys released 21:28Z (`KEY-R1.json` to `KEY-R9.json`, the pack manifests as `PACK-*.json`).

## Scores

| Critic | What it saw | Model family | Score | Severe | Major | Minor |
|---|---|---|---|---|---|---|
| R1-1 | the two keys beside the approved images, whole and in crops, and the page at rest | Claude | 5 | 2 | 10 | 2 |
| R1-2 | the three cursor sheets beside the approved sheets | GLM | 4 | 4 | 17 | 1 |
| R2 | jury on the three judged pictures, one picture each, 14 answers; the 10 votes of round 3 on the two controls carried over | Kimi, GPT, Claude, GLM | passes by the rule | | | |
| R3-1 | surface and detail, real-size crops | GPT | 7 | 0 | 5 | 0 |
| R4-1 | motion across the seven beats, the page turn and the slab's seating | Kimi | 6 | 0 | 1 | 3 |
| R4-2 | motion across four hits | GPT | 5 | 0 | 4 | 0 |
| R8-1 | the page as a web page | Kimi | 8 | 0 | 0 | 3 |
| R9-1 | acting, one sheet a beat, read with no words | GLM | 6 | 0 | 5, and 6 "did not read" | 1 |
| R9-2 | acting, one sheet a state, read with no words | Claude | 4 | 2 | 5, and 6 "did not read" | 1 |

Together: 8 severe, 59 major, 11 minor.

Measures on 11a1cd6 at the review tier (MEASURED 20:47Z): 7 green, 1 red. The red one was M4, type contrast, on five key legends, and its cause was in the measure: it read the flash on the struck key, a layer that only adds light, as a black cover. The reading was fixed in 920ddbb (the measure and its tests; the keyboard key rendered again has the same sha256 as the judged still, so no pixel of the site changed). MEASURED 21:14Z on 920ddbb at the review tier: 8 green, 0 red (M2 0.0159 of 0.02, M3 0.8846 against a least of 0.8, M4 smallest type 14 px and least contrast 4.64 against 4.5, M9 1.87 px of 2).

Not passed. The pass is 9 from every critic with no severe or major issue open. The lowest scores are 4 (R1-2, R9-2).

Against round 4 (the model families changed places, so one critic's number is not the same critic's number): R1 5 and 4 then, 5 and 4 now; R3 6 then, 7 now; R4 6 and 6 then, 6 and 5 now; R8 8 then, 8 now; R9 4 and 5 then, 6 and 4 now. Severe issues: 11 then, 8 now. Of the 8, four are lines declined whole (the whole page in the tug's frame, the three captions), two are declined in their fix only (remove the arms), and two are open: the keyboard's deck (R1-1 issue 2) and the arms in the pull (R1-2 issue 4).

## R2, the jury

Judged: `step1-fire` d d d d c; `step1-tug` c d c c; the page at rest d d d d d. Controls, carried over from round 3 because the two approved files are the same bytes: approved `step1-fire` c d c d c; approved `step1-tug` c c c c c. The share of (a) and (b) is 0 of 14 on the judged pictures and 0 of 10 on the controls, so R2 passes by its rule (judged share no lower than the control share less 0.2). Jurors 05 and 09 gave no answer in 10 minutes and were each replaced once: the replacement of 05 answered, the replacement of 09 did not, so the tug's picture has four answers, the least the kit allows. What the rule does not see: nine of ten jurors on the build's two pictures from the home camera chose (d), "a web 3D demo, a mobile game or a low-budget app", where the approved key from the same camera drew (d) from two of five.

## R9, the reads against what the beats mean

Read as meant: the tug as a beat ("it pulls back against the shredder eating its resume, then loses its grip") and shocked ("a bullet comes across the keyboard, hits it with a flash and leaves a hole. It reels and spins"), the first round in which the hit and its hole are in a read.

Did not read, each added to its critic's card as a major issue by the Builder: confident (read as tentative, and as calm and a bit wary); the first name as a beat (typing on a keyboard that sputters with sparks: no turrets, bolts, dodges, cocky moment or hit); the last name (startled but persistent, where the patience should thin); the email as a beat (the slabs read as notices that pop up, the dives as one jerk away); proud (cautiously purposeful, and tired, grudging relief); nervous (panicked and dodging); angry (desperate and protective); scared (losing, then grief); exhausted (broken, a blob that has lost the arrow); the shredded beat (no pile, stand or zip in the read).

## Declined

Logged under "Declined issues" in `kit/PROGRESS.md`:

1. R1-1 issue 1, severe: the whole page in the tug's frame. Declined in rounds 3 and 4 for the same line of kit/02 (the camera pushes in for that beat).
2. R1-1 issue 14, minor, and R1-2 issue 4, severe, each in one half: a dark slim slot in place of the machine. "Things come out of the page" (kit/07), and M9 measures it. The other halves are open: the sheet's folds, and the arms in the pull.
3. R1-2 issues 1, 2 and 3, severe: the captions of the approved sheets. The approved sheets' own words are not copy.
4. R8-1 issue 1, minor: the lower part of the page at rest is empty and the pointer rests over nothing. Approved `page-look.png` shows the same.
5. R9-2 issues 1 and 2, severe, the fix only: "cut the arms and hands". The arms are approved and stated. What the two name stays open: hands that read as mittens, and arms that dangle alone under the flattened arrow.

The briefs carry only the config's settled lines, so a declined line is raised again by each new critic. No settled line was added.

## Where the open issues went

Eight fix agents, started 21:24Z, each with its issues word for word and one owner to each set of files:

- `keys_look_fixer`: R1-1 issues 2 and 4 to 7 (the deck, the struck key's legend, the turrets and bolts, the marks, the caps).
- `keys_motion_fixer`: R4-2 issues 1 to 4, R4-1 issues 1 to 3, R9-1 issue 10 (the key and the deck answer the hit; a slab's fall is seen and lands on its event; the shuffle has arcs and landings; key travel; the slabs leave one by one).
- `cursor_form_fixer`: R1-2 issues 5, 9, 13, 14, 19 and 21, R1-1 issue 8, R9-2 issue 7, R9-1 issue 5 (a domed shell with a rounded sidewall; strips with one arrowhead; the flattened and the exhausted arrow).
- `cursor_finish_fixer`: R1-2 issues 10 to 13, 16 to 18 and 20, R3-1 issue 4, R1-1 issue 5, R9-2 issue 12 (holes with the page seen through, the scorch, the tape, the sweat, the heat, the chalk, the cracks).
- `acting_closer`: R9-1 issues 1 to 5, 7 to 10 and 12, R9-2 issues 3 to 7, 9, 10 and 14, R4-2 issue 1, R1-2 issue 15 (held poses, the strut, the hit, the dives, the mend).
- `arms_fixer`: R1-2 issues 4, 6, 7 and 8, R3-1 issue 2, R1-1 issue 8, R9-2 issue 2 (staggered bent arms, hands that wrap the sheet's edges, the tube's section, the arms after the loss).
- `paper_fixer`: R1-1 issue 14, R1-2 issues 4 and 7, R3-1 issues 2 and 3, R9-1 issues 6 and 11, R9-2 issues 6, 8 and 11 to 13 (the sheet's folds, the shredder's frame and ribbons, the acting from 19.9 s to 28.25 s).
- `surface_closer`: R3-1 issues 1 and 5, R1-1 issues 3 and 9 to 13, R1-2 issue 22, R8-1 issue 2 (the glass card, Continue and button 1, the wells, the page's grain, Browse files).

## Left with the Builder

- R1-1 issue 11 in its half (the page's brightness and the shadows in the grade).
- R9-2 issue 5 in its half (doubled images of the arrow in a sheet's frame: the shutter's samples).
- R8-1 issue 3, minor (the helper line's style) and R4-1 issue 4, minor (the page turn's wind-up).

## What the Builder saw that no critic named

- A slab hangs over its place before it falls, and the camera looks straight down. On the sheet of the hit (0:32.13 to 0:32.50) the slab is in all twelve frames and the landing is a shift of a few pixels, so the fall is not in the picture at all. This went to `keys_motion_fixer` as its first item.
- The page's own tone is the approved page's (MEASURED on the page at rest, approved against build: 235, 234, 229 against 237, 234, 228 at the top left; 222, 219, 213 against 225, 221, 214 at the bottom left). What reads darker than approved are the things on it: the deck, the glass card, the wells' rims.
- The stand-in check G13 had not been run on step 1 before this round. Run at 21:26Z it passes (16 parts, none a stand-in by the three tests, 960 film frames and 40 pictures read), after 15 records of the parts register were made anew: they named files that are gone or had no anchor commit.

## What changes next

The fix agents push by 22:45Z; merge 21 follows, then the checks and the measures. A fourth round on this unit starts only if the clock still prints `extra rounds: yes` (they end at 18 hours used, about 23:32Z). The model families change places again.
