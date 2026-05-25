# モーションとイージングの語彙

> アニメーション原理 / イージング関数 / 振付 (choreography)。
> 動きの "性格" を Claude に渡せる辞書。

---

## 1. Disney の 12 原理 (web 適用版)

アニメーションの古典原理。すべてが web に活かせるわけではないが、引き出しとして。

| 原理 | web 適用例 |
|---|---|
| **Squash & Stretch** | hover で要素が伸び縮み (ボタン押下) |
| **Anticipation** | クリック前にわずかに引く |
| **Staging** | 視線を引きたい要素にだけ動きを集中 |
| **Straight Ahead / Pose to Pose** | (制作プロセスの話、CSS では関係薄) |
| **Follow Through / Overlapping** | スクロール終わりの慣性、要素の遅延追従 |
| **Slow In / Slow Out (= ease)** | 自然な動きの基本 |
| **Arc** | 直線でなく弧を描く動き (translate + rotate) |
| **Secondary Action** | 主要な動きに付随する小さな動き (光彩・粒子) |
| **Timing** | 動きの速度で性格を決める |
| **Exaggeration** | わずかに誇張で印象に残す |
| **Solid Drawing** | (ドローイング話、関係薄) |
| **Appeal** | 動き自体が愛らしさを持つ |

---

## 2. イージング関数

### 標準
- **linear**: 等速、不自然、データ可視化以外で避ける
- **ease**: cubic-bezier(0.25, 0.1, 0.25, 1)、最も汎用
- **ease-in**: 始まり遅い→終わり速い、要素が "去る" 時に
- **ease-out**: 始まり速い→終わり遅い、要素が "現れる" 時に
- **ease-in-out**: 両端遅い、滑らかなトランジション

### Material Design 推奨
- **Standard**: cubic-bezier(0.4, 0.0, 0.2, 1)
- **Decelerate**: cubic-bezier(0.0, 0.0, 0.2, 1) — 出現
- **Accelerate**: cubic-bezier(0.4, 0.0, 1, 1) — 退出

### 感情を持ったカスタム
- **Bounce**: 跳ねる、cubic-bezier(0.68, -0.55, 0.265, 1.55)
- **Elastic**: ゴム的、`linear()` 関数で複雑に
- **Snap**: 一気にスナップ、ease-out 過激版

### linear() 関数 (CSS 仕様、2024+)
複雑なカーブを単純な線分で表現:
```css
animation-timing-function: linear(0, 0.5 25%, 0.8 50%, 1);
```
ゴム的、跳ねる動きを CSS だけで。

---

## 3. 持続時間 (duration)

- **100-200ms**: マイクロインタラクション (hover 等)、ほぼ "間" を感じない
- **200-400ms**: 標準的な UI 動き
- **400-700ms**: ちょっとドラマチック
- **700ms+**: 演出、エントリーアニメ
- **1s+**: アンビエント、装飾アニメ (loop)

### 法則
- 短い距離 → 短い duration
- 長い距離 → 長い duration (ただし上限 ~600ms)
- 連動する要素はずらす (staggered) ことで自然に

---

## 4. アニメーションの種類

### Entry (登場)
- fade in (`opacity: 0 → 1`)
- slide in (`transform: translateY(20px) → 0`)
- scale in (`transform: scale(0.95) → 1`)
- 文字単位 (typewriter, char-by-char fade)

### Exit (退場)
- fade out
- shrink
- slide out

### Transition (遷移)
- 状態 A → B の補間 (color, size, position 等)
- View Transitions API で複雑な遷移演出

### Ambient (常時)
- drift (微妙に揺れる)
- pulse (脈打つ)
- gradient shift (色がゆっくり変わる)

### Reactive (反応)
- hover で変化
- focus で枠が出る
- scroll に応じて変化 (animation-timeline)

### Micro-interaction
- button 押下時のリップル
- toggle 切替の補間
- 文字選択時の小さな反応

---

## 5. 振付 (choreography) パターン

### Staggered entry
```css
.item:nth-child(1) { animation-delay: 0ms; }
.item:nth-child(2) { animation-delay: 50ms; }
.item:nth-child(3) { animation-delay: 100ms; }
/* または CSS counter で動的に */
```

### Hero + cascade
最初の要素が大胆な動き、後続は控えめ

### Follow through
主要素が止まった後、付随要素が遅れて止まる

### Choreography curves
- 上下: 上から落ちる (gravity 感)
- 左右: 横スライド (本めくり感)
- 中央拡大: ズームイン
- 螺旋: rotate + translate

---

## 6. `prefers-reduced-motion` (重要)

### CSS で必ず対応
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

本プロジェクトでは theme.css に必須として既に含んでる。

### より丁寧な対応
完全に切るのではなく、減らす:
```css
@media (prefers-reduced-motion: reduce) {
  .ambient { animation: none; }  /* loop は切る */
  .entry { animation-duration: 0.1s; }  /* 短くする */
}
```

---

## 7. パフォーマンス

### GPU 加速の効くプロパティ
- `transform`
- `opacity`
- `filter` (一部)

### 避ける (重い)
- `width / height / top / left` の直接アニメ (layout 再計算)
- `box-shadow` の動的変化 (paint 再計算)
- `background-position` の連続変化 (paint)

### `will-change` ヒント
```css
.heavy { will-change: transform; }
```
ブラウザに「これは変化する」と教える。乱用注意。

---

## 8. 性格マッピング

| 動きの選択 | 性格 |
|---|---|
| 動きほぼなし / 100ms の控えめ hover | minimalist / editorial / 静謐 |
| ease-out / 200-300ms / fade | UI 標準 / 信頼感 |
| ease-in-out / 400-600ms / scale | 上品 / プレミアム |
| bounce / overshoot | playful / kawaii |
| ambient drift / pulse | 雰囲気重視 / リラックス |
| snap / 100ms / 強反応 | brutalist / 力強い |
| typewriter / glitch | terminal / cyberpunk |
| 重ね合わせ / staggered | editorial / 振付的 |

---

## 9. 本プロジェクト視点

### 現状
- 既存テーマで hover 反応や ambient な軽い動きが使われてる
- prefers-reduced-motion ブロックは必須として規約化済

### 棚卸時の確認
- system prompt で easing curve や duration の語彙を Claude に渡せてるか
- 「動きを足さない日があってもいい」(静けさも表現) が prompt にあるか
- (catalog 整理後) inspiration として上の Disney 原理 / 振付パターンを Claude に提示できるか

---

## Sources

- [12 Principles of Animation — Disney/web adaptation](https://www.smashingmagazine.com/2018/12/inspired-design-decisions-pressing-matters/)
- [Material Design — Motion](https://m3.material.io/styles/motion/overview)
- [Easing Functions — Easings.net](https://easings.net/)
- [CSS linear() — web.dev](https://developer.chrome.com/blog/css-linear-easing-function)
- [prefers-reduced-motion — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [View Transitions — web.dev](https://developer.chrome.com/docs/web-platform/view-transitions)
