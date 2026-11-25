# 03 · How each part is made

Each section gives the planned technique and a fallback. You choose the details. When a picture falls short, the ladder in `kit/04-LOOK.md` says which technique to move to next.

Two rules above all the others:

1. Match the approved image first. A technique is right when its still, beside the approved image, could be the same photograph. Every section below is a way to get there, not a goal of its own.
2. It is a web page first. Lay the page out, check the layout, and only then make it out of real things. A page that looks real and is badly laid out is wrong.

## The parts register

`parts/PARTS.json` lists every part with its unit, its state, the files that make it up, the hash of those files as they were when the part was recorded as a stand-in, and the commit that set the state. Phase 2 creates it with every part as `stand-in`.

A stand-in also says so itself, apart from the register: every stand-in asset, shape, material, motion or screen carries a flag in its own data or code, and the `standins` view in `kit/04-LOOK.md` draws whatever carries it in one loud colour. A part made by its method below does not carry the flag. Check G13 reads both.

| Part | One for | Unit |
| --- | --- | --- |
| `shell`, `type`, `materials`, `light-engine`, `page-turn` | The whole build | `step1` |
| `cursor-body`, `cursor-acting`, `cursor-damage`, `cursor-arms`, `cursor-effects` | The whole build | `step1` |
| `keyboard`, `turrets`, `slabs`, `paper`, `shredder` | Step 1 | `step1` |
| `rows`, `dial`, `slot`, `crank` | Step 2 | `step2` |
| `careers-page`, `perk-cards`, `ticker`, `apply-button` | The careers page | `marketing` |
| `table-layout`, `table-frame`, `marquee`, `loader`, `tier-art`, `table-hardware`, `flippers`, `bumpers`, `targets`, `ramps`, `lift`, `displays`, `clear-ball`, `table-lights`, `table-physics`, `director`, `table-cameras` | The pinball machine | `pinball` |
| `model-hq`, `model-revolving-door`, `model-beach`, `model-boardroom`, `model-ladder`, `model-notes`, `model-coffee-machine`, `model-cubicles`, `model-inbox`, `model-staplers`, `model-firehouse`, `model-police`, `model-bank`, `model-garage`, `model-houses`, `model-moms`, `model-wedges`, `model-road-signs` | Each themed thing that stands on a tier | `pinball` |
| `verify-card`, `boss-body`, `boss-transform`, `boss-weapons`, `health-bar` | Step 4 | `boss` |
| `wait`, `letter`, `stamp`, `metrics` | Step 5 | `decision` |
| `acting-<unit>` | The cursor's scripted performance for the beats of each of the six pages | That page |
| `interface`, `pointer`, `sound-engine`, `quality-levels`, `finish-logic` | The live site | `site` |
| `opening`, `loop` | Film A's opening, the card loop | `film` |

States: `stand-in`, `built`, `fallback`, `general fallback`, `last resort`. A part in any state but `built` is an open item. A part marked `stand-in` in a finished unit turns check G13 red.

### The fallback chain

Every part ends in one of three steps, tried in this order, three tries each:

1. Its named fallback, from its section below.
2. The general fallback: plain geometry with generated maps. A shape a script can always make, a box, a cylinder, an extruded outline, with colour, roughness and height pictures made by the image tool from the approved image, and type set over it from the copy.
3. The last resort: the part's region of the approved image itself, with its words painted out and set again as type, projected onto the simplest shape that holds it, a card, a box or a cylinder, and lit to sit in the scene. This can always be made, so the chain always ends.

A part that ends on step 2 or 3 is real, is judged in its round like anything else, and is logged as an open item with what was tried.

Some parts are motion, light or code and have no surface to project a picture onto: `type`, `light-engine`, `page-turn`, `cursor-acting`, `cursor-effects`, `table-layout`, `table-lights`, `table-physics`, `director`, `table-cameras`, `boss-transform`, every `acting-<unit>`, `pointer`, `sound-engine`, `quality-levels`, `finish-logic`, `interface`, `loop` and `opening`. For these the named fallback is the last step. Each one below is written so that it can always be made.

## 1. Scale and scene

- One page pixel is one world unit. The page surface is the plane z = 0, 1920 units wide and 1080 high, taller on step 3 and on the careers page, with y up the page. Heights are in the same units and come from `scale.heights`. The cursor is about 6 thick.
- The `home` camera looks straight down the page's normal, with the page filling the frame exactly. It is a real lens, not an orthographic one: `cameras.home.fovDeg`. A long lens keeps the page flat like a screenshot and still lets things that stand up lean a little toward the edges, as the approved images do. The look lock may move that key between `cameras.home.fovMinDeg` and `cameras.home.fovMaxDeg` to match the approved images, once, and logs it.
- Behind the page there is nothing to see. During a page turn the edge of the slab and a dark, unlit backing show for a moment. Nothing else is ever visible around a page.
- The pinball machine is built in balls, in its own scene, and set into the tall page of step 3 across the page's whole width, with one ball `table.ballPx` page pixels across. The cursor keeps its world scale inside the ball. `kit/02-SUBJECT.md` and section 10 describe it.
- Everything that moves is simulated in sim steps, `sim.stepHz` a second. `kit/05-ARCHITECTURE.md` has the rules.

## 2. The page surface, the shell and the layout tree

Part: `shell`.

- Every page has a layout tree in `src/pages/<page>/layout.ts`: every part's box in page pixels, its kind, its copy key, its height off the surface. Geometry, type, hit areas and measure M5 all read this one tree. Nothing is placed by hand in a scene.
- Design each page on a grid before building anything on it: columns, a baseline, even gaps. The `layout` view in `kit/04-LOOK.md` draws the tree's boxes over a still so the grid can be checked by eye.
- The surface is one slab with a real edge and thickness. Its material is matte ceramic: a warm off-white base, a fine eggshell grain as a height and roughness picture that tiles without a visible repeat, and a soft falloff of light across the page from the key light's side.
- Controls are set into or onto the slab: a field sits in a shallow pocket, a button stands in a socket with a dark gap round it, a card sits proud of the surface.
- A part's height off the surface is its kind's entry in `scale.heights`, and a shared part's size is its entry in `scale.sizes`. `kit/02-SUBJECT.md` under "One scale" has the rule. A size is set in the layout tree. It is never measured off an approved image.
- A mechanism the cursor works stands above the surface. It rises through a slot or stands in a shallow tray. It is never sunk in a well.
- The header, the progress bar, the step heading and the subline are built once and used by all five steps. The progress bar is five round buttons on a recessed rail. The current step's button is orange and stands higher.
- Named fallback: a flat plane with the grain as a normal picture only, pockets and sockets as painted contact shadows.

