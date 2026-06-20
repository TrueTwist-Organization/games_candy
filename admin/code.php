<?php

require_once __DIR__ . '/includes/bootstrap.php';
adminRequireLogin();

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['save_code'])) {
    AdminConfig::saveCode($_POST);
    header('Location: /admin/code.php?saved=1');
    exit;
}

$code = AdminConfig::load()['code'];

require_once __DIR__ . '/includes/layout.php';
require_once __DIR__ . '/includes/form-helpers.php';

adminRenderHeader('code', count(GamesCatalog::all()));
adminRenderSavedBanner();
?>
<form method="post" class="border border-slate-200 rounded-xl bg-white p-6 shadow-sm">
    <h2 class="font-bold text-base mb-1">Code</h2>
    <p class="text-xs text-slate-500 mb-4">Custom scripts and CSS injected into the public site (stored in admin only).</p>
    <div class="grid gap-4 mb-6">
        <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">Head code (before &lt;/head&gt;)</label>
            <textarea name="head_code" rows="5" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono"><?= htmlspecialchars($code['head_code']) ?></textarea>
        </div>
        <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">Body start code (after &lt;body&gt;)</label>
            <textarea name="body_code" rows="4" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono"><?= htmlspecialchars($code['body_code']) ?></textarea>
        </div>
        <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">Footer code (before &lt;/body&gt;)</label>
            <textarea name="footer_code" rows="5" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono"><?= htmlspecialchars($code['footer_code']) ?></textarea>
        </div>
        <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">Custom CSS</label>
            <textarea name="custom_css" rows="6" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono"><?= htmlspecialchars($code['custom_css']) ?></textarea>
        </div>
    </div>
    <button type="submit" name="save_code" value="1" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg px-5 py-2.5 text-sm">Save &amp; Publish</button>
</form>
<?php adminRenderFooter(); ?>
