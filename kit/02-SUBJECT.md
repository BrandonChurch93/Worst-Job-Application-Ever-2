# 02 · The page, the cursor and everything that hurts it

Three things are on screen: the page, the cursor, and whatever the page is doing to the cursor. This file describes all three. The approved images show them. Where words and an approved image disagree, the image wins, except on a settled difference. `kit/06-ASSETS.md` has that rule.

A key written as `copy:` followed by a path is a string in `content/copy.json`. Every other key is in `config/showcase.json`.

## The rule of the world

**It is a real web page, and it is made of real things.**

- Take the gags away and every page is still a web page a person could use: a header, a progress bar, labeled fields, buttons, a clear layout. If a page would not pass as a real site, it is wrong, however good it looks.
- Every control is a physical part: it has thickness, a material, an edge that catches light and a shadow under it. A button sinks when pressed. A field is a slab of glass set into the page.
- Nothing is drawn. Nothing is flat. Nothing glows that could not glow.
- The page obeys its own layout until a gag breaks it. When something breaks out, it is an event.

## What the page is made of

The approved image is the sheet `page-look`, at `references.approved.pageLook`.

| Part | Material |
| --- | --- |
| The page surface | Matte soft-touch ceramic, warm off-white, with a fine eggshell grain. Never perfectly smooth |
| Inputs, cards, panels | Frosted glass slabs with a thin aluminum rim, set slightly into the page |
| Rails, trays, dials, small hardware | Brushed or milled aluminum |
| Primary buttons and accents | Glossy orange plastic with real height |
| Secondary buttons | Smoked grey glass or plastic |
| Text | Dark charcoal, printed or lightly engraved into the surface. Crisp at every size |
| Paper, where there is paper | Real paper stock: the resume, the rejection letter, the shredded strips |

- One accent color: the orange. Red is kept for things that hurt: error slabs, the stamp, the firehouse beacon.
- No surface is pure white or pure black.
- The playfields of the pinball machine are the one place that does not follow this palette. Each tier is its own world. The machine's frame does follow it: aluminum rails, a ceramic border, orange flippers. See "The pinball machine".

## Light

- One soft key light from the upper left. Every part casts a clear, soft contact shadow down and to the right.
- The approved lighting is `references.approved.lighting`: clean and even. The round 5 keys have the same light.
- No window shadows and no diagonal bands of light or shade across the page. Three earlier reference images had them and they are not the target.
- Shadows may be a little deeper than the page look image. That depth is what made the realistic references read as real.

## Layout

- Aligned columns, consistent field sizes, even spacing. A designer would sign off on every page before any gag is added.
- Every step has the same header: the title `copy:site.title` at the left and a five-step progress bar at the right, with the current step's button in orange.
- Under the header: the step heading and one line of subline.
- A page is designed at 1920 by 1080 and fills the frame. Nothing is visible around it: no desk, no browser frame, no room.
- The page of step 3 is the one page taller than the frame. Its width is the same.

### One scale

Brandon's note on the round 5 images: the keyboard went into the page where it should stand out of it, and the same part was drawn at different sizes from one image to the next. The images settle the look and the arrangement. They do not settle size.

- Every size and every height off the page is a number. Shared parts take theirs from `scale.sizes` and `scale.heights`. Everything else takes its size from the page's layout tree. A part whose kind is listed in `scale.kinds` takes its height from `scale.heights`, and any other part takes its height from its own section of `kit/03-METHOD.md`.
- A part of one kind has the same size and the same height on every page: a progress button, a field, a button, a card.
- No size is measured off an approved image.
- Shadows follow from the heights and the one light. They are never painted to match an image.
- Things come out of the page. A mechanism the cursor works stands above the surface, with its working parts at least `scale.heights.machineMinTop` above it. It may rise from a slot or stand in a shallow tray. It is never sunk in a well.
- The only things below the surface are pockets and sockets: the floor of a field, the gap round a button, the rail of the progress bar, a slot something rises from, a shallow tray.
- The pinball machine is the one exception. It is set into the page of step 3 with its floors below the surface, and its sizes and heights are in balls, in `table`. Measure M9 does not check it. Measures M8 and M10 do.