## 3. Type

Part: `type`.

Words are most of what a web page is. They must be exactly the copy and sharp at every distance the camera reaches.

- One type family for the whole site: a neutral sans under the SIL Open Font License, close to the one in the approved page look. Record the choice and its licence in `ASSETS.md`. The pinball table has its own lettering, section 10.
- Type is drawn from the font's outlines as a signed distance field or as geometry, lying on the surface or sunk a hair into it, so it stays sharp when the camera pushes in. It is never a picture of text.
- Printed type sits flat with the faintest sheen difference from the ceramic. Engraved type, on aluminum and on the stamp, has a real cut with a lit edge and a shadowed edge.
- Every run of type registers itself with its copy key, its box and its size. Check G11 and measure M4 read that register.
- Type that changes, a field filling in, a counter, the score display, is set the same way from the same register.
- Never take a word from a generated image. Never ship a generated image with words in it.
- Named fallback: draw each page's type into one picture with a 2D canvas, `assetSets.<set>.pageMapWidth` wide, from the same register, and lay it on the surface.

## 4. Materials

Part: `materials`. `kit/02-SUBJECT.md` has the table of what is made of what.

- Frosted glass: a slab with real thickness. What lies under it shows through blurred and a little lifted. The top face has a soft sheen, the bevel catches a bright line on the light's side and the rim is a thin band of aluminum. In computed frames, blur the page beneath by sampling it many times across the samples. Named fallback: sample a blurred copy of the page beneath, made once.
- Brushed aluminum: fine straight or circular brushing as an anisotropic highlight, a soft studio reflection, a crisp chamfer.
- Glossy orange plastic: a deep saturated body under a clear gloss, with a soft box of light reflected along the upper left edge. It has real height and a rounded edge.
- Smoked grey for secondary buttons: the same build as the orange, darker and less saturated.
- Paper: thin, with fibre, slightly translucent at a curl, casting a close soft shadow. Printed in charcoal.
- Reflections come from a small studio environment you make yourself: one large soft light at the upper left and dim surroundings. It is never visible directly.
- Named fallback for the whole part: standard physically based materials with one tiling detail picture each and the studio environment.

## 5. Light and shadow

Part: `light-engine`. The look is in `kit/04-LOOK.md` section 3.

- One soft key light from the upper left. It is an area, not a point: shadows are tight at the contact and soften with height.
- Computed frames: every sample places the key at a different point of its area and draws its shadows from there. The average is a true soft shadow. A second, weak set of samples from all over a dome above the page gives the dark in pockets, gaps and under edges.
- Things that give off light, a bolt, a hot tip, a dart, a flasher, light what is near them and cast their own shadows while they exist.
- The live site: the still parts of a page gather the same soft shadows over the first frames while nothing moves, into a shadow picture of the page. Moving things use a filtered shadow map on top. `live.quality` says what each level does.
- Named fallback: one filtered shadow map from the key and a baked contact shadow under every part.

## 6. The cursor

`kit/02-SUBJECT.md` under "The cursor" is the specification. The approved sheets are `cursor-acting`, `cursor-damage` and `cursor-arms`.

### The body

Part: `cursor-body`.

- The classic arrow outline, extruded with a rounded bevel. A white enamel face under a hard gloss, a black edge band with its own softer gloss, a flat black underside. Its world size never changes.
- Named fallback: the same outline extruded with a plain chamfer and two materials.

### Acting

Part: `cursor-acting`.

- The body deforms through a small rig or lattice: squash and stretch along its length, a bend, a lean, a twist, a sag, a puff. Volume is roughly kept: when it stretches it thins.
- Three layers, mixed:
  1. Where it goes. A walk, a strut, a tiptoe, a drag, a jump, each a cycle of hops and leans laid along the path the pointer asks for. It walks on its tip and its heel corner. No legs.
  2. How it feels. The acting state sets posture, tremble, colour and effects.
  3. What just happened. Short one-off reactions: anticipation before a jump, a flinch before a hit, a double take, a recoil, a dust-off.
- Secondary motion comes from springs driven by its own acceleration, so starts, stops and hits overshoot and settle.
- In live mode layer 1 follows the visitor's mouse, section 15. Layers 2 and 3 are set by what the page is doing, so the visitor's cursor acts by itself.
- Named fallback: squash and stretch as plain scaling along its length, a lean, and the colour changes.

### The performance on each page

Part: `acting-<unit>`, one for each of the six pages.

- This is the cursor's scripted performance for that page's beats in film mode: `src/pages/<page>/script.ts`. For each beat it gives the pointer's path, the clicks, the acting state at each moment and the one-off reactions, so that the beat plays as `kit/01-FILM.md` describes it and its event happens inside it.
- Write it like a piece of character animation: a clear pose for each idea, a wind-up before, a hold after, and a reaction to everything.
- It is a stand-in while any of its beats only moves the pointer from event to event with no acting.
- Named fallback: for each beat, the path and the clicks that reach the beat's event on time, the acting state `kit/02-SUBJECT.md` names for that moment held for the whole beat, and the acting system's own squash, stretch and lean. This can always be made.

### Damage

Part: `cursor-damage`.

- Burn hole: a round hole through the body where the bolt struck. You see through it to the page. Its wall is charred, its rim glows and cools, and smoke rises from it. It closes from the rim inward.
- Flattened: the body pressed nearly to nothing and wider, with a web of fine cracks in the enamel. It peels up from one corner and refills.
- Scorched: a blackened tip that fades back to white.
- Shredded: the arrow cut along its length into thin strips, each a loose rigid piece. They fall as a pile.
- Reassembled: the strips stand, find their places a little out of line, then snap true. A faint seam fades.
- Every kind heals within `cursor.damageHealSeconds`, and the heal is always seen.
- Named fallback: holes and cracks as pictures laid on the body, and strips as flat cards.

### The arms

Part: `cursor-arms`.

