# Round 18, unit `marketing`: the second round of the careers page

Judged commit: b4494f0d (merge 37, on main and on the site since 12:57Z). Started 2026-11-26T12:58Z together with the other four rounds of 15 to 19, the unit's second round of at most `quality.maxRoundsPerUnit` (3) and an extra round (the clock printed `extra rounds: yes` at 12:58Z; it printed `extra rounds: no` at 13:32:46Z, after which the round ran to its end, judged the build as it stood and was followed by no fix work). Machine checks on the candidate e324a4f9, whose code is that of b4494f0d (`git diff --stat` between the two over `src`, `tests`, `config`, `content`, `public`, `cut` and `tools` prints nothing), 12:50Z to 12:56Z (MEASURED): type check clean, 1479 of 1479 tests, build, bots all clear, paths all clear, each of the take's 10 beat events inside its beat and no hit within 0.15 s of a cut. Packs: the stills of R1, R2, R3 and R8 and the film frames of R4 and R9 were drawn by one render agent in its own VM; the final stills were in the Builder's cache by 13:07Z, each tar checked against the sha256 its agent sent. The critics and the jurors were asked as places came free; the critics were all in by 14:04Z and the jury by 14:26Z (19 answers: four jurors gave no answer and were replaced once, three replacements answered, so one picture stands with 4). The measures ran at the final tier in the Builder's worktree of b4494f0d. The decision log has each time (entries of 13:12Z, 13:35Z, 14:04Z and 14:26Z). Keys released 14:23Z (`KEY-R1.json` to `KEY-R9.json`, the pack manifests as `PACK-*.json`, the measures as `MEASURES.json`).

## Scores

| Critic | What it saw | Model family | Score | Severe | Major | Minor |
|---|---|---|---|---|---|---|
| R1-1 | the key `marketing-top`, whole and in native crops, beside the approved image | GPT | 7 | 1 | 6 | 0 |
| R2 | jury on four stills of the build (Apply, and the page at rest and at two places further down): 19 answers; the approved key as control with round 7's 5 votes used again | Kimi, GPT, Claude, GLM | passes by the rule's arithmetic, 0 of 19 against 0 of 5 | | | |
| R3-1 | surface and detail, the key `marketing-top`, the page at rest and three views further down the page (the perks, the proof, the foot), whole and in native crops | Kimi | 8 | 0 | 0 | 2 |
| R4-1 | motion, one sheet of frames across each of the four beats, the page turn and the slab seating | Claude | 6 | 0 | 4 | 3 |
| R8-1 | the page as a web page: at rest, the perks, the proof, the foot and the key `marketing-top`, and the text and controls at their real size | GLM | 8 | 0 | 3 | 0 |
| R9-1 | acting, one sheet across each of the four beats and one sheet of each of the three states the page uses (shocked, proud, confident), with no time and no word on it | Kimi | 4 | 0 | 5, and 7 "did not read" | 2 |

Together: 1 severe, 25 major, 7 minor. Seven of the major issues are reads that R9 did not make, added by the Builder.

Measures on b4494f0d at the final tier (MEASURED, `MEASURES.json` in this folder; the run's times are in the decision log): 8 green, 0 red. Green: M1, 5 stills: 0 invalid values; 0 bare of 29980 edge pixels in 5 stills from home; the cursor outside the frame in 0; M2, 5 stills, 2593573 textured pixels: the largest soft share 0, the most allowed 0.02; M3, 1 keys: the least ratio of fine detail to the approved image 1.1839, the least allowed 0.8; M4, 759 runs of type in 5 stills: the smallest 18 px (least 14), the least contrast 4.62 (least 4.5); M5, 390 parts in 5 stills: the furthest 0 px from the layout tree, the most allowed 2; 0 left out as moved by a gag; M6, 5 stills from home with the cursor at rest and 0 from a tier camera: the furthest 0 px from its size, the most allowed 6; M7, 840 frames read: no event strikes the cursor in them; M9, 185 of 390 parts checked in 5 stills from home: the furthest 0 px from its size or height, the most allowed 2. G13 and G15 are run at the phase's gate.

Not passed. The pass is 9 from every critic with no severe or major issue open, and R2 by its rule. The lowest score is 4 (R9-1).

## The 1 severe issues

Each in the critic's own words, with the picture it is on.

1. R1-1 issue 1, key `marketing-top`: "The arrow reads almost upright and needle-like, with a very narrow head and a small straight tail. The target has a much broader diagonal head, a clearly stepped tail angled down to the right, and a distinct dark underside."

What the one says: in the key the arrow stands almost upright and reads as a needle, where approved's has a broad diagonal head and a stepped tail. The critic keeps the arrow's height as configured, so nothing of it is declined; it is open with the shared look of the cursor.

## R2, the jury

Judged: apply from `home` d d d d d; the page at rest d d d d; the page scrolled 0.25 of its length d d d d d; the page scrolled 0.5 of its length d c d d d. Controls, the approved images: `marketing-top` d d c d d. It passes by the rule: 0 of 19 on the judged pictures against 0 of 5 on the control, and the judged share is no lower than the control share less 0.2. The controls' votes are those of round 7 (kit/07: a control's votes are collected once and reused in later rounds). Four jurors (numbers 1, 5, 9 and 17, all Kimi) gave no answer in 10 minutes; each was interrupted and replaced once by a fresh juror of the same model. Three replacements answered and their answers are the ones recorded; the replacement of number 9 gave no answer in 10 minutes either and was interrupted. By kit/07 a juror that does not answer is replaced once: set-A-02.png stands with 4 answers, which is not fewer than the jurors less one, so R2 is not missing for this round. No juror placed any picture, built or approved, in (a) or (b): the pass is the rule's arithmetic and says nothing of how real the page looks.