| Kind in `scale.heights` | Above or below the surface | What it is |
| --- | --- | --- |
| `rule` | Above | The header rule |
| `progressRail` | Below | The rail the progress buttons sit on |
| `progressButton`, `progressButtonCurrent` | Above | A step's button. The current step's stands higher |
| `field` | Below | The floor of a text field's pocket |
| `buttonSocket`, `button` | Below, above | The gap round a button, and the button's top. The careers page's big button is kind `heroButton` for its size and `button` for its height |
| `card` | Above | A glass card or panel |
| `paper` | Above | A sheet of paper lying on the page |
| `slab` | Above | An error slab lying on the page |
| `keyboardDeck`, `keycap`, `keyTravel` | Above | The deck the keyboard stands on, the top of a key, and how far a key sinks when pressed |
| `turret` | Above | The top of a turret when it is up |
| `machineTray`, `machineMinTop` | Below, above | The floor of the shallow tray a step 2 machine rises from, and the least height of any mechanism's working parts |
| `cursorHover` | Above | The gap under the cursor at rest |

Measure M9 in `kit/07-QUALITY-BAR.md` checks it.

## The cursor

The hero. The only character. The whole project depends on the viewer caring about it.

### What it is

- A classic arrow cursor as a physical object: a glossy white enamel body with a black edge, real thickness, a soft shadow.
- On the page it is `cursor.heightPxAt1080` pixels tall at 1920 by 1080. That is larger than a real cursor on purpose. It is the star and it has to be readable.
- It is one size, always. When a moment needs to be bigger, the camera moves closer.
- In step 3 it is sealed in a clear ball. It is the same arrow at the same size, and it still acts. See "The clear ball".
- It has no face, no eyes and no mouth. Ever.

### How it acts

It moves like a character in a classic cartoon short and it is rendered like a product photograph. Both halves matter.

- It walks, struts, tiptoes and drags itself. It does not glide like a pointer except when it is calm and nothing is happening.
- Squash and stretch on every start, stop, jump and impact.
- It anticipates: a wind-up before a jump, a flinch before a hit.
- It reacts to everything. A beat with no reaction from the cursor is a wasted beat.

| State | What is seen | Approved in |
| --- | --- | --- |
| Confident | Upright, a slight bounce, a strut | Words only |
| Nervous | Beads of sweat form and roll off. A small tremble. A gulp that travels down its body | `references.approved.cursorActing` |
| Shocked | A double take. It stretches tall and snaps back | Words only. The still image did not carry it |
| Angry | The tip glows red and it vents steam | `references.approved.cursorActing` |
| Scared | It goes pale and stony, leans back, hides behind the nearest field | `references.approved.cursorActing` |
| Proud | It puffs up and dusts itself off | Words only |
| Exhausted | It sags and melts a little at the edges, drags itself, slumps against things | `references.approved.cursorActing` |

- Sweat, steam and smoke are real: drops with highlights, vapor that drifts and thins.

### Damage

The approved image is `references.approved.cursorDamage`.

| Damage | Cause | What is seen |
| --- | --- | --- |
| Burn hole | A turret bolt | A round hole burnt through it with a charred edge and a wisp of smoke |
| Shredded | The shredder | A pile of thin strips |
| Reassembled | After the shredder | The strips zip back together slightly misaligned, then true |
| Flattened | The crank, the stamp, the HQ doors | Pressed thin, crazed like cracked enamel, then it peels up and refills |
| Scorched | The boss | A blackened tip, a trail of smoke |

- Damage is temporary. It stays long enough to be funny and heals within `cursor.damageHealSeconds` seconds, the way a cartoon character is whole again in the next shot.
- The heal is seen: the hole closes, the dents pop out, the color returns. It never just switches back.
- Damage never carries from one page to the next.

### The arms

The approved images are `references.approved.cursorArms` and `references.approved.tugOfWar`.

- Two thin matte black rubber arms with small simple hands, matching the black edge.
- They appear once in the whole piece: in `cursor.armsOnlyInBeat`, to grab the resume and pull.
- They sprout when it grabs the paper and they are gone when it is shredded. Before that beat and after it there are no arms.
- The arms sheet was photographed at an angle. It defines the arms, not the camera.
- The tug of war image shows the cursor larger than its real size. The size comes from the config. The camera pushes in for that beat.

### Never

- A face, eyes, a mouth, eyebrows, legs or feet.
- White cartoon gloves. Two reference sheets tried cursor hands and they read as a classic cartoon character's gloves.
- A second character. The page, the machines and the boss are things, not characters with feelings. Only the cursor has feelings.

## The pages

The copy for every page is in `content/copy.json` under the key named for it. Use it exactly.

### The careers page · unit `marketing`

Copy: `copy:marketing`. Approved image: key `marketing-top`.