- Two thin matte black rubber arms with small plain mitt hands, grown from the body's sides. Each is a tube laid along a bending chain that reaches for a target. Under load they stretch thinner.
- They sprout in a few frames when it grabs the paper and are pulled off with it into the shredder. Check G12 fails if an arm exists outside `cursor.armsOnlyInBeat`.
- Named fallback: chains of short capsules.

### Sweat, steam, smoke and glow

Part: `cursor-effects`.

- Sweat: clear drops with a bright highlight and a tiny dark edge. They form, run down the body, fly off on a shake and vanish on the page.
- Steam and smoke: soft, drifting, thinning puffs with depth. Steam is white and quick. Smoke is grey and slow.
- The red tip: the enamel glows from inside at the tip, with a little light on the page round it.
- Named fallback: sprites for the drops and puffs and a colour ramp for the tip.

## 7. Step 1

### The keyboard

Part: `keyboard`. Approved image: key `step1-fire`.

- A brushed aluminum deck, docked along the bottom across the content width. It rises through a slot in the page and stops with its top `scale.heights.keyboardDeck` above the surface, so the whole keyboard stands out of the page and throws a shadow on it. The approved image sinks it in a well. The deck wins.
- The layout is a data file with every key's row, width and legend. Five rows, as `kit/02-SUBJECT.md` lists them. All five are on the deck, a key's top is `scale.heights.keycap` above the page, and no key's short side is under `scale.sizes.keycapMin`.
- Each key is a real cap with a dished top, a legend set as type and its own travel and spring. The cursor lands on a cap and the cap goes down under it.
- The shuffle: caps lift, cross over each other in arcs and drop into new seats, legends and all. Which cap goes where comes from the seeded random stream.
- Named fallback: caps as rounded boxes with printed legends, and a shuffle that slides caps along the deck.

### The turrets and their bolts

Part: `turrets`.

- Two small milled aluminum turrets rise from round hatches in the top of the deck, one at each end, to `scale.heights.turret`. Each has a body that turns and a short barrel.
- A turret follows the cursor with a short delay and shows a wind-up before each shot, so its aim can be read and a dodge is fair. `kit/02-SUBJECT.md` has the rules for a hit.
- A bolt is a thing that travels: a short glowing orange streak with a bright head. It lights the caps it passes, leaves a scorch mark where it lands that fades, and burns a hole in the cursor if it hits.
- Named fallback: turrets as turned cylinders, bolts as bright capsules with a glow.

### The slabs

Part: `slabs`. Also used by the boss.

- A heavy red block with its message set in type on its face. It falls, lands with weight, the page gives the smallest shake, and the things near it jump. It lies for a moment and is drawn back up.
- Named fallback: a red box with printed type that drops and stops.

### The paper and the shredder

Parts: `paper`, `shredder`. Approved image: key `step1-tug`.

- The resume is a sheet with a printed layout: a title from `copy:step1.resume.paperTitle` and grey bars for lines of text. No readable body text.
- The sheet bends. Model it as a grid of points with stretch and bend stiffness, held where the hands grip it and where the rollers bite. Under tension it pulls flat between the grips and creases across. It never tears until it enters the cutters.
- The slot opens as two panels of the page sliding apart. Inside, two steel rollers with cutting discs turn toward each other.
- What goes in comes out below as strips.
- The tug of war is driven by one number, how far the paper has gone in. In film mode a curve sets it. In live mode the visitor's pull moves it back and the shredder moves it forward, and the page takes over at the end.
- Named fallback for the paper: a strip of rigid panels hinged to each other. For the shredder: a dark slot with a turning textured roller.

## 8. Step 2

Approved images: keys `step2-rest`, `step2-dial`, `step2-crank` and the sheet `machines`.

### The rows

Part: `rows`.

- Three rows of label, helper line and glass input with a chevron. Opening a row moves the rows below down on springs and opens a shallow tray under the input, its floor at `scale.heights.machineTray`. The machine rises out of the tray on a lift until its working parts stand at least `scale.heights.machineMinTop` above the page.
- Named fallback: a panel that grows under the row with the machine already in it.

### The dial

Part: `dial`.

- A brushed aluminum finger wheel with ten holes over a numbered plate reading 1 to 9 and then 0, a finger stop, and an orange centre. Dragging a hole round to the stop winds a spring. Letting go sends it back at a steady governed speed.
- The gag: on the return the cursor is caught in the hole, carried round and thrown.
- Named fallback: a flat disc with painted holes that turns.

### The slot machine

Part: `slot`.

- A small cabinet with three reels behind a glass window, a lever with an orange knob on its right and a payout tray. The reels are drums with printed strips: months, days, years.
- Pull the lever and it springs back. The reels spin with blur and stop left to right, each with a small overshoot.
- Coins are real discs that burst from the tray, bounce on the page and roll.
- Named fallback: three scrolling strips behind a window and coins as flat discs on arcs.

### The crank

Part: `crank`.

- A geared wheel with a handle and an orange grip, beside a ten-segment level meter. Each turn lights a segment.
- When it runs away the handle spins by itself, faster and faster, and catches the cursor.
- Named fallback: a disc with a handle and a bar that fills.

## 9. The careers page and the decision page

### The careers page

Parts: `careers-page`, `perk-cards`, `ticker`, `apply-button`. Approved image: key `marketing-top`.

- One tall slab. The first screen matches the approved image. When the page turns, what turns is the part of the slab in view. The sections below it follow the same grid, materials and type, in the order `kit/02-SUBJECT.md` gives. In live mode the slab slides under the camera when the visitor scrolls, and the light stays where it is.
- A perk card is a slab that turns over on its long axis, or whose face slides aside, to show the fine print set into what is beneath.
- The ticker is a narrow window in the page with a printed tape running behind it.
- The Apply button is the largest control in the whole site: orange, tall, with a deep socket and real travel.
- Awards are turned aluminum medallions with engraved type. Testimonials are badges with a blacked out photo window and redaction bars.
- Named fallback: every section as flat cards on the slab with printed type.

### The decision page

Parts: `wait`, `letter`, `stamp`, `metrics`. Approved image: key `decision`.

- The wait: a panel with a mechanical counter that reads months and spins down to nothing.
- The letter: a paper sheet that drops, slides a little and settles, with its text set as type.
- The stamp: a wooden grip on a block with a rubber face. It comes down hard, the page jumps, it lifts, and it leaves the red word on the paper and a flat cursor. It is seen straight on like everything else.
- The metrics: a glass panel with three readouts that count up to their values.
- Named fallback: flat panels with printed type and a red mark that appears.

