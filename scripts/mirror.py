#!/usr/bin/env python3
"""Mirror GamesCandy.com static pages and assets for local hosting."""

import json
import os
import re
import time
import urllib.error
import urllib.request
from pathlib import Path

BASE_URL = "https://gamesdonut.com"
ROOT = Path(__file__).resolve().parent.parent / "public"
USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

STATIC_PATHS = [
    "css/style.css",
    "css/swiper-bundle.min.css",
    "js/navbar.js",
    "js/blockadblock.js",
    "js/ads.js",
    "js/firebasePushNotification.js",
    "build/assets/app-73f15e52.css",
    "build/assets/app-1da0cd6f.js",
    "fav-icon/site.webmanifest",
    "fav-icon/apple-touch-icon.png",
    "fav-icon/favicon-32x32.png",
    "fav-icon/favicon-16x16.png",
    "favicon.ico",
    "images/logo.svg",
    "images/logo_mobile.svg",
    "images/game_load.gif",
    "images/right-arrow.svg",
    "images/search.svg",
    "images/user_profile_icon.svg",
    "images/current-google-play-icon.webp",
    "images/GetItOnGooglePlay_Badge_Web_color_English.png",
    "images/High_quality_games_thumbnail.webp",
    "images/info_icon.svg",
    "images/facebook.svg",
    "images/instagram.svg",
    "images/linkedin.svg",
    "images/twitter.svg",
    "images/section-bg.webp",
    "images/footer-bg.webp",
    "images/bg-portrait.webp",
    "images/bg-landscape.webp",
    "images/bg-4-3.webp",
]

PAGES = [
    ("", "index.html"),
    ("home", "home/index.html"),
    ("games", "games/index.html"),
    ("about-us", "about-us/index.html"),
    ("contact-us", "contact-us/index.html"),
    ("privacy-policy", "privacy-policy/index.html"),
    ("blogs", "blogs/index.html"),
    ("login", "login/index.html"),
]

CATEGORIES = [
    "Action",
    "Arcade",
    "Casual",
    "Puzzle",
    "Quiz",
    "Sports",
    "Board",
    "Match 3",
    "Card",
]


def fetch(url, headers=None, retries=3):
    req_headers = {"User-Agent": USER_AGENT}
    if headers:
        req_headers.update(headers)
    req = urllib.request.Request(url, headers=req_headers)
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                return resp.read(), resp.headers.get("Content-Type", "")
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None, ""
            if attempt == retries - 1:
                raise
        except Exception:
            if attempt == retries - 1:
                raise
        time.sleep(1 + attempt)


def rewrite_html(content):
    text = content.decode("utf-8", errors="replace")
    text = text.replace("https://gamesdonut.com/", "/")
    text = text.replace("https://gamesdonut.com", "")
    text = re.sub(r'var update_game_time_url = "[^"]*"', 'var update_game_time_url = "/update-game-time"', text)
    text = re.sub(r'var recent_games_url = "[^"]*"', 'var recent_games_url = "/get-recent-games"', text)
    text = re.sub(r'var games_url = "[^"]*"', 'var games_url = "/games"', text)
    text = re.sub(r'var game_url = "[^"]*"', 'var game_url = "/view-game"', text)
    text = re.sub(
        r'var update_tournament_play_time = "[^"]*"',
        'var update_tournament_play_time = "/update-tournament-play-time"',
        text,
    )
    text = re.sub(
        r'url:\s*"https://gamesdonut\.com/home"',
        'url: "/home"',
        text,
    )
    text = re.sub(
        r'let gameUrl =\s*"https://gamesdonut\.com/view-game"',
        'let gameUrl = "/view-game"',
        text,
    )
    return text.encode("utf-8")


def save(path, data, binary=False):
    path.parent.mkdir(parents=True, exist_ok=True)
    if binary:
        path.write_bytes(data)
    else:
        if isinstance(data, bytes):
            path.write_bytes(data)
        else:
            path.write_text(data, encoding="utf-8")


def download_static():
    print("Downloading static assets...")
    for rel in STATIC_PATHS:
        dest = ROOT / rel
        if dest.exists() and dest.stat().st_size > 0:
            continue
        url = f"{BASE_URL}/{rel}"
        data, _ = fetch(url)
        if data:
            save(dest, data, binary=True)
            print(f"  OK {rel}")
        else:
            print(f"  SKIP {rel}")


def download_page(path, dest_rel):
    url = f"{BASE_URL}/{path}" if path else BASE_URL + "/"
    data, _ = fetch(url)
    if not data:
        print(f"  FAIL {path}")
        return False
    data = rewrite_html(data)
    save(ROOT / dest_rel, data, binary=True)
    print(f"  OK /{path or ''}")
    return True


def get_game_slugs():
    data, _ = fetch(f"{BASE_URL}/games")
    slugs = sorted(set(re.findall(r"view-game/([^\"'>\s]+)", data.decode("utf-8", errors="replace"))))
    return slugs


def download_all_pages():
    print("Downloading main pages...")
    for path, dest in PAGES:
        download_page(path, dest)

    print("Downloading category pages...")
    for cat in CATEGORIES:
        encoded = cat.replace(" ", "%20")
        download_page(f"category/{encoded}", f"category/{cat}/index.html")

    print("Discovering games...")
    slugs = get_game_slugs()
    print(f"Found {len(slugs)} games")

    print("Downloading view-game pages...")
    for i, slug in enumerate(slugs, 1):
        dest = f"view-game/{slug}/index.html"
        if (ROOT / dest).exists():
            continue
        download_page(f"view-game/{slug}", dest)
        if i % 10 == 0:
            print(f"  Progress: {i}/{len(slugs)}")

    print("Downloading game play pages...")
    for i, slug in enumerate(slugs, 1):
        dest = f"game/{slug}/index.html"
        if (ROOT / dest).exists():
            continue
        download_page(f"game/{slug}", dest)
        if i % 10 == 0:
            print(f"  Progress: {i}/{len(slugs)}")

    with open(ROOT / "games-data" / "slugs.json", "w", encoding="utf-8") as f:
        json.dump(slugs, f, indent=2)


def main():
    ROOT.mkdir(parents=True, exist_ok=True)
    (ROOT / "games-data").mkdir(exist_ok=True)
    download_static()
    download_all_pages()
    print("\nMirror complete!")


if __name__ == "__main__":
    main()
