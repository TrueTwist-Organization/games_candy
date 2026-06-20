#!/usr/bin/env python3
"""Remove Google Play badges and icons from all static HTML pages."""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "public"

PATTERNS = [
    re.compile(
        r"\s*<a href=\"#\" target=\"_blank\" rel=\"noopener\">\s*"
        r"<img src=\"/images/current-google-play-icon\.webp\"[^>]*>\s*</a>\s*",
        re.IGNORECASE,
    ),
    re.compile(
        r"\s*<a href=\"#\" target=\"_blank\" rel=\"noopener\">"
        r"<img src=\"/images/GetItOnGooglePlay_Badge_Web_color_English\.png\"[^>]*></a>\s*",
        re.IGNORECASE,
    ),
    re.compile(
        r"\s*<div class=\"lg:block hidden text-center\">"
        r"<a href=\"#\" target=\"_blank\" rel=\"noopener\">"
        r"<img src=\"/images/GetItOnGooglePlay_Badge_Web_color_English\.png\"[^>]*></a></div>\s*",
        re.IGNORECASE,
    ),
    re.compile(
        r"\s*<a href=\"#\" target=\"_blank\" class=\"block\" rel=\"noopener\">"
        r"<img[^>]*GetItOnGooglePlay_Badge_Web_color_English\.png[^>]*></a>\s*",
        re.IGNORECASE,
    ),
]


def clean_html(text: str) -> str:
    updated = text
    for pattern in PATTERNS:
        updated = pattern.sub("\n", updated)
    return updated


def main() -> None:
    updated = 0
    for path in ROOT.rglob("*.html"):
        original = path.read_text(encoding="utf-8", errors="replace")
        cleaned = clean_html(original)
        if cleaned != original:
            path.write_text(cleaned, encoding="utf-8")
            updated += 1
    print(f"Removed Google Play blocks from {updated} HTML files")


if __name__ == "__main__":
    main()
