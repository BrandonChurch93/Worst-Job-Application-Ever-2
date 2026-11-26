# Round 8, unit `decision`: the first round of step 5, the Decision

Judged commit: c24bc6a (merge 21 on main). Started 2026-11-26T04:22Z. Packs: R1, R2, R3 and R8 put together 04:31Z from stills drawn at the final tier on two VMs, R3 and R8 again at 04:38Z with their crops fixed; R4 at 04:44Z and R9 at 04:45Z from 144 film frames at the review tier. R1, R3, R8 and R9 were asked between 04:52Z and 04:56Z and had answered by 04:58Z. The jury of 15 was asked from 05:00Z to 05:04Z. R4 was asked at 04:56Z and answered at 05:12Z. No critic is missing. Keys released 05:14Z (`KEY-R1.json` to `KEY-R9.json`, the pack manifests as `PACK-*.json`).

## Scores

| Critic | What it saw | Model family | Score | Severe | Major | Minor |
|---|---|---|---|---|---|---|
| R1-1 | the key `decision` beside the approved image, whole and in native crops | GLM | 6 | 2 | 12 | 0 |
| R2 | jury on two judged stills and the approved image as the control, one picture each, 15 answers | Kimi, GPT, Claude, GLM | passes by the rule | | | |
| R3-1 | surface and detail, the two judged stills and two grids of native-size crops | GPT | 7 | 0 | 4 | 0 |
| R4-1 | motion across the four beats, two sheets of consecutive frames at a hit, the page turn and the slab's seating | Kimi | 4 | 2 | 2 | 2 |
| R8-1 | the page as a web page, three stills, no approved image beside them | Claude | 7 | 0 | 3 | 4 |
| R9-1 | acting, one sheet a beat and one a state, read with no words | GPT | 6 | 0 | 5, and 5 "did not read" | 0 |

Together: 4 severe, 31 major, 6 minor.

Measures on c24bc6a at the final tier (MEASURED 04:40Z to 04:46Z): 7 green, 1 red. Red: M3 on `decision`, fine detail 0.6931 of the approved image's against at least 0.8. G13 on `decision` passes (21 parts, none a stand-in) and G15 passes (web at hd 290.3 of 700 MB).

Not passed. The pass is 9 from every critic with no severe or major issue open. The lowest score is 4 (R4-1).

## R2, the jury

Judged: `decision` d d d d d; the page at rest d d d c d. Control, the approved `decision`: d c c d c. The share of (a) and (b) is 0 of 10 on the judged pictures and 0 of 5 on the control, so R2 passes by its rule. What the rule does not see: no juror took any picture of either kind for a photograph or a film frame. The approved image drew three (c), "a 3D render", and the build one: the build is more often taken for a web demo. Almost every juror gave the same reason, that the picture is laid out as a web page with a pointer on it.

## R9, the reads against what the beats mean

Four of the nine sheets read as meant: `decision.wait` (the absurd wait, the arrow backs off the counter and fidgets), `decision.letter` (the hope, the stamp, the arrow battered beside it), `decision.reset` (back on the careers page, toward Apply, as if to try again) and Exhausted. Five did not, and each is added to the card as a major issue by the Builder.

- `decision.metrics`, meant: the cursor peels itself up, the panel fills in, it looks at the one button there is and presses it. Read: dazed, it lingers by the stamp while the numbers count up, then goes to the button. The peel up is not in the read.
- Nervous, meant: beads of sweat, a small tremble, a gulp. Read: disheartened or impatient, a short agitated waggle.
- Shocked, meant: a double take, a stretch tall and a snap back. Read: waiting uneasily, then perking up and swivelling to look at the paper.
- Proud, meant: it puffs up and dusts itself off. Read: curious and expectant, reaching up onto the notice to inspect it.
- Scared, meant: pale and stony, leaning back. Read: stunned or pinned. The stamp hides the arrow through the whole sheet, so the state is not seen at all.

