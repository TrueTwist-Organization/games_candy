<?php

class AnalyticsView
{
    public static function hasTrackingCode(array $analyticsConfig): bool
    {
        return trim((string) ($analyticsConfig['tracking_code'] ?? '')) !== ''
            || trim((string) ($analyticsConfig['ga4_id'] ?? '')) !== ''
            || trim((string) ($analyticsConfig['google_ads_id'] ?? '')) !== '';
    }

    public static function parseInput(string $input): array
    {
        $input = trim($input);
        if ($input === '') {
            return ['type' => 'none'];
        }

        if (preg_match('/G-[A-Z0-9]+/i', $input) || preg_match('/AW-[0-9]+/i', $input) || preg_match('/UA-[0-9-]+/i', $input)) {
            preg_match('/G-[A-Z0-9]+/i', $input, $ga4);
            preg_match('/AW-[0-9]+/i', $input, $aw);
            return [
                'type' => 'tracking',
                'tracking_code' => $input,
                'ga4_id' => $ga4[0] ?? '',
                'google_ads_id' => $aw[0] ?? '',
            ];
        }

        $compact = strtoupper(preg_replace('/\s+/', '', $input) ?? '');
        if (preg_match('/^G[0-9A-F]{4,}$/', $compact)) {
            return ['type' => 'user', 'user_id' => $compact];
        }

        if (preg_match('/^\d+$/', $input)) {
            return ['type' => 'game', 'game_id' => $input];
        }

        if (str_starts_with($compact, 'G')) {
            return ['type' => 'user_search', 'search' => $compact];
        }

        return [
            'type' => 'tracking',
            'tracking_code' => $input,
            'ga4_id' => '',
            'google_ads_id' => '',
        ];
    }

    public static function renderSiteDashboard(array $analyticsConfig): void
    {
        $summary = AnalyticsStore::summary();
        $topGames = AnalyticsStore::topGames(10);
        $recent = AnalyticsStore::recentPlays(15);
        $users = AnalyticsStore::listAllUsers(20);
        $codeLabel = trim((string) ($analyticsConfig['tracking_code'] ?? ''));
        ?>
        <div class="border border-slate-200 rounded-xl bg-white p-6 mb-4">
            <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h2 class="font-bold">Site Analytics</h2>
                <?php if ($codeLabel !== ''): ?>
                    <span class="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-medium">Tracking: <?= htmlspecialchars($codeLabel) ?></span>
                <?php endif; ?>
            </div>
            <p class="text-xs text-slate-500 mb-4">Live play data from your GamesCandy site<?= ($analyticsConfig['ga4_id'] ?? '') !== '' ? ' · GA4 ' . htmlspecialchars((string) $analyticsConfig['ga4_id']) : '' ?><?= ($analyticsConfig['google_ads_id'] ?? '') !== '' ? ' · Ads ' . htmlspecialchars((string) $analyticsConfig['google_ads_id']) : '' ?>.</p>

            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div class="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div class="text-xs font-semibold text-slate-500 uppercase">Total Plays</div>
                    <div class="text-2xl font-bold text-indigo-600 mt-1"><?= adminFormatNumber((int) $summary['total_plays']) ?></div>
                </div>
                <div class="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div class="text-xs font-semibold text-slate-500 uppercase">Total Users</div>
                    <div class="text-2xl font-bold text-indigo-600 mt-1"><?= adminFormatNumber((int) $summary['total_users']) ?></div>
                </div>
                <div class="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div class="text-xs font-semibold text-slate-500 uppercase">Today Plays</div>
                    <div class="text-2xl font-bold text-indigo-600 mt-1"><?= adminFormatNumber((int) $summary['today_plays']) ?></div>
                </div>
                <div class="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div class="text-xs font-semibold text-slate-500 uppercase">Total Play Time</div>
                    <div class="text-2xl font-bold text-indigo-600 mt-1"><?= adminFormatDuration((int) $summary['total_play_time_ms']) ?></div>
                </div>
            </div>

            <h3 class="font-semibold text-sm mb-2">Top Games</h3>
            <div class="overflow-x-auto border border-slate-200 rounded-lg mb-6">
                <table class="w-full text-sm">
                    <thead class="bg-slate-50 text-xs uppercase text-slate-500">
                        <tr>
                            <th class="text-left px-4 py-3 font-semibold">Game ID</th>
                            <th class="text-left px-4 py-3 font-semibold">Game</th>
                            <th class="text-left px-4 py-3 font-semibold">Plays</th>
                            <th class="text-left px-4 py-3 font-semibold">Play Time</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                    <?php foreach ($topGames as $row): ?>
                        <?php $game = GamesCatalog::findByGameId((string) $row['game_id']); ?>
                        <tr>
                            <td class="px-4 py-3"><?= htmlspecialchars((string) $row['game_id']) ?></td>
                            <td class="px-4 py-3"><?= htmlspecialchars($game['title'] ?? ($row['game_slug'] ?: '-')) ?></td>
                            <td class="px-4 py-3"><?= adminFormatNumber((int) $row['plays']) ?></td>
                            <td class="px-4 py-3"><?= adminFormatDuration((int) $row['total_time_ms']) ?></td>
                        </tr>
                    <?php endforeach; ?>
                    </tbody>
                </table>
            </div>

            <h3 class="font-semibold text-sm mb-2">Recent Activity</h3>
            <div class="overflow-x-auto border border-slate-200 rounded-lg mb-6">
                <table class="w-full text-sm">
                    <thead class="bg-slate-50 text-xs uppercase text-slate-500">
                        <tr>
                            <th class="text-left px-4 py-3 font-semibold">User ID</th>
                            <th class="text-left px-4 py-3 font-semibold">Game</th>
                            <th class="text-left px-4 py-3 font-semibold">Time</th>
                            <th class="text-left px-4 py-3 font-semibold">When</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                    <?php foreach ($recent as $row): ?>
                        <?php $game = GamesCatalog::findByGameId((string) $row['game_id']); ?>
                        <tr>
                            <td class="px-4 py-3"><a class="text-blue-600 hover:text-blue-800 font-medium" href="/admin/analytics.php?q=<?= urlencode((string) $row['user_id']) ?>"><?= htmlspecialchars((string) $row['user_id']) ?></a></td>
                            <td class="px-4 py-3"><?= htmlspecialchars($game['title'] ?? ($row['game_slug'] ?: '-')) ?></td>
                            <td class="px-4 py-3"><?= adminFormatDuration((int) $row['play_time_ms']) ?></td>
                            <td class="px-4 py-3"><?= htmlspecialchars((string) $row['created_at']) ?></td>
                        </tr>
                    <?php endforeach; ?>
                    </tbody>
                </table>
            </div>

            <h3 class="font-semibold text-sm mb-2">All Users</h3>
            <div class="overflow-x-auto border border-slate-200 rounded-lg">
                <table class="w-full text-sm">
                    <thead class="bg-slate-50 text-xs uppercase text-slate-500">
                        <tr>
                            <th class="text-left px-4 py-3 font-semibold">User ID</th>
                            <th class="text-left px-4 py-3 font-semibold">Plays</th>
                            <th class="text-left px-4 py-3 font-semibold">Play Time</th>
                            <th class="text-left px-4 py-3 font-semibold">Last Seen</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                    <?php foreach ($users as $row): ?>
                        <tr>
                            <td class="px-4 py-3"><a class="text-blue-600 hover:text-blue-800 font-medium" href="/admin/analytics.php?q=<?= urlencode((string) $row['user_id']) ?>"><?= htmlspecialchars((string) $row['user_id']) ?></a></td>
                            <td class="px-4 py-3"><?= adminFormatNumber((int) $row['total_plays']) ?></td>
                            <td class="px-4 py-3"><?= adminFormatDuration((int) $row['total_time_ms']) ?></td>
                            <td class="px-4 py-3"><?= htmlspecialchars((string) $row['last_seen']) ?></td>
                        </tr>
                    <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>
        <?php
    }

