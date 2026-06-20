<?php

class GamesCatalog
{
    private const CATEGORIES = [
        'Action', 'Arcade', 'Casual', 'Puzzle', 'Quiz', 'Sports', 'Board', 'Match 3', 'Card',
    ];

    private const GENRE_LABELS = [
        'action' => 'Action',
        'arcade' => 'Arcade',
        'casual' => 'Casual',
        'puzzle' => 'Puzzles',
        'quiz' => 'Trivia',
        'sports' => 'Sports',
        'board' => 'Board',
        'match 3' => 'Match 3',
        'card' => 'Card',
    ];

    private static ?array $categoryMap = null;

    public static function all(): array
    {
        $manifestPath = PUBLIC_PATH . '/embed/manifest.json';
        if (!is_file($manifestPath)) {
            return [];
        }

        $manifest = json_decode(file_get_contents($manifestPath) ?: '[]', true);
        if (!is_array($manifest)) {
            return [];
        }

        $hidden = array_flip(GamesStore::loadHiddenGames());
        $games = [];
        foreach ($manifest as $item) {
            $slug = (string) ($item['slug'] ?? '');
            if ($slug === '' || isset($hidden[$slug])) {
                continue;
            }

            $meta = self::readGameMeta($slug);
            $games[] = [
                'slug' => $slug,
                'embed' => (string) ($item['embed'] ?? ''),
                'game_id' => $meta['game_id'],
                'title' => $meta['title'],
                'thumb' => $meta['thumb'],
                'category' => $meta['category'],
                'genre' => $meta['genre'],
                'score' => $meta['score'],
                'flags' => $meta['flags'],
                'slug_path' => $meta['slug_path'],
                'play_url' => '/game/' . rawurlencode($slug),
                'view_url' => '/view-game/' . rawurlencode($slug),
            ];
        }

        usort($games, static fn(array $a, array $b): int => strcasecmp($a['title'], $b['title']));
        return $games;
    }

    public static function findByGameId(string $gameId): ?array
    {
        foreach (self::all() as $game) {
            if ((string) $game['game_id'] === $gameId) {
                return $game;
            }
        }
        return null;
    }

    public static function findBySlug(string $slug): ?array
    {
        foreach (self::all() as $game) {
            if ($game['slug'] === $slug) {
                return $game;
            }
        }
        return null;
    }

    /** @param array<string, mixed> $game */
    public static function searchHaystack(array $game): string
    {
        $haystack = strtolower(
            ($game['title'] ?? '') . ' ' .
            ($game['slug'] ?? '') . ' ' .
            ($game['slug_path'] ?? '') . ' ' .
            ($game['category'] ?? '') . ' ' .
            ($game['genre'] ?? '') . ' ' .
            ($game['game_id'] ?? '') . ' ' .
            implode(' ', is_array($game['flags'] ?? null) ? $game['flags'] : [])
        );

        return str_replace(['_', '-'], ' ', $haystack);
    }

    /** @param list<array<string, mixed>> $games */
    public static function filterBySearch(array $games, string $query): array
    {
        $query = trim($query);
        if ($query === '') {
            return $games;
        }

        $terms = array_values(array_filter(preg_split('/\s+/', strtolower($query)) ?: []));
        if ($terms === []) {
            return $games;
        }

        return array_values(array_filter($games, static function (array $game) use ($terms): bool {
            $haystack = strtolower(
                ($game['title'] ?? '') . ' ' .
                ($game['slug'] ?? '') . ' ' .
                ($game['slug_path'] ?? '') . ' ' .
                ($game['category'] ?? '') . ' ' .
                ($game['genre'] ?? '') . ' ' .
                ($game['game_id'] ?? '') . ' ' .
                implode(' ', is_array($game['flags'] ?? null) ? $game['flags'] : [])
            );
            $haystack = str_replace(['_', '-'], ' ', $haystack);

            foreach ($terms as $term) {
                $term = str_replace(['_', '-'], ' ', $term);
                if (!str_contains($haystack, $term)) {
                    return false;
                }
            }

            return true;
        }));
    }

