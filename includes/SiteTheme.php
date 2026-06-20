<?php

require_once __DIR__ . '/SiteAds.php';
require_once __DIR__ . '/SiteAuth.php';

class SiteTheme
{
    private const NAV_CATEGORIES = ['Action', 'Arcade', 'Casual', 'Puzzle', 'Quiz', 'Sports', 'Board', 'Match 3', 'Card'];

    private static function configPath(): string
    {
        return dirname(__DIR__) . '/admin/data/admin-config.json';
    }

    public static function loadFullConfig(): array
    {
        if (!is_file(self::configPath())) {
            return [
                'site' => self::defaults(),
                'nav' => ['items' => []],
                'code' => ['head_code' => '', 'body_code' => '', 'footer_code' => '', 'custom_css' => ''],
                'analytics' => ['ga4_id' => '', 'google_ads_id' => ''],
            ];
        }

        $stored = json_decode(file_get_contents(self::configPath()) ?: '{}', true);
        if (!is_array($stored)) {
            return ['site' => self::defaults(), 'nav' => ['items' => []], 'code' => [], 'analytics' => []];
        }

        return $stored;
    }

    public static function loadSiteConfig(): array
    {
        $config = self::loadFullConfig();
        $site = $config['site'] ?? [];
        if (!is_array($site)) {
            return self::defaults();
        }

        return array_replace_recursive(self::defaults(), $site);
    }

    public static function defaults(): array
    {
        return [
            'site_name' => defined('SITE_NAME') ? SITE_NAME : 'GamesCandy',
            'site_url' => defined('SITE_URL') ? SITE_URL : '',
            'tagline' => 'Play free online games instantly',
            'meta_title' => 'Play online games for Free | GamesCandy',
            'meta_description' => 'Play free online games at GamesCandy. No downloads required.',
            'meta_keywords' => 'games, free games, online games, html5 games',
            'primary_color' => '#6340F5',
            'secondary_color' => '#DF0F64',
            'accent_color' => '#8B5CF6',
            'button_color' => '#6340F5',
            'button_hover_color' => '#5230D5',
            'link_color' => '#6340F5',
            'background_color' => '#FFFFFF',
            'text_color' => '#1F1147',
            'theme_color' => '#6340F5',
            'logo_desktop' => '/images/logo.svg',
            'logo_mobile' => '/images/logo_mobile.svg',
            'favicon' => '/favicon.ico',
            'home_hero_title' => 'Most Popular',
            'footer_text' => '© GamesCandy. All rights reserved.',
            'copyright_year' => '2026',
            'footer_credit_links' => [
                ['label' => 'TrueTwist', 'url' => 'https://truetwist.in/'],
                ['label' => '369network', 'url' => 'https://369network.com/'],
            ],
            'show_tournaments' => true,
            'enable_ads' => false,
            'homepage_most_popular' => true,
            'homepage_categories' => true,
            'homepage_recent' => true,
        ];
    }

    public static function normalizeHex(string $color, string $fallback): string
    {
        $value = trim($color);
        if (preg_match('/^#[0-9A-Fa-f]{3}$/', $value) || preg_match('/^#[0-9A-Fa-f]{6}$/', $value)) {
            return strtoupper($value);
        }
        return strtoupper($fallback);
    }

    private const ORIGINAL_PAGE_GRADIENT = 'radial-gradient(circle 50vw at 100% 0, #00fefe, transparent), radial-gradient(circle 50vw at 20% 25vw, #9b00cc, transparent), linear-gradient(180deg, #3f007e, #502cba 25vw, #05122b 50vw)';
    private const DEFAULT_BACKGROUND = '#FFFFFF';

