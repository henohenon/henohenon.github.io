import type { OnNavigate } from '@sveltejs/kit'

/**
 * Gallery↔Focus の演出。1 つの遷移につき 1 回呼ばれる。
 *
 * 実装が気にするのは絵だけでよい。多重発火ガードと、投げたときの後始末は
 * 呼び出し側（index.ts の start）が持つので、ここで例外を握る必要はない。
 *
 * 「終わり」が 2 つあることに注意:
 *   allowSwap()  … 旧画面を掴み終えた合図。呼ぶと SvelteKit が DOM を差し替える。
 *                  覆う演出なら「覆いきった時点」で呼ぶ。
 *   返り値の解決 … 演出が完全に終わった合図。ガードはここで下りる。
 */
export type ExhibitTransition = (ctx: {
  navigation: OnNavigate
  /** true=Gallery から Focus へ入る / false=Focus から戻る */
  dive: boolean
  allowSwap: () => void
}) => Promise<void>
