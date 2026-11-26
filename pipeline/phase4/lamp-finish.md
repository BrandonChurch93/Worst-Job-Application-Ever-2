# lamp-finish: the light in the machine and the printed floors

Agent `lamp_finisher`, parts `table-lights` and `tier-art`, branch `agent/lamp-finish`, from main cfd83123. Started 2026-11-26 10:02 UTC, limit 13:02 UTC.
Earlier owners' notes are read, not edited: `lamp-fix.md`, `lamp-keeper.md`, `table-light.md`, `lights.md`, `art.md`.

Labels: MEASURED (a command was run and its number read), STATED (read in code or a note), UNKNOWN.

## Start

- MEASURED 10:03 to 10:05 UTC on untouched main cfd83123: `npm test` 115 files, 1461 of 1461 passed; `npm run build` exits 0; `npm run bots` prints "bots: all clear".
- MEASURED: `node assets-src/table/lights/look.mjs --name s0 --keys ...`: one draft still with its pair takes 18.7 to 26.6 s after the first (42.8 s with the session's start).

## What the approved images show in my part that a quick look misses

1. A lit window in the floor is pale, not dark: its face is cream to white over most of its width and only the outer third carries the colour, so the red one reads pink-white and the blue one sky-white. The line art is dark and thin on that pale face.
2. Shadows are short. In `tier-street` and `tier-office` a building or a cup darkens the floor for less than half its own height, with a soft edge, and nothing crosses a lane.
3. Every warm thing lies twice: once as itself and once as a soft warm patch on the floor beside it (under each sling, round each round lane lamp, under each cup's rim). The floor between those patches is deep and even, never black.
4. From the low cameras the floor is a dark mirror with large tiles of slightly different depth: the red of the firehouse bay and the warm of each window stand in it as soft upright streaks that reach toward the camera, and far lamps become round discs out of focus.
5. The Office floor is light: a muted grey-teal with cream bands and a grain so fine it reads as tooth, not speckle. Its light is warm white, not green.

## Issues of round 12 that are my folders' and still true on main (s0 stills, 10:07 UTC)

Severe:

- R1-5 issues 1 and 4 (`rail-cam`, `last-save`): "the approved still is a warm night city: deep teal glossy streets, warm lamp glow, dark mood; the build is a bright, cool, grey daylight scene with flat pale ambience and no warm pools of light". Still true in my half: no warm pools, the lamps are small and the far ones do not glow; the pale walls are the frame's.
- R1-4 issue 4 (`youre-fired`): "the page is matte with fine blueprint lines; -a's floor is dark glossy, wet-looking tiles with strong red and warm reflections spilling from the door and beacon". Still true: the floor before the bay shows thin line art and no red.
- R1-3 issues 3 and 4 (`tier-office`, `reply-all`): "Cool, hard-edged shadows and muted, synthetic surfaces dominate the build"; "cooler and flatter, with long dark shadows around the top row and almost no warm reflected light beneath the main mechanisms". Still true: the cups throw shadows two cup widths long across the cream band, the light is green-white.
- R1-1 issue 1 (`table-wide`), my half: "The rails and inserts are isolated points of light rather than a coherent field of reflections". Still true.

Major:

- R1-3 issues 21 and 22, R1-1 issue 13 (inserts): "Broad dark radial fields with glowing colored centers replace the target's luminous pale enamel faces, concentric bezels and fine dark illustration". Still true on all three tiers: each window is a dark saturated disc with a small hot middle.
- R1-2 issue 7 (`tier-corporate`): "the hourglass insert is dark grey and unlit while the magnifier and clipboard glow". To be checked on s0 `tier-corporate`.
- R1-4 issue 12 (`tier-street`): "a large hard dark shadow from the highway and garage falls across the page". To be checked on s0 `tier-street`.
- R1-2 issue 6 (`tier-corporate`): "dimmer and cooler, with large soft dark shadow pools across the upper half".
- R1-3 issues 9 and 10, R3-1 issue 4, R3-3 issue 5, R3-2 issue 7 (Office floor): "The build's stipple is coarse and repetitive, and a faint fan of guide lines"; "The heavy, even speckle looks like exposed carpet rather than artwork under a polished pinball coating; the floor does not pick up a distinct reflection from the nearby bright rims". Still true.
- R1-2 issue 8 (`lobby-doors`), my half: "a bright red glowing pool beneath and inside the ball". To be checked.

Minor:

- R1-5 issue 13, R1-5 issue 14: "cools the scene"; "warm and darken these crops, restore the glossy reflections".

Not my folders (named so the Builder can pass them on): the tilt of the tier cameras (ruled), the pale walls behind `youre-fired` and round `last-save` (frame), the steel balls reading as milky beads (hardware), the arrow's grey face (cursor), every sign's type, the paper clutter on the Office shoulders (models or frame: not in my print).

## Looks

Counted from the first still, by part. Limit 40 a part in this round.

| Time UTC | Part | Stills | What | Running: lights, art |
| --- | --- | --- | --- | --- |
| 10:07 | both | 9 | s0, untouched main: tier-office, reply-all, youre-fired, last-save, table-wide, lobby-doors (lights), tier-corporate, tier-street, rail-cam (art) | 6, 3 |

## Decisions