    private static function buildPageBackgroundCss(array $site, string $text): string
    {
        require_once __DIR__ . '/../admin/includes/ColorValue.php';
        $bgRaw = trim((string) ($site['background_color'] ?? ''));
        $isDefaultSolid = !ColorValue::isGradient($bgRaw)
            && ColorValue::normalizeHex($bgRaw, self::DEFAULT_BACKGROUND) === self::DEFAULT_BACKGROUND;

        if ($isDefaultSolid) {
            $gradient = self::ORIGINAL_PAGE_GRADIENT;

            return <<<CSS
body.main-container,
.main-container {
  background-image: {$gradient} !important;
  color: {$text} !important;
}
CSS;
        }

        if (ColorValue::isGradient($bgRaw)) {
            return <<<CSS
body.main-container,
.main-container {
  background-image: {$bgRaw} !important;
  background-color: transparent !important;
  color: {$text} !important;
}
CSS;
        }

        $bg = ColorValue::cssBackground($bgRaw, self::DEFAULT_BACKGROUND);

        return <<<CSS
body.main-container,
.main-container {
  background-color: {$bg} !important;
  background-image: none !important;
  color: {$text} !important;
}
CSS;
    }

    public static function buildThemeCss(array $site): string
    {
        require_once __DIR__ . '/../admin/includes/ColorValue.php';

        $primaryRaw = (string) ($site['primary_color'] ?? '');
        $secondaryRaw = (string) ($site['secondary_color'] ?? '');
        $accentRaw = (string) ($site['accent_color'] ?? '');
        $buttonRaw = (string) ($site['button_color'] ?? '');
        $buttonHoverRaw = (string) ($site['button_hover_color'] ?? '');
        $linkRaw = (string) ($site['link_color'] ?? '');
        $textRaw = (string) ($site['text_color'] ?? '');

        $primary = ColorValue::cssColor($primaryRaw, '#6340F5');
        $secondary = ColorValue::cssColor($secondaryRaw, '#DF0F64');
        $accent = ColorValue::cssColor($accentRaw, '#8B5CF6');
        $buttonBg = ColorValue::backgroundCss($buttonRaw !== '' ? $buttonRaw : $primaryRaw, $primary);
        $buttonHoverBg = ColorValue::backgroundCss($buttonHoverRaw, '#5230D5');
        $link = ColorValue::cssColor($linkRaw, $primary);
        $text = ColorValue::cssColor($textRaw, '#1F1147');
        $theme = ColorValue::cssColor((string) ($site['theme_color'] ?? ''), $primary);
        $tournamentBg = ColorValue::tournamentGradient($primaryRaw !== '' ? $primaryRaw : $primary, $accentRaw !== '' ? $accentRaw : $accent);
        $pageBackground = self::buildPageBackgroundCss($site, $text);
        $hideTournaments = empty($site['show_tournaments']) ? '.capitalize.text-black.hover\\:text-blue-700.font-semibold.tracking-wide{display:none!important;}' : '';
        $hideAds = empty($site['enable_ads'])
            ? 'ins.adsbygoogle,.ads-content,[data-ad-slot],.googleadsmodal,#ads-modal{display:none!important;}'
            : SiteAds::buildAdsCss($site);
        $hideCategories = '';
        $hover = ColorValue::cssColor($buttonHoverRaw, '#5230D5');
        $bgVar = ColorValue::cssBackground((string) ($site['background_color'] ?? ''), self::DEFAULT_BACKGROUND);

        return <<<CSS
:root {
  --gc-primary: {$primary};
  --gc-secondary: {$secondary};
  --gc-accent: {$accent};
  --gc-button: {$primary};
  --gc-button-hover: {$hover};
  --gc-link: {$link};
  --gc-bg: {$bgVar};
  --gc-text: {$text};
  --gc-theme: {$theme};
}
{$pageBackground}
.text-theme-color { color: {$link} !important; }
.border-theme-color { border-color: {$link} !important; }
.border-blue-700 { border-color: {$link} !important; }
.text-blue-700 { color: {$link} !important; }
.bg-light-theme-color,
.animatedPlayBtn,
#btn-back-to-top { {$buttonBg} color: #fff !important; }
.animatedPlayBtn:hover,
#btn-back-to-top:hover { {$buttonHoverBg} color: #fff !important; }
a.text-theme-color:hover { color: {$hover} !important; }
.hover\\:text-blue-700:hover { color: {$hover} !important; }
.hover\\:border-blue-700:hover { border-color: {$hover} !important; }
.from-purple-500 { --tw-gradient-from: {$primary} var(--tw-gradient-from-position) !important; }
.to-blue-500 { --tw-gradient-to: {$accent} var(--tw-gradient-to-position) !important; }
.bg-gradient-to-r.from-purple-500.to-blue-500 { background-image: {$tournamentBg} !important; }
{$hideTournaments}
{$hideAds}
{$hideCategories}
CSS;
    }