## 10. The pinball machine

The main attraction. `kit/02-SUBJECT.md` under "The pinball machine" is the specification. The approved images are the ten keys of unit `pinball` and the sheets `clear-ball` and `table-map`. Build it to hold up with the camera a hand's width from a bumper, and to pass, a tier at a time, as a screenshot of a pinball video game that has shipped.

### Study first

Before any part is built, study inside `assets.maxStudySources`:

- Screenshots and video of shipped pinball video games: how full a screen is, how a tier is framed round its flippers, how a table is lit by its own lamps, how the ball is found at a glance. `references/drafts/round-6/NOTES.md` under "Study" lists what the reference round looked at and the five things it took. Start there.
- Photographs of real machines: how a post, a rubber ring, a wire guide, a drop target, a pop bumper and a wire ramp are built and fixed down.

Take the format and the finish. Take no layout, no artwork, no character and no name from any of them.

### The layout

Part: `table-layout`.

- One data file for the machine, in balls, with every tier's parts: each collider, lane, post, lamp, insert, model, door, chute, ramp and display, with its place, its size and its height. It is to the machine what a layout tree is to a page. Geometry, physics, lights and measures M8 and M10 all read this one file.
- Take each part's place from sheet `table-map`, the three tier keys and the guides in `references/guides/round-6/`. Where they disagree, the tier key wins on what is there, and "Ball paths" in `kit/02-SUBJECT.md` wins on how a ball gets on and off it. Take a part's size from `table` where a key gives it, and otherwise choose it in balls and log it in the file. Never scale a part to match an image.
- The `layout` view in `kit/04-LOOK.md` draws it over a tier still.
- Named fallback: none is needed. It is data.

### The frame, the marquee and the loader

Parts: `table-frame`, `marquee`, `loader`.

- The frame: a brushed aluminum rail round the whole machine, set into the page's ceramic with a narrow border of ceramic showing outside it, and a cross rail with the chute in it between one tier and the next. Each tier lies `table.tierStepBalls` lower than the one above.
- The apron: two ceramic slabs at the foot of Tier 1 with the drain between them, the drain's plate and the apron card, both set as type.
- The marquee: a lit panel with the title from `copy:step3.table.title` over a city skyline at dusk, and the main display under it. The skyline is generated art with no lettering in it.
- The loader: the port on the first screen, the clear feed tube with its aluminum collars down the right side of the page and on inside the right rail to the plunger, the plunger with its spring and orange knob, the tube from the drain, and the outlet port on the last screen.
- Named fallback: extruded rails, flat slabs, a flat lit panel, a plain tube.

### The printed layer

Part: `tier-art`.

- Each tier's floor is flat, top down artwork under a glossy clear coat: art deco lines on midnight blue, carpet tile with a walkway, a street map at dusk. Its lines follow the paths a ball takes.
- Make each with the image tool from that tier's approved key: the same floor with every standing part removed, flat, lit evenly, with no lettering. Ask in sections if one picture cannot hold the detail, and join them. Bring each to `assetSets.<set>.tableArtWidth`.
- Inserts are cut into the art: clear coloured windows with a moulded picture inside, lit from below. The pictures are in `table.inserts`. They carry no words.
- No lettering is printed on a floor. Every word in the machine is a sign, a plate, a card or a display, set as type from `copy:step3.table`. The machine has its own display face for signs, a serif with a little weight, chosen like the site's face and recorded the same way.
- Named fallback: draw each floor with code, in the tier's colours, with lines along the ball paths.

### What stands on a tier

Parts: `table-hardware`, `flippers`, `bumpers`, `targets`, `ramps`, `lift`, and one `model-` part for each themed thing.

- Hardware: posts with rubber rings, wire guides, lane guides, screws with real heads, lamp sockets, the top lane with its arrow lamps, the inlanes and outlanes. There is a lot of it, and that is the point. Build each kind once and place many.
- Flippers: moulded orange bats with a black rubber band, on shafts, that snap up and fall back. Six in all. Slingshots kick.
- Bumpers: three pop bumpers on Tier 2 whose bodies are paper cups and whose caps are coffee lids, each with a ring that slams down and a lamp inside.
- Targets: three banks of `table.dropTargetsPerBank` drop targets that fall and reset, three standup targets as sticky notes, one standup at the coffee machine, a spinner by the police station, and the revolving door, which is a rotating kicker.
- Ramps: the highway and the ladder, both wire tracks built as rule 4 of "Ball paths" says, on real supports, and the garage spiral in clear plastic with `table.spiralTurns` turns.
- The lift: one clear tube inside the left rail with aluminum collars, its two orange doors and its two orange elbows, open where rule 3 says.
- Models: each themed thing is a small detailed model in the style of the approved images, with lit windows where it has windows and a sign set as type. The tower's lobby doors open and slam. The firehouse door is a scoop. The inbox tips. The beach sits sealed in its box with its own warm light. The hatch beside Mom's house opens and shuts.
- A sign stands on the front edge of its roof, tilted back, so that it reads from straight above and from the front.
- A model may start from a generated picture of its faces laid on simple geometry, then gain depth: recessed windows, ledges, a roof with things on it. An image-to-3D tool may be tried once per model if Phase 0 found one. Three failures in all end that idea.
- Count the standing parts of each tier. Measure M8 holds every tier to `table.minStandingPartsPerTier` and to `table.maxBareFraction`.
- Named fallback for each: the general fallback, plain shapes with generated maps.

### The displays

Part: `displays`.

- Four amber dot displays: the main one under the marquee and one in the lower right shoulder of each tier, `table.displayWidthBalls` by `table.displayHeightBalls`. Each is a grid of real dots behind smoked glass.
- All four show the same thing, as `kit/02-SUBJECT.md` says: the score, a mode's two lines scrolling, and the mouse picture at the start of the live scene.
- A character on a tier's display is at least `layout.minTextPx` tall when the tier fills the frame.
- Named fallback: a lit panel with the same text set in a dot matrix face.

### The clear ball

Part: `clear-ball`. Approved image: sheet `clear-ball`.

