<?php

require_once __DIR__ . '/includes/bootstrap.php';

if (adminIsLoggedIn()) {
    header('Location: /admin/games.php');
    exit;
}

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $password = (string) ($_POST['password'] ?? '');
    if (adminAttemptLogin($password)) {
        header('Location: /admin/games.php');
        exit;
    }
    $error = 'Invalid password. Please try again.';
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="robots" content="noindex,nofollow">
    <title><?= htmlspecialchars(ADMIN_APP_NAME) ?></title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="/admin/assets/admin.css">
</head>
<body class="gc-admin-body bg-slate-100 text-slate-800 min-h-screen">
    <div class="gc-admin-login-wrap max-w-sm mx-auto mt-24 bg-white rounded-xl shadow p-8">
        <h1 class="text-xl font-bold mb-1">GamesCandy Admin</h1>
        <p class="text-sm text-slate-500 mb-6">Sign in to manage games.</p>
        <?php if ($error !== ''): ?>
            <div class="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4"><?= htmlspecialchars($error) ?></div>
        <?php endif; ?>
        <form method="post">
            <input type="hidden" name="action" value="login">
            <label class="block text-xs font-semibold mb-1">Password</label>
            <input type="password" name="password" autofocus class="w-full border rounded-lg px-3 py-2 mb-4" required>
            <button class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg py-2">Sign in</button>
        </form>
    </div>
</body>
</html>
