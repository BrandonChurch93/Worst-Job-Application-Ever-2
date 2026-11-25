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
