import { notFound } from 'next/navigation'

/*
 * Any address the site doesn't have. Sending it through notFound() here (inside the site's own
 * layout) shows the café's "page not found" page with the header and footer, instead of Next.js's
 * plain built-in one.
 */
export default function Missing(): never {
  notFound()
}
