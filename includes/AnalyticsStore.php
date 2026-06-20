<?php

class AnalyticsStore
{
    private static ?PDO $pdo = null;

    public static function dbPath(): string
    {
        return dirname(__DIR__) . '/admin/data/analytics.db';
    }

    public static function pdo(): PDO
    {
        if (self::$pdo instanceof PDO) {
            return self::$pdo;
        }

        $dir = dirname(self::dbPath());
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        self::$pdo = new PDO('sqlite:' . self::dbPath());
        self::$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        self::$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        self::migrate();
        return self::$pdo;
    }

    public static function migrate(): void
    {
        $pdo = self::$pdo ?? self::pdo();
        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS play_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                game_id TEXT NOT NULL,
                game_slug TEXT,
                play_time_ms INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )'
        );
        $pdo->exec('CREATE INDEX IF NOT EXISTS idx_play_user ON play_events(user_id)');
        $pdo->exec('CREATE INDEX IF NOT EXISTS idx_play_game ON play_events(game_id)');
        $pdo->exec('CREATE INDEX IF NOT EXISTS idx_play_created ON play_events(created_at)');
    }

    public static function resolveGuestUserId(): string
    {
        if (!empty($_COOKIE['gc_user_id'])) {
            return (string) $_COOKIE['gc_user_id'];
        }

        $id = 'G' . strtoupper(substr(bin2hex(random_bytes(4)), 0, 8));
        $domain = defined('COOKIE_DOMAIN') ? COOKIE_DOMAIN : '';
        $secure = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
        setcookie('gc_user_id', $id, [
            'expires' => time() + 86400 * 365,
            'path' => '/',
            'domain' => $domain ?: '',
            'secure' => $secure,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        return $id;
    }

    public static function recordPlays(string $userId, array $pendingGames): void
    {
        if ($pendingGames === []) {
            return;
        }

        $pdo = self::pdo();
        $stmt = $pdo->prepare(
            'INSERT INTO play_events (user_id, game_id, game_slug, play_time_ms, created_at)
             VALUES (:user_id, :game_id, :game_slug, :play_time_ms, :created_at)'
        );

        foreach ($pendingGames as $entry) {
            if (!is_array($entry)) {
                continue;
            }
            $gameId = (string) ($entry['game_id'] ?? '');
            if ($gameId === '') {
                continue;
            }
            $stmt->execute([
                ':user_id' => $userId,
                ':game_id' => $gameId,
                ':game_slug' => (string) ($entry['game_slug'] ?? ''),
                ':play_time_ms' => (int) ($entry['play_time'] ?? 0),
                ':created_at' => gmdate('Y-m-d H:i:s'),
            ]);
        }
    }

    public static function summary(): array
    {
        $pdo = self::pdo();
        return [
            'total_plays' => (int) $pdo->query('SELECT COUNT(*) FROM play_events')->fetchColumn(),
            'total_users' => (int) $pdo->query('SELECT COUNT(DISTINCT user_id) FROM play_events')->fetchColumn(),
            'total_play_time_ms' => (int) $pdo->query('SELECT COALESCE(SUM(play_time_ms), 0) FROM play_events')->fetchColumn(),
            'today_plays' => (int) $pdo->query(
                "SELECT COUNT(*) FROM play_events WHERE date(created_at) = date('now')"
            )->fetchColumn(),
        ];
    }

    public static function topGames(int $limit = 10): array
    {
        $stmt = self::pdo()->prepare(
            'SELECT game_id, game_slug, COUNT(*) AS plays, SUM(play_time_ms) AS total_time_ms
             FROM play_events
             GROUP BY game_id, game_slug
             ORDER BY plays DESC
             LIMIT :limit'
        );
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public static function recentPlays(int $limit = 20): array
    {
        $stmt = self::pdo()->prepare(
            'SELECT user_id, game_id, game_slug, play_time_ms, created_at
             FROM play_events
             ORDER BY id DESC
             LIMIT :limit'
        );
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public static function userAnalytics(string $userId): array
    {
        $pdo = self::pdo();
        $summaryStmt = $pdo->prepare(
            'SELECT COUNT(*) AS total_plays,
                    COALESCE(SUM(play_time_ms), 0) AS total_time_ms,
                    COUNT(DISTINCT game_id) AS unique_games,
                    MIN(created_at) AS first_seen,
                    MAX(created_at) AS last_seen
             FROM play_events
             WHERE user_id = :user_id'
        );
        $summaryStmt->execute([':user_id' => $userId]);
        $summary = $summaryStmt->fetch() ?: [];

        $gamesStmt = $pdo->prepare(
            'SELECT game_id, game_slug, COUNT(*) AS plays, SUM(play_time_ms) AS total_time_ms, MAX(created_at) AS last_played
             FROM play_events
             WHERE user_id = :user_id
             GROUP BY game_id, game_slug
             ORDER BY total_time_ms DESC'
        );
        $gamesStmt->execute([':user_id' => $userId]);
        $games = $gamesStmt->fetchAll();

        return ['summary' => $summary, 'games' => $games];
    }

    public static function listAllUsers(int $limit = 50): array
    {
        $stmt = self::pdo()->prepare(
            'SELECT user_id,
                    COUNT(*) AS total_plays,
                    COALESCE(SUM(play_time_ms), 0) AS total_time_ms,
                    MAX(created_at) AS last_seen
             FROM play_events
             GROUP BY user_id
             ORDER BY last_seen DESC
             LIMIT :limit'
        );
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public static function searchUsers(string $query, int $limit = 20): array
    {
        $stmt = self::pdo()->prepare(
            'SELECT user_id,
                    COUNT(*) AS total_plays,
                    COALESCE(SUM(play_time_ms), 0) AS total_time_ms,
                    MAX(created_at) AS last_seen
             FROM play_events
             WHERE user_id LIKE :query
             GROUP BY user_id
             ORDER BY last_seen DESC
             LIMIT :limit'
        );
        $stmt->bindValue(':query', '%' . $query . '%');
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public static function seedDemoData(array $games): void
    {
        $pdo = self::pdo();
        $count = (int) $pdo->query('SELECT COUNT(*) FROM play_events')->fetchColumn();
        if ($count > 0 || $games === []) {
            return;
        }

        $demoUsers = ['G10001', 'G10002', 'G10003'];
        $stmt = $pdo->prepare(
            'INSERT INTO play_events (user_id, game_id, game_slug, play_time_ms, created_at)
             VALUES (:user_id, :game_id, :game_slug, :play_time_ms, :created_at)'
        );

        foreach ($demoUsers as $index => $userId) {
            $slice = array_slice($games, $index * 7, 7);
            foreach ($slice as $game) {
                $stmt->execute([
                    ':user_id' => $userId,
                    ':game_id' => (string) ($game['game_id'] ?? '0'),
                    ':game_slug' => (string) ($game['slug'] ?? ''),
                    ':play_time_ms' => random_int(30, 600) * 1000,
                    ':created_at' => gmdate('Y-m-d H:i:s', time() - random_int(3600, 86400 * 14)),
                ]);
            }
        }
    }
}
