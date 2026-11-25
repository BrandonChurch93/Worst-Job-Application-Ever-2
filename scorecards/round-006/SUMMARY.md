# Round 6, unit `step1`: the fourth round of the look lock, and its last

Judged commit: bd38dd5 (merge 21 on main). Started 2026-11-25T22:50Z. Packs at the review tier: R3, R1, R8 and R2 built 22:52Z to 22:56Z, R4 at 23:00Z and R9 at 23:01Z, the last two from frames drawn by eight render agents and checked by sha256. Critics and jurors were asked between 22:57Z and 23:01Z, and the last answer came at 23:03Z. Keys released 23:47Z (`KEY-R1.json` to `KEY-R9.json`, the pack manifests as `PACK-*.json`).

## Scores

| Critic | What it saw | Model family | Score | Severe | Major | Minor |
|---|---|---|---|---|---|---|
| R1-1 | the two keys beside the approved images, whole and in crops, and the page at rest | GPT | 5 | 2 | 8 | 1 |
| R1-2 | the three cursor sheets beside the approved sheets | Kimi | 5 | 0 | 9 | 7 |
| R2 | jury on the three judged pictures, one picture each, 15 answers; the 10 votes of round 3 on the two controls carried over | Kimi, GPT, Claude, GLM | passes by the rule | | | |
| R3-1 | surface and detail, real-size crops | Claude | 7 | 0 | 5 | 3 |
| R4-1 | motion across the seven beats, the page turn and the slab's seating | Claude | 7 | 0 | 5 | 3 |
| R4-2 | motion across four hits | GLM | 7 | 0 | 4 | 0 |
| R8-1 | the page as a web page | GLM | 7 | 0 | 4 | 0 |
| R9-1 | acting, one sheet a beat, read with no words | Kimi | 6 | 0 | 3, and 5 "did not read" | 1 |
| R9-2 | acting, one sheet a state, read with no words | GPT | 5 | 2 | 4, and 6 "did not read" | 0 |

Together: 4 severe, 53 major, 15 minor.

Measures on bd38dd5 at the review tier (MEASURED 22:48Z): 8 green, 0 red (M2 0.0132 of at most 0.02, M3 0.9541 against a least of 0.8, M4 the smallest type 14 px and the least contrast 4.74 against 4.5, M9 0 px of 2). G13 on `step1` passes (16 parts).

Not passed. The pass is 9 from every critic with no severe or major issue open. The lowest score is 5 (R1-1, R1-2, R9-2).

