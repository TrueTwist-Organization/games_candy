#!/usr/bin/env python3
"""Download all game bundles locally and patch them for self-hosted GamesCandy embed."""

import json
import re
import ssl
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Optional, Set, Tuple, List

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
GAME_PAGES = PUBLIC / "game"
EMBED_ROOT = PUBLIC / "embed"
REFERER = "https://gamesdonut.com/"

BUCKETS = {
    "g": ("gamesdonut-games-2026.s3.ap-south-1.amazonaws.com", "GamesDonut"),
    "n": ("gamesdonut-games-new.s3.ap-south-1.amazonaws.com", "GamesDonut"),
}

SSL_CTX = ssl.create_default_context()


def fetch_bytes(url: str) -> Optional[bytes]:
    request = urllib.request.Request(
        url,
        headers={"Referer": REFERER, "User-Agent": "Mozilla/5.0"},
    )
    try:
        with urllib.request.urlopen(request, context=SSL_CTX, timeout=120) as response:
            return response.read()
    except urllib.error.HTTPError as exc:
        print(f"  HTTP {exc.code}: {url}")
        return None
    except urllib.error.URLError as exc:
        print(f"  URL error: {url} ({exc})")
        return None


def s3_url(bucket_host: str, s3_path: str) -> str:
    return f"https://{bucket_host}/{s3_path.lstrip('/')}"


def parse_embed_path(embed_url: str) -> Optional[Tuple[str, str]]:
    match = re.match(r"^/embed/([gn])/(.+)$", embed_url)
    if not match:
        return None
    prefix, rest = match.group(1), match.group(2)
    return prefix, rest


def discover_assets(html: str, game_folder: str) -> Set[str]:
    assets: Set[str] = set()
    patterns = [
        rf'GamesCandy/{re.escape(game_folder)}/([^"\']+)',
        r'buildUrl \+ "/([^"]+)"',
        r'"(Build/[^"]+)"',
        r'"(TemplateData/[^"]+)"',
        r'"(StreamingAssets/[^"]+)"',
        r'"(Json/[^"]+)"',
        r"'(Build/[^']+)'",
        r"'(TemplateData/[^']+)'",
        r"'(Json/[^']+)'",
    ]
    for pattern in patterns:
        for match in re.finditer(pattern, html):
            path = match.group(1)
            if path.startswith(("Build/", "TemplateData/", "StreamingAssets/", "Json/")):
                if is_asset_file(path):
                    assets.add(path)
            elif "/" in path and is_asset_file(path):
                assets.add(path)
            elif is_asset_file(f"Build/{path}"):
                assets.add(f"Build/{path}")
    return assets


def is_asset_file(path: str) -> bool:
    name = Path(path).name
    return "." in name


def discover_css_assets(css: str, css_rel_path: str) -> Set[str]:
    assets: Set[str] = set()
    base_dir = str(Path(css_rel_path).parent).replace("\\", "/")
    if base_dir == ".":
        base_dir = ""
    for match in re.finditer(r"url\(['\"]?([^'\")]+)['\"]?\)", css):
        href = match.group(1).strip()
        if href.startswith(("http://", "https://", "data:")):
            continue
        asset = f"{base_dir}/{href}" if base_dir else href
        assets.add(asset.replace("//", "/"))
    return assets


def sanitize_game_html(html: str, embed_base: str) -> str:
    text = html
    text = re.sub(r"<!--H5Ads[\s\S]*?<!--H5Ads[\s\S]*?-->", "", text)
    text = re.sub(
        r"<script async data-ad-frequency-hint[\s\S]*?adConfig\(\{ preloadAdBreaks:[^}]+\}\);\s*</script>\s*",
        "",
        text,
        flags=re.IGNORECASE,
    )
    text = re.sub(
        r'fetch\("https://gamesdonut\.com/aws-s3-url"\)\s*'
        r"\.then\(\(response\) => \{[\s\S]*?\}\)\s*"
        r"\.then\(\(data\) => \{([\s\S]*?)\}\)\s*\n\s*</script>",
        lambda m: patch_fetch_block(m.group(1), embed_base) + "\n    </script>",
        text,
        count=1,
    )
    text = re.sub(r'\s*console\.log\([^\)]*\);\s*', "\n", text)
    text = re.sub(
        r'<script src="https://gamesdonut-games-2026\.s3[^"]+/GamesDonut/([^/]+)/Json/jsonreaderJS\.js"></script>',
        r'<script src="/embed/g/\1/Json/jsonreaderJS.js"></script>',
        text,
    )
    return patch_fetch_block(text, embed_base)


