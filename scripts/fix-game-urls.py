#!/usr/bin/env python3
"""Ensure every game page points at a working local embed path."""

import json
import re
import urllib.parse
from pathlib import Path
from typing import List, Optional

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
GAME_DIR = PUBLIC / "game"
EMBED_ROOT = PUBLIC / "embed"


def slug_variants(slug: str) -> List[str]:
    parts = [
        slug,
        slug.replace("-", ""),
        slug.replace("-", "_"),
        slug.replace("_", ""),
        slug.replace("-", "").replace("_", ""),
    ]
    return list(dict.fromkeys(parts))


def find_local_embed(slug: str, current_url: str) -> Optional[str]:
    candidates: List[str] = []

    if current_url.startswith("/embed/"):
        decoded = urllib.parse.unquote(current_url)
        candidates.append(decoded)
        if "/embed/n/" in decoded:
            candidates.append(decoded.replace("/embed/n/", "/embed/g/", 1))
        if "/embed/g/" in decoded:
            candidates.append(decoded.replace("/embed/g/", "/embed/n/", 1))

    for prefix in ("g", "n"):
        for variant in slug_variants(slug):
            candidates.append(f"/embed/{prefix}/{variant}/index.html")
            candidates.append(f"/embed/{prefix}/{variant}_/index.html")
            candidates.append(f"/embed/{prefix}/{variant}_GD/index.html")

    seen = set()
    for url in candidates:
        if url in seen:
            continue
        seen.add(url)
        local = PUBLIC / url.lstrip("/")
        build = local.parent / "Build"
        if local.is_file() and build.is_dir() and list(build.glob("*.loader.js")):
            return url
    return None


def resolve_game_url(slug: str, current_url: str) -> Optional[str]:
    local = PUBLIC / current_url.lstrip("/")
    build = local.parent / "Build"
    if (
        current_url.startswith("/embed/")
        and local.is_file()
        and build.is_dir()
        and list(build.glob("*.loader.js"))
    ):
        return current_url

    return find_local_embed(slug, current_url)


def main():
    updated = 0
    broken = []
    manifest = []

    for page in sorted(GAME_DIR.glob("*/index.html")):
        slug = page.parent.name
        text = page.read_text(encoding="utf-8", errors="replace")
        match = re.search(r'game_url\s*=\s*"(/embed/[^"]+)"', text)
        if not match:
            broken.append((slug, "no embed url"))
            continue

        current = match.group(1)
        resolved = resolve_game_url(slug, current)
        if resolved is None:
            broken.append((slug, current))
            continue

        if resolved != current:
            text = text.replace(f'game_url = "{current}"', f'game_url = "{resolved}"', 1)
            page.write_text(text, encoding="utf-8")
            updated += 1
            print(f"Fixed {slug}: {current} -> {resolved}")

        manifest.append({"slug": slug, "embed": resolved})

    manifest_path = EMBED_ROOT / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    print(f"Updated {updated} game URLs")
    print(f"Broken: {len(broken)}")
    for item in broken:
        print(f"  {item}")


if __name__ == "__main__":
    main()
