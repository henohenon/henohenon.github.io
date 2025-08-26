# Henohenon's Blog

Hugo PaperModテーマを使用したパーソナルブログです。

## セットアップ

### 前提条件

- Hugo Extended version (0.128.0以上推奨)
- Git

### ローカル開発

1. リポジトリをクローン:
```bash
git clone https://github.com/henohenon/henohenon.github.io.git
cd henohenon.github.io
```

2. サブモジュール（PaperModテーマ）を初期化:
```bash
git submodule update --init --recursive
```

3. 開発サーバーを起動:
```bash
hugo server -D
```

4. ブラウザで `http://localhost:1313` にアクセス

### 新しい記事を作成

```bash
hugo new posts/新しい記事.md
```

### ビルド

```bash
hugo
```

## GitHub Pages デプロイメント

このサイトは GitHub Actions を使用して自動的にデプロイされます。

### 初回セットアップ

1. GitHubリポジトリの設定で、Pages設定を開く
2. Source を "GitHub Actions" に設定
3. メインブランチにプッシュすると自動的にデプロイされます

## 技術スタック

- **Hugo**: 静的サイトジェネレーター
- **PaperMod**: Hugoテーマ
- **GitHub Pages**: ホスティング
- **GitHub Actions**: CI/CD

## カスタマイズ

サイトの設定は `config.yml` で変更できます。詳細な設定については [PaperMod ドキュメント](https://github.com/adityatelange/hugo-PaperMod) を参照してください。

## ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。