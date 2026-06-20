<?php

require_once __DIR__ . '/GamePageBuilder.php';

class GamesStore
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

    private static function customGamesPath(): string
    {
        return ADMIN_ROOT . '/data/custom-games.json';
    }

    private static function manifestPath(): string
    {
        return PUBLIC_PATH . '/embed/manifest.json';
    }

    private static function hiddenGamesPath(): string
    {
        return ADMIN_ROOT . '/data/hidden-games.json';
    }

    /** @return list<string> */
    public static function loadHiddenGames(): array
    {
        if (!is_file(self::hiddenGamesPath())) {
            return [];
        }
        $data = json_decode(file_get_contents(self::hiddenGamesPath()) ?: '{}', true);
        if (!is_array($data['slugs'] ?? null)) {
            return [];
        }
        return array_values(array_map('strval', $data['slugs']));
    }

    /** @param list<string> $slugs */
    private static function saveHiddenGames(array $slugs): void
    {
        if (!is_dir(dirname(self::hiddenGamesPath()))) {
            mkdir(dirname(self::hiddenGamesPath()), 0755, true);
        }
        $unique = array_values(array_unique(array_map('strval', $slugs)));
        file_put_contents(self::hiddenGamesPath(), json_encode(['slugs' => $unique], JSON_PRETTY_PRINT));
    }

    private static function embedFolderFromPath(string $embed): string
    {
        if (preg_match('#/embed/g/([^/]+)/#', $embed, $match)) {
            return $match[1];
        }
        return '';
    }

    /** @return array<string, mixed> */
    private static function buildStoredMeta(array $input, string $slug, array $existing = []): array
    {
        $title = trim((string) ($input['title'] ?? ''));
        $category = trim((string) ($input['category'] ?? 'Puzzle'));
        $genre = trim((string) ($input['genre'] ?? ''));
        $score = trim((string) ($input['score'] ?? '7.5'));
        $tags = trim((string) ($input['tags'] ?? ''));
        $description = trim((string) ($input['description'] ?? ''));
        $howToPlay = trim((string) ($input['how_to_play'] ?? ''));
        $editorsReview = trim((string) ($input['editors_review'] ?? ''));
        $thumb = trim((string) ($input['thumb'] ?? ''));
        $landscapeThumb = trim((string) ($input['landscape_thumb'] ?? ''));
        $portraitThumb = trim((string) ($input['portrait_thumb'] ?? ''));
        $embedFolder = trim((string) ($input['gamemonetize_hash'] ?? $input['embed_folder'] ?? ''));
        $categoryKey = strtolower($category);
        $flags = self::parseFlags($input);

        $stored = array_merge($existing, [
            'title' => $title,
            'category' => $categoryKey,
            'genre' => $genre !== '' ? $genre : (self::GENRE_LABELS[$categoryKey] ?? 'Casual'),
            'score' => $score,
            'tags' => $tags,
            'description' => $description !== '' ? $description : GamePageBuilder::defaultDescription($title),
            'how_to_play' => $howToPlay,
            'editors_review' => $editorsReview,
            'gamemonetize_hash' => $embedFolder,
            'embed_folder' => $embedFolder,
            'thumb' => $thumb,
            'landscape_thumb' => $landscapeThumb,
            'portrait_thumb' => $portraitThumb,
            'flags' => $flags,
            'game_id' => (string) ($existing['game_id'] ?? GamePageBuilder::generateGameId($slug)),
            'updated_at' => date('c'),
        ]);

        return $stored;
    }

    /** @return array<string, mixed> */
    public static function getGameEditData(string $slug): array
    {
        $manifest = self::loadManifest();
        $entry = null;
        foreach ($manifest as $item) {
            if ((string) ($item['slug'] ?? '') === $slug) {
                $entry = $item;
                break;
            }
        }
        if ($entry === null) {
            throw new InvalidArgumentException('Game not found.');
        }

        $custom = self::getCustomMeta($slug) ?? [];
        $gamePage = PUBLIC_PATH . '/game/' . $slug . '/index.html';
        $title = str_replace(['_', '-'], ' ', $slug);
        if (is_file($gamePage)) {
            $html = file_get_contents($gamePage) ?: '';
            if (preg_match('/<title>([^<|]+)/', $html, $match)) {
                $title = trim(preg_replace('/\s*-\s*Play online games.*/i', '', $match[1]));
            }
        }

        $storedTitle = (string) ($custom['title'] ?? $title);
        $embedFolder = (string) ($custom['gamemonetize_hash'] ?? $custom['embed_folder'] ?? self::embedFolderFromPath((string) ($entry['embed'] ?? '')));
        $category = (string) ($custom['category'] ?? 'puzzle');
        $categoryLabel = ucfirst($category);

        return [
            'title' => $storedTitle,
            'slug' => $slug,
            'gamemonetize_hash' => $embedFolder,
            'embed' => (string) ($entry['embed'] ?? ''),
            'category' => $categoryLabel,
            'genre' => (string) ($custom['genre'] ?? ''),
            'score' => (string) ($custom['score'] ?? '7.5'),
            'tags' => (string) ($custom['tags'] ?? ''),
            'description' => (string) ($custom['description'] ?? ''),
            'how_to_play' => (string) ($custom['how_to_play'] ?? ''),
            'editors_review' => (string) ($custom['editors_review'] ?? ''),
            'thumb' => (string) ($custom['thumb'] ?? ''),
            'landscape_thumb' => (string) ($custom['landscape_thumb'] ?? ''),
            'portrait_thumb' => (string) ($custom['portrait_thumb'] ?? ''),
            'flag_hot' => is_array($custom['flags'] ?? null) && in_array('hot', $custom['flags'], true) ? '1' : '',
            'flag_trending' => is_array($custom['flags'] ?? null) && in_array('trending', $custom['flags'], true) ? '1' : '',
            'flag_new' => is_array($custom['flags'] ?? null) && in_array('new', $custom['flags'], true) ? '1' : '',
            'is_admin_added' => !empty($custom['added_at']),
        ];
    }

    public static function categories(): array
    {
        return self::CATEGORIES;
    }

    public static function slugify(string $value): string
    {
        $slug = trim($value);
        $slug = preg_replace('/[^\w\s-]/', '', $slug) ?? '';
        $slug = preg_replace('/[\s_]+/', '-', $slug) ?? '';
        $slug = preg_replace('/-+/', '-', $slug) ?? '';
        return trim($slug, '-');
    }

    /** @return list<string> */
    private static function parseFlags(array $input): array
    {
        $flags = [];
        if (!empty($input['flag_hot'])) {
            $flags[] = 'hot';
        }
        if (!empty($input['flag_trending'])) {
            $flags[] = 'trending';
        }
        if (!empty($input['flag_new'])) {
            $flags[] = 'new';
        }
        return $flags;
    }

    public static function loadCustomGames(): array
    {
        if (!is_file(self::customGamesPath())) {
            return [];
        }

        $data = json_decode(file_get_contents(self::customGamesPath()) ?: '{}', true);
        return is_array($data) ? $data : [];
    }

    private static function saveCustomGames(array $data): void
    {
        if (!is_dir(dirname(self::customGamesPath()))) {
            mkdir(dirname(self::customGamesPath()), 0755, true);
        }
        file_put_contents(self::customGamesPath(), json_encode($data, JSON_PRETTY_PRINT));
    }

    public static function loadManifest(): array
    {
        if (!is_file(self::manifestPath())) {
            return [];
        }
        $data = json_decode(file_get_contents(self::manifestPath()) ?: '[]', true);
        return is_array($data) ? $data : [];
    }

    public static function getCustomMeta(string $slug): ?array
    {
        $all = self::loadCustomGames();
        return $all[$slug] ?? null;
    }

    public static function listCustomGamesForSite(): array
    {
        $custom = self::loadCustomGames();
        $manifest = self::loadManifest();
        $hidden = array_flip(self::loadHiddenGames());
        $games = [];

        foreach ($custom as $slug => $meta) {
            if (isset($hidden[$slug])) {
                continue;
            }
            $manifestEntry = null;
            foreach ($manifest as $item) {
                if ((string) ($item['slug'] ?? '') === $slug) {
                    $manifestEntry = $item;
                    break;
                }
            }
            $normalized = GamePageBuilder::normalizeGameData([
                'slug' => $slug,
                'title' => $meta['title'] ?? $slug,
                'embed' => $manifestEntry['embed'] ?? '',
                'gamemonetize_hash' => $meta['gamemonetize_hash'] ?? $meta['embed_folder'] ?? '',
                'description' => $meta['description'] ?? '',
                'thumb' => $meta['thumb'] ?? '',
                'landscape_thumb' => $meta['landscape_thumb'] ?? '',
                'portrait_thumb' => $meta['portrait_thumb'] ?? '',
                'game_id' => $meta['game_id'] ?? '',
            ]);
            $games[] = [
                'slug' => $slug,
                'title' => $meta['title'] ?? $normalized['title'],
                'category' => $meta['category'] ?? 'casual',
                'genre' => $meta['genre'] ?? 'Casual',
                'score' => $meta['score'] ?? '7.5',
                'flags' => is_array($meta['flags'] ?? null) ? $meta['flags'] : [],
                'embed' => $manifestEntry['embed'] ?? $normalized['embed'],
                'game_id' => $normalized['game_id'],
                'description' => $normalized['description'],
                'thumbnail_squere' => $meta['portrait_thumb'] ?? $meta['thumb'] ?? $normalized['portrait'],
                'thumbnail_landscape_16_9' => $meta['landscape_thumb'] ?? $meta['thumb'] ?? $normalized['landscape'],
                'added_at' => $meta['added_at'] ?? '',
            ];
        }

        usort($games, static fn(array $a, array $b): int => strcmp((string) ($b['added_at'] ?? ''), (string) ($a['added_at'] ?? '')));
        return $games;
    }

    public static function addGame(array $input): array
    {
        $title = trim((string) ($input['title'] ?? ''));
        $slug = self::slugify((string) ($input['slug'] ?? '')) ?: self::slugify($title);
        $category = trim((string) ($input['category'] ?? 'Puzzle'));
        $genre = trim((string) ($input['genre'] ?? ''));
        $score = trim((string) ($input['score'] ?? '7.5'));
        $tags = trim((string) ($input['tags'] ?? ''));
        $description = trim((string) ($input['description'] ?? ''));
        $howToPlay = trim((string) ($input['how_to_play'] ?? ''));
        $editorsReview = trim((string) ($input['editors_review'] ?? ''));
        $thumb = trim((string) ($input['thumb'] ?? ''));
        $landscapeThumb = trim((string) ($input['landscape_thumb'] ?? ''));
        $portraitThumb = trim((string) ($input['portrait_thumb'] ?? ''));
        $flags = self::parseFlags($input);
        $embedFolder = trim((string) ($input['gamemonetize_hash'] ?? ''));

        if ($title === '') {
            throw new InvalidArgumentException('Title is required.');
        }
        if ($slug === '') {
            throw new InvalidArgumentException('Slug is required.');
        }

        $embed = GamePageBuilder::resolveEmbed($input);
        $manifest = self::loadManifest();
        foreach ($manifest as $item) {
            if ((string) ($item['slug'] ?? '') === $slug) {
                throw new InvalidArgumentException('A game with slug "' . $slug . '" already exists.');
            }
        }

        $gameId = GamePageBuilder::generateGameId($slug);
        $manifest[] = ['slug' => $slug, 'embed' => $embed];
        usort($manifest, static fn(array $a, array $b): int => strcasecmp((string) ($a['slug'] ?? ''), (string) ($b['slug'] ?? '')));
        file_put_contents(self::manifestPath(), json_encode($manifest, JSON_PRETTY_PRINT));

        $categoryKey = strtolower($category);
        if ($flags === []) {
            $flags = ['new'];
        }
        $stored = [
            'title' => $title,
            'category' => $categoryKey,
            'genre' => $genre !== '' ? $genre : (self::GENRE_LABELS[$categoryKey] ?? 'Casual'),
            'score' => $score,
            'tags' => $tags,
            'description' => $description !== '' ? $description : GamePageBuilder::defaultDescription($title),
            'how_to_play' => $howToPlay,
            'editors_review' => $editorsReview,
            'gamemonetize_hash' => $embedFolder,
            'embed_folder' => $embedFolder,
            'thumb' => $thumb,
            'landscape_thumb' => $landscapeThumb,
            'portrait_thumb' => $portraitThumb,
            'flags' => $flags,
            'game_id' => $gameId,
            'added_at' => date('c'),
        ];
        $custom = self::loadCustomGames();
        $custom[$slug] = $stored;
        self::saveCustomGames($custom);

        GamePageBuilder::writeGamePages([
            'slug' => $slug,
            'title' => $title,
            'embed' => $embed,
            'description' => $stored['description'],
            'how_to_play' => $howToPlay,
            'editors_review' => $editorsReview,
            'thumb' => $thumb,
            'landscape_thumb' => $landscapeThumb,
            'portrait_thumb' => $portraitThumb,
            'game_id' => $gameId,
        ]);

        return [
            'slug' => $slug,
            'title' => $title,
            'embed' => $embed,
            'category' => $category,
            'genre' => $genre,
            'score' => $score,
            'hash' => $embedFolder,
            'flags' => $flags,
            'game_id' => $gameId,
        ];
    }

    /** @return array{slug: string, title: string, embed: string} */
    public static function updateGame(string $slug, array $input): array
    {
        $cleanSlug = trim($slug);
        if ($cleanSlug === '') {
            throw new InvalidArgumentException('Game slug is required.');
        }

        $manifest = self::loadManifest();
        $index = null;
        foreach ($manifest as $i => $item) {
            if ((string) ($item['slug'] ?? '') === $cleanSlug) {
                $index = $i;
                break;
            }
        }
        if ($index === null) {
            throw new InvalidArgumentException('Game not found.');
        }

        $embed = GamePageBuilder::resolveEmbed($input);
        $manifest[$index]['embed'] = $embed;
        file_put_contents(self::manifestPath(), json_encode($manifest, JSON_PRETTY_PRINT));

        $custom = self::loadCustomGames();
        $existing = $custom[$cleanSlug] ?? [];
        $stored = self::buildStoredMeta($input, $cleanSlug, $existing);
        if ($stored['flags'] === []) {
            $stored['flags'] = ['new'];
        }
        if (!empty($existing['added_at'])) {
            $stored['added_at'] = $existing['added_at'];
        }
        $custom[$cleanSlug] = $stored;
        self::saveCustomGames($custom);

        if (!empty($existing['added_at']) || GamePageBuilder::isAdminGeneratedPage($cleanSlug)) {
            GamePageBuilder::writeGamePages([
                'slug' => $cleanSlug,
                'title' => $stored['title'],
                'embed' => $embed,
                'description' => $stored['description'],
                'how_to_play' => $stored['how_to_play'],
                'editors_review' => $stored['editors_review'],
                'thumb' => $stored['thumb'],
                'landscape_thumb' => $stored['landscape_thumb'],
                'portrait_thumb' => $stored['portrait_thumb'],
                'game_id' => $stored['game_id'],
            ]);
        }

        return [
            'slug' => $cleanSlug,
            'title' => (string) $stored['title'],
            'embed' => $embed,
        ];
    }

    /** @return array{slug: string} */
    public static function deleteGame(string $slug): array
    {
        $cleanSlug = trim($slug);
        if ($cleanSlug === '') {
            throw new InvalidArgumentException('Game slug is required.');
        }

        $manifest = self::loadManifest();
        $found = false;
        foreach ($manifest as $item) {
            if ((string) ($item['slug'] ?? '') === $cleanSlug) {
                $found = true;
                break;
            }
        }
        if (!$found) {
            throw new InvalidArgumentException('Game not found.');
        }

        $custom = self::loadCustomGames();
        $wasAdminAdded = !empty($custom[$cleanSlug]['added_at']);

        $manifest = array_values(array_filter($manifest, static fn(array $item): bool => (string) ($item['slug'] ?? '') !== $cleanSlug));
        file_put_contents(self::manifestPath(), json_encode($manifest, JSON_PRETTY_PRINT));

        $hidden = self::loadHiddenGames();
        if (!in_array($cleanSlug, $hidden, true)) {
            $hidden[] = $cleanSlug;
        }
        self::saveHiddenGames($hidden);

        unset($custom[$cleanSlug]);
        self::saveCustomGames($custom);

        if ($wasAdminAdded || GamePageBuilder::isAdminGeneratedPage($cleanSlug)) {
            GamePageBuilder::removeGamePages($cleanSlug);
        }

        return ['slug' => $cleanSlug];
    }
}