    private static function replaceMetaByName(string $html, string $name, string $value): string
    {
        if ($value === '') {
            return $html;
        }
        $safe = htmlspecialchars($value, ENT_QUOTES);
        $pattern = '/<meta\s+name="' . preg_quote($name, '/') . '"\s+content="[\s\S]*?"\s*\/?>/i';
        if (preg_match($pattern, $html)) {
            return preg_replace($pattern, '<meta name="' . $name . '" content="' . $safe . '">', $html) ?? $html;
        }
        return str_replace('</head>', '    <meta name="' . $name . '" content="' . $safe . '">' . "\n</head>", $html);
    }

    private static function replaceMetaByProperty(string $html, string $property, string $value): string
    {
        if ($value === '') {
            return $html;
        }
        $safe = htmlspecialchars($value, ENT_QUOTES);
        $pattern = '/<meta\s+property="' . preg_quote($property, '/') . '"\s+content="[\s\S]*?"\s*\/?>/i';
        if (preg_match($pattern, $html)) {
            return preg_replace($pattern, '<meta property="' . $property . '" content="' . $safe . '">', $html) ?? $html;
        }
        return str_replace('</head>', '    <meta property="' . $property . '" content="' . $safe . '">' . "\n</head>", $html);
    }

    private static function buildDesktopNavHtml(array $items, array $site): string
    {
        $parts = [];
        foreach ($items as $item) {
            if (empty($item['enabled'])) {
                continue;
            }
            $url = trim((string) ($item['url'] ?? ''));
            if ($url === '/tournaments' || str_starts_with($url, '/category/')) {
                continue;
            }
            $parts[] = '<a href="' . htmlspecialchars($url, ENT_QUOTES) . '" class="border-b-4 hover:border-blue-700 hover:rounded hover:text-blue-700 hover:border-b-4 border-white mx-1">' . htmlspecialchars((string) ($item['label'] ?? ''), ENT_QUOTES) . '</a>';
        }

        foreach ($items as $item) {
            if (empty($item['enabled'])) {
                continue;
            }
            if (trim((string) ($item['url'] ?? '')) !== '/tournaments') {
                continue;
            }
            if (empty($site['show_tournaments'])) {
                break;
            }
            $parts[] = '<button type="button" class="mx-2 flex items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-blue-500 p-[1.5px] text-white duration-300 hover:bg-gradient-to-l hover:shadow-2xl hover:shadow-purple-600/30 hover:cursor-pointer" onclick="location.href=\'/tournaments\'"><span class="flex h-full w-full items-center px-3 justify-center rounded-full bg-white transition duration-300 ease-in-out capitalize text-black hover:text-blue-700 font-semibold tracking-wide">' . htmlspecialchars((string) ($item['label'] ?? 'Tournaments'), ENT_QUOTES) . '</span></button>';
            break;
        }

        $categories = self::resolveCategoryNavItems($items);
        $categoryLinks = [];
        foreach ($categories as $item) {
            $url = trim((string) ($item['url'] ?? ''));
            $categoryLinks[] = '<li class="py-2 px-3 text-center"><a href="' . htmlspecialchars($url, ENT_QUOTES) . '" class="hover:text-blue-700 hover:border-blue-700 hover:rounded hover:border-b-4 font-medium capitalize text-center cat_class">' . htmlspecialchars((string) ($item['label'] ?? ''), ENT_QUOTES) . '</a></li>';
        }

        if ($categoryLinks !== []) {
            $parts[] = '<div class="group relative cursor-pointer"><button class="font-medium border-b-4 border-white mx-1">More <i class="ml-1 fa-solid fa-chevron-down"></i></button><div class="absolute z-50 invisible group-hover:visible bg-white shadow min-w-max max-w-full"><ul class="py-1 px-1 text-gray-700" aria-labelledby="dropdownDefault">' . implode("\n                                                    ", $categoryLinks) . '</ul></div></div>';
        }

        return implode("\n                ", $parts);
    }

