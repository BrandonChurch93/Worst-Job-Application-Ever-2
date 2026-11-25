# 04 · The look

## 1. The bar

In Brandon's words, from the planning of this and earlier showcases:

- Hyper-realistic means the viewer believes they are looking at something real, even when the subject could not exist. It never means "limited to real things".
- The standard is a top-budget film or a AAA game cinematic. He named GTA 6 and Avengers: Doomsday.
- Never cartoon, painterly, stylized, flat, plastic, or a web 3D demo.
- His approved reference images are the bar made concrete. When words and an approved image disagree, the image wins.
- The first two seconds stop a scroll on a phone with the sound off.
- Generated artwork and textures may appear in the final frames. The post should look like a complete product.

What that means for this piece:

- The motion is cartoon. The picture is real. The cursor sweats, stretches and flattens like a cartoon character, and every frame of it could be a photograph.
- It is a web page. His words on the first reference round, which failed: it "looks like it's 3-D generated images and not something that would be like an actual application that a user could interact with". A page that reads as a 3D scene is as wrong as a page that reads as a flat interface.
- The pinball machine is the one place the look changes. There the bar is a real arcade machine filmed from inside by a film crew: crowded, glossy, lit by its own lamps.
- He said of the approved images that they are pretty realistic and will be hard to match. Match them anyway. That is the job.

## 2. What sells a real page

- Height. Every part has thickness and stands at its own height. Edges catch light on the upper left and fall into shade on the lower right.
- Contact. A shadow that is tight and dark where a part meets the page and soft further out. A dark gap round a button in its socket. Nothing floats and nothing is stuck on.
- Grain. The ceramic is never perfectly smooth. The eggshell texture shows in the highlights and at a raking edge.
- Material differences. Ceramic is matte, glass is frosted with a sheen, aluminum is brushed and cool, the orange is deep and glossy. Four materials that could not be mistaken for each other.
- Sharp type. Printed like ink on a product, crisp at every size.
- Restraint. One accent colour. A lot of calm surface. The page is a designed thing before it is a rendered thing.
- Imperfection at the smallest scale only: a hair of bevel variation, the faintest dust in a highlight. No dirt, no wear, no scratches. This is a new, expensive object.

## 3. The light

- One large soft key from the upper left, as the approved images show. Shadows fall down and to the right.
- A weak, even fill from everywhere, so no shadow is black.
- No window shapes, no bands, no slashes of light or shade. `references/STATUS.md` records that three images had them and that Brandon chose the clean light.
- The light does not move, flicker or change colour on the pages. Only things on the page add light: a bolt, a hot tip, a dart, a flasher.
- Shadows may be a little deeper than the page look sheet. That depth is what made the round 5 images read as real.
- The pinball table is lit by its own lamps, in a dark surround. As the cabinet rises the page's key light dims and the table's light takes over. As it sinks the key comes back.

## 4. The lens

- The pages: straight on, everything sharp from edge to edge, no blur anywhere, no tilt, no vignette. It should pass for a screenshot of something real.
- A push in on a page moves the camera closer along the same straight line. Everything stays sharp.
- The pinball scene: a film camera. A real focal length for each shot, a shallow focus up close with the cursor sharp, a move with weight, a small shake on a hard hit.
- Motion blur in computed frames comes from the shutter, `film.shutterDegrees`: fast things streak, slow things do not.
- No lens dirt, no flares, no chromatic fringing on the pages. On the table a soft flare from a flasher is allowed.

## 5. Exposure, tone and colour

- The page is a light, warm off-white and must stay that: never blown out, never grey. Set the exposure so the ceramic sits where the approved page look puts it, and so the gloss on the orange and the enamel keeps its shape.
- One gentle tone curve for all the pages, with a soft shoulder for highlights. One grade. Lock both in the look lock.
- The orange is the same orange on every page.
- The table has its own curve and grade: richer, darker, more contrast. The change between the two happens during the rise and the sinking, never as a cut on a page.
- Colour pictures are stored in sRGB and worked on in linear light. Data pictures are linear.

## 6. Glow

- Only things that give off light glow: bolts, the hot tip, darts, lamp inserts, flashers, the score display.
- Glow is light that is too bright for the picture, spread a little by the lens. It is not a halo painted round a shape.
- The page itself never glows.

## 7. Grain and banding

- A fine, even film grain over the whole picture, the same in every frame position, different in every frame.
- Dither before the picture is written to eight bits, so the soft falloff across the ceramic never shows steps.
- Check the falloff across the page in every rest still at four times size. A step you can see is an issue.

## 8. Samples

- A computed picture is the average of the samples its tier asks for, `tiers`. Each sample moves the light inside its area, the view inside the pixel, the lens inside its opening where a lens is used, and the time inside the shutter.
- Stills that hold still need no time samples.
- `kit/05-ARCHITECTURE.md` has the rules that keep this the same on every run.

## 9. Diagnostic views

Each is a way to draw any still or frame. The harness reaches them by name.

| View | What it shows |
| --- | --- |
| `standins` | Everything that carries the stand-in flag, in one loud colour over a grey picture |
| `layout` | The boxes of the layout tree drawn over the still, each kind in its own colour |
| `type` | Only the type, black on white, with each run's box |
| `texels` | Texels per screen pixel, for measure M2 |
| `shadow` | The shadow term alone |
| `height` | Height off the page surface as shades of grey |
| `ids` | Each part in its own flat colour |
| `coverage` | On the table from above: every standing part, every insert and every printed line in white, bare playfield in black. Measure M8 reads it |
| `lights` | The table lit by one light group at a time |
| `colliders` | The physics shapes of the table and the bodies on it |
| `events` | The events of this frame, as marks where they happen |
| `beauty` | The finished picture. The default |

