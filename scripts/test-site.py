#!/usr/bin/env python3
"""Smoke-test local GamesCandy site: embeds, quiz data, ads, external game links."""

import json
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000"

AD_MARKERS = (
    "adBreak(",
    "data-ad-frequency-hint",
    "game-ad-container-main",
    "Advertisement",
    "Continue!",
)
EXTERNAL_GAME_LINK = re.compile(r"https://gamesdonut\.com/game/")


def fetch(url: str) -> tuple[int, str]:
    request = urllib.request.Request(url, headers={"User-Agent": "GamesCandy-test/1.0"})
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            body = response.read(500_000).decode("utf-8", errors="replace")
            return response.status, body
    except urllib.error.HTTPError as exc:
        return exc.code, exc.read(200).decode("utf-8", errors="replace")
    except urllib.error.URLError as exc:
        return 0, str(exc)


def main() -> None:
    report = {
        "base": BASE,
        "games_total": 0,
        "games_ok": 0,
        "embed_http_fail": [],
        "missing_local_embed": [],
        "quiz_missing_json": [],
        "game_pages_with_ads": [],
        "game_pages_external_play": [],
        "sample_play_pages_ok": [],
    }

    game_urls: list[tuple[str, str]] = []
    for page in sorted((PUBLIC / "game").glob("*/index.html")):
        slug = page.parent.name
        text = page.read_text(encoding="utf-8", errors="replace")
        match = re.search(r'game_url\s*=\s*"(/embed/[^"]+)"', text)
        if not match:
            continue
        embed = match.group(1)
        game_urls.append((slug, embed))
        report["games_total"] += 1

        local = PUBLIC / embed.lstrip("/")
        if not local.exists():
            report["missing_local_embed"].append({"slug": slug, "embed": embed})
            continue

        status, _ = fetch(BASE + embed)
        if status != 200:
            report["embed_http_fail"].append({"slug": slug, "embed": embed, "status": status})
            continue

        report["games_ok"] += 1

        if slug in {"Cricket-Quiz", "HollyWood-Quiz", "bollywood-quiz"}:
            json_path = local.parent / "Json" / "Json.txt"
            if not json_path.exists() or json_path.stat().st_size < 10:
                report["quiz_missing_json"].append(slug)
            json_status, _ = fetch(BASE + embed.rsplit("/", 1)[0] + "/Json/Json.txt")
            if json_status != 200:
                report["quiz_missing_json"].append(f"{slug} (http {json_status})")

        for marker in AD_MARKERS:
            if marker in text and marker not in {"game-ad-container-main"}:
                report["game_pages_with_ads"].append({"slug": slug, "marker": marker})
                break

        if EXTERNAL_GAME_LINK.search(text):
            report["game_pages_external_play"].append(slug)

    for slug in ("Cat_Block_Puzzle", "Rotate_Cups", "Car_Escape", "Cricket-Quiz"):
        status, body = fetch(f"{BASE}/game/{slug}/")
        if status == 200 and "game_url" in body:
            report["sample_play_pages_ok"].append(slug)
        else:
            report["sample_play_pages_ok"].append(f"{slug} FAIL ({status})")

    for path in (PUBLIC / "category" / "Quiz" / "index.html", PUBLIC / "home" / "index.html", PUBLIC / "index.html"):
        if path.exists():
            status, _ = fetch(BASE + "/" + path.relative_to(PUBLIC).as_posix().replace("/index.html", ""))
            if status != 200 and path.name == "index.html":
                report.setdefault("pages_fail", []).append(str(path.relative_to(PUBLIC)))

    out = ROOT / "test-report.json"
    out.write_text(json.dumps(report, indent=2), encoding="utf-8")

    print(json.dumps({k: v for k, v in report.items() if k != "base"}, indent=2))
    print(f"\nReport saved: {out}")
    failed = (
        len(report["embed_http_fail"])
        + len(report["missing_local_embed"])
        + len(report["quiz_missing_json"])
        + len(report["game_pages_external_play"])
    )
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
