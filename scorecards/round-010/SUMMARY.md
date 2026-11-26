# Round 10, unit `boss`: the first round of step 4, Submit

Judged commit: 020efac5 (merge 22 on main). Started 2026-11-26T04:22Z on c24bc6a and started again at 04:43Z on 020efac5, before any pack went to a critic, because the unit's keeper had pushed its points 1 to 4 by 04:34Z: nothing of c24bc6a is judged, and it counts as one round. Packs: the stills of R1, R2, R3 and R8 drawn at the final tier on two VMs and put together by 04:56Z; the 288 film frames of R4 and R9 at the review tier in two slices by 05:20Z, the packs put together by 05:22Z. The critics were asked between 05:39Z and 05:44Z and answered between 05:41Z and 05:46Z, but for one: the first motion critic of set A (`r10_critic_r4_1`, GLM) had sent no answer at its limit, 06:29Z, and was replaced once, as the kit allows, by `r10_critic_r4_1b` (GPT) with the same brief and files; it answered at 06:31Z and its card is R4-1. The jury of 25 was asked from 05:51Z and was in by 05:53Z. Keys released 07:09Z (`KEY-R1.json` to `KEY-R9.json`, the pack manifests as `PACK-*.json`).

## Scores

| Critic | What it saw | Model family | Score | Severe | Major | Minor |
|---|---|---|---|---|---|---|
| R1-1 | the keys `boss-fight` and `boss-down` and the sheet `boss-stages`, whole and in native crops, each beside the approved image | Claude | 4 | 5 | 11 | 3 |
| R2 | jury on three stills (the fight, the wreck, the page at rest) and the two approved keys as controls, one picture each, 25 answers | Kimi, GPT, Claude, GLM | passes by the rule | | | |
| R3-1 | surface and detail, the two keys, the sheet and the page at rest, whole and in native crops | GLM | 7 | 0 | 6 | 0 |
| R4-1 | motion, the boss's beats and hits in sheets of consecutive frames | GPT, the replacement | 7 | 0 | 4 | 0 |
| R4-2 | motion, seven sheets of consecutive frames at the slabs' drops and one at the hit on the arrow | Kimi | 6 | 0 | 4 | 1 |
| R8-1 | the page as a web page, the page at rest and the two keys, no approved image beside them | Kimi | 7 | 0 | 1 | 1 |
| R9-1 | acting, one sheet a beat, read with no words | Claude | 6 | 0 | 4, and 2 "did not read" | 2 |
| R9-2 | acting, one sheet of each of the seven states the page uses, read with no words | GPT | 6 | 0 | 5, and 2 "did not read" | 0 |

Together: 5 severe, 39 major, 7 minor.

Measures on 020efac5 at the final tier (MEASURED 05:07Z to 05:15Z): 7 green, 1 red. Red: M3, the least ratio of fine detail to the approved image over the unit's two keys, 0.7877 against at least 0.8. G13 on `boss` passes (22 parts, none a stand-in) and G15 passes (web at hd 287.3 of 700 MB).

Not passed. The pass is 9 from every critic with no severe or major issue open. The lowest score is 4 (R1-1).

## The five severe issues

All five are R1-1's, each on a picture set beside its approved image.

1. `boss-fight`: the arrow points flat to the right and is a small grey metallic arrow with almost no dark edge, where approved has a white glossy arrow with a thick black outline.
2. `boss-fight`: the verification card is opaque flat grey plastic, where approved is translucent pale sea green frosted glass with a bright bevelled edge.
3. `boss-fight`: the shield is a solid mint green slab in a thick white plastic frame, where approved is clear frosted glass with a thin bright edge.
4. `boss-down`: the arrow is a small clean grey cursor, where approved's is battered: a white body, a thick black edge, a chipped outline, scorch flecks.
5. `boss-stages`, the Unfolding stage: the plate is already the full wide boss plate with long legs, where approved has a compact plate barely larger than the button with short legs just folding out.

## R2, the jury

Judged: the fight c d d c c; the wreck d d d d d; the page at rest d d d d d. Controls, the approved images: `boss-fight` c c c c c; `boss-down` c c c c c. The share of (a) and (b) is 0 of 15 on the judged pictures and 0 of 10 on the controls, so R2 passes by its rule. What the rule does not see: all ten answers on the approved images say a product render, and twelve of fifteen on the build say a web demo. The build reads as an app screen where the approved images read as rendered objects.

