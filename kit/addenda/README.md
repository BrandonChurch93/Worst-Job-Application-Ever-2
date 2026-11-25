# Addenda

Numbered changes made after the kit was written. Brandon's review notes from the planning chat arrive here.

- Files are named `NNN-topic.md`, starting at `001`.
- An addendum beats every kit file on its own topic. A higher number beats a lower one.
- The Builder reads every addendum at the start of every task and after every compaction, and again when a phase begins.
- The Builder never writes or edits an addendum. It logs how it applied each one in `kit/PROGRESS.md`.
- If an addendum asks for changes to a unit that is already finished, the Builder makes them and runs rounds on that unit inside `quality.maxRoundsPerUnit` and the clock. There is no stop for it.
- An addendum may change a string in `content/copy.json` or a line in `content/narration.json`. Those are Brandon's changes. One that changes `content/copy.json` arrives with the new hash already written to `content/MANIFEST.sha256`.

| Addendum | Topic |
| --- | --- |
| `001-sound-budget-and-narrator.md` | The cap on ElevenLabs credits, room for extra effects, the boss loop, the rewritten narrator and its triggers on the live site |
