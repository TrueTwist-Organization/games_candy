<?php

require_once __DIR__ . '/includes/bootstrap.php';
adminRequireLogin();

$allGames = GamesCatalog::all();
$query = trim((string) ($_GET['q'] ?? ''));

require_once __DIR__ . '/includes/layout.php';

adminRenderHeader('games', count($allGames));

if (isset($_GET['published'])) {
    echo '<div class="mb-4 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-2">Site published successfully. All admin changes are now live on the public site.</div>';
} elseif (isset($_GET['added'])) {
    echo '<div class="mb-4 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-2">Game added and published successfully.</div>';
} elseif (isset($_GET['updated'])) {
    echo '<div class="mb-4 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-2">Game updated and published successfully.</div>';
} elseif (isset($_GET['deleted'])) {
    echo '<div class="mb-4 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-2">Game deleted successfully.</div>';
} elseif (!empty($_GET['error'])) {
    echo '<div class="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-2">' . htmlspecialchars((string) $_GET['error']) . '</div>';
}

adminRenderRescrapeBar($query);
?>
<div class="border border-slate-200 rounded-xl overflow-hidden bg-white">
    <div class="gc-admin-table-wrap overflow-x-auto">
        <table class="w-full text-sm">
            <thead class="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                    <th class="text-left px-4 py-3 font-semibold w-16">Thumb</th>
                    <th class="text-left px-4 py-3 font-semibold">Title</th>
                    <th class="text-left px-4 py-3 font-semibold">Cat / Genre</th>
                    <th class="text-left px-4 py-3 font-semibold w-20">Score</th>
                    <th class="text-left px-4 py-3 font-semibold w-40">Flags</th>
                    <th class="text-left px-4 py-3 font-semibold w-28">Actions</th>
                </tr>
            </thead>
            <tbody id="gc-games-tbody" class="divide-y divide-slate-100">
            <?php foreach ($allGames as $game): ?>
                <tr class="gc-game-row hover:bg-slate-50/70" data-search="<?= htmlspecialchars(GamesCatalog::searchHaystack($game)) ?>" data-title="<?= htmlspecialchars($game['title']) ?>" data-category="<?= htmlspecialchars($game['category']) ?>">
                    <td class="px-4 py-3">
                        <?php if ($game['thumb'] !== ''): ?>
                            <img src="<?= htmlspecialchars($game['thumb']) ?>" alt="" class="w-10 h-10 rounded object-cover bg-slate-100">
                        <?php else: ?>
                            <div class="w-10 h-10 rounded bg-slate-100"></div>
                        <?php endif; ?>
                    </td>
                    <td class="px-4 py-3">
                        <div class="font-semibold text-slate-900"><?= htmlspecialchars($game['title']) ?></div>
                        <div class="text-xs text-slate-400 mt-0.5"><?= htmlspecialchars($game['slug_path']) ?></div>
                    </td>
                    <td class="px-4 py-3">
                        <span class="font-semibold"><?= htmlspecialchars($game['category']) ?></span>
                        <span class="text-slate-400"> / </span>
                        <span><?= htmlspecialchars($game['genre']) ?></span>
                    </td>
                    <td class="px-4 py-3 font-medium"><?= htmlspecialchars($game['score']) ?></td>
                    <td class="px-4 py-3"><?= adminRenderFlags($game['flags']) ?></td>
                    <td class="px-4 py-3 gc-admin-inline-actions whitespace-nowrap">
                        <a href="/admin/games-edit.php?slug=<?= rawurlencode($game['slug']) ?>" class="text-blue-600 hover:text-blue-800 font-medium">Edit</a>
                        <span class="text-slate-300 mx-1">|</span>
                        <form method="post" action="/admin/games-delete.php" class="inline" onsubmit="return confirm('Delete this game from your site?');">
                            <input type="hidden" name="slug" value="<?= htmlspecialchars($game['slug']) ?>">
                            <button type="submit" class="text-red-600 hover:text-red-800 font-medium bg-transparent border-0 p-0 cursor-pointer">Delete</button>
                        </form>
                    </td>
                </tr>
            <?php endforeach; ?>
                <tr id="gc-games-empty" class="hidden">
                    <td colspan="6" class="px-4 py-10 text-center text-slate-500">
                        No games found for <span id="gc-games-empty-query" class="font-medium text-slate-700"></span>. Try a different title, slug, or category.
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</div>
<p id="gc-games-count" class="text-xs text-slate-400 mt-3"></p>
<span id="gc-games-total" data-total="<?= count($allGames) ?>" class="hidden"></span>
<?php
adminRenderGamesSearchScript();
adminRenderFooter();
