# Round 19, unit `decision`: the second round of step 5, Decision

Judged commit: b4494f0d (merge 37, on main and on the site since 12:57Z). Started 2026-11-26T12:58Z together with the other four rounds of 15 to 19, the unit's second round of at most `quality.maxRoundsPerUnit` (3) and an extra round (the clock printed `extra rounds: yes` at 12:58Z; it printed `extra rounds: no` at 13:32:46Z, after which the round ran to its end, judged the build as it stood and was followed by no fix work). Machine checks on the candidate e324a4f9, whose code is that of b4494f0d (`git diff --stat` between the two over `src`, `tests`, `config`, `content`, `public`, `cut` and `tools` prints nothing), 12:50Z to 12:56Z (MEASURED): type check clean, 1479 of 1479 tests, build, bots all clear, paths all clear, each of the take's 10 beat events inside its beat and no hit within 0.15 s of a cut. Packs: the stills of R1, R2, R3 and R8 and the film frames of R4 and R9 were drawn by one render agent in its own VM; the final stills were in the Builder's cache by 13:07Z, each tar checked against the sha256 its agent sent. The jury's 15 answers came between 13:11Z and 13:30Z, 10 of them on the build's two pictures and 5 on the control, asked by the Builder's mistake and not counted (the R2 section); the critics were all in by 14:04Z. The measures ran at the final tier in the Builder's worktree of b4494f0d. The decision log has each time (entries of 13:12Z, 13:35Z, 14:04Z and 14:26Z). Keys released 14:15Z (`KEY-R1.json` to `KEY-R9.json`, the pack manifests as `PACK-*.json`, the measures as `MEASURES.json`).

## Scores

| Critic | What it saw | Model family | Score | Severe | Major | Minor |
|---|---|---|---|---|---|---|
| R1-1 | the key `decision`, whole and in native crops, beside the approved image | Claude | 6 | 0 | 7 | 2 |
| R2 | jury on two stills of the build (the metrics, the page at rest), 5 answers each: 10 answers; the approved key as control with round 8's 5 votes used again | Kimi, GPT, Claude, GLM | passes by the rule's arithmetic, 0 of 10 against 0 of 5 | | | |
| R3-1 | surface and detail, the key `decision` and the page at rest, whole and in native crops | Kimi | 7 | 0 | 1 | 3 |
| R4-1 | motion, one sheet of frames across each of the four beats, consecutive frames at the letter's drop and at a hit on the arrow, the page turn and the slab seating | GLM | 7 | 0 | 3 | 0 |
| R8-1 | the page as a web page: at rest and in the key `decision`, and the text and controls at their real size | GPT | 8 | 0 | 2 | 0 |
| R9-1 | acting, one sheet across each of the four beats and one sheet of each of the five states the page uses (nervous, shocked, proud, scared, exhausted), with no time and no word on it | Kimi | 5 | 0 | 6, and 4 "did not read" | 2 |

Together: 0 severe, 23 major, 7 minor. Four of the major issues are reads that R9 did not make, added by the Builder.

Measures on b4494f0d at the final tier (MEASURED, `MEASURES.json` in this folder; the run's times are in the decision log): 8 green, 0 red. Green: M1, 2 stills: 0 invalid values; 0 bare of 11992 edge pixels in 2 stills from home; the cursor outside the frame in 0; M2, 2 stills, 1004308 textured pixels: the largest soft share 0, the most allowed 0.02; M3, 1 keys: the least ratio of fine detail to the approved image 1.3223, the least allowed 0.8; M4, 32 runs of type in 2 stills: the smallest 20 px (least 14), the least contrast 4.62 (least 4.5); M5, 26 parts in 2 stills: the furthest 0 px from the layout tree, the most allowed 2; 0 left out as moved by a gag; M6, 2 stills from home with the cursor at rest and 0 from a tier camera: the furthest 0 px from its size, the most allowed 6; M7, 720 frames read, 2 events strike the cursor: 0 further from it than its own height in the picture, 0 with no change of damage or acting and no reaction starting on that frame or the next; M9, 21 of 26 parts checked in 2 stills from home: the furthest 0 px from its size or height, the most allowed 2. G13 and G15 are run at the phase's gate.

Not passed. The pass is 9 from every critic with no severe or major issue open, and R2 by its rule. The lowest score is 5 (R9-1).

## Severe issues

None.


## R2, the jury

Judged: metrics from `home` d d d d d; the page at rest d d d c d. Controls, the approved images: `decision` d c c d c. It passes by the rule: 0 of 10 on the judged pictures against 0 of 5 on the control, and the judged share is no lower than the control share less 0.2. The control's votes are those of round 8 (kit/07: a control's votes are collected once and reused in later rounds). By the Builder's mistake the juror list of this round also held the control picture, and five fresh jurors answered on it (c d c c d); those five answers are kept on this card under askedAgainNotCounted and are not counted; counted, they would give 0 of 5 as well. One juror (number 9, Kimi) gave no answer in 10 minutes, was interrupted and replaced once by a fresh juror of the same model; the replacement's answer is the one recorded. No juror placed any picture, built or approved, in (a) or (b): the pass is the rule's arithmetic and says nothing of how real the page looks.