- A one-page careers site for `employer.name`. Cheerful, corporate and sincere.
- What is on it, top to bottom: the top bar, the hero with the big "Apply for a Job" button, the perk cards, the awards, the testimonials, the comparison table, the five-step process, the questions, the final call to action, the footer. A ticker strip runs along the bottom of the first screen.
- The film shows only the first screen: the top bar, the hero, three perk cards, one award medallion and the ticker. The rest is for the visitor who scrolls.
- **Perk cards.** Each has a title, a cheerful promise and a line of fine print. The fine print is hidden until the cursor touches the card. Then the card flips or its face slides away, and the fine print is under it.
- **Awards.** Aluminum medallions, each with the award, who gave it, and the fine print.
- **Testimonials.** No portraits. Each is an employee badge with the photo blacked out and the name redacted with bars, the role, the quote and the bracketed note.
- **The ticker.** A thin strip of items from `copy:marketing.ticker`, moving slowly.
- **The big button.** It has real travel. Pressing it starts the application.
- Live mode: the page scrolls like a normal page. Nothing here hurts the cursor. This is the only time it is safe.

### Step 1, About You · unit `step1`

Copy: `copy:step1`. Approved images: keys `step1-fire` and `step1-tug`. The round 4 version was rejected: no layout discipline, beams instead of bolts, a keyboard with keys missing.

**Layout**

- The upper part follows the approved page look: the resume drop zone on the left, three equal stacked fields on the right: First name, Last name, Email.
- The lower part is the keyboard, docked along the bottom across the full content width, like an on-screen keyboard that has slid up.

**The keyboard**

- It stands out of the page. A brushed aluminum deck rises through a slot along the bottom of the page and stops with its top `scale.heights.keyboardDeck` above the surface. It casts a shadow on the page. The approved image sinks the keyboard in a well. That is a settled difference: the deck wins.
- Off-white keycaps with dark legends stand on the deck, each a real key with travel.
- A complete layout: a number row ending in Backspace, Tab and the QWERTY row, Caps Lock and the ASDF row ending in Enter, Shift at both ends of the ZXCV row, and a bottom row with a wide space bar plus "@" and "." keys. The Enter key is orange.
- All five rows are on the deck. A letter key is the same size wherever it is, and no key is shorter than `scale.sizes.keycapMin` on its short side.
- The cursor types by landing on a key. The key sinks, the letter appears in the field with the orange focus ring.

**The turrets**

- Two small aluminum turrets rise from round hatches in the top of the deck, one at each end.
- They fire separate bolts: short glowing orange streaks with a bright head, each one a thing that travels and can be dodged. Never a continuous beam.
- A bolt that hits a key leaves a scorch mark that fades. A bolt that hits the cursor burns a hole in it.
- They track the cursor with a short delay, so their aim is readable and a dodge is fair.

**Field by field**

| Field | The problem |
| --- | --- |
| First name | Typing under turret fire |
| Last name | The turrets retract. The keys shuffle to new positions after every letter |
| Email | The keys behave. A correct email is answered with a heavy red slab reading `copy:step1.emailError`, dropped from above. Then two more. Then `copy:step1.emailAccepted` |
| Resume | The keyboard sinks back into its slot first, so the lower part of the page is clear. Then the shredder |

**The shredder**

- The resume is a real sheet of paper lying on the page, titled `copy:step1.resume.paperTitle`.
- When it reaches the drop zone, a slot opens in the page beneath the zone, steel rollers turning inside, and takes the bottom edge of the paper.
- The tug of war is the one beat with arms. It is the best gag in the piece and it is played long: gains and losses, the paper stretching and creasing, the cursor's tip and heel corner skidding on the ceramic. It has no feet.
- The cursor loses. Paper and cursor go in together. Strips come out onto the page below the slot.
- The strips reassemble into the cursor. The form shows `copy:step1.resume.received`.

**Live mode**

- The visitor steers the cursor onto each key and clicks to type. Typing on a real keyboard is ignored and shows `copy:step1.keyboardNote`.
- A name needs `live.step1.minChars` characters.
- A hit knocks the cursor back, burns a hole and removes the last letter typed. After `live.step1.hitsBeforeTurretsOverheat` hits the turrets overheat and stop, so nobody is stuck.
- The email is accepted whatever is typed, after the slabs.
- The visitor drags the paper to the drop zone. In the tug of war, pulling the mouse away pulls the paper. The page takes control at the end and the visitor always loses.

