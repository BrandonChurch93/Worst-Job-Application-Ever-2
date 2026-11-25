# 01 · The film and the live site

`references/STATUS.md` says which reference images are approved and which are pending.

A key written as `copy:` followed by a path is a string in `content/copy.json`. Every other key is in `config/showcase.json`.

## What it is

- Title: `name` in the config.
- A comedy told as a job application. A careers page for a company called `employer.name` leads into a five-step application that fights back at every step and ends in instant rejection.
- It is one real website. The same site is delivered two ways:
  - **The film.** The site plays itself start to finish and is recorded for Perplexity's social posts. In the film the applicant is an AI.
  - **The live site.** A visitor on Brandon's portfolio does the application with their own mouse.
- The hero is the mouse cursor. It is the only character.
- The pinball machine in step 3 is the main attraction. It gets the most care of anything in the project.

## The idea

A real web page, made of real things, that is out to get you.

- Every page reads as a real, usable web page first. Header, progress bar, labeled fields, buttons, clear layout.
- Every control is a physical object made of real materials, lit by a real light, and it behaves like a physical object.
- The cursor is a physical object too, and it is alive. It walks, hesitates, sweats and takes a beating like a cartoon character. It is rendered as a real thing.
- The comedy is that contrast: cartoon suffering, photographed like a product film, inside the most boring kind of web page there is.
- The page stays deadpan. Its copy is corporate and sincere. It never admits anything is wrong.

## Two ways it runs

| | Film mode | Live mode |
| --- | --- | --- |
| Who drives the cursor | The site itself, on a fixed script | The visitor's mouse |
| Who the applicant is | An AI. Named `applicant.filmFirstName` `applicant.filmLastName` | The visitor |
| Length | The sum of `film.units` in the config | As long as the visitor takes |
| Camera | May push in and cut for the big moments | Stays on the whole page, with short cut-ins when the page takes control |
| Outcome | Always the same | Always the same. Every visitor can finish and every visitor is rejected |

- Both modes are the same pages, the same objects and the same gags. Nothing is built for the film that the live site does not have.
- Live mode rules are in `kit/02-SUBJECT.md` under each page.

## Where it runs

- The film is posted on X from a Perplexity account. Video there starts playing muted in the timeline.
- The live site is hosted from this repo and linked from Brandon's portfolio.
- The live site is for a computer with a mouse or trackpad. A touch-only device gets the message in `copy:live.touchOnly` and a link to `links.portfolioWork`. Detect by what the device can do, not by screen size.

## The viewer

- Someone scrolling who has filled out a job application and hated it. That is nearly everyone.
- They stop because the first thing they see is a web page that looks real and solid enough to touch, with a cursor walking across it like a small animal.
- They stay because every field does something worse than the last one.
- They finish because of the pinball machine, the fight with the Submit button, and to find out whether it gets the job. It does not.

## Rules for the opening

- Frame 0 is a finished picture. No fade in, no loading state.
- Something moves from the first frame: the cursor is already mid-stride.
- By `film.hookSeconds` seconds the viewer has seen the cursor behave like a creature, not a pointer. This has to work muted, on a phone, at a glance.

## The two cuts

`deliver.cuts` lists two versions of the film.

- `without-prompt` starts on the marketing page.
- `with-prompt` opens with the team's prompt screens before the marketing page: the prompt in `intro.prompt` is typed, the reasoning level is set to `intro.reasoningLevel`, the prompt is sent, then the build screen shows `intro.title` and fills in the lines of `intro.steps`. That opening is at most `intro.maxSeconds` seconds and is added on top of the unit times.
- The prompt and the checklist text are a default Brandon may change. See "Decisions waiting on Brandon".
- A viewer must be able to read the prompt before it is sent and read the checklist as it fills. Both were too fast on an earlier film. The speeds are `intro.charsPerSecond`, `intro.readHoldSeconds`, `intro.stepSeconds` and `intro.endHoldSeconds`.
- This document calls the `without-prompt` cut film B and the `with-prompt` cut film A.

## Unit by unit

A unit is one page of the site. Each unit gets its own critic rounds. Times are in `film.units`.