    /** @return list<array{label:string,url:string,enabled:bool}> */
    private static function resolveCategoryNavItems(array $items): array
    {
        $navMap = [];
        foreach ($items as $item) {
            $url = trim((string) ($item['url'] ?? ''));
            if (!str_starts_with($url, '/category/')) {
                continue;
            }
            $navMap[$url] = $item;
        }

        $resolved = [];
        foreach (self::NAV_CATEGORIES as $category) {
            $url = '/category/' . $category;
            $existing = $navMap[$url] ?? null;
            $enabled = $existing ? !empty($existing['enabled']) : true;
            if (!$enabled) {
                continue;
            }
            $resolved[] = [
                'label' => trim((string) ($existing['label'] ?? $category)) ?: $category,
                'url' => $url,
                'enabled' => true,
            ];
        }

        return $resolved;
    }

    private static function buildFooterNavHtml(array $items): string
    {
        $links = [];
        $allGamesLabel = 'All Games';
        foreach ($items as $item) {
            if (empty($item['enabled'])) {
                continue;
            }
            if (trim((string) ($item['url'] ?? '')) === '/games') {
                $allGamesLabel = (string) ($item['label'] ?? 'All Games');
                break;
            }
        }
        $links[] = '<a href="/games" class="block px-2 py-2 hover:underline text-theme-color font-medium text-[18px] capitalize">' . htmlspecialchars($allGamesLabel, ENT_QUOTES) . '</a>';
        foreach (self::resolveCategoryNavItems($items) as $item) {
            $links[] = '<a href="' . htmlspecialchars((string) $item['url'], ENT_QUOTES) . '" class="block px-2 py-2 hover:underline text-theme-color font-medium text-[18px] capitalize">' . htmlspecialchars((string) $item['label'], ENT_QUOTES) . '</a>';
        }

        return implode("\n                                ", $links);
    }

    private static function buildFooterCreditLinksHtml(array $links): string
    {
        if ($links === []) {
            return '';
        }

        $html = [];
        foreach ($links as $item) {
            $label = trim((string) ($item['label'] ?? ''));
            $url = trim((string) ($item['url'] ?? ''));
            if ($label === '' || $url === '') {
                continue;
            }
            $html[] = '<a href="' . htmlspecialchars($url, ENT_QUOTES) . '" target="_blank" rel="noopener" class="mr-4 hover:underline text-theme-color font-medium text-[14px] leading-[16px]">' . htmlspecialchars($label, ENT_QUOTES) . '</a>';
        }

        return implode("\n                ", $html);
    }

