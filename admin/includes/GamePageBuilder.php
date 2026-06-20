<?php

class GamePageBuilder
{
    public static function defaultDescription(string $title): string
    {
        return 'Enjoy ' . $title . ' online for free at GamesCandy. Dive into the action instantly, compete for high scores, and share the fun with friends. No downloads, just pure gaming excitement.';
    }

    public static function generateGameId(string $slug): string
    {
        $hash = md5('gc:' . $slug);
        return (string) (900000 + (hexdec(substr($hash, 0, 6)) % 99999));
    }

    public static function resolveEmbed(array $input): string
    {
        $raw = trim((string) ($input['gamemonetize_hash'] ?? $input['embed_folder'] ?? ''));
        $fullEmbed = trim((string) ($input['embed'] ?? ''));
        if ($fullEmbed !== '' && str_starts_with($fullEmbed, '/embed/')) {
            return $fullEmbed;
        }
        if ($raw !== '' && str_contains($raw, '/embed/')) {
            return str_starts_with($raw, '/') ? $raw : '/' . $raw;
        }
        if ($raw === '') {
            throw new InvalidArgumentException('GameMonetize hash or embed folder is required.');
        }
        if (preg_match('/^[A-Za-z0-9]{32}$/', $raw)) {
            return '/embed/g/' . $raw . '/index.html';
        }

        return '/embed/g/' . trim($raw, '/') . '/index.html';
    }

    /** @return array<string, mixed> */
    public static function normalizeGameData(array $game): array
    {
        $title = trim((string) ($game['title'] ?? ''));
        $slug = trim((string) ($game['slug'] ?? ''));
        $embed = self::resolveEmbed($game);
        $description = trim((string) ($game['description'] ?? ''));
        if ($description === '') {
            $description = self::defaultDescription($title);
        }
        $thumb = trim((string) ($game['thumb'] ?? ''));
        if ($thumb === '') {
            $thumb = '/images/logo.svg';
        }
        $landscape = trim((string) ($game['landscape_thumb'] ?? ''));
        if ($landscape === '') {
            $landscape = $thumb;
        }
        $portrait = trim((string) ($game['portrait_thumb'] ?? ''));
        if ($portrait === '') {
            $portrait = $thumb;
        }
        $gameId = trim((string) ($game['game_id'] ?? ''));
        if ($gameId === '') {
            $gameId = self::generateGameId($slug);
        }

        return [
            'slug' => $slug,
            'title' => $title,
            'embed' => $embed,
            'description' => $description,
            'thumb' => $thumb,
            'landscape' => $landscape,
            'portrait' => $portrait,
            'how_to_play' => trim((string) ($game['how_to_play'] ?? '')),
            'editors_review' => trim((string) ($game['editors_review'] ?? '')),
            'game_id' => $gameId,
        ];
    }

    public static function writeGamePages(array $game): array
    {
        $data = self::normalizeGameData($game);
        $playDir = PUBLIC_PATH . '/game/' . $data['slug'];
        $viewDir = PUBLIC_PATH . '/view-game/' . $data['slug'];
        if (!is_dir($playDir)) {
            mkdir($playDir, 0755, true);
        }
        if (!is_dir($viewDir)) {
            mkdir($viewDir, 0755, true);
        }
        file_put_contents($playDir . '/index.html', self::renderPlayPage($data));
        file_put_contents($viewDir . '/index.html', self::renderViewPage($data));

        return $data;
    }

    public static function isAdminGeneratedPage(string $slug): bool
    {
        foreach (['game', 'view-game'] as $base) {
            $filePath = PUBLIC_PATH . '/' . $base . '/' . $slug . '/index.html';
            if (!is_file($filePath)) {
                continue;
            }
            $html = file_get_contents($filePath) ?: '';
            if (str_contains($html, 'gc-admin-game')) {
                return true;
            }
        }

        return false;
    }

    public static function removeGamePages(string $slug): void
    {
        foreach (['game', 'view-game'] as $base) {
            $dir = PUBLIC_PATH . '/' . $base . '/' . $slug;
            if (!is_dir($dir)) {
                continue;
            }
            foreach (glob($dir . '/*') ?: [] as $file) {
                if (is_file($file)) {
                    unlink($file);
                }
            }
            rmdir($dir);
        }
    }

    private static function esc(string $value): string
    {
        return htmlspecialchars($value, ENT_QUOTES);
    }

