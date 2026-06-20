<?php

class SiteAds
{
    private const PAGE_PLACEMENTS = [
        'home' => ['bottom_anchor', 'web_interstitial', 'home_top_banner', 'home_hero_mpu', 'home_mpu_1', 'home_mpu_2'],
        'list' => ['bottom_anchor', 'web_interstitial', 'list_top', 'list_mid'],
        'game_play' => ['bottom_anchor', 'web_interstitial', 'game_preroll', 'game_mpu_left', 'game_mpu_right'],
        'game_view' => ['bottom_anchor', 'web_interstitial', 'game_preplay'],
        'other' => ['bottom_anchor', 'web_interstitial'],
    ];

    /** @var array<string, mixed> */
    private const SLOT_SIZES = [
        'bottom_anchor' => 'anchor',
        'web_interstitial' => 'interstitial',
        'home_top_banner' => [[728, 90], [970, 90], [320, 50], 'fluid'],
        'home_hero_mpu' => [[300, 250], [336, 280], 'fluid'],
        'home_mpu_1' => [[300, 250], [336, 280], 'fluid'],
        'home_mpu_2' => [[300, 250], [336, 280], 'fluid'],
        'list_top' => [[728, 90], [970, 90], [300, 250], 'fluid'],
        'list_mid' => [[300, 250], [336, 280], 'fluid'],
        'game_preroll' => [[300, 250], [336, 280], 'fluid'],
        'game_mpu_left' => [[160, 600], [120, 600], [300, 250]],
        'game_mpu_right' => [[160, 600], [120, 600], [300, 250]],
        'game_preplay' => [[300, 250], [336, 280], 'fluid'],
    ];

    private const STRIP_GAME_READY = '/\$\(document\)\.ready\(function\(\)\s*\{\s*\$\(\'#game-ad-container-main\'\)\.remove\(\);[\s\S]*?setTimeout\(function\(\)\s*\{\s*\$\(\'#loading\'\)\.addClass\(\'hidden\'\);\s*\},\s*12000\);\s*\}\);/';