### Step 2, Personal Details · unit `step2`

Copy: `copy:step2`. Approved images: keys `step2-rest`, `step2-dial` and `step2-crank`, and the sheet `machines` for the look of all three machines. The sheet shows all three at once, which is no longer the layout. No approved image shows the slot machine open inside its row: it follows the sheet for its look and the dial and crank keys for how a machine sits in its panel.

**Layout**

- Three ordinary form rows, closed and flat. Each has a label, a helper line and a plain glass input with a small chevron.
- Below them the note `copy:step2.note` and a Continue button that stays grey until all three are done.
- Clicking a row opens it. A shallow tray opens under the input, the rows below move down, and the machine rises out of the tray until its working parts stand above the page. One row is open at a time. When the machine has done its damage it sinks back, the row closes and its input shows the value.
- Every field has a reason, written in its helper line. The volume is being set because the visitor will want to hear the Skills Assessment.

**The machines**

| Row | Machine | How it is used | What it does to the cursor |
| --- | --- | --- | --- |
| Contact number | A brushed aluminum rotary phone dial with an orange center | Drag a number round to the stop and let go | On the return the dial whips the cursor round and flings it. After `live.step2.dialDigitsBeforeItGivesUp` digits the form shows `copy:step2.rows.phone.gaveUp` |
| Date of birth | A three-reel slot machine with a pull lever and an orange knob | Pull the lever | The reels stop on a date. It is accepted whatever it is, with `copy:step2.rows.birth.recorded`. The machine pays out and spits coins at the cursor |
| Audio volume | A hand crank with an orange handle beside a ten-segment level meter | Turn the crank clockwise | After `live.step2.crankTurnsBeforeItRunsAway` turns the crank runs away by itself to full and flattens the cursor on the way round. Then `copy:step2.rows.volume.done` |

- Each machine is a different kind of motion: a whip, a pelting, a flattening. Three gags, not one gag three times.
- Each machine gets one hit and the page moves on. This page must never feel long.

**Live mode**

- The visitor works each machine with the mouse: drag the dial, drag the lever down, circle the crank.
- The crank really sets the site's volume. It starts low and ends at full.
- The rows can be done in any order.

### Step 3, Skills Assessment · unit `pinball`

Copy: `copy:step3`. Approved images, from reference round 6: the ten keys of unit `pinball` in the config and the sheets `clear-ball` and `table-map`. See "The pinball machine" below.

- The page of step 3 is tall. Its first screen is an ordinary page of the application: the header, the heading, `copy:step3.subline`, the paragraph `copy:transitions.step3`, and one control at the right, the loader port. Key `loader-page`.
- Below the first screen the page holds the machine, set into the ceramic: the marquee, then the three tiers, then the apron. Below the machine is a last screen with the outlet port and the result card. Still `step3-result` shows it.
- The loader port is a wide brushed aluminum ring set into the ceramic with a dark cup inside it. A clear tube with aluminum collars leaves it and runs down the right side of the page to the machine's plunger.
- When the cursor comes near the port it is pulled in. The two halves of a clear ball close round it with a click. The ball drops into the tube.
- When the scene is over the ball rolls out of the outlet port below the machine and splits at its seam. The cursor falls out flat, peels itself off the page and shakes itself.
- The result card shows `copy:step3.result` and the button `copy:step2.continue`, which turns the page to step 4.

### Step 4, Submit · unit `boss`

Copy: `copy:step4`. Approved images: the sheet `boss-stages` and keys `boss-fight` and `boss-down`. See "The boss" below.

- Before the fight the page holds two things: the Human Verification card and the Submit button in its socket.
- The checkbox answers differently in each mode. In the film the AI ticks it and the card shows `copy:step4.verify.confirmedFilm`. On the live site the visitor ticks it truthfully, the card shows `copy:step4.verify.doubtLive`, then `copy:step4.verify.confirmedLive`.
- Ticking the box is what wakes the button.

### Step 5, Decision · unit `decision`

Copy: `copy:step5`. Approved image: key `decision`. The round 4 version was rejected: empty and unbalanced.

**Layout**

- A full, balanced two-column page.
- Left: the rejection letter, a real sheet of paper lying on the page, with a crisp red stamp impression across one corner at a slight angle.
- Right: the Performance Metrics panel with three readouts and the applicant number.
- Bottom: one large orange button, `copy:step5.accept`, and a small text link, `copy:step5.share`.

**What happens**

