# Round 9, unit `step2`: the first round of step 2, Personal Details

Judged commit: 020efac5 (merge 22 on main). Started 2026-11-26T04:22Z on c24bc6a and started again at 04:43Z on 020efac5, before any pack went to a critic, because the unit's keeper had pushed its first pass at 04:32Z: nothing of c24bc6a is judged, and it counts as one round. Packs: the stills of R1, R2, R3 and R8 drawn at the final tier on two VMs and put together by 04:56Z; the 263 film frames of R4 and R9 at the review tier by 05:13Z, the packs put together by 05:22Z. The critics were asked between 05:37Z and 05:39Z and answered between 05:38Z and 06:01Z. The jury of 30 was asked from 05:48Z and was in by 05:51Z. No critic is missing and none was replaced. Keys released 06:25Z (`KEY-R1.json` to `KEY-R9.json`, the pack manifests as `PACK-*.json`).

## Scores

| Critic | What it saw | Model family | Score | Severe | Major | Minor |
|---|---|---|---|---|---|---|
| R1-1 | the keys `step2-rest` and `step2-dial`, whole and in native crops, and the sheet `machines`, each beside the approved image | GPT | 6 | 2 | 12 | 0 |
| R1-2 | the key `step2-crank`, whole and in native crops, beside the approved image | Kimi | 6 | 0 | 2 | 2 |
| R2 | jury on the three keys and the three approved images as controls, one picture each, 30 answers | Kimi, GPT, Claude, GLM | passes by the rule | | | |
| R3-1 | surface and detail, the three keys, the sheet and the page at rest, whole and in native crops | Claude | 7 | 0 | 3 | 4 |
| R4-1 | motion, one sheet across each of the five beats, three sheets of consecutive frames at the hits, the page turn and its seat | Claude | 6 | 0 | 5 | 4 |
| R8-1 | the page as a web page, the page at rest and the three keys, no approved image beside them | GLM | 8 | 0 | 4 | 0 |
| R9-1 | acting, one sheet a beat, read with no words | Kimi | 5 | 0 | 4, and 5 "did not read" | 1 |
| R9-2 | acting, one sheet of each of the seven states the page uses, read with no words | GLM | 6 | 0 | 5, and 3 "did not read" | 0 |

Together: 2 severe, 43 major, 11 minor.

Measures on 020efac5 at the final tier (MEASURED 04:58Z to 05:07Z): 7 green, 1 red. Red: M3, the least ratio of fine detail to the approved image over the unit's three keys, 0.7791 against at least 0.8. G13 on `step2` passes (21 parts, none a stand-in) and G15 passes (web at hd 286.7 of 700 MB).

Not passed. The pass is 9 from every critic with no severe or major issue open. The lowest score is 5 (R9-1).

## R2, the jury

Judged: `step2-rest` d d d d d; `step2-dial` d d d d d; `step2-crank` d d d d d. Controls, the approved images: `step2-rest` d d d d d; `step2-dial` d d d d d; `step2-crank` d d d c d. The share of (a) and (b) is 0 of 15 on the judged pictures and 0 of 15 on the controls, so R2 passes by its rule. What the rule does not see: no juror took any picture of either kind for a photograph or a film frame. Build and approved image alike are taken for a web demo, and almost every juror gave the same reason: the picture is laid out as a web page.

## R9, the reads against what the beats mean

None of the five beats read as meant, and four of the seven states did (Nervous, Plain, Scared, Exhausted). Each miss is added to its card as a major issue by the Builder.

- `step2.open`, meant: three plain closed rows, it looks easy, the arrow relaxes. Read: step 1's name field and a recoil. The sheet's first frames still show step 1's page turning away: that is the Builder's fault in the pack tool, and the read of this sheet is not held against the unit's acting.
- `step2.dial`, meant: a number dragged round, the dial whips the arrow in a full circle and flings it. Read: reaching for a field that shoves it or shatters with sparks.
- `step2.slot`, meant: the lever pulled, the reels, coins spat at the arrow. Read: discouraged, drifting down the page and touching nothing.
- `step2.crank`, meant: the crank takes off by itself and flattens the arrow on its way round. Read: weary effort turning to relief and a little pride.
- `step2.continue`, meant: the arrow peels itself up, refills, and presses. Read: the press, then the screen collapsing and the arrow backing off into the dark. The page turn is the Builder's.
- Confident, meant: upright, a bounce, a strut. Read: tentatively curious.
- Angry, meant: a red tip and steam. Read: alarmed, as if the heat were done to it.
- Shocked, meant: a double take, a stretch tall, a snap back. Read: intent, then watchful and impatient.

## Declined

Logged under "Declined issues" in `kit/PROGRESS.md`:

1. R8-1 issue 1, major: "Add quiet prompts" in the three closed fields. No key of `content/copy.json` holds such words, the approved `step2-rest` shows the fields empty, and `kit/01-FILM.md` has "Three plain, closed rows. It looks easy".
2. R8-1 issue 2, major: the labels stand far from their fields. It is the approved image's own layout: MEASURED in `step2-rest.png`, the labels run from x 129 to 660 and the fields from x 996 to 1793.

Not declined, and a ruling of the Builder taken back: R8-1 issue 4, major, the volume field stays blank while the crank is turned. At 06:21Z the Builder told the unit's keeper to leave it blank, as the approved key has it. That missed the settled line of the key `step2-crank` in `config/showcase.json`: "The image leaves the input empty. The build shows the level as a percentage." The line wins, the issue stands, and it went to the unit's new owner at 06:55Z.

## Where the issues went

- Step 2's own, to `step2_fixer` (from 06:55Z, limit 09:55Z), with every issue word for word: the sheet `machines` laid out as approved and its machines (R1-1 issues 1 to 5 and 14, R3-1 issue 3); the coins that hang in the air, the lever and the reels (R4-1 issues 3 and 4, R9-2 issue 1); the acting of all five beats and the three states that did not read (R9-1, R9-2); the level in the volume field (R8-1 issue 4); the crank's arm, the meter's light on the tray and the chevron on the locked date (R1-2 issue 2, R3-1 issue 2, R8-1 issue 3); the tray's walls and where the arrow stands in `step2-dial` and `step2-rest` (R1-1 issues 9, 12 and 13).
- Shared and locked in Phase 3, to `look_fixer` (from 06:15Z, limit 09:15Z): the waiting look of Continue, dark with white type where approved is a pale grey pill (R1-1 issues 10 and 11, R1-2 issue 1); the header that rides high (R1-1 issues 6 and 7); the progress rail and the field bevels (R1-1 issue 8); the orange; the arrow's body and its shadow; the wells of the closed fields (R3-1 issue 1).
- The Builder's: the page turn's middle frame, an orange smear over a black band, and its missing wind-up (R4-1 issues 1 and 2); the pack tool's first frame of a beat sheet while a turn still runs.

## What comes next for the unit

Round 2 on `step2` is run when `step2_fixer`'s first pass is on main, at about 08:20Z, and the clock prints `extra rounds: yes`.