    private static function applyFooterCreditLinks(string $html, array $site): string
    {
        $links = $site['footer_credit_links'] ?? [];
        if (!is_array($links)) {
            $links = [];
        }

        $creditHtml = self::buildFooterCreditLinksHtml($links);
        if ($creditHtml === '') {
            return preg_replace('/<div class="lg:block hidden text-center">[\s\S]*?<\/div>/', '<div class="lg:block hidden text-center">' . "\n</div>", $html, 1) ?? $html;
        }

        if (str_contains($html, 'id="gc-footer-credits"')) {
            return preg_replace(
                '/<div class="lg:block hidden text-center" id="gc-footer-credits">[\s\S]*?<\/div>/',
                '<div class="lg:block hidden text-center" id="gc-footer-credits">' . "\n                " . $creditHtml . "\n            </div>",
                $html,
                1
            ) ?? $html;
        }

        return preg_replace(
            '/<div class="lg:block hidden text-center">\s*<\/div>/',
            '<div class="lg:block hidden text-center" id="gc-footer-credits">' . "\n                " . $creditHtml . "\n            </div>",
            $html,
            1
        ) ?? $html;
    }

    private static function applyNav(string $html, array $nav, array $site): string
    {
        $items = $nav['items'] ?? [];
        if (!is_array($items) || $items === []) {
            return $html;
        }

        $desktopNav = self::buildDesktopNavHtml($items, $site);
        $html = preg_replace(
            '/(<div class="flex items-center justify-center 2xl:justify-start font-medium text-sm lg:text-lg color-\[#000\] capitalize whitespace-nowrap">)[\s\S]*?(<\/div>\s*\n\s*<div class="2xl:flex items-center hidden">)/',
            '$1' . "\n                " . $desktopNav . "\n            " . '$2',
            $html,
            1
        ) ?? $html;

        $footerNav = self::buildFooterNavHtml($items);
        if ($footerNav !== '') {
            $html = preg_replace(
                '/(<div class="flex flex-wrap justify-center font-medium text-\[18px\] color-\[#000\] capitalize w-\[80%\]">)[\s\S]*?(<\/div>\s*\n\s*<div class="flex flex-wrap justify-center w-\[80%\] py-4">)/',
                '$1' . "\n                " . $footerNav . "\n                            " . '$2',
                $html,
                1
            ) ?? $html;
        }

        return $html;
    }

    private static function buildAnalyticsHtml(array $analytics): string
    {
        $ga4 = trim((string) ($analytics['ga4_id'] ?? ''));
        $googleAds = trim((string) ($analytics['google_ads_id'] ?? ''));
        if ($ga4 === '' && $googleAds === '') {
            return '';
        }

        $scripts = "<script id=\"gc-analytics\">window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());";
        if ($ga4 !== '') {
            $scripts .= "gtag('config','" . htmlspecialchars($ga4, ENT_QUOTES) . "');";
        }
        if ($googleAds !== '') {
            $scripts .= "gtag('config','" . htmlspecialchars($googleAds, ENT_QUOTES) . "');";
        }
        $scripts .= '</script>';

        if ($ga4 !== '') {
            $scripts = '<script async src="https://www.googletagmanager.com/gtag/js?id=' . htmlspecialchars($ga4, ENT_QUOTES) . '"></script>' . "\n    " . $scripts;
        }

        return $scripts;
    }

    private static function applyCustomCode(string $html, array $code): string
    {
        $headCode = trim((string) ($code['head_code'] ?? ''));
        $bodyCode = trim((string) ($code['body_code'] ?? ''));
        $footerCode = trim((string) ($code['footer_code'] ?? ''));
        $customCss = trim((string) ($code['custom_css'] ?? ''));

        if ($customCss !== '' && !str_contains($html, 'gc-custom-css')) {
            $html = str_replace('</head>', '    <style id="gc-custom-css">' . "\n" . $customCss . "\n    </style>\n</head>", $html);
        }
        if ($headCode !== '' && !str_contains($html, 'gc-head-code')) {
            $html = str_replace('</head>', '    <div id="gc-head-code">' . $headCode . "</div>\n</head>", $html);
        }
        if ($bodyCode !== '' && !str_contains($html, 'gc-body-code')) {
            $html = preg_replace('/<body([^>]*)>/i', '<body$1>' . "\n    " . '<div id="gc-body-code">' . $bodyCode . '</div>', $html, 1) ?? $html;
        }
        if ($footerCode !== '' && !str_contains($html, 'gc-footer-code')) {
            $html = str_replace('</body>', '    <div id="gc-footer-code">' . $footerCode . "</div>\n</body>", $html);
        }

        return $html;
    }

