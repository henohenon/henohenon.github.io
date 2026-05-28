# 入力データの語彙 — VocaDB から来るもの

> Claude に渡る前段の "原料" の辞書。
> `docs/vocadb-api.md` は実装メモ (どう叩くか)、こちらは **設計者がデータの解像度を上げる** ためのリサーチ。
> 「曲を信じる」という原則は、ここの解像度に乗っかっている。

---

## 1. 現状 prompt に流し込んでいるフィールド

[scripts/generate-theme.ts](../../scripts/generate-theme.ts) の `buildUserMessage` が組む実体は次の通り:

```
# 今日の曲
{name} / {artistString}

## 歌詞 (抜粋)
{ja → en → first} の歌詞、1500 文字で切詰め

## 補助タグ (参考程度)
{tag.name} を 15 個まで, comma 区切り
```

つまり Claude が "曲を読む" 材料はこの 3 ブロック + 内部知識のみ。

---

## 2. 各フィールドの語彙

### `name` (曲名)
- 漢字 / ひらがな / カタカナ / 英字 / 記号混在が普通
- 括弧書きで副題が付くことも (`「○○」` / `(short ver.)` 等)
- 同名曲を別アーティストがカバーしていることがある (今は `Original` フィルタで除外)

**設計上の含意**: 曲名は **1 行で世界観を出す** 入力。短いがフォントや配色の方向を決める力が大きい。Claude にとって最も "見やすい" 入力。

### `artistString` (アーティスト表記)
- VocaDB が組み立てた string。`feat.`, `,`, `&` で複数を連結
- 典型: `wowaka feat. 初音ミク` / `DECO*27, GUMI` / `kemu feat. 鏡音リン, 鏡音レン`
- **作曲者 (Producer) と ボーカル (Vocaloid キャラ) が混じる** が、構造化はされていない (string そのまま)

**設計上の含意**: ここから "誰が歌うか" (= キャラ色の引き出し、[vocaloid-aesthetic.md](vocaloid-aesthetic.md) §4) を引き出せるが、現状は string パースしていない。Claude が string から推測する形 (= 不安定だが自由)。

### `tags` (補助タグ)
- VocaDB ユーザーが付与する語彙集合 (ジャンル / ムード / 楽器 / 関連作品 / 言語)
- `categoryName` で大別される: `Genres` / `Vocalists` / `Lyrics` / `Subjective` / `Themes` / `Distribution` / `Copyrights` 等
- 現状 prompt には `tag.name` だけ流し込み、`categoryName` は捨てている

**categoryName を捨てる影響**:
- `rock` と `Hatsune Miku` と `Japanese` が同じ重みで並ぶ
- "ボーカル指定" と "ジャンル指定" が見分けられない
- "ムード" と "テーマ" が見分けられない

**設計上の含意**: ここは現状の "情報の解像度を下げている" 箇所。`categoryName` でグルーピングして渡せば Claude の判断材料が増える。ただし「タグに引っ張られない」原則と緊張する (詰めすぎは逆効果)。

### `lyrics` (歌詞)
- `cultureCodes` で多言語: `ja` / `en` / `zh` / `ha` (Hepburn ローマ字) / `ko` 他
- 現状は `ja → en → first` で 1 言語だけ採用、1500 文字で切詰め
- 歌詞未登録曲も多い (`fresh+lyrics` → `stale+lyrics` → `fresh-no-lyrics` の fallback が組まれている理由)

**設計上の含意**: 歌詞は **一次情報** (タグはユーザー編集の二次)。`Hepburn (ha)` を活用すると、Claude が音韻まで読める可能性 (ただし現状未利用)。

### `ratingScore`
- 選曲時のソートキーに使うのみ。prompt には流れない
- 値そのものに表現上の意味はない (人気度 = テーマの強度には変換していない)

---

## 3. 取れていない / 取りに行っていないフィールド

