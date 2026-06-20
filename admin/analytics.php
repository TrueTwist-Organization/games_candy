<?php

require_once __DIR__ . '/includes/bootstrap.php';
adminRequireLogin();

$hasQueryParam = array_key_exists('q', $_GET);
$query = trim((string) ($_GET['q'] ?? $_GET['user_id'] ?? ''));
$gameId = trim((string) ($_GET['game_id'] ?? ''));
$parsed = AnalyticsView::parseInput($query);
$config = AdminConfig::load();
$analyticsConfig = $config['analytics'];
$showSiteDashboard = false;
$userData = null;
$userId = '';
$userResults = [];
$gameData = null;
$statusMessage = '';

if ($hasQueryParam) {
    if ($query === '') {
        AdminConfig::clearAnalyticsCodes();
        AdminConfig::publishSite();
        $analyticsConfig = AdminConfig::load()['analytics'];
        $showSiteDashboard = false;
        $statusMessage = 'Tracking code removed from your site.';
    } elseif ($parsed['type'] === 'tracking') {
        AdminConfig::saveAnalyticsCodes(
            (string) $parsed['tracking_code'],
            (string) ($parsed['ga4_id'] ?? ''),
            (string) ($parsed['google_ads_id'] ?? '')
        );
        AdminConfig::publishSite();
        $analyticsConfig = AdminConfig::load()['analytics'];
        $showSiteDashboard = true;
        $statusMessage = 'Tracking code saved and published to your site.';
    } elseif ($parsed['type'] === 'user') {
        $userId = (string) $parsed['user_id'];
        $userData = AnalyticsStore::userAnalytics($userId);
        $showSiteDashboard = false;
    } elseif ($parsed['type'] === 'user_search') {
        $userResults = AnalyticsStore::searchUsers((string) $parsed['search']);
        $showSiteDashboard = false;
    } elseif ($parsed['type'] === 'game') {
        $gameId = (string) $parsed['game_id'];
    }
} elseif ($query !== '') {
    if ($parsed['type'] === 'user') {
        $userId = (string) $parsed['user_id'];
        $userData = AnalyticsStore::userAnalytics($userId);
        $showSiteDashboard = false;
    } elseif ($parsed['type'] === 'user_search') {
        $userResults = AnalyticsStore::searchUsers((string) $parsed['search']);
        $showSiteDashboard = false;
    } elseif ($parsed['type'] === 'game') {
        $gameId = (string) $parsed['game_id'];
    }
}

if ($gameId !== '') {
    $game = GamesCatalog::findByGameId($gameId);
    $pdo = AnalyticsStore::pdo();
    $stmt = $pdo->prepare(
        'SELECT user_id, COUNT(*) AS plays, SUM(play_time_ms) AS total_time_ms, MAX(created_at) AS last_seen
         FROM play_events
         WHERE game_id = :game_id
         GROUP BY user_id
         ORDER BY total_time_ms DESC'
    );
    $stmt->execute([':game_id' => $gameId]);
    $gameData = [
        'game' => $game,
        'users' => $stmt->fetchAll(),
    ];
    $showSiteDashboard = false;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $search = trim((string) ($_POST['search'] ?? ''));
    if ($search !== '') {
        $userResults = AnalyticsStore::searchUsers($search);
        $showSiteDashboard = false;
    }
}

$inputValue = $hasQueryParam ? $query : (string) ($analyticsConfig['tracking_code'] ?? '');

require_once __DIR__ . '/includes/layout.php';
require_once __DIR__ . '/includes/form-helpers.php';

adminRenderHeader('analytics', count(GamesCatalog::all()));

if ($statusMessage !== '') {
    echo '<div class="mb-4 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-2">' . htmlspecialchars($statusMessage) . '</div>';
}
?>
<div class="border border-slate-200 rounded-xl bg-white p-6 mb-4">
    <h2 class="font-bold mb-1">Analytics</h2>
    <p class="text-xs text-slate-500 mb-4">Enter your tracking code for site stats, or a user ID for player details. Clear the field and click Show Analytics to remove tracking from your site.</p>
    <form class="flex flex-wrap gap-3" method="get">
        <input type="text" name="q" value="<?= htmlspecialchars($inputValue) ?>" placeholder="Enter code" class="flex-1 min-w-[280px] border border-slate-300 rounded-lg px-3 py-2 text-sm">
        <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg px-4 py-2 text-sm">Show Analytics</button>
    </form>
</div>

<?php if ($showSiteDashboard): ?>
    <?php AnalyticsView::renderSiteDashboard($analyticsConfig); ?>
<?php elseif ($userId === '' && $gameId === '' && $userResults === [] && $statusMessage === ''): ?>
<div class="border border-slate-200 rounded-xl bg-white p-6 mb-4">
    <p class="text-sm text-slate-500">Enter your Google Analytics tracking code above and click <strong>Show Analytics</strong> to view site stats. Clear the field and click again to remove tracking.</p>
</div>
<?php endif; ?>

<?php if ($userId !== ''): ?>
    <?php AnalyticsView::renderUserSection($userId, $userData); ?>
<?php endif; ?>

<?php if ($userResults !== []): ?>
<div class="border border-slate-200 rounded-xl bg-white p-6 mb-4">
    <h2 class="font-bold mb-4">Matching Users</h2>
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
            <?php foreach ($userResults as $row): ?>
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
<?php endif; ?>

<?php if ($gameId !== '' && $gameData !== null): ?>
<div class="border border-slate-200 rounded-xl bg-white p-6 mb-4">
    <h2 class="font-bold mb-4">Game Analytics: <?= htmlspecialchars($gameData['game']['title'] ?? ('Game #' . $gameId)) ?></h2>
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
            <?php foreach ($gameData['users'] as $row): ?>
                <tr>
                    <td class="px-4 py-3"><a class="text-blue-600 hover:text-blue-800 font-medium" href="/admin/analytics.php?q=<?= urlencode((string) $row['user_id']) ?>"><?= htmlspecialchars((string) $row['user_id']) ?></a></td>
                    <td class="px-4 py-3"><?= adminFormatNumber((int) $row['plays']) ?></td>
                    <td class="px-4 py-3"><?= adminFormatDuration((int) $row['total_time_ms']) ?></td>
                    <td class="px-4 py-3"><?= htmlspecialchars((string) $row['last_seen']) ?></td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</div>
<?php endif; ?>

<p class="text-sm text-slate-500">Demo user IDs: <code class="text-xs bg-slate-100 px-2 py-1 rounded">G10001</code>, <code class="text-xs bg-slate-100 px-2 py-1 rounded">G10002</code>, <code class="text-xs bg-slate-100 px-2 py-1 rounded">G10003</code></p>
<?php adminRenderFooter(); ?>