## R9, the reads against what the beats mean

Five of the seven beats read as meant, and five of the seven states. Each miss is added to its card as a major issue by the Builder.

- `boss.verify`, meant: the arrow reads the checkbox, hesitates, sweats, ticks it, and the card answers. Read: breezy, then it hesitates over the box, ticks it and gets its answer. Read as meant but for the sweat.
- `boss.unfold`, meant: the button shudders, tears loose and unfolds into legs, armour, cannons and a shield. Read: the button tears out of the page, knocks the arrow sideways and armours itself into a walking machine with a shield. Read as meant.
- `boss.slabs`, meant: the boss fires error slabs, the arrow dodges and shoots darts. Read: it turns to face the machine and shoots, and the machine fires errors back that land around it. Read as meant but for the dodge, which the critic's own issue names.
- `boss.popups`, meant: the boss throws up dialogs as shields, the arrow shoots them down or goes round, takes a hit and shakes it off. Read: dialogs thrown at the arrow like the slabs. The shields did not read.
- `boss.lastStand`, meant: nearly beaten, the boss plays Session expired, its health jumps back up, the arrow's whole body says "really", and it finishes the job. Read: a hit that crumples the arrow, then anger and a charge. The trick and the "really" did not read.
- `boss.collapse`, meant: the boss sparks, folds in and drops as a dented, scorched Submit button. Read: the arrow rams it, it blows apart, and a scorched Submit button lies in the wreck. Read as meant in its end; the fold is read as a burst.
- `boss.press`, meant: the arrow drags itself over, exhausted, and presses. Read: exactly that.
- States that read: Plain, Nervous, Shocked, Confident (as focused and defiant), Exhausted.
- Scared, meant: pale and stony, a lean back, hiding behind the nearest field. Read: deflated and uncertain.
- Angry, meant: a red tip and steam. Read: rigid and intent, almost unfazed, with a glowing tip.

## Declined

Logged under "Declined issues" in `kit/PROGRESS.md`:

1. R1-1 issue 9, major: buttons 1 and 2 are missing from the header's row and stand on the cannon discs. It repeats a settled line of the sheet `boss-stages` ("The image's cannon discs carry no numerals. In the build they are the numbered buttons of the progress bar"), and `kit/02-SUBJECT.md` and `kit/03-METHOD.md` make the two cannons out of those buttons: they fly in from the header and dock. The question is in the review block for Brandon.
2. R1-1 issue 15, major: the captions under the four stages of the sheet are missing. `content/copy.json` has no such words and no word is taken from an image. In the review block.
3. R8-1 issue 2, minor: give the done steps a tick or a filled state. Every approved page draws the done and the coming steps alike, grey steel, with only the current one orange.

## Where the issues went

- The boss's own, to `boss_closer` (from 06:55Z, limit 09:55Z), with every issue word for word: the glass of the card and the shield (R1-1 issues 2, 3 and 12, R3-1 issues 1 and 3); the arrow's pose and damage in the two keys (R1-1 issues 1 and 4); the Unfolding stage (R1-1 issue 5); the plates, discs, tags, cap and socket (R1-1 issues 7, 8, 10, 11, 13, 14, 16, 17 and 19, R3-1 issues 2, 4, 5 and 6); the fight's motion (R4-1 issues 1 and 4, R4-2 issues 1 to 5); the acting (R9-1, R9-2, and the four reads above); the 220 px of empty page above Submit at rest (R8-1 issue 1); the fine print under the card (R1-1 issue 18: it stays at rest, and is not drawn in the fight or after it, where approved shows none).
- Shared and locked in Phase 3, to `look_fixer`: the orange (R1-1 issue 6); the arrow's body, its dark edge and its size, which is `cursor.heightPxAt1080` by a settled line.
- The Builder's: the press on Submit with no downstroke before the page turns (R4-1 issue 2) and the rings and the rule shimmering as the next page seats (R4-1 issue 3), both in the stage's page turn.

## What comes next for the unit

Round 2 on `boss` is run when `boss_closer`'s first pass is on main, at about 08:20Z, and the clock prints `extra rounds: yes`.