- A sphere of clear acrylic with thickness, a seam and a plug. It bends what is behind it, shows sharp highlights from the lamps near it, and throws a light shadow with a bright spot in it.
- In the live picture, bend the already drawn scene behind the ball through it. In computed frames the bending may be traced properly.
- The cursor inside is the real cursor: the same mesh, the same material, the same acting rig, at its own size, which is `table.cursorInBallFraction` of the ball's width. It is a small body of its own, loose inside the ball: it lies at the bottom at rest, tumbles a beat behind a rolling ball and is thrown flat against the wall on a hit.
- Sweat beads on the inside of the ball. A hit that would burn or dent the cursor on a page marks it here too, and it heals as `cursor.damageHealSeconds` says.
- The close and the split: two half shells that meet at the seam with a click, and part again at the outlet port.
- Named fallback: a clear shell with a bright rim and a faint bend of what is behind it, and the cursor inside it on a spring.

### The lights

Part: `table-lights`.

- The machine is lit by many small lamps: general lighting round the edges of each tier, a lamp under every insert, the two beacons, the bumper lamps, lit windows, the marquee, the displays. Group them into light groups, tier by tier.
- For each group, work out once what its tier looks like lit by that group alone, and keep it as light pictures for the tier's surfaces. A frame is then those pictures mixed by how bright each group is at that moment. This is what lets hundreds of lamps look right and still run on a visitor's machine.
- Each tier has its own colour of light: cold white and gold, flat fluorescent white, warm dusk with red and blue.
- The website's light is one more group. It is at full level while the camera is on the page and at `table.pageDuskLevel` while the camera is in the machine.
- Computed frames may add true shadows and reflections for the lamps nearest the camera and for anything that moves.
- The light show is a score of group levels over time, tied to events: the website's light going down, a wave down the tiers on the reveal, a flash on each hit, the whole office tier strobing in "Reply All", the red beacon in the firehouse beat, a slow dim when the ball drains, the website's light coming back up.
- Named fallback: glowing inserts and domes, a few real lamps with no shadows, and the same score.

### The physics

Part: `table-physics`.

- Each tier is simulated in two dimensions on its own plane, with gravity down the page as if the tier sloped by `table.slopeDeg`. Posts, rubbers, guides, slings, bumpers, targets, spinners and flippers are colliders.
- Everything that carries a ball from one place to another is a rail: the feed tube, the launch lane, a chute, the lift, a wire ramp, the spiral. A body that enters a rail leaves the plane it was on, rides the rail at a speed a ball would have, and enters a plane again at the rail's end. Rules 1 to 4 of "Ball paths" say where every rail starts and ends.
- A hold takes a body, keeps it for a set time and lets it go with a set push.
- The clear ball is one round body. The steel balls are round bodies of the same size.
- Use a physics library that gives the same result on every machine, in fixed sim steps. Phase 0 picks it and pins it. A two dimensional build of Rapier that promises this existed when the kit was written. Feed it only numbers that are the same everywhere: no trigonometry at run time in anything that sets a position or a force.
- Build a test with the physics: `npm run paths` runs the physics without the director, with every gate open and Mom's hatch working, and drops balls from many seeded places on every tier, with and without flips. A ball that reaches the drain has finished. The test fails if a ball comes to rest outside a hold, sticks in an opening, or leaves the machine anywhere but the drain. It also reads the layout and fails on an opening under `table.minClearanceBalls`, a rail with no entry or no exit, or a way into the Retirement box. Rules 1 to 8 and 10 of "Ball paths" are this test.
- Named fallback: your own small solver for circles against line segments, arcs and rails, in fixed steps.

### The director

Part: `director`.

The scene hits every story beat in `kit/01-FILM.md` in order, in both modes, and still looks like a ball loose in a machine.

- Each beat has an entry: a place and a state that starts it. The lobby beat starts when the ball rolls onto the red carpet. The coffee beat starts when the chute drops it on the bumpers. The "Reply All" beat starts when the inbox takes it. The firehouse beat starts when it drops in the garage. The highway beat starts when it rolls onto the flap.
- Between beats the physics runs free. The director nudges with things a machine really has: a magnet under the floor, a kicker, a gate, a ball save. A nudge is small and reads as the machine's own behaviour.
- The story only goes down. Each tier's exit has a gate, as rule 2 of "Ball paths" says: the chutes of Tiers 3 and 2 and the drain of Tier 1. Until that tier's beats are done its gate is shut, and a ball that reaches it is held and kicked back up between the flippers onto the same tier. Once they are done the gate opens and stays open. Mom's hatch is one more save of the same kind.
- The lift is free play. In live mode a visitor who shoots a lift door rides up a tier, plays there, and falls again through that tier's open gate. The film's take does not use the lift.
- The steel balls of "Reply All" stay on Tier 2. Its gate is always shut to them, and when the clear ball leaves the tier the inbox scoop takes them back one by one.
- Each beat has a deadline, and a deadline comes before free play. If the ball has not reached the next entry by then, the director brings it to that beat's tier and delivers it with the nearest such device, whatever tier it is on.
- The last deadline is the end of the scene. When it is due the Tier 1 gate is open, and the director sends the ball down the middle between the flippers, where a flip cannot reach it.
- Film mode uses a take. `npm run take` searches flipper timings and nudges, from the seed, for a run in which every pinball beat's event falls inside its beat in `film.beats`, give or take `film.beatToleranceSeconds`. The inputs of the take it keeps are saved as `cut/TABLE-TAKE.json` and replayed exactly.
- Live mode has no take. The visitor's flips are real, the same director runs, and the scene ends within a few seconds of `live.pinball.sceneSeconds` for everyone.
- Named fallback: in film mode, author the paths of the ball and the steel balls between beats as curves with speeds a ball would have. In live mode, let the director hold the ball on such paths between the moments the flippers are needed.

### The cameras

Part: `table-cameras`.

- `kit/01-FILM.md` lists a camera for every beat. Each is a real lens with a shallow focus up close, a little shake on impacts, and a move with weight.
- The three tier cameras, `tier-3`, `tier-2` and `tier-1`, are the `home` camera moved down the page to that tier. Each uses `cameras.home.fovDeg`, whatever the look lock sets it to, and stands at home's distance from that tier's floor, not from the page surface. So one pixel of the floor is one screen pixel, the tier fills the frame with the page's narrow ceramic border at its two side edges, and things that stand up lean only a very little toward the edges. They are sharp edge to edge.
- `rail` is fixed above the ball while it rides a wire ramp. It looks down and a little ahead, and the cursor is seen inside the ball the whole way.
- A camera that follows the ball follows a smoothed copy of its path, never the raw one.
- The approved close views fix the lens and the framing for the thing each shows.
- In live mode the view is the tier camera of the tier the ball is on. It travels to the next tier in `live.pinball.tierTravelSeconds`. A cut to a close view happens only while the ball is held or on a ramp, for at most `live.pinball.closeShotMaxSeconds`, and the tier view is back before the flippers are needed.
- Named fallback: fixed cameras cut on the beats.

