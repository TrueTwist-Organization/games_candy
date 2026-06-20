<?php

/**
 * Sanitize HTML/JS output so inspect/console does not expose clone/source branding.
 */
class StripHtml
{
    private const GAME_READY_SCRIPT = <<<'JS'
function getGameProxyUrl(url) {
        if (!url || url.charAt(0) === '/') return url;
        var match = url.match(/https:\/\/(gamesdonut-games-[^/]+)\.s3\.[^/]+\.amazonaws\.com\/(.+)/);
        if (match) return '/s3-proxy/' + match[1] + '/' + match[2];
        return url;
    }

    $(document).ready(function() {
        $('#game-ad-container-main').remove();
        $('.bg-slate-200.h-\[50px\]').remove();
        $('#game-content-main').removeClass('hidden bg-white').css({
            height: 'calc(100dvh - 40px)',
            background: '#000'
        });
        $('#game-content').css({
            position: 'relative',
            width: '100%',
            height: '100%',
            background: '#000',
            overflow: 'hidden'
        });
        $('#loading').removeClass('hidden');
        var proxyUrl = getGameProxyUrl(game_url);
        $('#game-content').load(proxyUrl, function(response, status) {
            if (status === 'error') {
                $('#loading').addClass('hidden');
                $('#game-content').html('<p style="color:#fff;text-align:center;padding:2rem;">Game failed to load. Please refresh.</p>');
                return;
            }
            $('#loading').addClass('hidden');
        });
        setTimeout(function() { $('#loading').addClass('hidden'); }, 12000);
    });
JS;

    private const PROTECTED_PATTERNS = [
        '/https:\/\/gamesdonut\.com[^\s"\'<>]*/i',
        '/https:\/\/buyhtml5games\.gamesdonut\.com[^\s"\'<>]*/i',
        '/https:\/\/www\.facebook\.com\/games\.donut[^\s"\'<>]*/i',
        '/https:\/\/www\.instagram\.com\/gamesdonut_online[^\s"\'<>]*/i',
        '/https:\/\/x\.com\/gamesdonut_play[^\s"\'<>]*/i',
        '/https:\/\/www\.linkedin\.com\/company\/gamesdonut[^\s"\'<>]*/i',
        '/https:\/\/play\.google\.com\/store\/apps\/details\?id=com\.gamesdonut\.games\.offline\.nowifi[^\s"\'<>]*/i',
        '/gamesdonut-games-2026\.s3[^\s"\'<>]*/i',
        '/gamesdonut-games-new\.s3[^\s"\'<>]*/i',
        '/\/GamesDonut\/[^"\'<>\\s]*/i',
        '/gamesdonut-b566f[^\s"\'<>]*/i',
        '/gamesdonut\.firebaseapp\.com[^\s"\'<>]*/i',
        '/\/s3-proxy\/gamesdonut-games-2026\//i',
        '/\/s3-proxy\/gamesdonut-games-new\//i',
    ];

    public static function embedPath(string $bucketKey, string $s3Path): string
    {
        $prefix = EMBED_PREFIX[$bucketKey] ?? 'g';
        if (str_starts_with($s3Path, 'GamesDonut/')) {
            $s3Path = substr($s3Path, strlen('GamesDonut/'));
        }

        return '/embed/' . $prefix . '/' . ltrim($s3Path, '/');
    }

    public static function resolveEmbedTarget(string $embedPath): ?array
    {
        if (!preg_match('#^/embed/([^/]+)/(.+)$#', $embedPath, $matches)) {
            return null;
        }

        $prefix = $matches[1];
        $relativePath = $matches[2];
        $bucketKey = EMBED_BUCKETS[$prefix] ?? null;

        if (!$bucketKey) {
            return null;
        }

        return [
            'bucket' => $bucketKey,
            'path' => 'GamesDonut/' . ltrim($relativePath, '/'),
        ];
    }

