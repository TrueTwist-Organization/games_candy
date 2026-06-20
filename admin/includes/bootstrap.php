<?php

require_once dirname(__DIR__) . '/config.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/AdminConfig.php';
require_once __DIR__ . '/AdminSettings.php';
require_once __DIR__ . '/AnalyticsView.php';
require_once __DIR__ . '/GamesCatalog.php';
require_once __DIR__ . '/GamesStore.php';
require_once dirname(__DIR__, 2) . '/includes/AnalyticsStore.php';

$games = GamesCatalog::all();
AnalyticsStore::seedDemoData($games);
