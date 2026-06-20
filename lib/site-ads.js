const fs = require("fs");
const path = require("path");
const adminConfig = require("./admin/admin-config");

const CONFIG_PATH = path.join(__dirname, "../admin/data/admin-config.json");

const PAGE_PLACEMENTS = {
  home: ["bottom_anchor", "web_interstitial", "home_top_banner", "home_hero_mpu", "home_mpu_1", "home_mpu_2"],
  list: ["bottom_anchor", "web_interstitial", "list_top", "list_mid"],
  game_play: ["bottom_anchor", "web_interstitial", "game_preroll", "game_mpu_left", "game_mpu_right"],
  game_view: ["bottom_anchor", "web_interstitial", "game_preplay"],
  other: ["bottom_anchor", "web_interstitial"],
};

const SLOT_SIZES = {
  bottom_anchor: "anchor",
  web_interstitial: "interstitial",
  home_top_banner: [[728, 90], [970, 90], [320, 50], "fluid"],
  home_hero_mpu: [[300, 250], [336, 280], "fluid"],
  home_mpu_1: [[300, 250], [336, 280], "fluid"],
  home_mpu_2: [[300, 250], [336, 280], "fluid"],
  list_top: [[728, 90], [970, 90], [300, 250], "fluid"],
  list_mid: [[300, 250], [336, 280], "fluid"],
  game_preroll: [[300, 250], [336, 280], "fluid"],
  game_mpu_left: [[160, 600], [120, 600], [300, 250]],
  game_mpu_right: [[160, 600], [120, 600], [300, 250]],
  game_preplay: [[300, 250], [336, 280], "fluid"],
};

