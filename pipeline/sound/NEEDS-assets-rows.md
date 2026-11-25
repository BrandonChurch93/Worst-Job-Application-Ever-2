# Rows of ASSETS.md that are missing or out of date

MEASURED at 20:05Z against `ASSETS.md` of main 9267c2b: 23 of the 177 rows of `audio/ASSETS-ROWS.md` are not word for word in `ASSETS.md`. They are below. A row whose file is already named in `ASSETS.md` replaces the row there (the kept take changed); the others are new. Copying the whole of `audio/ASSETS-ROWS.md` over the block "Generated sounds" does the same.

| File | What it is | How it was made | Record |
| --- | --- | --- | --- |
| `audio/kept/arms-out.wav` | Sound effect `arms-out` | Generated with the sound tool, take 1 (build) | `audio/kept/arms-out.json` |
| `audio/kept/carpet-roll.wav` | Sound effect `carpet-roll` | Generated with the sound tool, take 1 (build) | `audio/kept/carpet-roll.json` |
| `audio/kept/dart-hit.4.wav` | Sound effect `dart-hit`, variant 4 | Generated with the sound tool, take 3 (build) | `audio/kept/dart-hit.4.json` |
| `audio/kept/dial-fling.wav` | Sound effect `dial-fling` | Generated with the sound tool, take 1 (build) | `audio/kept/dial-fling.json` |
| `audio/kept/firehouse-take.wav` | Sound effect `firehouse-take` | Generated with the sound tool, take 1 (build) | `audio/kept/firehouse-take.json` |
| `audio/kept/flipper-save.wav` | Sound effect `flipper-save` | Generated with the sound tool, take 1 (build) | `audio/kept/flipper-save.json` |
| `audio/kept/inbox-take.wav` | Sound effect `inbox-take` | Generated with the sound tool, take 1 (build) | `audio/kept/inbox-take.json` |
| `audio/kept/line.live.hit.2.wav` | Narrator line: Still typing. / It has bills. | Generated with the sound tool, take 1 (build) | `audio/kept/line.live.hit.2.json` |
| `audio/kept/line.live.idle.1.wav` | Narrator line: Take your time. / The job is not real. | Generated with the sound tool, take 3 (build) | `audio/kept/line.live.idle.1.json` |
| `audio/kept/line.live.tugLost.0.wav` | Narrator line: The shredder / always eats first. | Generated with the sound tool, take 1 (build) | `audio/kept/line.live.tugLost.0.json` |
| `audio/kept/line.step1.email.0.wav` | Narrator line: A valid email. / Rejected. / The system / is working as designed. | Generated with the sound tool, take 2 (build) | `audio/kept/line.step1.email.0.json` |
| `audio/kept/metrics-card.wav` | Sound effect `metrics-card` | Generated with the sound tool, take 1 (build) | `audio/kept/metrics-card.json` |
| `audio/kept/popup-close.wav` | Sound effect `popup-close` | Generated with the sound tool, take 2 (build) | `audio/kept/popup-close.json` |
| `audio/kept/session-expired.wav` | Sound effect `session-expired` | Generated with the sound tool, take 3 (build) | `audio/kept/session-expired.json` |
| `audio/kept/skip.wav` | Sound effect `skip` | Generated with the sound tool, take 1 (build) | `audio/kept/skip.json` |
| `audio/kept/slab-drop.2.wav` | Sound effect `slab-drop`, variant 2 | Generated with the sound tool, take 3 (build) | `audio/kept/slab-drop.2.json` |
| `audio/kept/slab-drop.3.wav` | Sound effect `slab-drop`, variant 3 | Generated with the sound tool, take 3 (build) | `audio/kept/slab-drop.3.json` |
| `audio/kept/strips-zip.wav` | Sound effect `strips-zip` | Generated with the sound tool, take 2 (build) | `audio/kept/strips-zip.json` |
| `audio/kept/tug-lost.wav` | Sound effect `tug-lost` | Generated with the sound tool, take 1 (build) | `audio/kept/tug-lost.json` |
| `public/audio/sfx.bin` | The 102 short sounds of the site in one file | Made by `npm run sound -- --pack` from the kept sounds of `audio/kept/` named in the index | `public/audio/index.json` |
| `public/audio/line.live.hit.2.mp3` | The site's copy of `line.live.hit.2` | Made by `npm run sound -- --pack` from `audio/kept/line.live.hit.2.wav` | `audio/kept/line.live.hit.2.json` |
| `public/audio/line.live.idle.1.mp3` | The site's copy of `line.live.idle.1` | Made by `npm run sound -- --pack` from `audio/kept/line.live.idle.1.wav` | `audio/kept/line.live.idle.1.json` |
| `public/audio/line.live.tugLost.0.mp3` | The site's copy of `line.live.tugLost.0` | Made by `npm run sound -- --pack` from `audio/kept/line.live.tugLost.0.wav` | `audio/kept/line.live.tugLost.0.json` |
