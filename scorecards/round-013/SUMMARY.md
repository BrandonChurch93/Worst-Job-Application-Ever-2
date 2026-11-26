# Round 13, unit `step2`: the second round of step 2, Personal Details

Judged commit: cfd83123 (merge 32, whose code is that of 01a231e3, with Status 78's records on top). Started 2026-11-26T10:03Z, the unit's second round of at most `quality.maxRoundsPerUnit` (3) and an extra round (the clock printed `extra rounds: yes` at 10:06Z). Machine checks on 01a231e3, 09:43Z to 09:49Z (MEASURED): type check clean, 1461 of 1461 tests in 115 files, build, bots all clear, paths all clear, each of the take's 10 beat events inside its beat and no hit within 0.15 s of a cut. Packs: the stills of R1, R2, R3 and R8 were drawn at the final tier by two render agents in their own VMs, every file that both drew byte equal, and put together 10:09Z to 10:11Z; the 205 film frames of R4 and R9 were in by 10:34Z (three `hd` frames not byte equal between the two VMs, the entry of 10:34Z) and those packs were put together 10:35Z to 10:38Z. The critics on the stills were asked between 10:14Z and 10:24Z and answered between 10:16Z and 10:25Z; the critics of R4 and R9 were asked at 10:39Z and answered at 10:40Z. The jury's 15 answers on the build came between 10:40Z and 10:43Z, none replaced; the three controls carry round 9's 15 votes, used again. The measures ran at the final tier in the Builder's worktree of the judged commit from 10:03:18Z to 10:14:20Z. Keys released 11:20Z (`KEY-R1.json` to `KEY-R9.json`, the pack manifests as `PACK-*.json`, the measures as `MEASURES.json`).

## Scores

| Critic | What it saw | Model family | Score | Severe | Major | Minor |
|---|---|---|---|---|---|---|
| R1-1 | the keys `step2-rest` and `step2-dial` and the sheet `machines`, whole and in native crops, each beside the approved image | Claude | 5 | 2 | 10 | 2 |
| R1-2 | the key `step2-crank`, whole and in native crops, beside the approved image | GLM | 6 | 1 | 9 | 1 |
| R2 | jury on three stills of the build (at rest, the dial open, the crank open), 5 answers each: 15 answers; the three approved keys as controls with round 9's 15 votes used again | GPT, Claude, GLM, Kimi | passes by the rule | | | |
| R3-1 | surface and detail, the three keys, the sheet and the page at rest, whole and in native crops | GPT | 6 | 0 | 5 | 0 |
| R4-1 | motion, one sheet of frames across each of the five beats, three sheets of consecutive frames at hits on the arrow, the page turn and the slab seating | GPT | 7 | 0 | 3 | 0 |
| R8-1 | the page as a web page, at rest and in the three keys, and the text and controls at their real size | Kimi | 8 | 0 | 1 | 4 |
| R9-1 | acting, one sheet a beat, read with no words | Claude | 5 | 0 | 5, and 3 "did not read" | 1 |
| R9-2 | acting, one sheet of each of the seven states the page uses, read with no words | GPT | 7 | 0 | 5, and 3 "did not read" | 0 |

Together: 3 severe, 44 major, 8 minor. Six of the major issues are reads that R9 did not make, added by the Builder.

Measures on cfd83123 at the final tier (MEASURED 10:03:18Z to 10:14:20Z): 8 green, 0 red. M1; M2 (5 stills, 32383 textured pixels, largest soft share 0); M3, the least ratio of fine detail to the approved image over the three keys 1.012 against at least 0.8; M4, 80 runs of type in 4 stills, the smallest 20 px (least 14), the least contrast 4.62 (least 4.5); M5 (64 parts, the furthest 0 px from the layout tree, 2 left out as moved by a gag); M6 (the furthest 0 px from its size); M7 (1260 frames read, 3 events strike the cursor, each answered); M9 (55 of 66 parts checked, the furthest 0 px). M8 and M10 are the machine's and do not apply. G13 and G15 on the unit were not run in this round.

Not passed. The pass is 9 from every critic with no severe or major issue open, and R2 by its rule. The lowest score is 5 (R1-1, R9-1).

## The 3 severe issues

Each in the critic's own words, with the picture it is on.

1. R1-1 issue 1, key `step2-rest`: "it is a dark slate glossy pill with bright bold white text, so it reads as an active button; the target's is a pale, translucent, frosted grey pill with faint low-contrast text, clearly disabled and sunk into the page"
2. R1-1 issue 2, key `step2-rest`: "the page is a cooler, darker grey with a coarse pebbled, embossed grain; the target is a brighter warm cream paper with a fine, flat fibre grain"
3. R1-2 issue 1, key `step2-crank`: "The two quiet, empty dropdown faces have become prominent dark text rows, and both right-end down chevrons are gone. The thin gray wells also lack the target's darker recessed upper-left edge and reflective lower-right lip."

What the three say together. All three are R1's, beside the approved images, and two of the three name the shared look, not the page's own machines: Continue is a dark glossy pill with bright bold text where approved is a pale frosted pill with faint text that reads as switched off (R1-1 issue 1), and the paper is cooler, darker and coarser than approved's warm cream with a fine grain (R1-1 issue 2). The third is the page's own: with the crank open, the two closed fields above show dark rows of text and no chevron where approved has quiet empty faces with a chevron at the right (R1-2 issue 1).

## R2, the jury

Judged: open from `home` d d d d d; dial from `home` d d c d d; crank from `home` d d d d d. Controls, the approved images, with round 9's votes: `step2-rest` d d d d d; `step2-dial` d d d d d; `step2-crank` d d d c d. The share of (a) and (b) is 0 of 15 on the judged pictures against 0 of 15 on the controls, and the judged share is no lower than the control share less `quality.jury.maxShareGap` (0.2), so R2 passes by the rule. It passes because the approved images of this page read as a web demo too: 13 of 15 answers on the build and 13 of 15 on the controls are (d).

## R9, the reads against what the beats mean

Two of the five beats read as meant (the page opening, the slot machine) and four of the seven states (plain, nervous, scared, exhausted). In round 9 none of the five beats read as meant and the same four states did. Each miss is added to its card as a major issue by the Builder, in these words:

- R9-1 issue 7, `set-A-02`: the dialing digit by digit and the form giving up are read; that on the return the dial whips the arrow in a full circle and flings it is not: the read has it back off tilted, deflated and a little dazed.
- R9-1 issue 8, `set-A-04`: the cranking to 100 percent is read as the arrow's own hard work; that the crank takes off by itself, spins to full and flattens the arrow on the way round is not in the read.
- R9-1 issue 9, `set-A-05`: the hesitation and the press on Continue are read; that the arrow lies flat as paper, peels itself up and refills is not: the read has it hover and lean back from the button.
- R9-2 issue 6, `set-B-02`: confident reads as curious and tentative. Upright with a slight bounce and a strut is not in the read.
- R9-2 issue 7, `set-B-05`: shocked reads as a drooping, frustrated crouch when the gauge drains. The double take, the stretch tall and the snap back are not in the read.
- R9-2 issue 8, `set-B-06`: angry reads as alarmed and urgent because its tip has caught fire. A tip that glows red and steam that it vents in anger are not in the read.

The two acting critics' own issues say why: on the dial, at the lever and on the way to Continue the arrow holds one angle and one size and slides as a pointer does; the knock after Continue is a smear with no pose of contact; and "You were warned." gets no reaction. The arrow is small against the whole page, so the tilts that are there read only on a close look.

## Declined

Logged under "Declined issues" in `kit/PROGRESS.md`, each with the critic's words:

1. R8-1 issue 1, major, picture `rest-step2`. Declined: it moves away from the approved image: `step2-rest` has the labels at the left and the fields at the right with that gap between them.
2. R8-1 issue 2, minor, picture `rest-step2`. Declined: no word is on a page that is not in `content/copy.json` (Brandon's choice: his own words, exactly), and the copy has no placeholder examples for the fields.
3. R8-1 issue 4, minor, key `step2-crank`. Declined: it moves away from the approved image: `step2-crank` has the line of instruction at the top left of the panel, the crank at the lower left and the meter at the lower right, in a panel of this height.

Not declined, and the Builder's: R8-1 issues 3 and 5 name the pack (its still at rest and its crop of least contrast), not the page.

## Where the issues went

Every issue went to its owner word for word.

- Each card went to `step2_finisher` as it came (10:17Z, 10:23Z, 10:29Z, the film cards at 10:42Z), with the rulings and the declined points.
- The issues that name the shared look (Continue, the paper, the fields' glass, the arrow, the progress row) went to `look_finisher` in its brief at 11:09Z.
- The six reads that R9 did not make went to `step2_finisher` when the round closed.
- The Builder's own: the page turn that ends the page (Continue is not seen to be pressed, the flat arrow smears while the page folds, nothing answers the slab's landing), the three `hd` frames of the arrow's smoke whose bytes differ between two sessions, and the pack's still at rest and its crop of least contrast.

## What comes next for the unit

Round 16, the unit's third and last round (`quality.maxRoundsPerUnit` 3), starts after the last merge of the build agents' work (their limit is 13:02Z) and before 13:32Z. The controls' 15 votes of round 9 are used again.
