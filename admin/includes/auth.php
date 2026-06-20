<?php

function adminStartSession(): void
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }
}

function adminIsLoggedIn(): bool
{
    adminStartSession();
    return !empty($_SESSION[ADMIN_SESSION_KEY]);
}

function adminRequireLogin(): void
{
    if (!adminIsLoggedIn()) {
        header('Location: /admin/index.php');
        exit;
    }
}

function adminAttemptLogin(string $password): bool
{
    adminStartSession();
    if (!AdminSettings::verifyPassword($password)) {
        return false;
    }
    $_SESSION[ADMIN_SESSION_KEY] = true;
    return true;
}

function adminLogout(): void
{
    adminStartSession();
    unset($_SESSION[ADMIN_SESSION_KEY]);
}

function adminSiteUrl(string $path = '/'): string
{
    return rtrim(SITE_URL, '/') . $path;
}

function adminFormatDuration(int $ms): string
{
    $seconds = max(0, (int) round($ms / 1000));
    $minutes = intdiv($seconds, 60);
    $seconds %= 60;
    if ($minutes >= 60) {
        $hours = intdiv($minutes, 60);
        $minutes %= 60;
        return sprintf('%dh %dm', $hours, $minutes);
    }
    return sprintf('%dm %ds', $minutes, $seconds);
}

function adminFormatNumber(int $value): string
{
    return number_format($value);
}