    private const PREROLL_GAME_READY = '$(document).ready(function() {
        $(\'#game-content-main\').addClass(\'hidden\');
        function bootGame() {
            if (window.GCAds && typeof window.GCAds.setupGamePreroll === \'function\') {
                window.GCAds.setupGamePreroll(getGameProxyUrl);
                return true;
            }
            return false;
        }
        if (!bootGame()) {
            var tries = 0;
            var timer = setInterval(function() {
                tries++;
                if (bootGame() || tries > 40) {
                    clearInterval(timer);
                    if (tries > 40 && !window.GCAds) {
                        $(\'#game-ad-container-main\').remove();
                        $(\'#game-content-main\').removeClass(\'hidden\');
                        $(\'#loading\').removeClass(\'hidden\');
                        var proxyUrl = getGameProxyUrl(window.game_url || \'\');
                        $(\'#game-content\').load(proxyUrl, function(response, status) {
                            $(\'#loading\').addClass(\'hidden\');
                            if (status === \'error\') {
                                $(\'#game-content\').html(\'<p style="color:#fff;text-align:center;padding:2rem;">Game failed to load. Please refresh.</p>\');
                            }
                        });
                    }
                }
            }, 50);
        }
    });';

    private static function configPath(): string
    {
        return dirname(__DIR__) . '/admin/data/admin-config.json';
    }

    public static function isAdsEnabled(array $config): bool
    {
        return ($config['site']['enable_ads'] ?? false) === true;
    }

    public static function normalizeGamNetwork(string $network): string
    {
        $value = trim($network);
        if ($value === '') {
            return '';
        }
        if (!str_starts_with($value, '/')) {
            $value = '/' . $value;
        }
        if (!str_ends_with($value, '/')) {
            $value .= '/';
        }
        return $value;
    }

    public static function buildAdUnitPath(string $network, string $code): string
    {
        $base = self::normalizeGamNetwork($network);
        $unit = ltrim(trim($code), '/');
        if ($base === '' || $unit === '') {
            return '';
        }
        return $base . $unit;
    }

    public static function extractAdsenseClient(array $ads): string
    {
        $txt = (string) ($ads['ads_txt'] ?? '');
        if (preg_match('/google\.com,\s*(pub-\d+)/i', $txt, $match)) {
            return 'ca-' . $match[1];
        }
        $network = (string) ($ads['gam_network'] ?? '');
        if (preg_match('/(pub-\d+|ca-pub-\d+)/i', $network, $networkMatch)) {
            $pub = $networkMatch[1];
            return str_starts_with(strtolower($pub), 'ca-') ? $pub : 'ca-' . $pub;
        }
        return '';
    }

    public static function getConfigVersion(): string
    {
        $path = self::configPath();
        if (is_file($path)) {
            return (string) (int) floor((float) filemtime($path) * 1000);
        }
        return (string) (int) floor(microtime(true) * 1000);
    }

    public static function detectPageType(string $html): string
    {
        $text = (string) $html;
        $pathHint = '';
        if (preg_match('/property="og:url"\s+content="([^"]*)"/i', $text, $ogMatch)) {
            $pathHint = (string) ($ogMatch[1] ?? '');
        } elseif (preg_match('/rel="canonical"\s+href="([^"]*)"/i', $text, $canonicalMatch)) {
            $pathHint = (string) ($canonicalMatch[1] ?? '');
        }

        if (preg_match('/class="[^"]*game-play-page/i', $text) || str_contains($pathHint, '/game/')) {
            return 'game_play';
        }
        if (str_contains($pathHint, '/view-game/')) {
            return 'game_view';
        }
        if (str_contains($pathHint, '/home')) {
            return 'home';
        }
        if (str_contains($pathHint, '/games')) {
            return 'list';
        }
        if (str_contains($pathHint, '/category/')) {
            return 'list';
        }
        return 'other';
    }

    /** @return list<array{key:string,code:string,unitPath:string,sizes:mixed,adsenseClient:string}> */
    public static function getActivePlacements(array $ads, string $pageType): array
    {
        $allowed = self::PAGE_PLACEMENTS[$pageType] ?? self::PAGE_PLACEMENTS['other'];
        $placements = $ads['placements'] ?? [];
        if (!is_array($placements)) {
            $placements = [];
        }
        $network = self::normalizeGamNetwork((string) ($ads['gam_network'] ?? ''));
        $adsenseClient = self::extractAdsenseClient($ads);
        $items = [];

        foreach ($allowed as $key) {
            $placement = $placements[$key] ?? null;
            if (!is_array($placement) || ($placement['enabled'] ?? true) === false) {
                continue;
            }
            $code = trim((string) ($placement['code'] ?? ''));
            if ($code === '') {
                continue;
            }
            $unitPath = self::buildAdUnitPath($network, $code);
            if ($unitPath === '' && $adsenseClient === '') {
                continue;
            }
            $items[] = [
                'key' => $key,
                'code' => $code,
                'unitPath' => $unitPath,
                'sizes' => self::SLOT_SIZES[$key] ?? [[300, 250], 'fluid'],
                'adsenseClient' => $adsenseClient,
            ];
        }

        return $items;
    }

    public static function buildAdsCss(array $site): string
    {
        if (($site['enable_ads'] ?? false) !== true) {
            return '';
        }

        return <<<'CSS'
body.gc-ads-enabled ins.adsbygoogle,
body.gc-ads-enabled .ads-content,
body.gc-ads-enabled [data-ad-slot],
body.gc-ads-enabled .googleadsmodal,
body.gc-ads-enabled #ads-modal,
body.gc-ads-enabled #game-ad-container-main,
body.gc-ads-enabled .game-ad-container,
body.gc-ads-enabled #continue-btn,
body.gc-ads-enabled .gc-ad-slot,
body.gc-ads-enabled .gc-ad-anchor,
body.gc-ads-enabled iframe[src*="googlesyndication"],
body.gc-ads-enabled iframe[src*="doubleclick"],
body.gc-ads-enabled iframe[src*="googleads"],
body.gc-ads-enabled iframe[id^="google_ads_iframe"] {
  display: block !important;
  visibility: visible !important;
  height: auto !important;
  min-height: 0 !important;
  max-height: none !important;
  margin: revert !important;
  padding: revert !important;
  overflow: visible !important;
  opacity: 1 !important;
  pointer-events: auto !important;
}
body.gc-ads-enabled #game-content-main.hidden {
  display: none !important;
}
body.gc-ads-enabled .gc-ad-slot {
  text-align: center;
  margin: 1.25rem auto;
  min-height: 50px;
  width: 100%;
  max-width: 100%;
}
body.gc-ads-enabled .gc-ad-slot.gc-ad-banner {
  min-height: 90px;
}
body.gc-ads-enabled .gc-ad-slot.gc-ad-mpu {
  min-height: 250px;
  max-width: 336px;
}
body.gc-ads-enabled .gc-ad-rail {
  display: none;
}
@media (min-width: 1280px) {
  body.gc-ads-enabled.game-play-page .gc-ad-rail.gc-ad-rail-left,
  body.gc-ads-enabled.game-play-page .gc-ad-rail.gc-ad-rail-right {
    display: block;
    position: fixed;
    top: 50%;
    transform: translateY(-50%);
    width: 160px;
    z-index: 20;
  }
  body.gc-ads-enabled.game-play-page .gc-ad-rail.gc-ad-rail-left { left: 8px; }
  body.gc-ads-enabled.game-play-page .gc-ad-rail.gc-ad-rail-right { right: 8px; }
}
body.gc-ads-enabled #game-ad-container-main {
  display: flex !important;
}
body.gc-ads-enabled .gc-mobile-anchor {
  display: flex !important;
  justify-content: center;
  align-items: center;
  min-height: 50px;
  background: #e2e8f0;
}
body.gc-ads-enabled #continue-btn[disabled] {
  opacity: 0.85;
  cursor: not-allowed;
}

CSS;
    }

    /** @return array<string, mixed> */
    public static function buildAdsConfigPayload(array $config, string $pageType): array
    {
        $ads = $config['ads'] ?? [];
        if (!is_array($ads)) {
            $ads = [];
        }
        $placements = self::getActivePlacements($ads, $pageType);
        $mapped = [];
        foreach ($placements as $item) {
            $mapped[] = [
                'key' => $item['key'],
                'code' => $item['code'],
                'unitPath' => $item['unitPath'],
                'sizes' => $item['sizes'],
            ];
        }

        $refreshSec = max(0, (int) ((float) ($ads['refresh_sec'] ?? 0)));
        $prebidTimeout = max(500, (int) ((float) ($ads['prebid_timeout'] ?? 1500)));

        return [
            'enabled' => true,
            'pageType' => $pageType,
            'gamNetwork' => self::normalizeGamNetwork((string) ($ads['gam_network'] ?? '')),
            'adsenseClient' => self::extractAdsenseClient($ads),
            'refreshSec' => $refreshSec,
            'amazonPubId' => trim((string) ($ads['amazon_pub_id'] ?? '')),
            'prebidTimeout' => $prebidTimeout,
            'prebidBids' => trim((string) ($ads['prebid_bids'] ?? '')),
            'placements' => $mapped,
        ];
    }

    /** @param array<string, mixed> $payload */
    public static function buildAdsInlineConfigScript(array $payload): string
    {
        $json = str_replace('<', '\\u003c', json_encode($payload, JSON_UNESCAPED_SLASHES) ?: '{}');
        return '<script id="gc-ads-config">window.__gcAds=' . $json . ';</script>';
    }

    public static function getAdsTxt(array $ads): string
    {
        return rtrim((string) ($ads['ads_txt'] ?? '')) . "\n";
    }

    public static function buildAdsJs(): string
    {
        $runtimePath = dirname(__DIR__) . '/lib/ads.runtime.js';
        if (!is_file($runtimePath)) {
            return '';
        }
        return file_get_contents($runtimePath) ?: '';
    }

    private static function buildGamePrerollHtml(): string
    {
        return <<<'HTML'
<div id="game-ad-container-main" class="bg-white h-[calc(100dvh-90px)] sm:h-[calc(100dvh-40px)]">
    <div class="overflow-hidden flex items-center justify-center flex-col h-full">
        <h4 class="text-center font-semibold capitalize text-md p-2">Advertisement</h4>
        <div class="game-ad-container w-full gc-ad-slot gc-ad-mpu" data-gc-placement="game_preroll"></div>
        <button id="continue-btn" class="bg-gray-600 font-semibold text-white text-lg rounded-full p-2 w-[12rem] mt-2" type="button" disabled>Continue in 3!</button>
    </div>
</div>
HTML;
    }

    private static function buildMobileAnchorHtml(): string
    {
        return <<<'HTML'
<div class="w-full flex justify-center bg-slate-200 sm:hidden h-[50px] gc-mobile-anchor">
    <div class="gc-ad-slot gc-ad-banner w-full h-[50px]" data-gc-placement="bottom_anchor" style="min-height:50px;"></div>
</div>
HTML;
    }

    private static function applyAdsBodyClass(string $html): string
    {
        return preg_replace_callback(
            '/<body([^>]*)class="([^"]*)"/i',
            static function (array $matches): string {
                if (str_contains($matches[2], 'gc-ads-enabled')) {
                    return $matches[0];
                }
                return '<body' . $matches[1] . 'class="' . $matches[2] . ' gc-ads-enabled"';
            },
            $html
        ) ?? $html;
    }

    private static function applyGamePlayAdsHtml(string $html, array $ads): string
    {
        $text = (string) $html;
        if (!preg_match('/game-play-page/i', $text)) {
            return $text;
        }

        $placements = $ads['placements'] ?? [];
        if (!is_array($placements)) {
            $placements = [];
        }

        $preroll = $placements['game_preroll'] ?? [];
        $anchor = $placements['bottom_anchor'] ?? [];
        $prerollEnabled = ($preroll['enabled'] ?? true) !== false
            && trim((string) ($preroll['code'] ?? '')) !== '';
        $anchorEnabled = ($anchor['enabled'] ?? true) !== false
            && trim((string) ($anchor['code'] ?? '')) !== '';

        if ($prerollEnabled && !str_contains($text, 'id="game-ad-container-main"')) {
            $prerollHtml = self::buildGamePrerollHtml();
            if ($anchorEnabled && !str_contains($text, 'gc-mobile-anchor')) {
                $prerollHtml = str_replace(
                    "</div>\n</div>",
                    self::buildMobileAnchorHtml() . "\n</div>\n</div>",
                    $prerollHtml
                );
            }

            $text = preg_replace_callback(
                '/<div id="game-content-main" class="([^"]*)">\s*<div id="game-content" class="([^"]*)"><\/div>\s*<\/div>/i',
                static function (array $matches) use ($prerollHtml): string {
                    $mainClass = str_contains($matches[1], 'hidden') ? $matches[1] : $matches[1] . ' hidden';
                    return '<div id="game-content-main" class="' . $mainClass . '">' . "\n"
                        . '    <div id="game-content" class="' . $matches[2] . '"></div>' . "\n"
                        . '</div>' . "\n"
                        . $prerollHtml;
                },
                $text,
                1
            ) ?? $text;
        } elseif ($anchorEnabled && !str_contains($text, 'gc-mobile-anchor') && str_contains($text, 'id="game-ad-container-main"')) {
            $text = preg_replace(
                '/(<div id="game-ad-container-main"[\s\S]*?<button id="continue-btn"[\s\S]*?<\/button>)/',
                '$1' . "\n" . self::buildMobileAnchorHtml(),
                $text,
                1
            ) ?? $text;
        }

        if ($prerollEnabled && preg_match(self::STRIP_GAME_READY, $text)) {
            $text = preg_replace(self::STRIP_GAME_READY, self::PREROLL_GAME_READY, $text) ?? $text;
        } elseif ($prerollEnabled) {
            $text = str_replace("$('#game-ad-container-main').remove();", '/* gc-ads: keep preroll */', $text);
            $text = str_replace(
                "$('#game-content-main').removeClass('hidden bg-white').css({",
                "$('#game-content-main').addClass('hidden').removeClass('bg-white').css({",
                $text
            );
            $text = preg_replace(
                '/var proxyUrl = getGameProxyUrl\(game_url\);\s*\$\(\'#game-content\'\)\.load\(proxyUrl[\s\S]*?setTimeout\(function\(\)\s*\{\s*\$\(\'#loading\'\)\.addClass\(\'hidden\'\);\s*\},\s*12000\);/',
                "if (window.GCAds && typeof window.GCAds.setupGamePreroll === 'function') { window.GCAds.setupGamePreroll(getGameProxyUrl); }",
                $text
            ) ?? $text;
        }

        return $text;
    }

    public static function applyAdsToHtml(string $html, array $config): string
    {
        if (!self::isAdsEnabled($config)) {
            return $html;
        }

        $text = (string) $html;
        $pageType = self::detectPageType($text);
        $payload = self::buildAdsConfigPayload($config, $pageType);
        $ads = $config['ads'] ?? [];
        if (!is_array($ads)) {
            $ads = [];
        }

        $text = self::applyAdsBodyClass($text);
        $text = self::applyGamePlayAdsHtml($text, $ads);

        $version = self::getConfigVersion();
        $configScript = self::buildAdsInlineConfigScript($payload);
        if (!str_contains($text, 'gc-ads-config')) {
            $text = str_replace('</head>', '    ' . $configScript . "\n</head>", $text);
        }

        $loader = '<script src="/js/ads.js?v=' . $version . '" defer></script>';
        if (!str_contains($text, '/js/ads.js')) {
            $text = str_replace('</body>', '    ' . $loader . "\n</body>", $text);
        } else {
            $text = preg_replace('/\/js\/ads\.js(\?v=[^"\']*)?/', '/js/ads.js?v=' . $version, $text) ?? $text;
        }

        return $text;
    }
}
