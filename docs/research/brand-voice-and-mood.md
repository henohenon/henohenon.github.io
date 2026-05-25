# ブランドの声 (voice) と ムード

> ブランド人格をどう言語化するか / ムードを設計に翻訳する原理。
> DESIGN.md の Overview セクション (= 全体の "顔") に対応する辞書。

---

## 1. ブランド人格 (brand personality)

Jennifer Aaker の 5 つの次元 (古典):

| 次元 | 例示形容詞 |
|---|---|
| **Sincerity** (誠実) | down-to-earth, honest, wholesome, cheerful |
| **Excitement** (興奮) | daring, spirited, imaginative, up-to-date |
| **Competence** (有能) | reliable, intelligent, successful |
| **Sophistication** (洗練) | upper class, charming |
| **Ruggedness** (頑健) | outdoorsy, tough |

ブランドはこれらをミックスして個性を作る。

### 個人サイト = "personal brand"
- 商業ブランドの規範を縮小したもの、より個人的・実験的になれる
- 本プロジェクトのブランドは ≈ "へのへのんのの" という個人ペルソナ

---

## 2. Voice (語り口)

ブランドの "口調" を定義する軸:

| 軸 | 端1 ⇄ 端2 |
|---|---|
| Formal ⇄ Casual | 敬語 ⇄ ため口 |
| Serious ⇄ Playful | 真面目 ⇄ 遊び心 |
| Respectful ⇄ Irreverent | 礼儀正 ⇄ ぶっきらぼう |
| Matter-of-fact ⇄ Enthusiastic | 淡々 ⇄ 熱量高い |

これらは "言葉遣い" のことだが、デザインにも反映される:
- Casual → 手描き / 親しみ
- Serious → editorial / minimalist
- Playful → カラフル / 不規則 / 動き多め
- Matter-of-fact → 装飾少 / 整然

### 本プロジェクトでの voice
- "毎日違う顔"、儚さ、ノンディタミニズム = "実験的・遊び心ある・少しメランコリック"
- README の言葉遣い ("着替えてもらった", "ここには何もない", "儚さ")

---

## 3. Mood (気分・雰囲気)

Voice は安定した個性、Mood は状況・コンテンツに応じて変わる感情の温度。

### Mood の語彙 (形容詞ベース)
- 静謐 / 騒がしい
- 暖かい / 冷たい
- 軽い / 重い
- 明るい / 暗い
- 希望的 / 絶望的
- ノスタルジック / 未来的
- 内省的 / 外向的
- 整然 / 混沌
- 上品 / 粗野
- 真剣 / ふざけた
- 神秘的 / 透明
- 親密 / よそよそしい

### Mood を引き出す要素 (デザイン側)
- 色 (暖色 ⇄ 寒色 / 高彩度 ⇄ 低彩度)
- フォント (serif ⇄ sans / display ⇄ body)
- 余白 (詰める ⇄ ゆったり)
- 装飾密度 (装飾過剰 ⇄ minimalist)
- モーション (静 ⇄ 活発)
- 形 (角丸 ⇄ シャープ)

---

## 4. Mood → デザイン語彙の翻訳

### マッピング例
| Mood (曲) | 翻訳されるデザイン語彙 |
|---|---|
| 静謐 / 内省 | 余白多 / 単色 / serif / 1 カラム / 動き極小 |
| ノスタルジック / 温かい | アースカラー / serif / hand-drawn 装飾 / 紙質感 |
| 力強い / 攻撃的 | 黒+1色 / 大文字 / 太罫線 / 詰めない grid |
| 未来的 / 機械的 | 寒色 / mono font / glow / 直線 |
| カラフル / ポップ | 高彩度 3-4 色 / 不規則 grid / 装飾多 |
| 神秘的 / 夢的 | 暗色 + ハイライト / serif / 不均一 / グラデ |
| 切実 / 緊張 | 高 contrast / シャープ角 / 詰めた typography |
| 軽やか / 戯れ | 明るい / 丸い / 余白あり / 動きやや多め |
| 沈鬱 / 重い | 黒基調 / 重い影 / 詰めた行間 / 大判タイポ |
| 透明 / 清潔 | 白 + パステル 1 色 / 細い線 / 余白多 |

