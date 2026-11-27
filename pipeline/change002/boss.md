# Unit boss: how the boss plays (change note 002, item 15)

Branch `agent/b-boss`. Brief: `pipeline/change002/briefs/b_boss.txt`. Every tuned number: `src/boss/tune.ts`, one line each.
Times in this file are UTC, read with `date -u`.

## What the note asked, and where it is

| Asked | Where | State |
| --- | --- | --- |
| A. The shield does almost nothing; go round it | `darts()` in `src/boss/fight.ts`, `GUARD`, `REAL_DART` | built, measured below |
| B. The shield tracks at a speed that can be beaten; the boss moves about | `turnRate`, `walk()`, `TRACK`, `MOVE` | built, measured below |
| C. Four corner cannons, each shot after a tell, slow enough to leave its way | `corners()`, `CORNER` | built, measured below |
| D. A hit flattens the arrow a moment, it peels up, the boss wins a little back; no health for the visitor | `strike()`, `FLAT`, `HEAL` | built, measured below |
| E. Numbers from the bots; every tuned number in one file | `pipeline/change002/boss-bots.mjs`, `src/boss/tune.ts` | measured below |
| Keep: the mouse aims and a click shoots | unchanged: a click is a volley of four darts at the boss | kept |
| Mail of 21:27: the screen is the floor, the bar alone at the top | `chrome()` and `gone()` in `src/pages/step4/index.ts`, `TOP` | built, tested |
| Mail of 21:47: bullets from every gun, no validation slabs; the big turret | `guns()`, `corners()`, `big()`, `GUN`, `BIG`; `drawRules` in `src/boss/weapons.ts` | built, tested |

## The rules as built

