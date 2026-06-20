#!/usr/bin/env php
<?php
/**
 * Prepare a Hostinger-ready upload folder.
 * Usage: php scripts/prepare-hostinger.php [domain]
 */

$root = dirname(__DIR__);
$dist = $root . '/dist';
$domain = $argv[1] ?? 'https://yourdomain.com';

$copyItems = [
    'index.php',
    'router.php',
    '.htaccess',
    'config.php',
    'includes',
    'admin',
    'public',
];

if (is_dir($dist)) {
    passthru('rm -rf ' . escapeshellarg($dist));
}
mkdir($dist, 0755, true);

foreach ($copyItems as $item) {
    $source = $root . '/' . $item;
    $target = $dist . '/' . $item;
    if (is_dir($source)) {
        passthru('cp -R ' . escapeshellarg($source) . ' ' . escapeshellarg($target));
    } elseif (is_file($source)) {
        copy($source, $target);
    }
}

$configPath = $dist . '/config.php';
$config = file_get_contents($configPath);
$config = preg_replace(
    "/define\('SITE_URL', getenv\('SITE_URL'\) \?: '[^']*'\);/",
    "define('SITE_URL', getenv('SITE_URL') ?: '" . addslashes(rtrim($domain, '/')) . "');",
    $config
);
$config = str_replace(
    "define('COOKIE_DOMAIN', parse_url(SITE_URL, PHP_URL_HOST) ?: 'localhost');",
    "define('COOKIE_DOMAIN', '" . addslashes(parse_url($domain, PHP_URL_HOST) ?: 'localhost') . "');",
    $config
);
file_put_contents($configPath, $config);

echo "Hostinger package ready: {$dist}\n";
echo "Upload everything inside dist/ to public_html on Hostinger.\n";
echo "SITE_URL set to: {$domain}\n";
echo "\nWordPress tip: install WordPress in public_html/blog/ — games site stays at root.\n";