    /** @param array<string, mixed> $data */
    public static function renderViewPage(array $data): string
    {
        $slugEnc = rawurlencode((string) $data['slug']);
        $info = '';
        if ($data['how_to_play'] !== '') {
            $info .= '<div class="my-5 bg-white rounded-[30px] p-6"><h2 class="font-bold text-xl mb-3 uppercase">How to Play</h2><div class="text-sm text-slate-700 whitespace-pre-line">' . self::esc((string) $data['how_to_play']) . '</div></div>';
        }
        if ($data['editors_review'] !== '') {
            $info .= '<div class="my-5 bg-white rounded-[30px] p-6"><h2 class="font-bold text-xl mb-3 uppercase">Editor\'s Review</h2><div class="text-sm text-slate-700 whitespace-pre-line">' . self::esc((string) $data['editors_review']) . '</div></div>';
        }
        if ($data['description'] !== '') {
            $info .= '<div class="my-5 bg-white rounded-[30px] p-6"><h2 class="font-bold text-xl mb-3 uppercase">About ' . self::esc((string) $data['title']) . '</h2><div class="text-sm text-slate-700 whitespace-pre-line">' . self::esc((string) $data['description']) . '</div></div>';
        }

        return '<html lang="en"><head><title>' . self::esc((string) $data['title']) . ' - Play online games for Free | GamesCandy</title><meta name="description" content="' . self::esc((string) $data['description']) . '" /><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1" /><link rel="stylesheet" type="text/css" href="/css/style.css"><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" /><script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.0/jquery.min.js"></script></head><body class="google-anno-skip main-container"><!-- gc-admin-game --><div class="md:w-[80%] lg:w-[64%] w-full overflow-x-hidden mx-auto"><header><script src="/js/navbar.js" async></script><nav class="bg-white border-gray-200 rounded-br-[30px] rounded-bl-[30px]"><div class="flex flex-col 2xl:flex-row justify-around items-center 2xl:h-[96px] w-full px-2 py-4"><div class="flex justify-between w-full 2xl:w-auto"><a href="/home" class="lg:block hidden"><img src="/images/logo.svg" class="h-[60px]" alt="GamesCandy Logo" /></a></div><div class="flex items-center justify-center 2xl:justify-start font-medium text-sm lg:text-lg color-[#000] capitalize whitespace-nowrap"><a href="/home" class="border-b-4 border-white mx-1">Home</a><a href="/games" class="border-b-4 border-white mx-1">All Games</a></div></div></nav></header><div class="my-5 game-banner-container bg-white py-8 px-4 md:py-12 md:px-16 grid justify-center rounded-[30px]"><div class="flex flex-col justify-center items-center gap-4"><a href="/game/' . $slugEnc . '"><img src="' . self::esc((string) $data['landscape']) . '" alt="' . self::esc((string) $data['title']) . '" class="w-full max-w-96 object-cover aspect-video rounded-2xl"></a><h1 class="font-bold text-3xl uppercase">' . self::esc((string) $data['title']) . '</h1><a href="/game/' . $slugEnc . '" class="animatedPlayBtn uppercase bg-light-theme-color font-semibold text-white text-xl rounded-full w-48 p-3 text-center">Play <i class="fa-regular fa-circle-play"></i></a></div></div>' . $info . '<footer class="rounded-tl-[30px] rounded-tr-[30px] footer-bg mt-4"><div class="w-full p-3 flex items-center justify-between"><div class="text-sm text-theme-color">Copyright @ 2026 GamesCandy</div><div class="lg:block hidden text-center"></div><div class="text-right"><a href="/privacy-policy" class="text-theme-color">Privacy Policy</a></div></div></footer></div></body></html>';
    }

    /** @param array<string, mixed> $data */
    public static function renderPlayPage(array $data): string
    {
        $slugEnc = rawurlencode((string) $data['slug']);
        $embed = json_encode((string) $data['embed'], JSON_UNESCAPED_SLASHES);
        $gameId = json_encode((string) $data['game_id'], JSON_UNESCAPED_SLASHES);

        return '<html lang="en"><head><title>' . self::esc((string) $data['title']) . ' - Play online games for Free | GamesCandy</title><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1" /><link rel="stylesheet" type="text/css" href="/css/style.css"><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" /><script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.0/jquery.min.js"></script></head><body class="overflow-y-hidden google-anno-skip game-play-page"><!-- gc-admin-game --><div class="w-full h-[100dvh] relative main-container"><header><nav class="bg-theme-color"><div class="h-[40px] content-center"><ul class="font-medium flex justify-between self-center w-full"><li class="mx-3 px-2"><a href="/home"><i class="fa-solid fa-house" style="font-size:20px;color:white;"></i></a></li><li class="mx-1 px-2 truncate text-white">' . self::esc((string) $data['title']) . '</li></ul></div></nav></header><div id="game-content-main" class="bg-white h-[calc(100dvh-40px)]"><div id="game-content" class="overflow-hidden w-full h-[100%]"></div></div><script>game_url=' . $embed . ';var game_id=' . $gameId . ';$(function(){ $("#game-content").load(game_url,function(r,s){ if(s==="error"){ $("#game-content").html("<p style=\\"color:#fff;text-align:center;padding:2rem;\\">Game failed to load.</p>"); }}); });</script></div></body></html>';
    }
}