VocaDB API は他にも返せる:

| フィールド | 何が取れるか | 表現上の利用余地 |
|---|---|---|
| `mainPicture.urlOriginal` | サムネ画像 URL | カラーパレット抽出。`docs/vocadb-api.md` で言及あるが未実装 |
| `albums` | 収録アルバム | アルバムジャケットの世界観・季節感の引き出し |
| `pvs` | YouTube/Nico 動画 URL | 視覚演出の参照 (現状不要) |
| `relatedSongs` | 関連曲 | "似た曲の系統" のヒント |
| `originalVersion` | カバー元の曲 (アレンジ系) | 現状 `Original` フィルタで弾いている |
| `publishDate` | 公開日 | 曲の "新しさ" (季節 / 年代の連想に使える) |
| `lengthSeconds` | 曲長 | テンポ感 (短い = pop / 長い = 物語的) の弱いヒント |

### 取らないと決まっているもの (含意あり)
- **MainPicture を取り込まない理由**: 著作権 + "曲を信じる" 原則 (ジャケットに引っ張られない) のバランス。現状の判断は decisions.md にはなく、将来の議論余地あり

---

## 4. "曲を信じる" の構造的根拠

[decisions.md](../decisions.md) `選曲: ブラックリスト方式 + 歌詞優先 + 曲を信じる` より:

> 曲名・歌詞が一次情報、タグは編集者によるラベルにすぎない

つまり一次/二次の階層がある:
- **一次** (作品由来): `name` / `lyrics`
- **二次** (編集者由来): `tags` / `categoryName`
- **派生** (利用者由来): `ratingScore`

prompt の "補助タグ (参考程度)" 表記はこの階層を Claude に伝えるための言い回し。

### 含意
- 歌詞欠落時の `stale+lyrics` (過去ピック済の再利用) は **歌詞を優先するなら正しい順序**
- もし将来「タグだけで決まる日」を許すと、この階層が崩れる

---

## 5. 入力データ→デザインの "翻訳" 経路 (現状の暗黙の流れ)

```
name        ────────┐
artistString ───────┤   Claude が読む
lyrics (1 言語) ────┤  (system prompt + 内部知識のみ補助)
tags (15 個, name のみ) ─┘
                      ↓
              theme.css (色 / フォント / 余白 / 装飾 / モーション)
```

注:
- 翻訳の "辞書" は外から渡していない (= [vocaloid-aesthetic.md](vocaloid-aesthetic.md) の対応表は **まだ prompt に流していない**)
- Claude の "内部知識" に依存 → ボカロ文化の解像度は Claude モデル次第

---

## 6. 棚卸時の確認ポイント

- `tag.categoryName` を構造化して渡すか (= 解像度 vs 詰め込み の判断)
- 歌詞を 2 言語以上渡すか (`ja` + `ha` で音韻含めて読ませる)
- `publishDate` / `lengthSeconds` を渡すか (= "曲のメタ" の追加が表現に効くか)
- `mainPicture` を著作権配慮のうえで採るか (パレット抽出だけなら影響小?)
- 「曲を信じる」原則が prompt 上で再現できているか (タグの "参考程度" 文言の効き)

---

## 7. 関連

- [docs/vocadb-api.md](../vocadb-api.md) — エンドポイント / 取得方法の実装メモ
- [vocaloid-aesthetic.md](vocaloid-aesthetic.md) — name/artistString から引き出せる視覚語彙
- [prompt-and-generation.md](prompt-and-generation.md) — これらをどう Claude に渡すか
- [../decisions.md](../decisions.md) — 「曲を信じる」決定の経緯

---

## Sources

- [VocaDB API Swagger UI](https://vocadb.net/swagger/index.html)
- [VocaDB — About Tags](https://wiki.vocadb.net/wiki/30/about-tags)
- [scripts/generate-theme.ts](../../scripts/generate-theme.ts) (内部実装)
