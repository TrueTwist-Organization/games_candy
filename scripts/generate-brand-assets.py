#!/usr/bin/env python3
"""Generate GamesCandy candy lollipop favicon PNG/ICO assets."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
FAV_DIR = PUBLIC / "fav-icon"

PURPLE = (99, 64, 245, 255)
PURPLE_LIGHT = (139, 92, 246, 255)
PINK = (255, 93, 162, 255)
WHITE = (255, 255, 255, 255)
CYAN = (0, 240, 254, 255)
GOLD = (255, 209, 102, 255)
STICK_TOP = (255, 224, 138, 255)
STICK_BOTTOM = (255, 179, 71, 255)


def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def lerp_color(c1: tuple[int, ...], c2: tuple[int, ...], t: float) -> tuple[int, int, int, int]:
    return tuple(int(lerp(c1[i], c2[i], t)) for i in range(4))  # type: ignore[return-value]


def draw_gradient_circle(draw: ImageDraw.ImageDraw, cx: float, cy: float, radius: float) -> None:
    steps = max(8, int(radius * 2))
    for i in range(steps):
        t = i / max(steps - 1, 1)
        r = radius * (1 - i / steps)
        color = lerp_color(PURPLE_LIGHT, PURPLE, t * 0.8)
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color)


def draw_spiral_candy(draw: ImageDraw.ImageDraw, cx: float, cy: float, radius: float) -> None:
    draw.ellipse([cx - radius, cy - radius, cx + radius, cy + radius], fill=WHITE)
    for i in range(6):
        start = -90 + 60 * i
        color = PINK if i % 2 == 0 else WHITE
        draw.pieslice(
            [cx - radius, cy - radius, cx + radius, cy + radius],
            start=start,
            end=start + 60,
            fill=color,
        )
    inner = radius * 0.45
    draw.ellipse([cx - inner, cy - inner, cx + inner, cy + inner], fill=PURPLE)


def draw_stick(draw: ImageDraw.ImageDraw, cx: float, top: float, height: float, width: float) -> None:
    left = cx - width / 2
    right = cx + width / 2
    bottom = top + height
    for y in range(int(top), int(bottom)):
        t = (y - top) / max(height, 1)
        color = lerp_color(STICK_TOP, STICK_BOTTOM, t)
        draw.line([(left, y), (right, y)], fill=color, width=1)
    draw.rounded_rectangle([left, top, right, bottom], radius=width / 2, outline=(255, 255, 255, 70), width=1)


def draw_candy_icon(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    margin = size * 0.04
    cx = size / 2
    cy = size * 0.42
    bg_r = size / 2 - margin
    draw_gradient_circle(draw, cx, cy, bg_r)
    candy_r = bg_r * 0.58
    draw_spiral_candy(draw, cx, cy - candy_r * 0.05, candy_r)
    stick_w = max(2, size * 0.09)
    draw_stick(draw, cx, cy + candy_r * 0.65, bg_r * 0.92, stick_w)
    if size >= 48:
        r = size * 0.025
        draw.ellipse([cx - bg_r * 0.7 - r, cy - bg_r * 0.5 - r, cx - bg_r * 0.7 + r, cy - bg_r * 0.5 + r], fill=CYAN)
        draw.ellipse([cx + bg_r * 0.62 - r, cy - bg_r * 0.35 - r, cx + bg_r * 0.62 + r, cy - bg_r * 0.35 + r], fill=GOLD)
    return img


def save_png(path: Path, size: int) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    draw_candy_icon(size).save(path, format="PNG", optimize=True)


def save_ico(path: Path) -> None:
    sizes = [16, 32, 48, 64, 128, 256]
    icons = [draw_candy_icon(size) for size in sizes]
    icons[0].save(
        path,
        format="ICO",
        sizes=[(size, size) for size in sizes],
        append_images=icons[1:],
    )


def main() -> None:
    outputs = {
        FAV_DIR / "favicon-16x16.png": 16,
        FAV_DIR / "favicon-32x32.png": 32,
        FAV_DIR / "apple-touch-icon.png": 180,
        PUBLIC / "android-chrome-192x192.png": 192,
        PUBLIC / "android-chrome-512x512.png": 512,
    }
    for path, size in outputs.items():
        save_png(path, size)
        print(f"Wrote {path.relative_to(ROOT)} ({size}px)")
    save_ico(PUBLIC / "favicon.ico")
    print(f"Wrote {PUBLIC.relative_to(ROOT) / 'favicon.ico'}")


if __name__ == "__main__":
    main()
