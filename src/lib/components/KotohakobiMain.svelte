<script lang="ts">
  // コトハコビ Focus の Main＝荷物一覧（listScene 移植）の Pixi アイランド。
  // /focus/kotohakobi でのみ描画。pixi/matter は onMount 内で動的 import するので、
  // 他ルートや初期チャンクには載らない（プリレンダ HTML には canvas を出さない）。
  import { onMount } from 'svelte'
  import { BOX_EXTRA, BOX_SHOTS } from '$lib/kotohakobi/boxTexts'

  // texts: 箱に降らせる文字（＝使用技術）。箱は tags ＋ BOX_EXTRA（所属/イベント）を降らせる。
  let { texts }: { texts: string[] } = $props()

  // 中央「見に行く」ボタンの飛び先。展示固有なのでデータ側には持たせない。
  const LINK = 'https://topaz.dev/projects/c2bfcbeb9b1c5fd0e0ec'

  let host: HTMLDivElement

  onMount(() => {
    let cancelled = false
    // 取得した資源は disposers に積み、cleanup で逆順に解放する。
    // await の途中で unmount されても、そこまでに積んだ分は確実に片付く。
    // 逆に「cancelled 後は何も取得しない」（＝各 await 直後に return）が対の不変条件。
    const disposers: Array<() => void> = []
    const cleanup = () => {
      while (disposers.length) disposers.pop()!()
    }

    ;(async () => {
      const [
        { Application, Container, Sprite },
        { buildListBoxDrop },
        { letterbox },
        { getSequence },
        { buildLinkButton },
        { DESIGN_W, DESIGN_H },
        { loadFont },
        { loadSvgTexture },
        { default: logoRaw },
      ] = await Promise.all([
        import('pixi.js'),
        import('$lib/kotohakobi/boxDrop'),
        import('$lib/kotohakobi/screen'),
        import('$lib/kotohakobi/sequence'),
        import('$lib/kotohakobi/linkButton'),
        import('$lib/kotohakobi/theme'),
        import('$lib/kotohakobi/font'),
        import('$lib/kotohakobi/svgTexture'),
        import('$lib/kotohakobi/logo.svg?raw'),
      ])
      if (cancelled) return

      // Pixi の Text 生成前に M PLUS 1p（サブセット）を読み込む（焼き込み対策）。
      await loadFont()
      if (cancelled) return

      const app = new Application()
      await app.init({
        resizeTo: host,
        backgroundAlpha: 0, // Focus の白地に重ねる（箱は白塗り＋黒枠）。
        antialias: true,
        autoDensity: true,
        resolution: window.devicePixelRatio || 1,
      })
      if (cancelled) {
        app.destroy(true)
        return
      }
      host.appendChild(app.canvas)
      disposers.push(() => app.destroy(true, { children: true }))

      // 音（§6 ギミック）。Focus 入場はクリック遷移＝ユーザー操作後なので鳴らせる。
      // enter は頭からリセットして再生（荷物一覧グルーヴも小節頭から揃う）。
      const seq = getSequence()
      await seq.enter().catch(() => {}) // 音の初期化に失敗しても描画は続行する。
      if (cancelled) return
      const removeGroove = seq.addListGroove()
      // Focus を出たらグルーヴを外し、停止＋巻き戻し。次の enter でまた頭から。
      disposers.push(() => {
        removeGroove()
        seq.leave()
      })

      // 5:3 を host にレターボックス（contain）で収める root。蓋トランジションと同じ矩形。
      const root = new Container()
      app.stage.addChild(root)
      const drop = buildListBoxDrop([...BOX_EXTRA, ...texts], BOX_SHOTS)
      disposers.push(() => drop.dispose())

      // レイヤー順：箱 < 見に行くボタン < ロゴ < 荷物タグ。
      root.addChild(drop.view) // 箱（最背面）

      // 中央に本家トップと同じ段ボール箱ボタン「見に行く」（箱より前）。
      // 中心基準で描いて、変形（揺れ・呼吸）が中央軸で効くようにする。
      const BTN_W = 440
      const BTN_H = 150
      const btn = buildLinkButton('見に行く', -BTN_W / 2, -BTN_H / 2, BTN_W, BTN_H, () => {
        window.open(LINK, '_blank', 'noopener,noreferrer')
      })
      disposers.push(() => btn.dispose())
      const cx = DESIGN_W / 2
      const cy = DESIGN_H / 2
      btn.view.position.set(cx, cy)
      root.addChild(btn.view)

      // 5:3 画面の左上にロゴ（本家ワードマーク）。root に載せてレターボックスと一緒に配置/拡縮。
      const logoTex = await loadSvgTexture(logoRaw)
      if (cancelled) return
      const logo = new Sprite(logoTex)
      logo.scale.set(580 / logoTex.width)
      logo.position.set(16, 8)
      root.addChild(logo)

      root.addChild(drop.overlay) // 荷物タグ（最前面）

      // ビートに乗せて揺れ＋呼吸（本家トップのロゴ animateLogo と同じ・kotohakobi.md「リズムに乗る」）。
      let bobRaf = 0
      const bob = () => {
        const t = seq.phase(4) * Math.PI * 2
        const sway = Math.sin(t)
        const breath = Math.sin(t + Math.PI / 3)
        btn.view.position.set(cx + sway * 12, cy + Math.sin(t + 0.6) * 6)
        btn.view.rotation = sway * 0.04
        btn.view.scale.set(1 + 0.05 * breath)
        bobRaf = requestAnimationFrame(bob)
      }
      bobRaf = requestAnimationFrame(bob)
      // 止め忘れると app.destroy 後も bob が回り、btn.view.position が null で落ちる。
      disposers.push(() => cancelAnimationFrame(bobRaf))

      const fit = () => {
        const w = host.clientWidth
        const h = host.clientHeight
        if (w <= 0 || h <= 0) return
        const box = letterbox(w, h)
        root.scale.set(box.scale)
        root.position.set(box.left, box.top)
      }
      fit()
      const ro = new ResizeObserver(fit)
      ro.observe(host)
      disposers.push(() => ro.disconnect())
    })()

    return () => {
      cancelled = true
      cleanup()
    }
  })
</script>

<div class="pixi-host" bind:this={host}></div>

<style>
  .pixi-host {
    position: absolute;
    inset: 0;
  }
  .pixi-host :global(canvas) {
    display: block;
  }
</style>