## R4, what the Builder saw in the same pack

The motion critic's two severe issues rest on a time that is wrong and on a fault that is right. MEASURED by looking at the pack's files frame by frame:

- What lands at 2:23.73 is the letter, not the stamp. The stamp enters at about 2:24.80, lands at about 2:25.25, rocks at 2:25.33 and holds to about 2:26.0. So the claim that the stamp sits for two seconds before any ink shows is declined.
- What the critic names is there all the same. Seen from straight above, the stamp's fall is a move toward the page with almost no travel across the picture, and it reads as an object put down by hand. At 2:26.23 the stamp slides off sideways and uncovers the word, where `kit/01-FILM.md` says "The stamp lifts: REJECTED, and one flattened cursor". The letter does not flex, no dust rises, the shadow does not close on contact.
- The first hit sheet (`letter-drop`) shows twelve frames of the letter's text and nothing landing: the pack tool cut its window round the middle of the thing that lands and not round its edge. That is the Builder's fault in `tools/lib/pack-look.mjs`, and it cost the critic the frames it needed.
- The seat of the turned slab is at 2:31.55 as the sheet says, and the page is still steeply tilted at 2:31.30, so that time claim is declined too. After 2:31.57 nothing visibly settles: the slab's seat has no knock that reads. That is the Builder's, in `src/stage/turn.ts`.

## Declined

Logged under "Declined issues" in `kit/PROGRESS.md`:

1. R4-1 issues 1, 2 and 4, in their times only, as above. The substance of each is open.
2. R8-1 issue 2, major: "steps 1 to 4 are identical silver knobs, so nothing shows that they are completed". The approved `decision` shows four equal steel buttons and the current one in orange, and `kit/02-SUBJECT.md` line 44 says "a five-step progress bar at the right, with the current step's button in orange".
3. R8-1 issue 1, major, in two of its three parts: the stamp block "like an object left on a desk" under the metrics panel, and the button "centred on the page". Both are the approved image, and the kit says the stamp "rests beside the letter" and puts "one large orange button" at the bottom. Open: the two cards' top edges are not on one line.
4. R8-1 issue 3, major, the second half of its fix: "add a quiet footer line, such as a disabled 'Check status' control or fine print". No word is on a page that is not in `content/copy.json`. Open: the wait panel sits high with empty page under it.

## Where the issues went

- The Decision page's own, to `decision_fixer` (from 05:40Z, limit 07:45Z): where the stamp block, the arrow, the red word and the letter's text sit against the approved image (R1 severe 1 and 2, R1 9 and 13), the glass of the metrics panel and its three wells (R1 3, R3 1 and 2), the letter's paper and the ink of the word (R1 8 and 10), the stamp block's collar, lacquer and pad (R1 11), the panel's type (R1 12), the page as a page (R8 1 in its open part, 3 in its open part, 4 to 7), the stamp's hit (R4 1 to 3: a fall that reads from above, the lift, the letter's answer), and the acting (R9 all ten).
- Shared and locked in Phase 3, to `look_fixer` on a branch for the polish rounds: the header that rides about 15 px higher than five approved images draw it (R1 5: the rule is at y 151 in the build and at 164 to 167 in the approved `decision`, `step2-rest`, `step2-dial`, `boss-fight`, `boss-down` and `page-look`, MEASURED), the finish of the steel progress buttons and the rail (R1 6), the orange (R1 7 and 13), a stationary collar round the current step's button (R3 3), the arrow's bevel, keyline and cracks when flat (R1 14, R3 4), the page's grain and the direction of cast shadows (R1 4), the weight of the type (R1 12).
- The Builder's: the pack's hit window, the seat's knock, and the first frame of a unit's beat sheet when a page turn is still running in it (R4 6).

## What comes next for the unit

Round 2 on `decision` is run when `decision_fixer`'s work is on main and the clock prints `extra rounds: yes`.
