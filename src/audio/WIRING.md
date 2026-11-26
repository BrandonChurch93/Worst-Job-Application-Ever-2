# Wiring the sound engine into the site

`src/main.ts` is not the sound builder's file. This is what the engine expects of it. The Builder wired it on main at f28f064, and `npm run sound -- --check` measures the result in a browser.

```ts
if (mode !== 'capture') {
  const { makeSound } = await import('./audio/index')
  const sound = makeSound({ base: `${import.meta.env.BASE_URL}audio/` })
  sound.onChange(() => control.hidden = !sound.available())
  window.addEventListener('pointerdown', () => void sound.unlock(), { once: true })
  let sent = 0
  onStep(() => {
    for (; sent < stage.events.length; sent++) sound.event(stage.events[sent], mode === 'live' ? 'live' : 'film')
  })
  onBeatStart((id) => sound.beat(id, mode === 'live' ? 'live' : 'film'))
  onIdle(() => sound.trigger('idle'))
  onWatchFilm(() => sound.trigger('watchFilm'))
}
```

The rules it keeps:

1. The import is dynamic and sits behind the mode, so in `capture` mode no audio code is loaded. No other module imports `src/audio/index.ts`.
2. `unlock()` is called from the first click. Before it the engine makes nothing, fetches nothing and plays nothing.
3. Every event of `stage.events` is passed on once, in order, with its `name`, `x`, `y` and `hitsCursor`.
4. `beat(id, mode)` is called when a beat starts. The engine places the beat's lines itself.
5. The control is hidden when `available()` is false. With an index that lists nothing it is false from the start, so the control never shows and then goes. `setMuted`, `muted`, `setVolume` and `volume` serve the control.
6. `stop()` when the film is paused, sought, ended or left, and when the step or the mode is changed. After it the engine is fully silent.
7. `start()` when play runs again: in the film's `play()`, after a seek while the film plays, after a change of step, and after a change of mode unless the film starts paused. It brings the room tone back at once. A site that starts in film mode and paused calls `stop()` once right after `makeSound`. The Builder took these calls into `src/main.ts` on main at c5a09f6.
8. Film A only: `opening(from, to)` in each drawn frame of the film with the span of film time just drawn, before the beats of that span, and `opening(T, T)` with the film's time right after each `stop()`, before `start()` in the film's `play()` and when the mode changes to the film. The engine plays the opening's sounds and keeps the room tone out until the opening is over. The Builder took these calls into `src/main.ts` on main at f4ba776.
9. Film only: `beat(id, 'film', into)` right after `start()` in the film's `play()` and after a seek while the film plays, for the beat that began last before the film's time, with `into` the seconds since it began. The engine speaks the lines of that beat still to come, each at its place, and none that has begun. The Builder took this call into `src/main.ts`, on main at 37ee466.
10. `trigger('watchFilm')` after the mode has changed to the film, that is after `opening(0, 0)` and `start()`. The engine says the line only while the opening plays and only if it ends `audio.lineGapSeconds` before the film's first line; anywhere else the call does nothing. The Builder took this call into `src/main.ts` on main.
11. The files of `public/audio/` are not committed; `public/audio/index.json` is, with the size and sha256 of each file. A tree that builds a site to publish or to mix gets the files copied in and runs `npm run sound -- --pack-check`, which prints a pass or the list of what is missing or different. A tree without the files runs silent: the control shows until the first click, the load fails, and it goes.
12. An event plays the cue `cueOfEvent(name)` gives it: the table `eventCues`, then the eleven added cues of `extraCues`, each on the event of its own name. An event with no cue, or a cue whose sound is not loaded, plays nothing and throws nothing. `carpet-roll`, `inbox-take`, `firehouse-take` and `metrics-card` are emitted by their pages since Phase 5 and sound. An event may start a second sound beside its own (`alsoStarts`): `unfold` starts `boss-loop`.
13. The volume. In each drawn frame of the live site `src/main.ts` passes `stage.page.volume?.() ?? 1` to `setVolume` when it has changed. A page without a volume of its own is at 1, so only step 2 turns the site down, and only between the opening of the Audio volume row and the end of that row.
14. `log()` gives the engine's own record of the narrator: for each line the time on the sound clock, what set it off, and whether it was spoken, dropped (with the reason in words), taken back before it began, or cut. `npm run sound -- --visit keen` plays the whole live site with a bot through the stage and this engine and prints it.