| Unit | Page | What kind of scene | What happens | How it ends |
| --- | --- | --- | --- | --- |
| `marketing` | The careers page | Calm before the storm | The cursor strolls through a cheerful careers page, impressed, missing every warning in the fine print | It jumps on "Apply for a Job" |
| `step1` | Step 1, About You | A struggle | It types its name on a keyboard while turrets shoot at it, fights a keyboard that rearranges itself, has a valid email rejected, then loses a tug of war with a shredder over its resume | It is shredded, reassembles, and is told to re-enter everything |
| `step2` | Step 2, Personal Details | Contraptions | Three ordinary fields. Each one opens into the wrong machine: a rotary dial, a slot machine, a hand crank | Each machine gets one hit on the cursor. It continues |
| `pinball` | Step 3, Skills Assessment | The main attraction | A full arcade pinball machine, `table.name`, rises out of the page. The cursor is thrown in and batted around a miniature city | It drains into the Unemployment Office and is spat back onto the page. It passed |
| `boss` | Step 4, Submit | A boss fight | It ticks "I am not a robot". The Submit button tears loose and becomes a war machine with a health bar. The cursor dodges and shoots | The boss collapses back into a dented button. The cursor presses it |
| `decision` | Step 5, Decision | The punchline | The wait is announced as months and takes no time. A rejection letter, a stamp, the metrics | It accepts rejection. The page resets to the careers page, still hiring |

The five steps are five different kinds of scene on purpose. No two pages play the same way, look the same, or repeat a gag.

## Beat by beat

A beat is one timed gag inside a unit. Times are in `film.beats`, in seconds from the start of the unit. The narrator's line for each beat is in `content/narration.json` under the same id.

### `marketing`

| Beat | What is seen |
| --- | --- |
| `marketing.stroll` | The careers page, already on screen. The cursor strolls in, glossy and confident, shadow under it |
| `marketing.perks` | It visits the perk cards. Each card it touches flips or slides to show its fine print. It does a small double take at "Unlimited PTO" and carries on, unbothered |
| `marketing.ticker` | The ticker strip runs along the bottom. The cursor does not look down |
| `marketing.apply` | It bounds to the big orange button, winds up and jumps on it. The button sinks with real travel. The page turns over to step 1 |

### `step1`

| Beat | What is seen |
| --- | --- |
| `step1.keyboard` | The step 1 form. The cursor taps the First name field. A full keyboard slides up out of the page along the bottom |
| `step1.firstName` | It types by stomping key to key. Two turrets rise at the ends of the keyboard tray and fire glowing bolts across the keys. It dodges, ducks, gets cocky, and takes a hit: a round burn hole, a wisp of smoke, a moment of shock. It finishes the name |
| `step1.lastName` | The keys shuffle to new positions after every letter. It hunts, lands, and the keys move again. Its patience is visibly thinner |
| `step1.email` | It types a correct email. A heavy red "Invalid email" slab drops from above and it dives clear. Another. Another. The form gives in |
| `step1.resume` | The cursor fetches its paper resume, proud of it, and carries it to the drop zone |
| `step1.tug` | A shredder slot opens in the page under the drop zone and bites the paper. The cursor grows two thin black arms and pulls. A full tug of war: heels dug in, the paper stretching, the shredder winning inch by inch |
| `step1.shredded` | It loses. Paper and cursor go through together. A pile of white strips on the page stirs, stands up and zips itself back into a cursor, slightly misaligned, then true. The form says the resume was received and asks for everything again |

### `step2`

| Beat | What is seen |
| --- | --- |
| `step2.open` | Three plain, closed rows. It looks easy. The cursor relaxes |
| `step2.dial` | It clicks Contact number. The row opens and a rotary dial rises out of the page. It drags a number round. On the return the dial whips it in a full circle and flings it. After `live.step2.dialDigitsBeforeItGivesUp` digits the form gives up |
| `step2.slot` | Date of birth opens into a three-reel slot machine. It pulls the lever. The reels land on a date that is not its birthday. The machine pays out and spits coins at it |
| `step2.crank` | Audio volume opens into a hand crank and a level meter. It cranks. After `live.step2.crankTurnsBeforeItRunsAway` turns the crank takes off by itself, spins to full and flattens it on the way round |
| `step2.continue` | Flat as paper, it peels itself up, refills, and presses Continue |

