#!/usr/bin/env python3
"""Re-download HTML pages broken by overly aggressive polish regex."""

import importlib.util
import sys
import time
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "public"
MIN_SIZE = 1000

spec = importlib.util.spec_from_file_location("mirror", Path(__file__).parent / "mirror.py")
mirror = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mirror)


def url_for_file(rel_path: str) -> str:
    rel = rel_path.replace("\\", "/")
    if rel == "index.html":
        return ""
    if rel.endswith("/index.html"):
        return rel[: -len("/index.html")]
    return rel.replace(".html", "")


def main():
    broken = []
    for path in ROOT.rglob("*.html"):
        if path.stat().st_size >= MIN_SIZE:
            continue
        if "embed" in path.parts:
            continue
        rel = path.relative_to(ROOT).as_posix()
        broken.append(rel)

    print(f"Restoring {len(broken)} broken HTML files...")
    restored = 0
    for rel in sorted(broken):
        page_path = url_for_file(rel)
        safe_path = page_path.replace(" ", "%20") if page_path else page_path
        ok = mirror.download_page(safe_path, rel)
        if ok:
            restored += 1
        time.sleep(0.1)

    print(f"Restored {restored}/{len(broken)} pages")


if __name__ == "__main__":
    main()
