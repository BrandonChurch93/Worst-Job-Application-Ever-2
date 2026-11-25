# Reference round 6 · The pinball machine

This is a reference run. It is not a build task. `AGENTS.md` and the build rules under `kit/` do not apply to it. Generate images. Build nothing else. Do not ask questions. Make the calls yourself and log them.

The job: twelve reference images of one pinball machine, `THE DAILY GRIND`, for Brandon to approve before anything is built. It is the main attraction of the whole project.

## Read and look before you generate anything

1. `kit/01-FILM.md`: "What it is" and "The idea".
2. `kit/02-SUBJECT.md`: "The rule of the world", "What the page is made of", "Light", and "The cursor" down to "Never".
3. `references/STATUS.md`: the table "Rejected, and why".
4. Look at these approved images: `references/approved/page-look.png`, `step1-fire.png`, `step2-dial.png`, `cursor-acting.png`, `cursor-damage.png`. They show the website this machine lives in and the hero.
5. Look at the two pinball tables that were rejected: `references/drafts/round-4/T1-pinball-option-one.png` and `T2-pinball-option-two.png`. Do not make those again.
6. Look at the twelve guide pictures in `references/guides/round-6/`. They are the layout. The six whose names end in `-labeled` are for you to read. The six without labels are for the image model.

Where this brief disagrees with `kit/02-SUBJECT.md` about the pinball machine, this brief wins. That file still describes an arcade cabinet and a bare cursor. Both are gone. It is updated after this round.

## What this project is, in six lines

- A comedy told as a job application on a website. A careers page, then a five-step application that fights back, then instant rejection.
- Every page is a real, usable web page made of real things: matte off-white ceramic, frosted glass, brushed aluminum, glossy orange plastic. One soft light from the upper left. Seen straight on like a screenshot.
- The hero is the mouse cursor: a glossy white enamel arrow with a black edge, about 70 pixels tall on a 1920 by 1080 page. It acts like a cartoon character and is rendered like a product photograph. It has no face, no eyes, no legs.
- Step 3 of the application is the "Skills Assessment". It is a pinball machine. The cursor, sealed in a clear ball, is the pinball.
- It is one site delivered two ways: a film in which the site plays itself, and a live site a visitor plays with their own mouse. So the machine has to be something a web page could really hold and a visitor could really play.
- It gets built in three.js from these images. Clear, solid, buildable shapes beat a mood.

## What Brandon said

The bar, set on November 24:

- "Do research on actual pinball video games, like ones released on Steam. That's the quality bar here. It has to look like one of those."
- "See what other successful pinball games have done, and let's try to recreate one of those with our own theme."
- "The 3-D pinball machine will be the biggest showcase in the whole thing. It needs to be ultra detailed and compacted. It doesn't need to look generic or lame or just quickly put together. It is the main attraction."
- "I really want him to generate a good one this time, not something that looks like it wouldn't actually exist within a web application."

The cursor and the camera:

- "It would be cool if something happened to the cursor, like it gets sucked in like a clear ball or something, so you can see it, and then the camera zooms out and shows you the entirety of the pinball thing."
- "Our poor cursor is being bounced all over the place and hit, and then it could zoom in on the certain parts he's at, the camera follows him around."
- "If there's like a railing system, the camera could attach to like above the ball so you can see the cursor inside of the clear ball."
- "That way we have enough space to really make the 3-D pinball area a spectacle, while also making it make sense and getting good visuals on the cursor."

## What the successful pinball video games do, and what we take

Brandon and the planner looked at the well-reviewed ones. Three ideas come from them.

| From | What they do | What we take |
| --- | --- | --- |
| The tall, multi-tier tables: one table three screens high, a line of games that goes back to 1990 | Each tier fills one screen and has its own pair of flippers and one big centerpiece. A ball that gets past a tier's flippers falls to the tier below. The view scrolls with the ball and can zoom out to show the whole table | **The format.** Three tiers, three screens, a centerpiece each |
| The modern 3D pinball simulations | A real, physical-looking table: glossy printed playfield, real hardware, dramatic lamps, and toys on the playfield that move | **The finish.** It looks like a physical machine, lit and detailed like the best of them |
| The games where the hero is the ball | The character rides or is the ball, and the camera follows it | **The hero.** The cursor inside a clear ball |

