<?php

class AuthPages
{
    private static function esc(string $value): string
    {
        return htmlspecialchars($value, ENT_QUOTES);
    }

    /** @param array<string, mixed> $options */
    public static function renderAuthShell(array $options): string
    {
        $mode = ($options['mode'] ?? 'login') === 'register' ? 'register' : 'login';
        $isRegister = $mode === 'register';
        $values = is_array($options['values'] ?? null) ? $options['values'] : [];
        $error = trim((string) ($options['error'] ?? ''));
        $success = trim((string) ($options['success'] ?? ''));
        $name = self::esc((string) ($values['name'] ?? ''));
        $email = self::esc((string) ($values['email'] ?? ''));
        $redirect = self::esc((string) ($values['redirect'] ?? '/home'));

        $message = $error !== ''
            ? '<div class="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3">' . self::esc($error) . '</div>'
            : ($success !== ''
                ? '<div class="mb-4 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-3">' . self::esc($success) . '</div>'
                : '');

        $loginActive = $isRegister ? 'text-slate-500 hover:text-slate-800' : 'text-white bg-light-theme-color shadow';
        $registerActive = $isRegister ? 'text-white bg-light-theme-color shadow' : 'text-slate-500 hover:text-slate-800';
        $signInPanel = $isRegister ? 'hidden' : 'block';
        $registerPanel = $isRegister ? 'block' : 'hidden';

        return <<<HTML
<h1 class="sr-only">{$mode} | GamesCandy</h1>
<div class="my-5">
  <div class="bg-white border-gray-200 rounded-[30px] bg-cover bg-no-repeat game-banner-container mx-0 p-4 md:p-8">
    <div class="max-w-md mx-auto py-6">
      <h2 class="text-center text-2xl font-semibold text-[#1F1147] mb-2">{$mode}</h2>
      <p class="text-center text-sm text-slate-500 mb-6">Sign in to save progress, join tournaments, and track your stats.</p>
      {$message}
      <div class="grid grid-cols-2 gap-2 mb-6 p-1 bg-slate-100 rounded-full">
        <a href="/login" class="text-center py-2.5 rounded-full text-sm font-semibold transition {$loginActive}">Sign In</a>
        <a href="/register" class="text-center py-2.5 rounded-full text-sm font-semibold transition {$registerActive}">Create Account</a>
      </div>
      <div id="gc-auth-signin" class="{$signInPanel}">
        <form method="post" action="/api/auth/login" class="space-y-4">
          <input type="hidden" name="redirect" value="{$redirect}">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1" for="login-email">Email</label>
            <input id="login-email" name="email" type="email" required autocomplete="email" value="{$email}" class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-theme-color" placeholder="you@example.com">
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1" for="login-password">Password</label>
            <input id="login-password" name="password" type="password" required autocomplete="current-password" minlength="6" class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-theme-color" placeholder="Enter your password">
          </div>
          <button type="submit" class="w-full animatedPlayBtn font-semibold text-white rounded-full py-3 text-base">Sign In</button>
        </form>
        <p class="text-center text-sm text-slate-500 mt-4">Don't have an account? <a href="/register" class="text-theme-color font-semibold hover:underline">Create Account</a></p>
      </div>
      <div id="gc-auth-register" class="{$registerPanel}">
        <form method="post" action="/api/auth/register" class="space-y-4">
          <input type="hidden" name="redirect" value="{$redirect}">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1" for="register-name">Full name</label>
            <input id="register-name" name="name" type="text" required autocomplete="name" value="{$name}" class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-theme-color" placeholder="Your name">
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1" for="register-email">Email</label>
            <input id="register-email" name="email" type="email" required autocomplete="email" value="{$email}" class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-theme-color" placeholder="you@example.com">
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1" for="register-password">Password</label>
            <input id="register-password" name="password" type="password" required autocomplete="new-password" minlength="6" class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-theme-color" placeholder="At least 6 characters">
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1" for="register-password-confirm">Confirm password</label>
            <input id="register-password-confirm" name="password_confirm" type="password" required autocomplete="new-password" minlength="6" class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-theme-color" placeholder="Repeat your password">
          </div>
          <button type="submit" class="w-full animatedPlayBtn font-semibold text-white rounded-full py-3 text-base">Create Account</button>
        </form>
        <p class="text-center text-sm text-slate-500 mt-4">Already have an account? <a href="/login" class="text-theme-color font-semibold hover:underline">Sign In</a></p>
      </div>
    </div>
  </div>
</div>
HTML;
    }

    /** @param array<string, mixed> $options */
    public static function renderAuthPage(array $options): string
    {
        $template = (string) file_get_contents(PUBLIC_PATH . '/login/index.html');
        $content = self::renderAuthShell($options);
        $html = preg_replace(
            '/<h1 class="sr-only">[\s\S]*?<footer class="/',
            $content . "\n            <footer class=\"",
            $template,
            1
        ) ?? $template;
        $title = (($options['mode'] ?? 'login') === 'register') ? 'Create Account | GamesCandy' : 'Sign In | GamesCandy';
        $html = preg_replace('/<title>[\s\S]*?<\/title>/i', '<title>' . self::esc($title) . '</title>', $html) ?? $html;
        return $html;
    }
}
