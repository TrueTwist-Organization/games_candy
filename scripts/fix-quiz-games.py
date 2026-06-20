#!/usr/bin/env python3
"""Download quiz JSON data and point quiz embeds at local assets."""

import re
import ssl
import urllib.request
from pathlib import Path
from typing import Optional

ROOT = Path(__file__).resolve().parent.parent
EMBED = ROOT / "public" / "embed" / "g"
BUCKET = "gamesdonut-games-2026.s3.ap-south-1.amazonaws.com"
S3_PREFIX = "GamesDonut"
REFERER = "https://gamesdonut.com/"
SSL_CTX = ssl.create_default_context()

QUIZ_FOLDERS = ("CricketQuiz", "HollywoodQuiz", "BollywoodQuiz")


def fetch_bytes(url: str) -> Optional[bytes]:
    request = urllib.request.Request(
        url,
        headers={"Referer": REFERER, "User-Agent": "Mozilla/5.0"},
    )
    try:
        with urllib.request.urlopen(request, context=SSL_CTX, timeout=120) as response:
            return response.read()
    except Exception as exc:
        print(f"  FAIL {url}: {exc}")
        return None


def fix_json_reader(folder: str) -> None:
    js_path = EMBED / folder / "Json" / "jsonreaderJS.js"
    if not js_path.exists():
        return

    text = js_path.read_text(encoding="utf-8", errors="replace")
    local_txt = f"/embed/g/{folder}/Json/Json.txt"
    text = re.sub(
        r'const textFileURL\s*=\s*"[^"]+";',
        f'const textFileURL = "{local_txt}";',
        text,
        count=1,
    )
    js_path.write_text(text, encoding="utf-8")


def fix_index_html(folder: str) -> None:
    index_path = EMBED / folder / "index.html"
    if not index_path.exists():
        return

    text = index_path.read_text(encoding="utf-8", errors="replace")
    local_js = f"/embed/g/{folder}/Json/jsonreaderJS.js"
    text = re.sub(
        r'<script src="https://gamesdonut-games-2026\.s3[^"]+/Json/jsonreaderJS\.js"></script>',
        f'<script src="{local_js}"></script>',
        text,
        count=1,
    )
    index_path.write_text(text, encoding="utf-8")


def download_json_txt(folder: str) -> bool:
    out_path = EMBED / folder / "Json" / "Json.txt"
    url = f"https://{BUCKET}/{S3_PREFIX}/{folder}/Json/Json.txt"
    data = fetch_bytes(url)
    if data is None:
        return False
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_bytes(data)
    return True


def main() -> None:
    ok = 0
    for folder in QUIZ_FOLDERS:
        print(f"Fixing {folder} ...")
        if download_json_txt(folder):
            ok += 1
            print(f"  Json.txt saved")
        else:
            print(f"  Json.txt missing")
        fix_json_reader(folder)
        fix_index_html(folder)
        print(f"  paths patched")

    print(f"Done: {ok}/{len(QUIZ_FOLDERS)} quiz data files downloaded")


if __name__ == "__main__":
    main()