### `pinball`

This is a directed scene with cuts. The camera leaves the screenshot view and goes inside the machine.

| Beat | What is seen | Camera |
| --- | --- | --- |
| `pinball.rise` | The page shows the step 3 transition line. The page splits and a full arcade cabinet rises out of it. It powers on: general lighting, then inserts in a wave, then the backbox title | Starts straight on. Tilts and pulls to a player's-eye view as the cabinet rises |
| `pinball.launch` | A mechanical arm drops the cursor into the shooter lane. The plunger pulls back. It realizes. It is fired | Low and behind the cursor, riding up the lane |
| `pinball.coffee` | It is thrown into the three coffee bumpers and rattled between them, squashing flat on each hit | Ball height, close, inside the cluster |
| `pinball.firehouse` | It drops into the firehouse scoop. The red flasher fires, the sign lights, and it is kicked back out | Tight on the firehouse, then whip to follow |
| `pinball.highway` | It skids up the chrome highway ramp and round the overpass above the city, steel balls not yet in play, the Retirement box drifting past out of reach | Riding just behind it on the wireform |
| `pinball.replyAll` | "Reply All" lights. `live.pinball.extraBallsInReplyAll` steel balls drop in. Now they are chasing it and hitting it. The whole table is lit and loud | Wide from above to show the whole table, then quick close cuts on the impacts |
| `pinball.save` | It falls toward the drain. A flipper catches it at the last instant and sends it back up | Slow motion, low, from just above the flippers |
| `pinball.hq` | The shot goes up the main ramp to Corporate HQ. The lobby doors are open. They slam shut and it hits them flat | Low, straight up the ramp, HQ towering |
| `pinball.drain` | It slides down the doors, rolls down the playfield between the flippers and drops into the Unemployment Office. The cabinet sinks back into the page and spits it out. The result card: it passed | Follows it down, then returns to the straight-on page view |

### `boss`

| Beat | What is seen |
| --- | --- |
| `boss.verify` | The Human Verification card and the Submit button. The cursor reads the checkbox. In the film it hesitates, sweats, and ticks it. The card answers |
| `boss.unfold` | The Submit button shudders, cracks its socket, tears loose and unfolds: legs, armor, two cannons, a glass shield. A health bar slides in under the header |
| `boss.slabs` | The boss fires error messages as solid red slabs. The cursor dodges and shoots a stream of tiny cursor darts with each click. The bar starts to drop |
| `boss.popups` | The boss throws up pop-up dialogs as shields. The cursor has to shoot them down or go round them. It takes a hit and shakes it off |
| `boss.lastStand` | Nearly beaten, the boss plays "Session expired" and its health jumps back up a little. The cursor's whole body says "really". It finishes the job |
| `boss.collapse` | The boss sparks, folds in on itself and drops onto the page as an ordinary Submit button: dented, scorched, smoking, lying crooked outside its socket |
| `boss.press` | The cursor drags itself over, exhausted, and presses it |

### `decision`

| Beat | What is seen |
| --- | --- |
| `decision.wait` | "Processing your application". Hold music starts. The wait time reads months |
| `decision.letter` | The hold music cuts off mid-note. The letter drops onto the page. A red stamp block slams down on it and on the cursor. The stamp lifts: REJECTED, and one flattened cursor |
| `decision.metrics` | The cursor peels itself up. The metrics panel fills in. It looks at the one button there is and presses "Accept Rejection" |
| `decision.reset` | The page turns back over to the careers page. The ticker now carries `copy:marketing.tickerAfterRejection`. The cursor stands there, looking at the Apply button |

## The camera

- On every page except the pinball scene the view is straight on, like a screenshot. No tilt.
- In film mode the camera may push in on a big gag and ease back out. The cursor stays one size on the page. The camera gets closer. The cursor never grows.
- Pushes are eased. The camera has mass.
- The pinball scene is the one place the camera is free. Its shots are listed above.
- In live mode the view stays on the whole page so the visitor can always see where they are. A short cut-in is allowed only while the page has control of the cursor.