Study before you generate: find screenshots or trailers of four released pinball video games, one with a three-tier table, one 3D simulation showing one of its own original tables, and two more of your choice. Look at how full a screen is, how each tier is framed with its flippers at the bottom, how the centerpiece dominates its tier, how lamps and glow are used, and how the ball stays easy to find. Write five lines in the notes on what you take from them.

Take the format and the level of finish. Take no layout, no artwork, no character and no name from any game or any real machine. Do not look at tables based on films, comics or other licensed subjects.

## Three tests every image must pass

**Test A. It could be a screenshot from a pinball video game that has shipped.** Designed, dense, readable, polished. A stranger would guess it is a commercial game and would want to play it.

**Test B. It works as pinball.**

- Every part is a real pinball part: flippers on shafts with rubber, slingshots, pop bumpers with a skirt, a ring and a cap, drop targets, standup targets, a spinner, a scoop, posts with rubber rings, wire guides, lane guides, lit inserts set flush in the playfield, flasher domes, small lamps.
- Every lane is a ball and a half wide. Every ramp has a way on and a way off. The flippers of a tier can reach that tier's shots. Nothing is fused, melted, floating or impossible. Nothing blocks a lane.
- Each tier is crowded edge to edge and layered, with no bare stretch of playfield. Most of the detail is printed artwork under a glossy clear coat, with the standing parts on top of it.
- It is a flat board first. The buildings and the office furniture are small moulded toys standing on it among the hardware. It is not a model railway, not a diorama, not a doll's house.
- The same parts are in the same places in every image.

**Test C. It belongs to this website.**

- Its frame is made of the website's materials: side rails in the same brushed aluminum as the keyboard tray in `step1-fire.png`, a narrow border of the same matte off-white ceramic page round the whole machine, and the website's glossy orange for every flipper, the plunger knob and the lift doors.
- Inside that frame it is its own world, with its own colours and its own light.
- No cabinet, no legs, no coin door, no floor, no room, no other machines. Beyond the edge of the page there is only darkness.
- It is a physical thing, photographed. Not pixel art, not a flat illustration, not a cartoon.
- Nothing hides behind fog, smoke, haze, glare or blur. In the tier views and the two views of the whole machine every part is sharp.

## The machine

**Name:** `THE DAILY GRIND`. **Story:** a career in reverse. The ball is launched to the top, the executive floor, and is knocked down a tier at a time, to the office and then to the street, until it drains into the Unemployment Office.

**Shape.** Three tiers stacked head to foot. Each tier is one full screen, 16:9. Together they make one machine three screens tall, about as wide as the page. Step 3 is a tall page, and the machine is set into it.

**What every tier has, in the same place:**

- A pair of orange flippers at the bottom centre, three balls long, with a gap between their tips one and a half balls wide.
- A slingshot above and outside each flipper, and an inlane and an outlane with lit lamps at each side.
- Three large round lit inserts in an arc above the flippers. Each carries one simple picture and no words.
- On the right edge, the launch lane, running the full height of the machine. On the left edge, the lift: a clear tube that carries a ball up a tier. A small orange lift door opens onto each tier.
- The top two tiers: below the gap between the flippers is a chute. A ball that gets past the flippers falls through it into the top centre of the tier below.

**Size, in balls.** The ball is the unit.

| Thing | Size |
| --- | --- |
| One tier | 20 balls wide, 11 tall |
| A flipper | 3 balls long |
| A pop bumper's cap | 2.5 balls across |
| A lane | 1.5 balls wide |
| Corporate HQ, the tallest thing on the machine | 4 balls by 3.5 on the playfield, 7 tall |

### Tier 3 · Corporate, the top

Guide: `guide-tier-corporate-labeled.png`. The executive floor. Midnight navy marble with fine gold inlay, glass, cold white light.