- First the wait: `copy:step5.wait`, a counter reading months, and hold music.
- The counter spins to zero at once. The letter drops. The stamp block slams down on the letter and the cursor, lifts, and rests beside the letter.
- The metrics fill in. "Your Time" is the real time the visitor took, or the film's running time in film mode.
- "Accept Rejection" is the only way forward. Pressing it turns the page back to the careers page, with the ticker now reading `copy:marketing.tickerAfterRejection`.
- On the live site the footer of that last page shows `copy:step5.closing` and Brandon's credit.

## The pinball machine

The centerpiece. The part people will remember and the part to spend the most on. Brandon's words: it is the biggest showcase in the whole thing, it needs to be ultra detailed, and it must not look generic or quickly put together.

### The bar

- Brandon's words: "actual pinball video games, like ones released on Steam". "That's the quality bar here. It has to look like one of those."
- So a tier on screen must pass as a screenshot of a pinball video game that has shipped: crowded edge to edge, deep and layered, lit by its own lamps, every part themed.
- It must also work as pinball. Every path a ball takes is a real path with a way on and a way off. "Ball paths" below is the rule.
- And it belongs to this website: brushed aluminum rails, a ceramic border, orange flippers, physical parts. No cabinet, no legs, no coin door, no sheet of glass, no room.
- Three earlier machines were rejected: two for being sparse and generic, and one arcade cabinet for not belonging in a web page. `references/STATUS.md` has the table.
- The format is borrowed from a line of tall pinball video games whose table is several screens high with one playfield to a screen. Nothing else is borrowed. No layout, artwork, character or name comes from any game or any real machine.

### The story

A career in reverse. The ball is launched to the top, the executive floor, and is knocked down a tier at a time, to the office and then to the street, until it drains into the Unemployment Office.

### The shape

Sheet `table-map` shows where everything is. Key `table-wide` shows the whole machine from the player's end.

- Three playfields, called tiers, stacked in one long frame set into the page. From the top: Tier 3 Corporate, Tier 2 The Office, Tier 1 The Street. `table.tiers` lists them from the top.
- Above Tier 3 is the marquee: a lit panel with the title `copy:step3.table.title` over a city skyline at dusk, and under it the main display.
- Below Tier 1 is the apron: two ceramic slabs with the drain between them.
- The floor of Tier 3 lies `table.topFloorDepthBalls` below the page surface. Each tier lies a step lower than the tier above it, by `table.tierStepBalls`.
- The ball is the unit of size. It is `table.ballPx` page pixels across. `table.tierWidthBalls` is the width of the page, and the page's narrow ceramic border, the two rails and everything between them fit inside it. So a tier seen from its tier camera fills the frame at the page's own scale, and the cursor is never rescaled to fit the ball.

| Thing | Size |
| --- | --- |
| One tier | `table.tierWidthBalls` wide and `table.tierHeightBalls` tall, so one tier fills one 16:9 screen |
| A flipper | `table.flipperBalls` long |
| The gap between the tips of a pair of flippers | `table.flipperGapBalls` |
| A lane | `table.laneBalls` wide |
| Any opening a ball passes through | At least `table.minClearanceBalls` |
| The marquee | `table.marqueeHeightBalls` tall |
| A tier's display | `table.displayWidthBalls` by `table.displayHeightBalls` |

### What every tier has

- The frame: a brushed aluminum rail down each side, inside the page's ceramic border.
- Inside the left rail: the lift tube. Inside the right rail: the launch lane.
- A top lane that curves across the head of the tier, with arrow lamps set into it.
- A pair of orange flippers at the bottom centre. Orange is on the flippers, the plunger knob and the doors and elbows of the lift, and on nothing else in the machine.
- A slingshot above each flipper, an inlane and an outlane on each side, posts with rubber rings, wire guides, lamps.
- Three large round inserts above the flippers, each a lit picture with no words.
- A display in the lower right shoulder.
- Printed artwork under a glossy clear coat over the whole floor. No part of the floor is bare.
- Its own colour of light, so the three read as three places at a glance.

### Tier 3 · Corporate

Key `tier-corporate`. Floor: midnight blue with thin gold art deco lines. Light: cold white and gold.