## Sound

- All sound is made with ElevenLabs through Computer's connector: the narrator and every effect.
- There is no music score. `audio.music` is false.
- One exception that belongs to the page: tinny hold music for `audio.holdMusicSeconds` seconds in `decision.wait`, cut off mid-note.
- The narrator is the voice saved in Brandon's ElevenLabs account under the name in `audio.narratorVoice`. It speaks like a nature documentary: slowly, with a pause every few words. It is smug and it looks down on the applicant. The lines and the rules for them are in `content/narration.json`.
- The narrator speaks on the live site too. There it is talking about the visitor.
- The bar for effects is the foley of a top animated short or a AAA game:
  - Every visible contact has a sound, on the frame it happens.
  - Materials sound like what they are. Plastic clicks, paper tears, metal rings, ceramic knocks.
  - A quiet room tone sits under everything, so silence never sounds dead.
  - Repeated sounds vary. Ten key presses are ten different takes.
  - The narrator is never fought by an effect. Effects duck under a line.
- Sound is approved before the films are cut to it. The Builder makes a sound board, one page that plays every effect and every narrator line with its kept take, and Brandon hears it at the review stop. The audio on his earlier showcases was weak because nobody set a bar or approved it first.
- The live site has a mute button and starts silent until the visitor's first click, because a browser does not let a page start sound by itself.

## Portfolio deliverables

Every showcase is also a piece on Brandon's portfolio.

- The film, in both cuts.
- The card still: one screenshot for the portfolio card.
- The card loop: a seamless clip `deliver.cardLoop.seconds` seconds long that starts on the card still. One interesting shot, never a montage. `deliver.cardLoop.candidates` names the three scenes it may show, each by the key that shows it. `kit/07-QUALITY-BAR.md` says how one is picked. It is delivered in the format `deliver.cardLoop.format` at `deliver.cardLoop.fps` frames a second, with a smaller web copy `deliver.cardLoop.webWidth` pixels wide at `deliver.cardLoop.webBitrateMbps`.
- The live site, hosted from this repo with no secrets and no sign-in.
- The post text, in the pattern the team's recent posts use: one plain opening sentence, a short run of what you can do with it, then a reply with the link.

## Not in this film

- People, faces, hands, animals, creatures. The boss is a machine.
- A face or eyes on the cursor. It acts with its whole body.
- Arms on the cursor anywhere except `cursor.armsOnlyInBeat`.
- Real brands, real logos, real products, licensed characters.
- A music score.
- Any page that would not pass as a real, usable web page if the gags were removed.
- Cartoon, flat, painterly or toy-like rendering. The motion is cartoon. The picture is real.

## Decisions waiting on Brandon

Each has a default. The default stands unless he changes it.

| Decision | Default |
| --- | --- |
| The employer's name on the careers page | `employer.name`, his own from 2025 |
| The rejection line | His line and the AI line merged, in `copy:step5.letter.body` |
| The prompt typed in the `with-prompt` cut | `intro.prompt`. Computer builds it and then has to suffer through its own work |
| The applicant's name and email in the film | `applicant` in the config |
| The narrator's lines | The draft in `content/narration.json` |
| Jokes that name real companies | Left out. Listed in `copy:heldBack` |
| Typing on a real keyboard in step 1, live mode | Ignored, with the note in `copy:step1.keyboardNote`, so the on-screen keyboard is the only way |
| A skip link on each step, live mode | Shown after `live.skipLinkAfterSeconds` seconds, for a visitor in a hurry |
| The link on the touch-device message | `links.portfolioWork`, not filled in yet |

## What the Builder may tune

- The beat times inside a unit, to make a gag land and to fit the narrator's kept takes. A unit's total may move by up to `film.unitTuneFraction` of itself. The whole of film B stays at or under `film.maxSeconds`.
- The cursor's acting, as long as it stays inside the rules in `kit/02-SUBJECT.md`.
- The camera pushes on the pages and the exact framing of the pinball shots.
- Every change is made in the config and logged.

The Builder does not change the order of the units, drop a beat, add a page, give the cursor a face, or rewrite copy. Changes from Brandon arrive as an addendum or as a note in the thread.