    private static function rebrandReplacements(): array
    {
        return [
            ['GamesDonut', 'GamesCandy'],
            ['Gamesdonut', 'GamesCandy'],
            ['GAMESDONUT', 'GAMESCANDY'],
            ['gamesdonut.com', 'GamesCandy.com'],
            ['games-donut-clone', 'games-candy'],
            ['Local clone of gamesdonut.com', 'GamesCandy gaming site'],
            ["COOKIE_DOMAIN = 'gamesdonut.com'", "COOKIE_DOMAIN = '" . COOKIE_DOMAIN . "'"],
        ];
    }

    public static function stripAdsFromHtml(string $html): string
    {
        $text = $html;

        $text = preg_replace('/\s*<meta name="google-adsense-account"[^>]*>\s*/i', "\n", $text);
        $text = preg_replace('/\s*<script async src="https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js[^"]*"[^>]*><\/script>\s*/i', "\n", $text);
        $text = preg_replace('/<script>\s*function initializeAds\(\)[\s\S]*?<\/script>\s*/', '', $text);
        $text = preg_replace('/<div class="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 hidden" id="adBlockerDialog">[\s\S]*?<\/div>\s*/', '', $text);
        $text = preg_replace('/\s*<script type="text\/javascript" src="\/js\/blockadblock\.js"><\/script>\s*/', "\n", $text);
        $text = preg_replace('/\s*<script type="text\/javascript" src="\/js\/ads\.js"><\/script>\s*/', "\n", $text);
        $text = preg_replace('/<script>\s*setTimeout\(\(\)=>\s*\{\s*\(adsbygoogle[\s\S]*?<\/script>\s*/', '', $text);
        $text = preg_replace('/<ins class="adsbygoogle[^"]*"[\s\S]*?<\/ins>\s*<script>\s*\(adsbygoogle[\s\S]*?<\/script>\s*/i', '', $text);
        $text = preg_replace('/<ins class="adsbygoogle[^"]*"[\s\S]*?<\/ins>\s*/i', '', $text);
        $text = preg_replace('/<script>\s*\(adsbygoogle = window\.adsbygoogle \|\| \[\]\)\.push\(\{\}\);\s*<\/script>\s*/', '', $text);
        $text = preg_replace('/<div class="w-full flex justify-center bg-slate-200 sm:hidden h-\[50px\]">\s*<\/div>\s*/', '', $text);
        $text = preg_replace('/<div class="w-full flex justify-center bg-slate-200 sm:hidden h-\[50px\]">[\s\S]*?<\/div>\s*/', '', $text);
        $text = preg_replace('/<div id="game-ad-container-main"[\s\S]*?<\/div>\s*(?=<div class="w-full flex justify-center bg-slate-200|<script type="text\/javascript">)/', '', $text);

        if (str_contains($text, 'id="game-ad-container-main"')) {
            $text = preg_replace('/<div id="game-ad-container-main"[\s\S]*?<\/div>\s*<\/div>\s*/', '', $text, 1);
        }

        $text = preg_replace('/\s*loadInterAds\(\)\s*/', "\n", $text);
        $text = preg_replace('/showInterAds\(\)\s*/', '', $text);
        $text = preg_replace('/<script>\s*function showInterAds\(\)[\s\S]*?function loadInterAds\(\)[\s\S]*?<\/script>\s*/', '', $text);
        $text = preg_replace('/\s*function\s*\{\s*afg\.adBreak\([\s\S]*?\}\s*function\s*\{[\s\S]*?window\.afg = afg;\s*\}\s*/', "\n", $text);
        $text = preg_replace(
            '/\$\(document\)\.ready\(function\(\)\s*\{\s*\$\(\'#game-content-main\'\)\.addClass\(\'hidden\'\);[\s\S]*?\}\);\s*\$\(\'#continue-btn\'\)\.on\(\'click\',function\(\)\{[\s\S]*?\}\);\s*/',
            self::GAME_READY_SCRIPT . "\n\n    ",
            $text
        );
        $text = preg_replace(
            '/\$\(document\)\.ready\(function\(\)\s*\{\s*\$\(\'#game-content-main\'\)\.addClass\(\'hidden\'\);[\s\S]*?\}\);\s*/',
            self::GAME_READY_SCRIPT . "\n\n    ",
            $text ?? $html
        );
        $text = preg_replace('/\$\(\'#continue-btn\'\)\.on\(\'click\',function\(\)\{[\s\S]*?\}\);\s*/', '', $text ?? $html);

        return $text ?? $html;
    }

