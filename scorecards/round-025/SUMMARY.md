# Round 25, unit `site`: a polish round past the round limit, on the whole live site

Judged: the site build of merge 47 (main ce259d65). The packs of R2, R8 and R5 were built by the Builder in the merge tree at ce259d65 (11:30:50Z to 11:47:11Z); the pack of R4 was built by `r25_fix_pack` on d6fe4a6b (10:45:03Z to 11:20Z), whose engine hash 78a7b4a43470fdd9 and shared hash ecc0c035659847ab equal the Builder's. Started 2026-11-27T10:37Z, when the judged hash went to the pack helper; past `quality.polishMaxRounds` (2, reached with round 23); begun inside continuation 2 of the clock and closed under continuation 3; by note 3 of "Notes from Brandon", point 4. The families were set at 11:33Z, before any critic was asked (the first at 12:47Z). The keys and the packs' plans went into this folder at 18:46Z (3a91a1cf), after the last answer (16:10Z).

Said plainly about the record: the round's line under "Rounds" in `kit/PROGRESS.md` was written late, at 19:17Z with this summary. Its number and judged commit stood in the decision log from 10:40Z (pushed in b6a45f41) and 11:33Z (eae5eba6), before the first critic was asked, and not in that section, where the kit wants them first.

## Scores

| Critic | What it saw | Model family | Score | Severe | Major | Minor |
|---|---|---|---|---|---|---|
| R2 | the jury: the six stills drawn through the live site's path. 24 of the 25 pictures are byte equal to round 24's; five fresh jurors were asked on the one that differs, step 3's page at rest (`set-A-04.png`) | GLM, Kimi, GPT, Claude, GLM on that picture; round 20's jurors on the rest | passes by the rule's arithmetic, 0 of 30 against 0 of 50 | | | |
| R4-1 | motion, set A (9 sheets): the arrow walked across a page, one page turn on three sheets, the page seating on four sheets at every sixtieth of a second and at real size, a bolt hitting the arrow | Kimi | 6 | 0 | 3 | 1 |
| R4-2 | motion, set B (10 sheets): a key pressed and let go, the page takes the arrow on four sheets, gives it back on four | GLM | 7 | 0 | 4 | 0 |
| R4-3 | motion, set C (6 sheets): the arrow into the ball, the ball let go and dropping on four sheets, the ball leaving the port | GPT | 6 | 1 | 2 | 0 |
| R4-4 | motion, set D (7 sheets, a new set): the save on three sheets at every sixtieth of a second, a flipper stroke on two, the blow close on two | Claude | 6 | 1 | 2 | 3 |
| R5-1 | story and look (10 sheets): the six pages at rest, the screens with the controls, a visit on sheets, the machine tier by tier | GPT | 9 | 0 | 1 | 0 |
| R8-1 | the site as a web page (9 sheets): the six pages at rest, the controls on, the touch page and the controls at their real size | GLM | 7 | 1 | 5 | 0 |

Together: 3 severe, 17 major, 4 minor. All scores are STATED by the critics.

Not passed. The pass is the machine checks green including G15 to G18, the measures green, R4, R5 and R8 each at least 9 with no severe or major issue open, and R2 by its rule. The lowest score is 6 (R4-1, R4-3 and R4-4). Round 24 scored 7, 6 and 7 for motion, 7 for story and look and 7 for the web page, with 1 severe, 16 major and 9 minor. The story and look seat reaches 9 for the first time (rounds 22 to 24: 8, 8 and 7); the motion seats do not rise.

## Machine checks and measures

The merge's own chain is green on this site (MEASURED on the merge tree e991c107, 10:05:45Z to 10:24:39Z, every step with exit code 0): `npx tsc --noEmit`; the whole tests, 165 files passed and 10 skipped, 2077 tests passed and 11 skipped, none failed; the build; the sim cache; the cut list check; the mix (sha256 d887bafb60acc8d7); the take check; the same picture twice check on 12 pictures; the bots all clear with 37 gags.

