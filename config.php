<?php
/**
 * GamesCandy site configuration.
 * Hostinger: set your real domain below (NOT "yourdomain.com" — that is only an example).
 * Example: https://ukmob.workfromhomejobshub.com
 */

define('SITE_NAME', 'GamesCandy');
define('SITE_URL', getenv('SITE_URL') ?: 'http://localhost:8080');
define('PUBLIC_PATH', __DIR__ . '/public');
define('REMOTE_URL', 'https://gamesdonut.com');
define('S3_REFERER', 'https://gamesdonut.com/');
define('COOKIE_DOMAIN', parse_url(SITE_URL, PHP_URL_HOST) ?: 'localhost');

define('EMBED_BUCKETS', [
    'g' => 'gamesdonut-games-2026',
    'n' => 'gamesdonut-games-new',
]);

define('EMBED_PREFIX', [
    'gamesdonut-games-2026' => 'g',
    'gamesdonut-games-new' => 'n',
]);

define('S3_BUCKETS', [
    'gamesdonut-games-2026' => 'gamesdonut-games-2026.s3.ap-south-1.amazonaws.com',
    'gamesdonut-games-new' => 'gamesdonut-games-new.s3.ap-south-1.amazonaws.com',
]);

define('API_ROUTES', [
    '/update-game-time',
    '/get-recent-games',
    '/update-tournament-play-time',
    '/save-fcm-token',
]);
