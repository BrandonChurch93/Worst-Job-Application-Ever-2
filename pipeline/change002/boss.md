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
| fall | `power-down`, `turret-off`, `boss-fall` | 47.79 | the boss falls for 1.0 s; the page takes the arrow and walks it to `LAST.stand` (440, 650); the view comes in to `CLOSE` (x 300 to 1260, y 270 to 810) |
| arms | `finish-arms` | 48.80 | the arrow's arms come out |
| charge | `finish-charge` | 48.89, 49.83, 50.88, 51.69 | one unbroken build; a step up on each mark |
| fire | `finish-fire` | 52.92 | the blast, held 2.13 s |
| gone | `boss-gone` | 55.05 | the body is gone |
| walk | `finish-walk` | 55.45 | 0.4 s later (`LAST.wait`) the arrow sets off for the button: 2.8 s for the 320 px |
| | `button-down` | 56.45 | the button has settled on the ground |
| knees | `finish-kneel` | 58.25 | 0.7 s down, then 0.6 s of breath in the film, 0.3 s on the live site |
| fist | `finish-fist` | 59.55 | the start of the raise: 0.6 s up, 0.3 s down |
| blow | `finish-press`, `button-press` | 60.46 | the step the fist lands: the blow is the press of Submit |
| | `page-turn` | 61.10 | |

MEASURED: `node pipeline/change002/boss-film.mjs --every 0.5`. The seconds between the marks are the Builder's of 00:36: arms to the first charge 0.1 s; `boss-gone` to the walk 0.4; the walk 2.8; kneel to fist 1.3 in the film and 1.0 on the live site; fist to press 0.9; the film holds 0.5 after the blow.

Live site. The visitor holds the button to charge and lets go to fire; a plain click fires a quarter blast (`FINISH.small`); a button still held 0.8 s past the full charge fires by itself; with no press the blast goes by itself, full, 6.0 s after the arms. Any blast ends the boss. After `boss-gone` the arrow walks where the visitor leads it, inside `CLOSE` less 40 px, at 114.3 px/s, from 0.4 s after `boss-gone`. A click on the button starts knees, fist and blow: 1.0 + 0.6 + 0.3 = 1.9 s, then 0.35 s held. With no move and no press for 6 s (`LAST.alone`), or after 20 s of being led (`LAST.led`), the arrow walks to the button by itself in 2.8 s at most and does it. The skip link presses at once.

The four marks `finish-walk`, `finish-kneel`, `finish-fist`, `finish-press` lie inside the beat `boss.finish`; the walk has no beat of its own. The power-up keeps its own event `power-up` as its mark.

How the arrow and the light look in the power-up and the finish is the finish helper's (`src/cursor/stand/*`, `src/boss/finish/*`, mail of 00:01). What is drawn now is my stand-in: the arrow's own arms through `PageLogic.arms`, a ball, a beam, a scorch. It was not polished further.

### The hand during the finish (`live.controlTakenMaxSeconds` is 8 and was not changed)

MEASURED at 9224e167: `node pipeline/change002/boss-spans.mjs`, seed 20261124, seconds from `boss-fall`.

| Visitor after the fall | arms | fire | gone | kneel | press | page left | longest time not obeyed, as the stage counts it with `PageLogic.led` |
| --- | --- | --- | --- | --- | --- | --- | --- |
| the keen bot | 1.00 | 1.34 | 3.47 | 6.68 | 8.59 | 9.45 | 4.28 s |
| nobody | 1.00 | 7.00 | 9.14 | 17.91 | 19.82 | 20.67 | 5.13 s |
| holds the button and stays | 1.00 | 5.84 | 7.97 | 30.74 | 32.65 | 33.50 | 5.13 s |
| stands and clicks four times a second | 1.00 | 1.21 | 3.34 | 26.11 | 28.02 | 28.88 | 5.13 s |

