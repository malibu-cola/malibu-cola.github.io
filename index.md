---
layout: default
title: Home
---

# Welcome

宇宙物理修士 × AIエンジニアの個人サイトです。

- [プロフィールと制作実績を見る](about.md)
- [観測ノートへ移動](observation/index.md)

- 🔭 天体観測の記録
- 💻 技術ブログ
- 📝 日記・思考メモ
- 📚 宇宙物理の勉強ノート

## 最近の記事

{% for post in site.posts limit:5 %}
- [{{ post.title }}]({{ post.url }}) - {{ post.date | date: "%Y-%m-%d" }}
{% endfor %}
