# 🚀 Space News — malibu-cola.github.io 追加機能

NASA / JAXA / ESA の最新ニュースを毎朝自動取得し、GitHub Pages サイトの `/news` ページに表示する。

GitHub Actions が RSS を取得して `_data/news.json` を生成・コミットし、Jekyll ページが JavaScript でレンダリングする構成。

---

## 概要

- **取得元**: NASA・JAXA・ESA の公式 RSS フィード
- **表示先**: `https://malibu-cola.github.io/news`
- **実行環境**: GitHub Actions（同リポジトリ内、無料枠）
- **言語**: Python 3.11+
- **実行頻度**: 毎朝 8:00 JST（設定変更可）
- **既存サイト**: Jekyll + `jekyll-theme-architect`（変更なし）

---

## 追加するファイル一覧

```
malibu-cola.github.io/
├── .github/
│   └── workflows/
│       └── fetch_news.yml       # 追加: GitHub Actions ワークフロー
├── _data/
│   └── news.json                # 追加: Actions が自動生成・更新するデータファイル
├── scripts/
│   ├── fetch_news.py            # 追加: RSS取得・JSON生成スクリプト
│   └── sources.yml              # 追加: RSSソース設定
├── news.md                      # 追加: /news ページ（Jekyll）
├── _config.yml                  # 変更: header_pages に news.md を追記
└── requirements.txt             # 追加: Python 依存パッケージ
```

既存ファイルへの変更は `_config.yml` の1行追記のみ。

---

## セットアップ

### 1. リポジトリをクローン

```bash
git clone https://github.com/malibu-cola/malibu-cola.github.io.git
cd malibu-cola.github.io
```

### 2. Python 依存パッケージをインストール（ローカル確認用）

```bash
pip install -r requirements.txt
```

### 3. Actions の書き込み権限を確認

リポジトリの `Settings` → `Actions` → `General` → `Workflow permissions`
→ **「Read and write permissions」** を選択して保存

（Actions が `_data/news.json` をコミットするために必要）

### 4. ローカルでの動作確認

```bash
# スクリプトを手動実行して _data/news.json が生成されるか確認
python scripts/fetch_news.py

# Jekyll でプレビュー
jekyll serve --livereload
# → http://localhost:4000/news を開く
```

### 5. push してデプロイ

```bash
git add .
git commit -m "feat: add space news page"
git push
```

push 後は GitHub Actions が毎朝 8:00 JST に自動実行される。
手動実行は Actions タブ → `Fetch Space News` → `Run workflow`。

---

## 依存パッケージ

```
feedparser>=6.0.0
PyYAML>=6.0
python-dateutil>=2.8.2
```

---

## ライセンス

MIT
