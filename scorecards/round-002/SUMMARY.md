# Round 2, blockout (critic R4)

- Judged commit: 125609b (the same code as dc7215c, from which the pack was built: 29 files in three sets, 274 s).
- Started 2026-11-25T11:31Z. Critics asked 11:45Z. Answers in by 11:46Z. Key released 11:48Z.
- Pass bar: every critic at least `quality.blockoutPass` (7), no severe issue, no red measure of M1, M4, M5, M6, M7, M9, M10.
- Result: NOT PASSED. Scores 8, 7, 6. Two severe issues from one critic, both on the pinball machine's close cameras. Measures of the pass bar all green.
- This was round 2 of 2 (`quality.blockoutMaxRounds`). R4 blockout closes at its limit. Kit/07: the build kept is that of the best judged round, plus later fixes only while the machine checks and measures stay green.

## Scores

| Critic | Family | Set | What it saw | Score | Severe | Major | Minor |
| --- | --- | --- | --- | --- | --- | --- | --- |
| reviewer-01 | GPT | A | six pages at rest, type at real size, the live screen, the film screen, the controls | 8 | 0 | 3 | 0 |
| reviewer-02 | GLM | B | nine sheets across the film | 7 | 0 | 5 | 0 |
| reviewer-03 | Claude | C | seven sheets of step 1's beats, the ten pinball cameras | 6 | 2 | 7 | 3 |

Merged score: 6 (the lowest of the three). Round 1 was 7, 7, 7 with one severe issue; the families were turned one set on for this round.

## Measures at the judged commit

- MEASURED: 40 green, 5 red, 6 not yet. M1, M4, M5, M6, M7, M9, M10 are green on all six pages and on the film. The file is `measures.txt`.
- Red: M3 (fine detail against the approved image) on step 1, step 2, the pinball machine and the boss, and M8 (bare floor) on the pinball tiers. Not yet: M2 (texture) on six units. All three measure materials, detail and density, which the blockout does not have; they are carried to the look lock and are not part of the blockout's pass bar.

## Every issue, with its owner or the reason it is declined

