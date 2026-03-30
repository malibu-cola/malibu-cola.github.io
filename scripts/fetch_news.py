"""Fetch space news from RSS feeds and generate news.json."""

from __future__ import annotations

import html.parser
import json
import os
from datetime import datetime, timezone
from pathlib import Path

import feedparser
import yaml
from dateutil import parser as dateparser

REPO_ROOT = Path(__file__).resolve().parent.parent
SOURCES_PATH = REPO_ROOT / "scripts" / "sources.yml"
DATA_PATHS = [
    REPO_ROOT / "_data" / "news.json",
    REPO_ROOT / "assets" / "data" / "news.json",
]
MAX_ARTICLES = 50
FETCH_TIMEOUT = 10


class _HTMLStripper(html.parser.HTMLParser):
    """Strip HTML tags from a string."""

    def __init__(self) -> None:
        super().__init__()
        self._pieces: list[str] = []

    def handle_data(self, data: str) -> None:
        self._pieces.append(data)

    def get_text(self) -> str:
        return "".join(self._pieces)


def strip_html(text: str) -> str:
    stripper = _HTMLStripper()
    stripper.feed(text)
    return stripper.get_text()


def load_sources() -> list[dict]:
    with open(SOURCES_PATH, encoding="utf-8") as f:
        return yaml.safe_load(f)["sources"]


def fetch_feed(source: dict) -> list[dict]:
    """Fetch and parse a single RSS feed. Returns list of article dicts."""
    feed = feedparser.parse(source["url"], request_headers={"User-Agent": "malibu-cola-news/1.0"})

    if feed.bozo and not feed.entries:
        print(f"  WARNING: failed to parse {source['name']}: {feed.bozo_exception}")
        return []

    articles = []
    for entry in feed.entries:
        # Parse published date
        published = None
        for date_field in ("published", "updated"):
            raw = getattr(entry, date_field, None)
            if raw:
                try:
                    published = dateparser.parse(raw).astimezone(timezone.utc).isoformat()
                except (ValueError, OverflowError):
                    pass
                break
        if not published:
            published = datetime.now(timezone.utc).isoformat()

        # Build summary
        summary_raw = getattr(entry, "summary", "") or getattr(entry, "description", "") or ""
        summary = strip_html(summary_raw).strip()
        if len(summary) > 200:
            summary = summary[:197] + "..."

        articles.append(
            {
                "title": entry.get("title", "(no title)"),
                "link": entry.get("link", ""),
                "summary": summary,
                "published": published,
                "source": source["name"],
                "color": source.get("color", "#666"),
            }
        )

    print(f"  {source['name']}: {len(articles)} articles")
    return articles


def save_json(articles: list[dict]) -> None:
    for path in DATA_PATHS:
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(articles, f, ensure_ascii=False, indent=2)
        print(f"  Saved {path}")


def main() -> None:
    print("Loading sources...")
    sources = load_sources()

    all_articles: list[dict] = []
    for source in sources:
        if not source.get("enabled", True):
            print(f"  Skipping {source['name']} (disabled)")
            continue
        print(f"Fetching {source['name']}...")
        try:
            all_articles.extend(fetch_feed(source))
        except Exception as e:
            print(f"  WARNING: {source['name']} failed: {e}")

    # Sort by published date (newest first), limit to MAX_ARTICLES
    all_articles.sort(key=lambda x: x["published"], reverse=True)
    all_articles = all_articles[:MAX_ARTICLES]

    print(f"\nTotal: {len(all_articles)} articles")
    save_json(all_articles)
    print("Done.")


if __name__ == "__main__":
    main()
