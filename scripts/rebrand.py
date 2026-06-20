#!/usr/bin/env python3
"""Rebrand mirrored site from GamesDonut to GamesCandy."""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

PROTECTED_PATTERNS = [
    r"https://gamesdonut\.com[^\s\"'<>]*",
    r"https://buyhtml5games\.gamesdonut\.com[^\s\"'<>]*",
    r"https://www\.facebook\.com/games\.donut[^\s\"'<>]*",
    r"https://www\.instagram\.com/gamesdonut_online[^\s\"'<>]*",
    r"https://x\.com/gamesdonut_play[^\s\"'<>]*",
    r"https://www\.linkedin\.com/company/gamesdonut[^\s\"'<>]*",
    r"https://play\.google\.com/store/apps/details\?id=com\.gamesdonut\.games\.offline\.nowifi[^\s\"'<>]*",
    r"gamesdonut-games-2026\.s3[^\s\"'<>]*",
    r"gamesdonut-games-new\.s3[^\s\"'<>]*",
    r"/GamesDonut/[^\"'<>\\s]*",
    r"gamesdonut-b566f[^\s\"'<>]*",
    r"gamesdonut\.firebaseapp\.com[^\s\"'<>]*",
]

REPLACEMENTS = [
    ("GamesDonut", "GamesCandy"),
    ("Gamesdonut", "GamesCandy"),
    ("GAMESDONUT", "GAMESCANDY"),
    ("gamesdonut.com", "GamesCandy.com"),
    ("games-donut-clone", "games-candy"),
    ("Local clone of gamesdonut.com", "GamesCandy gaming site"),
    ("COOKIE_DOMAIN = 'gamesdonut.com'", "COOKIE_DOMAIN = 'localhost'"),
]


def rebrand_text(text):
    placeholders = {}

    def protect(match):
        key = f"__PROTECT_{len(placeholders)}__"
        placeholders[key] = match.group(0)
        return key

    for pattern in PROTECTED_PATTERNS:
        text = re.sub(pattern, protect, text, flags=re.IGNORECASE)

    for old, new in REPLACEMENTS:
        text = text.replace(old, new)

    for key, value in placeholders.items():
        text = text.replace(key, value)

    return text


SKIP_FILES = {"rebrand.py", "download-games.py", "fix-embed-paths.py", "sync-missing-games.py"}


def process_file(path):
    if path.name in SKIP_FILES:
        return False

    original = path.read_text(encoding="utf-8", errors="replace")
    updated = rebrand_text(original)
    if updated != original:
        path.write_text(updated, encoding="utf-8")
        return True
    return False


def main():
    extensions = {".html", ".js", ".css", ".json", ".py", ".webmanifest"}
    files = [
        p
        for p in ROOT.rglob("*")
        if p.suffix in extensions and "node_modules" not in p.parts
    ]
    updated = sum(process_file(path) for path in files)
    print(f"Rebranded {updated} files to GamesCandy")


if __name__ == "__main__":
    main()
