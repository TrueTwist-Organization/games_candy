#!/usr/bin/env php
<?php

require_once dirname(__DIR__) . '/config.php';
require_once dirname(__DIR__) . '/includes/AnalyticsStore.php';

$raw = stream_get_contents(STDIN);
$payload = json_decode($raw ?: '[]', true);
if (!is_array($payload)) {
    fwrite(STDERR, "Invalid payload\n");
    exit(1);
}

$userId = trim((string) ($payload['user_id'] ?? ''));
if ($userId === '') {
    $userId = 'G' . strtoupper(substr(bin2hex(random_bytes(4)), 0, 8));
}

$pending = $payload['pending_games'] ?? [];
if (!is_array($pending)) {
    $pending = [];
}

AnalyticsStore::recordPlays($userId, $pending);
echo json_encode(['success' => 1, 'user_id' => $userId]);