| Where | What | The pinball part | The joke |
| --- | --- | --- | --- |
| Top centre | Corporate HQ, a glass and steel tower with lobby doors facing down the tier and a white flasher dome each side of them | A short red carpet ramp runs up to the doors | The goal you never reach. The doors slam shut. Sign: `Corporate HQ` |
| On the carpet, in front of the doors | A revolving door | A large four-vane spinner that bats the ball | |
| Top right | A tiny sunny beach with a palm tree and a deck chair, sealed in a clear acrylic box with no way in, lit warm from inside | Nothing reaches it | Sign: `Retirement` |
| Upper left | A long boardroom table with twelve empty chairs | A row of five drop targets along its near edge | Nobody is at the meeting |
| Right | A wire ramp built like a ladder, with rungs between its two chrome rails | It climbs, loops and sets the ball down where it started | The corporate ladder goes nowhere |
| Left of centre | Three standup targets shaped like yellow sticky notes | | |
| Along the top | The orbit lane, where the launched ball arrives from the right | | |
| The three inserts | A magnifying glass, an hourglass, a clipboard | Mode lamps | Micromanagement. Aggressive Deadlines. Performance Improvement Plan |
| Slingshots | Polished marble and chrome | | |

### Tier 2 · The Office, the middle

Guide: `guide-tier-office-labeled.png`. An open-plan office. Grey-green carpet tile and beige laminate, flat fluorescent light, sticky-note yellow, stapler red, coffee brown.

| Where | What | The pinball part | The joke |
| --- | --- | --- | --- |
| Top centre, right under the chute | Three pop bumpers whose caps are white coffee cup lids | The ball drops in from above straight into them | The only thing keeping the place running |
| Beside the bumpers, upper right | An office coffee machine | | Sign: `Coffee` |
| Upper left | A cubicle farm: six cubicles with low walls, each with a desk and a dark monitor. No people | A column of five drop targets along its right side | |
| Right | The inbox: a large mail tray stacked with envelopes | A scoop hole at its front. Steel balls pour out of it | Reply All |
| Slingshots | Two giant red staplers | They snap at the ball | |
| The three inserts | A pizza slice, an envelope with arrows, a knot of rope | Mode lamps | Pizza Party. Reply All. Team Building |

### Tier 1 · The Street, the bottom

Guide: `guide-tier-street-labeled.png`. The city outside, at dusk. Deep teal and navy streets printed on the playfield, warm amber windows, red and blue flashers.

| Where | What | The pinball part | The joke |
| --- | --- | --- | --- |
| Upper left | A red brick firehouse with a red flasher dome on its roof | Its garage door is a scoop hole | Sign: `You're Fired` |
| Upper right | A police station with a blue flasher dome | A spinner on the lane beside it | Sign: `Background Check` |
| Left | A bank with stone columns | A column of five drop targets along its side | Sign: `Student Loans` |
| Right | A three-level parking garage | A clear plastic spiral ramp | The commute |
| Across the tier | A highway overpass | A chrome wire ramp with two rails. It leaves the top of the garage, crosses over the centre and comes down at the left inlane. The camera rides this one | The commute |
| Above each slingshot | A row of three tiny houses | | The suburbs |
| Bottom of the left outlane | One tiny house with a cellar hatch | | Sign: `Mom's Basement` |
| Below the flippers | An apron in the website's off-white ceramic, with a small grey office front at its centre whose door is the drain | The drain | Sign: `Unemployment Office` |
| Bottom right | The plunger, with an orange knob, at the foot of the launch lane | | |
| The three inserts | A ladder, a clock, a stack of three hats | Mode lamps | Entry-Level. Unpaid Overtime. Multiple Hats |

**At the head of the machine**, above tier 3: the marquee. A low brushed aluminum frame standing up from the page, holding a lit art panel with `THE DAILY GRIND` over a city skyline at dusk, and under it an amber dot display showing six digits.

### Lettering

Image models misspell. Keep words few, large and exact.

- These are the only words allowed anywhere in any image, spelled exactly: `THE DAILY GRIND`, `Corporate HQ`, `Retirement`, `Coffee`, `You're Fired`, `Background Check`, `Student Loans`, `Mom's Basement`, `Unemployment Office`. On the website's page in G6 only: `The Worst Job Application Ever`, `Step 3: Skills Assessment`.
- The tier views are seen from above, so a sign lies on its building's roof or is printed on the playfield beside it.
- The nine inserts carry pictures, not words. Every other insert, card and plastic has no words: arrows, circles, stars, stripes.
- The display in the marquee shows digits only.
- A sign you cannot get spelled right is left blank. A blank sign is fine. A wrong sign is not.

## The clear ball

