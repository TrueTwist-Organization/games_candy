<?php

class UserAuth
{
    private const SESSION_COOKIE = 'gc_user_session';
    private const SESSION_MAX_AGE = 2592000;

    private static function usersPath(): string
    {
        return dirname(__DIR__) . '/admin/data/users.json';
    }

    private static function sessionSecret(): string
    {
        return getenv('USER_SESSION_SECRET') ?: 'gamescandy-user-session-secret';
    }

    /** @return array{users: array<int, array<string, mixed>>} */
    private static function loadStore(): array
    {
        $path = self::usersPath();
        if (!is_file($path)) {
            return ['users' => []];
        }
        $data = json_decode((string) file_get_contents($path), true);
        return ['users' => is_array($data['users'] ?? null) ? $data['users'] : []];
    }

    /** @param array{users: array<int, array<string, mixed>>} $store */
    private static function saveStore(array $store): void
    {
        $path = self::usersPath();
        $dir = dirname($path);
        if (!is_dir($dir)) {
            mkdir($dir, 0775, true);
        }
        file_put_contents($path, json_encode($store, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    }

    public static function normalizeEmail(string $email): string
    {
        return strtolower(trim($email));
    }

    /** @return array{salt:string,hash:string} */
    private static function createPasswordRecord(string $password): array
    {
        $salt = bin2hex(random_bytes(16));
        $hash = hash_pbkdf2('sha256', $password, $salt, 100000, 64, false);
        return ['salt' => $salt, 'hash' => $hash];
    }

    /** @param array<string, mixed> $record */
    private static function verifyPassword(string $password, array $record): bool
    {
        if (empty($record['salt']) || empty($record['hash'])) {
            return false;
        }
        $hash = hash_pbkdf2('sha256', $password, (string) $record['salt'], 100000, 64, false);
        return hash_equals((string) $record['hash'], $hash);
    }

    private static function signSession(string $userId): string
    {
        $expires = (string) (time() + self::SESSION_MAX_AGE);
        $payload = $userId . '.' . $expires;
        $sig = hash_hmac('sha256', $payload, self::sessionSecret());
        return $payload . '.' . $sig;
    }

    private static function verifySessionToken(string $token): ?string
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }
        [$userId, $expiresRaw, $sig] = $parts;
        $expires = (int) $expiresRaw;
        if ($userId === '' || $expires < time()) {
            return null;
        }
        $payload = $userId . '.' . $expiresRaw;
        $expected = hash_hmac('sha256', $payload, self::sessionSecret());
        if (!hash_equals($expected, $sig)) {
            return null;
        }
        return $userId;
    }

    /** @return array<string, mixed>|null */
    private static function findUserByEmail(string $email): ?array
    {
        $normalized = self::normalizeEmail($email);
        foreach (self::loadStore()['users'] as $user) {
            if (($user['email'] ?? '') === $normalized) {
                return $user;
            }
        }
        return null;
    }

    /** @return array<string, mixed>|null */
    private static function findUserById(string $id): ?array
    {
        foreach (self::loadStore()['users'] as $user) {
            if (($user['id'] ?? '') === $id) {
                return $user;
            }
        }
        return null;
    }

    /** @param array<string, mixed>|null $user */
    public static function publicUser(?array $user): ?array
    {
        if ($user === null) {
            return null;
        }
        return [
            'id' => $user['id'] ?? '',
            'name' => $user['name'] ?? '',
            'email' => $user['email'] ?? '',
        ];
    }

    /** @param array{name?:string,email?:string,password?:string} $input */
    public static function registerUser(array $input): array
    {
        $name = trim((string) ($input['name'] ?? ''));
        $email = self::normalizeEmail((string) ($input['email'] ?? ''));
        $password = (string) ($input['password'] ?? '');

        if (strlen($name) < 2) {
            return ['ok' => false, 'error' => 'Please enter your name (at least 2 characters).'];
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return ['ok' => false, 'error' => 'Please enter a valid email address.'];
        }
        if (strlen($password) < 6) {
            return ['ok' => false, 'error' => 'Password must be at least 6 characters.'];
        }
        if (self::findUserByEmail($email) !== null) {
            return ['ok' => false, 'error' => 'An account with this email already exists.'];
        }

        $passwordRecord = self::createPasswordRecord($password);
        $user = [
            'id' => bin2hex(random_bytes(16)),
            'name' => $name,
            'email' => $email,
            'salt' => $passwordRecord['salt'],
            'hash' => $passwordRecord['hash'],
            'createdAt' => gmdate('c'),
        ];

        $store = self::loadStore();
        $store['users'][] = $user;
        self::saveStore($store);

        return ['ok' => true, 'user' => self::publicUser($user)];
    }

    /** @param array{email?:string,password?:string} $input */
    public static function loginUser(array $input): array
    {
        $user = self::findUserByEmail((string) ($input['email'] ?? ''));
        if ($user === null || !self::verifyPassword((string) ($input['password'] ?? ''), $user)) {
            return ['ok' => false, 'error' => 'Incorrect email or password.'];
        }
        return ['ok' => true, 'user' => self::publicUser($user)];
    }

    public static function setSessionCookie(string $userId): void
    {
        $token = self::signSession($userId);
        setcookie(self::SESSION_COOKIE, $token, [
            'expires' => time() + self::SESSION_MAX_AGE,
            'path' => '/',
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
    }

    public static function clearSessionCookie(): void
    {
        setcookie(self::SESSION_COOKIE, '', [
            'expires' => time() - 3600,
            'path' => '/',
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
    }

    public static function getUserFromRequest(): ?array
    {
        $token = $_COOKIE[self::SESSION_COOKIE] ?? '';
        $userId = self::verifySessionToken((string) $token);
        if ($userId === null) {
            return null;
        }
        return self::publicUser(self::findUserById($userId));
    }
}
