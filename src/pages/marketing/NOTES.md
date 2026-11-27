# Careers page (unit `marketing`)

The page was rebuilt in change 002 to the approved picture `references/approved-002/careers-page.png`, and its film opening in change note 003. The decisions, the measurements, the differences from the picture and what is left are in `pipeline/change002/careers.md`.

## Files

- `layout.ts`: the whole page as a layout tree (`careersLayout()`), 1920 wide, with the type scale `T`, the colours `COLOUR` and the measures of each section.
- `index.ts`: `makePage()`, the page logic: scroll, ticker, cards that flip under the pointer and back, the three Apply buttons, the variant `rejected`; `careersOpening()`, where the film's arrow stands at each of the five places.
- `script.ts`: `OPENING`, every number of the film's opening on the page, the scroll plan and the arrow's way.
- `real/`: what draws it. `flat.ts` (flat paint), `careers-page.ts` (the sheets and the type), `perk-cards.ts`, `ticker.ts`, `apply-button.ts`; `card-glass.ts` is the glass of the earlier page, still used by step 4 and step 5.
- Tests: `tests/marketing.test.ts` and `tests/careers-*.test.ts`.
