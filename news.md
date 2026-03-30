---
layout: default
title: 気になるニュース
permalink: /news
---

<h1>気になる宇宙ニュース</h1>
<p>NASA・sorae・ESA の最新情報を毎朝自動取得しています。</p>

<!-- ===== Launch Schedule ===== -->
<h2>打ち上げスケジュール</h2>

{% if site.data.launches and site.data.launches.size > 0 %}
<div class="launches-container">
  {% for l in site.data.launches %}
  <div class="launch-card" data-net="{{ l.net }}">
    <div class="launch-card-main">
      <div class="launch-countdown">--</div>
      <div class="launch-info">
        <h3 class="launch-name">{{ l.name }}</h3>
        <div class="launch-meta">
          <span class="launch-provider">{{ l.provider }}</span>
          {% if l.location != "" %}<span class="launch-location">{{ l.location }}</span>{% endif %}
        </div>
        <div class="launch-time">{{ l.net | date: "%Y-%m-%d %H:%M UTC" }}</div>
      </div>
      <span class="launch-status {% if l.status == 'Go' %}launch-status-go{% elsif l.status == 'TBC' %}launch-status-tbc{% else %}launch-status-tbd{% endif %}">{{ l.status }}</span>
    </div>
  </div>
  {% endfor %}
</div>
{% else %}
<p class="news-empty">打ち上げ情報がありません。</p>
{% endif %}

<!-- ===== News ===== -->
<h2>最新ニュース</h2>

{% if site.data.news and site.data.news.size > 0 %}
{% assign sources = site.data.news | map: "source" | uniq %}
<div class="news-filter">
  <button class="news-filter-btn active" data-source="all">All</button>
  {% for s in sources %}
  <button class="news-filter-btn" data-source="{{ s }}">{{ s }}</button>
  {% endfor %}
</div>

<div id="news-container" class="news-container">
  {% for a in site.data.news %}
  <div class="news-card" data-source="{{ a.source }}" style="border-left: 4px solid {{ a.color }};">
    <div class="news-card-header">
      <span class="news-source" style="background:{{ a.color }};">{{ a.source }}</span>
      <small class="news-date">{{ a.published | date: "%Y-%m-%d" }}</small>
    </div>
    <h3 class="news-title"><a href="{{ a.link }}" target="_blank" rel="noopener">{{ a.title }}</a></h3>
    {% if a.summary != "" %}<p class="news-summary">{{ a.summary }}</p>{% endif %}
  </div>
  {% endfor %}
</div>
{% else %}
<p class="news-empty">ニュースがありません。</p>
{% endif %}

<script>
// --- Filter buttons ---
(function () {
  var filterBar = document.querySelector('.news-filter');
  if (!filterBar) return;
  var container = document.getElementById('news-container');
  var cards = container.querySelectorAll('.news-card');

  filterBar.addEventListener('click', function (e) {
    if (!e.target.classList.contains('news-filter-btn')) return;
    filterBar.querySelectorAll('.news-filter-btn').forEach(function (b) {
      b.classList.remove('active');
    });
    e.target.classList.add('active');
    var source = e.target.getAttribute('data-source');
    cards.forEach(function (card) {
      card.style.display = (source === 'all' || card.getAttribute('data-source') === source) ? '' : 'none';
    });
  });
})();

// --- Launch countdown (live update) ---
(function () {
  function updateCountdowns() {
    var cards = document.querySelectorAll('.launch-card[data-net]');
    var now = new Date();
    cards.forEach(function (card) {
      var net = new Date(card.getAttribute('data-net'));
      var diff = net - now;
      var el = card.querySelector('.launch-countdown');
      if (diff < 0) { el.textContent = 'Launched'; return; }
      var days = Math.floor(diff / 86400000);
      var hours = Math.floor((diff % 86400000) / 3600000);
      if (days > 0) { el.textContent = 'T-' + days + 'd ' + hours + 'h'; return; }
      var mins = Math.floor((diff % 3600000) / 60000);
      el.textContent = 'T-' + hours + 'h ' + mins + 'm';
    });
  }
  updateCountdowns();
  setInterval(updateCountdowns, 60000);
})();
</script>
