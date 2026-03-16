---
layout: default
title: Home
---

# Welcome

- 👤 [プロフィール](about.md)
- 🔭 [天体観測の記録](observation/index.md)
- 💻 技術ブログ
- 📝 日記・思考メモ
- 📚 [宇宙物理の勉強ノート](note\index.md)

## 最近の記事

{% for post in site.posts limit:5 %}

- [{{ post.title }}]({{ post.url }}) - {{ post.date | date: "%Y-%m-%d" }}
{% endfor %}