### Translation の精度を上げる方法
- 曲の歌詞キーワードから連想を引き出す
- ボーカル特性 (キャラ別) から色を引き出す
- ジャンル (ボカロロック / 鬱ボカロ等) から包括的視覚言語を引き出す

(詳細は [vocaloid-aesthetic.md](vocaloid-aesthetic.md) 参照)

---

## 5. Mood Board の作り方

伝統的なデザイン手法だが、AI 生成にも応用可能:

1. **キーワード抽出** (曲名 / 歌詞 / タグから 5-10 語)
2. **色のテーマ** (3-5 色)
3. **典型イメージ** (連想する物・場所・時代)
4. **書体イメージ** (どんなフォントが合うか)
5. **避けたいもの** (この曲には合わないもの)

これは Claude の system prompt として渡せる構造でもある:
```
今日の曲のキーワード: 海, 便箋, 距離, 待つ, 届く
色のテーマ: クリーム / 朱 / 紺 (airmail 配色)
連想: 紙, 切手, 古い手紙, 静かな朝
書体: serif (筆記体寄り), 落ち着いた weight
避けたい: neon, 角張った形, グリッチ
```

---

## 6. Do's and Don'ts (DESIGN.md の重要セクション)

### 良いガードレールの書き方
- 短く / 具体的
- "Why" を添える
- 例を見せる

### 本プロジェクトのガードレール例
**Do:**
- WCAG AA のコントラストを意識
- 日本語システムフォントを `--font-body` に含める
- `prefers-reduced-motion` ブロックを必ず含める
- "曲を信じる" (タグより歌詞 / タイトル)
- 「静けさも表現」(装飾を足さない選択も価値)

**Don't:**
- HTML 構造の変更を前提とするセレクタ
- 外部リソースの `@import`
- `!important` の濫用
- 音の自動再生
- 過去テーマの可視化 (儚さ原則違反)

---

## 7. ブランドの一貫性 vs 変化

本プロジェクトの特殊性:

### 一貫しているもの (= ブランド core)
- サイト名 "へのへのんのの"
- 個人サイト・実験性
- 儚さ原則
- 静かで壊れにくい志向
- 表現の自由度

### 変化していいもの (= mood の振れ幅)
- 色 / フォント / レイアウト / 装飾 / モーション
- 雰囲気 (mood ラベルで表現可能)

### 変化させない vs 変化させる の境界
- ブランド core を侵すレベルの変化は禁則 (例: HTML 構造、URL 設計)
- それ以外は Claude の自由

これは "voice は安定、mood は変化" という古典原則の応用。

---

## 8. AI 向けに articulate する難しさ

### 言語化の壁
- 「上品」を AI に理解させるのは難しい
- 形容詞より具体的サンプルが効く ("Bodoni のような")
- 反例も有効 ("Helvetica は避ける")

### 構造化のメリット
- DESIGN.md の YAML + Markdown は、形容詞 + token の両方を持てる
- Claude が判断する時に "なぜこの選択か" の根拠を得やすい

---

## 9. 本プロジェクト視点

### 現状の表現
- system prompt に "へのへのんのの" の文脈や原則が散文で書かれてる
- 形式化されてない (DESIGN.md のような構造はない)
- mood ラベルは theme.css のコメントに書かれてる (footer に出す予定が E1 task)

### 棚卸時の確認
- system prompt の "ブランド人格" 部分が明確か
- "do's and don'ts" がリストされてるか
- mood translation の引き出しを Claude に渡せてるか
- voice (一貫してる部分) と mood (変化する部分) の区別が明示されてるか

---

## Sources

- [Jennifer Aaker — Brand Personality Framework](https://www.researchgate.net/publication/247978257_Dimensions_of_Brand_Personality)
- [DESIGN.md — Overview section spec](https://github.com/google-labs-code/design.md/blob/main/docs/spec.md)
- [Refactoring UI — Personality, hierarchy, voice](https://www.refactoringui.com/)
- [Mailchimp Content Style Guide — Voice and Tone](https://styleguide.mailchimp.com/voice-and-tone/) (古典的好例)
