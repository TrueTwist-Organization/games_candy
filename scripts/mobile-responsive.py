#!/usr/bin/env python3
"""Apply mobile-friendly HTML updates across mirrored public pages."""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "public"
SKIP_PARTS = {"embed"}


def should_process(path: Path) -> bool:
    if path.suffix != ".html":
        return False
    return not any(part in SKIP_PARTS for part in path.parts)


def patch_html(text: str, rel_path: str) -> str:
    updated = text

    updated = updated.replace('<div class="sm:hidden block">', '<div class="index-mobile-only sm:hidden block">')
    updated = updated.replace(
        '<div class="sm:block hidden md:w-[80%]',
        '<div class="index-main-content block md:w-[80%]',
    )

    updated = updated.replace(
        "grid md:grid-cols-12 grid-cols-9",
        "grid md:grid-cols-12 grid-cols-3 sm:grid-cols-4",
    )
    updated = updated.replace(
        "grid md:grid-cols-12 grid-cols-4 gap-3",
        "grid md:grid-cols-12 grid-cols-2 sm:grid-cols-3 gap-3",
    )
    updated = updated.replace(
        "grid md:grid-cols-12 grid-cols-4 gap-2",
        "grid md:grid-cols-12 grid-cols-2 sm:grid-cols-3 gap-2",
    )

    updated = updated.replace(
        "py-[3rem] px-[4rem]",
        "py-8 px-4 md:py-12 md:px-16",
    )
    updated = updated.replace(
        'class="w-96 object-cover',
        'class="w-full max-w-96 object-cover',
    )
    updated = updated.replace(
        'class="w-[40%] fixed',
        'class="w-[calc(100%-2rem)] max-w-sm fixed',
    )
    updated = updated.replace(
        'class="bg-red-100 border border-red-400 fixed text-red-700 px-4 py-3 rounded w-[40%]',
        'class="bg-red-100 border border-red-400 fixed text-red-700 px-4 py-3 rounded w-[calc(100%-2rem)] max-w-sm',
    )

    if rel_path.startswith("game/") and "game-play-page" not in updated:
        updated = re.sub(
            r'(<body[^>]*class=")([^"]*)(")',
            lambda m: f'{m.group(1)}{m.group(2)} game-play-page{m.group(3)}',
            updated,
            count=1,
        )

    return updated


def main():
    updated = 0
    for path in ROOT.rglob("*.html"):
        if not should_process(path):
            continue
        rel = path.relative_to(ROOT).as_posix()
        original = path.read_text(encoding="utf-8", errors="replace")
        fixed = patch_html(original, rel)
        if fixed != original:
            path.write_text(fixed, encoding="utf-8")
            updated += 1

    print(f"Mobile responsive patches applied to {updated} HTML files")


if __name__ == "__main__":
    main()