    public static function normalizeSiteUrls(string $html): string
    {
        $text = $html;
        $text = preg_replace('#https://gamesdonut\.com/game/#', '/game/', $text);
        $text = preg_replace('#https://gamesdonut\.com/view-game/#', '/view-game/', $text);
        $text = preg_replace('#https://gamesdonut\.com/category/#', '/category/', $text);
        $text = preg_replace('#https://gamesdonut\.com/home\b#', '/home', $text);
        $text = preg_replace('#https://gamesdonut\.com/games\b#', '/games', $text);
        $text = preg_replace('#https://gamesdonut\.com/#', '/', $text);

        return $text ?? $html;
    }

    public static function injectGameReadyScript(string $html): string
    {
        if (!str_contains($html, 'game_url') || str_contains($html, 'getGameProxyUrl')) {
            return $html;
        }

        $result = preg_replace(
            '/(<script type="text\/javascript">\s*\n?\s*game_url)/',
            '<script type="text/javascript">' . "\n" . self::GAME_READY_SCRIPT . "\n\n    game_url",
            $html,
            1
        );

        return $result ?? $html;
    }

    public static function stripGameDescriptions(string $html): string
    {
        $result = preg_replace(
            '/<div class="my-5 game-banner-container bg-cover bg-no-repeat bg-white py-\[3rem\] rounded-\[30px\]">\s*<article class="prose w-full px-7 max-w-none">[\s\S]*?<\/article>\s*<div class="my-5">\s*<\/div>\s*<\/div>\s*/',
            '',
            $html
        );

        return $result ?? $html;
    }

    public static function sanitizePublicHtml(string $html): string
    {
        $text = self::stripAdsFromHtml($html);
        $text = self::stripTracking($text);
        $text = self::normalizeSiteUrls($text);
        $text = self::normalizeGameUrls($text);
        $text = self::injectGameReadyScript($text);
        $text = self::rebrandText($text);

        return $text;
    }

    public static function stripTracking(string $html): string
    {
        $text = $html;

        $text = preg_replace('/<!-- Google tag \(gtag\.js\) -->[\s\S]*?gtag\(\'config\'[^\)]*\);\s*<\/script>\s*/', '', $text);
        $text = preg_replace('/<script async src="https:\/\/www\.googletagmanager\.com\/gtag\/js[^"]*"[^>]*><\/script>\s*/', '', $text);
        $text = preg_replace('/<script defer src="https:\/\/static\.cloudflareinsights\.com\/beacon\.min\.js[^"]*"[^>]*><\/script>\s*/', '', $text);
        $text = preg_replace('/<script[^>]*>\s*var saveTokenUrl[\s\S]*?<\/script>\s*<script type="module" src="\/js\/firebasePushNotification\.js"><\/script>\s*/', '', $text);
        $text = preg_replace('/<script type="module" src="\/js\/firebasePushNotification\.js"><\/script>\s*/', '', $text);
        $text = preg_replace('/https:\/\/www\.instagram\.com\/gamesdonut_online/', '#', $text);
        $text = preg_replace('/https:\/\/x\.com\/gamesdonut_play/', '#', $text);
        $text = preg_replace('/https:\/\/www\.linkedin\.com\/company\/gamesdonut/', '#', $text);
        $text = preg_replace('/https:\/\/play\.google\.com\/store\/apps\/details\?id=com\.gamesdonut\.games\.offline\.nowifi/', '#', $text);
        $text = preg_replace('/https:\/\/www\.facebook\.com\/games\.donut/', '#', $text);
        $text = preg_replace('/https:\/\/buyhtml5games\.gamesdonut\.com\/?/', '#', $text);
        $text = preg_replace('/\s*console\.log\([^\)]*\);\s*/', "\n", $text);

        return $text ?? $html;
    }

