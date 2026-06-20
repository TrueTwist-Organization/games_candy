<?php

class LocalApi
{
    public static function handle(string $path): void
    {
        header('Content-Type: application/json; charset=utf-8');
        header('Access-Control-Allow-Origin: *');

        switch ($path) {
            case '/update-game-time':
                self::handleUpdateGameTime();
                return;

            case '/update-tournament-play-time':
            case '/save-fcm-token':
                echo json_encode(['success' => 1]);
                return;

            case '/get-recent-games':
                echo json_encode([
                    'success' => 1,
                    'recent_games' => [],
                ], JSON_UNESCAPED_SLASHES);
                return;

            default:
                http_response_code(404);
                echo json_encode(['error' => 'Not found']);
        }
    }

    private static function requestBody(): array
    {
        $raw = file_get_contents('php://input');
        $json = json_decode($raw ?: '[]', true);
        if (is_array($json)) {
            return $json;
        }
        return is_array($_POST) ? $_POST : [];
    }

    private static function normalizePendingGames(array $body): array
    {
        $pending = $body['pending_games'] ?? [];
        if (!is_array($pending)) {
            return [];
        }

        $normalized = [];
        foreach ($pending as $entry) {
            if (!is_array($entry)) {
                continue;
            }
            $gameId = (string) ($entry['game_id'] ?? '');
            if ($gameId === '') {
                continue;
            }
            $normalized[] = [
                'game_id' => $gameId,
                'game_slug' => (string) ($entry['game_slug'] ?? ''),
                'play_time' => (int) ($entry['play_time'] ?? 0),
            ];
        }
        return $normalized;
    }

    private static function handleUpdateGameTime(): void
    {
        require_once __DIR__ . '/AnalyticsStore.php';
        $body = self::requestBody();
        $pending = self::normalizePendingGames($body);
        $userId = trim((string) ($body['user_id'] ?? ''));
        if ($userId === '') {
            $userId = AnalyticsStore::resolveGuestUserId();
        }
        AnalyticsStore::recordPlays($userId, $pending);
        echo json_encode(['success' => 1]);
    }
}