### The way in, the way out and the controls

These belong to `loader`, `clear-ball`, `table-cameras` and `director`.

- The page of step 3 does not scroll under the visitor's hand. The scene moves the view: down the page after the ball on the way in, and to the last screen on the way out.
- The way in: near the port the cursor is pulled off the visitor's mouse and into the cup, the shells close, the ball drops, and the view follows the tube down the page while the website's light goes down.
- The way out: the ball rolls out of the outlet port, the shells part, the cursor is back on the visitor's mouse, and the result card rises.
- The flippers: the left mouse button and the left Shift key work every left flipper, the right mouse button and the right Shift key every right one. A flipper moves on the frame after the press. While the scene runs, the browser's own menu on the right button is held back.
- The plunger fires by itself.

## 11. The boss

Approved images: the sheet `boss-stages` and keys `boss-fight` and `boss-down`. `kit/02-SUBJECT.md` under "The boss" is the specification.

- `verify-card`: a glass card with the checkbox, a real box with a tick that draws itself.
- `boss-body`: rigid parts on a small rig. The orange capsule with its word, aluminum armour plates, four jointed legs that plant and step, two cannons that are the numbered buttons of the progress bar, and a shield that is an input field. Legs reach for footholds on the page and the body bobs with its weight.
- `boss-transform`: an authored sequence, as the sheet shows it. The button shudders, the socket cracks, it tears loose, the plates and legs fold out, the cannons fly in from the header and dock, the shield slides in from a field. The defeat runs something like it backwards and ends with a dented, scorched button lying crooked.
- `boss-weapons`: slabs from section 7 fired flat across the page, pop-up dialogs that stand up as shields with their text from `copy:step4.popups`, and the cursor's darts: tiny glowing white arrows, each a thing that flies and sparks where it hits.
- `health-bar`: a recessed aluminum track with an orange fill and the label from `copy:step4.bossHealthLabel`, in the place the subline held.
- The fight is a small game on the page's plane. Health, phases and the rule that it tires by itself come from `live.boss`. In film mode the same game is played by the script.
- Named fallbacks: for the body, the capsule on four straight legs with two cylinders and a plate. For the transform, the parts scaling out from the button in order. For the weapons, red boxes, flat cards and bright capsules.

## 12. Sound

You have no ears. Every choice about sound is made from numbers and from a listener's answers, and then by Brandon.

### The tools

- Phase 0 finds what can make sound here: the ElevenLabs connector, for speech in a saved voice and for sound effects. Record each endpoint, the model it uses by default, the lengths it accepts, what a call costs and how long it takes, with one test call each.
- Use the default model of each endpoint. A newer one that is marked as a preview or beta is not used.
- Find the voice named in `audio.narratorVoice` by listing the account's voices. `AGENTS.md` under "Sound" says what to do if it is not there.
- Find what makes that voice pause. Speak one test line three ways, with commas, with ellipses and with whatever break mark the speech endpoint documents, and measure the gaps. Record the winner under "Tool record". From then on every `/` in `content/narration.json` is replaced with it before a line is sent, and is never spoken.
- Find the settings that give a slow, steady, smug read: the slowest speed setting that still sounds natural, and a stable delivery. Record them. Every line uses the same settings.

### The narrator

- Lines come from `content/narration.json`: `film` holds the lines of each beat with the point in the beat where each starts, and `liveOnly` holds the lines the live site adds.
- A line gets at most `audio.narratorMaxTakesPerLine` takes. Spend them one at a time and judge each before asking for the next.
- A take is kept when all of these hold:
  - The listener writes down what was said and it is the line, word for word, with nothing added.
  - It is no faster than `audio.narratorMaxWordsPerSecond`, measured over the whole take.
  - A gap can be measured at each `/`.
  - The listener hears no whisper, no laugh, no warmth and no excitement, and answers that the speaker sounds unimpressed and a little smug.
  - In the film it ends, with `audio.lineGapSeconds` to spare, before the next line starts.
- If the best take of a film line is too long for its place, move the beat's times inside the limits `kit/01-FILM.md` gives before you ask for another take. The voice sets the pace. Do not speed a take up.
- A line with no kept take is an open item and that moment has no narrator.

### The effects

`audio.sfx` lists every cue with its length. This table says what each one is and what plays it.

