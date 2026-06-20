<?php

require_once __DIR__ . '/includes/bootstrap.php';
adminRequireLogin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: /admin/games.php');
    exit;
}

AdminConfig::publishSite();
header('Location: /admin/games.php?published=1');
exit;
