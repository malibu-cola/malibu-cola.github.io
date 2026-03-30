# DESIGN.md — Space News ページ設計書

## 1. システム概要

### 目的

NASA・JAXA・ESA の公式 RSS フィードから新着ニュースを定期取得し、既存の Jekyll サイト（malibu-cola.github.io）の `/news` ページに自動表示する。

### 設計方針

- **既存サイトへの影響を最小化**: `_config.yml` の1行追記のみ。Jekyll テーマや既存ページには触れない
- **サーバーレス・無料**: GitHub Actions + GitHub Pages の無料枠で完結
- **シンプルな構成**: データ生成（Python）と表示（HTML/JS）を明確に分離する
- **拡張性**: `scripts/sources.yml` にソースを追記するだけで対応ソースを増やせる

---

## 2. アーキテクチャ

```
[GitHub Actions Cron: 毎朝 8:00 JST]
        |
        v
[scripts/fetch_news.py]
    ├── sources.yml を読み込む
    ├── 各 RSS フィードを取得・パース
    ├── 直近 50 件を published 降順でソート
    └── _data/news.json として出力
        |
        v
[git commit & push → main ブランチ]
        |
        v
[GitHub Pages が Jekyll を自動ビルド]
        |
        v
[news.md → /news ページとして公開]
    └── JavaScript が _data/news.json を fetch して記事カードを描画
```

---

## 3. ファイル設計

### 3.1 `scripts/sources.yml`

RSS ソースの設定ファイル。コードを変更せずにソースを管理できる。

```yaml
sources:
  - name: NASA
    url: https://www.nasa.gov/rss/dyn/breaking_news.rss
    color: "#0B3D91"
    enabled: true

  - name: JAXA
    url: https://www.jaxa.jp/rss/press.rss
    color: "#003087"
    enabled: true

  - name: ESA
    url: https://www.esa.int/rssfeed/Our_Activities/Space_Science
    color: "#003247"
    enabled: true
```

---

### 3.2 `scripts/fetch_news.py`

**責務**: RSS 取得 → パース → `_data/news.json` 生成

```python
# 主要な処理フロー
def main():
    sources = load_sources("scripts/sources.yml")
    articles = []
    for source in sources:
        if not source["enabled"]:
            continue
        items = fetch_feed(source)   # RSS取得・パース
        articles.extend(items)

    # published 降順でソートし、直近 50 件に絞る
    articles.sort(key=lambda x: x["published"], reverse=True)
    articles = articles[:50]

    save_json("_data/news.json", articles)
```

**`fetch_feed()` が返す記事オブジェクト**:

```python
{
    "title": str,        # 記事タイトル
    "link": str,         # 記事 URL
    "summary": str,      # 概要（HTMLタグ除去済み、200文字に切り詰め）
    "published": str,    # ISO 8601 形式 (例: "2025-03-15T12:00:00Z")
    "source": str,       # ソース名 ("NASA" / "JAXA" / "ESA")
    "color": str,        # ソース別カラー (例: "#0B3D91")
}
```

**注意点**:
- `feedparser` を使用してパース
- `summary` の HTML タグは `html.parser` で除去
- `published` が存在しない場合は現在時刻（UTC）を代替使用
- 取得タイムアウト: 10 秒
- 1 ソースの失敗は警告を出して他ソースの処理を継続する
- `_data/` ディレクトリが存在しない場合は自動作成する

---

### 3.3 `_data/news.json`

Actions が自動生成・更新する JSON ファイル。Jekyll の `_data/` に置くことで GitHub Pages からアクセス可能になる。

```json
[
  {
    "title": "NASA Discovers New Exoplanet",
    "link": "https://www.nasa.gov/...",
    "summary": "Astronomers have discovered...",
    "published": "2025-03-15T12:00:00Z",
    "source": "NASA",
    "color": "#0B3D91"
  },
  ...
]
```

**件数**: 最大 50 件（直近記事のみ保持）  
**更新頻度**: 毎朝 8:00 JST に上書き

---

### 3.4 `news.md`

Jekyll ページ本体。Front Matter で Jekyll に認識させ、HTML/JavaScript で `_data/news.json` を取得・描画する。

```markdown
---
layout: default
title: 気になるニュース
permalink: /news
---

<h1>🚀 気になる宇宙ニュース</h1>
<p>NASA・JAXA・ESA の最新情報を毎朝自動取得しています。</p>

<div id="news-container">読み込み中...</div>

<script>
// /news ページと同じオリジンなので fetch 可
fetch('/assets/data/news.json')    // ※ _data/ は Jekyll ビルド後に assets/data/ に配置
  .then(res => res.json())
  .then(articles => renderArticles(articles));

function renderArticles(articles) {
  const container = document.getElementById('news-container');
  container.innerHTML = articles.map(a => `
    <div class="news-card" style="border-left: 4px solid ${a.color};">
      <span class="news-source">${a.source}</span>
      <h3><a href="${a.link}" target="_blank">${a.title}</a></h3>
      <p>${a.summary}</p>
      <small>${formatDate(a.published)}</small>
    </div>
  `).join('');
}
</script>
```

