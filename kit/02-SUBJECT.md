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

- One accent color: the orange. Red is kept for things that hurt: error slabs, the stamp, the firehouse flasher.
- No surface is pure white or pure black.
- The pinball machine is the one object that does not follow this palette. It is its own world. See "The pinball machine".

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

## The cursor

The hero. The only character. The whole project depends on the viewer caring about it.

### What it is

- A classic arrow cursor as a physical object: a glossy white enamel body with a black edge, real thickness, a soft shadow.
- On the page it is `cursor.heightPxAt1080` pixels tall at 1920 by 1080. That is larger than a real cursor on purpose. It is the star and it has to be readable.
- It is one size, always. When a moment needs to be bigger, the camera moves closer.
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

- A recessed brushed aluminum tray. Off-white keycaps with dark legends, each a real key with travel.
- A complete layout: a number row ending in Backspace, Tab and the QWERTY row, Caps Lock and the ASDF row ending in Enter, Shift at both ends of the ZXCV row, and a bottom row with a wide space bar plus "@" and "." keys. The Enter key is orange.
- The cursor types by landing on a key. The key sinks, the letter appears in the field with the orange focus ring.

**The turrets**

- Two small aluminum turrets rise from round hatches at the left and right ends of the tray.
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
- Clicking a row opens it. A panel opens under the input, the rows below move down, and the machine rises out of the page inside the panel. One row is open at a time. When the machine has done its damage it sinks back, the row closes and its input shows the value.
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

Copy: `copy:step3`. Approved images: the eight `table-` keys, from reference round 6. Pending until `references/STATUS.md` says otherwise. See "The pinball machine" below.

- The page shows the heading and `copy:transitions.step3`. Then the page splits and the cabinet rises.
- When the scene is over the cabinet sinks back into the page and the page shows the result card, `copy:step3.result`.

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

The centerpiece. The part people will remember and the part to spend the most on. It must hold up when the camera is inside it, a hand's width from a bumper.

### The bar

- A real, expensive arcade pinball machine in perfect condition, the kind a person plays in an arcade.
- Crowded edge to edge. Deep and layered: things above things, ramps over lanes, wire over plastic over print.
- Themed in every detail. No part is generic.
- Two earlier tables were rejected for being sparse and generic. They were built out of form parts in the page's minimal style. This machine is the opposite of minimal.
- The name, the artwork and the layout are original. It copies no real machine.

### Anatomy

| Area | Parts |
| --- | --- |
| Cabinet | Side rails, lockdown bar, playfield glass, legs, a backbox with a lit title panel and a score display |
| Lower playfield | Two flippers, slingshots with rubber rings, inlanes and outlanes with lit inserts, an apron with instruction cards |
| Shooter | A shooter lane on the right with a spring plunger |
| Middle | Three pop bumpers, a bank of five drop targets, standup targets, a spinner |
| Upper playfield | A scoop hole, orbit lanes round the outside, one chrome wireform ramp, one clear plastic ramp |
| Everywhere | Posts, rubbers, screws, wire guides, lit arrow and circle inserts, flasher domes, general lighting |
| The printed layer | Playfield artwork under a glossy clear coat covering the whole surface |

- The printed artwork is an illustrated map of the city at dusk. Its roads are the paths the ball follows. It is illustration, as on a real machine. Everything standing on it is real.
- Most of the detail on a real table is that printed artwork. It is made as flat art and laid under the clear coat. Only the parts that stand up are modeled.

### The city

`table.name` is a miniature city where every building is a joke about working life. The labels are in `copy:step3.table.buildings`.

| Where | Building | Table part | The joke |
| --- | --- | --- | --- |
| Top center | Corporate HQ, a glass and steel tower, the tallest model | The main ramp runs into its lobby doors | The goal you never reach. The doors shut |
| Upper left | A firehouse with a red flasher dome | The scoop hole is its garage door | "You're Fired" |
| Upper right | A police station with a blue flasher dome | Beside the spinner lane | "Background Check" |
| Middle | A coffee shop | Among the three pop bumpers, whose caps are coffee cup lids | The only thing keeping the city running |
| Left side | A bank with columns | Behind the five drop targets | "Student Loans" |
| Right side | A highway overpass and a parking garage | The chrome wireform ramp and the clear plastic spiral ramp | The commute |
| Lower sides | Rows of small houses | Along both outlanes | The left outlane is "Mom's Basement" |
| Between the flippers | The drain | | "Unemployment Office" |
| Upper right corner | A tiny sunny beach with palm trees and a deck chair | Sealed in a clear acrylic box with no way in | "Retirement". Lit, visible and unreachable |

### Modes and the display

- The lit inserts and the score display use Brandon's lines in `copy:step3.table.modes`. When a mode lights, the display shows its line.
- "Reply All" is the multiball: the moment more balls flood the table.
- The apron card reads `copy:step3.table.apronCard`.
- The reference image shows six inserts. The table carries all nine.

### The cursor in the machine

- It stays an arrow. It is not turned into a ball. As an arrow it can keep acting, and the scene needs its reactions.
- It tumbles, skids, spins, squashes flat on impact and stretches in flight.
- Steel balls are the other things on the table. From "Reply All" on they chase it and hit it.

### The scene

- It is choreographed. Every event in `kit/01-FILM.md` happens on cue, in order, every time.
- The camera goes inside: low, close, following the cursor, cutting between the shots listed there.
- Lights are part of the choreography: flashers on hits, a wave across the inserts on the launch, the whole table strobing in "Reply All".

**Live mode**

- The visitor has the flippers and they really work.
- The scene still hits every story beat in order. The table steers the cursor to the next beat. The visitor's flips change the path between beats, not the story.
- Nobody can lose and nobody has to be good at pinball. It runs about `live.pinball.sceneSeconds` seconds and ends the same way for everyone.
- The view is a steady play view of the table. The close shots cut in only at the big moments, when the cursor is held or in flight and the flippers are not needed.

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
- When the page takes control of the cursor it gives it back within `live.controlTakenMaxSeconds` seconds.
- After `live.skipLinkAfterSeconds` seconds on a step a small link appears, `copy:live.skip`. It plays the step's ending and moves on.
- A link, `copy:live.watchFilm`, plays the film mode from any page.
- A visitor whose system asks for less motion is offered the film with playback controls in place of the live site.
- No data leaves the browser. Nothing typed is sent or stored anywhere. The careers page says so and it is true.
- A touch-only device gets the message in `copy:live.touchOnly`.
