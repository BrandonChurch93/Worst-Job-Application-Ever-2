# Harness notes: the render commands

Decisions taken by the harness builder while building `film`, `seq`, `sheet`, `loop`, `render:local` and `stress`. Facts marked MEASURED were run in the builder's VM (4 cores, software WebGL).

## film

- Defaults: `--which b`, `--format preview`, `--tier draft`, `--assets full`, the rate `film.previewFps`.
- A page is rendered in pieces of at most 300 rendered frames, split evenly, never more than `sandbox.maxFramesOnDisk`. The split depends only on the page, the rate and the limit, so every VM cuts a page at the same frames. `--piece N` changes the limit.
- Frames wait as PNG in `out/work/film/frames/<piece>/` with a note of the build they belong to. A piece is encoded as soon as its last frame is written, checked with `ffprobe` for its frame count, and its frames are deleted. Only one piece's frames are ever on disk: the folder of any other piece is deleted before a piece starts.
- A stopped run carries on at the frame where it stopped: frames on disk whose note matches the build are kept, a piece with a matching record is not rendered again, a page's chunk with a matching record is not joined again.
- Pieces land in `out/work/film/chunks/pieces/`, a page's chunk in `out/work/film/chunks/<page>-F-T.mp4`, each with a record beside it. A chunk is its pieces joined with `ffmpeg -c copy`.
- Encoding: `libx264`, high profile, the bitrate of the format as the target with 1.5 times as the ceiling, a key picture every second, closed groups (`-flags +cgop`), no scene cut pictures, bt709 tags, time base 90000. Every piece starts on a key picture, so pieces and chunks join with no picture encoded twice.
- A record matches when everything but `machine` is the same: hashes, format, tier, asset set, diagnostic, rate, codec, bitrate, range, and the browser version when a browser is open. This is what lets a chunk rendered in another VM be joined here. With `--join` no browser is opened, so the browser version is not compared either.
- `--first N --last M` renders exactly the frames of that range that fall on the preview rate and writes a clip `out/work/film-<which>-F-T-<first>-<last>.mp4` named by the frames it really holds. It never writes the whole film's file.
- `--unit ID` renders that page's chunk and joins nothing.
- `--join` joins the page chunks of this build that exist, in film order. If pages are missing it says `NOT THE WHOLE FILM`, lists them, and the record says `complete: false`.
- Sound: when `audio/mix/review.wav` exists it is laid under the joined film as `export.audioCodec` at `export.audioKbps`. A film with pages missing, or a clip, gets the stretches of the mix that belong to its pictures. Film A gets silence under its opening.
- `--which a` renders the opening's chunk (`opening-F-T.mp4`) and joins it in front of film B's chunks, which are shared and never rendered for it again. While the opening is not built it says so and exits 1 before it renders anything.
- `--from-hd` scales `film-<which>-hd-T.mp4` down to `formats.preview` at `previewFilm.bitrateMbps` and copies its sound. It refuses a film whose record is not of this build.
- `--review` renders film B and writes it as `out/work/review-cut.mp4` (`export.files.reviewCut`).
- `--chunks-to DIR` copies finished chunks with their records, and under `DIR/pieces/` the pieces of pages that are not whole. `--chunks-from DIR` takes both in, after checking each file against the hash in its record.
- `--minutes M` stops cleanly after M minutes, prints `NOT FINISHED`, and exits 2. Exit 1 is kept for "cannot do its work".
- `--by NAME` names who made the looks. A look is written every `status.minGapMinutes` of rendering.
- Free disk is checked first. Under `sandbox.minFreeDiskGb` it deletes, in this order and stopping as soon as there is room: waiting frames, `seq`, `determinism`, `roughcut`, `stress`, `crops`, `stills`.
