// The words of the probe page. It is a measuring tool for Brandon and not a page of the site, so content/copy.json has no word for it.
// Everything else it shows is an id from the config or a number.
export const labels = {
  title: 'Probe',
  running: 'Measuring',
  median: 'median fps',
  slowest: 'slowest 1% fps',
  frames: 'frames',
  card: 'Graphics card',
  screen: 'Screen',
  window: 'Window',
  browser: 'Browser',
  pick: 'The site would pick',
  unknown: 'not reported',
  failed: 'did not run',
  copy: 'Copy',
  copied: 'Copied',
  again: 'Run again'
} as const
