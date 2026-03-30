# Malibu Cola Web

宇宙物理修士 × AIエンジニアの活動をまとめる GitHub Pages サイトです。Jekyll と公式テーマ `jekyll-theme-architect` を使って、観測記録や技術ブログ、ノート類を公開できます。

## 構成

```sh
.
├── index.md            # ランディングページ。最新記事一覧と主要リンクを表示
├── about.md            # プロフィール / 制作実績
├── observation/        # 観測ログの固定ページ
├── note/               # 勉強ノートの固定ページ
├── _posts/             # ブログ記事 (YYYY-MM-DD-title.md)
└── _config.yml         # テーマ・ナビゲーション設定
```

## ローカルプレビュー

1. Ruby (3.x 以上) と Bundler をインストール: `gem install bundler`.
2. プロジェクト直下で `bundle install` を実行し、依存 gem を導入。
3. `bundle exec jekyll serve --livereload` でローカルサーバーを起動。
4. ブラウザで <http://localhost:4000> を開き、変更を確認。

## デプロイ

メインブランチ (または GitHub Pages で指定したブランチ) に push すると、GitHub が自動でビルドし公開します。 `_config.yml` の `header_pages` にページを列挙することで、ナビゲーションメニューを制御できます。

## ノートブックの HTML 化

`notebook/` 配下の Jupyter Notebook (.ipynb) は、HTML に変換して `<iframe>` でノートページに埋め込む方式を採用しています。

1. ノートブックを開いてすべてのセルを実行し、出力を保存する。
2. プロジェクト直下の `.venv` に `nbconvert` が含まれているので、以下のコマンドで変換する。

   ```bash
   # Windows (PowerShell / コマンドプロンプト)
   .venv\Scripts\python.exe -m nbconvert --to html notebook/<notebook_name>.ipynb

   # Git Bash / WSL
   .venv/Scripts/python.exe -m nbconvert --to html notebook/<notebook_name>.ipynb
   ```

3. 生成された `notebook/<notebook_name>.html` をコミットする。
4. 対応するノートの Markdown ファイルに以下の `<iframe>` を追記する。

   ```html
   <iframe src="/notebook/<notebook_name>.html" width="100%" height="800" style="border:1px solid #ccc; border-radius:4px;"></iframe>
   ```

## クイズブロック (`quiz-block`)

ノートページに4択クイズを埋め込む機能です。選択肢をクリックすると正誤が表示され、解説も合わせて表示されます。問題文・選択肢・解説はすべて MathJax の数式 (`$...$` / `$$...$$`) に対応しています。

### 記法

Markdown 内に以下の HTML ブロックを記述します。

```html
<div class="quiz-block">
<script type="application/json">
{
  "question": "問題文。数式は $E = mc^2$ のように書けます。",
  "choices": [
    "選択肢A",
    "選択肢B（数式可: $v = H_0 d$）",
    "選択肢C",
    "選択肢D"
  ],
  "answer": 1,
  "explanation": "解説文。$$\\Delta E = h\\nu$$ のようにブロック数式も使えます。"
}
</script>
</div>
```

| フィールド    | 型       | 説明                             |
| ------------- | -------- | -------------------------------- |
| `question`    | string   | 問題文                           |
| `choices`     | string[] | 選択肢を4つ列挙                  |
| `answer`      | number   | 正解のインデックス（0始まり）    |
| `explanation` | string   | 正誤どちらの場合も表示される解説 |

### 数式を含む JSON の注意点

JSON 内ではバックスラッシュを `\\` とエスケープする必要があります。

| MathJax 記法  | JSON に書く文字列 |
| ------------- | ----------------- |
| `\frac{a}{b}` | `"\\frac{a}{b}"`  |
| `\log_{10}`   | `"\\log_{10}"`    |
| `\left(`      | `"\\left("`       |

`$...$` の `$` はエスケープ不要です。

---

## 執筆メモ

- 新しい記事は `_posts/YYYY-MM-DD-my-title.md` 形式で作成し、Front Matter に `layout: post` と `title`, `date` を指定。
- 固定ページを追加したい場合は、`about.md` と同様に Markdown ファイルを作り、必要に応じて `header_pages` に追記します。
