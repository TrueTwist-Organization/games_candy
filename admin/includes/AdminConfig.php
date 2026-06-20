<?php

class AdminConfig
{
    public const PLACEMENTS = [
        ['key' => 'bottom_anchor', 'label' => 'Bottom anchor (site-wide)', 'default_code' => 'aa1', 'col' => 'left'],
        ['key' => 'home_hero_mpu', 'label' => 'Home — hero MPU', 'default_code' => 'aa2', 'col' => 'left'],
        ['key' => 'home_mpu_1', 'label' => 'Home — MPU 1', 'default_code' => 'aa3', 'col' => 'left'],
        ['key' => 'list_top', 'label' => 'List — top', 'default_code' => 'aa4', 'col' => 'left'],
        ['key' => 'game_preroll', 'label' => 'Game — pre-roll', 'default_code' => 'aa5', 'col' => 'left'],
        ['key' => 'game_mpu_right', 'label' => 'Game — MPU right', 'default_code' => 'aa6', 'col' => 'left'],
        ['key' => 'web_interstitial', 'label' => 'Web interstitial (site-wide)', 'default_code' => 'bb1', 'col' => 'right'],
        ['key' => 'home_top_banner', 'label' => 'Home — top banner', 'default_code' => 'bb2', 'col' => 'right'],
        ['key' => 'home_mpu_2', 'label' => 'Home — MPU 2', 'default_code' => 'bb3', 'col' => 'right'],
        ['key' => 'list_mid', 'label' => 'List — mid', 'default_code' => 'bb4', 'col' => 'right'],
        ['key' => 'game_mpu_left', 'label' => 'Game — MPU left', 'default_code' => 'bb5', 'col' => 'right'],
        ['key' => 'game_preplay', 'label' => 'Game — pre-play gateway', 'default_code' => 'bb6', 'col' => 'right'],
    ];

    private static function configPath(): string
    {
        return ADMIN_ROOT . '/data/admin-config.json';
    }

    public static function defaults(): array
    {
        $placements = [];
        foreach (self::PLACEMENTS as $item) {
            $placements[$item['key']] = [
                'enabled' => true,
                'code' => $item['default_code'],
            ];
        }

        return [
            'ads' => [
                'gam_network' => '/23355254298/',
                'refresh_sec' => '35',
                'amazon_pub_id' => '',
                'prebid_timeout' => '1500',
                'placements' => $placements,
                'prebid_bids' => '{"f3":[{"bidder":"appnexus","params":{"placementId":"123"}}]}',
                'ads_txt' => "# ads.txt - GamesCandy games network\ngoogle.com, pub-7348172902389178, DIRECT, f08c47fec0942fa0\n",
            ],
            'site' => [
                'site_name' => SITE_NAME,
                'site_url' => SITE_URL,
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
            ],
            'nav' => [
                'items' => [
                    ['label' => 'Home', 'url' => '/home', 'enabled' => true],
                    ['label' => 'All Games', 'url' => '/games', 'enabled' => true],
                    ['label' => 'Tournaments', 'url' => '/tournaments', 'enabled' => true],
                    ['label' => 'Action', 'url' => '/category/Action', 'enabled' => true],
                    ['label' => 'Arcade', 'url' => '/category/Arcade', 'enabled' => true],
                    ['label' => 'Casual', 'url' => '/category/Casual', 'enabled' => true],
                    ['label' => 'Puzzle', 'url' => '/category/Puzzle', 'enabled' => true],
                    ['label' => 'Quiz', 'url' => '/category/Quiz', 'enabled' => true],
                    ['label' => 'Sports', 'url' => '/category/Sports', 'enabled' => true],
                    ['label' => 'Board', 'url' => '/category/Board', 'enabled' => true],
                    ['label' => 'Match 3', 'url' => '/category/Match 3', 'enabled' => true],
                    ['label' => 'Card', 'url' => '/category/Card', 'enabled' => true],
                ],
            ],
            'code' => [
                'head_code' => '',
                'body_code' => '',
                'footer_code' => '',
                'custom_css' => '',
            ],
            'analytics' => [
                'tracking_code' => '',
                'ga4_id' => '',
                'google_ads_id' => '',
            ],
        ];
    }

    private const NAV_CATEGORIES = ['Action', 'Arcade', 'Casual', 'Puzzle', 'Quiz', 'Sports', 'Board', 'Match 3', 'Card'];

    public static function ensureNavItems(array $items): array
    {
        $list = $items;
        $urls = [];
        foreach ($list as $item) {
            $urls[trim((string) ($item['url'] ?? ''))] = true;
        }
        foreach (self::NAV_CATEGORIES as $category) {
            $url = '/category/' . $category;
            if (!isset($urls[$url])) {
                $list[] = ['label' => $category, 'url' => $url, 'enabled' => true];
            }
        }
        return $list;
    }