## R9, the reads against what the beats mean

None of the four beats read as meant and none of the three states. Each miss is added to its card as a major issue by the Builder, in these words:

- R9-1 issue 8, `set-A-01`: confident reads as curious and unhurried, and the stroll reads as a drift down the left edge and along the bottom while it sizes the page up.
- R9-1 issue 9, `set-A-02`: the visits to the perk cards are read and so is unbothered; that each card it touches flips or slides to show its fine print is not (one card reads as darkening), and the double take at Unlimited PTO is not: the arrow reads as showing no reaction.
- R9-1 issue 10, `set-A-03`: the ticker and the arrow that does not look down at it are not in the read: the beat reads as still browsing, drifting right and eyeing the Flexible Hours card and the seal.
- R9-1 issue 11, `set-A-04`: the press on the orange button is read; the bound, the wind-up and the jump read as homing in, committed and deliberate; the button's travel is not in the read; and the page turning over reads as the whole page collapsing into a dark glitch strip.
- R9-1 issue 12, `set-A-05`: shocked reads as uneasy and fidgeting, wobbling and leaning, rattled by the ticker's claim. The double take, the stretch tall and the snap back are not in the read.
- R9-1 issue 13, `set-A-06`: proud reads as wary and frozen, holding stock-still and holding its nerve. Puffing up and dusting itself off are not in the read.
- R9-1 issue 14, `set-A-07`: confident reads as determined and quick, darting up past the seal and diving at the button in a rush. Upright with a slight bounce and a strut is not in the read.

The acting critic's own issues say why: the arrow glides at one speed in one pose, it does not answer the card that darkens under it, and the jump on Apply has no wind-up, no squash and no reaction when the page turns.

## Declined

Logged under "Declined issues" in `kit/PROGRESS.md`, each with the critic's words:

1. R8-1 issue 1, major, picture `rest-marketing`, as far as it asks for a labeled disclosure. Declined: no word is on a page that is not in `content/copy.json` (Brandon's choice: his own words, exactly), and the copy has no label for one. How the cards' empty lower part reads at rest, and what a visitor without motion sees, stay open.
2. R8-1 issue 2, major, picture `marketing-proof`, as far as it asks for the words "NAME WITHHELD". Declined: the words are not in `content/copy.json`, and no word is on a page that is not in `content/copy.json` (Brandon's choice: his own words, exactly). That the grey square and the two bars read as a loading skeleton stays open.
3. R8-1 issue 3, major, picture `marketing-perks`, as far as it asks for an action under the paragraph. Declined: the copy has no such action, and no word is on a page that is not in `content/copy.json` (Brandon's choice: his own words, exactly). Where the paragraph stands against the cards stays open.

Not declined, and the Builder's own: R4-1 issue 1, which names the pack: it holds no sheet of consecutive frames at a card's flip or at the press of Apply, because the pack tool cuts such sheets at hits on the arrow and this page has none. Logged in "Open items" for the pack tool.

## Where the issues went

No issue went to an owner in this round.

- No part has an owner at work: every build agent had ended by 13:02Z, and since the clock's tick of 13:32:46Z (`extra rounds: no`) no fix work is done on Phase 4's units. Every issue that is not declined is carried in "Open items" of `kit/PROGRESS.md` for the site's rounds of Phase 5, by card, with the cards in this folder as the full text.
- The Builder's own, in "Open items": the page turn that ends the page (R4-1 issues 4 and 5: about 0.4 s, one frame near white, the upload panel near black for a moment), the pack tool's sheets at the card flips and at Apply.
- For the shared look of the cursor: R1-1 issue 1.

## What comes next for the unit

None in Phase 4. This was the unit's second round of at most `quality.maxRoundsPerUnit` (3). The clock ended the loop: it printed `extra rounds: no` at 13:32:46Z, and `AGENTS.md` runs another round only while both the count and the clock allow one. The unit is marked `finished` in "Units" with the clock as what ended its loop, not as passed, and its open issues stand in "Open items" for the site's rounds of Phase 5.
