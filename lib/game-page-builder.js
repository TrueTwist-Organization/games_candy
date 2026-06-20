const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PUBLIC = path.join(__dirname, "../public");

function esc(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function defaultDescription(title) {
  return `Enjoy ${title} online for free at GamesCandy. Dive into the action instantly, compete for high scores, and share the fun with friends. No downloads, just pure gaming excitement.`;
}

function generateGameId(slug) {
  const hash = crypto.createHash("md5").update(`gc:${slug}`).digest("hex");
  return String(900000 + (parseInt(hash.slice(0, 6), 16) % 99999));
}

function resolveEmbed(input) {
  const raw = String(input.gamemonetize_hash || input.embed_folder || "").trim();
  const fullEmbed = String(input.embed || "").trim();
  if (fullEmbed.startsWith("/embed/")) return fullEmbed;
  if (raw.includes("/embed/")) return raw.startsWith("/") ? raw : `/${raw}`;
  if (!raw) throw new Error("GameMonetize hash or embed folder is required.");
  if (/^[A-Za-z0-9]{32}$/.test(raw)) return `/embed/g/${raw}/index.html`;
  const folder = raw.replace(/^\/+|\/+$/g, "");
  return `/embed/g/${folder}/index.html`;
}

function normalizeGameData(input) {
  const title = String(input.title || "").trim();
  const slug = String(input.slug || "").trim();
  const embed = resolveEmbed(input);
  const description = String(input.description || "").trim() || defaultDescription(title);
  const thumb = String(input.thumb || "").trim() || "/images/logo.svg";
  const landscape = String(input.landscape_thumb || input.thumb_landscape || "").trim() || thumb;
  const gameId = String(input.game_id || "").trim() || generateGameId(slug);

  return {
    slug,
    title,
    embed,
    description,
    thumb,
    landscape,
    portrait: String(input.portrait_thumb || input.thumb || "").trim() || thumb,
    how_to_play: String(input.how_to_play || "").trim(),
    editors_review: String(input.editors_review || "").trim(),
    game_id: gameId,
  };
}

function sharedHead(title, description, canonical, ogImage) {
  return `<html lang="en">
<head>
    <title>${esc(title)} - Play online games for Free | GamesCandy</title>
    <meta name="description" content="${esc(description)}" />
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="index, follow" />
    <link rel="shortcut icon" href="/favicon.ico">
    <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#6340F5">
    <meta name="msapplication-TileColor" content="#6340F5">
    <meta name="theme-color" content="#6340F5">
    <meta property="og:title" content="${esc(title)} - Play online games for Free | GamesCandy" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:image" content="${esc(ogImage || "/favicon.ico")}" />
    <meta name="twitter:card" content="summary_large_image" />
    <link href="https://cdnjs.cloudflare.com/ajax/libs/flowbite/1.8.1/flowbite.min.css" rel="stylesheet" />
    <link rel="stylesheet" type="text/css" href="/css/swiper-bundle.min.css">
    <link rel="canonical" href="${esc(canonical)}" />
    <link rel="stylesheet" href="/build/assets/app-73f15e52.css" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.0/jquery.min.js" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/flowbite/1.8.1/flowbite.min.js"></script>
    <link rel="stylesheet" type="text/css" href="/css/style.css">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>`;
}

function siteHeader() {
  return `<body class="google-anno-skip main-container">
    <div class="md:w-[80%] lg:w-[64%] w-full overflow-x-hidden mx-auto">
            <header>
    <script type="text/javascript" src="/js/navbar.js" async></script>
        <nav class="bg-white border-gray-200 rounded-br-[30px] rounded-bl-[30px]">
        <div class="flex flex-col 2xl:flex-row justify-around items-center 2xl:h-[96px] w-full px-2 py-4">
            <div class="flex justify-between w-full 2xl:w-auto">
                <a href="/home" class="lg:block hidden"><img src="/images/logo.svg" class="h-[60px]" alt="GamesCandy Logo" /></a>
                <a href="/home" class=" mx-2 lg:hidden block"><img src="/images/logo_mobile.svg" class="h-[60px]" alt="GamesCandy Logo" /></a>
            </div>
            <div class="flex items-center justify-center 2xl:justify-start font-medium text-sm lg:text-lg color-[#000] capitalize whitespace-nowrap">
                <a href="/home" class="border-b-4 hover:text-blue-700 hover:border-blue-700 hover:rounded border-white mx-1">Home</a>
                <a href="/games" class="border-b-4 hover:border-blue-700 hover:rounded hover:text-blue-700 border-white mx-1">All Games</a>
            </div>
        </div>
    </nav>
</header>`;
}

function siteFooter() {
  return `<footer class="rounded-tl-[30px] rounded-tr-[30px] !mb-0 footer-bg bg-cover bg-no-repeat mt-4">
    <div class="w-full">
        <div class="grid justify-items-center mb-3">
            <a href="/home" class="flex items-center my-5"><img src="/images/logo.svg" class="w-25 h-20" alt="GamesCandy Logo"/></a>
        </div>
        <hr class="bg-gray-200">
        <div class="w-full p-3 flex items-center justify-between">
            <div class="lg:w-60 text-sm text-theme-color font-medium leading-[16px] normal text-[14px] justify-start items-start">Copyright @ 2026 GamesCandy</div>
            <div class="lg:block hidden text-center"></div>
            <div class="lg:w-60 text-right"><a href="/privacy-policy" class="mr-4 hover:underline text-theme-color font-medium text-[14px] leading-[16px]">Privacy Policy</a></div>
        </div>
    </div>
</footer>
    </div>
</body>
</html>`;
}

function renderViewPage(game) {
  const data = normalizeGameData(game);
  const slugEnc = encodeURIComponent(data.slug);
  const infoBlocks = [];

  if (data.how_to_play) {
    infoBlocks.push(`<div class="my-5 bg-white rounded-[30px] p-6"><h2 class="font-bold text-xl mb-3 uppercase">How to Play</h2><div class="text-sm text-slate-700 whitespace-pre-line">${esc(data.how_to_play)}</div></div>`);
  }
  if (data.editors_review) {
    infoBlocks.push(`<div class="my-5 bg-white rounded-[30px] p-6"><h2 class="font-bold text-xl mb-3 uppercase">Editor's Review</h2><div class="text-sm text-slate-700 whitespace-pre-line">${esc(data.editors_review)}</div></div>`);
  }
  if (data.description) {
    infoBlocks.push(`<div class="my-5 bg-white rounded-[30px] p-6"><h2 class="font-bold text-xl mb-3 uppercase">About ${esc(data.title)}</h2><div class="text-sm text-slate-700 whitespace-pre-line">${esc(data.description)}</div></div>`);
  }

  return `${sharedHead(data.title, data.description, `/view-game/${slugEnc}`, data.landscape)}
<!-- gc-admin-game -->
${siteHeader()}
<h1 class="sr-only">${esc(data.title)} - Play online games for Free | GamesCandy</h1>
<div class="my-5 game-banner-container bg-cover bg-no-repeat bg-white py-8 px-4 md:py-12 md:px-16 grid justify-center place-item-center rounded-[30px]">
    <div class="flex flex-col justify-center items-center gap-4">
        <a href="/game/${slugEnc}">
            <img src="${esc(data.landscape)}" alt="${esc(data.title)}" class="w-full max-w-96 object-cover aspect-video rounded-2xl">
        </a>
        <h1 class="font-bold text-3xl uppercase">${esc(data.title)}</h1>
        <a href="/game/${slugEnc}" class="animatedPlayBtn uppercase bg-light-theme-color font-semibold text-white text-xl rounded-full w-48 p-3 text-center" type="button">
            Play <i class="fa-regular fa-circle-play"></i>
        </a>
    </div>
</div>
${infoBlocks.join("\n")}
${siteFooter()}`;
}

function renderPlayPage(game) {
  const data = normalizeGameData(game);
  const slugEnc = encodeURIComponent(data.slug);

  return `<html lang="en">
<!-- gc-admin-game -->
<head>
    <title>${esc(data.title)} - Play online games for Free | GamesCandy</title>
    <meta name="description" content="${esc(data.description)}" />
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="index, follow" />
    <link rel="shortcut icon" href="/favicon.ico">
    <meta name="theme-color" content="#6340F5">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/flowbite/1.8.1/flowbite.min.css" rel="stylesheet" />
    <link rel="stylesheet" type="text/css" href="/css/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.0/jquery.min.js" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/flowbite/1.8.1/flowbite.min.js"></script>
</head>
<body class="overflow-y-hidden google-anno-skip game-play-page">
    <div class="w-full h-[100dvh] relative main-container">
        <div class="absolute top-0 left-0 h-full w-full overflow-y-auto">
            <header>
                <nav class="bg-theme-color border-gray-200">
                    <div class="h-[40px] content-center">
                        <ul class="font-medium flex justify-between self-center w-full">
                            <li class="mx-3 px-2"><a href="/home"><i class="fa-solid fa-house" style="font-size:20px;color:white;"></i></a></li>
                            <li class="mx-1 px-2 truncate text-white"><a href="javascript:void(0);">${esc(data.title)}</a></li>
                            <li class="mx-3 px-2"><button id="shareButton"><i class="fa-solid fa-share" style="font-size:20px;color:white;"></i></button><input type="hidden" value="/game/${slugEnc}"></li>
                        </ul>
                    </div>
                </nav>
            </header>
            <div id="shareModal" class="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center hidden z-10 md:mr-4">
                <div class="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
                    <img src="${esc(data.thumb)}" alt="Game Logo" class="h-[150px] w-[150px] mb-4 mx-auto"/>
                    <h2 class="text-md font-semibold mb-4 text-center">Invite your friends to play this game!</h2>
                    <input type="text" id="shareLink" value="/game/${slugEnc}" readonly class="w-full p-2 rounded mb-4 text-blue-700 underline font-md border-dashed border-2 border-sky-700">
                    <button id="copyButton" class="bg-blue-500 text-white py-2 px-4 mb-4 w-full rounded-full">Copy</button>
                    <button id="doneShareModal" class="text-black py-2 px-4 rounded w-full">Done</button>
                </div>
            </div>
            <script>
            $(document).ready(function() {
                $('#shareButton').on('click', function() { $('#shareModal').removeClass('hidden'); });
                $('#closeShareModal, #doneShareModal').on('click', function() { $('#shareModal').addClass('hidden'); });
                $('#copyButton').on('click', function() {
                    const copyText = document.getElementById("shareLink");
                    copyText.select();
                    document.execCommand("copy");
                    $(this).text("Copied");
                    setTimeout(() => { $(this).text("Copy"); }, 5000);
                });
            });
            </script>
            <h1 class="sr-only">${esc(data.title)} - Play online games for Free | GamesCandy</h1>
            <div class="bg-transparent absolute top-[50%] left-[50%] -translate-x-[50px] -translate-y-[50px]">
                <div id="loading" class="hidden"><img src="/images/game_load.gif" alt="Loading..." class="h-[100px] w-[100px] object-contain"></div>
            </div>
            <div id="game-content-main" class="bg-white h-[calc(100dvh-90px)] sm:h-[calc(100dvh-40px)]">
                <div id="game-content" class="overflow-hidden w-full h-[100%]"></div>
            </div>
            <script type="text/javascript">
                game_url = ${JSON.stringify(data.embed)};
                var game_id = ${JSON.stringify(data.game_id)};
                if (typeof saveRecentPlay === "function") saveRecentPlay();
                if (typeof setInterval === "function" && typeof updateGamePlaytime === "function") setInterval(updateGamePlaytime, 1000);
                function updateGamePlaytime() {
                    const pending_games = localStorage.getItem('pending_games');
                    const parsed_games = pending_games ? JSON.parse(pending_games) : [];
                    const is_game_exists = parsed_games && parsed_games.some(game => game.game_id === game_id);
                    if (is_game_exists) {
                        const existing_game_index = parsed_games.findIndex(game => game.game_id === game_id);
                        parsed_games[existing_game_index].play_time += 1000;
                        localStorage.setItem('pending_games', JSON.stringify(parsed_games));
                        return;
                    }
                    parsed_games.push({ game_id, play_time: 1000 });
                    localStorage.setItem('pending_games', JSON.stringify(parsed_games));
                }
                $(document).ready(function() {
                    $('#game-content-main').removeClass('hidden bg-white').css({ height: 'calc(100dvh - 40px)', background: '#000' });
                    $('#game-content').css({ position: 'relative', width: '100%', height: '100%', background: '#000', overflow: 'hidden' });
                    $('#loading').removeClass('hidden');
                    $('#game-content').load(game_url, function(response, status) {
                        if (status === 'error') {
                            $('#loading').addClass('hidden');
                            $('#game-content').html('<p style="color:#fff;text-align:center;padding:2rem;">Game failed to load. Check the embed path in admin.</p>');
                            return;
                        }
                        $('#loading').addClass('hidden');
                    });
                    setTimeout(function() { $('#loading').addClass('hidden'); }, 12000);
                });
            </script>
        </div>
    </div>
</body>
</html>`;
}

function writeGamePages(game) {
  const data = normalizeGameData(game);
  const playDir = path.join(PUBLIC, "game", data.slug);
  const viewDir = path.join(PUBLIC, "view-game", data.slug);
  fs.mkdirSync(playDir, { recursive: true });
  fs.mkdirSync(viewDir, { recursive: true });
  fs.writeFileSync(path.join(playDir, "index.html"), renderPlayPage(data));
  fs.writeFileSync(path.join(viewDir, "index.html"), renderViewPage(data));
  return data;
}

function removeGamePages(slug) {
  for (const base of ["game", "view-game"]) {
    const dir = path.join(PUBLIC, base, slug);
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
}

module.exports = {
  esc,
  defaultDescription,
  generateGameId,
  resolveEmbed,
  normalizeGameData,
  renderViewPage,
  renderPlayPage,
  writeGamePages,
  removeGamePages,
};
