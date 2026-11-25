# 06 · Assets

## The approved images

Brandon approved these on November 23 and 24, 2026, over six reference rounds. `references/STATUS.md` is the record. They are pinned by hash in `references/approved/MANIFEST.sha256`.

There are two kinds, and the config lists both.

Keys, in `keys`. Each is one still the build has to match.

| File | What it is the target for |
| --- | --- |
| `marketing-top.png` | The first screen of the careers page |
| `step1-fire.png` | Step 1 with the keyboard docked, the turrets up and bolts in flight. Also the anchor of the whole set: the surface, the type, the light and the grade are locked against it and the sheet `page-look` |
| `step1-tug.png` | The tug of war: the shredder slot, the pose, the arms, the paper |
| `step2-rest.png` | Step 2 with its three rows closed |
| `step2-dial.png` | The Contact number row open with the rotary dial risen |
| `step2-crank.png` | The Audio volume row open with the crank and the meter |
| `boss-fight.png` | The fight: the boss, the health bar, the slabs, the darts |
| `boss-down.png` | The beaten button lying outside its socket |
| `decision.png` | The rejection page |
| `table-top.png` | The whole playfield from directly above. The master view of the table |
| `table-player.png` | The table from where a player stands |
| `table-backbox.png` | The backbox with its title and display |
| `table-hq.png`, `table-firehouse.png`, `table-coffee.png`, `table-flippers.png`, `table-highway.png` | Close views inside the machine |

Sheets, in `sheets`. Each shows several states at once. The build renders the same states in the same arrangement and is compared state by state.

| File | What it is the target for |
| --- | --- |
| `page-look.png` | The materials, the type, the header and progress bar, the weight of the shadows |
| `cursor-acting.png` | Sweat, the red tip and steam, the pale fear, the melted exhaustion, the burn hole |
| `cursor-damage.png` | Shredded, reassembled, scorched, punched, flattened |
| `cursor-arms.png` | The arms |
| `machines.png` | The dial, the slot machine and the crank |
| `boss-stages.png` | The Submit button becoming the boss |

`contact-sheet.jpg` holds all of them on one sheet. It is used for the first status and is not a target.

What has no picture:

- Motion. No image shows how anything moves. `kit/01-FILM.md` and `kit/02-SUBJECT.md` are the target for that, and critics R4 and R9 judge it.
- The slot machine open inside its row, the careers page below its first screen, the wait before the letter, and the cursor's confident, shocked and proud states. Each follows the words in `kit/02-SUBJECT.md` and the look of the images nearest to it.

Rules:

- They are never regenerated, replaced, retouched or toned down. Stop condition 1 checks the hashes in every task.
- No pixel of an approved image is ever drawn in a frame of the site, the films or the loop as it is. An approved image may be the starting point for a texture, as `kit/03-METHOD.md` says for the playfield and the buildings, and for the last resort of the fallback chain, always with its words painted out. The rough cut is the one place they are shown whole.
- `references/drafts/` is the record of every reference round, kept and rejected. Read it, never change it. `references/STATUS.md` says which images were rejected and why.

### Settled differences

Image generation got some things wrong in every approved image: a misspelled word, a cursor of the wrong size, a key row cut off. The build must not copy those.

- A key or a sheet in the config may carry `settled` lines, and `settledAll` holds lines that apply to every one. Each names one point where the build differs from the approved image on purpose.
- On that point the kit wins over the image. Everywhere else the image wins.
- The match critic is given the lines word for word and told not to count them.
- Only Brandon adds a settled line, through an addendum or a note in the thread. The lines in the config now come from the faults the reference rounds reported in their own images and from what Brandon agreed in the planning chat. `references/STATUS.md` lists them in a table.
- If you find a real conflict the kit did not foresee, pick the reading closest to the approved image that keeps the page a real web page, log it under "Decisions made by the Builder", and list it in the `REVIEW` block.

## Generated pictures

The approved images show each page from one side at one size. Building the parts needs more.

