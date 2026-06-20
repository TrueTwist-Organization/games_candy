<?php

require_once __DIR__ . '/includes/bootstrap.php';
adminRequireLogin();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['save_ads'])) {
        AdminConfig::saveAds($_POST);
        AdminConfig::publishSite();
        header('Location: /admin/ads.php?saved=1');
        exit;
    }
    if (isset($_POST['save_ads_txt'])) {
        AdminConfig::saveAdsTxt((string) ($_POST['ads_txt'] ?? ''));
        AdminConfig::publishSite();
        header('Location: /admin/ads.php?saved=1');
        exit;
    }
}

$config = AdminConfig::load();
$ads = $config['ads'];
$left = array_values(array_filter(AdminConfig::PLACEMENTS, static fn(array $p): bool => $p['col'] === 'left'));
$right = array_values(array_filter(AdminConfig::PLACEMENTS, static fn(array $p): bool => $p['col'] === 'right'));

require_once __DIR__ . '/includes/layout.php';
require_once __DIR__ . '/includes/form-helpers.php';

adminRenderHeader('ads', count(GamesCatalog::all()));
adminRenderSavedBanner();
?>
<form method="post" class="border border-slate-200 rounded-xl bg-white p-6 mb-4 shadow-sm">
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">GAM network</label>
            <input type="text" name="gam_network" value="<?= htmlspecialchars($ads['gam_network']) ?>" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
        </div>
        <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">Refresh sec (0=off)</label>
            <input type="text" name="refresh_sec" value="<?= htmlspecialchars($ads['refresh_sec']) ?>" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
        </div>
        <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">Amazon a9 pub ID</label>
            <input type="text" name="amazon_pub_id" value="<?= htmlspecialchars($ads['amazon_pub_id']) ?>" placeholder="(empty = off)" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
        </div>
        <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">Prebid timeout (ms)</label>
            <input type="text" name="prebid_timeout" value="<?= htmlspecialchars($ads['prebid_timeout']) ?>" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
        </div>
    </div>

    <p class="text-sm font-semibold text-slate-700 mb-3">Placements — enable + GAM ad-unit code</p>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 mb-6">
        <div>
            <?php foreach ($left as $item): ?>
                <?php adminPlacementField($item['key'], $item['label'], $ads['placements'][$item['key']]); ?>
            <?php endforeach; ?>
        </div>
        <div>
            <?php foreach ($right as $item): ?>
                <?php adminPlacementField($item['key'], $item['label'], $ads['placements'][$item['key']]); ?>
            <?php endforeach; ?>
        </div>
    </div>

    <label class="block text-xs font-semibold text-slate-600 mb-1">Prebid bids (JSON, keyed by unit code — leave blank for none)</label>
    <textarea name="prebid_bids" rows="4" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono mb-4"><?= htmlspecialchars($ads['prebid_bids']) ?></textarea>

    <button type="submit" name="save_ads" value="1" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg px-5 py-2.5 text-sm">Save &amp; Publish</button>
</form>

<form method="post" class="border border-slate-200 rounded-xl bg-white p-6 shadow-sm">
    <h2 class="font-bold text-base mb-1">ads.txt</h2>
    <p class="text-xs text-slate-500 mb-1">this domain's authorized sellers — live at <code class="bg-slate-100 px-1 rounded">/ads.txt</code></p>
    <p class="text-xs text-slate-500 mb-3">One seller per line, e.g. google.com, pub-XXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0</p>
    <textarea name="ads_txt" rows="6" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono mb-4"><?= htmlspecialchars($ads['ads_txt']) ?></textarea>
    <button type="submit" name="save_ads_txt" value="1" class="bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg px-5 py-2.5 text-sm">Save ads.txt</button>
</form>
<?php adminRenderFooter(); ?>