> **⚠️ 注意**: Jekyll の `_data/` ディレクトリはビルド後に静的ファイルとして出力されない。
> GitHub Pages から JavaScript で fetch するには、`_data/news.json` を `assets/data/news.json` にも配置するか、
> Actions 側で両方に書き出す必要がある。→ 詳細は セクション 5 参照。

---

### 3.5 `_config.yml` の変更点

ナビゲーションメニューに `/news` を追加する。既存設定への追記のみ。

```yaml
# 変更前
header_pages:
  - about.md
  - observation/index.md
  - note/index.md

# 変更後
header_pages:
  - about.md
  - observation/index.md
  - note/index.md
  - news.md              # ← この1行を追加
```

---

## 4. GitHub Actions ワークフロー

### `.github/workflows/fetch_news.yml`

```yaml
name: Fetch Space News

on:
  schedule:
    - cron: '0 23 * * *'    # UTC 23:00 = JST 08:00
  workflow_dispatch:          # 手動実行も可能

jobs:
  fetch:
    runs-on: ubuntu-latest
    permissions:
      contents: write          # _data/news.json をコミットするために必要

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Fetch RSS and generate news.json
        run: python scripts/fetch_news.py

      - name: Commit and push if changed
        run: |
          git config user.name  "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add _data/news.json assets/data/news.json
          git diff --cached --quiet || git commit -m "chore: update news.json [skip ci]"
          git push
```

**`[skip ci]`** をコミットメッセージに付けることで、コミット自体が Actions を再トリガーするのを防ぐ。

---

## 5. `_data/` vs `assets/data/` 問題

Jekyll の `_data/` はテンプレート（Liquid）からはアクセスできるが、ビルド後の静的ファイルとして出力されない。JavaScript の `fetch()` で読み込むには静的ファイルとして公開されている必要がある。

### 解決策: `fetch_news.py` が両方に書き出す

```python
# fetch_news.py 内で2箇所に書き出す
save_json("_data/news.json", articles)          # Jekyll Liquid テンプレート用（将来の拡張）
save_json("assets/data/news.json", articles)    # JavaScript fetch() 用
```

`assets/data/` は Jekyll がそのまま静的ファイルとして公開するため、
`https://malibu-cola.github.io/assets/data/news.json` として JavaScript からアクセスできる。

---

## 6. データフロー詳細

```
1. GitHub Actions が cron で起動（毎朝 8:00 JST）
2. リポジトリを checkout
3. Python 依存パッケージをインストール
4. fetch_news.py を実行:
   a. sources.yml を読み込む
   b. 各 RSS フィードを取得・パース
   c. 全記事を published 降順でソート
   d. 上位 50 件を抽出
   e. _data/news.json と assets/data/news.json を上書き保存
5. git diff で変更があればコミット・push（新着がなければ push しない）
6. GitHub Pages が Jekyll を自動ビルド
7. /news にアクセスすると JavaScript が /assets/data/news.json を fetch して描画
```

---

## 7. エラー・例外方針

| シナリオ | 挙動 |
|---|---|
| RSS 取得タイムアウト | 警告ログ → そのソースをスキップ → 他ソースは継続 |
| RSS パースエラー | 警告ログ → そのソースをスキップ |
| 新着記事なし | JSON を更新しない（git diff で差分なし → push しない） |
| `assets/data/` ディレクトリ未存在 | スクリプト内で `os.makedirs()` により自動作成 |
| Actions の push 失敗 | GitHub Actions のログにエラーが記録される（次回実行で自動リカバリ） |

---

## 8. 将来の拡張案

- **キーワードフィルタ**: `sources.yml` にキーワードリストを追加し、重力波・系外惑星など特定トピックのみ表示する
- **日本語要約**: Claude API に summary を渡して日本語ダイジェストを生成する（現時点では保留）
- **Jekyll Liquid での静的描画**: JavaScript fetch なしに Liquid テンプレートで `site.data.news` を直接ループする構成（ページ読み込みが高速になる）
- **カテゴリフィルタ UI**: ソース別にフィルタできるボタンをページに追加する

---

## 9. 開発環境

```
Python     3.11+
feedparser 6.0+
PyYAML     6.0+
python-dateutil 2.8.2+
```

ローカルでの確認手順:

```bash
# 1. 依存インストール
pip install -r requirements.txt

# 2. JSON 生成（実際の RSS を取得する）
python scripts/fetch_news.py

# 3. Jekyll でプレビュー
jekyll serve --livereload
# → http://localhost:4000/news を確認
```
