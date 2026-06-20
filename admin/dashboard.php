<?php

require_once __DIR__ . '/includes/bootstrap.php';
adminRequireLogin();

header('Location: /admin/games.php');
exit;