    public static function renderUserSection(string $userId, ?array $userData): void
    {
        ?>
        <div class="border border-slate-200 rounded-xl bg-white p-6 mb-4">
            <h2 class="font-bold mb-4">User Analytics: <?= htmlspecialchars($userId) ?></h2>
            <?php if (empty($userData['summary']['total_plays'])): ?>
                <p class="text-sm text-slate-500">No play data found for this user ID yet.</p>
            <?php else: ?>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div class="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <div class="text-xs font-semibold text-slate-500 uppercase">Total Plays</div>
                        <div class="text-2xl font-bold text-indigo-600 mt-1"><?= adminFormatNumber((int) $userData['summary']['total_plays']) ?></div>
                    </div>
                    <div class="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <div class="text-xs font-semibold text-slate-500 uppercase">Unique Games</div>
                        <div class="text-2xl font-bold text-indigo-600 mt-1"><?= adminFormatNumber((int) $userData['summary']['unique_games']) ?></div>
                    </div>
                    <div class="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <div class="text-xs font-semibold text-slate-500 uppercase">Total Play Time</div>
                        <div class="text-2xl font-bold text-indigo-600 mt-1"><?= adminFormatDuration((int) $userData['summary']['total_time_ms']) ?></div>
                    </div>
                </div>
                <div class="overflow-x-auto border border-slate-200 rounded-lg">
                    <table class="w-full text-sm">
                        <thead class="bg-slate-50 text-xs uppercase text-slate-500">
                            <tr>
                                <th class="text-left px-4 py-3 font-semibold">Game ID</th>
                                <th class="text-left px-4 py-3 font-semibold">Game</th>
                                <th class="text-left px-4 py-3 font-semibold">Plays</th>
                                <th class="text-left px-4 py-3 font-semibold">Play Time</th>
                                <th class="text-left px-4 py-3 font-semibold">Last Played</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                        <?php foreach ($userData['games'] as $row): ?>
                            <?php $game = GamesCatalog::findByGameId((string) $row['game_id']); ?>
                            <tr>
                                <td class="px-4 py-3"><?= htmlspecialchars((string) $row['game_id']) ?></td>
                                <td class="px-4 py-3"><?= htmlspecialchars($game['title'] ?? ($row['game_slug'] ?: '-')) ?></td>
                                <td class="px-4 py-3"><?= adminFormatNumber((int) $row['plays']) ?></td>
                                <td class="px-4 py-3"><?= adminFormatDuration((int) $row['total_time_ms']) ?></td>
                                <td class="px-4 py-3"><?= htmlspecialchars((string) $row['last_played']) ?></td>
                            </tr>
                        <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            <?php endif; ?>
        </div>
        <?php
    }
}