- A sphere of thick, perfectly clear acrylic, like a large gumball capsule. A fine seam round its middle. One small aluminum plug set flush in its side, where it was sealed.
- The cursor is inside it: the website's white enamel arrow with its black edge, a solid object, nearly filling the ball. Its length is about three quarters of the ball's width. It is never printed on the ball and never a reflection.
- It behaves like a thing loose in a ball. When the ball is still, the cursor lies against the bottom. When the ball rolls, the cursor tumbles a beat behind it. When the ball is hit, the cursor is thrown flat against the inside wall.
- It still acts: it sweats, and the drops bead on the inside of the acrylic. It goes pale. It presses itself against the far wall, away from what is coming.
- The acrylic has crisp highlights from the lamps and bends what is behind it a little. It never hides the cursor.
- No liquid in it. It is not a snow globe. Nothing else is in it.
- The cursor has no face, no eyes, no mouth, no legs, no arms, no gloves.
- The other balls are ordinary chrome steel pinballs, the same size, mirror bright.

## Light

- The frame, the ceramic border and the page in G6 are lit by the website's light: one large soft source from the upper left, clean, no window shapes, no bands. In the machine images it is turned down to a dusk level.
- The machine is lit by its own lamps: general lighting round the edges of each tier, a lamp under every insert, the flasher domes, a lamp in each bumper, lit windows in every building, the marquee. Light spills from an insert onto the post beside it. The clear coat on the playfield shows sharp reflections of lamps and parts.
- Each tier has its own colour of light, so the three read as three places at a glance: cold white and gold, flat fluorescent, warm dusk with red and blue.
- No glass sheet over the playfield in any image.

## The twelve images

Save each under `references/drafts/round-6/` with the file name given.

| Id | File | Shape | What it is |
| --- | --- | --- | --- |
| G1 | `G1-machine-wide.png` | 16:9 | The whole machine from the player's end |
| G2 | `G2-machine-top.png` | 9:16 | All three tiers from directly above |
| G3 | `G3-tier-corporate.png` | 16:9 | Tier 3 as one screen of the game |
| G4 | `G4-tier-office.png` | 16:9 | Tier 2 as one screen of the game |
| G5 | `G5-tier-street.png` | 16:9 | Tier 1 as one screen of the game |
| G6 | `G6-loader-page.png` | 16:9 | The first screen of the Step 3 page, with the ball in the loader port |
| G7 | `G7-clear-ball.png` | 16:9 | The clear ball with the cursor in it, three states |
| G8 | `G8-rail-cam.png` | 16:9 | The camera riding above the ball on the highway |
| G9 | `G9-lobby-doors.png` | 16:9 | The doors of Corporate HQ slam |
| G10 | `G10-reply-all.png` | 16:9 | Steel balls pour out of the inbox |
| G11 | `G11-youre-fired.png` | 16:9 | The firehouse scoop |
| G12 | `G12-last-save.png` | 16:9 | The bottom flippers, a save, and the Unemployment Office |

### G3, G4 and G5 · The three tiers

These are what a visitor sees while playing. Each must pass as a screenshot of a finished game. They are the most important images of the round.

- Guides: `guide-tier-corporate.png`, `guide-tier-office.png`, `guide-tier-street.png`. Follow each part for part.
- Camera: straight down at the playfield, the tier filling the frame from the lift on the left to the launch lane on the right. A long lens: things that stand up lean a very little outward toward the edges of the frame, so a sliver of their sides shows. Sharp edge to edge.
- Everything in that tier's table is present and in its place. All lamps on.
- The clear ball with the cursor in it is in play:
  - G3: at the revolving door, in front of the lobby doors.
  - G4: among the three coffee bumpers, touching one.
  - G5: on the street between the firehouse and the bank, rolling toward the scoop.
- Count before you keep a take. Every tier: two orange flippers, two slingshots, three large inserts, the launch lane on the right, the lift tube on the left. G3: one tower, one revolving door, one sealed beach box, one boardroom table, five drop targets, one ladder ramp. G4: three bumpers with coffee lid caps, one coffee machine, six cubicles, five drop targets, one inbox with a scoop, two red staplers. G5: one firehouse, one police station, one bank, five drop targets, one parking garage spiral, one chrome wire ramp, six tiny houses, one more house in the left outlane, the apron with the office front, the plunger.

### G2 · All three tiers from directly above

The layout of the whole machine in one picture.

