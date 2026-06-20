<?php

class Router
{
    private string $requestUri;
    private string $requestPath;
    private string $method;
    private string $siteHost;

    public function __construct()
    {
        $this->requestUri = $_SERVER['REQUEST_URI'] ?? '/';
        $this->requestPath = parse_url($this->requestUri, PHP_URL_PATH) ?: '/';
        $this->method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        $this->siteHost = rtrim(SITE_URL, '/');
    }

    public function dispatch(): void
    {
        if ($this->requestPath === '/api/game-assets' || $this->requestPath === '/aws-s3-url') {
            S3Proxy::gameAssetsJson($this->siteHost);
            return;
        }

        if (str_starts_with($this->requestPath, '/embed/')) {
            $localCandidates = array_unique([
                rawurldecode($this->requestPath),
                $this->requestPath,
            ]);
            foreach ($localCandidates as $candidate) {
                $localFile = PUBLIC_PATH . $candidate;
                if (is_file($localFile)) {
                    $this->serveEmbedFile($localFile);
                    return;
                }
            }
            S3Proxy::handleEmbed($this->requestUri, $this->siteHost);
            return;
        }

        if (str_starts_with($this->requestPath, '/s3-proxy/')) {
            S3Proxy::handleLegacy($this->requestUri, $this->siteHost);
            return;
        }

        foreach (API_ROUTES as $route) {
            if ($this->requestPath === $route) {
                LocalApi::handle($this->requestPath);
                return;
            }
        }

        if ($this->requestPath === '/site-theme.css') {
            header('Content-Type: text/css; charset=utf-8');
            header('Cache-Control: no-cache');
            echo SiteTheme::buildThemeCss(SiteTheme::loadSiteConfig());
            return;
        }

        if ($this->requestPath === '/api/custom-games.json') {
            header('Content-Type: application/json; charset=utf-8');
            header('Cache-Control: no-cache');
            require_once dirname(__DIR__) . '/admin/includes/GamesStore.php';
            echo json_encode(['success' => 1, 'games' => GamesStore::listCustomGamesForSite()], JSON_UNESCAPED_SLASHES);
            return;
        }

        if ($this->requestPath === '/js/ads.js') {
            header('Content-Type: application/javascript; charset=utf-8');
            header('Cache-Control: no-cache');
            echo SiteAds::buildAdsJs();
            return;
        }

        if ($this->requestPath === '/ads.txt') {
            $config = SiteTheme::loadFullConfig();
            header('Content-Type: text/plain; charset=utf-8');
            header('Cache-Control: no-cache');
            echo SiteAds::getAdsTxt($config['ads'] ?? []);
            return;
        }

        require_once __DIR__ . '/UserAuthRouter.php';
        if (UserAuthRouter::handle($this->requestPath, $this->method)) {
            return;
        }

        if ($this->requestPath === '/home' || $this->requestPath === '/home/') {
            $shouldProxy = isset($_GET['offset']) || !empty($_SERVER['HTTP_X_REQUESTED_WITH']);
            if (!$shouldProxy) {
                $local = $this->resolveHtmlRoute('/home');
                if ($local !== null) {
                    $this->serveFile($local);
                    return;
                }
            }
            RemoteProxy::handle('GET', '/home', $this->requestPath);
            return;
        }

        $staticFile = PUBLIC_PATH . $this->requestPath;
        if (is_file($staticFile)) {
            $this->serveFile($staticFile);
            return;
        }

        $htmlFile = $this->resolveHtmlRoute($this->requestPath);
        if ($htmlFile !== null) {
            $this->serveFile($htmlFile);
            return;
        }

        RemoteProxy::handle($this->method, $this->requestPath, $this->requestPath);
    }

    private function resolveHtmlRoute(string $urlPath): ?string
    {
        if ($urlPath === '/' || $urlPath === '') {
            $file = PUBLIC_PATH . '/index.html';
            return is_file($file) ? $file : null;
        }

        $clean = rtrim($urlPath, '/');
        $candidates = [
            PUBLIC_PATH . $clean . '/index.html',
            PUBLIC_PATH . $clean . '.html',
            PUBLIC_PATH . $clean,
        ];

        foreach ($candidates as $candidate) {
            if (is_file($candidate)) {
                return $candidate;
            }
        }

        return null;
    }

    private function serveFile(string $filePath): void
    {
        $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        $mimeTypes = [
            'html' => 'text/html; charset=utf-8',
            'css' => 'text/css; charset=utf-8',
            'js' => 'application/javascript; charset=utf-8',
            'json' => 'application/json; charset=utf-8',
            'svg' => 'image/svg+xml',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'webp' => 'image/webp',
            'gif' => 'image/gif',
            'ico' => 'image/x-icon',
            'woff' => 'font/woff',
            'woff2' => 'font/woff2',
            'webmanifest' => 'application/manifest+json',
        ];

        if (isset($mimeTypes[$ext])) {
            header('Content-Type: ' . $mimeTypes[$ext]);
        }

        if ($ext === 'html') {
            $config = SiteTheme::loadFullConfig();
            $site = array_replace_recursive(SiteTheme::defaults(), $config['site'] ?? []);
            $html = StripHtml::sanitizePublicHtml(file_get_contents($filePath) ?: '');
            echo SiteTheme::applyAdminConfigToHtml($html, $config);
            return;
        }

        readfile($filePath);
    }

    private function serveEmbedFile(string $filePath): void
    {
        $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        $mimeTypes = [
            'html' => 'text/html; charset=utf-8',
            'css' => 'text/css; charset=utf-8',
            'js' => 'application/javascript; charset=utf-8',
            'json' => 'application/json; charset=utf-8',
            'wasm' => 'application/wasm',
            'unityweb' => 'application/octet-stream',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'webp' => 'image/webp',
            'gif' => 'image/gif',
            'ico' => 'image/x-icon',
            'svg' => 'image/svg+xml',
        ];

        if (str_ends_with(strtolower($filePath), '.wasm.unityweb')) {
            header('Content-Type: application/wasm');
        } elseif (str_ends_with(strtolower($filePath), '.js.unityweb')) {
            header('Content-Type: application/javascript; charset=utf-8');
        } elseif (str_ends_with(strtolower($filePath), '.data.unityweb')) {
            header('Content-Type: application/octet-stream');
        } elseif (isset($mimeTypes[$ext])) {
            header('Content-Type: ' . $mimeTypes[$ext]);
        }

        header('Access-Control-Allow-Origin: *');

        if ($ext === 'html') {
            echo StripHtml::rewriteGameHtml(file_get_contents($filePath) ?: '', $this->siteHost);
            return;
        }

        if ($ext === 'css') {
            echo StripHtml::rewriteGameCss(file_get_contents($filePath) ?: '');
            return;
        }

        readfile($filePath);
    }
}