| No | Critic | Weight | Where | Issue in short | Ruling |
| --- | --- | --- | --- | --- | --- |
| 1 | reviewer-03 | severe | pinball camera 9, `table-save` | A high three-quarter view of the whole tier; no flipper near the ball, so the save does not read | `pinball_fixer`, first: low over the apron as approved `last-save.png`, a flipper up at the ball at the key's moment |
| 2 | reviewer-03 | severe | pinball camera 6, `table-lobby` | A plain tower block fills the right half; no doors can be told apart | `pinball_fixer`, second: low on the carpet in front of the doors as approved `lobby-doors.png`, two door leaves that stand open and then shut, the name plate over them |
| 3 | reviewer-03 | major | pinball camera 5, `rail` | The ball sits on the flat playfield with the ramp behind it; the cursor sits on the ball, not in it | `pinball_fixer`: the ball on the wire ramp at the key's moment, the rails running ahead. The cursor inside a clear ball is material work: carried to Phase 4 |
| 4 | reviewer-03 | major | pinball camera 1, `table-wide` | A dark block hides most of the title board | `pinball_fixer`: the whole board clear above the Corporate tier, as approved `table-wide.png` |
| 5 | reviewer-03 | major | step 1, beat 1, 0:14.53 to 0:14.90 | Two or three cursors show as the page settles | Open item for the look lock: they are the hard shadows the two lights throw from the cursor while it is set down from the height of the page turn. Light and shadow are not built yet |
| 6 | reviewer-03 | major | step 1, beat 2 | The placeholders do not show what happens to the keys; 8 s for one word | `step1_fixer`: turrets that aim, bolts that read, the dodge, the duck, the cocky pause and the hit spaced through the beat. The beat keeps its 8 s: the narrator's two lines fill it |
| 7 | reviewer-03 | major | step 1, beat 6, 0:36.57 to 0:40.53 | The resume hangs in almost one pose for about 4 s | `step1_fixer`: the paper goes down in clear steps, no pose held longer than about a second, as kit/01 says: "the shredder winning inch by inch" |
| 8 | reviewer-03 | major | step 1, the small lines by First name and over the keyboard | Too small and faint to read at delivery size | No change now. MEASURED at 1920 by 1080: the smallest type of step 1 is 18 px (least allowed 14) and its least contrast 5.22 (least allowed 4.5), M4 green. The critic read the lines in a sheet cell a fifth of that size; set A showed them at real size and its critic raised nothing on them. Open item for the look lock, whose type is judged at real size |
| 9 | reviewer-03 | major | step 1, beat 4, 0:32.60 to 0:33.50 | The "Invalid email" toast drifts over Backspace and the field and leaves trailing lines | `step1_fixer`: it is a heavy slab that falls (kit/01), not a toast; each fall straight, with its shadow, a settle and no lines left behind. The fix asked for, a toast fixed under the field, is not taken |
| 10 | reviewer-03 | minor | step 1 at rest, 0:43.27 to 0:45.30 | The lower 45% of the page is empty | DECLINED: approved `step1-fire.png` shows the form in the upper half and the keyboard standing in the lower half |
| 11 | reviewer-03 | minor | step 1, 0:34.17 | A seam line and floating key labels as the keyboard goes | `step1_fixer`: the deck, the keys and their labels sink as one body |
| 12 | reviewer-03 | minor | pinball camera 10, the map | The plates are too small to read at map scale | No change: the map is drawn 1080 by 1920 and the pack showed it at 0.73 of that. The printed layer and its plates are built in Phase 4; open item there |
| 13 | reviewer-02 | major | pinball, 1:16.13 to 1:17.93, the launch | The cursor covers the ball; the first shot shows a short stretch of lane and not where the ball is headed | The framing to `pinball_fixer`: low and behind, the lane ahead in the picture from the first frame. The cursor over the ball: DECLINED as asked, it rides sealed inside a clear ball (a stated choice, approved `clear-ball.png`); the clear ball itself is Phase 4 |
| 14 | reviewer-02 | major | pinball, 1:32.53 to 1:41.67, the street tier | The commentary sits against the bottom edge and is partly cropped | `pinball_fixer`: the tier's whole card inside the frame with a margin, M6 kept green |
| 15 | reviewer-02 | major | boss, 1:55.93 to 2:04.30 | A second dark pill stays where Submit was and gets rays; it is not clear which one to chase | `boss_fixer`: the socket drawn as a hole, sunk, darker than any button, with short uneven cracks, as approved `boss-fight.png` |
| 16 | reviewer-02 | major | step 1, 0:16.77 to 0:23.73 | The first name grows a few letters at a time over one composition | With issue 6 |
| 17 | reviewer-02 | major | boss, 2:05.67 to 2:15.40 | The interruptions get equal weight; no escalation toward the collapse | `boss_fixer`: the first shield alone with setup and payoff, the next ones faster, the hit, then the last stand as its own moment; still one attack readable at a time |
| 18 | reviewer-01 | major | step 3 at rest | No cue for how to start; the lower shape runs off the screen | DECLINED: approved `loader-page.png` shows this page so, with the heading and its lines at the left, the loader port at the right and its tube running off the first screen; the port is the cue. Settled in round 1 |
| 19 | reviewer-01 | major | step 4 at rest | Submit floats at bottom centre, far from the card | DECLINED: approved `boss-fight.png` and `boss-down.png` show the socket there. Settled in round 1 |
| 20 | reviewer-01 | major | step 2 at rest | The labels hug the left margin and the controls begin across a wide gap | DECLINED: approved `step2-rest.png` shows the three labels with their lines at the left margin and the three controls at the right edge |

## What changes next

- Three build agents started at 11:55Z with a limit of 40 minutes: `pinball_fixer` (issues 1, 2, 3, 4, 13, 14), `step1_fixer` (issues 6, 7, 9, 11, 16) and `boss_fixer` (issues 15, 17). Each must leave the take, the beat times, the bots and the measures as they are.
- What they push is merged only after the type check, the tests, the bots, the take check, the cut and the measures hold on main. What is not pushed and checked by 12:40Z is not merged.
- Every severe and major issue still open then is written under "Open items" in `kit/PROGRESS.md` for its phase: step 1 to the look lock (Phase 3), the pinball machine and the boss to Phase 4.
- There is no round 3: the limit is two. The film preview of this phase is rendered from the build as it stands after these fixes.