- A dart that meets the shield takes 0.005 points (`GUARD.chip`), a volley of four 0.02 of 100. A dart that reaches the body takes 0.4, 0.21 and 0.23 points in the three phases (`REAL_DART`): 80, 42 and 46 times as much. The shield covers 0.92 rad to each side of where it faces, at 282 px from the boss's centre.
- The shield turns toward the arrow at 1.05 rad/s when the boss is fresh. Half a turn takes it 3 s; an arrow that crosses to the far side has (pi - 0.92) / 1.05 = 2.1 s of open body. The rate falls to 0.4 of that over 60 s of fight (`TRACK`), and from 35 s on a real dart does more (`WEAR`), so a visitor who moves at all always wins.
- The shield holds still for 0.95 s from the wind-up of each of the boss's own shots (`TRACK.stall`) and through the whole tell of the big blast: those are the openings that come by themselves.
- The boss walks toward the arrow every 3.4 s, for 1.5 s at most at 190 px/s, and stops 340 px short of it. Its centre stays inside x 1250 to 1580, y 480 to 800 (`MOVE.fence`): under the clear band, right of the pop-ups. An arrow within 34 px of its body is run over (a hit) and the boss steps back.
- Bullets (mail of 21:47). The boss's own two guns fire a pattern every 2.6, 3.2 and 2.6 s by phase, each after 0.6 s of wind-up with a lamp at the muzzle: phase 1 one bullet, then fans of three; phase 2 bursts of four along a line; phase 3 a ring of ten in turn with a fan. A bullet is 28 px across with a 44 px trail and flies at 520, 560 and 600 px/s. Aimed shots lead the arrow by 0.4 of its travel during the bullet's flight, 180 px at most.
- Corner cannons: four, at (84,176), (1836,176), (84,996), (1836,996). One of them shows a tell every 5 s for 0.9 s (its barrel follows the arrow and a ring closes on it), then fires one bullet at 540 px/s. Order: lower left, upper right, upper left, lower right.
- The big turret (mail of 21:47). It rises out of the boss's back 0.15 s into the fight, is up at 0.7 s, slides over the button and locks at 1.05 s (events `turret-rise`, `turret-lock`). No gun fires and the boss does not walk before the lock. Its blast: first tell 11 s into the fight and then every 13 s; the tell is a blinking line through the arrow's place for 1.6 s with the boss and its shield held still (`big-tell`); then a beam 64 px to each side of that line for 0.3 s (`big-fire`) and a scorch box 240 by 150 px where the arrow stood when the line was laid, kept 9 s (`arena-break`, with the place). When the boss is beaten the turret flies off in 0.7 s (`turret-off`, in the same step as `power-down`).
- A hit (bullet, beam or the boss's body): the arrow lies flat for 0.7 s and cannot shoot, the pointer stays free; it has peeled up by 1.4 s; nothing can hit again for 2.1 s. 0.35 s after the hit the boss wins health back.
- What stops the boss from healing for ever: the first heal is 6 points and each later one is 0.6 of the one before (6, 3.6, 2.16, ...), so all heals of a fight together stay under 6 / (1 - 0.6) = 15 points; and no heal lifts the health over where the phase began. Proved with the bots below (column "won back").
- The visitor has no health and cannot lose. The longest time the page ignores the pointer is under `live.controlTakenMaxSeconds` in every run of the tests.
- A visitor who stands in one place and clicks does not win. After six darts in a row have glanced off, a lamp on the boss's unshielded flank lights for 1.2 s (`weak-tell`), again every 3 s while the darts go on glancing. The skip link is the other way out.
- A visitor who does not shoot for `live.idleSeconds` (12 s): the boss tires by the clock, as it did before, and the fight ends by itself.

## Decisions

1. Three phases, the pop-ups and the banner are kept: the film's beats `boss.slabs`, `boss.popups`, `boss.lastStand` in `config/showcase.json` hang on them (contract 5).
2. `live.boss.maxSeconds` (45) is not edited. It no longer bounds every fight; it bounds the fight of a visitor who does nothing, counted from `live.idleSeconds` (the Builder's mail accepting the plan). The tests that pinned it are named below.
3. The pointer is never taken while the arrow is flat; only shooting is off. A visitor always sees his own hand move.
4. The boss's own gun shot still emits `slab-fire`: the film beat `boss.slabs` in `config/showcase.json` and the narrator's hook in `src/audio/cues.ts` hang on that name, and both are frozen for me. Asked: rename to `bullet-fire` in both (not in the patch; say the word and I change `EVENT.gun` in `src/boss/plan.ts`).
5. No event for the wind-up of the boss's own guns (a lamp only): three more events a second would crowd the track. `cannon-tell` and `big-tell` are events.
6. The pop-ups moved left (right edge at x 1040, was 1340) so the boss never stands under one. The old validation slabs stay in the layout tree, where their words are registered, and are never drawn in the fight; their gap grew to 36 px so the last lies clear of the lowest pop-up.
7. In the film a dart that reaches the body counts 2.4, 2 and 3.4 times (`FILM.dart`), because the film gives the fight 18.0 s and a keen visitor needs about 32 s. Stated in "The film" below.
8. No pillars and no cover on the floor: the note asks for none.
9. `boss-slow` is still emitted once in the live site at `live.bossSlowSeconds` with the boss above half its health. For a visitor who does nothing the fight is over before that second, so it is no longer heard by him.

## Mail of 22:19: Brandon's pick (ARENA 6, LOOK 1 with the turret in and out)

Read at 22:19. Pictures seen: `references/approved-002/boss-arena.png`, `boss-arena-after-the-cannon.png`, `boss-turret-inside.png`, `boss-turret-out.png`.
`src/boss/view.ts` (types only, the state the look reads each step) was pushed at 22:20 as commit 331ff723. After that push nothing in it changes without a word to the Builder and the two look helpers.

The rules that came with the pick, and their state at the first pass (23:00). None of them is in the numbers of the first pass below; each is built after it and the bots are run again.

| Rule | State at the first pass | What I will do |
| --- | --- | --- |
| a. Pillars and panes are solid while they stand: a bullet or a dart that meets one stops there. The arrow is never blocked | not built | boxes from the mail's numbers in `src/boss/tune.ts` (`SOLID`) until the arena exports `solids(view)`; a stopped shot is a `hits` entry of kind `solid`. The arrow rides over the top of a pillar: it is drawn above it and is never hidden or stopped |
| b. The big cannon: two to four blasts in a middle-length fight, tell of at least 0.8 s, a blast along the way he faces to the edge of the screen, 110 to 150 px wide; what is solid on the line breaks and stays broken; no line through x 560 to 1360, y 0 to 170 | partly: today a tell of 1.6 s, a line 64 px wide through the arrow's place, a scorch box of 240 by 150 px for 9 s, first at 11 s and then every 13 s | width 130; the line runs from the boss along his heading to the edge; `breaks` entries kept for the whole fight; an aim that would cross the bar's box is turned to the nearer side of it |
| c. Intro: the body forms with the button in plain view, then the hatch opens and the turret rises and locks in about 1.6 s as its own beat, then the fight; nothing can hit before `turret-lock` | partly: rise and lock in 0.9 s today (`BIG.rise` 0.15, `BIG.lock` 1.05); no gun fires and the boss does not walk before the lock (tested) | 1.6 s on the live site; the film keeps what fits its beat and says how much is short |
| d. Beaten: `turret-off`, the cannon blown off, the button clear with its word, the click as today | built (tested: the cap is bare 0.7 s after `turret-off`) | none |
| e. The three pop-ups out of the fight behind one switch in the tune file | not built | `POPUPS_ON = false` in `src/boss/tune.ts`; the film's beat `boss.popups` then holds no pop-up and its event must be another one of the fight (contract 5, said in the report when done) |
| f. The header off through `chrome()` for the whole fight; heading and card leave at the break-out; the bar alone at the top | built: header by `chrome()`, the heading, the subline and the card slide off in 0.5 s (`TOP.move`) | thrown off the nearest edge by the shock in about 0.6 s; the bar at the frame's place (x 590 to 1333, y 66 to 137) |
| Numbers of the picture: he stays on the middle slab, x 640 to 1280, y 330 to 770; corner guns near (89,82) (1831,82) (82,987) (1824,981) | not built: fence x 1250 to 1580, y 480 to 800; corners at (84,176) (1836,176) (84,996) (1836,996) | `MOVE.fence` and `CORNER.at` to the mail's numbers; the clear band test then measures against the bar's frame |
| Wiring `src/arena/*` and `src/boss/look1/*` behind my logic, my stand-in behind a switch | not built | after their first passes (00:30); hard limit 02:00 on 2026-11-28 |

## Events

Emitted by step 4, new with this unit: `shield-glance` (a shot met the shield), `shot-round` (a shot got round it; `dart-hit` is still emitted with it), `weak-tell`, `cannon-tell`, `cannon-fire`, `flatten` (on the arrow, `hitsCursor`), `peel-up`, `boss-heal`, `boss-move` (the boss moved off), `turret-rise`, `turret-lock`, `big-tell`, `big-fire`, `arena-break`, `turret-off`. Kept: `power-down` (the boss beaten), `slab-fire` (the boss's own guns; see decision 4), `popup`, `session-expired`, `dart-fire`, `dart-hit`, `boss-slow`. No longer emitted in step 4: `slab-drop`.

## Sounds asked of the Builder (contract 4)

Until the files come each event plays the nearest cue the build has, or none.

| Event | Length | What |
| --- | --- | --- |
| `shield-glance` | 0.2 s | a dry tick on glass, quiet; it comes up to 24 times a second |
| `cannon-tell` | 0.9 s | a rising whine that ends where `cannon-fire` starts |
| `cannon-fire` | 0.5 s | one thump |
| `boss-heal` | 0.6 s | a short rising chime |
| `bullet-fire` (today `slab-fire`) | 0.3 s | one pop; up to ten in a ring within one step, so it must not stack loud |
| `turret-rise` | 0.9 s | a heavy servo, rise to lock |
| `turret-lock` | 0.3 s | a clamp |
| `big-tell` | 1.6 s | a charge that climbs for the whole tell |
| `big-fire` | 0.6 s | the blast |
| `arena-break` | 0.8 s | the ground breaking, a low tail |
| `turret-off` | 0.7 s | a burst and a clatter |
| `flatten` | 0.3 s | a flat slap (not on the Builder's list; asked) |
| `peel-up` | 0.4 s | a sticky peel (not on the Builder's list; asked) |
| `weak-tell` | 0.3 s | a soft double blip (not on the Builder's list; asked) |

## The three pop-ups (first pass, as they are)

They rise in the second phase and again in the last, on the left of the floor (x 496 to 1040, y 336 to 854). A pop-up stops the darts of an arrow that stands behind it until twelve darts have shot it down or its button is pressed. With the bullets they are a wall the visitor walks round on his way to the open flank; they do not hurt. They still fit as an obstacle; their words are form words on a floor that has no form on it any more, which is the owner's to judge.

## The film

Inside the time the film gives step 4 (fight from 9.01 s to the collapse at 27 s). Measured with `node pipeline/change002/boss-film.mjs`:

| Seen | Second of the unit |
| --- | --- |
| `turret-rise`, `turret-lock` | 9.15, 10.06 |
| Darts glance off the shield (first `weak-tell` 10.89) | 10.3 to 11.9 |
| The arrow goes round over the top; darts count on the flank | 11.95 to 13.3 |
| The boss's gun fires (`slab-fire`, the event of beat `boss.slabs`, 9 to 16) | 11.11, then a fan at 14.32 |
| A corner cannon: `cannon-tell`, `cannon-fire` (lower left) | 13.50, 14.41 |
| The arrow flattened once, `boss-heal`, `peel-up` | 15.24, 15.59, 15.94 |
| First pop-up (`popup`, beat 16 to 22) | 17.63 |
| `big-tell`, `big-fire` with `arena-break`; the arrow has left the line | 20.01, 21.61 |
| `session-expired` (beat 22 to 27) | 22.59 |
| Three stands, low, high, low, each before the shield has come round | 24.0 to 27.0 |
| `power-down` with `turret-off` (beat 27 to 29) | 27.05 |
| `button-press` (beat 29 to 32) | 29.88 |

Short beats (contract 5):
- The turret's rise and lock take 0.9 s and sit in the first second of beat `boss.slabs` (9.15 to 10.06), because the unfold's 3.6 s in beat `boss.unfold` are full. A rise that reads as its own beat wants about 2 s: 1.1 s short.
- The fight has 18.0 s in the film and about 32 s for a keen visitor: 14 s short. Fitted by letting a film dart on the body count 2.4, 2 and 3.4 times by phase.
- The last stand has 4.4 s after the banner (22.6 to 27.0) where the live one runs about 12 s; the boss's guns and the cannons do not fire in it in the film.

## Change note 003: the film's boss unit with lines 6 and 7 (a plan, not built)

Counted at the narrator's pace of 1.6 words a second, the fastest allowed: line 6 has 10 words, 6.3 s; line 7 part one has 32 words, 20.0 s, and the music starts on "their student loans", 18.1 s into it; part two has 17 words, 10.6 s. The three together are 36.9 s of speech, against 32 s planned for the unit and 38.4 s at most. The arena's change is 2.4 s (`ARENA.changeSeconds` of the arena helper), the body is formed 2.9 s after the crack, the turret beat is 1.75 s (`BIG.lock`).

| Part | Honest length, s of the unit | Shortest I would still hand over |
| --- | --- | --- |
| The doubt and the tick (`checkbox`) | 0 to 3.8 | 0 to 3.0 |
| Line 6, the arrow holds under the answer | 3.8 to 10.1 | 3.0 to 9.3 |
| The break-out and the arena's change (`button-crack`, `arena-split`, `arena-rise`, `healthbar-drop`) | 10.1 to 12.5 | 7.4 to 9.8, under "takes that as a threat" |
| The body forms, Submit in plain view (`boss-formed` at the end) | to 13.0 | to 10.3 |
| Line 7 part one, the arrow droops and drifts toward the top of the screen | 13.0 to 33.0 (`boss-music` at 31.1) | 10.3 to 30.3 (`boss-music` at 28.4) |
| The turn (`boss-turn`): it stops, straightens, comes back down | 33.0 to 33.8 | 30.3 to 30.9 |
| Part two | 33.8 to 44.4 | 30.9 to 41.5 |
| The turret beat (`turret-rise`, `turret-lock`) | 44.4 to 46.2 | 39.7 to 41.5, under "They are ready" |
| The fight, silent | 46.2 to 63.2 (17.0 s; a keen visitor's is 34.8 s in the middle) | 41.5 to 55.5 (14.0 s) |
| Beaten (`power-down`, `turret-off`) | 63.2 to 65.2 | 55.5 to 57.5 |
| The click (`button-press`) | 65.2 to 68.2 | 57.5 to 60.0 |
| The unit | 68.2 s | 60.0 s |

- Against the plan: 68.2 s is 36.2 s over the 32 s planned and 29.8 s over the 38.4 s the kit allows; the short version is 28.0 s and 21.6 s over. With nothing else changed the film of 165 s becomes 201.2 s, or 193.0 s.
- The fight is not cut to fit. 14 s is the least in which the film still shows, each with its hold: darts on the shield, the way round, a corner cannon's tell and shot, the arrow flattened and peeling up, one tell of the big cannon (1.6 s) with its blast and what it breaks, and the last charge. Under 14 s one of them goes. A second blast of the big cannon, which the mail of 22:19 asks of a middle-length fight, wants 3 s more (17 s).
- With a fight as long as a keen visitor's (34.8 s) the unit is 86.0 s.
- The live site, while line 7 is spoken. The Builder's reading holds the arrow for about 31 s. That breaks `live.controlTakenMaxSeconds` (8 s) and the bots' check that the pointer is never ignored, and those are Brandon's numbers. What I would build instead: the pointer stays the visitor's; the arrow droops and drifts upward only while he leaves it alone; nothing can hit him; the fight starts at "They are ready" or at his first click after the body has formed, whichever comes first (the line is then cut short and the turret beat plays at once). A visitor who waits watches 31 s plus 1.75 s; one who clicks waits 1.75 s. Not built: it waits for the Builder's word.
- Events for the shell helper (told at 22:30): line 6 on `checkbox`; line 7 on `boss-formed`; then `boss-music`, `boss-turn`, `turret-rise`, `turret-lock`. Until the cue table sends its three lengths the page holds 20.0 s, 18.1 s and 10.6 s.

## Numbers from the bots

`node pipeline/change002/boss-bots.mjs --seeds 200 --json out/work/boss-bots.json`. Step 4 alone, from the first step of the fight to `power-down`. `keen` and `clumsy` are the stage's own bots (`src/stage/bots.ts`), which play the same fight on every seed; `keen~` and `clumsy~` are the same hands with a seeded speed, lag and click rate; `random` is the stage's random bot with the skip link taken away; `still` stands where it is and clicks four times a second; `absent` does nothing.

Measured on the code of commit 331ff723 (the rules of the first pass, before the rules of the mail of 22:19), between 22:20 and 22:35 UTC.

| Visitor | Seeds | Wins | Fight, s (least / middle / most) | Flattenings (least / middle / most) | Health won back (middle / most) | Darts on the shield / round it (middle) | `weak-tell` (middle) | Hits a fight (mean): boss's guns / corner cannon / body / big blast |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `keen~` | 200 | 200 | 22.4 / 34.8 / 53.6 | 0 / 0 / 4 | 0.0 / 13.1 | 11 / 423 | 0 | 0.3 / 0.2 / 0.2 / 0.0 |
| `clumsy~` | 200 | 200 | 44.5 / 61.7 / 93.3 | 0 / 2 / 7 | 3.6 / 11.8 | 39 / 320 | 3 | 0.4 / 0.7 / 1.1 / 0.0 |
| `random` | 200 | 200 | 104.3 / 130.1 / 167.8 | 12 / 21 / 31 | 8.6 / 15.0 | 97 / 178 | 8 | 3.1 / 1.3 / 16.6 / 0.2 |
| `keen` | 200 | 200 | 36.9 / 36.9 / 36.9 | 0 / 0 / 0 | 0.0 / 0.0 | 0 / 417 | 0 | 0.0 / 0.0 / 0.0 / 0.0 |
| `clumsy` | 200 | 200 | 47.2 / 47.2 / 47.2 | 0 / 0 / 0 | 0.0 / 0.0 | 0 / 386 | 0 | 0.0 / 0.0 / 0.0 / 0.0 |
| `absent` | 200 | 200 (the fight ends by itself) | 26.9 / 26.9 / 26.9 | 6 / 6 / 6 | 2.1 / 2.1 | 0 / 0 | 0 | 4.0 / 1.0 / 0.0 / 1.0 |
| `still` | 40 | 0 (86.6 points of health left after 240 s) | never won | 70 / 70 / 70 | 4.2 / 4.2 | 3050 / 6 | 80 | 49.0 / 17.0 / 0.0 / 4.0 |

Read against the aims of the Builder's mail (keen 25 to 45 s, clumsy 45 to 80 s and never over 90 s):
- `keen~`: the middle fight is 34.8 s. 16 of 200 are under 25 s (the shortest 22.4 s) and 12 are over 45 s (the longest 53.6 s); 90 in 100 lie between 23.9 and 45.3 s. Over the 200 fights the arrow was flattened 123 times and the boss won back 497.7 points in all.
- `clumsy~`: the middle fight is 61.7 s. 3 of 200 are over 80 s and 1 is over 90 s (93.3 s): the aim "never more than 90 s" is missed by one seed in 200. Flattened 447 times, 664.3 points won back in all.
- `random`: every one wins, none under 104 s. The random hand walks into the body 16.6 times a fight; flattened 4247 times, 1728.8 points won back in all, never more than 15.0 in one fight.
- `still` (40 seeds, not 200: each run is 240 s of fight and the run is the same on every seed): never wins, 3050 darts on the shield against 6 round it, 80 `weak-tell`.
- `absent`: the fight ends by itself at 26.9 s on every seed (`live.boss.maxSeconds` 45, untouched).
- The big cannon fired 1 time in the middle keen fight (1 to 2) and 3 times in the middle clumsy fight (2 to 5). The mail of 22:19 asks 2 to 4 in a middle-length fight: not met for the keen visitor on these rules.
- What stops the boss from healing for ever: each heal is 0.6 of the one before (6, 3.6, 2.16 and so on), so all the heals of one fight stay under 15 points whatever the number of hits; the most measured in one fight is 15.0 (`random`), 13.1 (`keen~`), 11.8 (`clumsy~`).

The first three rows are `out/work/boss-bots-first-a.json`, the next three `-first-b.json`, the last `-first-c.json` (not in the repo: `out/` is ignored).


## Tests

Mine, new: `tests/b-boss.test.ts` (18 tests).

Tests of my own page that pinned a thing the note changed, and the line that changed it:

| Test | Was | Now | Line of the note or mail |
| --- | --- | --- | --- |
| `tests/boss.test.ts` "ends every gag by itself with a still pointer" | fight within `live.boss.maxSeconds` | within `live.idleSeconds + live.boss.maxSeconds`; `boss-slow` at most once | "nobody wins by standing still"; the Builder's mail on `maxSeconds` |
| `tests/boss.test.ts` "ends every gag by itself with a wrong pointer" | a pointer that stands and clicks wins inside 140 s | it does not win, is shown `weak-tell` again and again, and the skip ends it | "nobody wins by standing still and holding the button" |
| `tests/boss.test.ts` "lets a keen visitor win the fight" | under `maxSeconds - 5` with the test's own bot | 25 to 45 s with the stage's keen bot | "a keen visitor wins in about 30 to 45 seconds" |
| `tests/boss.test.ts` "escalates in the film" | one slab alone, faster ones, the hit | glances, the way round, a cannon, the one hit, three pop-ups, the blast, the banner, three stands that speed up | rules A to D; mail of 21:47 |
| `tests/boss-fight.test.ts` "fires a volley with each click" | a volley from the front does the damage of three | a volley on the shield takes four chips | "the shield does almost nothing" |
| `tests/boss-fight.test.ts` "stops a dart from the left on the glass shield" | spark on the plane 290 px left | spark on the shield's arc at 282 px | "shield tracks" |
| `tests/boss-fight.test.ts` two key picture tests | a slab in flight, three slabs in the air, health near half | no slab in any frame, darts, a spark, health above three quarters | "The red validation slabs are no longer fired at all" |
| `tests/boss-fight.test.ts` "keeps the tail of a fired slab at the mouth" | the slab's tail | a bullet flies straight at its gun's speed with its trail behind | "Bullets, not validations" |
| `tests/boss-closer-acting.test.ts` "shows the bar going back up at the last stand" | looked at 22 to 25 s | looks at 22 to 24 s (the first stand starts at 24.0) | film retimed for the rules |

Tests of other units, changed in the one commit `NEEDS:` and written to `pipeline/change002/boss-NEEDS.patch`:
- `tests/b-shell-chrome.test.ts`: "none says anything of the header" excepts step 4, which uses the hook as the Builder's mail told it to.
- `tests/site-pointer.test.ts`: a boss hit is `hit flatten`, was `hit slab-drop`.
- `cut/CUTLIST.json` and `cut/CUES.md` are stale, because the film's events of step 4 changed: `npm run cut` makes them again. Not made again at the first pass, because the film changes once more with the rules of the mail of 22:19; until then two tests of `tests/cut-of-build.test.ts` fail (its own line: "it holds 977 events and 20 lines; the build gives 1386 events"). They are made again before the last push.

## Not done

- The rules of the mail of 22:19 (table above): not built at the first pass.
- The skip link's real press in a browser during the fight is not tested. Tested: `skip()` at the stage, at 22, 30 and 45 s of a fight of a visitor who stands and clicks, ends the fight (`tests/b-boss.test.ts`). Whether the shell's link is on the screen and pressable while `chrome()` has the header off is UNKNOWN to me: the link is the shell's.
- `cut/` is stale (above).
- `bullet-fire` is not an event yet: the gun's shot is still called `slab-fire` (decision 4).
- No sound of mine: every new event plays the nearest cue the build has, or none.
- The fight is long for the random visitor (table above) and the longest keen fight is over 45 s; tuning goes on after the first pass, with the rules of 22:19.
