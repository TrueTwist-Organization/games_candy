#!/usr/bin/env python3
"""Remove all advertisements from mirrored GamesCandy HTML pages."""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "public"

GAME_READY_SCRIPT = """function getGameProxyUrl(url) {
        if (!url || url.charAt(0) === '/') return url;
        return url;
    }

    $(document).ready(function() {
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
                return;
            }
            $('#loading').addClass('hidden');
        });
        setTimeout(function() { $('#loading').addClass('hidden'); }, 12000);
    });"""


def strip_ads(html):
    text = html

    text = re.sub(
        r'\s*<meta name="google-adsense-account"[^>]*>\s*',
        "\n",
        text,
        flags=re.IGNORECASE,
    )

    text = re.sub(
        r'\s*<script async src="https://pagead2\.googlesyndication\.com/pagead/js/adsbygoogle\.js[^"]*"[^>]*></script>\s*',
        "\n",
        text,
        flags=re.IGNORECASE,
    )

    text = re.sub(
        r'<script>\s*function initializeAds\(\)[\s\S]*?</script>\s*',
        "",
        text,
    )

    text = re.sub(
        r'<div class="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 hidden" id="adBlockerDialog">[\s\S]*?</div>\s*',
        "",
        text,
    )

    text = re.sub(
        r'\s*<script type="text/javascript" src="/js/blockadblock\.js"></script>\s*',
        "\n",
        text,
    )
    text = re.sub(
        r'\s*<script type="text/javascript" src="/js/ads\.js"></script>\s*',
        "\n",
        text,
    )

    text = re.sub(
        r'<script>\s*setTimeout\(\(\)=>\s*\{\s*\(adsbygoogle[\s\S]*?</script>\s*',
        "",
        text,
    )

    text = re.sub(
        r'<ins class="adsbygoogle[^"]*"[\s\S]*?</ins>\s*<script>\s*\(adsbygoogle[\s\S]*?</script>\s*',
        "",
        text,
        flags=re.IGNORECASE,
    )

    text = re.sub(
        r'<ins class="adsbygoogle[^"]*"[\s\S]*?</ins>\s*',
        "",
        text,
        flags=re.IGNORECASE,
    )

    text = re.sub(
        r'<script>\s*\(adsbygoogle = window\.adsbygoogle \|\| \[\]\)\.push\(\{\}\);\s*</script>\s*',
        "",
        text,
    )

    text = re.sub(
        r'<div class="w-full flex justify-center bg-slate-200 sm:hidden h-\[50px\]">\s*</div>\s*',
        "",
        text,
    )

    text = re.sub(
        r'<div id="game-ad-container-main"[\s\S]*?</div>\s*(?=<div class="w-full flex justify-center bg-slate-200|<script type="text/javascript">)',
        "",
        text,
    )
    if "id=\"game-ad-container-main\"" in text:
        text = re.sub(
            r'<div id="game-ad-container-main"[\s\S]*?</div>\s*</div>\s*',
            "",
            text,
            count=1,
        )

    text = re.sub(
        r'\s*loadInterAds\(\)\s*',
        "\n",
        text,
    )

    text = re.sub(
        r"showInterAds\(\)\s*",
        "",
        text,
    )

    text = re.sub(
        r'<script>\s*function showInterAds\(\)[\s\S]*?function loadInterAds\(\)[\s\S]*?</script>\s*',
        "",
        text,
    )

    text = re.sub(
        r'\s*function\s*\{\s*afg\.adBreak\([\s\S]*?\}\s*function\s*\{[\s\S]*?window\.afg = afg;\s*\}\s*',
        "\n",
        text,
    )

    text = re.sub(
        r'\$\(document\)\.ready\(function\(\)\s*\{\s*\$\(\'#game-content-main\'\)\.addClass\(\'hidden\'\);[\s\S]*?\}\);\s*'
        r'\$\(\'#continue-btn\'\)\.on\(\'click\',function\(\)\{[\s\S]*?\}\);\s*',
        GAME_READY_SCRIPT + "\n\n    ",
        text,
    )

    return text


def strip_game_descriptions(html):
    return re.sub(
        r'<div class="my-5 game-banner-container bg-cover bg-no-repeat bg-white py-\[3rem\] rounded-\[30px\]">\s*'
        r'<article class="prose w-full px-7 max-w-none">[\s\S]*?</article>\s*'
        r'<div class="my-5">\s*</div>\s*'
        r"</div>\s*",
        "",
        html,
    )


def main():
    html_files = list(ROOT.rglob("*.html"))
    updated = 0

    for path in html_files:
        original = path.read_text(encoding="utf-8", errors="replace")
        cleaned = strip_ads(original)
        if "view-game" in path.parts:
            cleaned = strip_game_descriptions(cleaned)
        if cleaned != original:
            path.write_text(cleaned, encoding="utf-8")
            updated += 1

    print(f"Cleaned ads from {updated}/{len(html_files)} HTML files")


if __name__ == "__main__":
    main()
