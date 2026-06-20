<?php

function adminNavLinkClass(string $key, string $active): string
{
    if ($key === $active) {
        return 'font-semibold text-slate-900';
    }
    return 'text-slate-600 hover:text-slate-900';
}

function adminMobileNavClass(string $key, string $active): string
{
    if ($key === $active) {
        return 'gc-admin-nav-active';
    }
    return 'text-slate-600 hover:bg-slate-50';
}

function adminNavItems(): array
{
    return [
        'games' => ['Games', '/admin/games.php'],
        'ads' => ['Ads', '/admin/ads.php'],
        'analytics' => ['Analytics', '/admin/analytics.php'],
        'site' => ['Site', '/admin/site.php'],
        'nav' => ['Nav', '/admin/nav.php'],
        'code' => ['Code', '/admin/code.php'],
    ];
}

function adminRenderFlags(array $flags): string
{
    $html = '';
    foreach ($flags as $flag) {
        if ($flag === 'hot') {
            $html .= '<span class="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-700 mr-1">hot</span>';
        } elseif ($flag === 'trending') {
            $html .= '<span class="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-700 mr-1">trending</span>';
        } elseif ($flag === 'new') {
            $html .= '<span class="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700 mr-1">new</span>';
        }
    }
    return $html !== '' ? $html : '<span class="text-slate-300">—</span>';
}

function adminRenderHeader(string $active = 'games', int $gameCount = 0): void
{
    $navItems = adminNavItems();
    ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="robots" content="noindex,nofollow">
    <title><?= htmlspecialchars(ADMIN_APP_NAME) ?></title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="/admin/assets/admin.css">
</head>
<body class="gc-admin-body bg-slate-50 text-slate-800 min-h-screen">
<header class="gc-admin-header border-b border-slate-200">
    <div class="max-w-[1400px] mx-auto px-4">
        <div class="flex items-center justify-between gap-2 py-3">
            <div class="flex items-center gap-2 min-w-0">
                <button type="button" id="gc-admin-menu-btn" class="gc-admin-menu-btn lg:hidden" aria-expanded="false" aria-controls="gc-admin-mobile-nav" aria-label="Open admin menu">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
                </button>
                <div class="flex items-center gap-2 font-bold text-base min-w-0">
                    <span class="text-xl leading-none shrink-0" aria-hidden="true">🎮</span>
                    <span class="truncate">GamesCandy Admin</span>
                </div>
            </div>
            <span class="text-slate-500 text-sm whitespace-nowrap lg:hidden"><?= adminFormatNumber($gameCount) ?> games</span>
            <div class="gc-admin-desktop-nav flex flex-wrap items-center gap-x-4 gap-y-1 text-sm flex-1 min-w-0 px-2">
                <span class="text-slate-500 whitespace-nowrap"><?= adminFormatNumber($gameCount) ?> games</span>
                <?php foreach ($navItems as $key => [$label, $href]): ?>
                    <a href="<?= $href ?>" class="<?= adminNavLinkClass($key, $active) ?>"><?= htmlspecialchars($label) ?></a>
                <?php endforeach; ?>
            </div>
            <div class="gc-admin-mobile-quick flex items-center gap-2 shrink-0">
                <a href="/admin/games-add.php" class="bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg px-2.5 py-1.5 text-xs sm:text-sm">+ Add</a>
            </div>
            <div class="gc-admin-desktop-actions flex flex-wrap items-center gap-2 text-sm shrink-0">
                <a href="/admin/games-add.php" class="bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg px-3 py-1.5">+ Add game</a>
                <form method="post" action="/admin/publish.php" class="inline">
                    <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg px-3 py-1.5 inline-flex items-center gap-1">
                        <span aria-hidden="true">☁</span> Publish
                    </button>
                </form>
                <a href="/admin/settings.php" class="text-slate-600 hover:text-slate-900 px-1">Settings</a>
                <a href="/admin/logout.php" class="text-slate-600 hover:text-slate-900 px-1">Logout</a>
            </div>
        </div>
        <nav id="gc-admin-mobile-nav" class="gc-admin-mobile-nav" aria-label="Admin navigation">
            <?php foreach ($navItems as $key => [$label, $href]): ?>
                <a href="<?= $href ?>" class="<?= adminMobileNavClass($key, $active) ?>"><?= htmlspecialchars($label) ?></a>
            <?php endforeach; ?>
            <div class="gc-admin-mobile-actions">
                <a href="/admin/games-add.php" class="bg-green-600 hover:bg-green-700 text-white font-semibold">+ Add game</a>
                <form method="post" action="/admin/publish.php">
                    <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold inline-flex items-center gap-1"><span aria-hidden="true">☁</span> Publish</button>
                </form>
                <a href="/admin/settings.php" class="text-slate-600 hover:bg-slate-50">Settings</a>
                <a href="/admin/logout.php" class="text-slate-600 hover:bg-slate-50">Logout</a>
            </div>
        </nav>
    </div>
</header>
<main class="gc-admin-main max-w-[1400px] mx-auto py-4">
    <?php
}

function adminRenderFooter(): void
{
    ?>
</main>
<script src="/admin/assets/admin-mobile.js"></script>
</body>
</html>
    <?php
}

function adminRenderRescrapeBar(string $query = ''): void
{
    $query = trim($query);
    $clearHidden = $query !== '' ? '' : ' hidden';
    ?>
<div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-3">
    <form id="gc-games-search-form" method="get" action="/admin/games.php" class="gc-admin-toolbar-form flex flex-1 max-w-2xl gap-2">
        <div class="relative flex-1 min-w-0">
            <input id="gc-games-search" type="search" name="q" value="<?= htmlspecialchars($query) ?>" autocomplete="off" spellcheck="false" placeholder="Search by title, slug, category, genre..." class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            <div id="gc-games-suggest" class="hidden absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden max-h-64 overflow-y-auto"></div>
        </div>
        <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg px-4 py-2 text-sm whitespace-nowrap">Search</button>
        <button type="button" id="gc-games-clear" class="border border-slate-300 rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 whitespace-nowrap<?= $clearHidden ?>">Clear</button>
    </form>
    <div class="gc-admin-toolbar-extra shrink-0">
        <button type="button" class="bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg px-4 py-2 text-sm inline-flex items-center justify-center gap-2 w-full lg:w-auto">
            <span aria-hidden="true">↻</span> Re-scrape from competitor
        </button>
    </div>
</div>
    <?php
}

function adminRenderGamesSearchScript(): void
{
    echo '<script src="/admin/assets/games-search.js"></script>';
}
