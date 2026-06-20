<?php

require_once __DIR__ . '/includes/bootstrap.php';
adminRequireLogin();

$error = '';
$post = $_SERVER['REQUEST_METHOD'] === 'POST' ? $_POST : [];

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['save_game'])) {
    require_once __DIR__ . '/includes/ImageUpload.php';
    try {
        $slug = GamesStore::slugify((string) ($_POST['slug'] ?? '')) ?: GamesStore::slugify((string) ($_POST['title'] ?? ''));
        $post = ImageUpload::applyFields($_POST, $_FILES, ImageUpload::GAME_IMAGE_FIELDS, 'games', $slug !== '' ? $slug : 'new');
        GamesStore::addGame($post);
        AdminConfig::publishSite();
        header('Location: /admin/games.php?added=1');
        exit;
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

require_once __DIR__ . '/includes/layout.php';

adminRenderHeader('games', count(GamesCatalog::all()));

if (isset($_GET['added'])) {
    echo '<div class="mb-4 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-2">Game added and published successfully.</div>';
}
if ($error !== '') {
    echo '<div class="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-2">' . htmlspecialchars($error) . '</div>';
}

function addGameValue(array $post, string $key, string $default = ''): string
{
    return htmlspecialchars((string) ($post[$key] ?? $default));
}
?>
<div class="border border-slate-200 rounded-xl bg-white p-6 shadow-sm">
    <h2 class="font-bold text-lg mb-6">Add new game</h2>
    <form method="post" enctype="multipart/form-data" class="space-y-5" id="add-game-form">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Title <span class="text-red-500">*</span></label>
                <input type="text" name="title" id="game-title" required value="<?= addGameValue($post, 'title') ?>" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Slug (URL)</label>
                <input type="text" name="slug" id="game-slug" value="<?= addGameValue($post, 'slug') ?>" placeholder="auto from title" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono">
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">GameMonetize hash (32 chars) <span class="text-red-500">*</span></label>
                <input type="text" name="gamemonetize_hash" value="<?= addGameValue($post, 'gamemonetize_hash') ?>" maxlength="32" minlength="32" required pattern="[A-Za-z0-9]{32}" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono" placeholder="32 character hash">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Category</label>
                <select name="category" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm capitalize">
                    <?php foreach (GamesStore::categories() as $category): ?>
                        <option value="<?= htmlspecialchars($category) ?>" <?= (($post['category'] ?? 'Puzzle') === $category) ? 'selected' : '' ?>><?= htmlspecialchars(strtolower($category)) ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Genre</label>
                <input type="text" name="genre" value="<?= addGameValue($post, 'genre') ?>" placeholder="e.g. Soccer" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Score</label>
                <input type="text" name="score" value="<?= addGameValue($post, 'score', '7.5') ?>" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <?php
            require_once __DIR__ . '/includes/ImageUpload.php';
            ImageUpload::renderField('Thumbnail', 'thumb', (string) ($post['thumb'] ?? ''), 'Square image used in game lists.');
            ImageUpload::renderField('Landscape banner (optional)', 'landscape_thumb', (string) ($post['landscape_thumb'] ?? ''), 'Wide banner on the view-game page.');
            ImageUpload::renderField('Portrait image (optional)', 'portrait_thumb', (string) ($post['portrait_thumb'] ?? ''), 'Portrait image for grids and cards.');
            ?>
        </div>

        <div class="flex flex-wrap items-center gap-5 text-sm">
            <label class="inline-flex items-center gap-2"><input type="checkbox" name="flag_hot" value="1" <?= !empty($post['flag_hot']) ? 'checked' : '' ?> class="rounded border-slate-300 text-indigo-600"> Hot</label>
            <label class="inline-flex items-center gap-2"><input type="checkbox" name="flag_trending" value="1" <?= !empty($post['flag_trending']) ? 'checked' : '' ?> class="rounded border-slate-300 text-indigo-600"> Trending</label>
            <label class="inline-flex items-center gap-2"><input type="checkbox" name="flag_new" value="1" <?= !empty($post['flag_new']) ? 'checked' : '' ?> class="rounded border-slate-300 text-indigo-600"> New</label>
        </div>

        <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">Tags (comma-separated)</label>
            <input type="text" name="tags" value="<?= addGameValue($post, 'tags') ?>" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="action, arcade, multiplayer">
        </div>

        <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">Description</label>
            <textarea name="description" rows="4" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"><?= addGameValue($post, 'description') ?></textarea>
        </div>

        <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">How to Play</label>
            <textarea name="how_to_play" rows="4" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"><?= addGameValue($post, 'how_to_play') ?></textarea>
        </div>

        <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">Editor's View / Review</label>
            <textarea name="editors_review" rows="4" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"><?= addGameValue($post, 'editors_review') ?></textarea>
        </div>

        <div class="flex flex-wrap items-center gap-4 pt-2">
            <button type="submit" name="save_game" value="1" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg px-6 py-2.5 text-sm">Save &amp; Publish</button>
            <a href="/admin/games.php" class="text-slate-600 hover:text-slate-900 text-sm font-medium">Cancel</a>
        </div>
    </form>
</div>
<script>
(function () {
    var title = document.getElementById('game-title');
    var slug = document.getElementById('game-slug');
    if (!title || !slug) return;
    var slugEdited = slug.value.trim() !== '';
    slug.addEventListener('input', function () { slugEdited = slug.value.trim() !== ''; });
    title.addEventListener('input', function () {
        if (slugEdited) return;
        slug.value = title.value.trim().toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    });
})();
</script>
<?php ImageUpload::previewScript(); adminRenderFooter(); ?>
