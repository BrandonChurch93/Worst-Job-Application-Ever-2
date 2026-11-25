# Wiring the sound engine into the site

`src/main.ts` is not the sound builder's file. This is what it needs. Nothing here is applied.

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
6. `stop()` when the page is left or the film is reset.

## Trying it before the real wiring

`src/audio/TRY-WIRING.patch` is a stand-in, not for merging. It loads the engine from `src/main.ts`, unlocks it at the first click or key, passes the stage's events on and mounts the interface with empty answers.

```
git apply src/audio/TRY-WIRING.patch
npm run sound -- --fixtures
npm run sound -- --check --root out/work/audio/fixture-run
git checkout src/main.ts
```

With it applied the checks A1, A2, A3, A4 and A11 were measured on the site with stand-in sounds. The numbers are in the sound builder's report.
