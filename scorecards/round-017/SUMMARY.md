# Round 17, unit `boss`: the third and last round of step 4, the boss

Judged commit: b4494f0d (merge 37, on main and on the site since 12:57Z). Started 2026-11-26T12:58Z together with the other four rounds of 15 to 19, the unit's third and last round of at most `quality.maxRoundsPerUnit` (3) and an extra round (the clock printed `extra rounds: yes` at 12:58Z; it printed `extra rounds: no` at 13:32:46Z, after which the round ran to its end, judged the build as it stood and was followed by no fix work). Machine checks on the candidate e324a4f9, whose code is that of b4494f0d (`git diff --stat` between the two over `src`, `tests`, `config`, `content`, `public`, `cut` and `tools` prints nothing), 12:50Z to 12:56Z (MEASURED): type check clean, 1479 of 1479 tests, build, bots all clear, paths all clear, each of the take's 10 beat events inside its beat and no hit within 0.15 s of a cut. Packs: the stills of R1, R2, R3 and R8 and the film frames of R4 and R9 were drawn by two render agents in their own VMs; the final stills were in the Builder's cache by 13:07Z, each tar checked against the sha256 its agent sent. The critics and the jurors were asked as places came free; the critics were all in by 14:04Z and the jury by 14:26Z (14 answers: one juror and its one replacement gave no answer, so one picture stands with 4). The measures ran at the final tier in the Builder's worktree of b4494f0d. The decision log has each time (entries of 13:12Z, 13:35Z, 14:04Z and 14:26Z). Keys released 14:23Z (`KEY-R1.json` to `KEY-R9.json`, the pack manifests as `PACK-*.json`, the measures as `MEASURES.json`).

## Scores

| Critic | What it saw | Model family | Score | Severe | Major | Minor |
|---|---|---|---|---|---|---|
| R1-1 | the keys `boss-fight` and `boss-down`, whole and in native crops, and the sheet `boss-stages`, each beside the approved image | GLM | 5 | 6 | 23 | 0 |
| R2 | jury on three stills of the build (the slabs, the collapse, the page at rest): 14 answers; the two approved keys as controls with round 10's 10 votes used again | Kimi, GPT, Claude, GLM | passes by the rule's arithmetic, 0 of 14 against 0 of 10 | | | |
| R3-1 | surface and detail, the two keys, the sheet `boss-stages` and the page at rest, whole, and native crops of the keys and of the page at rest | Claude | 6 | 0 | 7 | 3 |
| R4-1 | motion, one sheet of frames across each of the seven beats, the page turn and the slab seating | Kimi | 7 | 0 | 1 | 3 |
| R4-2 | motion, eight sheets of consecutive frames: six at slabs that land and two at hits on the arrow | GPT | 6 | 0 | 6 | 0 |
| R8-1 | the page as a web page: at rest and in the two keys, and the text and controls at their real size | GPT | 8 | 0 | 2 | 0 |
| R9-1 | acting, one sheet across each of the seven beats, with no time and no word on it | GLM | 7 | 0 | 4, and 4 "did not read" | 1 |
| R9-2 | acting, one sheet of each of the eight states the page uses (nervous, scared, confident, angry, shocked, plain, exhausted, proud), with no time and no word on it | Claude | 5 | 1 | 5, and 2 "did not read" | 2 |

Together: 7 severe, 54 major, 9 minor. Six of the major issues are reads that R9 did not make, added by the Builder.

