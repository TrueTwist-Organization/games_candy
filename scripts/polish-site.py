#!/usr/bin/env python3
"""Clean embed URLs, remove tracking, and hide clone/source branding in public files."""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "public"

GAME_HELPER = """    function getGameProxyUrl(url) {
        if (!url || url.charAt(0) === '/') return url;
        return url;
    }
"""

GAME_BLOCK = """    $(document).ready(function() {
        $('#game-ad-container-main').remove();
        $('.bg-slate-200.h-\\[50px\\]').remove();
        $('#game-content-main').removeClass('hidden bg-white').css({
            height: 'calc(100dvh - 40px)',
            background: '#000'
        });
        $('#game-content').css({
            position: 'relative',
            width: '100%',
            height: '100%',
            background: '#000',
            overflow: 'hidden'
        });
        $('#loading').removeClass('hidden');
        var proxyUrl = getGameProxyUrl(game_url);
        $('#game-content').load(proxyUrl, function(response, status) {
            if (status === 'error') {
                $('#loading').addClass('hidden');
                $('#game-content').html('<p style="color:#fff;text-align:center;padding:2rem;">Game failed to load. Please refresh.</p>');
                return;
            }
            $('#loading').addClass('hidden');
        });
        setTimeout(function() { $('#loading').addClass('hidden'); }, 12000);
    });"""


def to_embed_url(url: str) -> str:
    match = re.search(
        r"https://gamesdonut-games-(?:2026|new)\.s3\.[^/]+\.amazonaws\.com/GamesDonut/(.+)",
        url,
    )
    if match:
        return "/embed/g/" + match.group(1)
    match = re.search(
        r"https://gamesdonut-games-2026\.s3\.[^/]+\.amazonaws\.com/GamesDonut/(.+)",
        url,
    )
    if match:
        return "/embed/g/" + match.group(1)
    match = re.search(
        r"https://gamesdonut-games-new\.s3\.[^/]+\.amazonaws\.com/GamesDonut/(.+)",
        url,
    )
    if match:
        return "/embed/g/" + match.group(1)
    url = url.replace("/s3-proxy/gamesdonut-games-2026/GamesDonut/", "/embed/g/")
    url = url.replace("/s3-proxy/gamesdonut-games-new/GamesDonut/", "/embed/g/")
    return url


def polish_html(text: str) -> str:
    def replace_game_url(match):
        return f'game_url = "{to_embed_url(match.group(1))}"'

    text = re.sub(
        r'game_url\s*=\s*"(https://gamesdonut-games-[^"]+)"',
        replace_game_url,
        text,
    )
    text = text.replace("/s3-proxy/gamesdonut-games-2026/GamesDonut/", "/embed/g/")
    text = text.replace("/s3-proxy/gamesdonut-games-new/GamesDonut/", "/embed/n/")
    text = text.replace("https://gamesdonut.com/aws-s3-url", "/api/game-assets")

    text = re.sub(
        r"<!-- Google tag \(gtag\.js\) -->[\s\S]*?gtag\('config'[^\)]*\);\s*</script>\s*",
        "",
        text,
    )
    text = re.sub(
        r'<script async src="https://www\.googletagmanager\.com/gtag/js[^"]*"[^>]*></script>\s*',
        "",
        text,
    )
    text = re.sub(
        r'<script defer src="https://static\.cloudflareinsights\.com/beacon\.min\.js[^"]*"[^>]*></script>\s*',
        "",
        text,
    )
    text = re.sub(
        r"<script[^>]*>\s*var saveTokenUrl[\s\S]*?</script>\s*<script type=\"module\" src=\"/js/firebasePushNotification\.js\"></script>\s*",
        "",
        text,
    )
    text = re.sub(
        r'<script type="module" src="/js/firebasePushNotification\.js"></script>\s*',
        "",
        text,
    )

    text = text.replace("https://www.instagram.com/gamesdonut_online", "#")
    text = text.replace("https://x.com/gamesdonut_play", "#")
    text = text.replace("https://www.linkedin.com/company/gamesdonut", "#")
    text = text.replace(
        "https://play.google.com/store/apps/details?id=com.gamesdonut.games.offline.nowifi",
        "#",
    )
    text = text.replace("https://www.facebook.com/games.donut", "#")
    text = text.replace("https://buyhtml5games.gamesdonut.com/", "#")
    text = re.sub(
        r'<!--\s*<script>\s*var public_path = "/particles\.json"[\s\S]*?</script>\s*-->\s*',
        "",
        text,
    )
    text = re.sub(r"\s*console\.log\([^\)]*\);\s*", "\n", text)

    text = re.sub(r'var game_url = "/view-game";\s*\n\s*game_url = ', 'game_url = ', text)
    if "function getGameProxyUrl" in text:
        text = re.sub(
            r"function getGameProxyUrl\(url\) \{[\s\S]*?\n    \}\n",
            GAME_HELPER + "\n",
            text,
            count=1,
        )

    return text


def polish_js(text: str) -> str:
    text = re.sub(r"\s*console\.log\([^\)]*\);\s*", "\n", text)
    return text


def main():
    updated = 0

    for path in ROOT.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix not in {".html", ".js"}:
            continue
        if path.name in {"ads.js", "blockadblock.js"}:
            continue

        original = path.read_text(encoding="utf-8", errors="replace")
        cleaned = polish_html(original) if path.suffix == ".html" else polish_js(original)

        if cleaned != original:
            path.write_text(cleaned, encoding="utf-8")
            updated += 1

    print(f"Polished {updated} public files")


if __name__ == "__main__":
    main()
