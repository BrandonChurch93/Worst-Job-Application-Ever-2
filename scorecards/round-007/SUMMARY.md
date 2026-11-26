# Round 7, unit `marketing`: the first round of the careers page

Judged commit: be1d145 (merge 18 on main at 049ce3f, with the unit's parts recorded on top). Started 2026-11-26T03:03Z. Packs: R3, R1, R8 and R2 built 03:09Z to 03:19Z at the final tier; R4 at 03:51Z and R9 at 04:17Z from film frames at the review tier. R1, R3, R8 and the jury of 25 were asked between 03:20Z and 03:25Z and had answered by 03:25Z. R4 and R9 were asked at 04:52Z and 04:54Z, when a critic's slot was free beside the render agents of rounds 8 to 10, and answered at 04:53Z and 04:55Z. No critic is missing. Keys released 04:57Z (`KEY-R1.json` to `KEY-R9.json`, the pack manifests as `PACK-*.json`).

## Scores

| Critic | What it saw | Model family | Score | Severe | Major | Minor |
|---|---|---|---|---|---|---|
| R1-1 | the key `marketing-top` beside the approved image, whole and in native crops | Claude | 4 | 3 | 10 | 3 |
| R2 | jury on four judged stills and the approved image as the control, one picture each, 25 answers | Kimi, GPT, Claude, GLM | passes by the rule | | | |
| R3-1 | surface and detail, the five judged stills and their native-size crops | GLM | 7 | 0 | 4 | 0 |
| R4-1 | motion across the four beats, the page turn and the slab's seating | GPT | 7 | 0 | 4 | 1 |
| R8-1 | the page as a web page, four screens and native crops | Kimi | 8 | 0 | 1 | 2 |
| R9-1 | acting, one sheet a beat and one a state, read with no words | Claude | 5 | 2 | 5, and 7 "did not read" | 1 |

Together: 5 severe, 31 major, 7 minor.

Measures on be1d145 at the final tier (MEASURED 03:31Z): 6 green, 1 red, 1 not yet. Red: M3 on `marketing-top`, fine detail 0.6323 of the approved image's against at least 0.8. Not yet: M2, since nothing in the unit carried a colour picture then. G13 on `marketing` passes (21 parts, none a stand-in) and G15 passes (web at hd 286.3 of 700 MB).

Not passed. The pass is 9 from every critic with no severe or major issue open. The lowest score is 4 (R1-1).

## R2, the jury

Judged: `marketing-top` c d d d d; the three other stills d d d d d each. Control, the approved `marketing-top`, asked here for the first time: d d c d d. The share of (a) and (b) is 0 of 20 on the judged pictures and 0 of 5 on the control, so R2 passes by its rule. What the rule does not see: no juror took any picture of either kind for a photograph or a film frame, and almost every juror gave the same reason, that the picture is laid out as a web page with a pointer on it.

## R9, the reads against what the beats mean

None of the seven sheets read as meant. Each is added to the card as a major issue by the Builder.

- `marketing.stroll`, meant: the cursor strolls in, glossy and confident. Read: calm, idle, maybe a little cautious, drifting in.
- `marketing.perks`, meant: it visits the cards, each shows its fine print, a small double take at "Unlimited PTO", unbothered. Read: the visits and the fine print, and no reaction at any card. The double take is not in the read.
- `marketing.ticker`, meant: the ticker runs and the cursor does not look down. Read: idle, then wary or curious, a drift to the badge and back. The ticker is not in the read.
- `marketing.apply`, meant: it bounds to the button, winds up and jumps on it, the button sinks, the page turns over. Read: hesitant, it creeps to the button and clicks it, and the page tips and falls away.
- Shocked, meant: a double take, a stretch tall and a snap back. Read: tense, then discouraged or tired. The stretch is seen; the snap back reads as a slump.
- Proud, meant: it puffs up and dusts itself off. Read: straining or struggling to get free. The dust is seen; the puff up is not.
- Confident, meant: upright, a slight bounce, a strut. Read: uneasy, pulled away, as if dragged.

## Declined

Logged under "Declined issues" in `kit/PROGRESS.md`:

1. R1-1 issue 7, major, in one half: "the page is greyer and dimmer". MEASURED on the two pictures the critic saw: the page left of the headline is (233, 230, 225) in both, and the whole frame's mean is (196, 193, 187) in the build against (192, 189, 181) in the approved image. The other half is open: the grain is a mottle where the approved page has fine fibre, and M3 measures it.
2. R9-1 issue 3, major, the fix only: "push in or scale the character up". The arrow's size never changes (`kit/02-SUBJECT.md`, `cursor.heightPxAt1080`), and the page has no camera move. What it names is open: the arrow carries no attitude on the way in.

## Where the issues went

- The careers page's own, to `careers_fixer` (from 03:55Z, limit 06:50Z): the glass of the cards and the ticker (R1 severe, R3), the medal (R1, R3), the ticker cut in a word at rest (R8), the cards at rest (R8), M3's share that lies in the glass and the medal, and since 05:02Z the acting and the contacts (R9 all eight and the seven reads, R4 issues 2, 3 and 4). Its first pass was pushed at 05:02Z and goes into merge 23.
- Shared and locked in Phase 3, to "Open items" for the polish rounds, with `look_fixer` preparing them on a branch from 05:30Z: the orange of the buttons (R1 severe), the arrow's shading, outline and shadow (R1 severe, R3), the weight of the type, the button labels and nav links, the header's rule, the length and darkness of cast shadows, the page's grain, the socket of the large button (R3), and the body language of the acting states themselves (step 1's critics did not read them either).
- The Builder's: the dark patch across the resume recess during the turn at 0:14.17 and the divider that softens as the slab seats (R4 issues 1 and 5), both in the page turn; and the pack, which showed no consecutive frames of a card hit or of the press (R4 issues 2 and 3 ask for them): the next pack of this unit carries a hit sheet for each.

## What comes next for the unit

Rounds 2 and 3 on `marketing` are extra rounds: one is started when `careers_fixer`'s work is on main and the clock prints `extra rounds: yes`.
