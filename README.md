# Malibu Cola Web

宇宙物理修士 × AIエンジニアの活動をまとめる GitHub Pages サイトです。Jekyll と公式テーマ `jekyll-theme-architect` を使って、観測記録や技術ブログ、ノート類を公開できます。

## 構成

```
.
├── index.md            # ランディングページ。最新記事一覧と主要リンクを表示
├── about.md            # プロフィール / 制作実績
├── observation/        # 観測ログの固定ページ
├── note/               # 勉強ノートの固定ページ
├── _posts/             # ブログ記事 (YYYY-MM-DD-title.md)
└── _config.yml         # テーマ・ナビゲーション設定
```

## ローカルプレビュー

1. Ruby (3.x 以上) と Bundler/Jekyll をインストール: `gem install bundler jekyll`.
2. プロジェクト直下で `jekyll serve --livereload`.
3. ブラウザで <http://localhost:4000> を開き、変更を確認。

※ グローバルに gem を入れたくない場合は、自分で `Gemfile` を追加し `bundle exec jekyll serve` を実行してください。

## デプロイ

メインブランチ (または GitHub Pages で指定したブランチ) に push すると、GitHub が自動でビルドし公開します。 `_config.yml` の `header_pages` にページを列挙することで、ナビゲーションメニューを制御できます。

## 執筆メモ

- 新しい記事は `_posts/YYYY-MM-DD-my-title.md` 形式で作成し、Front Matter に `layout: post` と `title`, `date` を指定。
- 固定ページを追加したい場合は、`about.md` と同様に Markdown ファイルを作り、必要に応じて `header_pages` に追記します。