## R9, the reads against what the beats mean

Two of the four beats read as meant (the wait, the reset) and three of the five states (nervous, shocked, exhausted). Each miss is added to its card as a major issue by the Builder, in these words:

- R9-1 issue 9, `set-A-02`: the letter is read; that the red stamp slams down on the letter and on the arrow and lifts to show REJECTED and one flattened arrow is not: the read ends with the stamp about to slam down.
- R9-1 issue 10, `set-A-03`: the stamped letter and the button are read; that the arrow peels itself up and that the metrics panel fills in are not, and the press on Accept Rejection reads as about to happen.
- R9-1 issue 11, `set-A-07`: proud reads as panicked, then crushed: the stamp slams down and the arrow is flattened, dragged and pinned. Puffing up and dusting itself off are not in the read.
- R9-1 issue 12, `set-A-08`: scared reads as battered and dazed, crumpled and staggering toward the button. Pale and stony, the lean back and the hiding are not in the read.

The acting critic's own issues say why: the arrow slides in one neutral pose through the wait and to the button, the stamp is on the letter with no wind-up and no flinch seen, and the crushed arrow is held as a wad with no point.

## Declined

Logged under "Declined issues" in `kit/PROGRESS.md`, each with the critic's words:

1. R8-1 issue 1, major, key `decision`. Declined: it moves away from the approved image: `decision` shows the arrow beside the stamp, and a settled line of `decision` in `config/showcase.json` says of it "The image's cursor is cracked but not flat. In the build it is flattened." It is the film's character at the end of its story, not a second cursor.
2. R9-1 issue 1, major, set-A-04. Declined: it names the order of the sheets in the pack, not the page. The brief says the pack holds one sheet for each beat and then one sheet for each acting state the unit shows; the state sheets are cut from the same beats, so they do not follow the reset in time. The film's order is that of `kit/01-FILM.md`.

Not declined, and the Builder's own: R3-1 issue 3, a fault of the pack logged at 13:12Z (the tile labelled for the arrow is cut from the page at rest, where no arrow stands at that place).

## Where the issues went

No issue went to an owner in this round.

- No part has an owner at work: every build agent had ended by 13:02Z, and since the clock's tick of 13:32:46Z (`extra rounds: no`) no fix work is done on Phase 4's units. Every issue that is not declined is carried in "Open items" of `kit/PROGRESS.md` for the site's rounds of Phase 5, by card, with the cards in this folder as the full text.
- The Builder's own, in "Open items": the pack tool's tile for the arrow on the page at rest (R3-1 issue 3), the type of `decision.reset` missing at 2:31.70 in one frame, not reproduced.
- For the shared look of the cursor and the glass: R1-1 issues 1 and 3 and R3-1 issues 1 and 2.

## What comes next for the unit

None in Phase 4. This was the unit's second round of at most `quality.maxRoundsPerUnit` (3). The clock ended the loop: it printed `extra rounds: no` at 13:32:46Z, and `AGENTS.md` runs another round only while both the count and the clock allow one. The unit is marked `finished` in "Units" with the clock as what ended its loop, not as passed, and its open issues stand in "Open items" for the site's rounds of Phase 5.