- Guide: `guide-machine-top.png`.
- You may make this by joining the kept takes of G3, G4 and G5 one above the other, with the seams tidied and the balls painted out, in place of generating it. Say which you did.
- Portrait. The aluminum rail and the ceramic border all round. No ball. No marquee.

### G1 · The whole machine from the player's end

This is "the camera zooms out and shows you the entirety of the pinball thing".

- Guide: `guide-machine-wide.png`. Follow its framing. Pass G2 in as a reference.
- Camera: standing at the foot of the machine, where a player would, looking up its length at about forty degrees. A normal lens. All three tiers are in frame, from the apron and the bottom flippers to the marquee at the head.
- The machine fills most of the frame. Round it: the narrow ceramic border of the page, then the aluminum rail. Beyond the page: darkness.
- The three tiers read as three places by their colour of light. The marquee is lit with `THE DAILY GRIND`.
- The clear ball, with the cursor in it, sits at the plunger, lower right, small in the frame.
- Sharp from front to back.

### G6 · The loader page

This is how the website and the machine connect. It must pass as a page of the same website as `page-look.png` and `step1-fire.png`.

- Guide: `guide-loader-page.png`. Reference images: `references/approved/page-look.png` and `references/approved/step2-dial.png`.
- Camera: straight on, like a screenshot. Sharp edge to edge. No tilt, no blur. The page fills the frame.
- The header as in the approved pages: `The Worst Job Application Ever` at the left, the five-step progress bar at the right with the third button orange.
- Left: the heading `Step 3: Skills Assessment`, a subline and one short paragraph, as grey bars if the words will not come out right.
- Right: the loader port. A wide brushed aluminum ring set into the ceramic, with a dark cup inside it. In the cup sits the clear ball with the cursor sealed inside, about 96 pixels across on a 1920 wide page. A clear tube with aluminum collars leaves the port and runs straight down the right side of the page and off the bottom edge.
- The lower part of the page is plain ceramic with a fine seam: cover panels. The machine is under them and cannot be seen yet.
- The website's clean light, at full strength.

### G7 · The clear ball

A sheet that settles the ball and the cursor in it. Make this one first.

- Reference images: `references/approved/cursor-acting.png` and `references/approved/cursor-damage.png`, for the cursor.
- Three views side by side on a glossy printed playfield, close, each with an orange flipper or a post beside it for scale:
  1. At rest. The cursor lying against the bottom of the ball, leaning on the wall, sweat beaded on the inside of the acrylic.
  2. Rolling fast. The cursor tumbling inside, off the wall.
  3. The moment of a hit against a bumper. The cursor thrown flat against the inside wall, squashed.
- The seam and the aluminum plug can be seen in at least one view.
- No words on this sheet.

### G8 · The rail cam

Brandon asked for this shot by name.

- Tier 1. Camera: riding directly above the ball on the chrome wire ramp of the highway, looking down and a little ahead. The ball is in the lower middle of the frame, large. The two chrome rails run away up the frame.
- You look down through the top of the clear ball at the cursor inside it.
- Far below, out of focus: the lit street, the firehouse and the bank.
- A film camera's shallow focus: the ball and the rails near it sharp.

### G9 · The lobby doors

- Tier 3. Camera: low on the red carpet, looking up it. The tower fills the top of the frame. The revolving door is in the foreground, still spinning.
- The lobby doors have just slammed shut. The clear ball is flat against them, and inside it the cursor is flat against the wall.
- The two white flasher domes beside the doors are lit. The sign reads `Corporate HQ`.

### G10 · Reply All

- Tier 2. Camera: above the tier at about sixty degrees, wide enough to hold the inbox, the bumpers and the staplers.
- Every lamp in the tier is lit. Three chrome steel balls are pouring out of the scoop of the inbox. One has just struck the clear ball.
- Inside the clear ball the cursor is pressed against the wall away from the nearest steel ball.

### G11 · You're Fired

- Tier 1. Camera: low, tight on the firehouse.
- The garage door is open onto the scoop hole in the playfield. The clear ball is dropping into it. The red flasher dome on the roof is lit and throws red light over everything near it. The sign reads `You're Fired`.

### G12 · The last save

- Tier 1. Camera: low, just above the playfield, behind and above the bottom flippers, looking up the tier.
- The clear ball is falling toward the gap between the flippers. The right flipper is half way through its swing and will catch it.
- In frame: both orange flippers, both slingshots, the lane guides and their lamps, the six tiny houses, `Mom's Basement` at the bottom of the left outlane, and the `Unemployment Office` front at the drain.