    private static function buildSiteRuntimeScript(array $site): string
    {
        $config = [
            'homepage_most_popular' => ($site['homepage_most_popular'] ?? true) !== false,
            'homepage_categories' => ($site['homepage_categories'] ?? true) !== false,
            'homepage_recent' => ($site['homepage_recent'] ?? true) !== false,
        ];
        if ($config['homepage_most_popular'] && $config['homepage_categories'] && $config['homepage_recent']) {
            return '';
        }
        $json = json_encode($config, JSON_UNESCAPED_SLASHES);
        return '<script id="gc-site-runtime">(function(){var c=' . $json . ';function hideHeaderSection(h){var row=h.closest(".w-full.flex.items-center");if(!row)return;var grid=row.nextElementSibling;row.style.display="none";if(grid)grid.style.display="none";}function applySections(){document.querySelectorAll("h3").forEach(function(h){var t=h.textContent.trim().toLowerCase();if(!c.homepage_most_popular&&t==="most popular")hideHeaderSection(h);if(!c.homepage_categories&&t==="new arrival")hideHeaderSection(h);if(!c.homepage_recent&&t.indexOf("recent")>=0)hideHeaderSection(h);});}document.addEventListener("DOMContentLoaded",applySections);if(!c.homepage_recent){new MutationObserver(applySections).observe(document.body,{childList:true,subtree:true});}})();</script>';
    }

    private static function buildCustomGamesScript(): string
    {
        $customPath = dirname(__DIR__) . '/admin/data/custom-games.json';
        if (!is_file($customPath)) {
            return '';
        }
        require_once dirname(__DIR__) . '/admin/includes/GamesStore.php';
        $games = GamesStore::listCustomGamesForSite();
        if ($games === []) {
            return '';
        }
        $json = json_encode($games, JSON_UNESCAPED_SLASHES);
        return '<script id="gc-custom-games">(function(){var games=' . $json . ';function cardHtml(game,isLandscape){var url="/view-game/"+encodeURIComponent(game.slug);var img=isLandscape?(game.thumbnail_landscape_16_9||game.thumbnail_squere):(game.thumbnail_squere||game.thumbnail_landscape_16_9);var title=game.title||game.slug;if(isLandscape){return \'<div class="md:col-span-3 col-span-2 gc-custom-game"><div class="group relative w-full aspect-[16/9]"><div class="absolute inset-0"><a href="\'+url+\'"><img src="\'+img+\'" class="w-full object-cover rounded-2xl" alt="\'+title+\'" /></a></div><a href="\'+url+\'"><div class="hidden md:visible bg-game-landscape absolute inset-0 md:flex flex-col gap-2 items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100"><img class="-mt-1 group-hover:translate-y-0 translate-y-6 transition-transform duration-300 p-0 mx-auto block aspect-1/1 object-fill w-[30%]" src="\'+(game.thumbnail_squere||img)+\'" alt="\'+title+\'" /><button class="animatedPlayBtn group-hover:translate-y-0 translate-y-6 transition-transform duration-300 capitalize bg-light-theme-color font-semibold text-white rounded-full px-5 py-1">Play <i class="fa-regular fa-circle-play"></i></button></div></a><h3 class="text-left font-medium pl-2 pb-4 mt-1">\'+title+\'</h3></div></div>\';}return \'<div class="md:col-span-2 col-span-3 gc-custom-game"><a href="\'+url+\'"><div class="group relative"><img src="\'+img+\'" class="w-full object-cover rounded-lg aspect-square transition-transform scale-1 hover:scale-105" alt="\'+title+\'" /></div></a></div>\';}function inject(){var existing=new Set(Array.from(document.querySelectorAll(\'a[href^="/view-game/"]\')).map(function(a){return a.getAttribute("href");}));var fresh=games.filter(function(g){return existing.has("/view-game/"+encodeURIComponent(g.slug))===false;});if(!fresh.length)return;var allGames=document.getElementById("all-games-list");if(allGames){fresh.forEach(function(game){allGames.insertAdjacentHTML("afterbegin",cardHtml(game,true));});return;}document.querySelectorAll(".grid.md\\:grid-cols-12").forEach(function(grid){if(grid.querySelector(".gc-custom-game"))return;if(grid.closest("footer"))return;fresh.slice(0,4).forEach(function(game){grid.insertAdjacentHTML("afterbegin",cardHtml(game,false));});});}document.addEventListener("DOMContentLoaded",inject);})();</script>';
    }

