# henohenon.github.io

Astro 移行待機中。`main` ブランチは現在ほぼ空（このREADMEと`.gitignore`のみ）。

## ステータス

- 旧 Rust + Strune 製 SSG をいったん撤去し、Astro で組み直す予定
- GitHub Pages デプロイは一時停止中（`.github/workflows/deploy.yml` は削除済み。Astro 構築時に再作成）

## 旧資産の所在

すべて同リポジトリ内のアーカイブブランチに退避済み。

| ブランチ | 内容 |
| --- | --- |
| `archive/strune` | Rust + Strune 製 SSG 版（直前の `main` をそのまま凍結） |
| `archive/ar` | WebAR 資産。`ar/henohenos/` 配下に `.blend` / `.glb` モデル、NFT マーカー、ビルド済 JS、`index.html` 一式 |
| `archive/local-main-tmp` | ローカル `main` に残っていた Hugo 時代の未 push 作業履歴（"tmp" 連発系）。念のため保全 |

復元したい場合は `git checkout archive/<name>` で中身が見られる。

## 次の予定

- Astro でブログ + ポートフォリオを再構築
- GitHub Actions のデプロイ設定を Astro 用に作り直す
