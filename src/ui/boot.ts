// The first module the page loads. A touch-only device gets the message and nothing behind it. Every other visitor gets the site.
import { messageOnly, touchOnly } from './device'

interface Waiting { ready: Promise<unknown> }
const page = window as unknown as { showcase?: Waiting }

if (messageOnly(location.search, touchOnly())) void import('./message')
else {
  const site = import('../main')
  // Until the site's own module has run, whoever waits for the site waits here: the site then puts itself in this place.
  page.showcase = { ready: site.then(() => page.showcase!.ready) }
}
