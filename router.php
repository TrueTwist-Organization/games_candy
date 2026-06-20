<?php
/**
 * Router script for PHP built-in server:
 * php -S localhost:8080 router.php
 */

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/';

if (str_starts_with($uri, '/admin')) {
    $adminFile = __DIR__ . $uri;
    if (is_file($adminFile)) {
        return false;
    }
    if (is_dir($adminFile) && is_file(rtrim($adminFile, '/') . '/index.php')) {
        return false;
    }
}

$publicFile = __DIR__ . '/public' . $uri;

if ($uri !== '/' && is_file($publicFile)) {
    return false;
}

$publicIndex = __DIR__ . '/public' . rtrim($uri, '/') . '/index.html';
if (is_file($publicIndex)) {
    return false;
}

if ($uri === '/') {
    readfile(__DIR__ . '/public/index.html');
    return true;
}

require __DIR__ . '/index.php';
