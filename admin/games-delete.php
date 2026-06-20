<?php

require_once __DIR__ . '/includes/bootstrap.php';
adminRequireLogin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: /admin/games.php');
    exit;
}

$slug = trim((string) ($_POST['slug'] ?? ''));
if ($slug === '') {
    header('Location: /admin/games.php');
    exit;
}

try {
    GamesStore::deleteGame($slug);
    AdminConfig::publishSite();
    header('Location: /admin/games.php?deleted=1');
} catch (Throwable $e) {
    header('Location: /admin/games.php?error=' . rawurlencode($e->getMessage()));
}
exit;
