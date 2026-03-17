---
layout: default
title: Home
---

## Welcome

- 👤 [プロフィール](about.md)
- 🔭 [天体観測の記録](observation/index.md)
- 📚 [宇宙物理の勉強ノート](note/index.md)

## つぶやき

{% assign sorted_tweets = site.tweets | sort: "date" | reverse %}
{% for tweet in sorted_tweets %}

- [{{ tweet.title }}]({{ tweet.url }}) - {{ tweet.date | date: "%Y-%m-%d" }}

{% endfor %}
