# Step 2 keeper notes

Branch `agent/step2-keeper`. Parts: `rows`, `dial`, `slot`, `crank`, `acting-step2`.

## What the approved images hold that a quick look misses

1. Highlight: on the dial the light sits on the upper left only. The hub carries one broad soft sheen on its upper left shoulder (peak 255,215,162 on a body of 213,106,39), not a pin point; the wheel face holds two bright fans and two dark fans, the bright ones toward upper left and lower right.
2. Bevel: the housing round the wheel is a stepped ring about 9 to 10 px wide at hd with a thin dark gap inside it, and each finger hole has a countersink about 2 to 3 px wide that is lit on its lower right lip and dark on its upper left.
3. Gap: the tray's upper and left walls are not black. On column x=1400 the wall reads 58 to 77, the floor's shade band under it about 50, and the line between them 33. The wall is lighter than the shade it throws.
4. Edge: the rim of the tray on the upper and left sides is mid grey (106 to 128), not white; only the lower and right rim catches a thin bright line. The inner corner is round, not mitred.
5. Tone: the shade in the tray leans blue green against the warm paper, and the lit lower wall is a thin strip, thinner than the shaded upper wall.

## Decisions

- Dial hub: a clone of the shared orange with its colour lifted (`hubLift` 1.6, hue kept) and a soft painted sheen toward the key, because the shared orange with `envMapIntensity` 0.25 and `keySpecular` 0 renders brick red where the approved hub is bright. The clone runs through the shared studio hooks.
- Dial housing and base ring: a darker clone of the shared steel (`dial-housing`), through the shared studio hooks.
- Tray: `TRAY_R` 18 and rim 6.5 for a rounder inner corner; the wall shade now runs over the upper and left rim (`rimShade`) so that rim reads mid grey; wall lighter than the floor's shade band; a slight cool tint in shade (`cool`).

## Looks counted

See the table at the foot, kept current.
