// Item 8 of change note 002 (kit/PROGRESS.md): the pinball scene of the live site is a pre-rendered film, and the page says so
// with `control: 'film'` for exactly that span. The stage counts those seconds apart from the pointer's and the flippers'.
// This is the one place where they are left out of `live.controlTakenMaxSeconds`: what is held against the limit is `counted`,
// and `film` is reported beside it, never compared.
export const controlTaken = (run) => ({ counted: { pointer: run.ignoredPointer, flippers: run.ignoredFlippers }, film: run.ignoredFilm ?? 0 })
