import { error } from '@sveltejs/kit'
import { exhibits, findExhibit } from '$lib/exhibits/data'
import type { EntryGenerator, PageLoad } from './$types'

export const prerender = true

// プリレンダ対象の :id を列挙。
export const entries: EntryGenerator = () => exhibits.map((e) => ({ id: e.id }))

export const load: PageLoad = ({ params }) => {
  const exhibit = findExhibit(params.id)
  if (!exhibit) error(404, `作品が見つかりませんでした: ${params.id}`)
  return { exhibit }
}
