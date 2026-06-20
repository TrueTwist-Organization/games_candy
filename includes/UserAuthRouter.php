<?php

require_once __DIR__ . '/UserAuth.php';
require_once __DIR__ . '/AuthPages.php';
require_once __DIR__ . '/SiteTheme.php';

class UserAuthRouter
{
    private static function safeRedirect(string $value): string
    {
        $target = trim($value);
        if ($target === '' || !str_starts_with($target, '/') || str_starts_with($target, '//')) {
            return '/home';
        }
        return $target;
    }

    private static function wantsJson(): bool
    {
        $accept = $_SERVER['HTTP_ACCEPT'] ?? '';
        return str_contains($accept, 'application/json')
            || (($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') === 'XMLHttpRequest');
    }

    public static function handle(string $path, string $method): bool
    {
        if ($path === '/js/auth.js') {
            header('Content-Type: application/javascript; charset=utf-8');
            header('Cache-Control: no-cache');
            require_once __DIR__ . '/SiteAuth.php';
            echo SiteAuth::buildAuthJs();
            return true;
        }

        if ($path === '/api/auth/me' && $method === 'GET') {
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['success' => 1, 'user' => UserAuth::getUserFromRequest()], JSON_UNESCAPED_SLASHES);
            return true;
        }

        if ($path === '/logout' && $method === 'GET') {
            UserAuth::clearSessionCookie();
            header('Location: /home?signed_out=1');
            return true;
        }

        if ($path === '/login' && $method === 'GET') {
            if (UserAuth::getUserFromRequest() !== null) {
                header('Location: ' . self::safeRedirect((string) ($_GET['redirect'] ?? '/home')));
                return true;
            }
            self::sendAuthPage([
                'mode' => 'login',
                'error' => (string) ($_GET['error'] ?? ''),
                'success' => (string) ($_GET['success'] ?? ''),
                'values' => [
                    'email' => (string) ($_GET['email'] ?? ''),
                    'redirect' => self::safeRedirect((string) ($_GET['redirect'] ?? '/home')),
                ],
            ]);
            return true;
        }

        if ($path === '/register' && $method === 'GET') {
            if (UserAuth::getUserFromRequest() !== null) {
                header('Location: ' . self::safeRedirect((string) ($_GET['redirect'] ?? '/home')));
                return true;
            }
            self::sendAuthPage([
                'mode' => 'register',
                'error' => (string) ($_GET['error'] ?? ''),
                'values' => [
                    'name' => (string) ($_GET['name'] ?? ''),
                    'email' => (string) ($_GET['email'] ?? ''),
                    'redirect' => self::safeRedirect((string) ($_GET['redirect'] ?? '/home')),
                ],
            ]);
            return true;
        }

        if ($path === '/api/auth/login' && $method === 'POST') {
            self::handleLogin($_POST);
            return true;
        }

        if ($path === '/api/auth/register' && $method === 'POST') {
            self::handleRegister($_POST);
            return true;
        }

        if ($path === '/api/auth/logout' && $method === 'POST') {
            UserAuth::clearSessionCookie();
            if (self::wantsJson()) {
                header('Content-Type: application/json; charset=utf-8');
                echo json_encode(['success' => 1]);
                return true;
            }
            header('Location: /home');
            return true;
        }

        return false;
    }

    /** @param array<string, mixed> $options */
    private static function sendAuthPage(array $options): void
    {
        $config = SiteTheme::loadFullConfig();
        $html = SiteTheme::applyAdminConfigToHtml(AuthPages::renderAuthPage($options), $config);
        header('Content-Type: text/html; charset=utf-8');
        header('Cache-Control: no-cache');
        echo $html;
    }

    /** @param array<string, mixed> $body */
    private static function handleLogin(array $body): void
    {
        $redirect = self::safeRedirect((string) ($body['redirect'] ?? '/home'));
        $result = UserAuth::loginUser([
            'email' => (string) ($body['email'] ?? ''),
            'password' => (string) ($body['password'] ?? ''),
        ]);

        if (!$result['ok']) {
            if (self::wantsJson()) {
                http_response_code(401);
                header('Content-Type: application/json; charset=utf-8');
                echo json_encode(['success' => 0, 'error' => $result['error']], JSON_UNESCAPED_SLASHES);
                return;
            }
            header('Location: /login?error=' . urlencode((string) $result['error']) . '&email=' . urlencode((string) ($body['email'] ?? '')) . '&redirect=' . urlencode($redirect));
            return;
        }

        UserAuth::setSessionCookie((string) ($result['user']['id'] ?? ''));
        if (self::wantsJson()) {
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['success' => 1, 'user' => $result['user']], JSON_UNESCAPED_SLASHES);
            return;
        }
        header('Location: ' . $redirect);
    }

    /** @param array<string, mixed> $body */
    private static function handleRegister(array $body): void
    {
        $redirect = self::safeRedirect((string) ($body['redirect'] ?? '/home'));
        $password = (string) ($body['password'] ?? '');
        $passwordConfirm = (string) ($body['password_confirm'] ?? '');

        if ($password !== $passwordConfirm) {
            if (self::wantsJson()) {
                http_response_code(400);
                header('Content-Type: application/json; charset=utf-8');
                echo json_encode(['success' => 0, 'error' => 'Passwords do not match.'], JSON_UNESCAPED_SLASHES);
                return;
            }
            header('Location: /register?error=' . urlencode('Passwords do not match.') . '&name=' . urlencode((string) ($body['name'] ?? '')) . '&email=' . urlencode((string) ($body['email'] ?? '')) . '&redirect=' . urlencode($redirect));
            return;
        }

        $result = UserAuth::registerUser([
            'name' => (string) ($body['name'] ?? ''),
            'email' => (string) ($body['email'] ?? ''),
            'password' => $password,
        ]);

        if (!$result['ok']) {
            if (self::wantsJson()) {
                http_response_code(400);
                header('Content-Type: application/json; charset=utf-8');
                echo json_encode(['success' => 0, 'error' => $result['error']], JSON_UNESCAPED_SLASHES);
                return;
            }
            header('Location: /register?error=' . urlencode((string) $result['error']) . '&name=' . urlencode((string) ($body['name'] ?? '')) . '&email=' . urlencode((string) ($body['email'] ?? '')) . '&redirect=' . urlencode($redirect));
            return;
        }

        if (self::wantsJson()) {
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['success' => 1, 'user' => $result['user']], JSON_UNESCAPED_SLASHES);
            return;
        }
        header(
            'Location: /login?success=' . urlencode('Account created successfully. Please sign in.')
            . '&email=' . urlencode((string) ($body['email'] ?? ''))
            . '&redirect=' . urlencode($redirect)
        );
    }
}