def patch_fetch_block(inner: str, embed_base: str) -> str:
    block = inner
    block = re.sub(
        r"var s3_bucket_url = data\.data\.s3_bucket_url;",
        f'var baseUrl = "{embed_base}";',
        block,
    )
    block = re.sub(r'var baseUrl = "\./";', f'var baseUrl = "{embed_base}";', block)
    block = block.replace("s3_bucket_url", "baseUrl")
    block = re.sub(r'baseUrl \+ "GamesCandy/[^"]+/', 'baseUrl + "', block)
    block = re.sub(r'baseUrl \+ "GamesDonut/[^"]+/', 'baseUrl + "', block)
    block = re.sub(r'baseUrl \+ "\./[^"/]+/', 'baseUrl + "', block)
    block = re.sub(r'baseUrl \+ "\./', 'baseUrl + "', block)
    block = re.sub(r'\s*console\.log\([^\)]*\);\s*', "\n", block)
    return block


def sanitize_binary_text(content: bytes, path: str) -> bytes:
    if not path.endswith((".js", ".css", ".html", ".json")):
        return content
    text = content.decode("utf-8", errors="replace")
    text = text.replace("https://gamesdonut.com/aws-s3-url", "/api/game-assets")
    text = re.sub(r"https://gamesdonut-games-2026\.s3\.[^/\"']+/GamesDonut/", "./", text)
    text = re.sub(r"https://gamesdonut-games-new\.s3\.[^/\"']+/GamesDonut/", "./", text)
    text = text.replace("GamesCandy/", "./")
    text = re.sub(r"gamesdonut\.com", "", text, flags=re.IGNORECASE)
    return text.encode("utf-8")


def collect_game_urls() -> List[Tuple[str, str]]:
    games: List[Tuple[str, str]] = []
    for page in sorted(GAME_PAGES.glob("*/index.html")):
        text = page.read_text(encoding="utf-8", errors="replace")
        match = re.search(r'game_url\s*=\s*"(/embed/[^"]+)"', text)
        if match:
            games.append((page.parent.name, match.group(1)))
    return games


def download_game(slug: str, embed_url: str) -> bool:
    parsed = parse_embed_path(embed_url)
    if not parsed:
        print(f"Skip {slug}: bad embed url {embed_url}")
        return False

    prefix, embed_path = parsed
    bucket_host, s3_prefix = BUCKETS[prefix]
    local_dir = EMBED_ROOT / prefix / Path(urllib.parse.unquote(embed_path)).parent
    local_dir.mkdir(parents=True, exist_ok=True)

    s3_index = f"{s3_prefix}/{embed_path}"
    index_url = s3_url(bucket_host, s3_index)
    raw_html = fetch_bytes(index_url)
    if raw_html is None and prefix == "n":
        prefix = "g"
        bucket_host, s3_prefix = BUCKETS[prefix]
        local_dir = EMBED_ROOT / prefix / Path(urllib.parse.unquote(embed_path)).parent
        local_dir.mkdir(parents=True, exist_ok=True)
        index_url = s3_url(bucket_host, s3_index)
        raw_html = fetch_bytes(index_url)
    if raw_html is None:
        return False

    html = raw_html.decode("utf-8", errors="replace")
    game_folder = embed_path.split("/")[0]
    pending = discover_assets(html, game_folder)
    pending.add(embed_path.split("/", 1)[1] if "/" in embed_path else "index.html")

    downloaded: Set[str] = set()
    while pending:
        rel_path = pending.pop()
        if rel_path in downloaded:
            continue
        downloaded.add(rel_path)

        s3_path = f"{s3_prefix}/{game_folder}/{rel_path}"
        file_url = s3_url(bucket_host, s3_path)
        data = fetch_bytes(file_url)
        if data is None:
            continue

        data = sanitize_binary_text(data, rel_path)
        out_path = local_dir / rel_path
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_bytes(data)

        if rel_path.endswith(".css"):
            css_text = data.decode("utf-8", errors="replace")
            pending.update(discover_css_assets(css_text, rel_path))

    index_path = local_dir / Path(urllib.parse.unquote(embed_path)).name
    embed_base = f"/embed/{prefix}/{game_folder}/"
    index_path.write_text(sanitize_game_html(html, embed_base), encoding="utf-8")
    print(f"OK {slug} -> {index_path.relative_to(PUBLIC)} ({len(downloaded)} files)")
    return True


def main():
    games = collect_game_urls()
    manifest = []
    ok = 0
    print(f"Downloading {len(games)} games to {EMBED_ROOT} ...")
    for slug, embed_url in games:
        if download_game(slug, embed_url):
            ok += 1
            manifest.append({"slug": slug, "embed": embed_url})
        time.sleep(0.15)

    manifest_path = EMBED_ROOT / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"Done: {ok}/{len(games)} games saved. Manifest: {manifest_path}")


if __name__ == "__main__":
    main()
