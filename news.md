---
layout: default
title: 気になるニュース
permalink: /news
---

<h1>気になる宇宙ニュース</h1>
<p>NASA・JAXA・ESA の最新情報を毎朝自動取得しています。</p>

<div id="news-filter" class="news-filter">
  <button class="news-filter-btn active" data-source="all">All</button>
</div>

<div id="news-container" class="news-container">
  <p class="news-loading">読み込み中...</p>
</div>

<script>
(function () {
  var container = document.getElementById('news-container');
  var filterBar = document.getElementById('news-filter');
  var articles = [];

  function formatDate(iso) {
    var d = new Date(iso);
    var y = d.getFullYear();
    var m = ('0' + (d.getMonth() + 1)).slice(-2);
    var day = ('0' + d.getDate()).slice(-2);
    return y + '-' + m + '-' + day;
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function render(filter) {
    var filtered = filter === 'all'
      ? articles
      : articles.filter(function (a) { return a.source === filter; });

    if (filtered.length === 0) {
      container.innerHTML = '<p class="news-empty">記事が見つかりませんでした。</p>';
      return;
    }

    container.innerHTML = filtered.map(function (a) {
      return '<div class="news-card" style="border-left: 4px solid ' + a.color + ';">'
        + '<div class="news-card-header">'
        + '<span class="news-source" style="background:' + a.color + ';">' + escapeHtml(a.source) + '</span>'
        + '<small class="news-date">' + formatDate(a.published) + '</small>'
        + '</div>'
        + '<h3 class="news-title"><a href="' + escapeHtml(a.link) + '" target="_blank" rel="noopener">' + escapeHtml(a.title) + '</a></h3>'
        + (a.summary ? '<p class="news-summary">' + escapeHtml(a.summary) + '</p>' : '')
        + '</div>';
    }).join('');
  }

  function buildFilterButtons(data) {
    var sources = [];
    data.forEach(function (a) {
      if (sources.indexOf(a.source) === -1) sources.push(a.source);
    });
    sources.forEach(function (s) {
      var btn = document.createElement('button');
      btn.className = 'news-filter-btn';
      btn.setAttribute('data-source', s);
      btn.textContent = s;
      filterBar.appendChild(btn);
    });
  }

  filterBar.addEventListener('click', function (e) {
    if (!e.target.classList.contains('news-filter-btn')) return;
    filterBar.querySelectorAll('.news-filter-btn').forEach(function (b) {
      b.classList.remove('active');
    });
    e.target.classList.add('active');
    render(e.target.getAttribute('data-source'));
  });

  fetch('/assets/data/news.json')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      articles = data;
      buildFilterButtons(data);
      render('all');
    })
    .catch(function () {
      container.innerHTML = '<p class="news-empty">ニュースの読み込みに失敗しました。</p>';
    });
})();
</script>
