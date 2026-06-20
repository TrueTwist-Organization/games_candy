#!/usr/bin/env python3
"""Download and process game pages missing from the local mirror."""

import importlib.util
import re
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


mirror = load_module("mirror", ROOT / "scripts" / "mirror.py")
download_games = load_module("download_games", ROOT / "scripts" / "download-games.py")


def linked_slugs() -> set[str]:
    slugs: set[str] = set()
    pat = re.compile(r'href="/(?:view-game|game)/([^"#?]+)"')
    for path in PUBLIC.rglob("*.html"):
        if "embed" in path.parts:
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        slugs.update(pat.findall(text))
    return slugs


def missing_slugs() -> list[str]:
    linked = linked_slugs()
    missing = sorted(
        slug
        for slug in linked
        if not (PUBLIC / "game" / slug / "index.html").exists()
    )
    return missing


def run_pipeline():
    scripts = [
        "remove-ads.py",
        "rebrand.py",
        "fix-games.py",
        "polish-site.py",
        "mobile-responsive.py",
        "fix-embed-paths.py",
    ]
    for script in scripts:
        subprocess.run([sys.executable, str(ROOT / "scripts" / script)], check=False)


def main():
    missing = missing_slugs()
    print(f"Syncing {len(missing)} missing games...")

    downloaded = 0
    for slug in missing:
        game_ok = mirror.download_page(f"game/{slug}", f"game/{slug}/index.html")
        view_ok = mirror.download_page(f"view-game/{slug}", f"view-game/{slug}/index.html")
        if game_ok or view_ok:
            downloaded += 1
        time.sleep(0.12)

    print(f"Downloaded pages for {downloaded}/{len(missing)} games")
    print("Running cleanup pipeline...")
    run_pipeline()

    games = download_games.collect_game_urls()
    new_games = [item for item in games if item[0] in missing]
    print(f"Downloading {len(new_games)} new game bundles...")
    ok = 0
    for slug, embed_url in new_games:
        if download_games.download_game(slug, embed_url):
            ok += 1
        time.sleep(0.12)

    manifest = []
    for slug, embed_url in download_games.collect_game_urls():
        manifest.append({"slug": slug, "embed": embed_url})
    (PUBLIC / "embed" / "manifest.json").write_text(
        __import__("json").dumps(manifest, indent=2),
        encoding="utf-8",
    )
    print(f"Done: {ok}/{len(new_games)} bundles downloaded, {len(manifest)} total games")


if __name__ == "__main__":
    main()