Not run on this build, so this part is not ticked: G15 (memory), the look under load, the six shadow looks and the dark look. They were last run on the candidate of merge 46 (c817385d, round 24's build: G15 692.0 of 700 MB at hd, 2045.7 of 2400 MB at 3840x2160). They are owed on main before round 26's machine checks count as green.

The measures were not run by the Builder on ce259d65. Last MEASURED at round 24: the five pages 8 green and 0 red each; `pinball` 8 green and 2 red (M2 `youre-fired`, soft share 1 against 0.02; M3 `rail-cam`, 0.5365 against 0.8). `r24_fix_sharp` STATES the two lines green since merge 47 (M2 0.0093, M3 0.9355). Only the Builder's run counts; it is under way on main with merge 54 (started 18:16:14Z) and belongs to round 26.

## R2, the jury

24 of the 25 pictures of the jury pack are byte equal to round 24's and so to round 20's (MEASURED by sha256). `set-A-04.png`, step 3's page at rest, differs because the tube at its foot was mended after round 24. Five fresh jurors, each in its own sandbox with that one picture and the kit's question, were asked at 16:09Z and had answered by 16:10Z: d 98, d 92, d 98, d 85, d 99 (STATED). Round 20's 25 answers on the other five pictures and the controls' 50 votes stand (`R2-1.json` holds the carry and every answer). It passes by the rule: 0 of 30 answers (a) or (b) on the judged pictures against 0 of 50 on the controls. Said plainly beside it, as before: 28 of the 30 answers put the live pages in class (d) and 2 in class (c).

## The three severe issues

1. R4-3 issue 1 (`set-C-05.png`): the port's rim and the tube's bands slide up the window while the ball is still in the tube, read as a camera that follows down the page. Declined: the kit sets that move (`kit/03-METHOD.md` line 397: the scene moves the view down the page after the ball). The next pack's headings state the fact in the kit's own words (decided 13:23Z).
2. R4-4 issue 1 (`set-D-05.png`): the ball slides onto a "white bumper" and covers it. What the critic took for bumpers are the three round lamp windows above the bats, flat glass in the floor that the ball is meant to roll over (`kit/02-SUBJECT.md` lines 320 and 395). Round 21's critic read them the same way, so the fault is real and is in the look. Not declined: mended by `r25_fix_lamps` in merge 52 (below).
3. R8-1 issue 1 (`set-A-04.png`): step 3 at rest gives no instruction and no way to start. Declined: the approved `loader-page.png`; it is Brandon's design point 3 and is with him.

## Where the issues went

Mended, on main (merge 50 at 13:37Z, merge 51 at 14:22Z, merge 52 at 15:42Z, merge 53 at 16:38Z, merge 54 at 17:25Z, by the merge commits' times) and on the published site, which holds merge 54, each seen by the Builder on pictures before it was accepted unless it says "numbers only":

- R4-1 issue 2 (major), the leaving page darkens while it still stands flat: `r25_fix_turn`, merge 52. Under 2 degrees the face keeps its rest light; the first frame darker than rest by more than 3 is frame 11 at 8.99 degrees (before, frame 8 at 1.75 degrees) (STATED). The film has six page turns, not five; the sixth came with merge 53.
- R4-2 issue 3 (major), the paper creases before the hands reach it: `r24_fix_tug`, merge 51. The sheet stays smooth until the hands are at its corners (live pictures 1884 to 1887 smooth, first crease on 1888; film frames 2162 to 2168 change and no other).
- R4-3 issue 2 (major), the capture reads as a loading animation: `r25_fix_port`, merge 52. Two glass halves rise out of the cup's floor after the seal, come in and shut 15 frames later, and the whole ball stands on the 16th (film frames 4159 to 4174). Left minor and open: the halves stand free on the cup's floor and are not joined to it.
- R4-3 issue 3 (major), the ball drops at one even pace: `r25_fix_port`, merge 52. The ball's step grows from 0.27 px a frame by 0.543 a frame to 24.70 (before, a top of 16.50 after ten frames, then shrinking) (STATED). The tube answers the ball at each bend with a knock of about 2.5 to 3 px; nobody has judged the knock in motion.
- R4-4 issues 1 (severe) and 2 (major), the lamp windows read as bumpers that swallow the ball: `r25_fix_lamps`, merge 52. A window keeps its colour and drawing until the ball is on it and rises over four frames, so the single bright frame is gone; a soft shade with no edge lies round the ball and goes with it; at three times the ball's rim is a whole ring that stands off the glass. No round 12 number changed. The change of the ball's speed that issue 2 counts on the frame of the bat's blow was not measured apart. Contested and left: the white window is blank white at its full level (round 12's hit level).
- R4-4 issue 3 (major), the saved ball stops dead on the wire and sits about 14 frames: `r25_fix_save`, merge 52. The ball is deepest on the frame after it lands and comes a little way up, the wire is drawn down with it before the kick, the hold is 14 steps in place of 26, and the ground stands at one height through the hold.
- R4-4 issue 4 (minor), the wire flickers between a thin line and a rail after the kick: `r25_fix_save`, merge 52. The wire swings through once, back once a little and stands about ten frames after the kick (before, edge on three times and still moving on the fifteenth frame).
- R4-4 issue 5 (minor), the view slides suddenly as the ball is thrown and springs back 7 px: `r25_fix_save`, merges 52 to 54. The view stands still through the hold and stays lowered while a struck ball is low; before a save it goes down in one move (it went in four pieces); the one-frame jerk of 48 px on an outlane rail and the run of a whole tier on a shut outlane are gone. The last two are shown in numbers only (a sweep of 20 visits: 1 one-frame jerk before, 0 after, run by the helper and by the Builder); no browser path reaches those visits.

Mended in part, the rest contested by rule 6 (a fix would undo a change made for an earlier round) and logged under "Open items":

- R4-1 issue 3 (major), nothing on the sheet reads as a turret firing a bolt: `r25_fix_keys`, merge 52. The turret now winds back and kicks 22 px on the shot frame, with its barrel sliding in a sleeve; the bolt's light on the keys is shorter. The sheet itself was at fault as well: it held frames 893 and 895 to 913, and the shot is at 870, so the critic could not see the shot; the next pack's sheet starts six frames before the turret cocks and shows every frame. Contested: the bolt's body, halo and flash (Phase 3, rounds 4 and 5).
- R4-2 issue 1 (major), the arrow and the paper hold a pose for three frames and then step: the hold and step of the arrow's flinch were already out in 9d45feeb (merge 50), which the pack was drawn before. Contested: the near stillness between the arrow's arrival and the paper's first answer (set for round 24).
- R4-2 issue 2 (major), the given back arrow stays parked though the mouse moves: `r24_fix_tug`, merge 51, for the visitor's hand only: the arrow takes a small breath on the handoff frames (69 px long at rest, then 73, 77, 75, 71, 70, 69). Contested: the stand before it follows the visitor again (set for round 22).
- R4-2 issue 4 (major), a key press reads mostly as a darkening: `r25_fix_keys`, merge 52. The pressed key's well takes a shade and a ring on the live site. Contested: the depth and shade of the press itself (set for round 23).

Open:

- R4-1 issue 1 (major), the hit on a key has no weight: not changed by this round's fix. The helper saw no difference at real size and the Builder sees none in its tiles. Contested with it: the struck key's dip (round 22 let it sink, round 23 took it out) and the light a hit throws (round 23). Carried.
- R4-4 issue 6 (minor), the ball runs off the top of the window for two frames at the top of its rise (`set-D-04.png`, 2:06.57 to 2:06.60). Ruled at 12:59Z to be the pack's framing. That ruling was wrong, set right at 19:14Z: the window holds the screen's whole height, so the critic saw the ball leave the visitor's screen. On the Street tier the live view stands 91 px below the tier's upper edge (since Phase 2, for the apron's card), and a ball struck up the table goes out of sight there for 5 to 14 frames (STATED by `r25_fix_pack` from its visit: 10 stretches in one visit; seen by the Builder on this sheet). In work by `r26_fix_view` since 19:01Z on `agent/polish-sight`; merged after round 26 is judged.
- R8-1 issue 2 (major), the touch page offers nothing to do: waits for Brandon (his portfolio's address for the link, and whether he wants a way to the film there; the kit holds none).
- From the fix passes, each logged as an open item: the view dips about 50 px in four frames at the launch (older than this round, left to go before round 26's critics as it is); under a tow at the Office's open gate the save's room starts back two or three frames early (contested); the arrow inside the ball takes its new heading in one frame at the kick (by ruling); the ball's rim is not darker than a lamp window's glass all the way round; the page's small lean back before a turn reads as a hairline; a leaving page casts no shadow of its own; the sheet drops a little on the frame the shredder bites.

Answered by looking, with no change:

- R4-1 issue 4 (minor), a small arrow shaped mark in the ticker: it is the trade mark sign that line 118 of `content/copy.json` holds after the quoted line, drawn as written.

Contested, waits for Brandon:

- R8-1 issue 5 (major), the perk cards' rule over an empty lower part. The face was changed once for a critic in round 22; by the rule it is not changed again. His design point 1.

## Declined

Logged under "Declined issues" in `kit/PROGRESS.md`, each with the critic's words, each Brandon's to overrule:

1. R4-3 issue 1 (severe): the view goes down the page with the ball. The kit's stated move (`kit/03-METHOD.md` line 397).
2. R5-1 issue 1 (major): step 4 at rest, the card at the upper left and Submit alone leave the middle unfinished. The approved `boss-fight.png`, `boss-down.png` and `boss-stages.png`; design point 4.
3. R8-1 issue 1 (severe): step 3 at rest gives no instruction. The approved `loader-page.png`; design point 3.
4. R8-1 issue 3 (major): Submit alone at bottom centre, not on the line of Continue. Design point 4.
5. R8-1 issue 4 (major): step 2's three blank wells. The approved `step2-rest.png`; design point 2.
6. R8-1 issue 6 (major): the words of the skip link. They are `content/copy.json`'s words; design point 5.

## What this means for the bar

The story and look seat is at the bar: 9, with its one major issue tied to a design point that is Brandon's. The web page seat stays at 7 for the third round, and every one of its six points is one of his five design points or waits on his word; while they stand that seat cannot reach 9 with a critic that weighs them. The motion seats are the distance that is the Builder's: 6, 7, 6 and 6. Of their 13 severe and major issues, one is declined, seven are mended, four are mended in part with a contested rest, and one (the hit's weight) is not moved. Of their four minor issues, two are mended, one is answered and one is the ball leaving the screen, in work. None of these mends has been before a critic yet. Under rule 6 the contested rests cannot be changed again by the Builder; they are listed for Brandon.

One more thing this round shows about the Builder's own work: a critic's minor issue was read as a fault of the sheet when it was a fault of the site (R4-4 issue 6). From round 26 on, a critic's word that something leaves the window is checked against the screen's own edge before it is ruled.

## What comes next for the unit

Round 26 on main with merge 54 (3322a0f2), by Brandon's note, point 4: the motion seat on six sets from `r25_fix_pack` (the pages, step 1 struck and handed back, step 1's paper, the port and the tube, the tube in the film with the launch and the view at a save, the bats), the story and the web page seats on new packs, the jury only on pictures that differ, the families rotated. The sheets show what the visitor's screen shows, and no known fault is told to a critic. After its answers: merge 55 with `agent/polish-sight` and the mends of what round 26 names.

By Brandon's word of 12:10 PM MT on 2026-11-27 (relayed by Partner, quoted under "Notes from Brandon"): he is preparing changes to the experience and a new narrator's script. Until they arrive, faults come first, a wish about how a step plays is held as an open item, and nothing that fixes the present experience in kept files (the kept stills, the kept review cut, the gate, the review stop, the final render) is started. The state is shown to him as below the bar in every status, and the work on it goes on unless he says to move on.
