<?php

define('ADMIN_APP_NAME', 'GamesCandy Admin');
define('ADMIN_PASSWORD', getenv('ADMIN_PASSWORD') ?: 'gamescandy2026');
define('ADMIN_SESSION_KEY', 'gamescandy_admin_auth');
define('ADMIN_ROOT', __DIR__);
define('ADMIN_ASSETS', '/admin/assets');

require_once dirname(__DIR__) . '/config.php';
