import { error } from '@sveltejs/kit'
import { exhibits, findExhibit } from '$lib/exhibits'
import type { EntryGenerator, PageLoad } from './$types'

export const prerender = true

// プリレンダ対象の :slug を列挙。
export const entries: EntryGenerator = () => exhibits.map((e) => ({ slug: e.slug }))

export const load: PageLoad = ({ params }) => {
  const exhibit = findExhibit(params.slug)
  if (!exhibit) error(404, `作品が見つかりませんでした: ${params.slug}`)
  return { exhibit }
}