function escAttr(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function isAdsEnabled(config) {
  return config?.site?.enable_ads === true;
}

function normalizeGamNetwork(network) {
  let value = String(network || "").trim();
  if (!value) return "";
  if (!value.startsWith("/")) value = `/${value}`;
  if (!value.endsWith("/")) value = `${value}/`;
  return value;
}

function buildAdUnitPath(network, code) {
  const base = normalizeGamNetwork(network);
  const unit = String(code || "").trim().replace(/^\/+/, "");
  if (!base || !unit) return "";
  return `${base}${unit}`;
}

function extractAdsenseClient(ads) {
  const txt = String(ads?.ads_txt || "");
  const match = txt.match(/google\.com,\s*(pub-\d+)/i);
  if (match) return `ca-${match[1]}`;
  const network = String(ads?.gam_network || "");
  const networkMatch = network.match(/(pub-\d+|ca-pub-\d+)/i);
  if (networkMatch) {
    const pub = networkMatch[1];
    return pub.startsWith("ca-") ? pub : `ca-${pub}`;
  }
  return "";
}

function getConfigVersion() {
  try {
    return String(Math.floor(fs.statSync(CONFIG_PATH).mtimeMs));
  } catch {
    return String(Date.now());
  }
}

function detectPageType(html) {
  const text = String(html || "");
  const pathHint =
    (text.match(/property="og:url"\s+content="([^"]*)"/i) || [])[1] ||
    (text.match(/rel="canonical"\s+href="([^"]*)"/i) || [])[1] ||
    "";

  if (/class="[^"]*game-play-page/i.test(text) || /\/game\//i.test(pathHint)) {
    return "game_play";
  }
  if (/\/view-game\//i.test(pathHint)) return "game_view";
  if (/\/home/i.test(pathHint)) return "home";
  if (/\/games/i.test(pathHint)) return "list";
  if (/\/category\//i.test(pathHint)) return "list";
  return "other";
}

function getActivePlacements(ads, pageType) {
  const allowed = PAGE_PLACEMENTS[pageType] || PAGE_PLACEMENTS.other;
  const placements = ads?.placements || {};
  const network = normalizeGamNetwork(ads?.gam_network);
  const adsenseClient = extractAdsenseClient(ads);
  const items = [];

  for (const key of allowed) {
    const placement = placements[key];
    if (!placement || placement.enabled === false) continue;
    const code = String(placement.code || "").trim();
    if (!code) continue;
    const unitPath = buildAdUnitPath(network, code);
    if (!unitPath && !adsenseClient) continue;
    items.push({
      key,
      code,
      unitPath,
      sizes: SLOT_SIZES[key] || [[300, 250], "fluid"],
      adsenseClient,
    });
  }

  return items;
}

function buildAdsCss(site) {
  if (site?.enable_ads !== true) return "";
  return `body.gc-ads-enabled ins.adsbygoogle,
body.gc-ads-enabled .ads-content,
body.gc-ads-enabled [data-ad-slot],
body.gc-ads-enabled .googleadsmodal,
body.gc-ads-enabled #ads-modal,
body.gc-ads-enabled #game-ad-container-main,
body.gc-ads-enabled .game-ad-container,
body.gc-ads-enabled #continue-btn,
body.gc-ads-enabled .gc-ad-slot,
body.gc-ads-enabled .gc-ad-anchor,
body.gc-ads-enabled iframe[src*="googlesyndication"],
body.gc-ads-enabled iframe[src*="doubleclick"],
body.gc-ads-enabled iframe[src*="googleads"],
body.gc-ads-enabled iframe[id^="google_ads_iframe"] {
  display: block !important;
  visibility: visible !important;
  height: auto !important;
  min-height: 0 !important;
  max-height: none !important;
  margin: revert !important;
  padding: revert !important;
  overflow: visible !important;
  opacity: 1 !important;
  pointer-events: auto !important;
}
body.gc-ads-enabled #game-content-main.hidden {
  display: none !important;
}
body.gc-ads-enabled .gc-ad-slot {
  text-align: center;
  margin: 1.25rem auto;
  min-height: 50px;
  width: 100%;
  max-width: 100%;
}
body.gc-ads-enabled .gc-ad-slot.gc-ad-banner {
  min-height: 90px;
}
body.gc-ads-enabled .gc-ad-slot.gc-ad-mpu {
  min-height: 250px;
  max-width: 336px;
}
body.gc-ads-enabled .gc-ad-rail {
  display: none;
}
@media (min-width: 1280px) {
  body.gc-ads-enabled.game-play-page .gc-ad-rail.gc-ad-rail-left,
  body.gc-ads-enabled.game-play-page .gc-ad-rail.gc-ad-rail-right {
    display: block;
    position: fixed;
    top: 50%;
    transform: translateY(-50%);
    width: 160px;
    z-index: 20;
  }
  body.gc-ads-enabled.game-play-page .gc-ad-rail.gc-ad-rail-left { left: 8px; }
  body.gc-ads-enabled.game-play-page .gc-ad-rail.gc-ad-rail-right { right: 8px; }
}
body.gc-ads-enabled #game-ad-container-main {
  display: flex !important;
}
body.gc-ads-enabled .gc-mobile-anchor {
  display: flex !important;
  justify-content: center;
  align-items: center;
  min-height: 50px;
  background: #e2e8f0;
}
body.gc-ads-enabled #continue-btn[disabled] {
  opacity: 0.85;
  cursor: not-allowed;
}
`;
}

function buildAdsConfigPayload(config, pageType) {
  const ads = config?.ads || {};
  const placements = getActivePlacements(ads, pageType);
  return {
    enabled: true,
    pageType,
    gamNetwork: normalizeGamNetwork(ads.gam_network),
    adsenseClient: extractAdsenseClient(ads),
    refreshSec: Math.max(0, Number(ads.refresh_sec || 0) || 0),
    amazonPubId: String(ads.amazon_pub_id || "").trim(),
    prebidTimeout: Math.max(500, Number(ads.prebid_timeout || 1500) || 1500),
    prebidBids: String(ads.prebid_bids || "").trim(),
    placements: placements.map((item) => ({
      key: item.key,
      code: item.code,
      unitPath: item.unitPath,
      sizes: item.sizes,
    })),
  };
}

function buildAdsInlineConfigScript(payload) {
  const json = JSON.stringify(payload).replace(/</g, "\\u003c");
  return `<script id="gc-ads-config">window.__gcAds=${json};</script>`;
}

function buildGamePrerollHtml() {
  return `<div id="game-ad-container-main" class="bg-white h-[calc(100dvh-90px)] sm:h-[calc(100dvh-40px)]">
    <div class="overflow-hidden flex items-center justify-center flex-col h-full">
        <h4 class="text-center font-semibold capitalize text-md p-2">Advertisement</h4>
        <div class="game-ad-container w-full gc-ad-slot gc-ad-mpu" data-gc-placement="game_preroll"></div>
        <button id="continue-btn" class="bg-gray-600 font-semibold text-white text-lg rounded-full p-2 w-[12rem] mt-2" type="button" disabled>Continue in 3!</button>
    </div>
</div>`;
}

function buildMobileAnchorHtml() {
  return `<div class="w-full flex justify-center bg-slate-200 sm:hidden h-[50px] gc-mobile-anchor">
    <div class="gc-ad-slot gc-ad-banner w-full h-[50px]" data-gc-placement="bottom_anchor" style="min-height:50px;"></div>
</div>`;
}

const STRIP_GAME_READY =
  /\$\(document\)\.ready\(function\(\)\s*\{\s*\$\('#game-ad-container-main'\)\.remove\(\);[\s\S]*?setTimeout\(function\(\)\s*\{\s*\$\('#loading'\)\.addClass\('hidden'\);\s*\},\s*12000\);\s*\}\);/;

const PREROLL_GAME_READY = `$(document).ready(function() {
        $('#game-content-main').addClass('hidden');
        function bootGame() {
            if (window.GCAds && typeof window.GCAds.setupGamePreroll === 'function') {
                window.GCAds.setupGamePreroll(getGameProxyUrl);
                return true;
            }
            return false;
        }
        if (!bootGame()) {
            var tries = 0;
            var timer = setInterval(function() {
                tries++;
                if (bootGame() || tries > 40) {
                    clearInterval(timer);
                    if (tries > 40 && !window.GCAds) {
                        $('#game-ad-container-main').remove();
                        $('#game-content-main').removeClass('hidden');
                        $('#loading').removeClass('hidden');
                        var proxyUrl = getGameProxyUrl(window.game_url || '');
                        $('#game-content').load(proxyUrl, function(response, status) {
                            $('#loading').addClass('hidden');
                            if (status === 'error') {
                                $('#game-content').html('<p style="color:#fff;text-align:center;padding:2rem;">Game failed to load. Please refresh.</p>');
                            }
                        });
                    }
                }
            }, 50);
        }
    });`;

const GAME_CONTENT_MAIN_BLOCK =
  /<div id="game-content-main" class="([^"]*)">\s*<div id="game-content" class="([^"]*)"><\/div>\s*<\/div>/i;

function applyGamePlayAdsHtml(html, ads) {
  let text = String(html || "");
  if (!/game-play-page/i.test(text)) return text;

  const placements = ads?.placements || {};
  const prerollEnabled = placements.game_preroll?.enabled !== false && String(placements.game_preroll?.code || "").trim();
  const anchorEnabled = placements.bottom_anchor?.enabled !== false && String(placements.bottom_anchor?.code || "").trim();

  if (prerollEnabled && !text.includes('id="game-ad-container-main"')) {
    let prerollHtml = buildGamePrerollHtml();
    if (anchorEnabled && !text.includes("gc-mobile-anchor")) {
      prerollHtml = prerollHtml.replace(
        "</div>\n</div>",
        `${buildMobileAnchorHtml()}\n</div>\n</div>`
      );
    }

    text = text.replace(GAME_CONTENT_MAIN_BLOCK, (_match, mainClass, contentClass) => {
      const hiddenClass = mainClass.includes("hidden") ? mainClass : `${mainClass} hidden`;
      return `<div id="game-content-main" class="${hiddenClass}">
    <div id="game-content" class="${contentClass}"></div>
</div>
${prerollHtml}`;
    });
  } else if (anchorEnabled && !text.includes("gc-mobile-anchor") && text.includes('id="game-ad-container-main"')) {
    text = text.replace(
      /(<div id="game-ad-container-main"[\s\S]*?<button id="continue-btn"[\s\S]*?<\/button>)/,
      `$1\n${buildMobileAnchorHtml()}`
    );
  }

  if (prerollEnabled && STRIP_GAME_READY.test(text)) {
    text = text.replace(STRIP_GAME_READY, PREROLL_GAME_READY);
  } else if (prerollEnabled) {
    text = text.replace("$('#game-ad-container-main').remove();", "/* gc-ads: keep preroll */");
    text = text.replace(
      "$('#game-content-main').removeClass('hidden bg-white').css({",
      "$('#game-content-main').addClass('hidden').removeClass('bg-white').css({"
    );
    text = text.replace(
      /var proxyUrl = getGameProxyUrl\(game_url\);\s*\$\('#game-content'\)\.load\(proxyUrl[\s\S]*?setTimeout\(function\(\)\s*\{\s*\$\('#loading'\)\.addClass\('hidden'\);\s*\},\s*12000\);/,
      "if (window.GCAds && typeof window.GCAds.setupGamePreroll === 'function') { window.GCAds.setupGamePreroll(getGameProxyUrl); }"
    );
  }

  return text;
}

function applyAdsBodyClass(html) {
  return String(html || "").replace(/<body([^>]*)class="([^"]*)"/i, (match, attrs, classes) => {
    if (classes.includes("gc-ads-enabled")) return match;
    return `<body${attrs}class="${classes} gc-ads-enabled"`;
  });
}

