#!/usr/bin/env python3
"""Fix broken relative paths in self-hosted embed game HTML."""

import re
from pathlib import Path
from urllib.parse import unquote

EMBED_ROOT = Path(__file__).resolve().parent.parent / "public" / "embed"


def embed_base_for_file(index_path: Path) -> str:
    rel = index_path.relative_to(EMBED_ROOT)
    folder = rel.parent.as_posix()
    return f"/embed/{folder}/"


def fix_game_html(html: str, embed_base: str) -> str:
    text = html

    text = re.sub(
        r'fetch\("https://gamesdonut\.com/aws-s3-url"\)\s*'
        r"\.then\(\(response\) => \{[\s\S]*?\}\)\s*"
        r"\.then\(\(data\) => \{([\s\S]*?)\}\)\s*\n\s*</script>",
        lambda m: patch_block(m.group(1), embed_base) + "\n    </script>",
        text,
        count=1,
    )

    if (
        'var baseUrl = "./"' in text
        or "s3_bucket_url" in text
        or 'baseUrl + "GamesDonut/' in text
        or 'baseUrl + "GamesCandy/' in text
    ):
        text = patch_block(text, embed_base)

    return text


def patch_block(content: str, embed_base: str) -> str:
    block = content
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
    block = re.sub(r"\s*console\.log\([^\)]*\);\s*", "\n", block)
    return block


def main():
    updated = 0
    for index_path in EMBED_ROOT.rglob("index.html"):
        embed_base = embed_base_for_file(index_path)
        original = index_path.read_text(encoding="utf-8", errors="replace")
        fixed = fix_game_html(original, embed_base)
        if fixed != original:
            index_path.write_text(fixed, encoding="utf-8")
            updated += 1
            print(f"Fixed {index_path.relative_to(EMBED_ROOT.parent)}")

    print(f"Done: {updated} embed index files fixed")


if __name__ == "__main__":
    main()
