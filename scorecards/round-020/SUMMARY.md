# Round 20, unit `site`: the first round on the whole live site

Judged commit: e17eb5f8 (merge 41 on main with the record of the five site parts; on the published site since 19:20Z). Started 2026-11-26T19:24Z, the first round of at most `quality.siteMaxRounds` (2) and the floor round of Phase 5. Critics: R2 (the jury), R4 (motion), R5 (story and look) and R8 (the web page). The packs were built from clean checkouts of e17eb5f8 in fresh sandboxes with the repo's own command; every file's sha256 sum was checked on arrival. Machine checks: type check clean and 1764 of 1764 tests on 696bf4e1 (MEASURED); the gate of Phase 5 runs on e17eb5f8 since 19:34Z, G1 to G14 passed by 19:54Z, G15 to G18 not yet read when this was written.

## Scores

| Critic | What it saw | Model family | Score | Severe | Major | Minor |
|---|---|---|---|---|---|---|
| R2 | the jury: six stills drawn through the live site's path, 5 answers each, 30 answers; the ten approved whole pages as control, 50 answers | Kimi, GPT, Claude, GLM | passes by the rule's arithmetic, 0 of 30 against 0 of 50 | | | |
| R4-1 | motion: nine sheets of twelve consecutive frames of a visitor's run of the live site (walking, a hit, a page turn, control taken and given back, into the ball, the flippers) | GPT | 6 | 2 | 5 | 0 |
| R5-1 | story and look: the six pages at rest, the touch page and moments of a visitor's run, nine sheets | Claude | 7 | 1 | 4 | 2 |
| R8-1 | the site as a web page: the six pages at rest and the controls at their real size | Kimi | 7 | 0 | 2 | 3 |

Together: 3 severe, 11 major, 5 minor.

Not passed. The pass is the machine checks green including G15 to G18, R4, R5 and R8 each at least 9 with no severe or major issue open, and R2 by its rule. The lowest score is 6 (R4-1).

## R2, the jury

It passes by the rule: 0 of 30 answers (a) or (b) on the judged pictures against 0 of 50 on the controls. Said plainly beside it: 28 of 30 jurors chose (d) for the live site, against 24 (d) and 26 (c) of 50 for the approved pages. The card holds every answer.

## Severe issues

1. R4-1 issue 1, `set-A-06`, 33.27 to 33.40 s of the visit: the lost tug of war of step 1 reads as an unexplained detach: the arrow stands tethered in one frame and tumbles loose in the next, and nothing around it reacts. Two causes, both taken: the page (the live loss is shown in too few steps and the slot and tray do not answer) and the pack (the sheet was named for a hit, and the visitor was never hit by a bolt).
2. R4-1 issue 2, `set-A-04`, 10.65 to 10.72 s: moire on the slab and dark triangular facets across the resume tray during the page turn into step 1. MEASURED by the Builder: the dark triangles and a dark band across the lower page are in the film path as well (frames 2 to 8 of the arrival in Preview 03's step 1 piece).
3. R5-1 issue 1, `set-A-03`: the page a touch-only device gets is flat CSS and does not look built from the site's materials.

## Where the issues went

Taken into the fix pass that started at 20:10Z (five sandbox agents, each on a branch, hard limit 21:15Z):

- `r20_fix_turn` (`agent/fix-turn`): R4-1 issue 2 (severe) and issue 3 (major, the turn's end coasts with no stop).
- `r20_fix_tug` (`agent/fix-tug`): R4-1 issue 1 (severe), issue 4 (major, the arrow jumps as control is taken) and issue 5 (major, the give-back is unclear).
- `r20_fix_touch` (`agent/fix-touch`): R5-1 issue 1 (severe), by HTML and CSS only, with no new word and no link while `links.portfolioWork` is empty.
- `r20_fix_result` (`agent/fix-result`): R5-1 issue 2 (major, the result screen of step 3: the ghostly tube, the plate with the cone, the hard card) and R8-1 issue 5 (minor, the feed tube's lower end on the first screen, only where a mend moves toward the approved `loader-page`).
- `r20_fix_packs` (`agent/fix-packs`): the pack's part of R4-1 issues 1, 5, 6 and 7 and of the page turn's sheet: a visitor who is hit once by a bolt on step 1, and runs that hold a whole beat in two sheets in a row.

Not taken, said here and to Brandon:

- R5-1 issue 2, in part: the header and the progress row on the result screen. By `kit/02-SUBJECT.md` line 243 the last screen holds the outlet port and the result card; the header stands at the top of the tall slab.
- R4-1 issue 7, in part: a run of the steel balls. The kit's list for the site's motion pack does not hold one. The ball's second deflection at the flipper is carried in "Open items" for the table.
- R5-1 issue 6 (minor): the arrow over the playfield. By the kit the arrow rides in the ball.
- R8-1 issue 4 (minor): the arrow on the pages at rest. It is the site's character.

## Declined

Logged under "Declined issues" in `kit/PROGRESS.md`, each with the critic's words. Each asks to move away from an approved image (`kit/07-QUALITY-BAR.md`), and each is Brandon's to overrule:

1. R8-1 issue 1, major: step 2's empty menus at rest (approved `step2-rest`).
2. R8-1 issue 2, major: the bare lower page of steps 3 to 5 (approved `loader-page`, `boss-fight`, `boss-down`).
3. R8-1 issue 3, minor: the perk cards' empty lower half (approved `marketing-top`).
4. R5-1 issue 3, major: page 4 at rest is empty but for the socket (approved `loader-page`).
5. R5-1 issue 4, major: pages 2 and 3 look alike at rest (approved `step2-rest` and the approved step 1 images).
6. R5-1 issue 5, major: the light changes from the page to a dark cabinet (the approved machine images; `kit/04-LOOK.md` gives the machine its own darker grade).
7. R5-1 issue 7, minor: page 5 is sparse at rest (approved `boss-fight` and `boss-down`).

## What comes next for the unit

The fix pass ends by 21:40Z at the latest (`quality.floorFixMinutes`, 90). Then merge 42, the tests, the build, the published site, and round 21 on the merged commit with new packs from clean checkouts. By Brandon's note 3 a round limit does not close the loop below the bar: if round 21 is under 9, the state is shown to him as below the bar and the work goes on until he says to move on.
