# Round 16, unit `step2`: the third and last round of step 2, Personal Details

Judged commit: b4494f0d (merge 37, on main and on the site since 12:57Z). Started 2026-11-26T12:58Z together with the other four rounds of 15 to 19, the unit's third and last round of at most `quality.maxRoundsPerUnit` (3) and an extra round (the clock printed `extra rounds: yes` at 12:58Z; it printed `extra rounds: no` at 13:32:46Z, after which the round ran to its end, judged the build as it stood and was followed by no fix work). Machine checks on the candidate e324a4f9, whose code is that of b4494f0d (`git diff --stat` between the two over `src`, `tests`, `config`, `content`, `public`, `cut` and `tools` prints nothing), 12:50Z to 12:56Z (MEASURED): type check clean, 1479 of 1479 tests, build, bots all clear, paths all clear, each of the take's 10 beat events inside its beat and no hit within 0.15 s of a cut. Packs: the stills of R1, R2, R3 and R8 and the film frames of R4 and R9 were drawn by two render agents in their own VMs; the final stills were in the Builder's cache by 13:07Z, each tar checked against the sha256 its agent sent. The critics and the jurors were asked as places came free; the critics were all in by 14:04Z and the jury by 14:26Z. The measures ran at the final tier in the Builder's worktree of b4494f0d. The decision log has each time (entries of 13:12Z, 13:35Z, 14:04Z and 14:26Z). Keys released 14:14Z (`KEY-R1.json` to `KEY-R9.json`, the pack manifests as `PACK-*.json`, the measures as `MEASURES.json`).

## Scores

| Critic | What it saw | Model family | Score | Severe | Major | Minor |
|---|---|---|---|---|---|---|
| R1-1 | the keys `step2-rest` and `step2-dial`, whole and in native crops, and the sheet `machines`, each beside the approved image | Kimi | 6 | 0 | 6 | 5 |
| R1-2 | the key `step2-crank`, whole and in native crops, beside the approved image | GPT | 7 | 1 | 7 | 1 |
| R2 | jury on three stills of the build (the page as it opens, the dial, the crank), 5 answers each: 15 answers; the three approved keys as controls with round 9's 15 votes used again | Kimi, GPT, Claude, GLM | passes by the rule's arithmetic, 0 of 15 against 0 of 15 | | | |
| R3-1 | surface and detail, the three keys, the sheet `machines` and the page at rest, whole, and native crops of the keys and of the page at rest | GLM | 6 | 0 | 5 | 0 |
| R4-1 | motion, one sheet of frames across each of the five beats, three sheets of consecutive frames at hits on the arrow, the page turn and the slab seating | Kimi | 5 | 1 | 4 | 3 |
| R8-1 | the page as a web page: at rest and in the three keys, and the text and controls at their real size | Claude | 7 | 0 | 4 | 3 |
| R9-1 | acting, one sheet across each of the five beats, with no time and no word on it | GPT | 6 | 0 | 5, and 4 "did not read" | 0 |
| R9-2 | acting, one sheet of each of the seven states the page uses (confident, nervous, scared, plain, shocked, angry, exhausted), with no time and no word on it | Claude | 6 | 0 | 5, and 3 "did not read" | 2 |

Together: 2 severe, 43 major, 14 minor. Seven of the major issues are reads that R9 did not make, added by the Builder.

Measures on b4494f0d at the final tier (MEASURED, `MEASURES.json` in this folder; the run's times are in the decision log): 8 green, 0 red. Green: M1, 5 stills: 0 invalid values; 0 bare of 23984 edge pixels in 4 stills from home; the cursor outside the frame in 0; M2, 5 stills, 32457 textured pixels: the largest soft share 0, the most allowed 0.02; M3, 3 keys: the least ratio of fine detail to the approved image 1.5474, the least allowed 0.8; M4, 80 runs of type in 4 stills: the smallest 20 px (least 14), the least contrast 4.62 (least 4.5); M5, 64 parts in 4 stills: the furthest 0 px from the layout tree, the most allowed 2; 2 left out as moved by a gag; M6, 4 stills from home with the cursor at rest and 0 from a tier camera: the furthest 0 px from its size, the most allowed 6; M7, 1260 frames read, 3 events strike the cursor: 0 further from it than its own height in the picture, 0 with no change of damage or acting and no reaction starting on that frame or the next; M9, 55 of 66 parts checked in 4 stills from home: the furthest 0 px from its size or height, the most allowed 2. G13 and G15 are run at the phase's gate.

Not passed. The pass is 9 from every critic with no severe or major issue open, and R2 by its rule. The lowest score is 5 (R4-1).

## The 2 severe issues

Each in the critic's own words, with the picture it is on.

1. R1-2 issue 1, key `step2-crank`: "Two prominent dark status lines fill what are visually quiet, empty glass wells in the target. This is separate from the settled percentage in the audio field."
2. R4-1 issue 1, the sheet across the page turn at 1:06.50: "as the page flips, it reveals a glowing orange and purple audio-waveform landscape instead of the edge or back of the slab; at normal speed this flashes as an unrelated scene cut inside a physical turn, and you cannot tell what you are looking at without knowing it is meant to be a page"

What the two say. R1-2 issue 1: in the key `step2-crank` the two fields above the crank carry the copy's lines for a number given up and a date recorded, in dark type, where the approved image leaves both wells empty. In the film's order both rows are answered before the crank opens; the image's empty Audio volume field is settled, the other two fields are not. Not declined; listed for Brandon. R4-1 issue 1: in the page turn that ends the page, the frame at 1:07.03 is the next page's lit marquee, blurred, as the slab comes round (seen by the Builder in the sheet), which reads as a cut to another scene inside a physical turn. It is the Builder's own, with the page turn. Round 13 had no severe issue of the motion and the unit's measures were green then as now.

## R2, the jury

Judged: open from `home` d d d d d; dial from `home` d d d d d; crank from `home` d d d d d. Controls, the approved images: `step2-rest` d d d d d; `step2-dial` d d d d d; `step2-crank` d d d c d. It passes by the rule: 0 of 15 on the judged pictures against 0 of 15 on the control, and the judged share is no lower than the control share less 0.2. The controls' votes are those of round 9 (kit/07: a control's votes are collected once and reused in later rounds). One juror (number 13, Kimi) gave no answer in 10 minutes, was interrupted and replaced once by a fresh juror of the same model; the replacement's answer is the one recorded. No juror placed any picture, built or approved, in (a) or (b): the pass is the rule's arithmetic and says nothing of how real the page looks.

