"""Fetch space news from RSS feeds and upcoming launches from Launch Library 2."""

from __future__ import annotations

import html.parser
import json
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

import feedparser
import yaml
from dateutil import parser as dateparser

REPO_ROOT = Path(__file__).resolve().parent.parent
SOURCES_PATH = REPO_ROOT / "scripts" / "sources.yml"
NEWS_JSON = REPO_ROOT / "_data" / "news.json"
LAUNCHES_JSON = REPO_ROOT / "_data" / "launches.json"
MAX_ARTICLES = 50
MAX_LAUNCHES = 15
FETCH_TIMEOUT = 10
LL2_API_URL = f"https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit={MAX_LAUNCHES}&mode=list"


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


def save_json(data: list[dict], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  Saved {path}")


# --- Launch Library 2 ---

def fetch_launches() -> list[dict]:
    """Fetch upcoming launches from Launch Library 2 API."""
    req = urllib.request.Request(LL2_API_URL, headers={"User-Agent": "malibu-cola-news/1.0"})
    with urllib.request.urlopen(req, timeout=FETCH_TIMEOUT) as resp:
        data = json.loads(resp.read().decode("utf-8"))

    launches = []
    for item in data.get("results", []):
        status = item.get("status") or {}
        launches.append(
            {
                "name": item.get("name", ""),
                "net": item.get("net", ""),
                "status": status.get("abbrev", "TBD") if isinstance(status, dict) else "TBD",
                "status_name": status.get("name", "To Be Determined") if isinstance(status, dict) else "To Be Determined",
                "provider": item.get("lsp_name", ""),
                "location": item.get("location", "") if isinstance(item.get("location"), str) else (item.get("location", {}) or {}).get("name", ""),
                "image": item.get("image", "") or "",
            }
        )

    print(f"  Launches: {len(launches)} upcoming")
    return launches


def main() -> None:
    # --- News (RSS) ---
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

    all_articles.sort(key=lambda x: x["published"], reverse=True)
    all_articles = all_articles[:MAX_ARTICLES]

    print(f"\nTotal: {len(all_articles)} articles")
    save_json(all_articles, NEWS_JSON)

    # --- Launches (Launch Library 2) ---
    print("\nFetching upcoming launches...")
    try:
        launches = fetch_launches()
        save_json(launches, LAUNCHES_JSON)
    except Exception as e:
        print(f"  WARNING: Launch Library 2 failed: {e}")

    print("Done.")


if __name__ == "__main__":
    main()
