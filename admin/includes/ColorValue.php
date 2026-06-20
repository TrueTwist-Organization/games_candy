<?php

class ColorValue
{
    public static function normalizeHex(string $color, string $fallback = '#6340F5'): string
    {
        $value = trim($color);
        if (preg_match('/^#[0-9A-Fa-f]{3}$/', $value) || preg_match('/^#[0-9A-Fa-f]{6}$/', $value)) {
            return strtoupper($value);
        }
        return strtoupper($fallback);
    }

    public static function isGradient(string $value): bool
    {
        return (bool) preg_match('/gradient\s*\(/i', $value);
    }

    /** @return array{direction: string, from: string, to: string}|null */
    public static function parseLinearGradient(string $value): ?array
    {
        if (!preg_match(
            '/linear-gradient\s*\(\s*([^,]+?)\s*,\s*(#[0-9A-Fa-f]{3,8}|rgb[a]?\([^)]+\))\s*,\s*(#[0-9A-Fa-f]{3,8}|rgb[a]?\([^)]+\))\s*\)/i',
            trim($value),
            $match
        )) {
            return null;
        }

        return [
            'direction' => trim($match[1]),
            'from' => self::normalizeHex($match[2]),
            'to' => self::normalizeHex($match[3]),
        ];
    }

    public static function buildLinearGradient(string $from, string $to, string $direction = '135deg'): string
    {
        return 'linear-gradient(' . $direction . ', ' . self::normalizeHex($from) . ', ' . self::normalizeHex($to) . ')';
    }

    public static function cssColor(string $value, string $fallback = '#6340F5'): string
    {
        if (self::isGradient($value)) {
            $parsed = self::parseLinearGradient($value);
            return $parsed ? $parsed['from'] : self::normalizeHex($fallback);
        }
        return self::normalizeHex($value, $fallback);
    }

    public static function cssBackground(string $value, string $fallback = '#6340F5'): string
    {
        $raw = trim($value);
        if (self::isGradient($raw)) {
            return $raw;
        }
        return self::normalizeHex($raw, $fallback);
    }

    public static function backgroundCss(string $value, string $fallback = '#6340F5'): string
    {
        $bg = self::cssBackground($value, $fallback);
        if (self::isGradient($bg)) {
            return 'background-image: ' . $bg . ' !important; background-color: transparent !important;';
        }
        return 'background-color: ' . $bg . ' !important;';
    }

    public static function tournamentGradient(string $primary, string $accent): string
    {
        if (self::isGradient($primary)) {
            return trim($primary);
        }
        return 'linear-gradient(to right, ' . self::cssColor($primary) . ', ' . self::cssColor($accent) . ')';
    }
}
