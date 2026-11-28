# Unit boss: how the boss plays (change note 002, item 15)

Branch `agent/b-boss`. Files: `src/boss/*`, `src/pages/step4/*`, `tests/b-boss.test.ts`, `tests/boss.test.ts`, `pipeline/change002/boss-*.mjs`, this file. Every tuned number is in `src/boss/tune.ts`, named, one line each. The older notes of the page are in `src/pages/step4/NOTES.md`; where they differ, this file wins.

Words used below: MEASURED means a command was run and the number is its output; STATED means it follows from the code and was not measured; UNKNOWN means neither.

## The switches

| Switch (in `src/boss/tune.ts`) | Now | What it does |
| --- | --- | --- |
| `LOOK1_ON` | `false` | `true` draws LOOK 1 (`src/boss/look1/*`) and the arena (`src/arena/*`) in place of the plain stand-in, and takes the boss's measures (`SHAPE`) from the look. See "LOOK1_ON as seen". |
| `POPUPS_ON` | `false` | `true` brings the three pop-ups back. Off, the event `popup` is still sent at the second the first pop-up would open, because the film's beat `boss.popups` hangs on it. |

## The rules as built

A. The shield. A dart on the shield takes `GUARD.chip` 0.005 points (`shield-glance`); a dart that reaches the body takes `REAL_DART` 0.35, 0.18 or 0.2 points by phase (`shot-round`). After `GUARD.tellAfter` 6 darts in a row on the shield a lamp on the open flank lights (`weak-tell`), and again every 3 s.

B. The shield turns toward the arrow at `TRACK.turn` 1.05 rad/s, falling to 0.4 of that over 60 s of fight, and holds still 0.95 s from the wind-up of each of the boss's own shots. The boss walks: first after 2 s, then every 3.4 s, one leg of at most 1.5 s at 190 px/s (`boss-move`), inside `MOVE.fence`.

C. Bullets, 28 px across. The boss's two guns after a tell of 0.6 s; four cannons in the four corners of the whole screen (`CORNER.at`), one every 5 s after a tell of 0.9 s (`cannon-tell`, `cannon-fire`), 540 px/s. The big turret rises 0.15 s after the body is whole and locks 1.6 s later (`turret-rise`, `turret-lock`); nothing can hit the visitor before the lock. Its blast: a line on the ground for 1.6 s (`big-tell`) while the boss and its shield hold still, then 130 px across for 0.3 s (`big-fire`), first at 7.4 s, then every 13 s, and once more 0.6 s after the banner of the last stand (not in the film). No blast line crosses x 560 to 1360, y 0 to 170. Pillars, panes and the bar's box stop bullets and darts; a blast breaks what it crosses (`arena-break`, `pillar-break`, `pane-shatter`, `cover-hit`).

D. A hit lays the arrow flat for 0.7 s (`flatten`), it peels up by 1.4 s (`peel-up`) and nothing can hit it for 2.1 s. The boss wins health back 0.35 s after the hit (`boss-heal`): 6 points the first time, then 0.6 of the one before each time. The visitor has no health bar and cannot lose.