- For a part, generate what its method in `kit/03-METHOD.md` asks for: the playfield artwork, side art, building faces, material detail, extra views.
- Always pass the part's approved image as a reference, and say what must stay the same.
- Every prompt for a picture that will ship says: no text, no letters, no numbers, no logos. Look at every result for letters before it is used. A picture with letters in it is not used, however good it is.
- At most `assets.maxTakesPerAsset` takes per asset. Pick the best, show it inline with a status, and move on.
- These are working pictures, not targets. The approved image stays the target for the part they feed.
- Keep each kept picture and its prompt under `assets-src/<part>/`.
- No picture you generate shows a person, a hand, a face or an animal.

## Terms of the image tools

Generated pictures end up in shipped files here, as textures.

- In Phase 0, read the output terms of each image model you will use and write what they say into `ASSETS.md` under "Generated images": the model, the source of the terms, the date, and whether they clearly allow outputs in a published video and on a public website.
- Prefer a model whose terms clearly allow both for everything new you generate that ships.
- Do not swap, regenerate or drop anything already approved because of what you find. Build with it.
- If the terms of the model that made the approved images do not clearly allow both, list it under "For Brandon to decide" in `kit/PROGRESS.md` and in the `REVIEW` block. Nothing waits on it.

## Sounds

- In Phase 0, read the current output terms of the sound tool for the plan this account is on, with a supporting agent that keeps every quote and its source in `references/terms/`. Write what they say into `ASSETS.md` under "Generated sounds", marking each line as stated by the terms, measured, or unknown.
- Three points matter and each gets its own line: whether generated speech in a saved voice and sound effects may be published inside a film and inside a website; whether they may be kept as separate files in a public repository; and what the terms say about a video posted by a company on social media.
- `AGENTS.md` under "Sound" gives an earlier reading of those terms and says where the files live in each case.
- The site ships its short sounds as one packed file with an index, not as separate files with addresses of their own.
- Every kept sound has a row in `ASSETS.md` and a record beside it, as `kit/03-METHOD.md` section 12 says.

## Built assets

### Sizes and formats

- Geometry: binary glTF with mesh compression where it helps, or geometry made in code. One file per part.
- Textures: the `full` set at the sizes in `assetSets.full` for the films and the judged stills, the `web` set at the sizes in `assetSets.web` for the site, in a compressed GPU format with a fallback every target browser reads.
- Type is never a texture, except in the named fallback of `kit/03-METHOD.md` section 3.
- Light pictures for the table's light groups: one set for each group, at a size that holds a lamp's falloff.
- Colour pictures are stored in sRGB. Height, normal, roughness and every data picture are stored linear.

### Recipes

Every generated or built asset has a recipe in `assets-src/<part>/RECIPE.md`, text only, in this form:

```
## <file or group of files>
Made by: <the tool or script, and its version>
From: <every input file, with paths>
Prompt or command: <exact>
Takes: <how many were made, and which was kept>
Why this one: <one line>
Date: <the day it was made>
```

The scripts and the committed inputs must be enough to make every shipped file again.

## Third-party files

Little in this build has to come from outside: the fonts, perhaps an environment picture or a small texture.

### Where to look

- Fonts under the SIL Open Font License: one neutral sans for the site, one display face for the pinball table.
- Public domain and CC0 collections for anything else.
- Photographs and video of real pinball machines are for study only, inside `assets.maxStudySources`. None is used in a frame, and no name, artwork or layout is taken from one.

### Rules

- Every file you did not make is listed in `ASSETS.md` with its source URL and license before it is used.
- Allowed: public domain, CC0, the SIL Open Font License for fonts, or a license that clearly permits commercial use in a published video and on a public website.
- Nothing extracted from a game, a film or a paid pack. No real brand or logo.
- Look at each one once before it ships.

## What is committed

| Kind | Committed |
| --- | --- |
| Scripts, configs, recipes, prompts | Yes |
| Shipped files under `public/assets/` | Yes, once per round after the best is chosen |
| The full asset set under `assets-full/` | Yes, inside `repo.maxFileMb` per file. A file over that is rebuilt from its recipe and not committed |
| Kept sounds, mixes, the site's sound files | As "Sound" in `AGENTS.md` says |
| Takes not kept, caches, checkpoints, frames | No. They live under `out/work/` |
| Kept stills, comparison images, sheets, the preview films | Yes, through `npm run keep` |
| Photographs from the web | Never. They live in `references/cache/` |