With the hook (`led()` is true only where the hand or the button changes what happens, the Builder's bound of 00:19) the stretches that count as control taken are: the fall, 1.0 s; the blast and the wait after it, 2.13 + 0.4 = 2.53 s; and the end, at most 2.8 s of walk by itself + 1.0 + 0.6 + 0.3 + 0.35 = 5.05 s (5.13 measured). Each is under 8. (With the times before the ruling of 00:36 they were 1.0, 2.13 and 4.0 s.)

Without the hook the stage would count every step in which the page holds the arrow: from the fall to the page turn, 9.45 s for the keen bot and 20.67 s for nobody (the column "page left").

The longest stretch in which the place of the hand does nothing (fall, charge and blast together, the button still works in the charge): the column "gone". 3.47 s for the keen bot, 9.14 s for nobody (1.0 + 6.0 + 2.13), 7.97 s for one who holds the button down. After that the place of the hand leads the walk.

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

Unit `boss`, 61.6 s, 1848 frames at 30 a second (`UNIT_SECONDS` in `src/pages/step4/script.ts`). MEASURED: `node pipeline/change002/boss-film.mjs --every 0.5`, `LOOK1_ON` false.

| s of the unit | Event |
| --- | --- |
| 3.80 | `checkbox` |
| 6.11 | `button-crack` |
| 6.71 | `unfold` |
| 9.00 | `boss-formed` (line 7 starts) |
| 27.13 | `boss-turn` |
| 29.93 | `boss-music` |
| 32.71 | `power-up` |
| 34.26 | `turret-rise` |
| 35.86 | `turret-lock`: the fight starts |
| 38.61, 39.51 | `cannon-tell`, `cannon-fire` |
| 40.22, 40.57, 40.92 | `flatten` (the one hit on the arrow), `boss-heal`, `peel-up` |
| 41.51, 43.12 | `big-tell`, `big-fire` |
| 43.93 | `popup` (no pop-up is drawn) |
| 45.42 | `session-expired` |
| 47.79 to 61.10 | the finish, table above |

Beats (config, as `NEEDS:` commits): verify 0 to 5, unfold 5 to 34.1, slabs 34.1 to 43.4, popups 43.4 to 45.3, lastStand 45.3 to 47.6, collapse 47.6 to 48.8, finish 48.8 to 60.4, press 60.4 to 61.6. Key picture `boss-fight` at 38.75 s; key picture `boss-down` moved into `boss.finish`.

The film is 182.6 s against `film.maxSeconds` 165. The Builder's word: no padding, the number left alone, the red length check carried as known. The start check carries a film over its length so the site still starts (`carryLength`, NEEDS 327ba55d).

The film's fight is 11.9 s, shorter than any visitor's: `FILM.dart` makes a dart on the body worth more, `FILM.floor` lets a phase end sooner, and `FILM.ends` ends each phase at a set second of the fight at the latest. The rules of the fight are the same.

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

LOOK_MORE
- So the switch stays `false`. To turn it on: those nine tests must read the look's and the arena's shapes, and the finish helper's module must be in.

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
| 40ffdeab, cbeda7f2, c913d8ae, 13253279, 2a9992e8 | `config/showcase.json`: the unit's seconds, its beats, the beat `boss.finish`, the key `boss-down` |
| 327ba55d | `film.maxSeconds` back at 165; the start check carries a film over its length |
| fa022e84 | `src/cursor/body.ts`: `spread(scale, seconds)` lays the arrow flat |
| a5ccabc1 | `content/narration.json`: an empty list for `boss.finish` |
| 3e861112 | stage: `PageLogic.arms` |
| 742ab065 | stage: `PageLogic.led` |
| the commit "NEEDS: cut" | `cut/CUTLIST.json`, `cut/CUES.md`, `cut/SHOTS.md` made again by `npm run cut`: film B is 10956 frames (182.6 s), 36 of 36 beat events inside their beat |

The patch file holds the changes to `config/`, `content/narration.json`, `src/config.ts`, `src/app.ts`, `src/cursor/body.ts`, `src/stage/*` and the two tests of other units, as a diff against `origin/main` b66ff094. The three files in `cut/` are not in it (326 kB): `npm run cut` makes them.

In `src/boss/view.ts` (told to the look, arena and finish helpers; all optional): `ViewBoss.pressedAt`, `BossView.last`, `BossView.close`, `BossView.scorch`.

## Tests

`tests/b-boss.test.ts` and `tests/boss.test.ts`: 65 tests.

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
| `tests/boss-closer-acting.test.ts` "shows the bar going back up at the last stand" | old seconds | the film's new seconds | film retimed |

## Checks at the last push

CHECKS_TABLE

## Not done

- `LOOK1_ON` is false in what is pushed (see "LOOK1_ON as seen", with the nine tests by name and what each must read).
- The finish helper's module (`src/boss/finish/index`, branch `agent/b-finish`) is not wired. What the wiring needs, from its mails of 00:30, 00:37 and 00:46: hang `finishPart` on an anchor of the whole screen; hide the ordinary arrow while `state.up`; give it `marks` (arms, charge, fire, end, walk, kneel, fist, press, with `press` set when `fist` is set), `charge`, `shot`, `walk { x, y, walked, pace }` with the place of the feet, `button: buttonAt(view)` from the look and `target`; give the arena `beam` from its state so the ground is not lit twice; and move the kneel place to `kneelSpot(buttonAt(view))`, (816, 656) for the look's button, which is `LAST.reach` 144 in place of 200. With the reach at 144 the way from the stand is 376 px, so at `LAST.speed` the film's walk is 3.3 s; to keep 2.8 s the speed goes to 134.3 px/s.
- The power-up before the fight is my stand-in (a gold glow); the pose sheet's first figure is the finish helper's (`power { at, end }` in its input). Its mark is the event `power-up`.
- The skip link's real press in a browser during the fight was not tested by me. Tested at the stage: `skip()` at any moment of the fight ends it (`tests/b-boss.test.ts`, "E. ends on the skip link at any moment of the fight"). Whether the shell's link is on the screen and pressable while the header is off is UNKNOWN to me; the link is the shell's.
- The gun's shot is still the event `slab-fire`; `bullet-fire` is not an event.
- No sound of mine is in: each new event plays the nearest cue the build has, or none. `button-down`: the look's button is on the ground 0.21 s before `boss-gone`, 1.6 s before my mark; the look helper says the sound belongs there. My mark stays, because the live click on Submit is live from it.
- The body's release of a taken arrow after 7.5 s is worked round by taking it again (above).
- 12 of 200 keen~ fights are under 25 s and 5 are over 45 s (table above).
- After the blast, with the look on, the arena helper measured the stand-in's plain button near (735, 610) while the burn is at (960, 650), and the words "Click to submit" dark on the dark scorch near (990, 780). Not looked into by me: with the look on the look's own button is drawn, and mine is not, from 12d42968 on; the words' colour on the scorch is open.
