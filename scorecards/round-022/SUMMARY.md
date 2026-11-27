# Round 22, unit `site`: polish round 1 on the whole live site

Judged commit: 19c0d013 (merge 43, the branch `merge-43`; on main as 2cf869fc and on the published site since 2026-11-27T01:40Z). Started 2026-11-27T00:33Z as polish round 1 of at most 2 (`quality.polishMaxRounds`), an extra round, started while the clock printed `extra rounds: yes`. Critics: R2 (the jury), R4 (motion), R5 (story and look) and R8 (the web page). The packs were built from clean checkouts of 19c0d013 in fresh sandboxes by `r22_packs_a` (R8, R2, R4) and `r22_packs_b` (R5); every file equal by sha256 to the agents' lists (MEASURED). The model families were set before any answer and differ from round 21's on every seat.

## Scores

| Critic | What it saw | Model family | Score | Severe | Major | Minor |
|---|---|---|---|---|---|---|
| R2 | the jury: the six stills drawn through the live site's path. Not asked again: all 25 pictures and the three briefs are byte equal to round 21's and round 20's, whose 30 answers stand | Kimi, GPT, Claude, GLM (round 20) | passes by the rule's arithmetic, 0 of 30 against 0 of 50 | | | |
| R4-1 | motion: ten sheets of twelve consecutive frames of a visitor's run of the live site | Kimi | 5 | 1 | 2 | 1 |
| R5-1 | story and look: the six pages at rest, the screens with the controls and moments of a visitor's run | GLM | 8 | 0 | 3 | 0 |
| R8-1 | the site as a web page: the six pages at rest, the controls on, the touch page and the controls at their real size | Claude | 6 | 0 | 6 | 3 |

Together: 1 severe, 11 major, 4 minor. All scores are STATED by the critics.

Not passed. The pass is the machine checks green including G15 to G18, the measures green, R4, R5 and R8 each at least 9 with no severe or major issue open, and R2 by its rule. The lowest score is 5 (R4-1). Round 21 scored 5, 8 and 7 with 4 severe, 14 major and 5 minor; round 20 scored 6, 7 and 7. The machine checks are green on this commit (01:27Z). The measures are green on five pages; `pinball` has its two standing red lines (M2 `youre-fired`, M3 `rail-cam` 0.5365 against 0.8), which alone keep the round under the bar.

## R2, the jury

Carried from round 21, which carried round 20 (`R2-1.json` holds the carry and every answer). It passes by the rule: 0 of 30 answers (a) or (b) on the judged pictures against 0 of 50 on the controls. Said plainly beside it, as before: 28 of 30 jurors chose (d) for the live site.

## The severe issue

R4-1 issue 1, the flipper sheets (`set-A-09.png`, `set-A-10.png`), 1:52.93 to 1:52.97 of the visit: "the scoring hit is never struck": the ball leaves the mouth between the bats with both bats at rest. MEASURED by `r22_fix_slide` on the run: that step (6764) is the machine's save throwing a lost ball back, drawn with no cause; the pack's heading called it the visitor's stroke, which it was not.

## Where the issues went

Taken, in work for merge 44:

- R4-1 issue 1 (severe) and issue 2 (major, the bats rise while no ball is near and are still at the hit): `r22_fix_slide` (`agent/polish-slide`). First pass 01:42Z: no tow at a deadline in 40 measured visits (44 in 20 before); the machine swings its own bat as the save throws the ball back, live only; the film's take is unchanged. Named by the helper as not mended: the bat's tip passes half a ball's width beside the ball. The pack tool is mended as well (`r23_pack_marker`, `agent/pack-marks`): the save gets its own true heading, a `flip` sheet shows only a stroke of the visitor's own bat that meets the ball, and the frames carry L or R where the visitor holds a flipper.
- R8-1 issue 6 (major), in part: the touch page's header stands at the height of the steps' header (`agent/builder-44`, 2f01ebdf).
- The strips' growth from the shredder's mouth, the Builder's own point named before the critics answered: the late fall of `r21_fix_tug` (`agent/polish-tug`, 0e41e037) is taken.

Open, not mended:

- R4-1 issue 3 (major), "a key press is shown only as an orange glow". MEASURED by eye on the sheet's twelve frames: no key is pressed in them; the light is the turret's bolt. A pressed key does travel in the code. Round 23's motion pack gets a sheet of the arrow typing at real size and a heading on the hit sheet that says what struck.
- R4-1 issue 4 (minor), the seal's arcs change place from frame to frame: the standing open item of the seal.
- R8-1 issue 4 (major), the perk cards' rule over an empty lower half before a touch: contested under `kit/07-QUALITY-BAR.md` (commit ddf3f100 gave the shut card its rule for an earlier round); not changed again; with Brandon.
- R8-1 issue 7 and 8 (minor), step 1's field rhythm, the two columns' left edges and Continue's place across steps; issue 9 (minor), the controls row close above the brand: it cannot go higher without touching the window's edge.

Waiting for Brandon, put to him in Status 123 and shown where they play in the film in Status 124:

- R8-1 issue 6 in part and R5-1 issue 3 (major): the touch page ends the visit. It shows a link the moment `links.portfolioWork` is set; a way to the film from that page is not in the kit.
- The five design points the web page and story seats rest their scores on: step 2's three empty fields, step 3 opening with no word on what to do, Submit alone under the card on step 4, the perk card's face before a touch, the words of the skip link.

## Declined

Logged under "Declined issues" in `kit/PROGRESS.md`, each with the critic's words, each Brandon's to overrule:

1. R8-1 issue 1 (major): step 3 at rest says nothing of what to do. The approved `loader-page.png` and `kit/02-SUBJECT.md` give its layout; the page starts by itself.
2. R8-1 issue 2 and R5-1 issue 2 (major): Submit's place on step 4. The approved `boss-fight.png`, `boss-down.png` and `boss-stages.png` put the card at the top left and Submit's socket at bottom centre.
3. R8-1 issue 3 and R5-1 issue 1 (major): step 2's three empty fields, and step 2 at rest repeating step 1. The approved `step2-rest.png` shows them so.
4. R8-1 issue 5 (major): the words of the skip link are `copy:live.skip`, Brandon's.

## What comes next for the unit

Merge 44 (the slide, the strips, the touch page's header, the pack tool), with the tests, the build, the take's check, the browser checks and the published site; then round 23, polish round 2 of 2, on the merged commit with new packs from clean checkouts and the families rotated again (R4 GLM, R5 Kimi, R8 GPT), started only while the clock prints `extra rounds: yes`. By Brandon's note 4 a round limit does not close the loop below the bar: the state is shown to him as below the bar in every status, and the work on it goes on unless he says to move on.