| Cue | What is heard | Played by |
| --- | --- | --- |
| `room-tone` | A quiet room. Air, nothing else. Loops | Always, under everything |
| `step` | One soft tap of enamel on ceramic | Each step of the cursor's walk |
| `card-flip` | A stiff card turning over on a hard surface | A perk card |
| `button-press` | A large plastic button going down and bottoming out | The Apply button, Continue, Submit, Accept Rejection |
| `page-turn` | A heavy slab turning over with a low rush of air and a knock as it seats | Every page turn |
| `keyboard-rise` | A metal deck sliding up out of a slot and stopping | The keyboard |
| `key-press` | One mechanical key cap, down and up | Each key |
| `turret-rise` | A small hatch opening and a servo lifting | Each turret |
| `bolt-fire` | A short, tight energy shot. Small, not a cannon | Each bolt |
| `bolt-hit` | A hot crack on plastic or ceramic | A bolt landing |
| `sizzle` | A small burn fizzing out | A burn hole |
| `keys-shuffle` | Many key caps clattering as they change places | The shuffle |
| `slab-drop` | A very heavy block landing flat on ceramic | Each slab |
| `paper-slide` | A sheet of paper sliding over a hard surface | The resume, the letter |
| `shredder` | An office shredder running under load. Loops | The tug of war |
| `paper-strain` | Paper pulled tight, creaking | The tug of war |
| `strips-zip` | Many paper strips zipping together quickly | The reassembly |
| `row-open` | A drawer mechanism opening with a soft thunk | A row of step 2 |
| `dial-wind` | A rotary phone dial pulled round against its spring | The dial, wound |
| `dial-return` | A rotary phone dial running back, purring | The dial, returning |
| `lever-pull` | A slot machine lever pulled and released | The lever |
| `reels-spin` | Three mechanical reels spinning and stopping one after another | The reels |
| `coins` | Coins bursting out and scattering on a hard surface | The payout |
| `crank-turn` | One turn of a geared hand crank, ratcheting | Each turn |
| `crank-runaway` | The same crank spinning up out of control | The runaway |
| `flatten` | A wet, flat splat, short and comic | The cursor flattened |
| `peel-up` | Something thin peeling off a smooth surface and popping back to shape | The cursor recovering |
| `ball-seal` | A short suck of air, then a hard plastic shell snapping shut with a click | The clear ball closing round the cursor |
| `tube-run` | A hard plastic ball rolling fast down a plastic tube | The feed tube |
| `lights-down` | A big room's lights dimming: a low falling hum and a relay | The website's light going down |
| `power-on` | A pinball machine powering up: relays, a hum, a start-up chime of mechanical bells | The machine lighting, tier by tier |
| `plunger` | A spring plunger pulled back and released into a hard plastic ball | The launch |
| `bumper` | One pop bumper firing: a solenoid thwack and a bell | Each bumper hit |
| `scoop-kick` | A ball dropping in a hole and being kicked out by a solenoid | The firehouse |
| `flasher` | A relay click and the snap of a bright lamp | Each beacon turning on, and each lamp flash on a hit |
| `ramp-roll` | A hard plastic ball rolling fast along a wire ramp | The highway and the ladder |
| `ball-drop` | A steel ball dropping onto wood | Each steel ball out of the inbox |
| `flipper` | One flipper firing | Each flip |
| `doors-slam` | Two heavy glass doors slamming shut | Corporate HQ |
| `drain` | A ball rolling down the drain and into the trough, with a falling tone of bells | The drain |
| `tier-fall` | A ball dropping down a short metal chute and landing on wood | The fall from one tier to the next |
| `lift` | A ball sucked up a tube by air: a rising whoosh and a soft pop at the top | The lift |
| `spiral` | A hard plastic ball rolling round and down a plastic spiral, slowing | The parking garage |
| `spinner` | A pinball spinner hit hard and spinning down, ticking | The police spinner, and the revolving door as it turns |
| `drop-target` | One pinball drop target knocked down: a flat plastic clack | Each drop target |
| `sling` | A pinball slingshot firing: a short rubber snap | Each slingshot |
| `ball-open` | A hard plastic shell cracking open and its two halves rattling on a hard floor | The clear ball splitting at the outlet port |
| `checkbox` | A small crisp tick | The checkbox |
| `button-crack` | Plastic and ceramic cracking as something tears loose | The Submit button breaking out |
| `unfold` | Metal plates and joints unfolding and locking, servos | The boss forming |
| `dart-fire` | A tiny bright pew, almost a click | Each dart |
| `dart-hit` | A small spark on metal | A dart landing |
| `slab-fire` | A heavy block launched hard | The boss firing |
| `popup` | A flat panel snapping upright | Each pop-up |
| `power-down` | A machine losing power, winding down, a last clank | The boss beaten |
| `hold-music` | Bland, tinny hold music through a phone speaker. Cut off mid-note by the mix | The wait |
| `letter-drop` | A sheet of paper landing on a desk | The letter |
| `stamp` | A big rubber stamp slammed down on paper on a hard desk | The stamp |
| `ui-tick`, `key-tap`, `ui-send` | A small soft tick, a soft key tap, a short send tone | The prompt opening of film A only |

- Phase 0 records the shortest and the longest sound the effect endpoint will make. A cue shorter than its shortest is asked for at that shortest length and trimmed to the cue's own length by the chain below.
- A cue gets at most `audio.maxTakesPerCue` takes. The best is kept. A cue with no acceptable take after that is an open item, and its moment is silent.
- A cue with `variants` is heard many times in a row, so it needs that many different versions. Ask for takes that hold several separate hits, let the harness cut them apart, and keep the best `variants` of them. The site and the mix step through the kept ones in a fixed order, with a short fixed list of small pitch offsets on top.
- One line ends every effect prompt, word for word, so the effects belong together: close and dry, recorded in a quiet room, real materials, no music, no melody, no voice. The hold music cue alone leaves out the words about music.
- One chain for every effect, run by the harness: trim the silence, a short fade in, a fade out, a low cut, then the level of its class. Room tone is quietest, then the walking and the small ticks, then the mechanisms, then the hits and slams.
- Loops are made to loop: a crossfade from the end into the start, checked by number at the seam.

### How an effect is chosen

Two things stand in for ears:

- Numbers, from `ffmpeg`: where the sound starts and ends, its peak, its loudness, how its energy is spread from low to high, how quiet its tail is, and for a cue with variants how many separate hits it holds.
- A listener: the audio evaluation tool, or a fresh agent that can hear, given the file and the same fixed questions for every take. What is heard. What it is made of. How many separate events. Whether there is a voice, a word, music or a melody. Whether it fits the one line that describes the cue.

An effect is kept when the numbers fit its length and the listener's answers fit its line. For a family check, the listener hears a new take after two kept ones and says whether the three belong in the same room.

### The mix

- Every sound hangs on an event. The stage reports events by name with the frame they happen on, and a table in `src/audio/` maps each event to its cue. `npm run mix` reads the events of the film from `filmState`, lays each cue on its frame, lays each kept line where its beat puts it, lays the room tone under everything, and lowers the effects by `audio.duckDb` under a line.
- It writes one stereo file at `audio.sampleRate`, levelled to `audio.filmLoudnessLufs` with peaks under `audio.truePeakDb`. Run twice, it gives the same bytes.
- The hold music runs for `audio.holdMusicSeconds` and is cut dead on the frame the counter reaches zero.

### The live site

- The sound engine uses the browser's audio graph, so levels, loops and ducking are exact. Its named fallback is plain audio elements, one for each sound.
- Nothing plays before the visitor's first click. The sound control mutes everything.
- If the site's sound files cannot be loaded, the site runs silent, hides the sound control and reports no error.
- The same events play the same cues. The narrator speaks a beat's `film` lines when that beat's gag starts, and a `liveOnly` line when its trigger happens. The triggers that need a number have one in `live`: `idle` after `live.idleSeconds` with no movement and no click, `slowTyping` after `live.slowTypingSeconds` between two letters, and `boss.slow` once the fight has run `live.bossSlowSeconds` with the boss above half its health. A line never interrupts another, and two lines are at least `audio.liveNarratorMinGapSeconds` apart. A line that would be late is dropped.
- The crank of step 2 sets the site's volume for real.