    private static function categoryMap(): array
    {
        if (self::$categoryMap !== null) {
            return self::$categoryMap;
        }

        $map = [];
        foreach (self::CATEGORIES as $category) {
            $page = PUBLIC_PATH . '/category/' . $category . '/index.html';
            if (!is_file($page)) {
                continue;
            }
            $html = file_get_contents($page) ?: '';
            if (preg_match_all('/href="\\/view-game\\/([^"]+)"/', $html, $matches)) {
                foreach ($matches[1] as $slug) {
                    $slug = rawurldecode($slug);
                    if (!isset($map[$slug])) {
                        $map[$slug] = strtolower($category);
                    }
                }
            }
        }

        self::$categoryMap = $map;
        return $map;
    }

    private static function slugToPath(string $slug): string
    {
        return strtolower(str_replace('_', '-', $slug));
    }

    private static function deriveScore(string $seed): string
    {
        $n = hexdec(substr(md5($seed), 0, 6));
        return number_format(6 + ($n % 35) / 10, 1, '.', '');
    }

    /** @return list<string> */
    private static function deriveFlags(string $slug, string $gameId): array
    {
        $seed = hexdec(substr(md5($slug . ':' . $gameId), 0, 8));
        $flags = [];
        if ($seed % 7 === 0) {
            $flags[] = 'hot';
        }
        if ($seed % 11 === 0) {
            $flags[] = 'trending';
        }
        if ($seed % 13 === 0 || str_contains($slug, '202') || str_contains($slug, 'Slide') || str_contains($slug, 'Sort')) {
            $flags[] = 'new';
        }
        return $flags;
    }

    private static function readGameMeta(string $slug): array
    {
        $gameId = '';
        $title = str_replace(['_', '-'], ' ', $slug);
        $thumb = '';

        $gamePage = PUBLIC_PATH . '/game/' . $slug . '/index.html';
        if (is_file($gamePage)) {
            $html = file_get_contents($gamePage) ?: '';
            if (preg_match('/game_id\s*=\s*"(\d+)"/', $html, $match)) {
                $gameId = $match[1];
            }
            if (preg_match('/<title>([^<|]+)/', $html, $match)) {
                $title = trim(preg_replace('/\s*-\s*Play online games.*/i', '', $match[1]));
            }
            if (preg_match('/game_thumbnail_images\\/[^"\' ]+\\.webp/i', $html, $match)) {
                $thumb = 'https://d3dnyybxkc04mp.cloudfront.net/' . $match[0];
            }
        }

        $custom = GamesStore::getCustomMeta($slug);

        $categories = self::categoryMap();
        if ($custom !== null && !empty($custom['category'])) {
            $category = (string) $custom['category'];
        } else {
            $category = $categories[$slug] ?? 'casual';
        }
        $genre = self::GENRE_LABELS[$category] ?? 'Casual';
        $score = self::deriveScore($gameId !== '' ? $gameId : $slug);
        $flags = self::deriveFlags($slug, $gameId);

        if ($custom !== null) {
            if (!empty($custom['title'])) {
                $title = (string) $custom['title'];
            }
            if (!empty($custom['thumb'])) {
                $thumb = (string) $custom['thumb'];
            }
            if (!empty($custom['genre'])) {
                $genre = (string) $custom['genre'];
            }
            if (!empty($custom['score'])) {
                $score = (string) $custom['score'];
            }
            if (!empty($custom['flags']) && is_array($custom['flags'])) {
                $flags = $custom['flags'];
            }
        }

        return [
            'game_id' => $gameId,
            'title' => $title,
            'thumb' => $thumb,
            'category' => $category,
            'genre' => $genre,
            'score' => $score,
            'flags' => $flags,
            'slug_path' => self::slugToPath($slug),
        ];
    }
}
