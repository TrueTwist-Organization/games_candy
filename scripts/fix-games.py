#!/usr/bin/env python3
"""Fix all game pages: remove broken JS and use inline load via S3 proxy."""

from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent / "public" / "game"

HELPER = """    function getGameProxyUrl(url) {
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


def clean_broken_tail(text):
    text = re.sub(
        r"\}\);\s*setTimeout\(function\(\) \{ \$\('#loading'\)\.addClass\('hidden'\); \}, 10000\);\s*\}\);",
        "});",
        text,
    )
    return text


def replace_ready_block(text):
    pattern = re.compile(
        r"\$\(document\)\.ready\(function\(\) \{\s*"
        r"\$\('#game-ad-container-main'\)\.remove\(\);[\s\S]*?"
        r"setTimeout\(function\(\) \{ \$\('#loading'\)\.addClass\('hidden'\); \}, \d+\);\s*"
        r"\}\);",
        re.MULTILINE,
    )
    return pattern.sub(GAME_BLOCK, text, count=1)


def main():
    updated = 0
    for path in ROOT.rglob("index.html"):
        text = path.read_text(encoding="utf-8", errors="replace")
        original = text

        text = clean_broken_tail(text)
        if "getGameProxyUrl" not in text:
            text = text.replace("    function copyGameUrl(event) {", HELPER + "\n    function copyGameUrl(event) {", 1)

        if "game-player-frame" in text or "$('#game-content').load(" in text or "$('#game-content').html(" in text:
            text = replace_ready_block(text)

        if text != original:
            path.write_text(text, encoding="utf-8")
            updated += 1

    print(f"Fixed {updated} game pages")


if __name__ == "__main__":
    main()
