---
layout: default
title: 勉強ノート
---

## 勉強ノート

宇宙物理・科学計算の学習メモをしていきたい。

{% assign astro_pages = site.pages
   | where: "layout", "note_page"
   | where_exp: "p", "p.path contains 'note/astro-test1/'"
   | sort: "path" %}

{% assign cosmo_pages = site.pages
   | where: "layout", "note_page"
   | where_exp: "p", "p.path contains 'note/cosmology/'"
   | sort: "path" %}

<div class="note-card-grid">

  <div class="note-topic-card" onclick="noteToggleCard(this, event)">
    <div class="note-card-image grad-astro"></div>
    <div class="note-card-body">
      <div class="note-card-name">天文宇宙検定1級</div>
      <div class="note-toggle-area">
        <div class="note-toggle-header open">
          <span>記事一覧</span>
          <span class="note-toggle-arrow open">▶</span>
        </div>
        <div class="note-toggle-content open">
          <ul class="note-sub-list">
            {% for p in astro_pages %}
              {% assign rel = p.path | remove: "note/astro-test1/" %}
              {% unless rel contains "/" %}
            <li><a href="{{ p.url | relative_url }}" onclick="event.stopPropagation()">{{ p.title }}</a></li>
              {% endunless %}
            {% endfor %}
            <li><a href="{{ '/note/astro-test1/' | relative_url }}" onclick="event.stopPropagation()">→ 一覧ページへ</a></li>
          </ul>
        </div>
      </div>
    </div>
  </div>

  <div class="note-topic-card" onclick="noteToggleCard(this, event)">
    <div class="note-card-image grad-cosmo"></div>
    <div class="note-card-body">
      <div class="note-card-name">宇宙論</div>
      <div class="note-toggle-area">
        <div class="note-toggle-header">
          <span>記事一覧</span>
          <span class="note-toggle-arrow">▶</span>
        </div>
        <div class="note-toggle-content">
          <ul class="note-sub-list">
            {% for p in cosmo_pages %}
              {% assign rel = p.path | remove: "note/cosmology/" %}
              {% unless rel contains "/" %}
            <li><a href="{{ p.url | relative_url }}" onclick="event.stopPropagation()">{{ p.title }}</a></li>
              {% endunless %}
            {% endfor %}
            <li><a href="{{ '/note/cosmology/' | relative_url }}" onclick="event.stopPropagation()">→ 一覧ページへ</a></li>
          </ul>
        </div>
      </div>
    </div>
  </div>

</div>

{% include top_button.html %}
