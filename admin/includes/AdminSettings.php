<?php

class AdminSettings
{
    private const SETTINGS_FILE = ADMIN_ROOT . '/data/admin-settings.json';

    public static function load(): array
    {
        if (!is_file(self::SETTINGS_FILE)) {
            return [];
        }
        $data = json_decode((string) file_get_contents(self::SETTINGS_FILE), true);
        return is_array($data) ? $data : [];
    }

    public static function save(array $settings): void
    {
        $dir = dirname(self::SETTINGS_FILE);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        file_put_contents(self::SETTINGS_FILE, json_encode($settings, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    }

    public static function hashPassword(string $password): string
    {
        $salt = bin2hex(random_bytes(16));
        $hash = hash_pbkdf2('sha256', $password, $salt, 120000, 64, false);
        return $salt . ':' . $hash;
    }

    public static function verifyHash(string $password, string $stored): bool
    {
        $parts = explode(':', $stored, 2);
        if (count($parts) !== 2) {
            return false;
        }
        [$salt, $hash] = $parts;
        $check = hash_pbkdf2('sha256', $password, $salt, 120000, 64, false);
        return hash_equals($hash, $check);
    }

    public static function verifyPassword(string $password): bool
    {
        $settings = self::load();
        if (!empty($settings['password_hash'])) {
            return self::verifyHash($password, (string) $settings['password_hash']);
        }
        return hash_equals(ADMIN_PASSWORD, $password);
    }

    public static function changePassword(string $current, string $next, string $confirm): void
    {
        if (!self::verifyPassword($current)) {
            throw new InvalidArgumentException('Current password is incorrect.');
        }
        if (strlen($next) < 6) {
            throw new InvalidArgumentException('New password must be at least 6 characters.');
        }
        if ($next !== $confirm) {
            throw new InvalidArgumentException('New password and confirmation do not match.');
        }
        $settings = self::load();
        $settings['password_hash'] = self::hashPassword($next);
        $settings['password_updated_at'] = gmdate('Y-m-d H:i:s');
        self::save($settings);
    }

    public static function readJson(string $path, $fallback)
    {
        if (!is_file($path)) {
            return $fallback;
        }
        $data = json_decode((string) file_get_contents($path), true);
        return $data ?? $fallback;
    }

    public static function buildBackupPayload(): array
    {
        return [
            'exported_at' => gmdate('c'),
            'site' => 'GamesCandy',
            'admin_config' => AdminConfig::load(),
            'custom_games' => self::readJson(ADMIN_ROOT . '/data/custom-games.json', []),
            'hidden_games' => self::readJson(ADMIN_ROOT . '/data/hidden-games.json', []),
            'users' => self::readJson(ADMIN_ROOT . '/data/users.json', []),
            'analytics_events' => self::readJson(ADMIN_ROOT . '/data/analytics-events.json', []),
            'admin_settings' => self::load(),
        ];
    }
}