| Where | Thing | Table part | The joke |
| --- | --- | --- | --- |
| Top centre | Corporate HQ, a glass and steel tower, the tallest thing in the machine. Sign `copy:step3.table.buildings.hq` | Brass lobby doors at its foot, a red carpet running down toward the flippers, two globe lamps | The goal you never reach. The doors shut |
| On the carpet | A revolving door: four clear panels on a brass post | A rotating kicker. It turns when the ball strikes it and bats the ball on | |
| Top right | A sunny beach with a palm and a deck chair, sealed in a clear box. Plate `copy:step3.table.buildings.beach` | None. No path leads in | Lit, visible and unreachable |
| Upper left | A long boardroom table with twelve empty chairs | A row of `table.dropTargetsPerBank` drop targets along its near side | Nobody is there |
| Left | Three yellow sticky notes | Three standup targets | |
| Right | The corporate ladder: a steel ladder laid as a ramp | A wire ramp. The ladder's two rails are the track. It climbs, curves round and comes back down to the foot it started from | You climb it and end where you began |
| Above the flippers | Two white marble wedges | The slingshots | |
| Inserts | A magnifying glass, an hourglass, a clipboard with a tick | "Micromanagement", "Aggressive Deadlines", "Performance Improvement Plan" | |

### Tier 2 · The Office

Key `tier-office`. Floor: grey-green carpet tile with a pale walkway. Light: flat fluorescent white.

| Where | Thing | Table part | The joke |
| --- | --- | --- | --- |
| Top centre | The chute from Tier 3 | It drops the ball straight onto the bumpers | |
| Under the chute | Three paper coffee cups with white lids | Three pop bumpers. The lids are their caps | The only thing keeping the place running |
| Top right | An office coffee machine. Sign `copy:step3.table.buildings.coffee` | A standup target | |
| Upper left | Six cubicles with low walls, each with a desk, a chair and a dark monitor. No people | A column of `table.dropTargetsPerBank` drop targets along their right side | |
| Right | An inbox tray heaped with envelopes | A scoop at its foot. It holds the ball and the tray pours out steel balls | "Reply All", the multiball |
| Above the flippers | Two giant red staplers | The slingshots. They snap | |
| Inserts | A slice of pizza, an envelope with two arrows, a knot in a rope | "Pizza Party", "Reply All", "Team Building" | |
| The floor | Paper clips, loose sheets and rubber bands, printed and lying about | | |

### Tier 1 · The Street

Key `tier-street`. Floor: dark blue asphalt, a road with a dashed centre line running down the middle, crossings and parking bays. Light: warm dusk with one red beacon and one blue.

| Where | Thing | Table part | The joke |
| --- | --- | --- | --- |
| Top centre | The chute from Tier 2 | | |
| Upper left | A red brick firehouse with a red beacon. Sign `copy:step3.table.buildings.firehouse` | Its garage door is a scoop. It holds the ball, the beacon turns, and it fires the ball out | "You're Fired" |
| Upper right | A blue police station with a blue beacon. Sign `copy:step3.table.buildings.police` | A spinner beside it | "Background Check" |
| Left | A bank with columns. Sign `copy:step3.table.buildings.bank` | A column of `table.dropTargetsPerBank` drop targets along its right side | "Student Loans" |
| Across the middle | The highway: a chrome wire ramp crossing above the road | A wire ramp. On at its left end, off into the garage at its right end | The commute. The camera rides it |
| Right | A parking garage: a clear spiral inside a round concrete frame | The spiral: `table.spiralTurns` turns down to the right inlane | |
| Lower sides | Six tiny houses, three on each side | | |
| Left outlane | One more small house. Sign `copy:step3.table.buildings.outlane`. A cellar hatch in the floor beside it | The hatch swallows the ball and kicks it back into play, `live.pinball.momSavesPerScene` time in a scene. After that it stays shut and the ball rolls on down the outlane to the drain | "Mom's Basement" |
| Above the flippers | Two yellow road signs with black chevrons | The slingshots | |
| Inserts | A ladder, a clock face, three hats stacked | "Entry-Level", "Unpaid Overtime", "Multiple Hats" | |
| The apron | Two ceramic slabs. Between them the drain, with the plate `copy:step3.table.buildings.drain`. On the left slab, the card `copy:step3.table.apronCard` | The drain | "Unemployment Office" |
| Lower right corner | The plunger: a steel rod with a spring and an orange knob | Its rod passes through the lower rail. The knob stands outside the rail | |

### Ball paths

Image generation cannot draw a path that works. The blind judges of round 6 named the same faults in almost every image: a lift tube closed at both ends, a ramp with no way on, a spiral too tight for a ball, nothing to carry a ball back up a tier. The build follows these rules. Where an approved image breaks one, the rule wins.

