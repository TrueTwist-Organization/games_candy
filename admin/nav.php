<?php

require_once __DIR__ . '/includes/bootstrap.php';
adminRequireLogin();

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['save_nav'])) {
    AdminConfig::saveNav($_POST);
    header('Location: /admin/nav.php?saved=1');
    exit;
}

$items = AdminConfig::load()['nav']['items'];

require_once __DIR__ . '/includes/layout.php';
require_once __DIR__ . '/includes/form-helpers.php';

adminRenderHeader('nav', count(GamesCatalog::all()));
adminRenderSavedBanner();
?>
<form method="post" class="border border-slate-200 rounded-xl bg-white p-6 shadow-sm">
    <h2 class="font-bold text-base mb-1">Nav</h2>
    <p class="text-xs text-slate-500 mb-4">Main menu links shown on the public site header.</p>
    <div class="overflow-x-auto border border-slate-200 rounded-lg mb-4">
        <table class="w-full text-sm">
            <thead class="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                    <th class="text-left px-4 py-3 font-semibold w-16">Show</th>
                    <th class="text-left px-4 py-3 font-semibold">Label</th>
                    <th class="text-left px-4 py-3 font-semibold">URL</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
            <?php foreach ($items as $index => $item): ?>
                <tr>
                    <td class="px-4 py-2">
                        <input type="checkbox" name="nav_enabled[<?= (int) $index ?>]" value="1" <?= !empty($item['enabled']) ? 'checked' : '' ?> class="rounded border-slate-300 text-indigo-600">
                    </td>
                    <td class="px-4 py-2">
                        <input type="text" name="nav_label[]" value="<?= htmlspecialchars((string) $item['label']) ?>" class="w-full border border-slate-300 rounded px-2 py-1.5 text-sm">
                    </td>
                    <td class="px-4 py-2">
                        <input type="text" name="nav_url[]" value="<?= htmlspecialchars((string) $item['url']) ?>" class="w-full border border-slate-300 rounded px-2 py-1.5 text-sm font-mono">
                    </td>
                </tr>
            <?php endforeach; ?>
                <tr>
                    <td class="px-4 py-2"><input type="checkbox" name="nav_enabled[new]" value="1" class="rounded border-slate-300 text-indigo-600"></td>
                    <td class="px-4 py-2"><input type="text" name="nav_label[]" placeholder="New link label" class="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"></td>
                    <td class="px-4 py-2"><input type="text" name="nav_url[]" placeholder="/path" class="w-full border border-slate-300 rounded px-2 py-1.5 text-sm font-mono"></td>
                </tr>
            </tbody>
        </table>
    </div>
    <button type="submit" name="save_nav" value="1" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg px-5 py-2.5 text-sm">Save &amp; Publish</button>
</form>
<?php adminRenderFooter(); ?>