## R9, the reads against what the beats mean

One of the five beats read as meant (the slot machine) and four of the seven states (plain, nervous, scared, exhausted). Each miss is added to its card as a major issue by the Builder, in these words:

- R9-1 issue 6, `set-A-01`: the three closed rows are read; that the page looks easy and the arrow relaxes is not: the read has it tentatively curious, darting across the fields and hesitating.
- R9-1 issue 7, `set-A-02`: the dialing and the form giving up are read; that on the return the dial whips the arrow in a full circle and flings it is not: the read has it startled, springing back and steadying itself.
- R9-1 issue 8, `set-A-04`: the cranking and the meter filling to 100% are read; that the crank takes off by itself, spins to full and flattens the arrow on the way round is not: the read has it trying hard, then rattled or worn out, wobbling away.
- R9-1 issue 9, `set-A-05`: the press on Continue is read as a nudge; that the arrow lies flat as paper, peels itself up and refills is not: the read has it hesitant, lingering at Continue.
- R9-2 issue 8, `set-B-01`: confident reads as cautious and curious, then uneasy but going along. Upright with a slight bounce and a strut is not in the read.
- R9-2 issue 9, `set-B-05`: shocked reads as tired and impatient, turning back and forth as if wondering whether it is done yet. The double take, the stretch tall and the snap back are not in the read.
- R9-2 issue 10, `set-B-06`: angry reads as hurt and alarmed, with a tip that catches fire and smokes as it brushes the meter. A tip that glows red and steam vented in anger are not in the read.

The two acting critics' own issues say why: the arrow is lost behind the crank's handle and in the blur, it shows no wind-up before the lever or the dial, and when the meter burns it the pose does not change.

## Declined

Logged under "Declined issues" in `kit/PROGRESS.md`, each with the critic's words:

1. R8-1 issue 1, major, key `step2-dial`. Declined: it moves away from the approved image: `step2-dial` has the open panel push the rows below it down, with the Audio volume row that close above the footer line and Continue (seen by the Builder in the comparison picture).
2. R8-1 issue 2, major, key `step2-crank`. Declined: it moves away from the approved image: `step2-crank` has the crank's panel end that close above Continue (seen by the Builder in the comparison picture).
3. R8-1 issue 3, major, picture `rest-step2`. Declined: no word is on a page that is not in `content/copy.json` (Brandon's choice: his own words, exactly), and the copy has no placeholder examples for the fields, as declined in round 13. The approved `step2-rest` draws each field empty with a chevron.
4. R8-1 issue 4, major, picture `rest-step2`. Declined: it moves away from the approved images: each of them shows the done and the coming stations of the progress row as the same steel caps, as declined in round 14.
5. R8-1 issue 5, minor, picture `rest-step2`. Declined: it moves away from the approved image: `step2-rest` has the subline close above the first row, the three rows evenly apart and the empty band above the footer.
6. R8-1 issue 7, minor, picture `rest-step2`, as far as it asks for the orange on Continue or for a reason in words. Declined: the approved `step2-rest` has Continue as a pale steel key, and the copy has no line that gives a reason. That the key at rest reads dull, with a dark label where approved's is pale, is not declined and is R1-1 issue 2 and R1-2 issue 2.
7. R1-1 issue 1, major, sheet `machines`. Declined: the progress row has five stations on every page: the approved keys `step2-rest`, `step2-dial` and `step2-crank` of this page show all five, and the sheet `machines` is cut closer than they are.
8. R1-1 issue 9, minor, sheet `machines`. Declined: the line under the step's title is the step's subline from `content/copy.json`, which the approved keys of this page show at that place.

Not declined, and listed for Brandon: R1-2 issue 1, the two answered fields above the crank. The Builder's own: R4-1 issues 1 and 2, the page turns into and out of the page.

## Where the issues went

No issue went to an owner in this round.

- No part has an owner at work: every build agent had ended by 13:02Z, and since the clock's tick of 13:32:46Z (`extra rounds: no`) no fix work is done on Phase 4's units. Every issue that is not declined is carried in "Open items" of `kit/PROGRESS.md` for the site's rounds of Phase 5, by card, with the cards in this folder as the full text.
- The Builder's own, in "Open items": the page turn (R4-1 issues 1 and 2), the Continue key's spring back and its look at rest, the three film frames whose bytes depend on earlier draws.
- For Brandon, in the review block: the two answered fields above the crank in `step2-crank`.

## What comes next for the unit

None. This was the unit's third and last round (`quality.maxRoundsPerUnit` 3), so the count ended the loop, and the clock had ended extra rounds at 13:32:46Z. The unit is marked `finished` in "Units" with the round limit as what ended its loop, not as passed, and its open issues stand in "Open items" for the site's rounds of Phase 5.