    public static function normalizeGameUrls(string $html): string
    {
        $text = preg_replace_callback(
            '/game_url\s*=\s*"(https:\/\/gamesdonut-games-[^"]+)"/',
            static function ($m) {
                return 'game_url = "' . self::s3UrlToEmbed($m[1]) . '"';
            },
            $html
        );

        $text = preg_replace_callback(
            '/https:\/\/gamesdonut-games-2026\.s3\.[^"\']+\.amazonaws\.com\/GamesDonut\/([^"\']+)/',
            static fn ($m) => self::embedPath('gamesdonut-games-2026', 'GamesDonut/' . $m[1]),
            $text ?? $html
        );

        $text = preg_replace_callback(
            '/https:\/\/gamesdonut-games-new\.s3\.[^"\']+\.amazonaws\.com\/GamesDonut\/([^"\']+)/',
            static fn ($m) => self::embedPath('gamesdonut-games-new', 'GamesDonut/' . $m[1]),
            $text ?? $html
        );

        $text = preg_replace(
            '/\/s3-proxy\/gamesdonut-games-2026\/GamesDonut\//',
            '/embed/g/',
            $text ?? $html
        );
        $text = preg_replace(
            '/\/s3-proxy\/gamesdonut-games-new\/GamesDonut\//',
            '/embed/n/',
            $text ?? $html
        );
        $text = str_replace('https://gamesdonut.com/aws-s3-url', '/api/game-assets', $text ?? $html);

        return $text ?? $html;
    }

    private static function s3UrlToEmbed(string $url): string
    {
        if (preg_match('#https://gamesdonut-games-2026\.s3\.[^/]+/GamesDonut/(.+)#', $url, $m)) {
            return self::embedPath('gamesdonut-games-2026', 'GamesDonut/' . $m[1]);
        }
        if (preg_match('#https://gamesdonut-games-new\.s3\.[^/]+/GamesDonut/(.+)#', $url, $m)) {
            return self::embedPath('gamesdonut-games-new', 'GamesDonut/' . $m[1]);
        }

        return $url;
    }

    public static function rebrandText(string $text): string
    {
        $placeholders = [];

        foreach (self::PROTECTED_PATTERNS as $pattern) {
            $text = preg_replace_callback($pattern, function ($matches) use (&$placeholders) {
                $key = '__PROTECT_' . count($placeholders) . '__';
                $placeholders[$key] = $matches[0];
                return $key;
            }, $text);
        }

        foreach (self::rebrandReplacements() as [$old, $new]) {
            $text = str_replace($old, $new, $text);
        }

        foreach ($placeholders as $key => $value) {
            $text = str_replace($key, $value, $text);
        }

        return $text;
    }

    public static function transformProxiedHtml(string $html, string $urlPath): string
    {
        $text = self::sanitizePublicHtml($html);

        if (str_contains($urlPath, '/view-game/')) {
            $text = self::stripGameDescriptions($text);
        }

        $text = self::normalizeSiteUrls($text);
        $text = self::normalizeGameUrls($text);

        return $text;
    }

    public static function rewriteGameHtml(string $html, string $host): string
    {
        $text = self::normalizeGameUrls($html);
        $text = preg_replace('/<!--H5Ads[\s\S]*?<!--H5Ads[\s\S]*?-->/', '', $text);
        $text = preg_replace(
            '/<script async data-ad-frequency-hint[\s\S]*?<\/script>\s*<script>[\s\S]*?adConfig[\s\S]*?<\/script>/i',
            '',
            $text
        );

        return $text ?? $html;
    }

    public static function rewriteGameCss(string $css): string
    {
        $text = preg_replace('/body\s*\{/', '#game-content {', $css);
        $text = preg_replace('/#unity-container(?![\w-])/', '#game-content #unity-container', $text);

        return $text ?? $css;
    }

    public static function isHtmlResponse(?string $contentType): bool
    {
        return is_string($contentType) && str_contains($contentType, 'text/html');
    }
}
