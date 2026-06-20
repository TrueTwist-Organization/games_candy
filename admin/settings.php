<?php

require_once __DIR__ . '/includes/bootstrap.php';
adminRequireLogin();

$message = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        if (($_POST['action'] ?? '') === 'change_password') {
            AdminSettings::changePassword(
                (string) ($_POST['current_password'] ?? ''),
                (string) ($_POST['new_password'] ?? ''),
                (string) ($_POST['confirm_password'] ?? '')
            );
            $message = 'Admin password updated successfully.';
        } else {
            throw new InvalidArgumentException('Unknown settings action.');
        }
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

if (isset($_GET['download'])) {
    $type = (string) $_GET['download'];
    $stamp = gmdate('Y-m-d');
    header('Content-Type: application/json; charset=utf-8');
    if ($type === 'config') {
        header('Content-Disposition: attachment; filename="gamescandy-site-config-' . $stamp . '.json"');
        echo json_encode(AdminConfig::load(), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        exit;
    }
    if ($type === 'custom-games') {
        header('Content-Disposition: attachment; filename="gamescandy-custom-games-' . $stamp . '.json"');
        echo json_encode(AdminSettings::readJson(ADMIN_ROOT . '/data/custom-games.json', []), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        exit;
    }
    header('Content-Disposition: attachment; filename="gamescandy-full-backup-' . $stamp . '.json"');
    echo json_encode(AdminSettings::buildBackupPayload(), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit;
}

$config = AdminConfig::load();
$settings = AdminSettings::load();
$gameCount = count(GamesCatalog::all());
$publishedAt = !empty($config['published_at']) ? date('M j, Y g:i A', strtotime((string) $config['published_at'])) : 'Not published yet';
$passwordUpdated = !empty($settings['password_updated_at'])
    ? date('M j, Y g:i A', strtotime((string) $settings['password_updated_at']))
    : (!empty($settings['password_hash']) ? 'Updated' : 'Default password in use');

require_once __DIR__ . '/includes/layout.php';
adminRenderHeader('settings', $gameCount);
?>
<?php if ($error !== ''): ?>
<div class="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-2"><?= htmlspecialchars($error) ?></div>
<?php elseif ($message !== ''): ?>
<div class="mb-4 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-2"><?= htmlspecialchars($message) ?></div>
<?php endif; ?>

<div class="grid gap-4 lg:grid-cols-2">
    <div class="border border-slate-200 rounded-xl bg-white p-6 shadow-sm">
        <h2 class="font-bold text-lg mb-1">Site overview</h2>
        <p class="text-xs text-slate-500 mb-4">Quick details about your public site and admin data.</p>
        <dl class="grid gap-3 text-sm">
            <div class="flex justify-between border-b border-slate-100 pb-2 gap-4">
                <dt class="text-slate-500 shrink-0">Site name</dt>
                <dd class="font-medium text-right"><?= htmlspecialchars((string) ($config['site']['site_name'] ?? 'GamesCandy')) ?></dd>
            </div>
            <div class="flex justify-between border-b border-slate-100 pb-2 gap-4">
                <dt class="text-slate-500 shrink-0">Total games</dt>
                <dd class="font-medium text-right"><?= adminFormatNumber($gameCount) ?></dd>
            </div>
            <div class="flex justify-between border-b border-slate-100 pb-2 gap-4">
                <dt class="text-slate-500 shrink-0">Last published</dt>
                <dd class="font-medium text-right"><?= htmlspecialchars($publishedAt) ?></dd>
            </div>
            <div class="flex justify-between border-b border-slate-100 pb-2 gap-4">
                <dt class="text-slate-500 shrink-0">Password status</dt>
                <dd class="font-medium text-right"><?= htmlspecialchars($passwordUpdated) ?></dd>
            </div>
            <div class="flex justify-between pb-1 gap-4">
                <dt class="text-slate-500 shrink-0">Public site</dt>
                <dd class="text-right"><a class="text-blue-600 hover:text-blue-800 font-medium" href="<?= adminSiteUrl('/home') ?>" target="_blank" rel="noopener">Open GamesCandy</a></dd>
            </div>
        </dl>
    </div>

    <div class="border border-slate-200 rounded-xl bg-white p-6 shadow-sm">
        <h2 class="font-bold text-lg mb-1">Change admin password</h2>
        <p class="text-xs text-slate-500 mb-4">Update the password used to sign in to this admin panel.</p>
        <form method="post" class="space-y-3">
            <input type="hidden" name="action" value="change_password">
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Current password</label>
                <input type="password" name="current_password" autocomplete="current-password" required class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">New password</label>
                <input type="password" name="new_password" autocomplete="new-password" minlength="6" required class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Confirm new password</label>
                <input type="password" name="confirm_password" autocomplete="new-password" minlength="6" required class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
            </div>
            <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg px-4 py-2 text-sm">Save new password</button>
        </form>
    </div>
</div>

<div class="border border-slate-200 rounded-xl bg-white p-6 shadow-sm mt-4">
    <h2 class="font-bold text-lg mb-1">Backup &amp; download</h2>
    <p class="text-xs text-slate-500 mb-4">Download your site settings and admin data for backup or migration.</p>
    <div class="flex flex-wrap gap-3">
        <a href="/admin/settings.php?download=full" class="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Download full backup</a>
        <a href="/admin/settings.php?download=config" class="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Download site config</a>
        <a href="/admin/settings.php?download=custom-games" class="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Download custom games</a>
    </div>
    <p class="text-xs text-slate-400 mt-3">Full backup includes site config, custom games, hidden games, users, analytics, and admin settings.</p>
</div>
<?php adminRenderFooter(); ?>