### Files

| What | Where |
| --- | --- |
| Every take, as the tool returned it | `out/work/audio/takes/`, never committed |
| The kept take of each cue, variant and line, and beside it its prompt or text, settings, measurements and the listener's answers | `audio/kept/<id>.<ext>` and `audio/kept/<id>.json` |
| The log of every sound: takes made, which was kept and why, what it cost | `audio/RECIPE.md` |
| The review mix | `audio/mix/review.wav` |
| After the review: the final mixes for film B and film A | `audio/final/` |
| What the site ships: one packed file of the short sounds with its index, the loops, the narrator's lines | `public/audio/` |

The text files are always committed. Whether the sound files are committed follows "Sound" in `AGENTS.md`.

## 13. The prompt opening

Part: `opening`.

- In Phase 0, list the skills of this workspace and find the one that draws the product's prompt screen, types a prompt and shows a build screen. Record its name and what it produces under "Tool record".
- Use the skill to make the opening from `intro` in the config, as `kit/01-FILM.md` describes it.
- The opening has to be rendered frame by frame like everything else, because the local render steps a clock. If what the skill produces runs on timers, replace its timers with the film's clock. That is the one change you make to it.
- If the reasoning level control is not part of what the skill draws, add it in the skill's own style.
- Named fallback, if no such skill is found after three tries at looking: build the two screens yourself as a plain page in the product's general look, a dark page with one input, a small label and a list of steps, and say in the `BUILD COMPLETE` block that the opening was made without the team's skill.

## 14. The live picture

Part: `quality-levels`.

- The live site draws the same stage with one sample a frame.
- Shadows follow section 5. Glass, reflections and the number of small things follow the visitor's level in `live.quality`.
- Motion blur in the live site: stretch the fast small things, a bolt, a dart, a ball, a coin, along their own velocity.
- Anti-aliasing: multisampling, and a pixel ratio up to the level's cap. Type stays sharp at every level.
- `live.defaultQuality` says who picks the level. With `auto` the site picks. Any other value names the one level every visitor gets.
- The site picks a level by itself: it starts at the level its first frames can hold and steps down if the frame rate stays under that level's `minFps`. It never steps up and down in a loop.
- Named fallback: one fixed level, the `low` one, for every visitor.
- The picture must never stall while files load. The careers page and the cursor load first. Each later page loads while the visitor is busy on the one before it. A page that is not ready holds the page turn for at most `live.loadWaitSeconds` with the cursor tapping its tip, in character.

## 15. The interface, the pointer and finishing

### The pointer

Part: `pointer`.

- The system cursor is hidden over the page. The visitor's mouse sets where the hero is asked to be, and the hero goes there with a little weight: quick enough that it feels like their own hand, loose enough that it feels like a thing. A click lands where the hero is, not where the hidden system cursor is.
- When the page takes control, the mouse is ignored for at most `live.controlTakenMaxSeconds`, and the hero is handed back where the mouse now is, with a short ease, never a jump.
- Named fallback: the hero placed exactly at the mouse, with squash and stretch only.

### The few controls

Part: `interface`.

- Three real HTML controls sit over the canvas in live mode, small and quiet, in the page's type and colours: a sound control, the skip link from `copy:live.skip` when it is due, and the link from `copy:live.watchFilm`. They can be reached and used by keyboard and have names.
- The message for a touch-only device is a plain HTML page in the site's look, with the words of `copy:live.touchOnly` and a link to `links.portfolioWork`. Nothing else loads behind it.
- A visitor whose system asks for less motion is offered the film with ordinary playback controls.
- The current step's heading and each message the page shows are also written to a hidden live region, so the page says something to a screen reader.
- Named fallback: plain unstyled controls in the same places with the same names.

### Finishing

Part: `finish-logic`.

- `kit/02-SUBJECT.md` under "Rules for the live site" is the specification: every visitor can finish, nobody can get stuck, and control is always handed back.
- Every gag is a small state machine with a way out that does not depend on skill: the turrets overheat, the dial gives up, the crank runs away, the boss tires, the machine's director delivers. The numbers are in `live`.
- `npm run bots` proves it. Each bot in `live.bots` plays the whole site as a visitor would, through the same pointer path a mouse uses. Check G17 has the rule.
- Named fallback: a plain timer on every gag. Once a gag has run for `live.skipLinkAfterSeconds` it plays its own ending, whatever the visitor is doing, and hands control back. This can always be made.

## 16. Page turns

Part: `page-turn`.

- A page is the face of the slab. To change page the slab turns over about its long axis and the next page is on its back. It has mass: it starts slowly, swings, seats with a knock, and the things on the new page shiver once.
- The cursor jumps as the slab goes and lands on the new page.
- Named fallback: the same turn with no shiver and no jump.

## 17. The card loop

Part: `loop`.

- One of the scenes in `deliver.cardLoop.candidates`, chosen as `kit/07-QUALITY-BAR.md` says, played as a loop of `deliver.cardLoop.seconds` seconds from that key's camera.
- Everything in it is periodic, with a period that divides the loop's length: the cursor's path and acting, every bolt, bumper, dart and slab, every lamp, every puff of smoke, every scorch mark that fades.
- The loop is its own small script on the same stage. Nothing in it is a recording of the film.
- A portfolio card may crop it. The cursor and the thing it is up against stay inside a centred 4:3 crop and a centred square crop of the frame for the whole loop.
- Named fallback: the same scene with only the cursor and one repeating threat moving.

## 18. Where image generation helps

- The artwork of each tier's floor, the marquee's skyline, the faces of models, material detail pictures. Never a word.
- Extra views of a model or a machine, always with its approved image passed in.
- Every generated picture counts against `assets.maxTakesPerAsset` for its asset, and its prompt is committed beside it.
- Say "no text, no letters, no numbers" in every prompt for a picture that ships. Then check the result for letters before it is used.
- The reference rounds found that the image model follows a rough guide picture closely. When a picture has to match a layout, give it a guide drawn from the layout tree.
