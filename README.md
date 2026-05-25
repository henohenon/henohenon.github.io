# henohenon.github.io

> 毎朝、その日の Vocaloid シーンを Claude が読み取り、ブログのデザインを自動生成する。
> コンテンツは変わらないのに、サイトは毎日違う顔をしている。

訪れたタイミングの人だけが、その日のデザインを見る。

## コンセプト

- **非決定性は仕様** — 毎回違う出力であることが価値
- **記録は意図せず残る** — git history が唯一のアーカイブ
- **シンプルに保つ** — HTML / Astro は変えない、CSS だけで変化を表現

## アーキテクチャ

```
[ ローカル cron / launchd ]
        ↓
VocaDB API (直近30日の人気曲プール)
  → 過去未使用 × 歌詞あり を優先して 1 曲
        ↓
Claude CLI (claude -p)
  → src/styles/theme.css を上書き
  → src/data/theme-source.json を更新 (フッターの "theme by ..." 出典)
  → src/data/used-songs.json に追記 (blacklist)
        ↓
git push (main)
        ↓
GitHub Actions deploy.yml
  → Astro ビルド → GitHub Pages
```

HTML / Astro コンポーネントは触らない。`theme.css` の差し替えだけで日替わりの見た目を作る。

## スタック

Astro 5.x (SSG) / TypeScript / Claude Code CLI / Node 22 LTS / Biome / **bun**

## 使い方

```sh
bun install

bun run dev               # ローカル確認 (http://localhost:4321)
bun run build             # 静的ビルド
bun run check             # astro check (型)
bun run lint              # Biome
bun run format            # Biome (整形)

bun run generate-theme                          # 日次運用: 自動選曲 → CSS 生成
bun run generate-theme --song-id 1501           # 任意曲を ID で指定
bun run generate-theme --song "ローリンガール"  # クエリ検索の先頭ヒット
bun run generate-theme --help
```

`generate-theme` は `claude` バイナリ (Claude Code CLI) を子プロセス起動する。
PATH に通っていない場合は `CLAUDE_BIN` で上書き。詳細は [CLAUDE.md](CLAUDE.md) の
「generate-theme のバックエンド」節。

## ドキュメント

| ファイル | 内容 |
| --- | --- |
| [CLAUDE.md](CLAUDE.md) | AI エージェント向けプロジェクト規約 |
| [TODO.md](TODO.md) | 進行中・後回しタスク |
| [docs/vocadb-api.md](docs/vocadb-api.md) | VocaDB API 調査メモ |

## 旧資産の所在

| ブランチ | 内容 |
| --- | --- |
| `archive/strune` | 旧 Rust + Strune 製 SSG 版 |
| `archive/ar` | WebAR 資産 (`ar/henohenos/` 配下に `.blend` / `.glb` モデル、NFT マーカー、ビルド済 JS) |
| `archive/local-main-tmp` | Hugo 時代の未 push 作業履歴 |

復元したい場合は `git checkout archive/<name>` で中身が見られる。