function applyAdsToHtml(html, config) {
  if (!isAdsEnabled(config)) return html;

  let text = String(html || "");
  const pageType = detectPageType(text);
  const payload = buildAdsConfigPayload(config, pageType);

  text = applyAdsBodyClass(text);
  text = applyGamePlayAdsHtml(text, config.ads || {});

  const version = getConfigVersion();
  const configScript = buildAdsInlineConfigScript(payload);
  if (!text.includes("gc-ads-config")) {
    text = text.replace("</head>", `    ${configScript}\n</head>`);
  }

  const loader = `<script src="/js/ads.js?v=${version}" defer></script>`;
  if (!text.includes("/js/ads.js")) {
    text = text.replace("</body>", `    ${loader}\n</body>`);
  } else {
    text = text.replace(/\/js\/ads\.js(\?v=[^"']*)?/g, `/js/ads.js?v=${version}`);
  }

  return text;
}

function getAdsTxt(ads) {
  return String(ads?.ads_txt || "").trim() + "\n";
}

function buildAdsJs() {
  const runtimePath = path.join(__dirname, "ads.runtime.js");
  return fs.readFileSync(runtimePath, "utf8");
}

module.exports = {
  isAdsEnabled,
  buildAdsCss,
  buildAdsConfigPayload,
  buildAdsInlineConfigScript,
  buildAdsJs,
  applyAdsToHtml,
  detectPageType,
  getActivePlacements,
  getAdsTxt,
  getConfigVersion,
  buildAdUnitPath,
  normalizeGamNetwork,
};