Measures on b4494f0d at the final tier (MEASURED, `MEASURES.json` in this folder; the run's times are in the decision log): 8 green, 0 red. Green: M1, 4 stills: 0 invalid values; 0 bare of 17988 edge pixels in 3 stills from home; the cursor outside the frame in 0; M2, 4 stills, 300024 textured pixels: the largest soft share 0.0024, the most allowed 0.02; M3, 2 keys: the least ratio of fine detail to the approved image 1.4064, the least allowed 0.8; M4, 41 runs of type in 3 stills: the smallest 18 px (least 14), the least contrast 4.62 (least 4.5); M5, 29 parts in 3 stills: the furthest 0 px from the layout tree, the most allowed 2; 0 left out as moved by a gag; M6, 3 stills from home with the cursor at rest and 0 from a tier camera: the furthest 0 px from its size, the most allowed 6; M7, 1920 frames read, 2 events strike the cursor: 0 further from it than its own height in the picture, 0 with no change of damage or acting and no reaction starting on that frame or the next; M9, 24 of 29 parts checked in 3 stills from home: the furthest 0 px from its size or height, the most allowed 2. G13 and G15 are run at the phase's gate.

Not passed. The pass is 9 from every critic with no severe or major issue open, and R2 by its rule. The lowest score is 5 (R1-1, R9-2).

## The 7 severe issues

Each in the critic's own words, with the picture it is on.

1. R1-1 issue 1, key `boss-fight`: "The build is a cooler, more uniform gray. The boss, active progress puck and cursor lose the target's strong upper-left illumination and deep, directional lower-right shadows; the scene reads like a flat render rather than lit objects on warm paper."
2. R1-1 issue 2, key `boss-down`: "The cooler, even page and pale compact shadows lose the target's warm tactile surface and heavy lower-right shadows, most obviously under the orange cap and round metal debris."
3. R1-1 issue 3, key `boss-fight`: "The first two puck positions are bare, leaving a visibly long dead stretch where the target has five occupied positions."
4. R1-1 issue 4, key `boss-down`: "The target's first two puck positions are bare in the build, making the rail look abandoned across its left half."
5. R1-1 issue 5, sheet `boss-stages`: "The complete row of centered dark state captions is missing, leaving a visibly different sheet layout."
6. R1-1 issue 6, sheet `boss-stages`: "The sheet is cool and flat next to the warm photographed paper. The hardware has gray, diffuse shading and narrow graphic borders instead of warm raking highlights and distinctly down-right shadows. The early states sit farther left relative to the target, while the boss is canted toward the right margin."
7. R9-2 issue 1, set-B-07: "the wilted arrow's tail splits into two rounded prongs, so the shape reads at a glance as a white blob standing on two little legs or feet (like a tooth)"

What the seven say. Six are R1-1's: the page reads cool, even and grey where approved is warm with deep shadows to the lower right (issues 1, 2 and 6); stations 1 and 2 of the progress row are bare in both keys (issues 3 and 4, declined as far as they ask for caps there: the two buttons are the boss's cannons by a settled line); the sheet of the four stages carries no captions (issue 5, declined: the four words are not in the copy). One is R9-2's: the exhausted arrow's tail splits into two rounded prongs, so the shape reads as a blob on two feet. The kit rules legs out for the arrow, and that one is open with the shared look of the cursor.

## R2, the jury

Judged: slabs from `home` c c d d c; collapse from `home` d d d d; the page at rest d d d d d. Controls, the approved images: `boss-fight` c c c c c; `boss-down` c c c c c. It passes by the rule: 0 of 14 on the judged pictures against 0 of 10 on the control, and the judged share is no lower than the control share less 0.2. The controls' votes are those of round 10 (kit/07: a control's votes are collected once and reused in later rounds). One juror (number 9, Kimi) gave no answer in 10 minutes, was interrupted and replaced once by a fresh juror of the same model, which gave no answer in 10 minutes either and was interrupted. By kit/07 a juror that does not answer is replaced once: set-A-02.png stands with 4 answers, which is not fewer than the jurors less one, so R2 is not missing for this round. No juror placed any picture, built or approved, in (a) or (b): the pass is the rule's arithmetic and says nothing of how real the page looks.

## R9, the reads against what the beats mean

Three of the seven beats read as meant (verify, unfold, collapse) and six of the eight states (angry and shocked did not). Each miss is added to its card as a major issue by the Builder, in these words:

