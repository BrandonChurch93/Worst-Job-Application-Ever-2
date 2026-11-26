# Boss fight: notes of the build agent `boss_fighter`

Branch `agent/boss-fight`. Parts: `boss-weapons`, `verify-card`, `health-bar`, `acting-boss`.

## What the approved images show that a quick look misses

Looked at `references/approved/boss-fight.png` at full size in crops (health bar left and right, verify card, the darts, the spark, the slabs), beside `boss-down.png`, `boss-stages.png` and `page-look.png`.

1. Highlight. On the health fill the highlight is one soft band along the upper third of the capsule, not a line on its edge; on a red slab it is a narrow bright line on the upper left bevel only, and the face stays matt. The dart has no highlight at all: it is a flat white facet, brighter than the page by a small step, and its light shows as a warm spot on the paper under it, about 30 px wide.
2. Bevel. The glass card's bevel is about 10 px wide and reads as a lighter band inside a thin bright rim of 2 px. The slab's bevel is about 6 px and fully round. The health track's rim is 2 to 3 px of polished metal that rolls into the track; the fill's own shoulder is about 3 px.
3. Gap. Between the fill and the track's rim there is a dark line under 1 px wide, darker below the fill than above it. The track's empty floor is brushed steel two stops darker than the rim, with streaks along its length. Under the checkbox cap the seam is a dark hairline, not a moat.
4. Edge. The checkbox is an orange cap in a thin pale frame that stands a hair above the glass and throws a short shadow to the lower right. The tick is a raised white stroke with round ends, about 5.5 px wide. A slab in flight throws a soft shadow about 25 px to the lower right; a landed slab's shadow touches it.
5. The fight. Each dart is the head of the cursor's arrow, about 26 px long, with a hair thin trail that fades behind it and a small dark shadow about 14 px to the lower right, so it reads as flying above the page. The spark is small: a white core about 10 px, a dozen thin streaks 20 to 50 px long, a few loose flecks, almost no halo.

## Decisions

- One click fires a volley of four darts, 0.085 s apart, so the film has the stream of darts the approved image shows. Each dart does 0.75, so a click still does 3 and the count of clicks per phase is unchanged (9, 12, 17). A pop-up takes 12 darts, which is still three clicks. A dart only hurts the boss in the phase it was fired in. `src/boss/plan.ts`: `DART.volley`, `DART.gap`, `DART.damage`, `POPUP.hp`.
- The film's clicks near the key picture are moved: 12.01 s and 12.37 s (were 11.88 s and 12.54 s), and the cursor's dodge runs 11.5 to 11.95 s (was 11.85 to 12.3 s), so at 12.5 s the cursor stands still, five darts are in the air, the first has just struck, and slab 1 is in flight. The key's time does not move.
- Events after the change, measured in the film: `slab-fire` 9.86 s, `popup` 15.96 s (was 15.88 s), `session-expired` 22.35 s (was 22.26 s), `power-down` 27.23 s (was 27.13 s), `button-press` 30.50 s. All inside their beats with the 0.25 s tolerance.
- The draw list of the weapons is new: one shape for a dart (`dart-N`), one for a spark (`spark-N`), one for a muzzle flash (`muzzle-N`, new), the damage marks of a pop-up are scorch marks. Per frame numbers go through `v`.
- The health track slides in as a tray above the page and seats into its pocket in the last 0.2 s. While it slides it is not a pocket, so the page's slab is not rebuilt each frame.
- The tick is one shape (`verify-tick`), a raised stroke shown up to a point.
- The fill's length changes by moving the two ends of one mesh, in `pose`.