    public static function load(): array
    {
        $path = self::configPath();
        if (!is_file($path)) {
            return self::defaults();
        }

        $stored = json_decode(file_get_contents($path) ?: '{}', true);
        if (!is_array($stored)) {
            return self::defaults();
        }

        $config = array_replace_recursive(self::defaults(), $stored);
        $config['nav']['items'] = self::ensureNavItems($config['nav']['items'] ?? []);
        return $config;
    }

    public static function save(array $config): void
    {
        $dir = dirname(self::configPath());
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        file_put_contents(self::configPath(), json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    }

    public static function saveAds(array $post): void
    {
        $config = self::load();
        $config['ads']['gam_network'] = trim((string) ($post['gam_network'] ?? ''));
        $config['ads']['refresh_sec'] = trim((string) ($post['refresh_sec'] ?? '0'));
        $config['ads']['amazon_pub_id'] = trim((string) ($post['amazon_pub_id'] ?? ''));
        $config['ads']['prebid_timeout'] = trim((string) ($post['prebid_timeout'] ?? '1500'));
        $config['ads']['prebid_bids'] = (string) ($post['prebid_bids'] ?? '');

        $enabled = $post['placement_enabled'] ?? [];
        $codes = $post['placement_code'] ?? [];
        foreach (self::PLACEMENTS as $item) {
            $key = $item['key'];
            $config['ads']['placements'][$key]['enabled'] = isset($enabled[$key]);
            $config['ads']['placements'][$key]['code'] = trim((string) ($codes[$key] ?? $item['default_code']));
        }

        $config['site']['enable_ads'] = true;
        self::save($config);
        self::publishSite();
    }

    public static function saveAdsTxt(string $content): void
    {
        $config = self::load();
        $config['ads']['ads_txt'] = $content;
        self::save($config);
        self::publishSite();
    }

    public static function saveSite(array $post): void
    {
        $config = self::load();
        $textFields = [
            'site_name', 'site_url', 'tagline', 'meta_title', 'meta_description', 'meta_keywords',
            'primary_color', 'secondary_color', 'accent_color', 'button_color', 'button_hover_color',
            'link_color', 'background_color', 'text_color', 'theme_color',
            'logo_desktop', 'logo_mobile', 'favicon',
            'home_hero_title', 'footer_text', 'copyright_year',
        ];

        foreach ($textFields as $field) {
            $config['site'][$field] = trim((string) ($post[$field] ?? ''));
        }

        $config['site']['show_tournaments'] = isset($post['show_tournaments']);
        $config['site']['enable_ads'] = isset($post['enable_ads']);
        $config['site']['homepage_most_popular'] = isset($post['homepage_most_popular']);
        $config['site']['homepage_categories'] = isset($post['homepage_categories']);
        $config['site']['homepage_recent'] = isset($post['homepage_recent']);

        $creditLabels = $post['footer_credit_label'] ?? [];
        $creditUrls = $post['footer_credit_url'] ?? [];
        $footerCreditLinks = [];
        foreach ($creditLabels as $index => $label) {
            $label = trim((string) $label);
            $url = trim((string) ($creditUrls[$index] ?? ''));
            if ($label === '' && $url === '') {
                continue;
            }
            $footerCreditLinks[] = ['label' => $label, 'url' => $url];
        }
        $config['site']['footer_credit_links'] = $footerCreditLinks;

        self::save($config);
    }

    public static function saveNav(array $post): void
    {
        $config = self::load();
        $labels = $post['nav_label'] ?? [];
        $urls = $post['nav_url'] ?? [];
        $enabled = $post['nav_enabled'] ?? [];
        $items = [];

        foreach ($labels as $index => $label) {
            $label = trim((string) $label);
            $url = trim((string) ($urls[$index] ?? ''));
            if ($label === '' && $url === '') {
                continue;
            }
            $items[] = [
                'label' => $label,
                'url' => $url,
                'enabled' => isset($enabled[$index]),
            ];
        }

        $config['nav']['items'] = $items;
        self::save($config);
    }

    public static function saveCode(array $post): void
    {
        $config = self::load();
        foreach (['head_code', 'body_code', 'footer_code', 'custom_css'] as $field) {
            $config['code'][$field] = (string) ($post[$field] ?? '');
        }
        self::save($config);
    }

    public static function saveAnalyticsCodes(string $trackingCode, string $ga4Id = '', string $googleAdsId = ''): void
    {
        $config = self::load();
        $config['analytics']['tracking_code'] = trim($trackingCode);
        $config['analytics']['ga4_id'] = trim($ga4Id);
        $config['analytics']['google_ads_id'] = trim($googleAdsId);
        self::save($config);
    }

    public static function clearAnalyticsCodes(): void
    {
        self::saveAnalyticsCodes('', '', '');
    }

    public static function publishSite(): void
    {
        $config = self::load();
        $config['published_at'] = date('c');
        self::save($config);
        touch(self::configPath());
    }
}
