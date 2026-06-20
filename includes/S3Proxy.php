<?php

class S3Proxy
{
    public static function handleEmbed(string $requestUri, string $siteHost): void
    {
        $path = rawurldecode(parse_url($requestUri, PHP_URL_PATH) ?: '');
        $target = StripHtml::resolveEmbedTarget($path);

        if ($target === null) {
            http_response_code(404);
            echo 'Game asset not found';
            return;
        }

        $fallback = null;
        if (preg_match('#^/embed/n/#', $path)) {
            $fallback = StripHtml::resolveEmbedTarget(
                preg_replace('#^/embed/n/#', '/embed/g/', $path, 1) ?? $path
            );
        }

        self::fetchAndSend($target['bucket'], $target['path'], $requestUri, $siteHost, $fallback);
    }

    public static function handleLegacy(string $requestUri, string $siteHost): void
    {
        $path = rawurldecode(preg_replace('#^/s3-proxy/?#', '', parse_url($requestUri, PHP_URL_PATH) ?? ''));
        $slashIndex = strpos($path, '/');

        if ($slashIndex === false) {
            http_response_code(400);
            echo 'Invalid proxy path';
            return;
        }

        $bucketKey = substr($path, 0, $slashIndex);
        $s3Path = substr($path, $slashIndex + 1);

        if (!isset(S3_BUCKETS[$bucketKey]) || !$s3Path) {
            http_response_code(404);
            echo 'Unknown bucket';
            return;
        }

        self::fetchAndSend($bucketKey, $s3Path, $requestUri, $siteHost);
    }

    public static function gameAssetsJson(string $siteHost): void
    {
        header('Content-Type: application/json; charset=utf-8');
        header('Access-Control-Allow-Origin: *');
        echo json_encode([
            'status' => 200,
            'message' => 'Game assets base URL',
            'data' => [
                's3_bucket_url' => $siteHost . '/embed/g/',
            ],
        ], JSON_UNESCAPED_SLASHES);
    }

    private static function fetchAndSend(string $bucketKey, string $s3Path, string $requestUri, string $siteHost, ?array $fallback = null): void
    {
        $hostname = S3_BUCKETS[$bucketKey] ?? null;

        if (!$hostname) {
            http_response_code(404);
            echo 'Unknown bucket';
            return;
        }

        $query = parse_url($requestUri, PHP_URL_QUERY);
        $url = 'https://' . $hostname . '/' . $s3Path . ($query ? '?' . $query : '');
        $response = self::fetch($url, $_SERVER['HTTP_USER_AGENT'] ?? 'Mozilla/5.0');

        if ($response === null) {
            http_response_code(502);
            echo 'Failed to load game asset';
            return;
        }

        if ($response['status'] >= 400 && $fallback !== null) {
            self::fetchAndSend($fallback['bucket'], $fallback['path'], $requestUri, $siteHost);
            return;
        }

        $status = $response['status'];
        $body = $response['body'];
        $mimeType = self::getMimeType($s3Path, $response['content_type']);

        http_response_code($status);
        header('Content-Type: ' . $mimeType);
        header('Access-Control-Allow-Origin: *');

        if ($status >= 400) {
            echo $body;
            return;
        }

        if (str_contains($mimeType, 'text/html')) {
            echo StripHtml::rewriteGameHtml($body, $siteHost);
            return;
        }

        if (str_contains($mimeType, 'text/css')) {
            echo StripHtml::rewriteGameCss($body);
            return;
        }

        echo $body;
    }

    private static function getMimeType(string $s3Path, ?string $upstreamType): string
    {
        $lower = strtolower($s3Path);

        if (str_ends_with($lower, '.wasm.unityweb') || str_ends_with($lower, '.wasm')) {
            return 'application/wasm';
        }
        if (str_ends_with($lower, '.js.unityweb') || str_ends_with($lower, '.loader.js') || str_ends_with($lower, '.js')) {
            return 'application/javascript';
        }
        if (str_ends_with($lower, '.css')) {
            return 'text/css';
        }
        if (str_ends_with($lower, '.data.unityweb') || str_ends_with($lower, '.unityweb')) {
            return 'application/octet-stream';
        }

        return $upstreamType ?: 'application/octet-stream';
    }

    private static function fetch(string $url, string $userAgent): ?array
    {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTPHEADER => [
                'Referer: ' . S3_REFERER,
                'User-Agent: ' . $userAgent,
                'Accept: */*',
            ],
            CURLOPT_HEADER => true,
        ]);

        $raw = curl_exec($ch);

        if ($raw === false) {
            curl_close($ch);
            return null;
        }

        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        curl_close($ch);

        $headerText = substr($raw, 0, $headerSize);
        $body = substr($raw, $headerSize);
        $contentType = 'application/octet-stream';

        if (preg_match('/Content-Type:\s*([^\r\n;]+)/i', $headerText, $matches)) {
            $contentType = trim($matches[1]);
        }

        return [
            'status' => $status,
            'body' => $body,
            'content_type' => $contentType,
        ];
    }
}
