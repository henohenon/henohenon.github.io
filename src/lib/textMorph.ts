// テキストの「中身」を from → to へ書き換えるトランジション（フェード・スクランブルなし）。
// 文字数を from.length → to.length へ詰めつつ、前から to を確定させていく。
// 挨拶（長文）→ タイトル（短文）なら、長さが減りながら最終的にタイトルへ落ち着く。
// live な要素の textContent を直接いじるので、途中経過も本物のテキストが動いて見える。
//
// 戻り値は「中断関数」。連打・逆方向切替で再実行されたら、進行中の morph を
// キャンセルしてから現在の textContent を起点に新しい morph を張り直す（$effect の cleanup 用）。

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

export function morphText(node: HTMLElement, from: string, to: string, duration = 750): () => void {
  // 変化なしなら何もしない（初回マウントの同値 morph 等）。
  if (from === to) {
    node.textContent = to
    return () => {}
  }

  let raf = 0
  const start = performance.now()
  const tick = (now: number) => {
    const p = Math.min(1, (now - start) / duration)
    const e = easeInOutCubic(p)
    // 表示長は from→to へ、前から確定する文字数も to へ。両者とも p=1 で to に一致する。
    const len = Math.round(from.length + (to.length - from.length) * e)
    const locked = Math.round(to.length * e)
    let out = ''
    for (let i = 0; i < len; i++) out += i < locked ? to[i] : (from[i] ?? '')
    node.textContent = out
    if (p < 1) raf = requestAnimationFrame(tick)
    else node.textContent = to
  }
  raf = requestAnimationFrame(tick)
  return () => cancelAnimationFrame(raf)
}