## 10. The ladder

When a picture falls short, move one rung at a time for that problem. The plateau rule in `kit/07-QUALITY-BAR.md` says when. Log each move. When a problem's rungs are used up it becomes an open item.

A rung that moves a part to its named fallback is not a quiet swap: set that part's state to `fallback` in `parts/PARTS.json` and log it as an open item, like any other part that ended on a fallback.

### A still does not match its approved image

1. Fit the layout first: every box where the image has it, checked with the `layout` view.
2. Fit the light: which side is lit, how long and how soft the shadows are, how bright the page is.
3. Fix the largest wrong thing next: a height, a colour, a material that reads as the wrong one.
4. Project the approved image onto the part and correct from the difference.
5. Make new material pictures for that part with the approved image as the reference.

### The page looks like a flat interface with shadows painted on

1. Give every part more real height and a real bevel. Check the `height` view.
2. Deepen and tighten the contact shadows. Add the dark gap round every part that sits in a socket.
3. Strengthen the grain on the ceramic so the highlight breaks up.
4. Push the materials apart: more sheen on the glass, more brushing on the aluminum, more gloss on the orange.

### The page looks like a 3D scene and not a web page

This is the failure of the first reference round.

1. Check the camera: straight on, the page filling the frame, nothing round it.
2. Remove any blur, tilt, vignette or dramatic light.
3. Go back to the layout tree: align the columns, even the gaps, bring every part down to a height a real control could have.
4. Calm it. Fewer things, more surface, one accent colour.

### Type is soft, wrong or hard to read

1. Check the `type` view against the copy. A wrong word is a bug in the register, not a look problem.
2. Raise the size of the smallest runs to `layout.minTextPx` and darken the ink.
3. Draw the type as geometry in place of a distance field.
4. Move to the named fallback in `kit/03-METHOD.md` section 3 at the `full` size.

### The cursor looks like a sticker or a toy

1. Give it thickness you can see: a lit bevel, a dark underside, a shadow that separates from it when it jumps.
2. Make the enamel deep: a clear gloss over white, with the soft box reflected in it.
3. Keep the black edge its own material.
4. Check its size against `cursor.heightPxAt1080`. Too big reads as a toy.

### The cursor's acting does not read

1. Hold the pose. Most unreadable acting is too fast. Give each state a clear pose and a beat to see it.
2. Add anticipation before and a settle after.
3. Exaggerate the silhouette: more stretch, more lean, more squash.
4. Add the effect that belongs to the state: sweat, steam, the pale colour, the sag.
5. Push the camera in for that moment in film mode.

### Glass looks like a grey rectangle

1. Show what is under it, blurred.
2. Add the bright bevel line on the light's side and the dark one opposite.
3. Add the aluminum rim and its shadow in the pocket.
4. Move to the named fallback in `kit/03-METHOD.md` section 4 and tune it against the approved image.

### A machine or the boss looks like a toy stuck on the page

1. Sink it into the page: a pocket, a lift, a gap with dark in it.
2. Add the small hardware: screws, a seam, a bearing, a spring.
3. Make it move like metal: mass, a hard stop, a small ring after.
4. Make it from the page's own materials only.

### The table looks sparse or generic

This is the failure of two earlier tables.

1. Count. Bring the standing parts up to `table.minStandingParts` and the bare playfield down to `table.maxBareFraction`.
2. Layer: plastics over wire over print, a ramp crossing above a lane, something behind everything.
3. Theme what is plain: a post cap, a sign, a tiny car on the highway, a lit window. Nothing on it is a stock part.
4. Fill the print: more streets, more blocks, more inserts with labels.

### The table looks like a render and not a machine

1. Light it from its own lamps only and let the surround go dark.
2. Add the clear coat: sharp reflections of lamps and parts in the playfield.
3. Let light bleed: an insert colours the post beside it, a flasher whites out its corner for a frame.
4. Put a real lens on it: shallow focus up close, highlights that bloom.
5. Add the smallest wear a well kept machine has: a faint ball trail in the clear coat, dust in a corner. Only here, never on the pages.

### The pinball scene looks scripted or floaty

1. Check the bodies' speeds against a real table: a ball crosses the playfield in well under a second.
2. Make hits hard: a full stop and a new direction in a frame or two, with the lamp, the sound event and the camera shake on the same frame.
3. Loosen the director: smaller nudges, later deadlines, so the physics shows.
4. Search for a better take.

### A gag looks mechanical or weightless

1. Sharpen the timing: slow in, a hold, then fast.
2. Give the thing mass: it overshoots, the page answers, nearby parts jump.
3. Make the cursor react before, during and after.
4. Let something small go wrong a second time, late.

### The picture shimmers or crawls

1. Raise the samples for that shot within its tier's count by spending them where the trouble is.
2. Soften the finest detail a little at the distance where it crawls.
3. Check the grain is not the cause.

### The live site would be slow on a visitor's machine

1. Merge and instance: many keys, posts and screws are few draw calls.
2. Bake more: the still shadows of a page, the table's light groups.
3. Cut what the `low` level draws: fewer small things, plainer glass, no reflections in the clear coat.
4. Never touch the computed frames to fix this.

### Slow gradients band

1. Check the dither is on and comes last.
2. Raise the precision of the buffers the picture is built in.
3. Add a little more grain.