1. In. The loader port on the first screen of the page feeds the clear tube down the right side of the page. At the machine the tube runs on down inside the right rail, beside the launch lane, and ends at the plunger, at the lower right corner of Tier 1. The plunger fires the ball up the launch lane, inside the right rail, past all three tiers and into the top lane of Tier 3.
2. Down. On Tiers 3 and 2, the gap between the flippers and both outlanes lead into one chute, and the chute opens at the top centre of the tier below. On Tier 1, the gap between the flippers and both outlanes lead to the drain. The left outlane passes Mom's hatch on the way: while the hatch is open it takes the ball, and after that the ball rolls on to the drain. Each of the three exits, the two chutes and the drain, has a gate at its mouth. A gate is a hold: it can take a ball and kick it back up into play.
3. Up. The lift is one clear tube inside the left rail. It has an orange door on Tier 1 and on Tier 2, and an orange elbow at the top left of Tier 2 and of Tier 3. A ball shot through a door is carried up one tier by air and let out of the elbow above, into that tier's top lane. The tube is open at every door and every elbow. The lift is free play: a visitor who finds it climbs back up a tier and falls again.
4. Wire ramps. A wire ramp is a track: two wires under the ball, two beside it and hoops along it, as in key `rail-cam`. It has a steel flap where the ball rolls on and an open end where the ball drops off. The highway is entered at its left end and ends over the top of the garage spiral. The ladder is entered at its foot and returns to its foot.
5. Holds. A scoop or a hatch holds a ball and always lets it go: the firehouse, the inbox, Mom's hatch. The lobby doors hold nothing. A ball that reaches them is slammed and rolls back down the carpet.
6. No way in. Nothing leads into the Retirement box, ever.
7. Clearance. Every lane, door, chute, tube, ramp and turn of the spiral that a ball uses is at least `table.minClearanceBalls` wide and high.
8. No dead ends. There is no place on any tier where a ball can come to rest, other than a hold that will let it go.
9. Arrow lamps along a lane point the way the ball travels.
10. Out. The drain feeds a tube to the outlet port on the last screen of the page. The outlet port is a hold: it takes the ball and opens it.

Measure M10 in `kit/07-QUALITY-BAR.md` checks these.

### The displays, the inserts and the modes

- The main display is under the marquee's title panel. Each tier has a smaller display in its lower right shoulder. All four are amber dot displays and all four show the same thing. The round 6 images have no tier display, and most blind judges gave that as their reason for not calling a tier a game screenshot.
- At rest the displays show the score in `table.displayDigits` digits. The score only ever counts up, and it means nothing.
- The nine inserts are Brandon's nine lines in `copy:step3.table.modes`. `table.inserts` says which picture and which mode each insert is. An insert carries a picture and no words. The first time the ball rolls over it, it lights, and the displays show that mode's `insert` and then its `display` line, scrolling. An insert the ball has not lit by the time it leaves that tier lights by itself as the ball leaves, so all nine lines are shown in every run.
- "Reply All" is the multiball. Its insert lights when the inbox takes the ball.
- At the start of the live scene the displays show a mouse with its two buttons blinking in turn. It is a picture, not words.

### The clear ball

Sheet `clear-ball`. Brandon's idea: the cursor is sealed in a clear ball, so it can be seen the whole time and the machine has room to be a spectacle.

- The ball is thick clear acrylic with a fine seam round its middle and a small aluminum plug. It refracts what is behind it, carries sharp highlights, and casts a light shadow with a bright spot in it. It holds no liquid.
- The cursor is inside it: the same arrow, a solid object, its length `table.cursorInBallFraction` of the ball's width. It is never printed on the ball and never a reflection.
- When a tier fills the frame, the cursor in the ball is the size it is on every other page.
- It behaves like a thing loose in a ball. When the ball is still, it lies against the bottom. When the ball rolls, it tumbles a beat behind. When the ball is hit, it is thrown flat against the inside wall.
- It still acts. It sweats when a flipper winds up, and the sweat beads on the inside of the ball. It goes rigid before a hit. It sags when it is spared. Everything under "How it acts" applies inside the ball.
- The other balls in the machine are chrome steel and the same size. In "Reply All" they pour out of the inbox, chase it and hit it. No steel ball leaves Tier 2: when the clear ball falls from the tier, the inbox scoop takes them back one by one.
- The ball is opened twice only: when it closes round the cursor at the loader port, and when it splits at the outlet port.

### Light in the machine

