---
layout: default
title: Home
---

## Welcome

- 👤 [プロフィール](about.md)
- 🔭 [天体観測の記録](observation/index.md)
- 📚 [宇宙物理の勉強ノート](note/index.md)

## つぶやき

{% for post in site.posts %}

- [{{ post.title }}]({{ post.url }}) - {{ post.date | date: "%Y-%m-%d" }}
{% endfor %}
