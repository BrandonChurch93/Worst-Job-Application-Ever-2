# Round 26, unit `site`: a polish round past the round limit, stopped by Brandon's change note 002

Judged: main at 2ce6ca9d, whose site code is merge 54 (3322a0f2; engine hash 7cd3b37117ec03b3). Started 2026-11-27T18:16Z. Stopped 2026-11-27T20:01Z, when change note 002 from Brandon, by Partner, arrived (it is pasted whole in `kit/PROGRESS.md`). The note cuts or rebuilds most of what this round judged: the last name field and its keyboard, the playable pinball view, the look of the careers page and of the boss. So the round is closed here without its motion critics, and it is not passed.

## Scores

| Critic | What it saw | Model family | Score | Severe | Major | Minor |
|---|---|---|---|---|---|---|
| R2 | the jury pack; all 25 pictures byte equal to round 25's (MEASURED by sha256), so no juror was asked and round 25's answers stand | carried from round 25 | pass by rule | 0 | 0 | 0 |
| R5-1 | story and look, the whole site on sheets | GLM | 8 | 0 | 2 | 0 |
| R8-1 | the site as a web page, nine sheets byte equal to round 25's | Claude | 7 | 0 | 6 | 4 |
| R4 sets A to F | motion | Claude, GPT, Kimi, GLM, Kimi, GPT (set before any answer) | not asked | | | |

All scores are STATED by the critics. Not passed: R5 and R8 are under 9 with major issues, and R4 was never asked.

## Machine checks and measures

MEASURED by the Builder's chain in `wja-merge` on 2ce6ca9d, each from the chain's log with its exit code: `looks.mjs under` exit 0 (19:47:49Z); the six shadow looks at the low level, each exit 0 (19:49:16Z to 19:55:19Z); the dark look exit 0 (20:00:42Z). G15 started at 20:00:42Z and was let run as a last record of merge 54; its result is in the decision log when it ends and is not part of this summary.

Measures, MEASURED: `pinball` at the final tier, 10 green, 0 red, 14 judged stills, twice (the Builder's run 18:16:14Z to 19:15:28Z for M2 and M3; `r26_measures` 19:25:31Z to about 20:02:00Z for all ten). The other five pages and the film were NOT run on this build: UNKNOWN.

## The motion pack

`r25_fix_pack` built all six sets (60 sheets, exit 0) on `agent/pack-frames2` at 2c358d60, ending seconds after the stop. No one looked at a composed sheet and no critic was asked. Its check `pipeline/phase5/pack-frames-check.mjs` printed 50 lines ok on its run (STATED by the helper). The pack's windows are tied to the old visit; the change note rebuilds the pages it shows, so the pack is not used.

## Where the twelve issues went

Ruled at 19:50Z, before the stop, in the decision log: R8 issue 5 (the field rhythm on step 1) taken; R8 issues 1, 3, 6, 8, 9, 10 and R5 issues 1, 2 declined; R8 issue 4 split (the grey declined, Continue at two heights held as an open item); R8 issue 2 contested; R8 issue 7 an open minor.

After the change note: R8 issue 5 and the open item of Continue's two heights are moot, because steps 1 and 2 are rebuilt as one field at a time (note item 12). The points on the careers page and on the boss wait for Brandon's pick from reference round 7 (note items 16 and 17).

## Helpers at the stop

- `r26_fix_view` (`agent/polish-sight`, 4744f1bf): the Street's view leads the ball in live play. Not merged: the live, playable pinball view is replaced by a film the visitor watches (note item 8).
- `r26_fix_form` (`agent/polish-form`, 3e9b73a9): the field rhythm, unfinished. Not merged; its measured distances of label, pocket and helper are kept for the single field stages.
- `r25_fix_pack` (`agent/pack-frames2`, 29e6e5ff): the motion pack's maker. Not merged; its notes are kept for the next pack.
- `r26_measures`: no change to the repo.

Written 20:12Z.