- While the camera is on the page, the page is lit by the website's light.
- When the camera leaves the page for the machine, the website's light is turned down to `table.pageDuskLevel` of its level and the machine is lit by its own lamps: general lighting round the edges of each tier, a lamp under every insert, the beacons, a lamp in each bumper, lit windows in every building, the marquee. Beyond the edge of the page there is darkness.
- Light spills. An insert lights the post beside it. A beacon throws its colour over everything near it. The clear coat shows sharp reflections of lamps and parts.
- When the scene ends the website's light comes back up.

### The scene

- It is choreographed. Every event in `kit/01-FILM.md` happens on cue, in order, every time.
- The camera is free here and nowhere else. Brandon's words: the camera zooms out and shows the entirety of the machine, then zooms in on the part the cursor is at and follows it around, and on a rail the camera attaches above the ball so the cursor is seen inside it.
- Lights are part of the choreography: a wave down the tiers on the reveal, a flash on every hit, the whole office tier strobing in "Reply All", a slow dim when the ball drains.

**Live mode**

- The visitor has the flippers and they really work. The left mouse button and the left Shift key work every left flipper. The right mouse button and the right Shift key work every right flipper.
- The view is the tier the ball is on, filling the screen, as in the three tier keys. When the ball changes tier the view travels with it in `live.pinball.tierTravelSeconds`.
- A close shot cuts in only while the ball is held or riding a ramp, for at most `live.pinball.closeShotMaxSeconds`, and the tier view is back before the flippers are needed.
- The scene still hits every story beat in order. The table steers the ball to the next beat. The visitor's flips change the path between beats, not the story.
- Nobody can lose and nobody has to be good at pinball. It runs about `live.pinball.sceneSeconds` seconds and ends the same way for everyone: in the Unemployment Office.

## The boss

Approved images: the sheet `boss-stages` and keys `boss-fight` and `boss-down`.

### What it is

- The Submit button, torn loose and unfolded into a small war machine, about a quarter of the page wide.
- Its core is still the glossy orange capsule with the word "Submit" on it.
- Round it: brushed aluminum armor plates, four jointed mechanical legs, two shoulder cannons made from the round progress-bar buttons, and a frosted glass shield plate made from an input field.
- It is built from the page's own parts. It is a machine, not a creature. No face, no eyes.
- The socket it tore out of stays on the page, empty and cracked.

### The fight

- A health bar slides in under the step heading, in the place the subline held, in the page's own style: a recessed aluminum track with a glossy orange fill, labeled `copy:step4.bossHealthLabel`.
- The socket is at the bottom center of the page, as the approved images show it.
- The cursor fights with the only thing it has. Every click fires a tiny glowing white cursor dart.
- `live.boss.phases` phases, each a different kind of fight:

| Phase | The boss | The cursor |
| --- | --- | --- |
| Slabs | Fires error messages from `copy:step4.errorSlabs` as solid red slabs | Dodges and shoots |
| Pop-ups | Throws up dialogs from `copy:step4.popups` as shields. They block darts until shot down or dismissed | Clears them or goes round |
| Last stand | Plays "Session expired" once and gets a little health back, then throws everything | Finishes it |

- When the bar is empty the boss sparks, folds in on itself and drops onto the page as an ordinary Submit button: dented, scorched, smoking, lying crooked outside its socket.
- Only now can it be clicked. The page shows `copy:step4.defeated`.

**Live mode**

- Move the mouse to dodge. Click to shoot.
- The cursor cannot die. A hit knocks it back and damages it, and the damage heals.
- The boss also tires by itself, so every visitor wins within `live.boss.maxSeconds` seconds.

## Rules for the live site

- Every visitor can finish. There is no fail state, no game over and no way to get stuck.
- Every visitor is rejected.
- The system cursor is hidden. The visitor's mouse moves the hero, with a little weight so it feels like a thing and not a pointer. It must still feel responsive.
- When the page takes control of the cursor it gives it back within `live.controlTakenMaxSeconds` seconds. Step 3 is the one exception: the cursor is sealed in the ball for the whole scene and the visitor has the flippers in its place.
- After `live.skipLinkAfterSeconds` seconds on a step a small link appears, `copy:live.skip`. It plays the step's ending and moves on.
- A link, `copy:live.watchFilm`, plays the film mode from any page.
- A visitor whose system asks for less motion is offered the film with playback controls in place of the live site.
- No data leaves the browser. Nothing typed is sent or stored anywhere. The careers page says so and it is true.
- A touch-only device gets the message in `copy:live.touchOnly`.