    private static function buildHiddenGamesScript(): string
    {
        require_once dirname(__DIR__) . '/admin/includes/GamesStore.php';
        $hidden = GamesStore::loadHiddenGames();
        if ($hidden === []) {
            return '';
        }
        $json = json_encode($hidden, JSON_UNESCAPED_SLASHES);
        return '<script id="gc-hidden-games">(function(){var hidden=' . $json . ';function hideLinks(){hidden.forEach(function(slug){var enc=encodeURIComponent(slug);document.querySelectorAll(\'a[href="/view-game/\'+enc+\'"],a[href="/game/\'+enc+\'"]\').forEach(function(a){var card=a.closest(".gc-custom-game")||a.closest(".md\\:col-span-2")||a.closest(".md\\:col-span-3")||a.closest(".col-span-2")||a.closest(".col-span-3");if(card){card.remove();return;}var row=a.closest("tr");if(row){row.remove();return;}a.style.display="none";});});}document.addEventListener("DOMContentLoaded",hideLinks);})();</script>';
    }

    public static function applyToHtml(string $html, array $site): string
    {
        return self::applyAdminConfigToHtml($html, ['site' => $site]);
    }

    public static function applyAdminConfigToHtml(string $html, array $config): string
    {
        require_once __DIR__ . '/../admin/includes/ColorValue.php';
        $defaults = self::defaults();
        $site = array_replace_recursive($defaults, $config['site'] ?? []);
        $nav = $config['nav'] ?? [];
        $code = $config['code'] ?? [];
        $analytics = $config['analytics'] ?? [];

        $siteName = trim((string) ($site['site_name'] ?? 'GamesCandy'));
        $theme = ColorValue::cssColor((string) ($site['theme_color'] ?? ''), ColorValue::cssColor((string) ($site['primary_color'] ?? ''), '#6340F5'));
        $metaTitle = trim((string) ($site['meta_title'] ?? $siteName));
        $metaDescription = trim((string) ($site['meta_description'] ?? ''));
        $metaKeywords = trim((string) ($site['meta_keywords'] ?? ''));
        $footerText = trim((string) ($site['footer_text'] ?? ''));
        if ($footerText === '') {
            $footerText = 'Copyright @ ' . trim((string) ($site['copyright_year'] ?? date('Y'))) . ' ' . $siteName;
        }

        if (!str_contains($html, '/site-theme.css')) {
            $html = preg_replace(
                '/<link rel="stylesheet" type="text\/css" href="\/css\/style\.css">/i',
                '<link rel="stylesheet" type="text/css" href="/css/style.css">' . "\n    " . '<link rel="stylesheet" href="/site-theme.css">',
                $html,
                1
            ) ?? $html;
            if (!str_contains($html, '/site-theme.css')) {
                $html = str_replace('</head>', '    <link rel="stylesheet" href="/site-theme.css">' . "\n</head>", $html);
            }
        }

        $html = preg_replace('/<meta name="theme-color" content="[^"]*">/i', '<meta name="theme-color" content="' . htmlspecialchars($theme) . '">', $html) ?? $html;
        $html = preg_replace('/<meta name="msapplication-TileColor" content="[^"]*">/i', '<meta name="msapplication-TileColor" content="' . htmlspecialchars($theme) . '">', $html) ?? $html;
        $html = preg_replace('/<link rel="mask-icon" href="[^"]*" color="[^"]*">/i', '<link rel="mask-icon" href="/safari-pinned-tab.svg" color="' . htmlspecialchars($theme) . '">', $html) ?? $html;

        if ($metaTitle !== '') {
            $html = preg_replace('/<title>[\s\S]*?<\/title>/i', '<title>' . htmlspecialchars($metaTitle) . '</title>', $html) ?? $html;
            $html = self::replaceMetaByProperty($html, 'og:title', $metaTitle);
        }
        if ($metaDescription !== '') {
            $html = self::replaceMetaByName($html, 'description', $metaDescription);
            $html = self::replaceMetaByProperty($html, 'og:description', $metaDescription);
        }
        if ($metaKeywords !== '') {
            $html = self::replaceMetaByName($html, 'keywords', $metaKeywords);
        }

        $logoDesktop = trim((string) ($site['logo_desktop'] ?? '/images/logo.svg'));
        $logoMobile = trim((string) ($site['logo_mobile'] ?? '/images/logo_mobile.svg'));
        $html = preg_replace('/(<img src=")\/images\/logo\.svg/i', '$1' . $logoDesktop, $html) ?? $html;
        $html = preg_replace('/(<img src=")\/images\/logo_mobile\.svg/i', '$1' . $logoMobile, $html) ?? $html;
        $html = preg_replace('/alt="GamesCandy Logo"/i', 'alt="' . htmlspecialchars($siteName, ENT_QUOTES) . ' Logo"', $html) ?? $html;

        if (!empty($site['favicon'])) {
            $html = preg_replace('/<link rel="shortcut icon" href="[^"]*">/i', '<link rel="shortcut icon" href="' . htmlspecialchars((string) $site['favicon']) . '">', $html) ?? $html;
        }
        if (!empty($site['home_hero_title'])) {
            $html = preg_replace('/(<h3 class="text-\[24px\][^>]*>)(Most Popular|Featured|Popular Games)(<\/h3>)/i', '$1' . htmlspecialchars((string) $site['home_hero_title']) . '$3', $html) ?? $html;
        }

        $html = preg_replace('/Copyright @ \d{4}[^<]*/i', htmlspecialchars($footerText, ENT_QUOTES), $html) ?? $html;
        $html = preg_replace('/©\s*\d{4}\s*GamesCandy[^<]*/i', htmlspecialchars($footerText, ENT_QUOTES), $html) ?? $html;

        $html = self::applyFooterCreditLinks($html, $site);
        $html = self::applyNav($html, $nav, $site);
        $html = self::applyCustomCode($html, $code);

        $analyticsHtml = self::buildAnalyticsHtml($analytics);
        if ($analyticsHtml !== '' && !str_contains($html, 'gc-analytics')) {
            $html = str_replace('</head>', '    ' . $analyticsHtml . "\n</head>", $html);
        }

        $runtime = self::buildSiteRuntimeScript($site);
        if ($runtime !== '' && !str_contains($html, 'gc-site-runtime')) {
            $html = str_replace('</body>', $runtime . "\n</body>", $html);
        }

        $customGamesScript = self::buildCustomGamesScript();
        if ($customGamesScript !== '' && !str_contains($html, 'gc-custom-games')) {
            $html = str_replace('</body>', $customGamesScript . "\n</body>", $html);
        }

        $hiddenGamesScript = self::buildHiddenGamesScript();
        if ($hiddenGamesScript !== '' && !str_contains($html, 'gc-hidden-games')) {
            $html = str_replace('</body>', $hiddenGamesScript . "\n</body>", $html);
        }

        return SiteAuth::applyAuthToHtml(SiteAds::applyAdsToHtml($html, $config));
    }
}
