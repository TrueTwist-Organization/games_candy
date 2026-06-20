<?php

class RemoteProxy
{
    public static function handle(string $method, string $targetPath, string $urlPath): void
    {
        $query = $_SERVER['QUERY_STRING'] ?? '';
        $url = REMOTE_URL . $targetPath . ($query !== '' ? '?' . $query : '');

        $headers = [
            'User-Agent: ' . ($_SERVER['HTTP_USER_AGENT'] ?? 'Mozilla/5.0'),
            'Accept: ' . ($_SERVER['HTTP_ACCEPT'] ?? '*/*'),
        ];

        if (!empty($_SERVER['HTTP_X_REQUESTED_WITH'])) {
            $headers[] = 'X-Requested-With: ' . $_SERVER['HTTP_X_REQUESTED_WITH'];
        }
        if (!empty($_SERVER['HTTP_X_CSRF_TOKEN'])) {
            $headers[] = 'X-CSRF-TOKEN: ' . $_SERVER['HTTP_X_CSRF_TOKEN'];
        }

        $body = null;
        if ($method !== 'GET' && $method !== 'HEAD') {
            $headers[] = 'Content-Type: application/json';
            $body = file_get_contents('php://input') ?: '{}';
        }

        $response = self::fetch($method, $url, $headers, $body);

        if ($response === null) {
            http_response_code(502);
            header('Content-Type: application/json');
            echo json_encode(['error' => 'Proxy error']);
            return;
        }

        http_response_code($response['status']);

        if (StripHtml::isHtmlResponse($response['content_type'])) {
            header('Content-Type: text/html; charset=utf-8');
            echo StripHtml::transformProxiedHtml($response['body'], $urlPath);
            return;
        }

        if ($response['content_type']) {
            header('Content-Type: ' . $response['content_type']);
        }

        echo $response['body'];
    }

    private static function fetch(string $method, string $url, array $headers, ?string $body): ?array
    {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_HEADER => true,
        ]);

        if ($body !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
        }

        $raw = curl_exec($ch);

        if ($raw === false) {
            curl_close($ch);
            return null;
        }

        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        curl_close($ch);

        $headerText = substr($raw, 0, $headerSize);
        $responseBody = substr($raw, $headerSize);
        $contentType = null;

        if (preg_match('/Content-Type:\s*([^\r\n;]+)/i', $headerText, $matches)) {
            $contentType = trim($matches[1]);
        }

        return [
            'status' => $status,
            'body' => $responseBody,
            'content_type' => $contentType,
        ];
    }
}
