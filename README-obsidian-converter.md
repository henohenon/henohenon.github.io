# Obsidian to Hugo Converter (TypeScript版)

このプロジェクトには、ObsidianのマークダウンファイルをHugo用に自動変換するTypeScript製の機能が含まれています。

## 機能

- **ウィキリンク変換**: Obsidianの `[[Page Name]]` 形式をHugoの `[Page Name](../page-name/)` 形式に変換
- **タグ処理**: Obsidianのハッシュタグ `#tag` をHugoのフロントマターに移動
- **フロントマター自動生成**: タイトル、日付、ドラフト状態を自動設定
- **日本語サイト対応**: Hugo設定に合わせた日付フォーマット
- **非破壊変換**: 元のObsidianファイルを変更せず、変換結果を`dist`ディレクトリに出力
- **TypeScript型安全性**: 完全な型定義による開発時エラー防止とIntelliSense サポート
- **モダンなコード**: ES2020対応、厳密な型チェック、JSDocコメント付き

## 使用方法

### 自動変換 (推奨)
```bash
npm run build
```
このコマンドは自動的にObsidianファイルを変換してからHugoサイトをビルドします。

### 手動変換のみ
```bash
npm run convert
```

### クリーンビルド
```bash
npm run build:clean
```

## 変換される内容

### Before (Obsidian形式)
```markdown
# My Note

This is a note with [[Another Note]] and [[Page Name|Custom Link Text]].

Tags: #blog #tutorial

Content here.
```

### After (Hugo形式)
```markdown
---
title: My Note
date: '2025-08-26T08:06:23.954Z'
draft: false
tags: [blog, tutorial]
---

This is a note with [Another Note](../another-note/) and [Custom Link Text](../page-name/).

Content here.
```

## 対応する変換

- ✅ ウィキリンク: `[[Page]]` → `[Page](../page/)`
- ✅ エイリアス付きリンク: `[[Page|Alias]]` → `[Alias](../page/)`
- ✅ ハッシュタグ: `#tag` → フロントマターの `tags`
- ✅ タイトル自動生成: ファイル名から生成
- ✅ 日付自動設定: 現在時刻をISO形式で設定

## TypeScript開発

### 利用可能なスクリプト

```bash
# TypeScriptファイルを直接実行 (推奨)
npm run convert

# TypeScriptをコンパイルしてから実行
npm run convert:js

# TypeScriptのみをコンパイル
npm run build:ts
```

### 型定義

プロジェクトには以下のTypeScript型定義が含まれています：

- `HugoFrontmatter`: Hugoフロントマターの型定義
- `TagExtractionResult`: タグ抽出結果の型定義
- `FrontmatterData`: 入力フロントマターデータの型定義
- `GrayMatterFile`: gray-matterライブラリの型定義

## ファイル構造

```
scripts/
└── obsidian-to-hugo.ts    # TypeScript変換スクリプト本体
tsconfig.json              # TypeScript設定ファイル
content/                   # Obsidianソースディレクトリ (元ファイル保存)
├── .obsidian/             # Obsidian設定 (変換対象外)
└── *.md                   # 変換元のマークダウンファイル
dist/                      # Hugo用変換済みファイル出力ディレクトリ
└── *.md                   # Hugo用に変換されたマークダウンファイル
```

## ワークフロー

このシステムは非破壊的な変換ワークフローを採用しています：

1. **ソース保護**: `content/` ディレクトリ内の元のObsidianファイルは一切変更されません
2. **変換処理**: TypeScriptスクリプトがObsidianファイルを読み取り、Hugo形式に変換
3. **出力**: 変換済みファイルを `dist/` ディレクトリに出力（ディレクトリ構造を保持）
4. **ビルド**: HugoはHugo設定（`contentDir: "dist"`）に従い、`dist/` ディレクトリからサイトをビルド

### メリット

- ✅ **安全性**: 元のObsidianファイルが保護され、データ損失のリスクがありません
- ✅ **柔軟性**: Obsidianでの編集作業に影響を与えません
- ✅ **クリーンな分離**: ソースファイルとビルド成果物が明確に分離されます
- ✅ **バージョン管理**: `.gitignore`で`dist/`を除外し、ソースのみを管理できます

## 注意事項

- `.obsidian` ディレクトリ内のファイルは変換されません
- 既存のフロントマターは保持され、新しい項目が追加されます
- `dist/` ディレクトリは変換時に自動的にクリーンアップされます