## Method

1. Write the start time into `references/drafts/round-6/NOTES.md` before anything else.
2. Study first, as "What the successful pinball video games do" says. List what you looked at in the notes. Do not commit any of it.
3. Use the strongest photoreal image model you have that accepts reference images, and the same one for all twelve. Record which.
4. Order: G7, then G3, G4 and G5, then G2, then G1, then G6, then G8 to G12.
5. Pass the unlabeled guide for a view into the generation as a reference image, and say in the prompt that it is a layout guide of flat coloured blocks: follow where things are and how big they are, and make everything a real, photographed object. Never pass a labeled guide.
6. From G3 on, pass the kept take of G7 so the ball is the same ball. For G4 and G5, also pass the kept take of G3, so the frame, the flippers and the finish match. For G8 to G12, pass the kept take of the tier the shot is in.
7. Takes: G1, G3, G4, G5 and G7 get at most four each. Every other image gets at most three. Retries count. At the limit, keep the best take and move on.
8. Look at every take yourself against "What to check" below, before anything else. A take that fails a line marked **must** is made again inside the limit, with the prompt changed to fix that line.
9. Then one fresh agent that has not seen this brief judges the take blind. Give it the image and exactly these two questions: "Which is this most likely to be: a screenshot from a commercial pinball video game or a frame from a top-budget film, a stock image, a textbook picture, or amateur generated art? And: could a ball really travel every lane and ramp you can see? Name anything that could not work." Only the first answer to the first question, with nothing named in the second, passes. Make a failed take again inside the limit. Give the judge ten minutes and one replacement, then keep the take unjudged.
10. Show each finished image in this thread as soon as it is done, displayed inline so Brandon sees it without downloading a file. Do not wait for the set. Push after every finished image.
11. If a tool or an agent fails three times, skip it, note it and move on.
12. Finish with a contact sheet of the kept take of each image at `references/drafts/round-6/contact-sheet.jpg`, and complete `NOTES.md`.

Work for at most four hours from the start time you wrote down. When every image has its kept take or its limit, or the time is up, push what exists and end the task with: `REFERENCES READY`

## What to check in every take

- **Must.** It reads at a glance as a pinball game a person could play, and as a finished commercial one.
- **Must.** No people, no hands, no faces. No face, eyes, mouth, legs or arms on the cursor.
- **Must.** No real machine's or real game's name, artwork, characters or logos. No brand of any kind.
- **Must.** No cabinet, no legs, no arcade room, no floor, no other machines.
- **Must.** In every image that has the ball: the cursor is inside it, a solid white arrow with a black edge, clearly seen.
- **Must, G3, G4 and G5.** A pair of orange flippers at the bottom centre, the layout follows the guide, and the tier fills the frame.
- **Must, G1 and G2.** Three tiers, each with its own flippers, in the order corporate, office, street from head to foot.
- **Must, G6.** It passes as a page of the same website as `page-look.png`: straight on, sharp, the same ceramic, aluminum and orange.
- The counts for G3, G4 and G5 hold. Say which counts miss.
- Every word in the image is one of the allowed words, spelled right. List every wrong or extra word.
- The frame is brushed aluminum with a ceramic border.
- Nothing is fused, floating or impossible. Every ramp has a way on and a way off.
- It is a physical thing, photographed: not pixel art, not an illustration.

## NOTES.md

For each image: the file, the model, the full prompt of the kept take, the reference images passed in, how many takes were made, the judge's answer, and every line of "What to check" that the kept take misses, in plain words. Round 5 did this well: say exactly what is wrong in each kept image, including every misspelled word.

End the notes with the choices you made that this brief did not make for you.

## Never

- A cabinet on legs, a coin door, an arcade, a carpeted room, a wall, a window.
- A toy, a diorama, a model railway, a doll's house, an isometric game picture, pixel art, a flat illustration, a cartoon render.
- Fog, smoke, haze, lens flares that hide parts, motion blur in G1 to G7.
- A hamster ball, a snow globe, a marble with a picture in it.
- A hand cursor, a text cursor, a cursor with a face.
- People in the cubicles, at the boardroom table or anywhere else.
- Words that are not on the allowed list.
