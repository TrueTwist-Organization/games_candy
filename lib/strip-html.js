const GAME_READY_SCRIPT = `function getGameProxyUrl(url) {
        var match = url.match(/https:\\/\\/(gamesdonut-games-[^/]+)\\.s3\\.[^/]+\\.amazonaws\\.com\\/(.+)/);
        if (!match) return url;
        return '/s3-proxy/' + match[1] + '/' + match[2];
    }

    $(document).ready(function() {
        $('#game-ad-container-main').remove();
        $('.bg-slate-200.h-\\[50px\\]').remove();
        $('#game-content-main').removeClass('hidden bg-white').css({
            height: 'calc(100dvh - 40px)',
            background: '#000'
        });
        $('#game-content').css({
            position: 'relative',
            width: '100%',
            height: '100%',
            background: '#000',
            overflow: 'hidden'
        });
        $('#loading').removeClass('hidden');
        var proxyUrl = getGameProxyUrl(game_url);
        $('#game-content').load(proxyUrl, function(response, status) {
            if (status === 'error') {
                $('#loading').addClass('hidden');
                return;
            }
            $('#loading').addClass('hidden');
        });
        setTimeout(function() { $('#loading').addClass('hidden'); }, 12000);
    });`;

const PROTECTED_PATTERNS = [
  /https:\/\/gamesdonut\.com[^\s"'<>]*/gi,
  /https:\/\/buyhtml5games\.gamesdonut\.com[^\s"'<>]*/gi,
  /https:\/\/www\.facebook\.com\/games\.donut[^\s"'<>]*/gi,
  /https:\/\/www\.instagram\.com\/gamesdonut_online[^\s"'<>]*/gi,
  /https:\/\/x\.com\/gamesdonut_play[^\s"'<>]*/gi,
  /https:\/\/www\.linkedin\.com\/company\/gamesdonut[^\s"'<>]*/gi,
  /https:\/\/play\.google\.com\/store\/apps\/details\?id=com\.gamesdonut\.games\.offline\.nowifi[^\s"'<>]*/gi,
  /gamesdonut-games-2026\.s3[^\s"'<>]*/gi,
  /gamesdonut-games-new\.s3[^\s"'<>]*/gi,
  /\/GamesCandy\/[^"'<>\\s]*/gi,
  /gamesdonut-b566f[^\s"'<>]*/gi,
  /gamesdonut\.firebaseapp\.com[^\s"'<>]*/gi,
];

const REBRAND_REPLACEMENTS = [
  ["GamesCandy", "GamesCandy"],
  ["GamesCandy", "GamesCandy"],
  ["GAMESCANDY", "GAMESCANDY"],
  ["GamesCandy.com", "GamesCandy.com"],
  ["games-candy", "games-candy"],
  ["Local clone of GamesCandy.com", "GamesCandy gaming site"],
  ["COOKIE_DOMAIN = 'GamesCandy.com'", "COOKIE_DOMAIN = 'localhost'"],
];

function normalizeSiteUrls(html) {
  return html
    .replace(/https:\/\/gamesdonut\.com\/game\//g, "/game/")
    .replace(/https:\/\/gamesdonut\.com\/view-game\//g, "/view-game/")
    .replace(/https:\/\/gamesdonut\.com\/category\//g, "/category/")
    .replace(/https:\/\/gamesdonut\.com\/home\b/g, "/home")
    .replace(/https:\/\/gamesdonut\.com\/games\b/g, "/games")
    .replace(/https:\/\/gamesdonut\.com\//g, "/");
}

function toEmbedUrl(url) {
  let match = url.match(
    /https:\/\/gamesdonut-games-2026\.s3\.[^/]+\.amazonaws\.com\/GamesCandy\/(.+)/
  );
  if (match) return "/embed/g/" + match[1];
  match = url.match(
    /https:\/\/gamesdonut-games-new\.s3\.[^/]+\.amazonaws\.com\/GamesCandy\/(.+)/
  );
  if (match) return "/embed/n/" + match[1];
  return url
    .replace("/s3-proxy/gamesdonut-games-2026/GamesDonut/", "/embed/g/")
    .replace("/s3-proxy/gamesdonut-games-new/GamesDonut/", "/embed/n/");
}

function normalizeGameUrls(html) {
  let text = html.replace(
    /game_url\s*=\s*"(https:\/\/gamesdonut-games-[^"]+)"/g,
    (match, url) => `game_url = "${toEmbedUrl(url)}"`
  );
  text = text.replace(
    /https:\/\/gamesdonut-games-2026\.s3\.[^"']+\.amazonaws\.com\/GamesCandy\/([^"']+)/g,
    (match, path) => toEmbedUrl(match)
  );
  text = text.replace(
    /https:\/\/gamesdonut-games-new\.s3\.[^"']+\.amazonaws\.com\/GamesCandy\/([^"']+)/g,
    (match, path) => toEmbedUrl(match)
  );
  text = text.replace(/\/s3-proxy\/gamesdonut-games-2026\/GamesCandy\//g, "/embed/g/");
  text = text.replace(/\/s3-proxy\/gamesdonut-games-new\/GamesCandy\//g, "/embed/n/");
  text = text.replace("https://gamesdonut.com/aws-s3-url", "/api/game-assets");
  return text;
}

function injectGameReadyScript(text) {
  if (!text.includes("game_url") || text.includes("getGameProxyUrl")) {
    return text;
  }
  return text.replace(
    /(<script type="text\/javascript">\s*\n?\s*game_url)/,
    `<script type="text/javascript">\n${GAME_READY_SCRIPT}\n\n    game_url`
  );
}

function stripAdsFromHtml(html) {
  let text = html;

  text = text.replace(/\s*<meta name="google-adsense-account"[^>]*>\s*/gi, "\n");
  text = text.replace(
    /\s*<script async src="https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js[^"]*"[^>]*><\/script>\s*/gi,
    "\n"
  );
  text = text.replace(/<script>\s*function initializeAds\(\)[\s\S]*?<\/script>\s*/g, "");
  text = text.replace(
    /<div class="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 hidden" id="adBlockerDialog">[\s\S]*?<\/div>\s*/g,
    ""
  );
  text = text.replace(/\s*<script type="text\/javascript" src="\/js\/blockadblock\.js"><\/script>\s*/g, "\n");
  text = text.replace(/\s*<script type="text\/javascript" src="\/js\/ads\.js"><\/script>\s*/g, "\n");
  text = text.replace(/<script>\s*setTimeout\(\(\)=>\s*\{\s*\(adsbygoogle[\s\S]*?<\/script>\s*/g, "");
  text = text.replace(
    /<ins class="adsbygoogle[^"]*"[\s\S]*?<\/ins>\s*<script>\s*\(adsbygoogle[\s\S]*?<\/script>\s*/gi,
    ""
  );
  text = text.replace(/<ins class="adsbygoogle[^"]*"[\s\S]*?<\/ins>\s*/gi, "");
  text = text.replace(
    /<script>\s*\(adsbygoogle = window\.adsbygoogle \|\| \[\]\)\.push\(\{\}\);\s*<\/script>\s*/g,
    ""
  );
  text = text.replace(
    /<div class="w-full flex justify-center bg-slate-200 sm:hidden h-\[50px\]">\s*<\/div>\s*/g,
    ""
  );
  text = text.replace(
    /<div class="w-full flex justify-center bg-slate-200 sm:hidden h-\[50px\]">[\s\S]*?<\/div>\s*/g,
    ""
  );
  text = text.replace(
    /<div id="game-ad-container-main"[\s\S]*?<\/div>\s*(?=<div class="w-full flex justify-center bg-slate-200|<script type="text\/javascript">)/g,
    ""
  );
  if (text.includes('id="game-ad-container-main"')) {
    text = text.replace(
      /<div id="game-ad-container-main"[\s\S]*?<\/div>\s*<\/div>\s*/g,
      ""
    );
  }
  text = text.replace(/\s*loadInterAds\(\)\s*/g, "\n");
  text = text.replace(/showInterAds\(\)\s*/g, "");
  text = text.replace(
    /<script>\s*function showInterAds\(\)[\s\S]*?function loadInterAds\(\)[\s\S]*?<\/script>\s*/g,
    ""
  );
  text = text.replace(
    /\s*function\s*\{\s*afg\.adBreak\([\s\S]*?\}\s*function\s*\{[\s\S]*?window\.afg = afg;\s*\}\s*/g,
    "\n"
  );
  text = text.replace(
    /\$\(document\)\.ready\(function\(\)\s*\{\s*\$\('#game-content-main'\)\.addClass\('hidden'\);[\s\S]*?\}\);\s*\$\('#continue-btn'\)\.on\('click',function\(\)\{[\s\S]*?\}\);\s*/g,
    `${GAME_READY_SCRIPT}\n\n    `
  );
  text = text.replace(
    /\$\(document\)\.ready\(function\(\)\s*\{\s*\$\('#game-content-main'\)\.addClass\('hidden'\);[\s\S]*?\}\);\s*/g,
    `${GAME_READY_SCRIPT}\n\n    `
  );
  text = text.replace(/\$\('#continue-btn'\)\.on\('click',function\(\)\{[\s\S]*?\}\);\s*/g, "");

  return text;
}

function stripGameDescriptions(html) {
  return html.replace(
    /<div class="my-5 game-banner-container bg-cover bg-no-repeat bg-white py-\[3rem\] rounded-\[30px\]">\s*<article class="prose w-full px-7 max-w-none">[\s\S]*?<\/article>\s*<div class="my-5">\s*<\/div>\s*<\/div>\s*/g,
    ""
  );
}

function rebrandText(text) {
  const placeholders = {};

  const protect = (match) => {
    const key = `__PROTECT_${Object.keys(placeholders).length}__`;
    placeholders[key] = match;
    return key;
  };

  for (const pattern of PROTECTED_PATTERNS) {
    text = text.replace(pattern, protect);
  }

  for (const [oldValue, newValue] of REBRAND_REPLACEMENTS) {
    text = text.split(oldValue).join(newValue);
  }

  for (const [key, value] of Object.entries(placeholders)) {
    text = text.split(key).join(value);
  }

  return text;
}

function transformProxiedHtml(html, urlPath) {
  let text = stripAdsFromHtml(html);
  text = normalizeSiteUrls(text);
  text = normalizeGameUrls(text);
  text = injectGameReadyScript(text);
  if (urlPath.includes("/view-game/")) {
    text = stripGameDescriptions(text);
  }
  text = rebrandText(text);
  text = normalizeSiteUrls(text);
  text = normalizeGameUrls(text);
  return text;
}

function isHtmlResponse(contentType) {
  return typeof contentType === "string" && contentType.includes("text/html");
}

module.exports = {
  stripAdsFromHtml,
  stripGameDescriptions,
  rebrandText,
  normalizeSiteUrls,
  normalizeGameUrls,
  transformProxiedHtml,
  isHtmlResponse,
};