What stops the boss from healing for ever: the heals are a falling row, 6, 3.6, 2.16, and so on, whose sum is under 6 / (1 - 0.6) = 15 points however often the arrow is hit (STATED from `HEAL`; tested in `tests/b-boss.test.ts` "D. gives back less with each hit"; MEASURED in the tables below: the most any bot's boss won back in 200 seeds). A real dart is worth more from 35 s on (`WEAR`: twice as much every 20 s), and from 60 s on the shield lets a share of each dart through (`MERCY`), so the visitor who stands and clicks wins too.

E. The visitor who does nothing: after `live.idleSeconds` without a shot the phases run out by the clock, 5 s each (`IDLE`). The skip link ends the fight at any moment.

The mouse: the arrow follows the pointer and a click shoots, as before (the KEEP of the brief). Nothing of that was changed.

During the fight the header is off the screen (`PageLogic.chrome`), the heading, the card and the fine print slide off, and the health bar stands alone at the top at `TOP.bar` 86 px with `TOP.clear` 24 px kept clear under its box. The word Submit does not move on the button.

Before the fight: line 6 at the tick, line 7 when the boss is formed (`boss-formed`), the arrow may turn away (`boss-turn`), the music (`boss-music`), the gold builds for 2 s (`power-up`). After the fight: see "The finish and the last moment".

## The finish and the last moment

All seconds from the end of the boss's fall (`boss-fall` + `FINISH.fall` 1.0 s). One table, `SHOUT`, holds the marks of the shout and is the one object to swap when the take is picked: `arms` 0, `beats` 0.1, 1.04, 2.09, 2.9, `fire` 4.13, `gone` 6.26.

| Mark | Event | Film, s of the unit | What happens |
| --- | --- | --- | --- |
| fall | `power-down`, `turret-off`, `boss-fall` | 49.77 | the boss falls for 1.0 s; the page takes the arrow and walks it to `LAST.stand` (440, 650); the view comes in to `CLOSE` (x 300 to 1260, y 270 to 810) |
| arms | `finish-arms` | 50.77 | the arrow's arms come out |
| charge | `finish-charge` | 50.87, 51.81, 52.86, 53.67 | one unbroken build; a step up on each mark |
| fire | `finish-fire` | 54.90 | the blast, held 2.13 s |
| gone | `boss-gone` | 57.03 | the body is gone |
| walk | `finish-walk` | 57.43 | 0.4 s later (`LAST.wait`) the arrow sets off for the button: 2.8 s for the 320 px |
| | `button-down` | 58.43 | the button has settled on the ground |
| knees | `finish-kneel` | 60.23 | 0.7 s down, then 0.6 s of breath in the film, 0.3 s on the live site |
| fist | `finish-fist` | 61.53 | the start of the raise: 0.6 s up, 0.3 s down |
| blow | `finish-press`, `button-press` | 62.43 | the step the fist lands: the blow is the press of Submit |
| | `page-turn` | 63.10 | |

MEASURED: `node pipeline/change002/boss-film.mjs --every 0.5`. The seconds between the marks are the Builder's of 00:36: arms to the first charge 0.1 s; `boss-gone` to the walk 0.4; the walk 2.8; kneel to fist 1.3 in the film and 1.0 on the live site; fist to press 0.9; the film holds 0.5 after the blow.

Live site. The visitor holds the button to charge and lets go to fire; a plain click fires a quarter blast (`FINISH.small`); a button still held 0.8 s past the full charge fires by itself; with no press the blast goes by itself, full, 6.0 s after the arms. Any blast ends the boss. After `boss-gone` the arrow walks where the visitor leads it, inside `CLOSE` less 40 px, at 114.3 px/s, from 0.4 s after `boss-gone`. A click on the button starts knees, fist and blow: 1.0 + 0.6 + 0.3 = 1.9 s, then 0.35 s held. With no move and no press for 6 s (`LAST.alone`), or after 20 s of being led (`LAST.led`), the arrow walks to the button by itself in 2.8 s at most and does it. The skip link presses at once.

The four marks `finish-walk`, `finish-kneel`, `finish-fist`, `finish-press` lie inside the beat `boss.finish`; the walk has no beat of its own. The power-up keeps its own event `power-up` as its mark.

How the arrow and the light look in the power-up and the finish is the finish helper's (`src/cursor/stand/*`, `src/boss/finish/*`, mail of 00:01). What is drawn now is my stand-in: the arrow's own arms through `PageLogic.arms`, a ball, a beam, a scorch. It was not polished further.

### The hand during the finish (`live.controlTakenMaxSeconds` is 8 and was not changed)

MEASURED at 89179ba3: `node pipeline/change002/boss-spans.mjs`, seed 20261124, seconds from `boss-fall`.

| Visitor after the fall | arms | fire | gone | kneel | press | page left | longest time not obeyed, as the stage counts it with `PageLogic.led` |
| --- | --- | --- | --- | --- | --- | --- | --- |
| the keen bot | 1.00 | 1.24 | 3.38 | 6.59 | 8.50 | 9.35 | 2.76 s |
| nobody | 1.00 | 7.00 | 9.14 | 17.97 | 19.88 | 20.74 | 2.76 s |
| holds the button and stays | 1.00 | 5.84 | 7.97 | 30.81 | 32.72 | 33.57 | 5.20 s |
| stands and clicks four times a second | 1.00 | 1.21 | 3.25 | 26.08 | 27.99 | 28.85 | 5.20 s |

Before 89179ba3 the first two rows read 4.28 s and 5.13 s, and `tests/site-loading.test.ts` ("hands the cursor back within live.controlTakenMaxSeconds for every bot when every turn is held for the whole wait") was red with "keen: expected 8.775 to be less than or equal to 8". Now a click on the button while the arrow still walks is only a wish: the walk stays the hand's, and the arrow kneels when it has arrived with the wish and the button is down. The walk by itself after 6 s of a still hand gives way to a hand that moves or presses. Only the forced walk after 20 s (`LAST.led`) is counted as taken. MEASURED with that test: keen 4.24 s with no wait and 7.52 s with every turn held 4 s; clumsy 4.24 and 7.52; random and skipper 2.48 and 6.48.

With the hook (`led()` is true only where the hand or the button changes what happens, the Builder's bound of 00:19) the stretches that count as control taken are: the fall, 1.0 s; the blast and the wait after it, 2.13 + 0.4 = 2.53 s; and the end from the knees, 0.7 + 0.3 + 0.6 + 0.3 + 0.35 = 2.25 s and the turn (2.76 measured), or 5.20 s with the forced walk.

Without the hook the stage would count every step in which the page holds the arrow: from the fall to the page turn, 9.35 s for the keen bot and 20.74 s for nobody (the column "page left").

The longest stretch in which the place of the hand does nothing (fall, charge and blast together, the button still works in the charge): the column "gone". 3.38 s for the keen bot, 9.14 s for nobody (1.0 + 6.0 + 2.13), 7.97 s for one who holds the button down. After that the place of the hand leads the walk.

The body lets a taken arrow go by itself after 7.5 s (`src/cursor/body.ts`); the page takes it again on the next step. That is a crutch of the stand-in.

## Numbers from the bots

Step 4 alone, without rendering, pop-ups off, `LOOK1_ON` false. MEASURED at 84e223bc (the fight's rules have not changed since; the commits after it change the finish only):

`node pipeline/change002/boss-bots.mjs --seeds 200 --bots keen~,clumsy~,random --max 240`
`node pipeline/change002/boss-bots.mjs --seeds 200 --bots keen,clumsy,absent --max 240` (at 9224e167)
`node pipeline/change002/boss-bots.mjs --seeds 40 --bots still --max 240` (at 9224e167)

keen~ and clumsy~ follow the page's hint with a hand that differs by seed (speed, lateness, clicks a second). keen and clumsy are the stage's own bots, which play the same fight on every seed. random is the stage's random bot without the skip link. still walks to the fight, then stands and clicks four times a second. absent never moves and never clicks.

| Visitor | Seeds | Wins | Fight, s: shortest / middle / longest | Flattened: least / middle / most (all seeds together) | Health won back: middle, most (all together) | On the shield / round it (middle) | Big blasts: least / middle / most |
| --- | --- | --- | --- | --- | --- | --- | --- |
| keen~ | 200 | 200 | 23.3 / 31.9 / 48.9 | 0 / 0 / 2 (51) | 0.0, 9.6 (285.7) | 0 / 481 | 2 / 2 / 3 |
| clumsy~ | 200 | 200 | 48.0 / 60.6 / 76.6 | 0 / 0 / 3 (86) | 0.0, 9.6 (418.8) | 46 / 370 | 3 / 4 / 5 |
| random | 200 | 200 | 102.0 / 118.8 / 140.6 | 11 / 21 / 33 (4184) | 9.2, 15.0 (1794.1) | 42 / 187 | 6 / 7 / 9 |
| keen | 200 | 200 | 36.5 on every seed | 2 | 9.6 | 0 / 511 | 2 |
| clumsy | 200 | 200 | 53.8 on every seed | 1 | 5.6 | 0 / 420 | 4 |
| absent | 200 | 200 | 27.0 on every seed | 7 | 1.5 | 0 / 0 | 2 |
| still | 40 | 40 | 114.2 on every seed | 30 | 2.5 | 1485 / 2 | 8 |

Against the aim (mail on the plan): a keen visitor in 25 to 45 s: of the 200 keen~ fights 12 are under 25 s (shortest 23.3) and 5 are over 45 s (longest 48.9). A clumsy one in 45 to 80 s and never over 90 s: all 200 clumsy~ fights are inside 45 to 80 s. The visitor who stands and clicks wins inside about 150 s: 114.2 s. The big cannon 2 to 4 times in the middle keen~ fight: 2.

The most the boss won back in any fight is 15.0 points, shown to one place: the random visitor flattened 33 times; the sum of the row stays under 15 (`HEAL`). Where a bar already stands at the top of its phase the gain is cut, which is why the absent and the still visitor's bosses won back less.

What hit the arrow, mean per fight (the boss's guns, a corner cannon, the body, the big blast): keen~ 0.2, 0.0, 0.0, 0.0; clumsy~ 0.1, 0.2, 0.1, 0.0; random 2.5, 0.6, 17.8, 0.1. The random visitor is flattened mostly by the boss walking over it.

`npm run bots` (the whole site, the stage's bots): MEASURED at 1178a395: "bots: all clear", 20 visits finished, "keen reached every one of the 38 gags on every seed". Step 4 takes the keen bot 60.9 s and the clumsy bot 81.9 to 82.0 s, from the page's start to the page turn; the random bot and the skipper leave it by the skip link after 23.9 to 24.0 s and 21.3 s. Longest time the pointer is not obeyed in a whole visit: keen 4.78 s, clumsy 4.24 s, random and skipper 2.48 s (the limit is 8).

## The film

Unit `boss`, 63.6 s, 1908 frames at 30 a second (`UNIT_SECONDS` in `src/pages/step4/script.ts`). MEASURED at 5e4d3d76: `node pipeline/change002/boss-film.mjs --every 0.5`, `LOOK1_ON` false.

| s of the unit | Event |
| --- | --- |
| 3.80 | `checkbox` |
| 8.08 | `button-crack` (4.28 s after the tick) |
| 8.68 | `unfold` |
| 8.78, 9.08, 9.78 | `arena-split`, `arena-rise`, `healthbar-drop` |
| 10.975 | `boss-formed` (line 7 starts): the tick + `LINE6.after` 7.175 s |
| 29.10 | `boss-turn` |
| 31.90 | `boss-music` |
| 34.68 | `power-up` |
| 36.23 | `turret-rise` |
| 37.83 | `turret-lock`: the fight starts |
| 40.58, 41.48 | `cannon-tell`, `cannon-fire` |
| 42.19, 42.54, 42.89 | `flatten` (the one hit on the arrow), `boss-heal`, `peel-up` |
| 43.48, 45.09 | `big-tell`, `big-fire` |
| 45.83 | `popup` (no pop-up is drawn) |
| 47.40 | `session-expired` |
| 49.77 to 63.10 | the finish, table above |

Line 6 (the Builder's mail of 01:00). Line 6 is 11 words, 6.875 s at the narrator's 1.6 words a second, and starts on the tick; with the gap of 0.3 s line 7 may start 7.175 s after the tick. `LINE6.after` in `src/boss/tune.ts` is that number. In the film the forming's clock starts 3.575 s after the tick, so `boss-formed` is at 10.975 s. The tick stays at 3.8 s: with the tick at 3.0 s the held pull back of the doubt would go from 1.25 s to 0.45 s. The cost is 0.8 s of film. The arrow holds on the answer from 4.34 to 7.275 s. The crack is 4.279 s after the tick, 0.096 s before the phrase "takes that as a threat" starts (4.375 s); `LINE6.after` 7.275 would put it on the phrase and was not taken (no padding). On the live site the page holds line 7's clock at zero until the tick + 7.175 s, and the pointer stays the visitor's in that wait. MEASURED (seconds after the tick, the stage's bots): keen `boss-formed` +6.08, `boss-turn` +7.30, `boss-music` +11.22, `power-up` +14.00, `turret-lock` +17.15; clumsy +7.17, +7.45, +11.22, +14.00, +17.15.

Beats (config, as `NEEDS:` commits): verify 0 to 7, unfold 7 to 36.1, slabs 36.1 to 45.4, popups 45.4 to 47.3, lastStand 47.3 to 49.6, collapse 49.6 to 50.8, finish 50.8 to 62.4, press 62.4 to 63.6. Key picture `boss-fight` at 0.46 of `boss.slabs`, 40.38 s (at 0.5, 40.75 s, no dart is in flight: MEASURED, 0 darts and 6 sparks in that frame, 4 darts and 8 sparks at 40.35 s); key picture `boss-down` moved into `boss.finish`.

The film is 184.6 s (11076 frames) against `film.maxSeconds` 165. The Builder's word: no padding, the number left alone, the red length check carried as known. The start check carries a film over its length so the site still starts (`carryLength`, NEEDS 327ba55d).

The film's fight is 11.9 s from `turret-lock` to `power-down`, shorter than any visitor's: `FILM.dart` makes a dart on the body worth more, `FILM.floor` lets a phase end sooner, and `FILM.ends` ends each phase at a set second of the fight at the latest. The rules of the fight are the same.

## LOOK1_ON as seen

Looked at with the switch `true` in a second work tree, at 84e223bc.

- The page draws: the form is off 0.2 s after the crack, cracks at +0.4, the split glows at +0.8, pillars and panes rise +1.0 to +1.6, the bar comes down +2.0 to +2.2. The word on the button is drawn in the look's `WORD` face from the forming on. After the big blast the floor is shaken and the bar stands still. No error is thrown. (Film frames rendered and looked at.)
- The film: before `FILM.ends` the fight did not end in the film with the look on, because the script's places are tuned to the stand-in's larger shield and hull. With `FILM.ends` the marks are, MEASURED with `boss-film.mjs`: `power-down` 47.80, `finish-fire` 52.92, `finish-press` 59.06 with the look; 47.79, 52.92, 59.06 without.
- The bots, 24 seeds, MEASURED with `boss-bots.mjs --seeds 24`: keen~ 24 of 24 win, 26.5 / 33.5 / 43.6 s, flattened 0 / 0 / 2, shield 4 against round 485; clumsy~ 24 of 24, 49.7 / 65.5 / 75.0 s, shield 67 against round 332.
- The tests: 9 of the 65 in `tests/b-boss.test.ts` and `tests/boss.test.ts` fail with the switch on (MEASURED at 84e223bc, the two files run with the switch true: 9 failed, 56 passed). All nine are in `tests/b-boss.test.ts`. By name, with what each reads now and what it must read:

| Test | Its own line with the switch on | Reads now | Must read |
| --- | --- | --- | --- |
| "A. moves the health bar by less than a pixel for a whole volley on the shield" | "expected 0 to be greater than or equal to 5" | the width of the stand-in's `health-fill` in the film while darts glance | the arena's bar (`makeBar`, `poseBar` in `src/arena/props.ts`) or the fight's health times the bar's length; and the film's first darts must meet the look's shield, which they do not (the script's first stand is tuned to the stand-in's shield) |
| "A. shows the open side after six darts in a row have glanced off, and again every few seconds, on the flank away from the shield" | "expected 1 to be greater than or equal to 3" | no shape: the fight's logic, a visitor who stands at (450, 700) | a matter of the rule, not of the drawing. The look's shield covers 0.5 rad to each side at 120 px, 115 px across, in front of a hull 232 px across, so darts from the front get by it. Either `SHAPE.cover` for the look is made wider than the glass that is drawn, or the test stands where every dart meets the glass |
| "note of 21:27. in the film / a keen visitor / a clumsy visitor nothing of the header, the rail or the form is inside the screen during the fight" (three) | "expected [ 'arena-well', 'arena' ] to deeply equal []" | the list `OF_THE_FIGHT` of the shapes that belong to the fight | the same list with the page's two anchors `arena` and `arena-well` added |
| "note of 21:27. in the film / a keen visitor / a clumsy visitor the health bar stands alone at the top, and the boss, its shield, its turret, the cannons, the bullets and every flash keep the band under it clear" (three) | "Cannot read properties of undefined (reading 'y')" | the stand-in's `health-track` and every shape of the stand-in boss | the bar's place from the arena (`barDrop` in `src/arena/change.ts`, the bar in `props.ts`) and the boss's bounds from the look (`poseOf`, `SIZE`, `bigMuzzleOf` in `src/boss/look1/pose.ts`), because with the look nothing of the boss is in the page's list of shapes |
| "note of 21:47. raises the big turret only when the body is whole, leaves the word Submit in its place on the button the whole time, and blows the turret off when the boss falls" | "expected false to be true" | the stand-in's cap, its word and `boss-turret` | `wordAt(view)` and the turret's state from `poseOf` (`TURRET`) |

- So the switch stays `false`. To turn it on: those nine tests must read the look's and the arena's shapes, and the finish helper's module must be in.

## As seen in the pictures of 01:23 (stand-in, `LOOK1_ON` false, pop-ups off)

- Film, `npm run sheet -- --beat boss.finish --tier draft` (2:39.80 to 2:51.37 of the film, 12 frames): the ball grows at the arrow over four frames; the blast is a flat orange block with a pale band from the arrow to the button; after it the button lies alone, smoking; the arrow walks to it; the words "Click to submit" are under the button from 2:48.20; the last frame shows the arm drawn back. The knees are not told apart from the walk at this size.
- Live site, `node pipeline/change002/boss-live.mjs --at 53.9,54.45,55.4,57.6,59.2,60.4,61.5,61.95` (keen bot, seed 20261124, seconds of step 4): the charge at 54.45, the beam at 55.40, the arrow led to the button at 57.60, on its knees at 60.40, the arm up at 61.50, the blow at 61.95.
- Two black bands lie on the floor through the whole finish on the live site: the scars of the big cannon's blasts (`break-N` in `drawArena`, the stand-in's arena). One of them lies over the words under the button, so only "Click" can be read. A grey block of the arena stands between the arrow and the button and the beam goes through it. Neither was changed: both are the stand-in's drawing, and with the look on the arena draws its own floor.
- Live site, `npm run sheet -- --live --bot keen --step 4`: the corner cannon's lane and the big blast's scar are black bands in the stand-in.

## As seen on the real page at 01:51 (the Builder's merge 56 at 6259284c, merged with e9341149, `LOOK1_ON` true in a trial tree only, pop-ups off)

`node pipeline/change002/boss-frames.mjs --frames 10280,10330,10490,10600,10790,10820,10900,10990,11028` (film frames at 60 a second; the unit starts at 121.3 s of that film): the fall, the arms, the charge, the blast, the button on the ground, the walk, the knees, the fist, the press.

- The button after the blast: face up, level, the word Submit readable, its middle at (961, 650) MEASURED in frame 10790, on the burn. The burn in this tree is a long streak from the arrow's place to past the button; the arena helper's round burn of 01:40 was not in the tree.
- The words "Click to submit" at (960, 360): dark on bare pale ground in frames 10790 to 11028; two specks beside them.
- A toppled grey pillar on its star base lies over the place the arrow stands for the charge and the blast, (440, 650): the slab covers about x 372 to 548, y 476 to 640. In "the arms" and "the charge" the arrow's body is half hidden under its lower edge. Not fixed: the pillar is not my drawing, and `LAST.stand` is the start of the arena's trench and of the finish helper's figure. Mailed to the arena helper and the Builder at 01:53.
- The arrow, its arms, the ball and the beam in these frames are my stand-in (`src/boss/finish.ts`): the ball is a flat orange disc beside the arrow, the beam a flat orange block with a pale band. The finish helper's figure is not in these frames.
- The knees: the arrow is 144 px left of the button's middle, not told apart from the walk at sheet size; the fist: an arm drawn back over the arrow; the press: a black arm from the arrow to the button's left end.

## As seen on the real page at 02:07 (merge 56 at 4a11790b, the arena at 876b2e5c and my e9341149 merged in a trial tree, `LOOK1_ON` true there only, pop-ups off)

The same nine frames, taken again after the arena helper's mail of 02:06 (the pillar no longer falls on the stand; the round burn).

- The arms and the charge: the arrow at (440, 650) is in plain view; the pillar's base is a low stump at about (563, 722), under the line to the button.
- The button on the ground: face up, level, the word readable, in the middle of a round burn; its middle at (961, 650) as before.
- The words "Click to submit" at (960, 360): on bare pale ground in the five frames from the button on the ground to the press.
- The ball, the beam, the arms and the arrow are still my stand-in.

## Decisions

1. The boss's measures are one object, `SHAPE`, chosen by `LOOK1_ON`.
2. Pop-ups off keeps the event `popup`.
3. The arrow rides over pillars and panes; they stop bullets and darts only.
4. The box round the health bar (`SOLID.bar`) stops every shot; a big aim that would cross it is turned away from it in steps of 0.04 rad.
5. The boss's home is (960, 548); the fallen button lies at (960, 650).
6. The form, the header and the rail leave from the crack; solids rise 1 to 2 s after it.
7. `cover-hit` is sent when a bullet or dart is stopped by a solid.
8. The clear band under the bar is measured in a test on the film, a keen and a clumsy visitor.
9. Every change to `config/`, `content/`, the stage, the cursor's body and other units' tests is a commit of its own that starts with `NEEDS:` and is in `boss-NEEDS.patch`.
10. `film.maxSeconds` stays 165; the film is over it and that is carried.
11. The skip link keeps the old short collapse.
12. The film's shorter fight is made by `FILM` alone.
13. The stand-ins are drawn by the part `shell`.
14. Live finish, mail of 23:38: by itself a full blast at 6.0 s; a held button is taken over 0.8 s past the full charge.
15. The charge grows all the time (`FINISH.steady` 0.5 of it) and steps on each mark (the rest), so it is one unbroken build.
16. The gag and beat `boss.finish` hold the finish; `finish-charge` is sent on each mark.
17. The flat arrow is the cursor's own body laid flat (`spread`, NEEDS fa022e84), 1.35 times its size, with a dent of 190 px under its tip, cracks and dust for 2.6 s. The bar's gain is drawn as a bright step on the bar.
18. `BIG.last`: one more big blast in the last stand, so that a middle keen~ fight has 2 to 4.
19. The shake after a big blast is a wrapper round the look's and the arena's parts in `src/pages/step4/real/index.ts`; the arrow, the caption and the bar are outside it.
20. Whether a blast breaks a solid is the arena's `boxToSegment`.
21. The arms outside `cursor.armsOnlyInBeat` come through `PageLogic.arms` (NEEDS 3e861112); the hands' places come from my page.
22. The close view is `page.view()`; the hand is read through the view, so the pointer means the same place on the ground (tested: the button within 3 px of the hand that points at it).
23. From the fall the page takes the arrow and stands it at (440, 650) (the Builder's C1).
24. `PageLogic.led` (NEEDS 742ab065) with the Builder's bound (C2).
25. The kneel place is fixed, 200 px left of the button's middle: (760, 650).
26. The led walk ends by itself after 20 s; the walk by itself takes 2.8 s at most; on the live site the arrow stays 0.3 s on its knees where the film has a breath of 0.6 s. The led walk has the film's speed, so the way from the stand to the button, led straight, takes 2.8 s.
27. `healthbar-drop` is sent 1.7 s after the crack, where the arena's bar starts to fall.
28. `FILM.ends`: the film's phases end by a set second, so the marks hold with either shape of the boss.
29. `LOOK1_ON` stays off (above).
30. "Click to submit" under the fallen button is old copy: `step4.defeated` in `content/copy.json`. No new word was added to the screen; nothing was added to `content/copy-drafts.json`.
31. Line 6: the tick stays at 3.8 s and the forming waits (above); `LINE6.after` 7.175 is one number beside `LINE7`.
32. `BASE` in `src/pages/step4/script.ts` is 9.004, the second the forming was seen at when the fight's table was tuned, so the table keeps its place against the forming to the step. With 9 the first volley of the film let one dart by the shield (MEASURED: test "A. moves the health bar by less than a pixel for a whole volley on the shield", 3 glances in place of 5).
33. A click on the button while the arrow still walks is a wish and no longer takes the walk (above).
34. The key `boss-fight` at 0.46 of its beat (a `NEEDS:` commit of one number), so the key picture has darts in flight.
35. The Builder's mail of 01:31, thing 2: one point for the fallen button, (960, 650). It is `FALLEN` in `src/boss/plan.ts`, `view.finish.x1, y1`, `view.scorch.x1, y1` (the middle of the arena's burn, STATED by the arena helper from `scorchFrom` in `src/arena/scorch.ts`) and the look's `LEFT`. The finish helper's kneel spot is (816, 656) in its code; my page's own kneel with the look on is (816, 650): `LAST.reach` is 144 with the look on and 200 with it off, and `LAST.speed` is 134.3 px/s with the look on and 114.3 with it off, so the film's walk of 376 px or of 320 px takes 2.8 s either way. Mailed to the arena and finish helpers at 01:39.
36. The same mail, thing 3: the words "Click to submit" stand over the button, at (960, 360), 290 px above its middle (`LAST.words` -290 in `src/boss/tune.ts`). The close view is where it was (x 300 to 1260, y 270 to 810). Why over and not under: the arena's burn is black from about y 512 to y 788 at the button and sooty to about y 880 (STATED by the arena helper, mail of 01:40); under that, from about y 840 to the frame's edge, lie the cracks and the hole of the place the button was torn from. Tried first and dropped (pushed at e5701a20, seen in the picture of the real page): the words at (960, 895) with the view 110 px lower; they stood on those cracks, 25 px from the frame's edge. MEASURED at (960, 360) on the Builder's merge 55 with the look on, frames 10790 and 10990 of the film: the words are dark on the pale ground, with no burn, crack or wreck under them; two specks lie beside them.
37. The Builder's ruling of 01:31 on the crack: `button-crack` at 8.079 s of the unit, 4.279 s after the tick and 0.096 s before the words "takes that as a threat", stays as it is.

## Events

Of the brief: a shot met the shield `shield-glance`; a shot got round it `shot-round`; a corner cannon's tell `cannon-tell`; a corner cannon fired `cannon-fire`; the arrow flattened `flatten`; the arrow up again `peel-up`; the boss healed `boss-heal`; the boss moved off `boss-move`; the boss beaten `power-down`.

All: `shield-glance`, `shot-round`, `weak-tell`, `cannon-tell`, `cannon-fire`, `flatten`, `peel-up`, `boss-heal`, `boss-move`, `turret-rise`, `turret-lock`, `big-tell`, `big-fire`, `arena-break`, `turret-off`, `power-down`, `slab-fire` (a shot of the boss's own guns; the name is the old one), `popup`, `session-expired`, `cover-hit`, `pane-shatter`, `pillar-break`, `boss-formed`, `arena-split`, `arena-rise`, `healthbar-drop`, `boss-turn`, `boss-music`, `power-up`, `boss-fall`, `finish-arms`, `finish-charge`, `finish-fire`, `boss-gone`, `finish-walk`, `button-down`, `finish-kneel`, `finish-fist`, `finish-press`, `button-press`.

## Sounds asked of the Builder (contract 4)

The fight itself is silent of words (note 003). Until a file arrives each event plays the nearest cue the build has, or none.

| Event | Length, s | | Event | Length, s |
| --- | --- | --- | --- | --- |
| `shield-glance` | 0.2 | | `power-up` | 2.0 |
| `weak-tell` | 0.3 | | `boss-fall` | 1.0 |
| `slab-fire` (a bullet) | 0.3 | | `finish-arms` | 0.6 |
| `cannon-tell` | 0.9 | | `finish-charge` | 0.9 each, four |
| `cannon-fire` | 0.5 | | `finish-fire` | 2.13 |
| `flatten` | 0.3 | | `boss-gone` to `button-down` | 1.4 |
| `peel-up` | 0.4 | | `finish-walk` | 1.8 |
| `boss-heal` | 0.6 | | `finish-kneel` | 0.7 |
| `turret-rise` | 1.6 | | `finish-fist` | 0.6 |
| `turret-lock` | 0.3 | | `finish-press` | 0.3 |
| `big-tell` | 1.6 | | `turret-off` | 0.7 |
| `big-fire` | 0.6 | | `arena-break` | 0.8 |

The arena's own sounds are in `pipeline/change002/arena-sounds.md`.

## Changes outside my files (`pipeline/change002/boss-NEEDS.patch`)

| Commit | What |
| --- | --- |
| 417ef7ef | two tests of other units follow step 4: `tests/b-shell-chrome.test.ts`, `tests/site-pointer.test.ts` |
| 40ffdeab, cbeda7f2, c913d8ae, 13253279, 2a9992e8 (to 61.6 s) | `config/showcase.json`: the unit's seconds, its beats, the beat `boss.finish`, the key `boss-down` |
| 327ba55d | `film.maxSeconds` back at 165; the start check carries a film over its length |
| fa022e84 | `src/cursor/body.ts`: `spread(scale, seconds)` lays the arrow flat |
| a5ccabc1 | `content/narration.json`: an empty list for `boss.finish` |
| 3e861112 | stage: `PageLogic.arms` |
| 742ab065 | stage: `PageLogic.led` |
| df2933b4 | `cut/CUTLIST.json`, `cut/CUES.md`, `cut/SHOTS.md` made again by `npm run cut`: film B was 10956 frames (182.6 s), 36 of 36 beat events inside their beat. Not made again after line 6 (the Builder's order); the film is now 11076 frames |
| 5e4d3d76 | `config/showcase.json`: the unit at 63.6 s and its beats moved for line 6 |
| 9a8d308f | `config/showcase.json`: the key `boss-fight` at 0.46 of its beat |

The patch file holds the changes to `config/`, `content/narration.json`, `src/config.ts`, `src/app.ts`, `src/cursor/body.ts`, `src/stage/*` and the two tests of other units, as a diff against `origin/main` b66ff094. The three files in `cut/` are not in it (326 kB): `npm run cut` makes them.

In `src/boss/view.ts` (told to the look, arena and finish helpers; all optional): `ViewBoss.pressedAt`, `BossView.last`, `BossView.close`, `BossView.scorch`.

## Tests

`tests/b-boss.test.ts` and `tests/boss.test.ts`: 66 tests. The new one: "mail of 01:00. starts line 7 no sooner than line 6 has ended".

Tests of my own page that pinned a thing the note or a mail changed:

| Test | Was | Now | Line that changed it |
| --- | --- | --- | --- |
| `tests/boss.test.ts` "ends every gag by itself with a still pointer" | fight within `live.boss.maxSeconds` | within `live.idleSeconds + live.boss.maxSeconds` | "nobody wins by standing still"; the Builder's mail on `maxSeconds` |
| `tests/boss.test.ts` "ends every gag by itself with a wrong pointer" | a pointer that stands and clicks wins inside 140 s | it is shown `weak-tell`, and wins by the mercy rule | "A mercy rule so that the visitor who stands and clicks does win, inside about 150 s" |
| `tests/boss.test.ts` "lets a keen visitor win the fight" | under `maxSeconds - 5` | 25 to 45 s with the stage's keen bot | "a keen visitor wins in 25 to 45 s" |
| `tests/boss.test.ts` "escalates in the film" | slabs | glances, the way round, a cannon, the one hit, the big blast, the banner | rules A to D; "bullets not validations" |
| `tests/b-boss.test.ts` D "flattens a visitor who stands and clicks" | watched for the whole fight | watched to `MERCY.from` - 1 | the mercy rule, mail of 22:45 |
| `tests/b-boss.test.ts` the test io | | gains `press`, `spread` | flat arrow, mail of 22:56; live finish, mail of 23:38 |
| `tests/b-boss.test.ts` shapes allowed in the fight | | `arrow-dent`, `arrow-crack-`, `arrow-dust-` | "must be seen flat" |
| `tests/b-boss.test.ts` "mail of 23:13" | | the finish on the marks of `SHOUT` in the film | "finish driven by one table of marks" |
| `tests/b-boss.test.ts` "mail of 23:38, item 4" | | five live paths on three seeds | live finish rules |
| `tests/b-boss.test.ts` "mail of 00:01, the last moment" | | three live paths on three seeds: each of the four marks once, never outside `CLOSE`, the hand through the view, control taken at most 8 s | mail of 00:01 |
| `tests/boss-fight.test.ts` "fires a volley with each click" | a volley from the front does the damage of three | a volley on the shield takes four chips | "the shield does almost nothing" |
| `tests/boss-fight.test.ts` "stops a dart from the left on the glass shield" | spark on the plane 290 px left | spark on the shield's arc at 282 px | "shield tracks" |
| `tests/boss-fight.test.ts` two key picture tests | a slab in flight, three slabs in the air | no slab in any frame, darts, a spark | "The red validation slabs are no longer fired at all" |
| `tests/boss-fight.test.ts` "keeps the tail of a fired slab at the mouth" | the slab's tail | a bullet flies straight with its trail | "Bullets, not validations" |
| `tests/boss-closer-acting.test.ts` "stands shocked at the crack and then scared and still for a second or more while the machine builds" | read 5.4 to 9 s | reads from `button-crack` to `boss-formed` | the Builder's mail of 01:00: the forming waits for line 6 |
| `tests/boss-closer-acting.test.ts` "squares up before the anger and answers the session expired with a held pose that is not a hurt one" | proud before the anger; shocked in 22 to 27 s | confident in the half second before `power-up`, where the anger starts; shocked 1.2 s or more between `session-expired` and `power-down` | line 7 in three parts; the film retimed |
| `tests/boss-closer-acting.test.ts` "shows the bar going back up at the last stand" | more than 100 px in 22 to 24 s | more than 8 in 100 of the whole bar in the 0.9 s after `session-expired` | the film retimed; the stand-in's bar is 560 px |
| `tests/boss-closer-acting.test.ts` "sags at the key of the fallen button and holds the relief for a second and a half after the press", now "is angry through the finish, sags when the boss is gone and stays so to the press and the turn" | exhausted at the fallen button, proud for 1.5 s after the press | angry from the fall to `boss-gone`, exhausted from there to `button-press`, the page turns within 1 s | the finish and the last moment: the blow of the fist is the press (mails of 23:13, 00:01, 00:36) |
| `tests/boss-fight.test.ts` "holds the doubt, the look at the answer and the wait before the press for 0.4 s or more" | the wait read at 28.6 to 29.5 s | read in the 0.9 s before `ACT.press` | the film retimed |
| `tests/boss-fight.test.ts` the two key picture tests and "cues nothing in the half second before a key picture" | the key at the middle of `boss.slabs`; health over 0.75 | the key's `at` read from the config; health under full and over a half | rules A to D; decision 34 |
| `tests/boss-fight.test.ts` "sends each bullet of the film straight" and the frames of the file | the first 33 s | the whole unit | the film retimed |

## Checks at the last push

All at e9341149, `origin/main` (b66ff094) merged in, 01:51 to 02:01 UTC, one after another. Pop-ups off, `LOOK1_ON` false.

| Check | EXIT | Its own line |
| --- | --- | --- |
| `npx vitest run tests/b-boss.test.ts tests/boss.test.ts tests/boss-closer-acting.test.ts tests/boss-fight.test.ts` | 0 | "Tests 84 passed (84)" |
| `npm run determinism` | 0 | "determinism: pass, 12 pictures at hd, tier draft, identical across two fresh loads and two orders" |
| `npm run bots` | 0 | "keen reached every one of the 38 gags on every seed", "bots: all clear"; keen: pointer ignored 4.24 s on each of five seeds |
| `npm test` | 1 | "Test Files 8 failed, 176 passed, 13 skipped (197)", "Tests 34 failed, 2214 passed, 17 skipped (2265)" |
| `npx tsc --noEmit -p .` | 0 | no output |

The 34 red tests, none in a file of mine:

| File | Red | Its own line | Why |
| --- | --- | --- | --- |
| `tests/config.test.ts` | 26 | the start check: film.units 184.6 s is over film.maxSeconds 165 | the note made the unit 63.6 s; `film.maxSeconds` stays 165 by the Builder's ruling; carried |
| `tests/cut-of-build.test.ts` | 2 | "are, byte for byte, what this build gives: run npm run cut and commit cut/ when this fails"; "is read from the committed cut list and carries the sum of that file" | `cut/` is not remade, as ordered |
| `tests/film-cut.test.ts` | 1 | "expected 10956 to be 11076" | the same: the cut list is of the film before line 6 |
| `tests/polish-turn2.test.ts` | 2 | the last turn "expected 140.5", now 172.1 | the film is longer by the note |
| `tests/roughcut.test.ts` | the file | "rough cut: the plan has no entry for beat boss.finish" | the rough cut's plan is not my file |
| `tests/audio-cues.test.ts` | 1 | "finish-fire: expected [...] to include undefined" | no cue for the new event; the cues are the Builder's |
| `tests/site-finish-film.test.ts` | 1 | "expected 1 to be greater than or equal to 3" | pop-ups are off in every run sent |
| `tests/site-finish.test.ts` | 1 | "expected 38 to be 37" | the new beat `boss.finish` |

My page's two tests of the visitor's hand are green: `tests/site-loading.test.ts` (the keen bot's pointer is ignored 4.24 s with no wait and 7.52 s with every turn held 4 s, under `live.controlTakenMaxSeconds` 8) and `tests/site-pointer.test.ts`.

## The switch to the real look (mails of 02:11Z and 02:17Z)

Written 02:53 UTC. `LOOK1_ON` is true in what is pushed. On `origin/agent/merge55` 004819fb, merged into the branch. Not merged by me: `agent/b-arena` f3295958 (pillar.3 moved to (563, 925)) and `agent/b-finish` after 0271c279.

### What the page does with the look on

- The view gives the health as 0 to 1 (`src/boss/viewof.ts`, `health: shown / 100`). It gave 0 to 100; the arena's bar clamps to 0 to 1, so the bar stood full on the real page until the health fell under 1 point. `src/boss/view.ts` is not changed.
- `src/boss/viewof.ts` keeps, beside the view, what the page tells the standing figure (`setFinish`, `finishNow`, a `FinishInput`). The page fills it at every drawing: the view's time, the arrow's place, `power { at, end }`, the marks `arms, charge, fire, end, walk, kneel, fist, press` (each the view's time when my page emits `finish-arms`, the first `finish-charge`, `finish-fire`, fire plus the blast's length, `finish-walk`, `finish-kneel`, `finish-fist`, fist plus `LAST.fist + LAST.blow`), the charge now, the shot, the walk's place and length, and the look's button (`buttonAt(view)`). No size is given: the module's own default is used.
- `src/pages/step4/real/index.ts`: a part `boss-finish` (`finishPart(finishNow)`) on an anchor `finish-figure` over the whole page, and the arena's beam from the module (`arenaPart(viewNow, { beam })` with `beamLight(finishState(input))`).
- The stand-in's arrow arms, disc, block and gold glow are not drawn and `PageLogic.arms` is false. They stay behind the switch.
- The ordinary arrow is hidden while the figure is up with the body's own `setOnPage(false)` (the shell's view does not draw an arrow that is off the page). No file outside mine is changed for it.
- The beam is aimed at the button on the ground (no `target` given): the view's `boss.x, y` stays where the fight ended, (829, 543) in the film, and the body lies at (960, 650).
- The walk starts from the figure's feet (`finishState(input).feet`), (420, 742) in the film after a whole blast, and ends at the module's own kneeling place, `kneelSpot` with the look's button (width 177 px): (840.5, 656). The finish helper's (816, 656) is what the same call gives for a button 226 px wide.
- `LAST.far` 431 (px of that walk in the film) and `LAST.speed` 153.93 with the look keep the walk 2.8 s.
- The power-up: `power.at` is the event `power-up`, `power.end` is `LINE7.part2 - LINE7.power - POWER.burst - LIEDOWN` after it, so that the figure lies down again as the turret locks. That leaves 0.25 s between the fists being up and the burst.
- The film's two stands `FLANK` and `OTHER` (`src/pages/step4/script.ts`) are (1400, 450) and (440, 660) with the look; at (1400, 380) and (440, 790) a pillar of the ground stood in the line to the boss.
- `FILM.spare` 0.5: with the look the film keeps half a point of health over the end of a stage until that stage's time, so the fall stays at 49.77 s whatever the darts meet. Not applied with the stand-in.

### The tests, by name, and what each reads with the look on

All of them pass at both settings (table below).

| File | Test | Reads with the look on |
| --- | --- | --- |
| `tests/b-boss.test.ts` | "A. moves the health bar by less than a pixel for a whole volley on the shield" | the arena bar's length (682 px) times the view's health |
| the same | "A. shows the open side after six darts ..." | the same, from a stand 228 px before the smaller shield |
| the same | "note of 21:27 ... nothing of the header, the rail or the form is inside the screen" (film, keen, clumsy) | the same list; the page's anchors `arena`, `arena-well`, `boss-look`, `finish-figure` are allowed |
| the same | "note of 21:27 ... the health bar stands alone at the top ..." (film, keen, clumsy) | `barDrop(view.time)` landed, the arena's bar equal to `SOLID.frame`, the label over it, and the look's hull, feet, shield, muzzles and every page shape at least `TOP.clear` from it |
| the same | "note of 21:47. raises the big turret only when the body is whole ..." | `poseOf(view)`: the word within 30 px of its first place while the boss stands (22.35 px at 45.09 s), `boss-word` in the list exactly when the look shows it until the body is gone, `pose.cannon.show` for the turret |
| the same | "mail of 23:38, item 4 ..." (five visitors) | the shot handed to the figure once its `fire` mark is set (`finishNow().shot`), in the place of the stand-in block's height |
| `tests/boss-closer-acting.test.ts` | "shows the bar going back up at the last stand" | the view's health |
| `tests/boss-fight.test.ts` | "keeps every number that changes each frame out of the keys" | no `health-fill` shape and the anchor `arena` in the list |
| the same | "shows, in the key picture of the fight, a stream of darts, a spark and the health bar, and no slab in flight" | the ids `arena` and `health-label`; the darts and sparks as before |
| the same | "shows the fight of the key ..." | the view's health at the key moment |

### MEASURED, 02:36 to 02:53 UTC, look on unless said

| Check | EXIT | Its own line |
| --- | --- | --- |
| `npx tsc --noEmit -p .` | 0 | no output |
| `npx vitest run tests/b-boss.test.ts` | 0 | "Tests 28 passed (28)" |
| `npx vitest run tests/boss.test.ts` | 0 | "Tests 38 passed (38)" |
| `npx vitest run tests/boss-closer-acting.test.ts` | 0 | "Tests 5 passed (5)" |
| `npx vitest run tests/boss-fight.test.ts` | 0 | "Tests 13 passed (13)" |
| `npx vitest run tests/site-loading.test.ts` | 0 | "Tests 17 passed (17)"; "keen: longest pointer ignored 4.24 s with no wait, 7.52 s with every turn held 4 s" |
| the same five files with `LOOK1_ON` false | 0 each | 28, 38, 5, 13, 17 passed |
| `npm run bots` | 0 | "keen reached every one of the 37 gags on every seed", "bots: all clear"; keen and clumsy pointer ignored 4.24 s, random at most 4.27 s, skipper 3.57 s |
| `npm run determinism` | 0 | "determinism: pass, 12 pictures at hd, tier draft, identical across two fresh loads and two orders" |

All of them at the code of 1e29f3f7.

The film's marks with the look on (`node /tmp/ev.mjs`, the stage at 240 steps a second): power-up 34.68, turret-lock 37.83, power-down 49.77, finish-arms 50.77, finish-charge 50.87, 51.81, 52.86, 53.67, finish-fire 54.90, boss-gone 57.03, finish-walk 57.43, button-down 58.43, finish-kneel 60.22, finish-fist 61.52, button-press 62.43, page-turn 63.10. With the stand-in the kneel is 60.23 and the rest the same.

The film's fight with the look on: 0 `cover-hit` (63 before the two stands moved), 153 `shot-round`, at the key moment (40.4 s) 6 darts, 6 sparks, health 76. Later than with the stand-in: `flatten` 42.80 against 42.19, `boss-heal` 43.15 against 42.54, `big-tell` 43.50 against 43.48, `big-fire` 45.10 against 45.09.

With `LOOK1_ON` false the film's 685 events are the same, step for step and place for place, before and after the changes of this stretch to `fight.ts`, `tune.ts`, `script.ts` and the page (`cmp` of two dumps).

### Pictures (film frames of the real page at 60 a second, look on, 1e29f3f7)

`node pipeline/change002/boss-frames.mjs --frames ... --out /tmp/fr`, frame = (121.3 + t) x 60. The nine frames from the fall to the press at 400 px each; the knees at 60.25, 60.45, 60.65, 60.85, 61.20 s; the fist at 61.55, 61.75, 61.95, 62.15, 62.30, 62.47 s; the power-up at 35.40, 36.20, 36.45, 36.80 s.

As seen: the figure is drawn in the place of the arrow at the power-up, from the arms to the press, and none of the 24 frames, as far as I looked at them (nine whole, fifteen as cuts round the figure), shows the arrow and the figure together. The beam runs level from its hands to the button. In the knees strip the figure stands at 60.25 s and is lower with its legs folded from 60.65 s. In the fist strip one arm is up from 61.75 s to 62.30 s and lies on the button at 62.47 s. At the power-up the arms are out to the sides at 36.20 s with a low flame and a ring on the ground, and flung wide at 36.80 s.

### Below the bar

- In the film the pillar of the ground at (563, 722) stands before the figure's feet at the power-up, and its stump lies under the figure's walk. The arena helper moved it at f3295958, which is not in this branch.
- The figure is small at the fight's wide view (about 100 px tall on a 1920 px frame). Its size is the module's default; the finish helper raises it.
- At the power-up the fists are up for 0.25 s before the burst, because the figure is made to lie down again by the turret's lock. A longer hold means the figure still standing in the first second of the fight.
- On the live site a visitor may move the arrow during the power-up; the figure then stands where the arrow is at each moment. Not looked at: no picture of the live site with the look on was taken in this stretch.
- With the look on the film's `flatten` and `boss-heal` are 0.61 s later than with the stand-in, because the stand `OTHER` moved. No cue was checked against it.
- `npm test` whole was not run in this stretch.
- No test of mine pins that the arrow is hidden while the figure is up; it was seen in the frames only.

## The mails of 03:02Z and 03:03Z (the pillar, the power-up pose, the size, the arrow, the live strip, the cues)

Written 03:23 UTC. Code at a2923452 on agent/b-boss; merged in: origin/agent/merge55 1daa9b64 and origin/agent/b-finish e7361785 and 0f4d1075.

### What changed in my files

- `src/pages/step4/index.ts`: the power-up gives the figure's module `power: { at, until }`, `until` = `power-up` + `LINE7.part2 - LINE7.power - RAISE.early`. The module fits its own moves to that window (its input `power.until`, from b-finish 0f4d1075). A time map of my own that I wrote first (a0996d26) is gone again at a2923452. In the window the page takes the pointer and holds it on the spot where `power-up` was stamped, and hands it back once when the window ends; the figure stands on that spot, not on the pointer.
- `src/boss/tune.ts`: `RAISE = { early: 0.05 }` (s the figure lies before the lock); `LAST.far` 426.5 and `LAST.speed` 152.32 with the look (the module's shove back is 57 px now and its kneel spot moved).
- `tests/b-boss.test.ts`: four new tests, below.
- Not changed: the boss part's length, the lock, plannedSeconds, film.maxSeconds, copy, the number 8, `src/boss/view.ts`.

### Decisions

- The module's own input is used for the pose, not a speed of mine.
- No size is set by me: no `scale` is passed, so the module's default 1.5 holds, and the kneel spot is the module's `kneelSpot` for my button (177 px wide), which gives (817.5, 659).
- The closer view: the finish already has it (`CLOSE`, twice the film size from the fall to the press), so the figure of the finish is at 1.5 times 2. The power-up has no closer view and I added none: it would move the picture of the fight's start, which nobody asked for by name. Said to the Builder as open.
- Item 4b: a pointer cannot move the figure in the power-up nor in the finish before it fires; on the walk it follows the hand, as the mail of 00:01 asked (pinned by the older test "leads it about the floor").
- The live power-up behind a pillar (below) is not fixed: where a visitor stands is the visitor's, and drawing the figure over a pillar is the arena's order of parts.

### New tests, by name

- "mail of 03:02, item 4a. in the film the plain arrow is off the page for as long as the standing figure is up, and on it at every other moment" and the same "in a keen visitor": every other step to the page turn, `cursor.onPage` is the opposite of the figure being up, and the part `finish-figure` is in the frame while it is up.
- "mail of 03:02, item 2. in the film both fists are raised for a second or more inside the power-up, and the figure is down before the turret locks" (look on only).
- "mail of 03:02, item 4b. a visitor who throws the pointer about cannot move the standing figure off its spot in the power-up, nor in the finish once it has run to its stand and until it fires" (look on only): the feet stay within 1 px.

### MEASURED, 03:05 to 03:22 UTC, look on unless said

- `bash /tmp/five.sh` (each file alone) at a2923452: b-boss EXIT 0, 32 passed; boss EXIT 0, 38 passed; boss-closer-acting EXIT 0, 5 passed; boss-fight EXIT 0, 13 passed; site-loading EXIT 0, 17 passed. With `LOOK1_ON` false: b-boss EXIT 0, 30 passed and 2 skipped; the other four EXIT 0 with the same counts.
- `npx tsc --noEmit -p .` EXIT 0.
- `node /tmp/pw.mjs` (film): figure up 34.68 to 37.78 s, fists raised 35.79 to 36.88 s = 1.10 s, `turret-lock` 37.83; steps with the figure and the plain arrow both drawn: 0. `node /tmp/pw.mjs live` (keen): up 14.38 to 17.48 s, fists raised 1.10 s, lock 17.53, both drawn 0 steps.
- Film events (`node /tmp/ev.mjs`): power-up 34.68, turret-lock 37.83, flatten 42.80, boss-heal 43.15, boss-fall 49.77, finish-fire 54.90, finish-walk 57.43, finish-kneel 60.22, finish-fist 61.52, button-press 62.43, page-turn 63.10; cover-hit 0.
- Look off: `node /tmp/dump.mjs /tmp/x.txt; cmp /tmp/ev_off_before.txt /tmp/x.txt` EXIT 0 (the film's events as before the look).
- Control taken (`tests/site-loading.test.ts` printout): keen 4.24 s with no wait, 7.52 s with every turn held 4 s. Not moved by the 3.10 s hold of the power-up.
- `npm run cut` EXIT 0, "every beat's event fell inside its beat". `cut/CUES.md` is byte for byte the committed one; `cut/CUTLIST.json` differs in 322 lines, every one an `x` or `y` of an event by under a pixel. `flatten` in the boss part: cue `flatten` at 164.096 s, frame 9845, beat `boss.slabs`, inside yes; the event is 121.3 + 42.796 = 164.096 s. `boss-heal`: in CUTLIST.json at 164.4458 s, frame 9866, with `"cue": null`: no sound cue is tied to it in the cut. `cut/` put back with `git checkout -- cut/`.
- Size, read off a 1 to 1 crop with 50 px ticks: about 200 px from the arrow's tip to the feet on the walk (59.03 s); about 125 px in the power-up (35.90 s), where the view is not closer.

### Pictures (film frames at 60 a second and live frames, look on, a2923452)

- `/tmp/pics/T1b-fall-to-press.jpg`, nine film frames, 50.03 to 62.50 s.
- `/tmp/pics/T4b-power-up.jpg`, eight film frames, 35.00 to 37.90 s, cut round the stand.
- `/tmp/pics/T2b-close.jpg`, five film frames at 1 to 1.
- `/tmp/pics/L1-live-keen-forming-to-press.jpg`, nine live frames of a keen visitor, 5.50 to 61.60 s of the visit.

### Below the bar

- Live, 16.00 s of a keen visitor: the figure powers up where the visitor stands, which is behind pillar.3 at (563, 925); the pillar covers its left half, one fist and one foot. Not fixed.
- The figure is black on the black burn from the knees to the press: its legs and arms are hard to tell from the ground in T2b at 60.37, 61.87 and 62.50.
- The power-up figure is about 125 px tall, not 210: no closer view there.
- At 53.53 (charge) the figure's left hand lies over the standing glass pane at the left edge of the close view; at 55.37 its flame is cut by the left edge of the picture.
- At 37.90, just after the lock, the plain arrow shows a burn mark and smoke; I have not traced which hit gives it.
- `boss-heal` has no cue in the cut. No cue for `finish-fire` checked by ear. `npm test` whole, `npm run bots` and `npm run determinism` not run again at a2923452 (last run at 1e29f3f7).
- A visitor's clicks in the 1.75 s before the lock can still fire darts while the figure is up (STATED, from the code; not tested).

## The rulings of 03:27Z and the addition of 03:31Z

Written 03:46 UTC. Merged in: origin/agent/merge55 81cf7955 and origin/agent/b-finish 4dde340f.

### What changed in my files

- `src/boss/spot.ts` (new): the boxes the arena's standing things are drawn in (pillars and panes from the arena's own `STANDS`, `ARENA.lean`, `ARENA.leanX` and heights; the four corner guns by `ARENA.gun.reach`), the figure's box with its ring of flames (`RAISE.box`), and `clearSpot`, the nearest spot on rings of `RAISE.step` px at which the figure's box meets none of them and lies on the page.
- `src/pages/step4/index.ts`: at `power-up` the page asks `clearSpot` for the spot; the figure and the held pointer go there eased over `RAISE.near` (0.5 s); the pointer is handed back with the cursor's own `release()` when the figure lies. `closer()` gives the view of the power-up: in over `RAISE.near`, held, out between `RAISE.back` (2.35 to 2.92 s after `power-up`), `RAISE.zoom` 1.6 times, centred on the figure's box and kept on the page. `stepFight(..., deaf)` with `deaf` true until the turret has locked (look on), and the arrow's kick on a click is held back as long.
- `src/boss/fight.ts`: `stepFight` takes `deaf`: no click fires a dart in that step.
- `src/boss/tune.ts`: `RAISE` (`near`, `back`, `zoom`, `box`, `step`, `turns`, `most`); `LAST.stand` (550, 650) with the look (was (440, 650)), `LAST.far` 319.5, `LAST.speed` 114.11 with the look.

### Decisions

- The view of the power-up is kept on the page, so a figure near an edge is not in the middle of the frame (the film's stand at (470, 500) sits at four tenths of the width).
- The guns' box is a square of `ARENA.gun.reach` round each corner: wider than the gun as drawn.
- `RAISE.box` is read off the film frames at the module's size 1.5 (STATED: measured by eye in T4b, 205 by 160 px).
- The film's finish stand went 110 px to the right in two goes (520, then 550), so that the flame's arcs do not reach the pane; the walk's speed went down with it so that no mark moves.
- The ember rim, the white of the body on the walk and the draw order over smoke are drawn in the finish module: asked of the finish helper at 03:29Z, not made by me.
- The burst over the button at the blast is in `src/boss/look1/fx.ts`, the look helper's file: not touched; see Not done.

### New tests, by name (look on only)

- "rulings of 03:27, item 1. wherever of 12 spots a visitor stands at the power-up, pillar.3 among them, nothing of the arena as it is drawn overlaps the figure while its fists are up, and it gets there without a jump"
- "rulings of 03:27, item 2. the view comes close on the figure for the power-up, in the film and for a visitor, and is the whole page again before the turret locks"
- "rulings of 03:27, item 7. no click fires a dart from the power-up to the lock of the turret, and clicks fire again after it"
- "mail of 03:02, item 4b" now reads the power-up after the figure has stepped clear.

### MEASURED, 03:31 to 03:46 UTC, look on unless said

- `bash /tmp/five.sh` at a5f023a4: b-boss EXIT 0 (35 passed), boss EXIT 0 (38), boss-closer-acting EXIT 0 (5), boss-fight EXIT 0 (13), site-loading EXIT 0 (17).
- With `LOOK1_ON` false: `npx tsc --noEmit -p .` EXIT 0; b-boss EXIT 0 (30 passed, 5 skipped), boss EXIT 0 (38), boss-closer-acting EXIT 0 (5), boss-fight EXIT 0 (13), site-loading EXIT 0 (17); the film's events `cmp` EXIT 0 against the list from before the look. With it true again: `npx tsc --noEmit -p .` EXIT 0.
- Film events (`node /tmp/ev.mjs`): power-up 34.68, turret-lock 37.83, flatten 42.80, boss-heal 43.15, power-down 49.77, finish-fire 54.90, finish-walk 57.43, finish-kneel 60.22, finish-fist 61.52, finish-press 62.42 (one frame of 240 earlier than before, inside the older test's two steps), page-turn 63.10; shot-round 153 as before.
- `node /tmp/sp.mjs`: a visitor at (563, 925) is stepped to (695, 925), 132 px; the film's stand (470, 500) is not moved; the farthest of 13 spots tried is (185, 372), stepped 300 px to (475, 450).
- Control taken: keen 4.24 s with no wait, 7.52 s with every turn held 4 s.
- Item 5, `node /tmp/cur.mjs`: at 37.90 s the film's cursor has `damage []` and `wounds []`, acting `angry`, reaction `rear`; the first `dart-fire` is at 37.92 s, after the lock at 37.83 s. The mark at the tip is the arrow's own first shot, not damage, and no dart is fired before the lock. Nothing changed.
- Item 6, read in the code: `src/film/cut.ts` line 201 gives a cut event `cue: eventCues[e.name] ?? null`, the first table only. The site (`src/audio/index.ts` line 679) and the mix (`src/audio/mix.ts` line 125) play `cueOfEvent(e.name)`, which also reads `extraCues`, `newEventCues` (where `boss-heal` is `power-on`, `src/audio/cues.ts` line 125) and `prefixCues`. The mend is in `src/film/cut.ts`, lines 1 and 201: `cueOfEvent(e.name) ?? null`. Not my file; not made.

### Pictures (a5f023a4)

- `/tmp/pics/T1c-fall-to-press.jpg`: nine film frames. The figure at the charge stands clear of the pane; at the blast its nearest arc of flame is about 15 px from the pane's edge and about 180 px from the frame's left edge (read off a 1 to 1 crop).
- `/tmp/pics/T4c-power-up-closer.jpg`: eight whole film frames, 34.90 to 37.90 s: the view close from 35.20 to 37.20, whole again at 37.50; the figure about 200 px tall in the frame at 36.40.
- `/tmp/pics/L1b-live-keen-power-up-at-pillar-3.jpg`: nine whole frames of a keen visitor, 14.30 to 17.60 s: the figure stands to the right of pillar.3, both fists up at 15.50 to 16.50, the whole page back at 17.30.

### Below the bar

- The figure is still black on the black burn from the walk to the press, and its body still reads grey there: waits for the finish helper.
- The burst over the button at the blast is not thinned.
- A visitor in a crowded corner is stepped up to 300 px in half a second.
- The view of the power-up is not centred on a figure near an edge.
- `boss-heal` has no cue in the cut until `src/film/cut.ts` reads `cueOfEvent`.

## Not done

- `LOOK1_ON` is true in what is pushed since c23b830d (see "The switch to the real look").
- The skip link's real press in a browser during the fight was not tested by me. Tested at the stage: `skip()` at any moment of the fight ends it (`tests/b-boss.test.ts`, "E. ends on the skip link at any moment of the fight"). Whether the shell's link is on the screen and pressable while the header is off is UNKNOWN to me; the link is the shell's.
- The gun's shot is still the event `slab-fire`; `bullet-fire` is not an event.
- No sound of mine is in: each new event plays the nearest cue the build has, or none. `button-down`: the look's button is on the ground 0.21 s before `boss-gone`, 1.6 s before my mark; the look helper says the sound belongs there. My mark stays, because the live click on Submit is live from it.
- The body's release of a taken arrow after 7.5 s is worked round by taking it again (above).
- 12 of 200 keen~ fights are under 25 s and 5 are over 45 s (table above).
- After the blast, with the look on, the arena helper measured a plain button near (735, 610). In my frames of the real page the button lies at (961, 650) (above); I did not find where the other picture came from.
- The arrow under the toppled pillar at `LAST.stand`: fixed by the arena helper at 876b2e5c (STATED by it, with `tests/arena-clear.test.ts`; seen by me in the frames of 02:07). Not in the Builder's merge when I looked (4a11790b).
- On the live site with the stand-in (`LOOK1_ON` false) the fallen button lies tilted by about 15 degrees with its word readable; with the look on the look's button is drawn level.
- The picture of the stand-in's finish in the film (01:23) was not taken again after the words moved over the button; the live site's was (02:05).
- `cut/` was not remade after line 6 moved the unit's marks (ordered: do not remake it).

### The burst over the Submit button at the blast (addition of 03:31Z), written 03:53Z

- Trial, MEASURED by picture (`node pipeline/change002/boss-frames.mjs --frames 10578,10584,10590`, once as it was, once with the stream `sparks(cx3, cy3, ...)` at strength 0 and the line `pop(GONE.hull[0], 0, 0, 9, 150)` taken out, `src/boss/look1/fx.ts` put back after): the white streaks that cross the word Submit at 55.00 and 55.10 s go when the two are off. Mean change in the button's box (frame x 1150 to 1490, y 700 to 820) between as it was and off: 2.4, 5.4 and 2.0 of 255 at 55.00, 55.10 and 55.20 s. So the two are the cause of the streaks, and of a small share of what lies over the button.
- What they are not the cause of: the blue and white wash over the button from 55.20 s is the beam and its light, drawn by the finish; the V shaped piece that crosses the word at 55.20 s is a part of the boss flying off. Both are as they were.
- Mend: `OVER_BUTTON` 0.25 in `src/boss/look1/fx.ts`: the stream's strength and the hull pop's flash and sparks are drawn at that share; the pops of the shield, wings, guns and legs are as they were. It is the look helper's file, so it is one commit of its own (5f86b1b9, subject starts `NEEDS:`) and the diff is at the end of `pipeline/change002/boss-NEEDS.patch`.
- After, MEASURED: mean change in the button's box, before to after, 3.2, 1.3, 1.2, 1.4 and 2.4 of 255 at 55.10, 55.20, 55.30, 55.45 and 55.60 s. A few streaks still cross the button at each of the five times. Picture `B1-blast-button-before-after.jpg`.
- The number 0.25 is a constant in `fx.ts`, not in `tune.ts`: STATED, the look helper may want it in its own table.

### The finish helper's 9a966641 taken (written 04:00Z)

- Merged `origin/agent/b-finish` 9a966641 (merge 4078f1f9). The page passes nothing new: the ember rim comes on by itself from `marks.end`; the face light is the module's.
- Item 3 of 03:27Z, MEASURED on this page (`node pipeline/change002/boss-frames.mjs --frames 10280,10330,10490,10600,10790,10820,10900,10990,11028 --out /tmp/fr5`): mean of the 1500 lightest pixels in a 140 px box on the arrow, before and after the merge: 221 and 253 at 59.03 s, 204 and 254 at 60.37 s. Seen in the same frames at 1 to 1: an orange rim on the legs, arms and gloves from 58.53 to 61.87 s, none on the white body. Picture `T1d-fall-to-press.jpg`.
- The figure above the smoke: not settled. The finish helper says (STATED) that its figure is drawn in the solid pass and that the arena's wisps (`src/arena/finish.ts`, lifted to z = 8 + 230 g, 300 for the two over the burn) pass over it wherever they lie higher than about 100 px; either the arena keeps its wisps low near the figure or the finish moves the figure to the late pass. Neither is my file. In the nine frames above no smoke lies over the figure (seen, not a test).
- `marks.thrust` (new and optional in the module): not passed. The ball and the beam play as before. Decision: left for a ruling, since it changes what is seen at the charge.
- Marks MEASURED after the merge (`node /tmp/ev.mjs`): power-up 34.68, turret-lock 37.83, flatten 42.80, boss-heal 43.15, power-down 49.77, finish-fire 54.90, finish-walk 57.43, finish-kneel 60.22, finish-fist 61.52, finish-press and button-press 62.42, page-turn 63.10. None moved.
- Checks at the merge with the look on, each alone: b-boss EXIT 0 (35), boss EXIT 0 (38), boss-closer-acting EXIT 0 (5), boss-fight EXIT 0 (13), site-loading EXIT 0 (17), b-finish EXIT 0 (22), bosslook-pose EXIT 0 (14, run at 5f86b1b9), `npx tsc --noEmit -p .` EXIT 0. The look-off run was last made at a5f023a4, not since.
- Not yet taken when this was written: the finish helper's 356fbeaf (the power-up flames lean and curl more). The pictures T4c and L1b are from before it.

### The finish helper's 356fbeaf taken (written 04:05Z)

- Merged `origin/agent/b-finish` 356fbeaf (merge 0fe1507c). Checks after it with the look on, each alone: b-boss EXIT 0 (35), boss EXIT 0 (38), boss-closer-acting EXIT 0 (5), boss-fight EXIT 0 (13), site-loading EXIT 0 (17), b-finish EXIT 0 (22), `npx tsc --noEmit -p .` EXIT 0.
- Pictures made again on it: `T4d-power-up-closer.jpg` (film, 34.90 to 37.90 s) and `L1c-live-keen-power-up-at-pillar-3.jpg` (keen visitor, 14.30 to 17.60 s).
- Seen in them and not measured: with the wider flames the left flame comes to the edge of the glass pane at 36.90 s of the film, and to the side of pillar.3 at 16.50 s for the keen visitor. `RAISE.box` (x0 -90) was read by eye off the flames as they were before 356fbeaf, so the test of item 1 holds for that box and not for the flames as they are now. Unknown by how many px the flames now pass the box.

## The rulings of 04:17Z (written 04:37Z)

Taken first: `origin/agent/merge55` 0429b87e (the page keeps time by the recorded takes; `LINE6.after` 8.79, `LINE7` part0 23.324, part1 5.59, part2 3.954, none changed by me) and `origin/agent/b-finish` ca844027, then 739a4e33.

### A. The thrust

- Film: the page stamps `marks.thrust` when the scripted time of the blast is `FIRE.ahead` (0.45 s) off, `u >= SHOUT.fire - FIRE.ahead`. Test "rulings of 04:17, A ..." (fire minus thrust within two steps of 0.45 s).
- Live: a charged shot let go (`s.shot > FINISH.small`) stamps the thrust in the step of the blast, so `marks.thrust` equals `marks.fire`; a plain click stamps none. A visitor who presses nothing: the arrow charges by itself and the thrust is stamped 0.45 s before its blast. A visitor who presses while it charges by itself and lets go: the thrust is stamped at his release. The table test "mail of 23:38, item 4" now also holds this for its five visitors on three seeds.

### B. The wisps keep off the figure

- `src/arena/finish.ts` (the arena helper's file, by leave; commit subject starts `NEEDS:`): the wisps are made by `wispsOf`, which the look and the test both call. `wispShare` fades a wisp by the distance from its picture (a round of 0.95 of its size at its drawn middle, the lean of its height taken in) to the figure's box `WISP_CLEAR` (-110 to 120 across, -180 to 80 down round `view.last`, read by eye off the frames of the walk, the kneel and the raised fist: STATED), back to its whole strength 90 px away. `view.last` is there from `boss-gone`, a little before `finish-walk`.
- Test "rulings of 04:17, B ..." in the film, every second step from `finish-walk` to the turn of the page: no wisp stronger than 0.05 reaches the box; without the figure some would (the test counts them, so it bites); smoke still stands beside it.
- Not known: whether the camera's own view shifts a tall wisp further than the lean the arena gives it. No test of pixels.

### C. The closer view at 2.2

- Trial only, the kept number is 1.6. Picture `C1-power-up-zoom-1.6-and-2.2.jpg`: the same film frame (power-up + 2.12 s, rendered before the takes' times came in) at both, whole and at 1 to 1. Seen: at 2.2 the boss is mostly out of the frame; at both a straight upright cut shows at the right end of the flames (the finish's picture); the ground's grain is softer at 2.2. Not measured.

### D. The figure's box and the flames

- MEASURED at ca844027 with the view at zoom 1 (frames 9834, 9918, 9942, 9966, 9984; pixels that changed by more than 60 against the frame before the power-up, red over 220 and red minus blue over 110): the full flame fills -92 to 137 across and -41 to 125 down round the stand. Pale tips, read by eye off the same frame: to about -155 and 165 across, -60 up.
- Tried `RAISE.box` -160, -65, 170, 130. Two things turned up, so it is NOT kept:
  1. The film's own figure was stepped 72 px to (542, 500), and the film's marks moved (flatten 50.99 for 51.02). Mended whatever the box: only a visitor's figure is stepped, the film's stand is the script's. With it the film's flames still reach the pane's edge; the mend for the film is a new stand in the script at the power-up, which moves the arrow's first shots: left for a ruling.
  2. The keen visitor is then stepped 198 px (132 before), his fight takes another course, and "note of 21:27 ... in a keen visitor the health bar stands alone" fails: `look-feet` 23.31 px under the bar at 31.85 s, limit 24. With the old box the same test passes. So the band under the bar is not held by the fight for every course; it held for the courses tried. Cause not found.
- Also seen with the wider box (`node /tmp/sp.mjs`): spots at the corner guns are stepped 588 and 714 px in 0.5 s, because the guns' boxes are squares of 244 px.

### E. Look off, and the quick shot

- Look off at this tree (before 739a4e33, which touches only the look): tsc EXIT 0; b-boss EXIT 0 (30 passed, 7 skipped), boss EXIT 0 (38), boss-closer-acting EXIT 0 (5), boss-fight EXIT 0 (13), site-loading EXIT 0 (17).

### F. boss-turn and line 6

- Read in the code, not run: on the live site `boss-turn` is emitted in the step of the visitor's first press after `boss-formed` (`src/pages/step4/index.ts`, stage `hold`), or at the end of `LINE7.part0`. For a visitor near the cap, or when the box ticks itself, the boss wakes `WAKE_AFTER_TICK.near` 2.2 s after the tick and has formed `UNFOLD.end` 3.6 s later, 5.8 s after the tick. Line 6's take is 8.49 s (`LINE6.after` 8.79 with its gap). So on that path `boss-formed` comes about 2.7 s before line 6 has ended, and a press there emits `boss-turn` before line 6 has ended. On the far path (7 s and 3.6 s, 10.6 s) and in the film (formed at 8.79 s after the tick) it does not.
- The quick shot, MEASURED by picture (`node /tmp/evl.mjs`: keen visitor, `finish-fire` at 58.50 s, shot 0.25, no thrust mark; `node pipeline/change002/boss-live.mjs --at 58.60,58.75,58.90 --bot keen`, picture `E1-live-quick-shot-crop.jpg`): at 0.10 and 0.25 s after the mark a line of orange fire lies on the ground from the arrow to the boss and no beam is seen; at 0.40 s the beam is there and it is blue and white, with no orange in it. So the orange is on the ground under the beam's line and comes before the beam. Whose picture the fire on the ground is (the arena's burn or the look's): not traced.
- Control taken in that keen visit to the turn of the page: 3.30 s at most (`stage.longestIgnored.pointer`).

### After 739a4e33 (the flames and the stance of the power-up again)

- The flames MEASURED again the same way (frames 9834, 9942, 9966, 9984): -92 to 187 across, -127 to 125 down round the stand. `RAISE.box` is still -90, -35, 115, 125, so the test of item 1 does not hold for these flames: they pass the box by up to 72 px on the right and 92 px at the top.
- Checks at this tree with the look on, each alone: b-boss EXIT 0 (37), boss EXIT 0 (38), boss-closer-acting EXIT 0 (5), boss-fight EXIT 0 (13), site-loading EXIT 0 (17), b-finish EXIT 0 (23), takes-timing EXIT 0 (6), `npx tsc --noEmit -p .` EXIT 0.
- Film marks (`node /tmp/ev.mjs`, by steps of 1/240 s): power-up 42.71, turret-lock 46.07, flatten 51.03, boss-heal 51.38, power-down 58.00, finish-fire 63.13, boss-gone 65.26, finish-walk 65.66, finish-press 70.66, page-turn 71.30. Each is 0 to 0.013 s after the Builder's list from the cut; I take that for the cut's frame grid, not checked.
- Seen in `T5-power-up-thrust-walk-new-times.jpg`: the ball is in front at the hands at 63.00 s; no smoke over the figure at 66.50, 67.50, 69.00, 70.20 s; the two tall wisps stand over the Submit button through the walk and the press.

## The rulings of 04:46Z (written 05:05Z November 28)

### 1a. The ground burned before the beam

- Traced: the orange line is the arena's burn (`scorchOf` share) and the look's coming apart of the boss, and both ran from what this page gives them: `view.boss.gone` and `view.finish.firedAt`, which started at the fire mark. Nothing in `src/arena` or `src/boss/look1` needed a change, so there is no `NEEDS:` commit for it.
- Done in `src/pages/step4/index.ts` (commit e4b3c0d5): a new state `lag`, set in `fire()` to `FIRE.lead` plus the way from the hands to the boss over `BEAM.speed`. `gone2()` counts from `fired - lag`, and the view's `blast` exists only from then. The same lines serve the film, a plain click and a charged release. With the look off `lag` is 0.
- MEASURED by the new test "rulings of 04:46, 1a" (film, plain click, charged shot let go): the beam is there 0.204 s after `finish-fire` in all three; the burning and the coming apart start 0.300 s after it; hands to boss 308, 291, 293 px; the beam's head is at 420 px by then. So the burn starts about 0.03 s after the beam's front has reached the boss.
- Not done: the front of the burn does not run along the ground with the beam's front. The burn the arena draws for the blast lies at the boss and spreads from there; at 4200 px/s the beam crosses the 300 px in 0.07 s, about four frames of the film.

### 1b. A plain click fires a smaller blast

- STATED from `src/boss/finish/fx.ts` lines 185 to 187: the width is `(0.35 + 0.65 * power) * open`; a plain click has power 0.25, so 0.5125 of a full charge.
- MEASURED on pictures, same view, 0.15 s after the beam's start, the run of pixels of brightness 245 and more across the beam at 60, 90 and 120 px from the hands, in the 960 px view: plain click (keen visitor, `finish-fire` 58.50 s, picture at 58.85 s) 18, 20, 22 px; full charge (the film, frame 11087, halved to the same view) 34, 39, 44 px. The ratios are 0.53, 0.51, 0.50. Nothing changed.
- Picture `E2-beam-plain-above-charged-below.jpg`: three frames in a row, plain click above, charged below. The upper row is 1 to 1 from the live page; the lower row is the film's frame halved to the same view, because the film's frame is twice the size.

### 2. The band under the bar on every course

- MEASURED before the change by the new test "rulings of 04:46, 2" (twenty looks a second, ten seeds each): keen 74.85 px, clumsy 111.63, one who keeps under the bar -24.68, one who runs round the boss -45.05, one who stands in one place 40.61. So the band was broken by two kinds of visitor that no test had tried.
- Done in `src/boss/fight.ts` (commit 636d3a90): `headroom(f)`, the least y of his centre for the way he faces, from the feet's box, the hull with its wings, the shield and, once the turret is up, the big cannon's muzzle (sizes from `src/boss/look1/pose`), plus `TOP.clear` and `TOP.spare` (0.5 px, new, in tune.ts) under the frame. `walk()` never aims higher than it, and when he turns faster than he walks he is set down to it in the same step, with the way counted as walked so his feet step.
- MEASURED after: keen 74.85, clumsy 111.63, under the bar 24.50, round the boss 24.50, in one place 40.61; the smallest gap is 24.50 px (`look-feet`, one who runs round the boss, seed 4, at 23.35 s). The random and the skipper bots are in the test too but leave the fight at once (6 and 0 looks), so they prove nothing.
- The film's marks are the same to the hundredth as at 27f7eeef (`node /tmp/ev.mjs` compared with `diff`): the bound does not bite in the film.
- Not known: how the slide looks when he is set down while turning. No picture of it was made.

### Checks at 40c05ed8 (merge55 8be20687 merged), each alone, 05:04Z to 05:11Z

- Look on: b-boss EXIT 0 (39), boss EXIT 0 (38), boss-closer-acting EXIT 0 (5), boss-fight EXIT 0 (13), site-loading EXIT 0 (17), b-finish EXIT 0 (23), takes-timing EXIT 0 (6), tsc EXIT 0.
- Look off: tsc EXIT 0, b-boss EXIT 0 (30 passed, 9 skipped), boss EXIT 0 (38), boss-closer-acting EXIT 0 (5), boss-fight EXIT 0 (13), site-loading EXIT 0 (17).
- Film marks (`node /tmp/ev.mjs`) the same as at 27f7eeef. Keen visitor (`node /tmp/evl.mjs`): boss-formed 6.45, boss-turn 9.34, power-up 18.16, turret-lock 21.52, finish-fire 58.50, boss-gone 60.64, page-turn 66.39; longest control taken 3.30 s.

### 3. F, boss-turn and line 6: not started

- It waits for the head of merge55 with the shell helper's change of the line that sets `s.turned`. At 05:11Z merge55 is 8be20687 and that line is as it was.
- Read in the code, not run: a press while `s.since < LINE6.after` (stage `hold`, the branch before the one that emits) is dropped today, not remembered. `boss-turn` cannot come before the tick plus `LINE6.after` (8.79 s) on any live path, because that branch holds the clock of line 7 at 0.
- Decision for when it is built: a press counts from `boss-formed` on, not from the tick, so that a second click on the checkbox does not skip most of line 7.

## F and the strip (rulings of 05:20Z and 05:28Z, written 05:37Z November 28)

### F. boss-turn waits for the end of line 6

- Built on merge55 510be291 (merge 73 of the shell helper is in it; the line that sets `s.turned` is as that merge left it, not edited).
- Done in `src/pages/step4/index.ts` (commit c63c89af): a new state `asked`. In stage `hold`, while `since < LINE6.after`, a visitor's press sets it; in the next branch the turn is taken on `io.pressed || s.asked`. Presses count from `boss-formed` on, not from the tick (decision accepted 05:20Z). The film never sets it.
- MEASURED by the new test "rulings of 04:46, 3" (near path and self-tick path, five kinds of visitor each, the fight then played out by the keen bot): `boss-formed` 5.800 s after the tick on both paths; `boss-turn` after the tick: 8.792 s for one who presses as soon as the boss is formed, 8.792 for one who presses 1.5 s before the end, 8.792 for one who presses 0.1 s before the end, 9.792 for one who presses 1 s after it, 32.112 for one who never presses. `LINE6.after` is 8.79 (the take of 8.49 s and the gap of 0.3 s), so the earliest turn is 0.30 s after the last word.
- Control taken, MEASURED by the same test (`stage.longestIgnored.pointer`, whole visit): 3.304 s for the four who press, 6.004 s for the one who never presses (the drift of `LINE7.most`). Longest 6.004 s.
- Not run for F: the far path (the visitor ticks and stays away). There the boss is formed 10.6 s after the tick (STATED from `WAKE_AFTER_TICK.live` 7 and the forming of 3.6 s), after the end of line 6, so a press acts at once as before.

### The strip: the boss set down under the bar while he turns

- Tool: `pipeline/change002/boss-under.mjs` leads the mouse of the stepped live site along the fixed course of `boss-under-policy.mjs` (the box ticked at 0.8 s, one press at 7.5 s while the boss forms, then from 10 s a new place under the bar every 1.5 s, clicking). The same course run in the logic (`node /tmp/under.mjs 26`) gives the moments. The two runs are the same run as far as checked: `flatten` hits the arrow at the same step in both.
- Seen in the first strip (bound as of 636d3a90): the big cannon's barrel is drawn raised, so its tip stood 12 to 13 px under the bar's frame on the picture (read off frames at 6 times), while the boxes on the page that the test measures said 24.5. The test of task 2 measures places on the page, not drawn pixels.
- Done (commit 2ed22947 and the one after): `TOP.lift` in tune.ts is added to the muzzle's term of `headroom`. With 14 the tip read 23 px under the frame (give or take 2); it is 16 now.
- Read off the second strip (lift 16) at 6 times, frames 48.704, 49.104 and 49.487 s: the tip stands 25, 30 and 34 px of the page under the lower edge of the bar's frame as drawn, give or take 2. The frame's edge is drawn 4 px of the 960 picture higher in this run than in the first; why is not known.
- MEASURED in the logic with lift 16, course 26: he is set down from 48.704 s to 49.508 s (0.80 s), y 400.1 to 452.8 (52.7 px), fastest 126 px/s, which is 2.1 px of the page a frame at 60 a second; his own walk is 190 px/s.
- The film's marks are the same as at 27f7eeef with the lift (`diff` of `node /tmp/ev.mjs`).
- Not known: the lift of other raised parts (the shield's glass, the deck) was not read off a picture. They are lower on the page than the muzzle whenever the turret is up.

### Checks at the tree of this commit (merge55 510be291 merged, lift 16), each alone, 05:36Z to 05:42Z

- Look on: b-boss EXIT 0 (40), boss EXIT 0 (38), boss-closer-acting EXIT 0 (5), boss-fight EXIT 0 (13), site-loading EXIT 0 (17), b-finish EXIT 0 (23), takes-timing EXIT 0 (7), tsc EXIT 0. Film marks the same as at 27f7eeef.
- Not run at this tree: the look off (last run at 40c05ed8), the whole chain of tests, the cut, the build, determinism and the bots' gate.
- Pictures: `S1-` and `S2-set-down-under-the-bar-live-60-a-second.jpg`, 48 frames in a row at 60 a second from 48.704 s to 49.487 s, 1 to 1 from the 960 px live picture, the crop 180 by 240 px under the bar. The last 0.02 s of the set-down are not in them.

## The kept press and line 7 (ruling of 06:52Z November 28)

Fault of d25d7845, MEASURED by the Builder on merge55 b38b9fc0 + d25d7845: three tests of tests/audio-visit.test.ts red on the keen visit.

Cause, MEASURED (a dump of the keen and the clumsy visit through tools/lib/sound-visit.mjs, before the mend): the page took the kept press on the first step of its own clock of line 7, which is 8.792 s after the tick. The voice starts line 7 at 8.790 s after the tick as it hears the tick, and it hears every event at the start of its frame. For the keen visitor the turn reached the voice at 105.300 s and the line was to start at 105.307 s. A turn that comes before the line has started drops the whole line (src/audio/index.ts, `jump`: the end is the start), and the two last parts followed at once, while the page still counted 5.182 s of a first sentence. So the music came 5.467 s after its words. For the clumsy visitor the frame fell the other way (turn 124.950 s, line from 124.940 s) and the sentence was said.

Mend, in my files only: `LINE7.lead` 0.1 s (src/boss/tune.ts). A press from `boss-formed` on is kept (`asked`), and the turn is taken when line 7's clock is at `lead` or later. A press later than that acts at once. The film never sets `asked`. The line `s.turned = earlyEnd(LINE7.ends, LINE7.sentences, s.t)` is as it was.

Why 0.1 s: the page and the voice are one frame apart at most in the stepped runs (0.017 s). On a visitor's machine the frames may be longer; 0.1 s covers a frame of a tenth of a second. STATED, not measured in a browser.

MEASURED after the mend (`BOSS_SAY=1 npx vitest run tests/b-boss.test.ts -t "rulings of 04:46, 3"`, near path and self-tick path, the same numbers on both but for power-up, which is 0.001 s later on the self-tick path, seconds after the tick):
- pressed as soon as formed, 1.5 s before the end of line 6, 0.1 s before it, or as line 7 starts: boss-turn 8.887, first sentence of line 7 ends 13.972 (8.790 + 5.182), boss-music 18.079, power-up 20.762, turret-lock 24.121. Pointer held 3.304 s at the longest.
- pressed 1 s after the end of line 6: boss-turn 9.792, the rest the same.
- never presses: boss-turn 32.112, boss-music 36.221, power-up 38.904, turret-lock 42.263. Pointer held 6.004 s at the longest.
- Line 7's part 0 ends at 5.182 s or at 23.324 s of itself in all six, each the end of a sentence.

MEASURED through the voice (the same dump, after the mend), keen visit, seconds after the tick: line 6 from 0 to 8.490; line 7 part 0 from 8.790, cut at 5.182 s of itself, 13.972; part 1 from 14.273 to 19.863; boss-music heard at 18.066; part 2 from 20.163 to 24.117; power-up 20.750; turret-lock 24.116. Clumsy visit: line 7 part 0 from 8.790, turn 8.883, part 1 from 14.270, boss-music 18.083, part 2 from 20.160, turret-lock 24.117.

The film: `node /tmp/ev.mjs` gives the same marks as at 27f7eeef (diff empty).

The chain of the Builder on this tree (merge55 b38b9fc0 merged), 06:55Z to 07:00Z: TSC EXIT 0, RETIME EXIT 0, CUT EXIT 0, BUILD EXIT 0, VITEST EXIT 1 with 3 failed, 768 passed, 13 skipped of 784. The three: tests/b-shell-turn.test.ts "on step 1 is lifted", tests/polish-tug3.test.ts "is as it was", tests/site-finish-film.test.ts "finds the worst moments". tests/audio-visit.test.ts: 14 passed.

Not run: look off, a browser, the bots' gate, determinism.

The retime to come (not done): src/audio/standin.ts already reads public/audio/index.json, and tests/takes-timing.test.ts reads the lengths and phrase ends from it. `LINE6.after`, `LINE7.part0`, `ends`, `sentences`, `part1`, `music` and `part2` can be worked out from `standIns()` in src/boss/tune.ts, so that a kept take needs no number typed. Two numbers set by hand do not fit a part 2 of 1.9 s: `LINE7.power` 0.6 + `LINE7.glow` 2 = 2.6 s, and tests/takes-timing.test.ts wants that sum under the length of part 2. They want a ruling. The window in which the figure of the power-up stands (part 2 less `power` less `RAISE.early`) is 3.304 s now and would be 1.25 s; whether the figure's moves fit it is UNKNOWN.

## The boss kept state between pictures; the keys of step 4 that are never drawn (asked 08:50Z November 28)

Branch agent/b-boss-state, cut from origin/agent/merge55 e5b2dcb5.

### 1. A picture must hang on its frame number alone

MEASURED on merge55 e5b2dcb5 (`node pipeline/change002/boss-frames.mjs --frames ... --out dir`, tier draft, 1920 by 1080, pictures compared pixel by pixel):
- Frame 11200 (after boss-gone), then 9000, 10700, 10790, 10817 in the same page, against the four drawn alone in rising order: 0 px differ. A frame after gone leaves nothing behind.
- Frames 11080, 11100, 11150, 11190, 11200, 11300, 11450, then the same four, in one page: 9,890, 22,961, 29,991 and 49,018 px differ (largest difference of a channel 219 to 230). So merge55 has the fault; it did not come in with the camera branch.

Cause, MEASURED by a test that was red on exactly this and nothing else: `fling` in src/boss/look1/index.ts adds to a part's place and to its turn. The top of `apply` sets both afresh for every flung part but one: the bay (`m.bay`) had its place set and its turn never. A pose in which the bay is in flight left it turned for every later pose of the same boss. In the picture of frame 10700 drawn after blast frames the bay stands out of the hull. The carriage of the cannon is a child of the body and is set in every pose; on merge55 it was not the part at fault.

Mend: one line in `apply`, `m.bay.rotation.set(0, 0, 0)`, beside the line that sets its place. It is not among the lines the camera helper is changing (31, 132, 267).

Test: tests/b-boss-state.test.ts poses one boss with 14 late views (12 through the blast, 2 after gone) and then each of 6 early views, and compares every object of the boss that is seen (place, turn, scale, kind of material, colour, glow, see-through, name) with the same early view posed alone on a new boss; and a late view after a later one. Red before the mend on the bay's turn only (0.0443, -0.0043, 0.0314, 0.9985 against 0, 0, 0, 1); passes after.

MEASURED after the mend: the same eleven frames in the same order against the four drawn alone: 0, 0, 0, 0 px. The four drawn alone, mended against before: 0 px.

THE FILM CHANGES, in the blast. Before the mend the bay's turn in a frame was the sum of the turns of every pose made before it in that page, so it hung on the order of drawing and on the number of samples of a frame (draft 2, final 24). MEASURED, frames 11110, 11120, 11130, 11140, 11150, 11160 drawn in a row, before against mended: 12,273 px (largest 39), 6,702 (largest 143), 702 (largest 104), 0, 0, 0. In the order of eleven, frames 11080, 11100, 11150, 11190, 11200, 11300, 11450 mended against before: 0 px. The first and the last frame that change are UNKNOWN; they lie where the bay flies in view, between 11101 and 11139.

Not covered by the test: the arena (src/arena/wreck.ts keeps things), the figure of the finish, the weapons, the health bar. The pixel compare of the four frames is 0 after the mend, which covers them for those four frames and that order only. The camera branch (8304177b) was not drawn; UNKNOWN whether its changes leave further state.

### 2. Gate G11, the share of step 4

Before (`npm run -s gate -- --phase 5 --only G11`, EXIT 1): step 4's layout names copy:step4.errorSlabs.0, .1, .3, .4, .5, copy:step4.popups.0.title, copy:step4.popups.0.buttons.0 and .1, and 4 more keys, never drawn.

Decision: in src/pages/step4/layout.ts the rack of slabs and the pop-up windows are in the group `fight-type` only while `POPUPS_ON` (src/boss/tune.ts, false) is true; the banner is always there. The plans, `SLAB_KEYS`, `POPUPS`, the words in the copy and the switch are all kept. tests/boss.test.ts asked that every string of step 4 be in the register; it now asks that the 12 keys (5 slabs, 7 of the pop-up windows) hold words in the copy and are not in the register while the switch is off, and that everything else is.

After (the same command, EXIT 1): no line of step 4. What is left is step 2's `data:step2.years.*` (8 lines and "2 more"), not mine.

MEASURED with the switch set to true for one run and put back: the 7 keys of the pop-up windows are drawn; the 5 slabs (errorSlabs.0, .1, .3, .4, .5) are named and never drawn. No code of the fight draws the slabs under either setting (`drawWeapons` draws the pop-up windows and the banner). So whoever turns the switch on meets those 5 lines again. Not mended: it is outside what was asked, and the note says keep and do not delete.

## The boss page timed for the lines without pauses (asked 09:15Z November 28)

Branch agent/b-boss-fast, cut from 1c0522a3. Not for merge before such takes are kept. The numbers are those of pipeline/change002/fast-takes.json (the Builder's, provisional); public/audio/index.json still holds the kept takes, and no sound was made or heard for this.

### What was changed

- df8f8b75, not a fast number: `LINE7.rise` 3.954 s is the time from the start of part 2 to the turret's lock (it was `LINE7.part2`, the take's own length). The figure's window (`RAISED`), the start of the fight and the gold's end hang on it. In src/pages/step4/script.ts the forming is at `BASE` 9.004 s or at the tick plus `LINE6.after`, whichever is later. MEASURED with the kept numbers: the film's marks are as they were (diff of the list of events empty), tests/b-boss.test.ts 40 passed.
- f44d0cf1, `NEEDS:`: `LINE6.after` 4.57 (was 8.79); `LINE7.part0` 11.325 (23.324), `ends` 0.843, 2.264, 3.986, 5.197, 6.177, 8.319, 9.53, 11.325, `sentences` 2.264, 3.986, 8.319, 11.325; `part1` 2.485 (5.59), `music` 1.228 (3.806); `part2` 1.91 (3.954). `rise`, `power` 0.6, `glow` 2, `lead` 0.1, `gap` 0.3 and the drift's numbers are as they were.
- 6c572db7, `NEEDS:`: config/showcase.json, the boss unit 53.1 s (was 71.8) and its beats (also in pipeline/change002/boss-fast-NEEDS.patch).

### Lengths

The unit: 71.8 s to 53.1 s, MEASURED (`UNIT_SECONDS` of the script, and the film's press at 51.97 s). 18.7 s shorter: 3.59 s because the forming no longer waits for line 6, 15.1 s because parts 0 and 1 of line 7 are shorter. The Builder's estimate was 54.4 s.
The film: the units of this branch add up to 196.1 s (was 214.8 s), STATED by adding config.film.units. With the Decision unit at 14.6 s as on agent/b-decision it would be 189.0 s, STATED, not built.

### Which acting is at which second of the unit (film, MEASURED from the list of events unless marked)

| what | kept takes | lines without pauses |
|---|---|---|
| the tick, line 6 starts | 3.80 | 3.80 |
| "The form" (STATED from the starts) | 7.76 | 5.77 |
| the button cracks | 9.70 | 6.11 |
| "takes that as a threat." (STATED) | 10.23 | 6.62 |
| the machine unfolds | 10.30 | 6.71 |
| the arrow hides, then cowers (the script's numbers) | 10.69, 11.19 | 7.10, 7.60 |
| line 6 ends (STATED) | 12.29 | 8.07 |
| the boss is formed; part 0 of line 7 starts; the arrow sags and starts to drift | 12.59 | 9.00 |
| the drift's first leg ends (the script's number) | 21.92 | 13.53 |
| "Their hand moves" (STATED) | 30.47 | 17.32 |
| "to close the Chrome tab." (STATED) | 33.36 | 18.53 |
| part 0 ends, the drift ends (`boss-turn`) | 35.92 | 20.33 |
| part 1 starts, the arrow stops and stands plain | 36.22 | 20.63 |
| "their student loans.", the music (`boss-music`) | 40.02 | 21.86 |
| part 2 starts: the turn back, the snap, the step before the shield in 0.5 s | 42.11 | 23.41 |
| the gold and the figure (`power-up`) | 42.71 | 24.02 |
| "One more round." (STATED) | 44.86 | 24.47 |
| part 2 ends (STATED) | 46.07 | 25.32 |
| the turret rises | 44.46 | 25.77 |
| the turret locks | 46.07 | 27.38 |
| the first dart | 46.15 | 27.47 |
| the power goes | 58.00 | 39.31 |
| the blast is let go, the body is gone | 63.13, 65.26 | 44.44, 46.58 |
| the fist on the button | 70.66 | 51.97 |

Everything from the turret's lock on is 18.69 s sooner and otherwise as it was: the fight's own beats and the finish were not touched.

### What sits on a phrase and what does not

- The crack and the unfolding keep their place against line 6 by themselves: the crack was 0.53 s before "takes that as a threat." and is 0.51 s before it; the unfolding was 0.07 s after its start and is 0.09 s after.
- The music is on the start of "their student loans." as before (`LINE7.music` is that start).
- The turn back is on the start of "They turn back." as before, and the gold 0.6 s after it, before "One more round." as before.
- The hand to the tab is NOT on "Their hand moves" and was not before: the drift is two legs over the whole of part 0, the first 0.4 of the part long, and the arrow points at the tab's corner for all of it (src/pages/step4/script.ts and the `hold` stage of the page). It moved with the part: the legs take 4.53 and 6.80 s (were 9.33 and 13.99 s), 59 and 63 px a second (were 29 and 31). Not changed; if the second leg should start on "Their hand moves" that is one key of the script.

### Acting that needs longer than its line now gives (kept whole, nothing squeezed, no hold added)

- The rise: 3.954 s from the turn back to the lock, and part 2 is 1.91 s. The line ends 2.04 s before the lock; the gold, the figure and the turret carry the rest. Ruled wanted.
- The forming, in the film: the boss is formed 5.20 s after the tick (1.6 s under the answer and 3.6 s of unfolding, the fight's own table), and line 6 with its gap is 4.57 s. Line 7 starts on `boss-formed`, 0.93 s after line 6's last word (it was 0.30 s). The 3.59 s the arrow used to wait under the answer are gone.
- The forming, on the live site, MEASURED (`BOSS_SAY=1 npx vitest run tests/b-boss.test.ts -t "rulings of 04:46, 3"`): formed 5.80 s after the tick on both paths, so line 7 starts 1.53 s after line 6's last word (it was 0.30 s). A press between the forming and the end of line 6 can no longer happen, because line 6 is over before the boss is formed; a press in the first tenth of a second of line 7 is still kept and acts at 0.1 s.

Live, MEASURED by the same run, seconds after the tick: one who presses at once: formed 5.800, turn 5.900, the first sentence of part 0 whole to 2.264 s of itself, music 9.596, power-up 11.750, lock 15.108, pointer held 3.304 s at the longest (the rise, as before). One who never presses: turn 17.129, music 18.654, power-up 20.813, lock 24.171, held 6.004 s (the drift, as before). With the kept takes the lock was at 24.116 and 42.263.

### Tests

- New: tests/b-boss-fast.test.ts, 5 tests, holds `LINE6` and `LINE7` to fast-takes.json, and the rise to the kept length of part 2 in that file.
- Left red and not bent: tests/takes-timing.test.ts, 5 of 7 (line 7 may start no sooner than line 6 has ended; part 0; the sentence ends of part 0; part 1; part 2). They hold the page to public/audio/index.json and go green when takes of these lengths are kept there (the last one also asks that the gold ends inside part 2, which it no longer does: that one must be re-pinned to the rise when the takes are kept).
- Re-pinned in tests/b-boss.test.ts, all holding under the kept numbers too (40 passed at df8f8b75):
  - "mail of 01:00": in the film the boss is formed at the later of line 6's end and the forming's own length after the tick (it asked for line 6's end only); for the bots, the turn, the music and the lock are counted from the start of line 7, the later of line 6's end and the forming (it asked that the forming be before line 6's end).
  - "rulings of 04:46, 3": the six kinds of press are counted from the forming and from the start of line 7 instead of from the end of line 6, and the lock uses `rise`. The claim that the forming is 2 s before line 6's end is gone, since it is no longer so.
  - "note of 21:27" (the stand-in's size): leaves out the one picture of the look, `boss-look`. Under the kept timing its 28 s held no frame of the fight (the fight stage began at 44.32 s), so it compared nothing; under this timing the fight stage starts at 25.61 s and the look's picture, which spans the screen, was the only far shape (1,105 px against 374). With the look on the stand-in's body is not drawn; what the test still holds is `boss-word` and the two numbers of `BODY`.

### What the branch needs outside my files before the site starts on it

MEASURED 09:32Z to 09:37Z (`node pipeline/change002/boss-talk.mjs ...`, which opens the site): on this branch as pushed "The site cannot start. 3 problems", all three of the narration: lines 6, 7 part 0 and 7 part 1 each run into the next. Three things are needed, none of them mine to commit:

1. The index must hold takes of the new lengths. For a trial I set the seconds and the phrase starts of the four boss lines in public/audio/index.json from fast-takes.json in my working tree and put the file back after; nothing of it is committed and no sound file was touched.
2. `npm run retime` with that index (RETIME EXIT 0) moves the starts of the lines in content/narration.json: boss.verify.0 `at` 0.54286 to 0.76, boss.unfold.0 0.14992 to 0.19438, boss.unfold.1 0.78328 to 0.75871, boss.unfold.2 0.94119 to 0.89391, and in content/narration-drafts.json boss.finish.0 0.00072 to 0.00144. In the film: line 6 from 125.100 to 129.370 s, part 0 from 130.304 to 141.629, part 1 from 141.929 to 144.414, part 2 from 144.715 to 146.625. Not committed (the ruling is not to touch content/narration.json); it is in pipeline/change002/boss-fast-narration-NEEDS.patch, and the same command gives it.
3. After both, the site still does not start: the check `contentProblems` in src/copy.ts gives every line of the film the length of its words at `audio.narratorMaxWordsPerSecond` (1.6, config), not the length of its take, and the lines without pauses are quicker than that. By that check line 6 runs 6.875 s (11 words) and has 4.904 s, part 0 has 11.325 s for 29 words, part 1 has 2.486 s for 7 words: the boss lines need 2.82 words a second or more, or the check must read the takes' lengths. For the pictures only I ran with that number at 3 in my working tree and put it back.

### The pictures and how they were made (working tree only, all put back)

1. The seconds and the phrase starts of line.boss.verify.0 and line.boss.unfold.0, .1, .2 in public/audio/index.json set from pipeline/change002/fast-takes.json (a few lines of Python outside the repo; no other field, no sound file).
2. `"narratorMaxWordsPerSecond": 1.6` set to 3 in config/showcase.json.
3. `npm run -s retime` (RETIME EXIT 0; the five starts named above).
4. `node pipeline/change002/boss-talk.mjs --from 3.8 --to 28.3 --every 0.5 --out /tmp/talk` and `--from 23.2 --to 27.6 --every 0.2 --out /tmp/rise`: film frames at 960 by 540, tier draft, the site built at the opening of the session.
5. `git checkout -- public/audio/index.json content/ config/showcase.json`.
The strips are put together outside the repo: each frame at 240 by 135 with its second, its film frame and, under it, the phrase that fast-takes.json has being said at that second (line 6 from the tick at 3.80 s, part 0 from 9.004 s, part 1 from 20.629 s, part 2 from 23.414 s). The words under the frames are lettered by that tool; they are not the film's own captions, which were not drawn.

### Read off the pictures and the events

- The stillest stretch, MEASURED on the half-second frames (pixels of 518,400 that differ by more than 12 from the frame before): 588 at 21.3 s, 42 at 21.8, 5 at 22.3, 0 at 22.8, 0 at 23.3. From about 21.3 s to the turn back at 23.41 s nothing moves in the picture, 2.1 s, while "they remember / their student loans." is said and the music comes in (21.86 s). The arrow stops at 20.33 s. Under the kept takes the arrow stood from 35.92 to 42.11 s, 6.19 s, STATED from the script, not drawn.
- During part 0 (9.0 to 20.3 s) 2,440 to 9,448 pixels change each half second: the arrow's drift and nothing else that I can name.
- Without a line: 8.07 to 9.00 s (the forming), 25.32 s to the lock at 27.38 s (the rise), and the whole fight after it.
- The rise against the words has changed, and this is the one thing I would have ruled on: under the kept take "One more round." started 2.15 s after `power-up`, when the gold was nearly full (it is full 2.0 s after). Now it starts 0.46 s after `power-up` (24.47 s) and ends at 25.32 s, while the figure is getting up and the gold has just begun; the gold is full at 26.02 s and the fists are held with no line. The power-up cannot start sooner than the turn back that precedes it.
- The figure of the rise stands against the left pane of glass in the film, at the stand it had before this change (`RAISE` and the script's stand are not touched). UNKNOWN whether that was looked at before.

### Checks on this branch (kept index, as pushed)

One at a time: TSC EXIT 0; b-boss EXIT 0 (40), boss EXIT 0 (38), boss-closer-acting EXIT 0 (5), boss-fight EXIT 0 (13), site-loading EXIT 0 (17), b-boss-state EXIT 0 (1), b-finish EXIT 0 (23), b-boss-fast EXIT 0 (5), takes-timing EXIT 1 (5 failed, 2 passed).
The whole suite, 09:37Z to 09:44Z: WHOLE EXIT 1, 10 files and 50 tests failed, 2,333 passed, 29 skipped of 2,412.
- Red on 1c0522a3 too (MEASURED there, the same nine files run alone, 31 failed): tests/b-shell-turn.test.ts 1, tests/config.test.ts 26 (the film is longer than film.maxSeconds), tests/polish-hand.test.ts 1, tests/polish-keys2.test.ts 1, tests/polish-turn2.test.ts 2.
- New with this branch, 19: tests/takes-timing.test.ts 5 and tests/audio-visit.test.ts 3 (the index and the voice still hold the kept takes), tests/content.test.ts 8 (the three boss lines run into the next by the start check), tests/cut-of-build.test.ts 2 and tests/film-cut.test.ts 1 (cut/ is the kept film's; `npm run cut` was not run).
Not run: RETIME and CUT as checks of the chain (RETIME only on the trial index of the four boss lines, to get the starts), the gates, a browser on the live site, tier final.

## The Builder's ruling of 09:59Z on the fast timing: five things (10:00Z to 10:25Z)

All of it is on agent/b-boss-fast, in commits headed `NEEDS:`, because it types phrase marks of the lines without pauses. Seconds below are seconds of the unit in the film; part 2 starts at 23.41 s.

1. The power-up on the words. `LINE7.getup` 0.2: the figure starts to get up 0.2 s into "They turn back.", when the arrow has come back from the top. `LINE7.power` 1.057, the start of "One more round.": the fists are up and the gold starts (`power-up`). `LINE7.glow` 0.853: the gold is full at the end of the line, 1.91 s. `LINE7.full` 0.8: it is held full, then the figure bursts and lies down while the view goes back, and the turret locks 0.05 s after it lies on the page. `LINE7.rise` is 3.456 s (was 3.954). tests/b-boss-fast.test.ts holds `power` to the phrase start in fast-takes.json, `power + glow` to the line's end within 0.1 s, the fists and the burst to those marks through the figure's own plan, so a new take that moves a mark makes the test red until the numbers are typed again. MEASURED on the figure's module: flame 0.12 until 1.057 s, 0.29 at 1.3, 0.74 at 1.6, 0.97 at 1.81, 1.00 at 1.91, 1.00 to 2.7, burst at 2.710, on the page again at 3.406.
   - This needed the figure's module (src/boss/finish/acting.ts) to be told two more things, both optional: `fists`, the time by which the fists are up (the moves are played at the pace that gives, 0.536 of their own time here; the module's own floor is 0.55), and `full`, the time at which the flame is full (it builds from `fists` and is then held to the burst). Without them it plays as before. It is a commit of its own, `pipeline/change002/boss-rise-NEEDS.patch`.
   - The low ring of flame and a first tenth of the glow are there from the moment the figure is up, as before; the build is what starts on "One more round.".
   - `RAISE.back` is gone: the view goes back from the burst until the figure lies on the page, in the film and on the live site.
   - On the live site the same marks hold; the arrow turns angry on `power-up` as before (tests/boss-closer-acting.test.ts pins that, unchanged).
2. The hand to the tab. From the forming the arrow drifts 268 px out of cover in 8.32 s (32 px a second; 59 before this mend, 29 with the kept takes). On "Their hand moves" (17.32 s) it sets off for the top edge, 404 px, speeding up; it is at the edge when "the Chrome tab." has been said (20.33 s), feels 42 px along the edge in the gap and stops dead on "But then" (20.63 s).
3. The stop. On "they remember" (21.12 s) the arrow lets go of its aim at the tab and looks up (`doubleTake`); on "their student loans." (21.86 s), with the music, it stands plain again. Before this mend it stood plain from "But then". SEEN in the frames every 0.1 s: lying grey and flat to 21.1 s, turned and lifted at 21.2 s, pale to 21.9 s, upright with its dark edge from 22.0 s.
4. The view, film only. The whole page until "is ready to give up." has been said (11.27 s), then closer at an even rate to 1.6 times at the end of part 0 (20.33 s), on the arrow, by the same clamp the power-up's view uses, so the left edge of the page stays the left edge of the picture; SEEN in the frames every second, the boss is cut at the right and lower edge of the picture from about 19 s to 23.4 s and the bar is out of the picture from about 13 to 18 s; it goes up with the arrow to the top of the page, stands still from "But then", comes down to the figure's stand through "They turn back." (1.057 s) and is the power-up's view from then on. No new part: `talk()` in src/pages/step4/index.ts and the page's `view()`. The live page's view is as it was, with the new times.
5. Where the figure stands. It stood at the fight's first stand (470, 500), where its darts glance off the shield; the pane's face is at 380 px as drawn and the left fist was 23 px from it. The fists span 155 px (MEASURED on a 1920 px frame). It now gets up at (680, 500): left fist 235 px from the pane (1.52 times its span), right fist about 55 px and the flames about 15 px from the shield's glass (read off the 1280 px frame). It slides the 210 px to the fight's first stand between the burst and the lock, while it lies down. MEASURED: every event from the lock on is at the same time after the lock as before, to 0.01 s, on the first 8 of each of 46 names.

The unit is 52.6 s (was 53.1): the press at 51.47 s, the page turn at 52.10 s. Marks: tick 3.80, crack 6.11, formed 9.00, turn 20.33, music 21.86, power-up 24.48, turret rises 25.27, lock 26.88, first dart 26.97, power-down and fall 38.81, arms 39.82, fire 43.94, gone 46.08, walk 46.48, kneel 49.26, fist 50.57, press 51.47.

The whole suite on a56d2cf5, read 10:31Z November 28 (`npx vitest run`, one job): WHOLE EXIT 1, 11 files and 51 tests red, 2332 passed, 29 skipped. The list of 09:46Z had 10 files and 50 tests. The names are the same but for one new red: tests/site-finish-film.test.ts, "finds the worst moments", which asks that on the keen visitor's step 4 the big blast fires within 1 s after a corner gun. MEASURED (`node /tmp/livek.mjs`, the keen visitor on the live step 4, seconds after the lock): before this change the corner guns fired at 3.65, 9.56, 15.46 and 21.37 and the big blast at 7.26, 21.87 and 25.90, so the second blast came 0.50 s after a gun; now the guns fire at 3.65, 9.55, 15.46 and 21.36 and the big blast at 7.25 and 24.68, the nearest 3.32 s after a gun, and the boss goes down 34.61 s after the lock (35.51 before). The first dart hit is 0.58 s after the lock (0.56 before): the keen visitor's hand is not where it was at the lock, since the lock comes 0.5 s sooner, and its fight runs differently from there. In the film the big blast was never within 1 s of a gun (guns 30.52 and 36.43, blast 34.15). The test is not one of the boss files and is left as it is; the Builder is told.

## The Builder's ruling of 10:35Z November 28: the stray lick, the gold's light, the burst (written 10:51Z)

1. The stray lick. It is the first of the nine licks of the power-up (`LICK.tall` in src/boss/finish/fx.ts): its foot 86 px left of the feet (129 px at the figure's size of 1.5), 30 px high, leaned 0.46 to the left and curled 0.6 the same way, so it lay flat; the ring of flames is 84 px wide at that size, so the lick lay 45 px outside it. MEASURED by one frame drawn with that lick's height at 0.001 (frame 8832, tree not kept): the streak is gone and nothing else changes. Now it leans 0.3 and curls 0.55 back toward the figure, as its twin at the right does (88, lean -0.3, curl -0.55). SEEN in frame 8832 after: it stands at the left edge of the ring. One line of fx.ts, which the camera helper's branch does not touch there (its hunks start at lines 4 and 148); commit headed NEEDS, copy in pipeline/change002/boss-lick-NEEDS.patch.
2. The light, film and live alike (one part, src/pages/step4/real/rise.ts, which wraps the figure's part; numbers in `RISE_LIGHT` of tune.ts). Its level is the flame's from 0.12 to 1 taken as 0 to 1, times the flame's own flicker. A flat disc of gold on the floor, 290 px round the feet, at most 0.55 of the floor's colour at the feet and none at its edge, which also brightens the seams under it. Two lights with no shadow, each 110 px before what it lights and 140 px up, power 1.3 at full, reach 420 px: one before the near pane's face, one before the shield on the line from the boss to the figure. They are emitters of the page, so they come out of the renderer's fixed pool of lamps (6, 4 or 2 by quality) and add no light of their own and no shadow map. The figure, its flames and its ring are not touched.
3. The burst. One ring on the floor from 84 px (the ring of flames) to 600 px (half the width of the closer view, 1200 px) in 0.35 s, slowing, fading evenly to nothing, 56 px wide. The glass: the view says the shield is struck at the moment the ring is at it (0.028 s after the burst with the boss at its place and the figure at (680, 500)), which is the look's own flash of 0.3 s for a dart that glances off; no event is sent and no sound asked for. A light of power 2.6 before the glass while the ring is within 150 px of it. In the film only the view shakes: 3 page px falling to none in 0.3 s at 27 turns a second. MEASURED (`node /tmp/shake2.mjs`, the film's view with the shake against the same run with it at 0): at most 3.48 page px apart, from 26.133 to 26.387 s of the unit, the eye's height the same.

The fight's timing, MEASURED (`node /tmp/ev.mjs 60`, the list before against the list after by `diff`): the same, every one of the 46 event names with the same first 8 times to 0.01 s, the lock at 26.88 s.

The live page's worst frame time during the power-up: not measured, UNKNOWN. The sandbox draws with a software renderer, so a time read here says nothing of a visitor's machine, and no live browser run was made. What is added to a frame: two flat quads with no texture, blended, with no depth written (the disc 580 px across, the ring's up to 1312 px), up to three emitters out of the fixed pool, and one more reading of the figure's state, MEASURED at 0.006 ms a call (20,000 calls in 120.8 ms in node).


## The Builder's ruling of 11:01Z and its addendum of 11:12Z, November 28 (written 11:21Z)

Branch agent/b-boss-fast, on 7a91ef5e. One commit, headed NEEDS. All numbers are in `RISE_LIGHT` of src/boss/tune.ts; the part is src/pages/step4/real/rise.ts.

1. The floor's gold. Why it showed pale: MEASURED on frame 8832, 100 px from the feet, as built (252, 241, 175). The floor there is brighter than the picture's white before my disc is laid on it (the figure's own gold light and the lens glow of the flames), so a disc that mixes gold into it only tints a white. Mixing more did little (most 0.85 and a deeper gold: 251, 232, 151) and multiplying the floor's colour did less (252, 244, 190). What works: a second flat disc of the same reach, drawn under the first, that lets no colour of the floor be brighter than a gold (`pool`): what is darker (the shadows, the seams) is left as it is. Three values on one sheet: A as built; B `pool` most 0.85, colour [1, 0.5, 0.1]: (252, 232, 147); C most 1, colour [1, 0.36, 0.03]: (252, 221, 130). Kept in the code: B. Why: at C the pool is as deep as the orange of the licks, which then stand out less against it; at B the floor is the gold of the flames' body and the licks keep their edge. The first disc now mixes the pool's gold, not the paler one.
2. The boss's near metal and the shield. The metal is nearly all mirror (metalness 0.9 to 1) and the camera looks down, so a lamp at the side shows on it only as a small highlight: raising its power or moving it nearer whitens the floor first. Done by a flat quad instead (`near`): it lies 10 px over the floor, is drawn only where something stands over it (the depth test turned round), and makes what is there brighter by its own colour, so the dark stays dark; none within 104 px of the feet (the figure and its flames are not touched by it), full by 148 px, none at 420 px. It lifts all that stands in that reach: claws, plate, guns, the shield's frame and the glass before it, a pillar's top if one is that near. MEASURED on frame 8832, means of 12 px squares: claw (141, 143, 144) to (192, 170, 150), plate (150, 149, 147) to (206, 179, 153), glass (188, 199, 172) to (236, 226, 178). No lamp added.
3. Addendum, the fists in the facing view. Three lights with no shadow out of the fixed pool, in step with the flame: one under each fist (40 px toward the feet and 28 px before the fist in the figure's own px, power 2, reach 120) and one low before the feet (power 0.4, reach 100). MEASURED in the facing view at 25.7 s (the camera helper's branch 179236a1 merged in a scratch tree that is not pushed, CAMERA.powerUp true there), means: left fist (25, 22, 17) to (73, 64, 41), right fist (36, 32, 22) to (98, 85, 52); the arrow's face (225, 223, 219) to (255, 255, 254). No halo: nothing is drawn round the figure. SEEN: the black edge of the arrow shows brass along its lower and side edges, and the shoes olive. From above (frame 8832) the change stays within the figure's place (the picture differs only inside x 708 to 1273, y 443 to 874 of the 1920 px frame).
4. Cost: two more flat quads and three more emitters; the emitters are joined into the pool's 6, 4 or 2 lamps by the renderer as before. On the live site's levels with 4 or 2 lamps the fist lights are joined with the figure's own gold light: what that looks like is UNKNOWN, not seen.
5. The scratch merge of the camera helper's branch had two conflicts, both mine to say: the import line of src/pages/step4/index.ts (both names are wanted: CAMERA and RISE_LIGHT) and the last lines of src/pages/step4/real/index.ts (its long line, then my one line after it).

## The Builder's ruling of 11:30Z, November 28 (written 11:38Z)

One commit on 1086c2e4, headed NEEDS. The pool (B) and the fists' lights were accepted; the near lift was not.

1. The near lift, one pass. It now falls off across the boss: none within 120 px of the feet, at its most 180 px out (where the claw tips and the shield's rim are), falling evenly to none at 260 px, so the far ends of the arms and the far part of the plate keep their steel. Strength 0.66 (was 2.2 over a reach of 420) and a deeper gold of its own, [1, 0.45, 0.08]. It is drawn before the shield's glass, so the glass shows only what of it comes through (the glass covers 0.62 of what is behind it) and the rim takes it whole. MEASURED on frame 8832, means of 12 px squares, lift at nothing against the lift: claw (142, 144, 144) to (164, 154, 146), aimed at about (170, 158, 147); far end of the arm (99, 100, 100) to (108, 104, 101); near of the plate (150, 149, 147) to (176, 162, 149); a dark joint (100, 102, 102) to (117, 110, 104); glass (190, 201, 174) to (204, 208, 175), green still its greatest; the button's near edge (187, 90, 48) to (217, 97, 49). To turn it off: `near.most` 0, the code stays.
2. The arrow's face in the facing view. Not had. The fists' lights were moved outside the fists (`in` 1.15, was 0.8) with a shorter reach (85, was 120) and the feet's light was taken down (0.25, was 0.4). MEASURED in the facing view at 25.7 s: the share of the face's box at 253 or more went from 59.7 percent to 48.5 (5.0 with no light on the figure); the fists (89, 77, 48) and (85, 74, 45), against (73, 64, 41) and (98, 85, 52) before. With the feet's light at nothing the share was 43.1, with the fists' power at 1.4 it was 41.8 and the fists (77, 67, 42) both: the face does not follow these numbers, so I left the power at 2. Why is UNKNOWN; my guess, not measured, is that with more emitters than the pool's 6 lamps the renderer joins the fists' lights with the lights already at the figure and the joined lamp stands before the face.

## The Builder's ruling of 11:41Z, November 28: the film draws the same picture twice (written 12:08Z)

1. What was not the same. MEASURED on 1920x1080, film frame 9198 (32.0 s of the boss unit, the arrow lying flattened): six drawings of that one frame, each in a session of its own or after 31.0 s, differ from one another by 89 to 119 px (`compare -metric AE`), all on the rim of the lying arrow, by 1 to 30 levels. It is not the smoke: with the arrow's puffs hidden the count stays (93), with the arrow's side walls hidden it stays (122), with the arrow's body mesh hidden it is 0. With the body's shape frozen it stays (118), with the lamps of the page taken away it stays (88), with one flat colour written by the body's shader it is 0: so the outline is the same every time and the shading is not.
2. The cause. In the arrow's own shader (src/cursor/model/material.ts, `wjaSurface`, the crazing of a flattened arrow) the widths of the hairline cracks are read with `fwidth`, `dFdx` and `dFdy` inside `if ( crack > 0.0 )`, and `crack` is nothing on the dark rim. A slope read inside a branch that a neighbouring pixel does not take is not defined: on the rim it is whatever was left in the renderer's memory, so it changes from one drawing to the next. No random number and no clock is read. With those three slopes set to fixed numbers the count is 0; with the rim's own `fwidth` set to a fixed number it stays (112).
3. The mend. One line: the branch is taken on the crack's strength alone (`if ( uMarks.x > 0.0 )`), which is one number for the whole arrow, so every pixel of the body takes the same path and the slopes are defined. `crack` still multiplies everything the branch does, so a pixel on the rim, where it is 0, is drawn as before. The file is the arrow's unit's, not mine: the change is pipeline/change002/boss-crack-NEEDS.patch and one commit headed NEEDS. Film and live site share the shader; the live site's free smoke is not touched.
4. After the mend, MEASURED (`node pipeline/change002/boss-same.mjs --runs "32,32.2,32.4/32,32.2,32.4/32.4/32.2"`, then `compare -metric AE`): 32.0, 32.2 and 32.4 s drawn in two sessions in the same order: 0, 0, 0. 32.4 s drawn alone against 32.4 s drawn after 32.0 and 32.2: 0. 32.2 s drawn alone against 32.2 s after 32.0: 0. Frame 9198 before the mend against after: 218 px, on the arrow's rim.
5. A second thing found and not mended. The same film frame drawn twice in a row in one session differs by 104,193 px (the boss, the bullets, the ring round the arrow). The parts of the boss do not read the frame they are given: they read `viewNow()` and `finishNow()` (src/boss/viewof.ts), which hold what the page drew last. A frame is drawn at three moments of the shutter (0, a half step and one and a half steps on); the stage keeps the last 12 steps it drew, so on a second drawing no step is drawn again and all three moments show the boss as it was at the last one. A frame drawn once, after any earlier frame, is not touched by this (32.0 after 31.0 against 32.0 alone: only the rim's pixels, and 0 after the mend). It bites only when a frame is drawn again while its steps are still kept: a retry, or frames drawn backwards. The mend would be to key the view by the step and let the parts ask for the step of the frame they are given; that is in my files but it touches how every boss part reads its view, so it waits for a ruling.
6. Tools: pipeline/change002/boss-same.mjs (frames in separate sessions), boss-dump.mjs (what the scene holds at each moment of the shutter) and boss-noise.mjs (one frame twice under each trial). The last two need one line added to src/main.ts for the run only, `window.__app = app`, which is not in the tree.

## The Builder's ruling of 12:13Z, November 28: a film frame is the same however it is asked (written 12:43Z)

1. The mend of the second finding, in my files. The page's draw() now keeps what it said at each step (`keepView` in src/boss/viewof.ts, 64 steps held, the stage keeps 12) and names the step on the three anchors it lays down (arena, boss-look, finish-figure) as `v: [run, step]`, run 0 for the film and 1 for the live site. The three wrappers of the parts (`shaken` twice, `lit`) call `seatView` with their anchor before anything is posed, so `viewNow()` and `finishNow()` answer for the step of the picture being drawn. Between two steps the stage blends the numbers of `v`, and the part takes the later step: that is the step the page had drawn last on a first drawing, so a first drawing is not changed. An anchor without `v` (the harnesses) leaves things as they were. The arena's file and the figure's file are not touched.
2. A first try named the page's own number on the anchor too, so that two stages could never take each other's steps. tests/boss.test.ts "continues exactly from a save" then failed ten times: two pages no longer laid down the same list. The number of the page was taken out; film or live is read from the page's state, so the list is again what the state alone gives.
3. MEASURED on hd 1920x1080, draft tier, head 3eb45935, `node pipeline/change002/boss-same.mjs --runs "25,32,44/32,32/25,25/44,44/32,32.0167,32,32.0167/32.2,32/25,25.0167,25/44,44.0167,44" --out /tmp/post2`, EXIT 0, then `compare -metric AE`:
   - (a) the same frame twice in one session: 32.0 s 0 (before the mend 104,132), 25.0 s 0 (before 176,074), 44.0 s 0 (before 122,766).
   - (b) backwards with the steps still kept: 32.0, the next frame, 32.0 again: 0 against its first drawing and 0 against 32.0 alone; the next frame again: 0; the same at 25.0: 0; at 44.0: 0. Backwards beyond what is kept: 32.2 then 32.0 against 32.0 alone: 0 (it was 0 before the mend too: the stage throws the kept steps away when it goes back past them).
   - (c) drawn once in forward order, before the mend against after: 25.0 s 0, 32.0 s 0, 44.0 s 0. The blur: tests/b-boss-same.test.ts holds that the three moments of the shutter are given three steps of the page one step apart on a first drawing and on every later one; and a crop of two bullets at 32.0 s is the same pixel for pixel before and after on a first drawing, while the second drawing before the mend shows them without their smear.
   - control: 32.0 against the next frame: 1,776,220.
4. The new test, tests/b-boss-same.test.ts, 11 cases: with the body of `seatView` switched off 7 of the 11 fail (EXIT 1); with it 11 pass.
5. Slopes read inside a branch, in my files (src/boss, src/pages/step4): `rg -n "fwidth|dFdx|dFdy" src/boss src/pages/step4` gives no line, and no shader there reads a texture at all. Elsewhere, read only and not examined: src/table/real/models/street/mats.ts lines 97 and 111 sit inside `else if ( kind == ... )` where `kind` comes from a per-pixel value.
6. A third thing, found while proving (b), in a file that is not mine. 44.0 s drawn after 25.0 and 32.0 against 44.0 s drawn alone: 18,091 px, behind the figure's feet and on the boss's plate, the same before and after my mend. A dump of the scene at the last moment of the shutter shows the shadow frustum of the first emitter lamp differing between the two. src/core/renderer.ts line 293 sets the far plane of an emitter lamp's shadow camera to the lamp's reach and does not rebuild the projection; the library rebuilds it only when the far plane differs from the lamp's distance, and the rig has just made them equal. So a lamp that throws a shadow keeps the frustum of the lamp that held its slot before. With one line added (`updateProjectionMatrix()`), MEASURED: 44.0 after 25 and 32 against alone 405 px, all by 1 level, box 730,940 to 789,984, cause UNKNOWN; 25.0 and 32.0 unchanged by the line (0, 0); 44.0 in forward order changed by 17,750 px; 44.0 alone changed by 163 px. The line is pipeline/change002/boss-lampfar-NEEDS.patch and one commit headed NEEDS; it is the core renderer and reaches every page that has a shadow lamp.

## The Builder's ruling of 12:50Z, November 28: the lamp line measured across the pages (written 13:07Z)

Nothing but tools and these notes was committed. The line (f67abc88, src/core/renderer.ts) was put in and taken out in the working tree only.

1. Which pages put a lamp that throws a shadow into a slot. STATED by reading (`rg "shadow: true|shadow\b" src`): three places ask for it. src/boss/finish/fx.ts line 489, the cold ball of the boss's charge, reach `170 + 170 * glow`, so its reach moves from frame to frame and inside one frame. src/pages/step1/real/turrets.ts line 408, the lamp of a turret's bolt (reach 48) or blast (reach 90), reaches that never move. src/table/real/lights/index.ts, the table's insert and globe lamps, at most `TRUE.shadows` of them, and `TRUE.shadows` is 0, so none. MEASURED by posing every film moment a quarter second apart and counting (`node pipeline/change002/boss-lamps.mjs`, EXIT 0): careers 0 of 76 moments, step 1 17 of 142 (4.5 to 9.25 s, one lamp, reach 90), step 2 0 of 100, step 3 0 of 168, the boss 16 of 211 (40.25 to 44.0 s, one lamp, reach 181 rising to 363), Decision 0 of 87. Never two at once.
2. When a slot's projection is rebuilt. STATED by reading src/core/renderer.ts and the library's WebGLShadowMap.js: the two first slots (film: pool 6, shadows 2) get their shadow map on the first frame drawn after `resize()` (a session's start, or a change of level on the live site), whether a lamp sits in them or not, and the library builds the projection there, once. After that only when the lamp's reach is not the camera's far, and line 293 makes them equal before the library looks, so never. MEASURED in the dumps: an empty slot is given far 100 (the lamp's first reach), a slot with a lamp the reach that lamp had on that first frame.
3. The two numbers for 44.0 s. MEASURED (/tmp/dump44, without the line): drawn after 25.0 and 32.0 the slot holds far 127.5, which is the reach of the gold lamp that sat in it at 25.0 s, and the cold ball's own reach is 363 to 366.5 over the frame. The stale frustum is the shorter by about two thirds: whatever stands more than 127.5 px from the ball throws no shadow, and nearer things are read as farther than they are. Drawn alone the slot holds 364.8 against 363 to 366.5. On step 1 the other way: after 1.0 and 3.0 s the slot holds 100 and the blast's reach is 90, the stale one is the longer by a ninth; alone 90 and 90.
4. The table, MEASURED, hd 1920x1080, draft tier (`node pipeline/change002/boss-same.mjs --runs "step1:1,step1:3,step1:5,step1:7.5,step1:9/step1:5/step1:7.5/step1:9/25,32,41,42.5,44/41/42.5/44/marketing:10,step2:20,pinball:2.25,pinball:18.25,decision:1"`, once without the line into /tmp/lw and once with it into /tmp/lf, both EXIT 0). Each cell: px that differ, px by more than 8 levels, the box.

| page, second | shadow lamps | after two earlier frames against alone, without | the same, with | forward frame, without against with |
| --- | --- | --- | --- | --- |
| careers 10.0 | 0 | not drawn | not drawn | 0 |
| step 1, 5.0 | 1 | 0 | 0 | 0 |
| step 1, 7.5 | 1 | 0 | 0 | 0 |
| step 1, 9.0 | 1 | 0 | 0 | 0 |
| step 2, 20.0 | 0 | not drawn | not drawn | 0 |
| step 3 tube, 2.25 | 0 | not drawn | not drawn | 0 |
| step 3 machine, 18.25 | 0 | not drawn | not drawn | 0 |
| boss 41.0 | 1 | 15,672; 950; 0,864 to 710,1079 | 538; 0; 529,972 to 561,1005 | 15,122; 950; 0,864 to 710,1079 |
| boss 42.5 | 1 | 17,637; 1,025; 0,861 to 707,1079 | 797; 0; 528,969 to 569,1006 | 16,835; 1,025; 0,861 to 707,1079 |
| boss 44.0 | 1 | 18,091; 654; 0,653 to 1418,1079 | 405; 0; 730,940 to 788,983 | 17,750; 654; 0,653 to 1418,1079 |
| Decision 1.0 | 0 | not drawn | not drawn | 0 |

   The earlier frames: step 1 at 1.0 and 3.0 s, the boss at 25.0 and 32.0 s; without against with there: 0, 0, 0, 0. The frame drawn alone, without against with: step 1 0, 0, 0; boss 41.0 15 px (none over 8), 42.5 29 px (1 over 8), 44.0 163 px (none over 8), since the ball's reach grows inside the frame.
5. Which is right. MEASURED on the boss frames in forward order: without the line the changed pixels are brighter and bluer than with it (44.0 s, the pixels over 8 levels: 14, 21 and 29 levels more red, green and blue), that is the cold ball's light lies where with the line a shadow lies. The frame drawn alone, where the slot's far was the ball's own reach with or without the line, has the shadow. In the crops: with the line a darker patch lies on the ground to the right of the ball, running out from the figure's foot past the green blocks, and each block has a dark side away from the ball; without the line that ground is evenly lit. On the plate round Submit at 44.0 s: 2,234 px, at most 6 levels.
6. The 405 px, one try, not found. MEASURED (/tmp/dumpd, with the line, 44.0 alone against 44.0 after 25.0 and 32.0): the two lamps' maps are 512 by 512 in both, mapSize 512, bias -0.0015, normalBias 0.4, radius 1 in both; STATED by reading: they are set once when the rig is made and no line sets them for a lamp afterwards. So the map keeps no earlier lamp's size or settings. What does differ in the dump: the second slot, which holds a lamp that throws no shadow (shadow strength 0), has its map drawn once on the session's first frame and never again, so its shadow camera stands where the lamp of 25.0 s stood; and the frames of the key's and the fill's shadow cameras differ in the last digit while the page's box and the lit rectangle are the same. What the pixels are: a slanted band about 12 px wide to the right of the ball at 44.0 s (1 level darker after), a slanted four-sided patch of 33 by 34 px at 41.0 s (up to 2 levels darker after, most in blue, the cold ball's colour). Cause UNKNOWN.
7. Not measured: the live site (a level change is the only rebuild there, and step 1 and the boss are the pages with such a lamp); the other formats and tiers; a turret's bolt lamp of reach 48, which no quarter second of the film showed.
8. The camera helper's own measure at 12:55Z, with the line in its tree and not committed: 42.0 s first of a session against 42.0 s in a run from 34 s, 64 px without and 0 with; without against with in that run: 41 s 655, 42 s 64, 43 s 170, 44 s 5,837, the other seconds from 34 to 48: 0.

## The Builder's ruling of 13:17Z, November 28: the 405 px at 44.0 s with the lamp line (written 13:33Z)

Nothing but tools, one patch file and these notes was committed. Every knock-out was put in and taken out in the working tree only. Head d6b44a94, hd 1920x1080, draft tier, sessions 41 / 42.5 / 44 alone against 25, 32, 41, 42.5, 44 in one session.

1. The cause, MEASURED. The standing arrow's long shadow (the see-through pieces under `finish/stand/Group.1`, meshes 0, 2 and 4, which share the bent shapes of the figure) is drawn in a different order in the two sessions: alone 0, 2, 4, after the two earlier frames 4, 0, 2 (`node pipeline/change002/boss-draws.mjs --runs "44/25,32,44/41/25,32,41" --out /tmp/ord`, EXIT 0, the `drawn` list of draws 0 and 2 of the 44.0 s frame; 164 things in both, three places differ). The bent shapes keep the sphere of the first pose drawn in a session (three of them differ in the record, for one: centre 20.63, -35.12, 4.57 reach 40.91 alone, centre 20.09, -34.76, 5.22 reach 41.95 after), and the library puts see-through things in order by the sphere's centre. This is the camera helper's finding for its 48.0 s (55f111c9 on agent/b-camera-rise, src/cursor/stand/figure.ts, not my file).
2. With the camera helper's fixed spheres in the tree (the hunk of 55f111c9 in src/cursor/stand/figure.ts and nothing else): 41.0 s 0 px (was 538), 42.5 s 0 (was 797), 44.0 s 0 (was 405) (`boss-draws --out /tmp/k0`, EXIT 0); the order of the three pieces is the same in both sessions, 0, 2, 4 (`--runs "44/25,32,44" --out /tmp/ordk0`, EXIT 0). The fixed spheres change the picture itself: 44.0 s alone against 44.0 s alone at head 1,385 px, most 3 levels, box 558,914 to 819,991.
3. The ball lamp's slot, ruled out. MEASURED per draw (17 shadow draws a frame; draws 0 and 2 are the two samples and hold key, fill and two lamps, the other 15 are handed no light): slot 0 holds the same place, distance (364.78 then 366.55), strength, near 2, far, projection elements 10 and 14 and map size in every draw of both sessions; its map is redrawn in every draw (autoUpdate true); the things handed to its map are the same list in both. The one difference: alone its map is made in draw 0.
4. Knock-out (a), ruled out. Slot 1 (no shadow, strength 0, autoUpdate false) has its map drawn once in draw 0 of a session's first frame and never after. With the slot redrawn in every draw (`lamp.shadow.autoUpdate = lamp.castShadow` in `light()`, `boss-same --out /tmp/ka`, EXIT 0): 538 / 797 / 405 unchanged, and 44.0 s alone against head alone 0 px.
5. Knock-out (b), ruled out, done as the removal of the carry and not as rounding. The key's and the fill's shadow frames (left, right, top, bottom; the fill also near, bias and the projection) differ in the last digit between the sessions. Where it comes from: `aim()` in src/core/renderer.ts keeps one matrix, `this.m`; `lookAt` writes its nine turning numbers and `setPosition` its three of place, so its bottom row is what the last `invert()` left (element 15: 1 in a fresh rig, 0.9999999999999991 after two frames) and the rounding builds up with every aim of a session. The inputs handed to aim (place, target, up, bounds, reach, texel) were equal. With `this.m.identity()` first (`boss-draws --out /tmp/kb`, EXIT 0): the values that differ between the sessions fall from 27 and 23 (draws 0 and 2) to 0; 538 / 797 / 405 unchanged; every frame against head 0 px (41, 42.5, 44 alone; 25, 32, 41, 42.5, 44 forward).
6. Offered, not applied: pipeline/change002/boss-aim-NEEDS.patch, the one line of 5 in src/core/renderer.ts and one case for tests/b-boss-same.test.ts (a rig aimed 48 times against a fresh rig). MEASURED: the case fails without the line (1 failed, 11 passed, EXIT 1) and passes with it (12 passed, EXIT 0). It changes no pixel of the eight frames measured; the other pages are UNKNOWN. It is not on my branch because the case fails there without the line and the line is not the cause.
7. Not done. No test of the spheres in my test file: the mend is in the camera helper's file and its own test (tests/b-camera.test.ts at 55f111c9) holds it; a case of mine would fail on this branch, which does not carry the mend. Not measured on trial/p15: UNKNOWN whether the three numbers are 0 there. Two top-level see-through things sit at places 21 and 22 of their parent alone and at 71 and 72 after the earlier frames; they are drawn at the same places in the order (161, 162) and the picture is 0 px with the spheres fixed; what they are was not looked up.
8. The tool: pipeline/change002/boss-draws.mjs, one record for every shadow draw inside a film frame (each light's slot, place, distance, strength, near, far, projection, map, the things handed to each map, the spheres of the bent things, and the order the things are then drawn in). It needs the one line in src/main.ts for the run only, as boss-lamps does.

## The Builder's ruling of 13:43Z, November 28: the trial measured, the lamp line and the aim line (written 13:59Z)

A detached checkout of agent/trial-p15 dbb3b410 beside this one, my tools copied into its working tree, nothing committed or pushed there. hd 1920x1080, draft tier. The trial holds the fast lengths; the boss unit is frames 7278 to 10511.

1. The trial carries the lamp line. MEASURED: `git merge-base --is-ancestor f67abc88 dbb3b410` says yes, src/core/renderer.ts line 294 is there, and `git diff d7a1528d dbb3b410 -- src/core/renderer.ts` is empty. So "without" below is the trial with line 294 taken out in the working tree, and "with" is the trial as it is.
2. The marks. MEASURED (`node pipeline/change002/boss-lamps.mjs --every 0.25 --out /tmp/trial-lamps.json`, EXIT 0): a lamp that throws a shadow sits on the boss page from 40.25 to 44.0 s (reach 181 to 363) and on step 1 from 4.5 to 9.25 s (reach 90), as on my branch. The moments stay 41.0, 42.5, 44.0 and 48.0.
3. MEASURED, the same command three times (`node pipeline/change002/boss-same.mjs --runs "41/42.5/44/48/25,32,41,42.5,44,48/25,32,48[/five pages]" --out /tmp/tA`, then /tmp/tB, /tmp/tC, EXIT 0 each). A frame drawn after earlier frames against the frame drawn alone: pixels; pixels over 8 levels; box; largest level.

| moment | with the lamp line (the trial as it is) | without the lamp line | with the lamp line and the aim line |
| --- | --- | --- | --- |
| 41.0 after 25, 32 | 0 | 827; 24; 1005,606 to 1919,1079; 18 | 0 |
| 42.5 after 25, 32, 41 | 0 | 507; 0; 1021,577 to 1297,739; 6 | 0 |
| 44.0 after 25, 32, 41, 42.5 | 0 | 12,762; 48; 1037,541 to 1919,774; 17 | 0 |
| 48.0 after 25, 32, 41, 42.5, 44 | 1; 0; 1269,354; 1 | 1; 0; 1269,354; 1 | 1; 0; 1269,354; 1 |
| 48.0 after 25, 32 | 0 | 0 | 0 |

4. Which pixels without the line: at 44.0 s the shadow that the boss's plate throws away from the cold ball, to the right of the plate on the table; drawn alone it is there, drawn after earlier frames it is weaker. Without against with in forward order: 25.0 and 32.0 0, 41.0 834 px (most 18 levels), 42.5 507 (6), 44.0 12,794 (17), 48.0 0.
5. The aim line (pipeline/change002/boss-aim-NEEDS.patch applied in the trial's working tree, lamp line in). Against the trial as it is: 0 px on every one of 23 frames: the 13 boss frames of the table, and careers 10.0, step 1 7.5, step 2 20.0, the machine 18.25 and Decision 5.0, each drawn alone and all five in one session. Each of the five shows cast shadows (cards, keys and arrow, lever and button, the machine's parts, the paper and the red button). The five drawn in one session against alone, without the aim line: 0, 0, 0, 0, 0. tests/b-boss-same.test.ts on the trial with the patch: 12 of 12, EXIT 0.
6. The 1 px at 48.0 s (one level, at 1269,354) is there with and without the lamp line and with the aim line; it comes after frames of the finish (41 to 44) and not after 25 and 32 alone. Its cause was not looked for in this unit.
7. Not measured: the final tier, the other formats, a session as long as one of the sixteen pieces, the live site.

## The Builder's unit of 14:05Z, November 28: the turn from the boss page to Decision (written 14:21Z)

Branch agent/b-boss-turn, from the trial dbb3b410, with agent/b-boss-fast 404bac93 merged in for the tools and these notes (no source of the site in that merge).

1. The cause, MEASURED from the stage. The slab's angle is not behind: on the page's last eight film frames at 60 a second it is 42.19, 46.92, 51.98, 57.39, 63.16, 69.29, 75.80, 82.70 degrees on the boss page and the same eight on step 1 (and on careers, step 2 and the machine). What differed is where the picture is taken from: src/pages/step4/index.ts, `view()` (line 931 at dbb3b410) gave the close view of the finish to the page's end, eye 1531.2 over the point 180 px left of the middle, where every other page turns seen from 3062.5 over its middle. So the turn was seen at twice the size and off centre, and the view jumped at the join.
2. The mend, in my files. `CLOSE.back` 0.4 in src/boss/tune.ts and one line in the last moment of src/pages/step4/index.ts: in the film the close view goes back to the whole page over the last 0.4 s of the 0.5 s the film holds after the blow on Submit (`LAST.hold`). MEASURED: the blow stays at 52.7708 s, the view is whole from 53.27 s, the turn starts at 53.4 s as before. No step of the press or of the turn moves; the part keeps its 3,234 frames, cost 0 frames. The live site is not changed.
3. MEASURED on the preview format 960x540, draft tier (`node pipeline/change002/boss-same.mjs --runs "<the three joins, eight frames each>" --format preview --out /tmp/turnA` before and `/tmp/turnB` after, EXIT 0 each), the rows above y 470 of which more than 30 percent are brighter than 70:

| join | before | after |
| --- | --- | --- |
| careers to step 1 | 411, 346, 258, 144 then 25, 146, 233, 297 | the same, 0 px changed |
| step 1 to step 2 | 411, 346, 256, 138 then 25, 146, 234, 298 | the same, 0 px changed |
| boss to Decision | 470, 470, 456, 372 then 23, 146, 231, 295 | 468, 415, 334, 227 then 23, 146, 231, 295 |

   The change between the two pictures at the join (mean over the pixels of the three channels' differences added): careers 142.4, step 1 71.0, the boss 199.7 before and 161.6 after.
4. What is left, and why. The boss page's rows are still more than the other pages' (227 against 144 on the last picture). MEASURED: the page's slab is thicker. src/shell/real/ground.ts line 242 makes a slab as thick as its deepest well and 10 more, and the empty socket of the Submit button is a well 150 deep (`HOLE.floor` in src/boss/body.ts), so the slab is 160 thick where step 1's is 28; in the picture at film frame 10510 its upper side stands 85 px tall, on step 1 at 3262 15 px. With the socket 18 deep, in the working tree only and not kept, the rows are 458, 381, 290, 176. The rest is what stands tall on the floor. Neither was changed: the socket's depth is part of the look.
5. tests/b-boss-turn.test.ts, 4 cases: the eight angles equal step 1's; the page is seen whole from the step its slab starts to turn; it is still close at the blow and until the way back starts; the press and the turn stand where they stood. Without the line in the page 2 of the 4 fail (EXIT 1).
6. Not measured: the hd format and the final tier; the sound of the last moment against the picture; the live site's own turn, which still leaves from the close view.

## The Builder's unit of 14:23Z, November 28: the live way back, the bar after the kill, the whole page at 53.2 s (written 14:45Z)

Branch agent/b-boss-turn. Three commits: 2f4e08f0 (a), 483085c3 `NEEDS:` one line of the arena, dafc5190 (b).

(a) The live site's way back.
1. What was built. The line of the last moment in src/pages/step4/index.ts that took the film's view back now runs on the live site too: `s.close` falls to 0 over `Math.min(CLOSE.back, hold)` at the end of the hold, where the hold is `LAST.hold` 0.5 s in the film and `LAST.held` 0.35 s on the live site. In the film nothing changes (0.1 s close, 0.4 s back). On the live site the view leaves at the blow itself and takes the whole 0.35 s.
2. The visitor's wait after the blow: 0.35 s, as it was; 0 s more. MEASURED in tests/b-boss-turn.test.ts on a keen and a clumsy visitor, three seeds each: the slab starts to turn between `LAST.held` less one step and `LAST.held` and two steps after `button-press`. MEASURED in the browser: the slab turns from step 15861 (66.0875 s) and the next page is there at 66.5875 s, before and after the same.
3. Decision of mine: the wait is kept and the way back is 0.05 s shorter than the film's, and the blow is not seen close for 0.1 s first as in the film. The other way is one number: `LAST.held` 0.5 gives the film's own move and costs the visitor 0.15 s.
4. Proof in the browser: `node pipeline/change002/boss-leave.mjs --from 65.7375 --out /tmp/leaveA` (before, the two source files of the mend put back) and `/tmp/leaveB` (after), EXIT 0 each. The live build, a real mouse that follows the page's own hint step by step, one picture every 8 steps from the blow to the next page, 26 pictures. Rows above y 470 of which more than 30 percent are brighter than 70, the last eight pictures before Decision: before 470, 470, 470, 470, 470, 470, 411, 337; after 470, 470, 470, 470, 451, 383, 291, 181. All 26 from the blow: before 24 times 470, then 411, 337; after 22 times 470, then 451, 383, 291, 181.
5. tests/b-boss-turn.test.ts has two new cases (6 in all). They hold, for each seed: the view is the close one on the step before the blow, the eye only rises from there, by less than 3 percent of the way in a step, it is the whole page's on the last step before the turn, and no view but the whole page's is given while the slab turns. Without the line both fail (EXIT 1, "expected ... to be null").

(b) The health bar after the kill, behind a switch.
1. Where the bar is. The bar of the arena is made and posed in src/arena/props.ts (`makeBar`, `poseBar`), not a file of mine. The word over it is drawn by my page (src/pages/step4/index.ts, `health-label`).
2. The switch: `BAR_GONE` in src/boss/tune.ts, `on: false`, `seconds: 0.42`.
3. The way chosen: its own way in, run backwards. The bar came down from 220 px over 0.42 s (`barDrop` in src/arena/change.ts) and the word came when the bar landed. On: at `boss-gone` the word goes, the bar is put where `barDrop` had it at the same share of its drop counted from the end, and at 0.42 s it is taken out. Why: the bar is the one thing of the arena that came from above; the pillars, panes and guns came up out of the ground, so sinking would be their way and not the bar's. No new height and no new curve is written.
4. How it is built. The page counts the seconds since `boss-gone` (`left` in its state), says the share to src/boss/viewof.ts (`setBar`, kept by step with the view), and a wrapper round the arena's part in src/pages/step4/real/index.ts (`barLeaves`, new lines; the camera helper's line is not changed) moves the bar after the arena has posed it. It finds the bar by a name.
5. NEEDS: pipeline/change002/boss-bar-NEEDS.patch, one line in src/arena/props.ts: `root.name = 'arena-bar'`, as the arena names its other things (`arena-ground`, `arena-pillars`, `arena-wreck`). Applied on the branch as 483085c3. Without it the switch moves nothing (the word still goes). The other way would be an option of the arena (`bar?: () => number`) read in `poseBar`; that costs three lines of the arena and a change of the camera helper's line in src/pages/step4/real/index.ts, so I did not take it.
6. MEASURED, tests/b-boss-bar.test.ts, 5 cases, EXIT 0: off as shipped, the word is in the list and the share is 0 to the page's end; on, in the film, the word is out from the second step after `boss-gone`, the share only grows and is 1 at 0.42 s and stays 1 through the turn; the arena's bar stands at lift 0 before, at the lift of its drop run backwards at the half, and is not visible at 0.5 s, and with the switch off it is not moved; on, on the live site, a keen and a clumsy visitor, the same within 0.5 s.
7. MEASURED in the browser, the film, preview 960x540, draft: `node pipeline/change002/boss-same.mjs --runs "52.9,53.0,53.1,53.2,53.3,53.5,53.65,53.8" --format preview --out /tmp/barOff2` and `/tmp/barOn2` (the switch turned on in the working tree for that build only, never committed), EXIT 0 each. Off against the mend of 14:22Z on the six seconds both have: 0 px. On against off: 52.9 s 1,160 px, 53.0 s 1,246, 53.1 s 21,880, 53.2 s 26,653, 53.3 s 24,564, 53.5 s 25,247, 53.65 s 31,722, 53.8 s 137,193.
8. MEASURED on the live build with the switch on (`boss-leave.mjs --from 65.7375 --out /tmp/leaveOn`, EXIT 0): the bar and the word are in none of the 16 pictures looked at of the 26 from the blow (0, 24, 40, 56, 72, 88, 104, 128 and the last eight); against the same run with the switch off 1,422 to 111,385 px differ on each of the 26.
9. Two things the Builder should know before deciding.
   - The leaving is in no picture. From before `boss-gone` to the blow the view is the close one, which shows the floor from y 270 down; the bar lies at y 66 to 137. MEASURED: eight film frames 47.3 to 48.0 s (`/tmp/barOff`) show no bar. So what the switch changes on the screen is that the bar and the word are not there when the view goes back (film 53.0 s on, live from the blow) and through the turn.
   - A side effect, MEASURED: with the word out of the list, the words "Click to submit" are drawn a little differently: the 1,160 px at 52.9 s lie in the box 564,90 to 746,112, on those words, 385 of them by more than 8 levels. Cause UNKNOWN; not looked for.
10. Not done: the leaving seen from the whole page (it would need another view than the film's or the site's); the flat stand-in drawing without the arena.

(c) The whole page after the blow. `node pipeline/change002/boss-same.mjs --runs "53.2" --out /tmp/whole`, EXIT 0: film frame 10470, 1920x1080, draft, cut into a left and a right half of 960x1080. STATED from the code: at 53.2 s the way back is not quite done (the view is whole from 53.27 s); the picture shows about 1,840 of the page's 1,920 px across.

Checks at dafc5190, one at a time, each `npx vitest run tests/<name>.test.ts`: b-boss-turn 6 of 6, b-boss-bar 5 of 5, b-boss-same 11 of 11, b-boss 40 of 40, boss 38 of 38, b-boss-state 1 of 1, boss-closer-acting 5 of 5, b-finish 23 of 23, b-camera 28 of 28, site-standins 6 of 6, site-backing 3 of 3, EXIT 0 each; `npx tsc --noEmit -p .` EXIT 0. Not run: the other tests of the site.

## The Builder's unit of 14:48Z, November 28: the changed words, the white pillar tops, the live frame time (parts 1 and 2 written 15:14Z, part 3 after its runs)

Branch agent/b-boss-turn. Commit 00087502 holds the mend of part 1.

(1) The changed words.
1. Cause, MEASURED: a fault of order in my page. "Click to submit" (`defeated`) stood tenth in the page's list, before the arena (place 145), and the view draws in the order of the list. The words were drawn after the floor only because the word of the bar (`health-label`, place 148) lies in the same sheet of type and a sheet takes the highest order of its runs (src/shell/real/type.ts, `Sheet.sync`). With that word out the sheet fell from order 148 to 10 and the words were drawn before the floor they lie on.
2. How it was found. In the stage the shape of the words is the same with the switch on and off; only the list differs. The words are glyph meshes, not a shared drawing surface. Not a matter of the two samples of a film frame: before the mend the difference stood where the camera moves and where it is home (below the bar, all on the words: 949 px at 53.1 s, 463 at 53.2, 433 at 53.3, 524 at 53.5).
3. STATED, not measured further: why an early draw shows bolder. The soft edge of a letter is mixed with what is in the picture when it is drawn and writes its depth, so drawn before the floor it is mixed with what lies under the floor and the floor cannot fill in behind it. Dark pixels (under 100) in the box of the words at 52.9 s: 726 with the word in the list, 865 with it out.
4. The mend, in src/pages/step4/index.ts, two lines: where the arena's parts are put in the list, `defeated` is taken from its place and put after them. Its order no longer leans on another word.
5. MEASURED after the mend, the film, preview 960x540, draft, `node pipeline/change002/boss-same.mjs --format preview --runs "52.9,53.0,53.1,53.2,53.3,53.5,53.65,53.8,47.3,47.5,47.7,48.0,50.0,52.0" --out /tmp/mendOff` (EXIT 0) and the same eight seconds from 52.9 with the switch turned on in the working tree for that build only (`/tmp/mendOn`, EXIT 0):
   - switch off, after the mend against before it: 0 px on all 11 frames that had a frame from before (52.9 to 53.8 s, and 47.3, 47.5, 47.7, 48.0 s). The film as it ships is not changed by the mend.
   - switch on against off, after the mend: 0 px at 52.9 s (was 1,160) and 0 px at 53.0 s (was 1,246), 0 px at 50.0 and 52.0 s. From 53.1 s the frames differ in the bar alone: below y 150 of the preview frame 0 px at 53.1, 53.2 and 53.5 s and 1 px at 53.3 s, where the box of what differs (the bar) reaches down to y 158.
6. The test: a sixth case in tests/b-boss-bar.test.ts. With the switch off and on, at every quarter second from 0.5 s after `boss-gone` to `page-turn` at which `defeated` is in the list, it stands after `arena`, `boss-look` and `finish-figure` and is there once. Without the mend it fails: "arena at 48.875 s: expected 9 to be greater than 144" (EXIT 1); with it 6 of 6 (EXIT 0).
7. Not looked at: other words of ink that lie on the arena's floor before the bar has landed (before 2.12 s of the fight no `health-label` is in the list). None is known to me; none was searched for.

(2) The white pillar tops.
1. MEASURED on film frame 10470 (53.2 s, 1920x1080, draft), the top of the lower left pillar (`pillar.3`), box 474,799 to 526,853: mean level 246.5, 17.1 percent of its pixels with a channel at 250 or above, spread of the row means 3.1 levels. The top of the upper left inner pillar (`pillar.1`), box 488,200 to 540,250: mean 174.5, 0 percent at 250 or above, spread of the row means 13.4.
2. What makes it white, MEASURED with the site's own view of one group of lights alone (`node pipeline/change002/boss-tops.mjs --second 53.2 --views "beauty,lights.key,lights.dome"`, EXIT 0; the frame has two groups, key and dome): under the key alone the top is at level 0.0, under the dome alone 0.0, both pillars. All the light on a top is the room's mirrored light. The metal is the kit's aluminium (metalness 1, roughness 0.3, a brushed normal map at 0.22), so a top mirrors what stands over it, and the room has one large soft light (src/post/studio.ts, a plane of 26 by 20 at 7.5, 7.2, 6.9) in dim surroundings. STATED from that: a top is white when the line from the lens to it, mirrored in its flat face, meets that light, and grey when it does not; which tops those are changes with where the lens stands, which fits the close frames and the live pictures.
3. Against the approved pictures, MEASURED: references/approved-002/boss-arena.png, top of the upper left inner pillar (box 532,224 to 574,258) mean 222.8, of the lower left inner pillar (516,612 to 566,650) mean 192.7; boss-arena-after-the-cannon.png, upper left inner, 223.0; 0 percent at 250 or above on all three, every top brushed. So the white top is not as the approved picture has it: it is a highlight past the white of the picture.
4. The smallest change I found, tried in the page without a change to the source (`boss-tops.mjs --tops "1,0.85,0.7,0.55"`, EXIT 0): the top faces of the columns keep a share of the mirrored light, as a colour on their corners. MEASURED on frame 10470:

| share the tops keep | `pillar.3` top: mean, at 250 or above, spread of rows | `pillar.1` top: mean, spread of rows | changed px in the frame |
| --- | --- | --- | --- |
| 1 (the colour there, nothing darker) | 246.5, 17.1 %, 3.1 | 174.5, 13.4 | 0 |
| 0.85 | 242.0, 3.3 %, 5.1 | 162.2, 12.5 | 27,698 |
| 0.7 | 231.5, 0.5 %, 8.4 | 148.5, 11.5 | 27,950 |
| 0.55 | 211.1, 0.1 %, 10.2 | 133.0, 10.4 | 28,039 |

5. Changed pixels outside the pillar tops at 0.7: 0. All 27,950 lie in seven boxes of 66 to 72 px, one on the top of each of the seven pillars that stand in that frame.
6. What it costs, MEASURED above: every top is darker by the same share, the grey ones too (`pillar.1` 174.5 to 148.5 at 0.7), which takes them further from the approved 193 to 223. A change that takes only the highlight down and leaves the grey tops (a rougher finish of their own for the tops, so that the one bright light is spread) needs a second metal and the bodies drawn in two groups; not built, not measured.
7. NEEDS: pipeline/change002/boss-tops-NEEDS.patch, in src/arena/props.ts and src/arena/wreck.ts (the arena's files): `TOP_KEEPS = 0.7`, the colour on the column's corners, `vertexColors` on the standing metal, and a colour of 1 on the stumps' sides that share that metal. `git apply --check` passes. NOT applied on the branch and NOT yet run through a build of its own: the numbers above are from the trial in the page, which does the same to the same corners (136 top corners, 17 meshes of that metal).

(3) The live frame time of the boss page (high and medium written 15:46Z; low and the cause of the long frames in 12 to 16, written 16:11Z).
1. How. `node pipeline/change002/boss-pace.mjs --level <high|medium|low>`, one level at a time: the live build of this branch on the real clock, `&bot=keen&seed=1&step=4&quality=<level>`, canvas 1920x1080, pixel ratio 1, pop-ups off. The time is from one requestAnimationFrame to the next, kept with the second of the page it fell in. Outside the three stretches the page is stepped on without a picture, to 0.6 s before each. The run needs a hook in src/main.ts that is in the working tree only and is not committed.
2. The machine, MEASURED by the run: 4 cores, Intel Xeon 2.90GHz; browser 159.0.8154.6; the renderer string the browser reports is "ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)". That is a software renderer: every pixel is worked out on the 4 cores, no graphics card. NOT a visitor's machine. The level at the end of each run was the level asked for.
3. Events of that bot, MEASURED, page seconds: `power-up` 12.858, `finish-arms` 50.879, `finish-charge` 51.004, `finish-fire` 52.675, `finish-beam` 52.925, `finish-break` 54.417, `boss-gone` 56.108. The burst is taken at `power-up` + 1.653 s (`LINE7.glow` 0.853 and `LINE7.full` 0.8).
4. MEASURED:

| level | stretch (page seconds) | frames | wall s | median ms | p95 ms | worst ms | over 16.7 ms | over 33.3 ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| high | power-up (11.86 to 15.51) | 41 | 220.4 | 5,300 | 15,083 | 16,166 | 92.7 % | 85.4 % |
| high | finish (50.88 to 57.11) | 67 | 369.7 | 5,550 | 14,766 | 17,799 | 92.5 % | 91 % |
| high | plain fight (29.00 to 34.00) | 50 | 289.1 | 5,766 | 6,050 | 6,266 | 100 % | 100 % |
| medium | power-up (11.86 to 15.51) | 40 | 197.1 | 4,866 | 13,633 | 13,766 | 92.5 % | 87.5 % |
| medium | finish (50.88 to 57.11) | 68 | 346.9 | 5,216 | 11,683 | 16,416 | 92.6 % | 91.2 % |
| medium | plain fight (29.00 to 34.00) | 50 | 251.6 | 5,016 | 5,183 | 5,216 | 100 % | 100 % |

5. What the table can and cannot say. On this renderer a frame of the boss page takes about 5 s at every moment, the plain fight included, so the two shares say only that every frame that was drawn is over both marks. The absolute numbers say nothing about a graphics card. What can be read is one stretch against another at the same level.
6. One stretch against another, MEASURED. The median of the power-up and of the finish is not above the plain fight at either level (high 5,300 and 5,550 against 5,766; medium 4,866 and 5,216 against 5,016). Wall time for one second of the page: high 60.3 s, 59.3 s and 57.8 s (power-up, finish, plain fight); medium 54.0 s, 55.7 s and 50.3 s. So the gold light, the charge, the beam and the pieces cost 3 to 4 percent more than the plain fight at high and 7 to 11 percent more at medium, summed over the stretch.
7. What differs is the long frames, MEASURED: six in each heavy stretch, none in the plain fight, at the same page seconds at both levels. Power-up: 12.15, 12.25, 13.08, 13.90, 14.62, 15.33 s (high 10.4 to 16.2 s each, medium 9.2 to 13.8 s). Finish, high: 51.00, 51.42, 52.55, 54.27, 54.58, 56.30 s (11.4 to 17.8 s); medium: 50.99, 51.51, 52.93, 54.25, 54.57, 56.29 s (10.4 to 16.4 s). After nearly every long frame come one frame of about 1.3 to 1.9 s and one of 17 or 33 ms, so a long frame and the two after it take together about as long as three plain frames (high, 13.08 s: 14.6 + 0.02 + 1.4 = 16.0 s against 3 x 5.3 = 15.9 s). The work is not more; it is handed over unevenly.
8. The cause of the long frames is UNKNOWN at 15:46Z. Not tested yet, two readings: (a) a program for a new material is built the first time a new thing is shown (the gold light, the charge, the beam, the pieces), the page waits for it, and the frames queued behind it are let through at once after; the site builds no program ahead of time (`compileAsync` and `compile` are nowhere in src); (b) the kept shadow map of the key is baked again when a still thing changes (src/core/levelShadows.ts). The two long frames at 12.15 and 12.25 s lie before `power-up` and may belong to the start of the drawing after the step on, not to the power-up. The low run keeps with every frame the count of programs, geometries and textures, the draw calls, and the counts of the kept shadows, to tell (a) from (b).
9. Nothing was turned off yet, so no cut is proposed. By 6 there is no steady cost to cut on this renderer; what is left to find is what the long frames are.
10. A slip: when the first trial run was killed its shell loop went on and started a second browser for about 80 s (15:09Z to 15:11Z) beside the first. Both were killed; no number of either is used. The runs in the table started 15:11Z, one after the other.
11. UNKNOWN: the frame time on a visitor's machine with a graphics card; whether a long frame there is a hitch that is seen. Not measured: any other bot or seed, any other window size.
12. The low level, MEASURED (`boss-pace.mjs --level low`, EXIT 0, same machine, level at end low):

| level | stretch (page seconds) | frames | wall s | median ms | p95 ms | worst ms | over 16.7 ms | over 33.3 ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| low | power-up (11.86 to 15.51) | 42 | 177.0 | 4,033 | 11,566 | 18,582 | 85.7 % | 83.3 % |
| low | finish (50.88 to 57.11) | 69 | 278.6 | 3,900 | 11,100 | 12,300 | 88.4 % | 88.4 % |
| low | plain fight (29.00 to 34.00) | 50 | 210.8 | 4,216 | 4,366 | 4,400 | 100 % | 100 % |

   Wall time for one second of the page at low: 48.5 s, 44.7 s and 42.2 s (power-up, finish, plain fight): 15 and 6 percent above the plain fight. The medians are below the plain fight. Low is 25 to 30 percent quicker than high on this renderer, no more: with no card the cost is in the pixels of the 1920x1080 picture, which the levels do not change at a ratio of 1.
13. The cause of the long frames, MEASURED in the low run, which kept with every frame what the renderer holds: programs for materials built when a thing is shown for the first time. Of the 14 long frames in the two stretches (6 in the power-up, 8 in the finish), 13 come in the frame right after one in which the count of programs rose; in the plain fight no program was made and there is no long frame. Programs made: 19 in the power-up stretch (38 to 57 held), 14 in the finish stretch (70 to 84). The one long frame with no program before it is at 53.38 s; its cause is UNKNOWN.
14. It is not the kept shadow map, MEASURED: the key's kept map was baked once in the run (at 15.45 s, in a frame of 1.3 s), and the count of kept maps broken by a changed thing stayed 0.
15. What is shown for the first time, MEASURED with the names of the things (`boss-pace.mjs --level low --only power`, EXIT 0): the standing figure `stand` (2 materials, then 3 shader materials) and 2 shader materials of `finish-fx` at 12.03 and 12.13 s, before `power-up`; 3 shader materials without a name at 12.98 s; `boss-look1-fx` at 13.80, 14.62 and 15.23 s; `boss-look1` (5 materials) at 13.90 s; one shader material without a name at 14.52 s and one at 15.23 s. The names of the finish stretch were not taken.
16. Building ahead, one trial, MEASURED, and it did NOT take the long frames away: `boss-pace.mjs --level low --only power --ahead` (EXIT 0) asks the renderer, before the first frame of the run and with the picture's own target set, to build the program of every material in the page's scene, shown or hidden (`compile`). It built 12 programs; in the run 21 were still made at first showing (23 without) and 7 long frames stood in the stretch (6 without), at the same moments. So the programs the things need when shown are not the ones that can be built from the scene as it stands a second before: either the things are not in the scene yet, or their materials are in another state then. Which of the two is UNKNOWN for each thing.
17. Proposal, not built, no look changed: each of the things in 15 is drawn once ahead in the state it is first shown in, with nothing of it on the picture (its draw range empty, or its place outside the picture), in the first second of the boss page, when the arena rises and nothing is aimed at the visitor; then the same six moments are measured again. That is work in src/boss/finish/fx.ts, src/boss/look1 and the standing figure, and it needs a test that the film's pictures are the same. It moves the long frames to the page's start; it does not take the work away. Not started without the Builder's word.
18. STATED, not measured: on a graphics card a program built at first showing is the common cause of a single dropped or late frame; how long one takes there is UNKNOWN here. On this renderer one costs about two frames' time (about 7 to 10 s).
19. A second thing seen in the rows, MEASURED, cause UNKNOWN, not looked into: in the plain fight the count of geometries the renderer holds rises with nearly every frame, 184 to 258 in the 50 frames of 29 to 34 s, and stands at 307 at the end of the finish. Whether they are let go later was not measured; the count never fell in the frames kept.
20. Nothing was turned off and no cut is proposed for the lower levels: by 6 and 12 the steady cost of the heavy moments is within 15 percent of the plain fight at every level on this renderer, and the long frames are not a cost a level can cut. The hook in src/main.ts is out of the tree again.


## The Builder's rulings of 15:50Z, November 28 (written 16:15Z)

(1) BAR_GONE is ON, by the Builder's ruling (the bar is the boss's own and leaves with it). One line in src/boss/tune.ts, and the first case of tests/b-boss-bar.test.ts now pins it on as shipped. MEASURED: film frame 10476 (53.3 s, 1920x1080, draft, `boss-same.mjs --runs "53.3" --out /tmp/bar533`, EXIT 0) shows no bar and no word SUBMIT above the arena; "Click to submit" stands. Checks with the switch on, one at a time: b-boss-bar 6 of 6, b-boss-turn 6 of 6, b-boss-same 11 of 11, b-boss 40 of 40, b-boss-state 1 of 1, boss 38 of 38, boss-closer-acting 5 of 5, b-finish 23 of 23, b-camera 28 of 28, site-standins 6 of 6, site-backing 3 of 3, EXIT 0 each; `npx tsc --noEmit -p .` EXIT 0. Not run: the other tests of the site; the live site with the switch on at this commit (it was measured on at dafc5190, part 8 of the unit before).