Against round 5 (the model families changed places, so one critic's number is not the same critic's number): R1 5 and 4 then, 5 and 5 now; R3 7 then, 7 now; R4 6 and 5 then, 7 and 7 now; R8 8 then, 7 now; R9 6 and 4 then, 6 and 5 now. Severe issues: 8 then, 4 now. Major: 59 then, 53 now. Of the 4 severe, one is declined whole (the whole page in the tug's frame), one is declined in one half (a flush slit in place of the machine) and open in the other (the machine reads as mounted on the surface), and two are declined in their fix only (remove the arms) and open in what they name (hands that read as mittens).

This is the unit's best judged round: the highest lowest score of the four rounds, and the fewest severe and major issues.

## R2, the jury

Judged: `step1-fire` b d d d d; `step1-tug` c d c c c; the page at rest d d d d d. Controls, carried over from round 3 because the two approved files are the same bytes: approved `step1-fire` c d c d c; approved `step1-tug` c c c c c. The share of (a) and (b) is 1 of 15 on the judged pictures and 0 of 10 on the controls, so R2 passes by its rule (judged share no lower than the control share less 0.2). All fifteen jurors answered and none was replaced. One juror of five took the build's picture at the fire for (b), 85 sure: the first (a) or (b) a picture of this build has drawn in four rounds. What the rule does not see: fourteen of fifteen answers call the build's pictures a render, and every juror of the page at rest chose (d).

## R9, the reads against what the beats mean

Read as meant: the last name ("confused, then annoyed; the keyboard keeps scrambling"), the resume as a beat ("hopeful, proudly carrying its resume toward the upload slot") and shocked ("Shocked and hurt; a shot strikes it by H and burns a smoking hole through it").

Did not read, each added to its critic's card as a major issue by the Builder: the keyboard's rise (read as an arrow settling in to start the form); the first name as a beat (diligent typing on a keyboard that is just beginning to misbehave: no turrets, bolts, dodges, cocky moment or hit); the email as a beat (the slabs read as stickers that spring up); the tug as a beat (the arms read as a cord the arrow is tangled in, and the arrow as watching); the shredded beat (no pile, stand or zip in the read); confident (tentative, then purposeful); proud (wary and then frozen); nervous (alarmed and scrambling); angry (determined and straining); scared (desperate, then overwhelmed); exhausted (deflated and stunned).

## Declined

Logged under "Declined issues" in `kit/PROGRESS.md`:

1. R1-1 issue 1, severe: the whole page in the tug's frame. Declined in rounds 3, 4 and 5 for the same line of kit/02 (the camera pushes in for that beat).
2. R1-1 issue 2, severe, in one half, and R1-2 issue 6, major: a flush dark slit in place of the machine. "Things come out of the page" (kit/07), and M9 measures it. The other half is open: the machine reads as mounted on the surface (also R3-1 issue 8 and R8-1 issue 4).
3. R1-2 issues 3, 4 and 5, major: the captions of the approved sheets. The approved sheets' own words are not copy.
4. R9-2 issues 1 and 2, severe, the fix only: "Remove the arms and hands". The arms are approved and stated. What the two name stays open: hands that read as mittens.
5. R8-1 issue 1, major: the keyboard hides Continue. Approved `step1-fire.png` shows it so (declined in round 4).

The briefs carry only the config's settled lines, so a declined line is raised again by each new critic. No settled line was added.

## What ended the loop

The clock. Extra rounds end at 18 hours used, which came at about 23:33Z; the clock printed `extra rounds: no` at 23:42Z and 23:49Z. A fifth round was allowed by the count (`quality.lookLockMaxRounds` is 5, four were run) and not by the clock: clock rule 1 stops a round that would start after `extra rounds: no`. The loop on `step1` closes at its limit with every issue below open.

## Fix work after the round, not judged by any critic

Three fixes were taken in hand at 23:12Z with a limit of 23:47Z, one owner each:

- The fields' wipe seen after the camera settles (R4-1 issue 4), `r6_wipe_fixer`: pushed 23:27Z, merged as merge 22.
- A struck or pressed key seen to give from straight above (R4-2 issues 3 and 1), `r6_keys_press_fixer`: pushed 23:33Z, merged as merge 22.
- The page turn's wedges and the rule's shimmer (R4-1 issues 1 and 2), the Builder: not finished at the limit and not merged. One cause is fixed on the branch `wip/page-turn` (22fc184), the second is not found. It is an open item for Phase 4.

The two merged fixes are checked by machine and by the Builder's eye on stills from the merged tree. No critic has seen them: the last build a critic judged is bd38dd5. The build kept for the unit is the judged build of this round plus those two fixes, with the machine checks and the measures green on the merged tree (the numbers are in the decision of 2026-11-25 that closes the loop, in `kit/PROGRESS.md`).

## Where the open issues went

Every open severe and major issue of this round is under "Open items" in `kit/PROGRESS.md`, one line each (51 lines: 3 severe and 48 major), with the picture's name in its pack, the critic's words, what was tried and what to try next. The minors are on the cards and named there in one line. They are worked again in the polish rounds of Phase 5, worst first, and wherever Phase 4 touches the shared part: the cursor, its arms and its acting, the materials, the page turn.

## What the Builder saw that no critic named

- The camera is home only 0.04 s before the first field empties, and the arrow mends itself while the fields empty: two things happen at once in the beat's last two seconds.
- The struck key tips by about 20 degrees, far more than a real key gives. A smaller tip did not show from straight above at the review tier.
- `npm run sheet -- --motion hit` gives whole frames and not cut-outs round the hit, so a hit sheet cannot show a key's give at its real size. R4-2 judged the hits from such frames.
