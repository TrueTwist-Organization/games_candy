<?php

require_once __DIR__ . '/includes/bootstrap.php';
adminRequireLogin();

$slug = trim((string) ($_GET['slug'] ?? $_POST['slug'] ?? ''));
if ($slug === '') {
    header('Location: /admin/games.php');
    exit;
}

$error = '';
$post = $_SERVER['REQUEST_METHOD'] === 'POST' ? $_POST : [];

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['save_game'])) {
    require_once __DIR__ . '/includes/ImageUpload.php';
    try {
        $post = ImageUpload::applyFields($_POST, $_FILES, ImageUpload::GAME_IMAGE_FIELDS, 'games', $slug);
        GamesStore::updateGame($slug, $post);
        AdminConfig::publishSite();
        header('Location: /admin/games.php?updated=1');
        exit;
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

try {
    $values = $error !== '' ? array_merge(GamesStore::getGameEditData($slug), $post) : GamesStore::getGameEditData($slug);
} catch (Throwable $e) {
    require_once __DIR__ . '/includes/layout.php';
    adminRenderHeader('games', count(GamesCatalog::all()));
    echo '<div class="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-2">' . htmlspecialchars($e->getMessage()) . '</div>';
    echo '<p class="mt-4"><a href="/admin/games.php" class="text-blue-600 hover:text-blue-800 font-medium">Back to games</a></p>';
    adminRenderFooter();
    exit;
}

require_once __DIR__ . '/includes/layout.php';

adminRenderHeader('games', count(GamesCatalog::all()));

if ($error !== '') {
    echo '<div class="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-2">' . htmlspecialchars($error) . '</div>';
}

function editGameValue(array $values, string $key, string $default = ''): string
{
    return htmlspecialchars((string) ($values[$key] ?? $default));
}
?>
<div class="border border-slate-200 rounded-xl bg-white p-6 shadow-sm">
    <h2 class="font-bold text-lg mb-1">Edit game</h2>
    <p class="text-xs text-slate-500 mb-6">Update game details below. Slug stays fixed. Save &amp; Publish applies changes to your live site.</p>
    <form method="post" enctype="multipart/form-data" class="space-y-5" id="edit-game-form">
        <input type="hidden" name="slug" value="<?= editGameValue($values, 'slug', $slug) ?>">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Title <span class="text-red-500">*</span></label>
                <input type="text" name="title" required value="<?= editGameValue($values, 'title') ?>" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Slug (URL)</label>
                <input type="text" value="<?= editGameValue($values, 'slug', $slug) ?>" readonly class="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-sm font-mono text-slate-500">
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="md:col-span-2">
                <label class="block text-xs font-semibold text-slate-600 mb-1">GameMonetize hash / embed folder <span class="text-red-500">*</span></label>
                <div class="flex gap-2">
                    <input type="text" name="gamemonetize_hash" id="game-embed-id" value="<?= editGameValue($values, 'gamemonetize_hash') ?>" required class="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono" placeholder="32-char hash or BubbleCloud_">
                    <button type="button" id="preview-embed" class="shrink-0 border border-slate-300 rounded-lg px-3 py-2 text-sm hover:bg-slate-50">Preview embed</button>
                </div>
                <p id="embed-preview" class="text-xs text-slate-500 mt-1"><?= editGameValue($values, 'embed') ?></p>
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Category</label>
                <select name="category" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm capitalize">
                    <?php foreach (GamesStore::categories() as $category): ?>
                        <?php
                        $selected = strcasecmp((string) ($values['category'] ?? 'Puzzle'), $category) === 0 ? 'selected' : '';
                        ?>
                        <option value="<?= htmlspecialchars($category) ?>" <?= $selected ?>><?= htmlspecialchars(strtolower($category)) ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Genre</label>
                <input type="text" name="genre" value="<?= editGameValue($values, 'genre') ?>" placeholder="e.g. Soccer" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Score</label>
                <input type="text" name="score" value="<?= editGameValue($values, 'score', '7.5') ?>" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <?php
            require_once __DIR__ . '/includes/ImageUpload.php';
            ImageUpload::renderField('Thumbnail', 'thumb', (string) ($values['thumb'] ?? ''), 'Square image used in game lists.');
            ImageUpload::renderField('Landscape banner (optional)', 'landscape_thumb', (string) ($values['landscape_thumb'] ?? ''), 'Wide banner on the view-game page.');
            ImageUpload::renderField('Portrait image (optional)', 'portrait_thumb', (string) ($values['portrait_thumb'] ?? ''), 'Portrait image for grids and cards.');
            ?>
        </div>

        <div class="flex flex-wrap items-center gap-5 text-sm">
            <label class="inline-flex items-center gap-2"><input type="checkbox" name="flag_hot" value="1" <?= !empty($values['flag_hot']) ? 'checked' : '' ?> class="rounded border-slate-300 text-indigo-600"> Hot</label>
            <label class="inline-flex items-center gap-2"><input type="checkbox" name="flag_trending" value="1" <?= !empty($values['flag_trending']) ? 'checked' : '' ?> class="rounded border-slate-300 text-indigo-600"> Trending</label>
            <label class="inline-flex items-center gap-2"><input type="checkbox" name="flag_new" value="1" <?= !empty($values['flag_new']) ? 'checked' : '' ?> class="rounded border-slate-300 text-indigo-600"> New</label>
        </div>

        <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">Tags (comma-separated)</label>
            <input type="text" name="tags" value="<?= editGameValue($values, 'tags') ?>" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
        </div>

        <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">Description</label>
            <textarea name="description" rows="4" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"><?= editGameValue($values, 'description') ?></textarea>
        </div>

        <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">How to Play</label>
            <textarea name="how_to_play" rows="4" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"><?= editGameValue($values, 'how_to_play') ?></textarea>
        </div>

        <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">Editor's View / Review</label>
            <textarea name="editors_review" rows="4" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"><?= editGameValue($values, 'editors_review') ?></textarea>
        </div>

        <div class="flex flex-wrap items-center gap-4 pt-2">
            <button type="submit" name="save_game" value="1" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg px-6 py-2.5 text-sm">Save &amp; Publish</button>
            <a href="/admin/games.php" class="text-slate-600 hover:text-slate-900 text-sm font-medium">Cancel</a>
        </div>
    </form>
</div>
<script>
(function () {
    var embed = document.getElementById('game-embed-id');
    var preview = document.getElementById('embed-preview');
    function updateEmbedPreview() {
        if (!embed || !preview) return;
        var raw = embed.value.trim();
        if (!raw) return;
        if (raw.indexOf('/embed/') === 0) { preview.textContent = 'Embed: ' + raw; return; }
        if (/^[A-Za-z0-9]{32}$/.test(raw)) { preview.textContent = 'Embed: /embed/g/' + raw + '/index.html'; return; }
        preview.textContent = 'Embed: /embed/g/' + raw.replace(/^\/+|\/+$/g, '') + '/index.html';
    }
    if (embed) {
        embed.addEventListener('input', updateEmbedPreview);
        updateEmbedPreview();
    }
    document.getElementById('preview-embed')?.addEventListener('click', function () {
        updateEmbedPreview();
        var raw = embed.value.trim();
        if (!raw) return;
        var path = raw.indexOf('/embed/') === 0 ? raw : (/^[A-Za-z0-9]{32}$/.test(raw) ? '/embed/g/' + raw + '/index.html' : '/embed/g/' + raw.replace(/^\/+|\/+$/g, '') + '/index.html');
        window.open(path, '_blank', 'noopener');
    });
})();
</script>
<?php ImageUpload::previewScript(); adminRenderFooter(); ?>