- R9-1 issue 6, `set-A-03`: that red error labels fly at the arrow and that it fires back is read; that it dodges them and that the bar starts to drop is not: the read has the machine's shield catch the shots.
- R9-1 issue 7, `set-A-04`: the dialogs are read as prompts that crowd the lane while the arrow keeps firing at the shield; that the boss raises them as shields, that the arrow shoots them down or goes round them, and that it takes a hit and shakes it off is not in the read.
- R9-1 issue 8, `set-A-05`: the session expiring and the arrow closing in to fire are read; that the boss's health jumps back up and that the arrow's whole body says 'really' is not: the read has it urgent and improvising, darting high and diving.
- R9-1 issue 9, `set-A-07`: the press on the battered button is read; that the arrow drags itself over, exhausted, is not: the read has it wary but resolved, hanging below the prompt and nosing up.
- R9-2 issue 9, `set-B-04`: angry reads as stunned and smoking after a beam hits its tip and burns it. A tip that glows red and steam vented in anger are not in the read.
- R9-2 issue 10, `set-B-05`: shocked reads as singed and recovering, then nervous and impatient, glancing about while a timer bar drains. The double take, the stretch tall and the snap back are not in the read.

The two acting critics' own issues say why: the arrow fires, banks and dodges in almost one small diagonal pose, a hit burns it with no recoil and no squash, and the burn on its tip comes and goes between sheets.

## Declined

Logged under "Declined issues" in `kit/PROGRESS.md`, each with the critic's words:

1. R1-1 issue 3, severe, key `boss-fight`, as far as it asks for caps on stations 1 and 2 during the fight. Declined: the kit makes those two buttons the boss's cannons, a settled line of the sheet `boss-stages` in `config/showcase.json` ("In the build they are the numbered buttons of the progress bar."), as declined in round 14; listed for Brandon.
2. R1-1 issue 4, severe, key `boss-down`, as far as it asks for caps on stations 1 and 2 after the fight. Declined: the same settled line as for R1-1 issue 3.
3. R1-1 issue 5, severe, sheet `boss-stages`. Declined: the four captions under the stages of the sheet `boss-stages` are not in `content/copy.json`, and no word is on a page that is not in `content/copy.json` (Brandon's choice: his own words, exactly), as declined in round 14; listed for Brandon.
4. R8-1 issue 1, major, picture `rest-step4`. Declined: it moves away from the approved image: `boss-fight` has the verification card at the upper left and the socket of Submit at the lower middle, as the build has, as declined in round 14.
5. R8-1 issue 2, major, key `boss-down`, as far as it asks for a label on the meter. Declined: no word is on a page that is not in `content/copy.json` (Brandon's choice: his own words, exactly), and the approved `boss-down` shows the empty track with its one label, as declined in round 14.

Not declined, and for the shared look of the cursor: R9-2 issue 1, the exhausted arrow's forked tail.

## Where the issues went

No issue went to an owner in this round.

- No part has an owner at work: every build agent had ended by 13:02Z, and since the clock's tick of 13:32:46Z (`extra rounds: no`) no fix work is done on Phase 4's units. Every issue that is not declined is carried in "Open items" of `kit/PROGRESS.md` for the site's rounds of Phase 5, by card, with the cards in this folder as the full text.
- The Builder's own, in "Open items": the page turn that ends the page, the film frame whose bytes depend on earlier draws (7764), the stray white shape at 1:54.73 (R4-1 issue 4).
- For Brandon, in the review block: the four captions of the sheet `boss-stages`, the two stations that are the boss's cannons, and the length of the shadows (`look.shadowHeights.keep`).

## What comes next for the unit

None. This was the unit's third and last round (`quality.maxRoundsPerUnit` 3), so the count ended the loop, and the clock had ended extra rounds at 13:32:46Z. The unit is marked `finished` in "Units" with the round limit as what ended its loop, not as passed, and its open issues stand in "Open items" for the site's rounds of Phase 5.
