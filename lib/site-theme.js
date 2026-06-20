const fs = require("fs");
const path = require("path");
const adminConfig = require("./admin/admin-config");
const colorValue = require("./color-value");
const siteAds = require("./site-ads");
const siteAuth = require("./site-auth");
const contactPage = require("./contact-page");
const privacyPage = require("./privacy-page");
const categorySort = require("./category-sort");
const siteSearch = require("./site-search");

const CONFIG_PATH = path.join(__dirname, "../admin/data/admin-config.json");

const NAV_CATEGORIES = ["Action", "Arcade", "Casual", "Puzzle", "Quiz", "Sports", "Board", "Match 3", "Card"];

function normalizeHex(color, fallback) {
  const value = String(color || "").trim();
  if (/^#[0-9A-Fa-f]{3}$/.test(value)) {
    return value.toUpperCase();
  }
  if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
    return value.toUpperCase();
  }
  return fallback;
}

function escAttr(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function loadFullConfig() {
  return adminConfig.load();
}

function loadSiteConfig() {
  return loadFullConfig().site || adminConfig.defaults().site;
}

const ORIGINAL_PAGE_GRADIENT =
  "radial-gradient(circle 50vw at 100% 0, #00fefe, transparent), radial-gradient(circle 50vw at 20% 25vw, #9b00cc, transparent), linear-gradient(180deg, #3f007e, #502cba 25vw, #05122b 50vw)";
const DEFAULT_BACKGROUND = "#FFFFFF";

function buildPageBackgroundCss(site, text) {
  const bgRaw = String(site.background_color || "").trim();
  const isDefaultSolid =
    !colorValue.isGradient(bgRaw) &&
    colorValue.normalizeHex(bgRaw, DEFAULT_BACKGROUND) === DEFAULT_BACKGROUND;

  if (isDefaultSolid) {
    return `body.main-container,
.main-container {
  background-image: ${ORIGINAL_PAGE_GRADIENT} !important;
  color: ${text} !important;
}`;
  }

  if (colorValue.isGradient(bgRaw)) {
    return `body.main-container,
.main-container {
  background-image: ${bgRaw} !important;
  background-color: transparent !important;
  color: ${text} !important;
}`;
  }

  const bg = colorValue.cssBackground(bgRaw, DEFAULT_BACKGROUND);
  return `body.main-container,
.main-container {
  background-color: ${bg} !important;
  background-image: none !important;
  color: ${text} !important;
}`;
}

function buildThemeCss(site) {
  const primaryRaw = String(site.primary_color || "");
  const secondaryRaw = String(site.secondary_color || "");
  const accentRaw = String(site.accent_color || "");
  const buttonRaw = String(site.button_color || "");
  const buttonHoverRaw = String(site.button_hover_color || "");
  const linkRaw = String(site.link_color || "");
  const textRaw = String(site.text_color || "");

  const primary = colorValue.cssColor(primaryRaw, "#6340F5");
  const secondary = colorValue.cssColor(secondaryRaw, "#DF0F64");
  const accent = colorValue.cssColor(accentRaw, "#8B5CF6");
  const buttonBg = colorValue.backgroundCss(buttonRaw || primaryRaw, primary);
  const buttonHoverBg = colorValue.backgroundCss(buttonHoverRaw, "#5230D5");
  const link = colorValue.cssColor(linkRaw, primary);
  const text = colorValue.cssColor(textRaw, "#1F1147");
  const theme = colorValue.cssColor(String(site.theme_color || ""), primary);
  const tournamentBg = colorValue.tournamentGradient(primaryRaw || primary, accentRaw || accent);
  const pageBackground = buildPageBackgroundCss(site, text);
  const hover = colorValue.cssColor(buttonHoverRaw, "#5230D5");

  return `:root {
  --gc-primary: ${primary};
  --gc-secondary: ${secondary};
  --gc-accent: ${accent};
  --gc-button: ${primary};
  --gc-button-hover: ${hover};
  --gc-link: ${link};
  --gc-bg: ${colorValue.cssBackground(String(site.background_color || ""), DEFAULT_BACKGROUND)};
  --gc-text: ${text};
  --gc-theme: ${theme};
}
${pageBackground}
.text-theme-color { color: ${link} !important; }
.border-theme-color { border-color: ${link} !important; }
.border-blue-700 { border-color: ${link} !important; }
.text-blue-700 { color: ${link} !important; }
.bg-light-theme-color,
.animatedPlayBtn,
#btn-back-to-top { ${buttonBg} color: #fff !important; }
.animatedPlayBtn:hover,
#btn-back-to-top:hover { ${buttonHoverBg} color: #fff !important; }
a.text-theme-color:hover { color: ${colorValue.cssColor(buttonHoverRaw, "#5230D5")} !important; }
.hover\\:text-blue-700:hover { color: ${colorValue.cssColor(buttonHoverRaw, "#5230D5")} !important; }
.hover\\:border-blue-700:hover { border-color: ${colorValue.cssColor(buttonHoverRaw, "#5230D5")} !important; }
.from-purple-500 { --tw-gradient-from: ${primary} var(--tw-gradient-from-position) !important; }
.to-blue-500 { --tw-gradient-to: ${accent} var(--tw-gradient-to-position) !important; }
.bg-gradient-to-r.from-purple-500.to-blue-500 { background-image: ${tournamentBg} !important; }
${site.show_tournaments === false ? ".capitalize.text-black.hover\\:text-blue-700.font-semibold.tracking-wide { display: none !important; }" : ""}
${site.enable_ads === false ? "ins.adsbygoogle, .ads-content, [data-ad-slot], .googleadsmodal, #ads-modal { display: none !important; }" : siteAds.buildAdsCss(site)}
`;
}

function replaceMetaByName(html, name, value) {
  if (!value) return html;
  const safe = escAttr(value);
  const pattern = new RegExp(`<meta\\s+name="${name}"\\s+content="[\\s\\S]*?"\\s*/?>`, "i");
  if (pattern.test(html)) {
    return html.replace(pattern, `<meta name="${name}" content="${safe}">`);
  }
  return html.replace("</head>", `    <meta name="${name}" content="${safe}">\n</head>`);
}

function replaceMetaByProperty(html, property, value) {
  if (!value) return html;
  const safe = escAttr(value);
  const pattern = new RegExp(`<meta\\s+property="${property}"\\s+content="[\\s\\S]*?"\\s*/?>`, "i");
  if (pattern.test(html)) {
    return html.replace(pattern, `<meta property="${property}" content="${safe}">`);
  }
  return html.replace("</head>", `    <meta property="${property}" content="${safe}">\n</head>`);
}

function buildDesktopNavHtml(items, site) {
  const enabled = (items || []).filter((item) => item.enabled !== false);
  const parts = [];

  for (const item of enabled) {
    const url = String(item.url || "").trim();
    if (url === "/tournaments" || url.startsWith("/category/")) continue;
    parts.push(
      `<a href="${escAttr(url)}" class="border-b-4 hover:border-blue-700 hover:rounded hover:text-blue-700 hover:border-b-4 border-white mx-1">${escAttr(item.label)}</a>`
    );
  }

  const tournaments = enabled.find((item) => String(item.url || "").trim() === "/tournaments");
  if (site.show_tournaments !== false && tournaments) {
    parts.push(
      `<button type="button" class="mx-2 flex items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-blue-500 p-[1.5px] text-white duration-300 hover:bg-gradient-to-l hover:shadow-2xl hover:shadow-purple-600/30 hover:cursor-pointer" onclick="location.href='/tournaments'"><span class="flex h-full w-full items-center px-3 justify-center rounded-full bg-white transition duration-300 ease-in-out capitalize text-black hover:text-blue-700 font-semibold tracking-wide">${escAttr(tournaments.label)}</span></button>`
    );
  }

  const categories = resolveCategoryNavItems(items);
  if (categories.length) {
    const list = categories
      .map(
        (item) =>
          `<li class="py-2 px-3 text-center"><a href="${escAttr(item.url)}" class="hover:text-blue-700 hover:border-blue-700 hover:rounded hover:border-b-4 font-medium capitalize text-center cat_class">${escAttr(item.label)}</a></li>`
      )
      .join("\n                                                    ");
    parts.push(
      `<div class="group relative cursor-pointer"><button class="font-medium border-b-4 border-white mx-1">More <i class="ml-1 fa-solid fa-chevron-down"></i></button><div class="absolute z-50 invisible group-hover:visible bg-white shadow min-w-max max-w-full"><ul class="py-1 px-1 text-gray-700" aria-labelledby="dropdownDefault">${list}</ul></div></div>`
    );
  }

  return parts.join("\n                ");
}

function buildFooterNavHtml(items) {
  const enabled = (items || []).filter((item) => item.enabled !== false);
  const parts = [];
  const allGames = enabled.find((item) => String(item.url || "").trim() === "/games");
  parts.push(
    `<a href="/games" class="block px-2 py-2 hover:underline text-theme-color font-medium text-[18px] capitalize">${escAttr(allGames?.label || "All Games")}</a>`
  );
  for (const item of resolveCategoryNavItems(items)) {
    parts.push(
      `<a href="${escAttr(item.url)}" class="block px-2 py-2 hover:underline text-theme-color font-medium text-[18px] capitalize">${escAttr(item.label)}</a>`
    );
  }
  return parts.join("\n                                ");
}

function resolveCategoryNavItems(items) {
  const navMap = new Map();
  for (const item of items || []) {
    const url = String(item.url || "").trim();
    if (!url.startsWith("/category/")) continue;
    navMap.set(url, item);
  }

  return NAV_CATEGORIES.map((category) => {
    const url = `/category/${category}`;
    const existing = navMap.get(url);
    return {
      label: String(existing?.label || category).trim() || category,
      url,
      enabled: existing ? existing.enabled !== false : true,
    };
  }).filter((item) => item.enabled !== false);
}

function buildFooterCreditLinksHtml(links) {
  if (!Array.isArray(links) || !links.length) return "";
  return links
    .filter((item) => String(item?.label || "").trim() && String(item?.url || "").trim())
    .map(
      (item) =>
        `<a href="${escAttr(item.url)}" target="_blank" rel="noopener" class="mr-4 hover:underline text-theme-color font-medium text-[14px] leading-[16px]">${escAttr(item.label)}</a>`
    )
    .join("\n                ");
}

function applyFooterCreditLinks(text, site) {
  const html = buildFooterCreditLinksHtml(site.footer_credit_links);
  if (!html) {
    return text.replace(/<div class="lg:block hidden text-center">[\s\S]*?<\/div>/, '<div class="lg:block hidden text-center">\n</div>');
  }
  if (text.includes('id="gc-footer-credits"')) {
    return text.replace(
      /<div class="lg:block hidden text-center" id="gc-footer-credits">[\s\S]*?<\/div>/,
      `<div class="lg:block hidden text-center" id="gc-footer-credits">\n                ${html}\n            </div>`
    );
  }
  return text.replace(
    /<div class="lg:block hidden text-center">\s*<\/div>/,
    `<div class="lg:block hidden text-center" id="gc-footer-credits">\n                ${html}\n            </div>`
  );
}

function applyNav(html, nav, site) {
  const items = nav?.items || [];
  if (!items.length) return html;

  let text = html;
  const desktopNav = buildDesktopNavHtml(items, site);
  text = text.replace(
    /(<div class="flex items-center justify-center 2xl:justify-start font-medium text-sm lg:text-lg color-\[#000\] capitalize whitespace-nowrap">)[\s\S]*?(<\/div>\s*\n\s*<div class="2xl:flex items-center hidden">)/,
    `$1\n                ${desktopNav}\n            $2`
  );

  const footerNav = buildFooterNavHtml(items);
  if (footerNav) {
    text = text.replace(
      /(<div class="flex flex-wrap justify-center font-medium text-\[18px\] color-\[#000\] capitalize w-\[80%\]">)[\s\S]*?(<\/div>\s*\n\s*<div class="flex flex-wrap justify-center w-\[80%\] py-4">)/,
      `$1\n                ${footerNav}\n                            $2`
    );
  }

  return text;
}

function buildAnalyticsHtml(analytics) {
  const ga4 = String(analytics?.ga4_id || "").trim();
  const googleAds = String(analytics?.google_ads_id || "").trim();
  if (!ga4 && !googleAds) return "";

  let scripts = `<script id="gc-analytics">window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());`;
  if (ga4) {
    scripts += `gtag('config','${escAttr(ga4)}');`;
  }
  if (googleAds) {
    scripts += `gtag('config','${escAttr(googleAds)}');`;
  }
  scripts += "</script>";

  if (ga4) {
    scripts =
      `<script async src="https://www.googletagmanager.com/gtag/js?id=${escAttr(ga4)}"></script>\n    ${scripts}`;
  }

  return scripts;
}

function applyCustomCode(html, code) {
  let text = html;
  const headCode = String(code?.head_code || "").trim();
  const bodyCode = String(code?.body_code || "").trim();
  const footerCode = String(code?.footer_code || "").trim();
  const customCss = String(code?.custom_css || "").trim();

  if (customCss && !text.includes("gc-custom-css")) {
    text = text.replace("</head>", `    <style id="gc-custom-css">\n${customCss}\n    </style>\n</head>`);
  }
  if (headCode && !text.includes("gc-head-code")) {
    text = text.replace("</head>", `    <div id="gc-head-code">${headCode}</div>\n</head>`);
  }
  if (bodyCode && !text.includes("gc-body-code")) {
    text = text.replace(/<body([^>]*)>/i, `<body$1>\n    <div id="gc-body-code">${bodyCode}</div>`);
  }
  if (footerCode && !text.includes("gc-footer-code")) {
    text = text.replace("</body>", `    <div id="gc-footer-code">${footerCode}</div>\n</body>`);
  }

  return text;
}

function buildHiddenGamesScript() {
  let hidden = [];
  try {
    hidden = require("./admin/games-store").loadHiddenGames();
  } catch {
    hidden = [];
  }
  if (!hidden.length) return "";
  const json = JSON.stringify(hidden);
  return `<script id="gc-hidden-games">(function(){var hidden=${json};function hideLinks(){hidden.forEach(function(slug){var enc=encodeURIComponent(slug);document.querySelectorAll('a[href="/view-game/'+enc+'"],a[href="/game/'+enc+'"]').forEach(function(a){var card=a.closest(".gc-custom-game")||a.closest(".md\\:col-span-2")||a.closest(".md\\:col-span-3")||a.closest(".col-span-2")||a.closest(".col-span-3");if(card){card.remove();return;}var row=a.closest("tr");if(row){row.remove();return;}a.style.display="none";});});}document.addEventListener("DOMContentLoaded",hideLinks);})();</script>`;
}

function buildCustomGamesScript() {
  let games = [];
  try {
    games = require("./admin/games-store").listCustomGamesForSite();
  } catch {
    games = [];
  }
  if (!games.length) return "";

  const json = JSON.stringify(games);
  return `<script id="gc-custom-games">(function(){var games=${json};function cardHtml(game,isLandscape){var url="/view-game/"+encodeURIComponent(game.slug);var img=isLandscape?(game.thumbnail_landscape_16_9||game.thumbnail_squere):(game.thumbnail_squere||game.thumbnail_landscape_16_9);var title=game.title||game.slug;if(isLandscape){return '<div class="md:col-span-3 col-span-2 gc-custom-game"><div class="group relative w-full aspect-[16/9]"><div class="absolute inset-0"><a href="'+url+'"><img src="'+img+'" class="w-full object-cover rounded-2xl" alt="'+title+'" /></a></div><a href="'+url+'"><div class="hidden md:visible bg-game-landscape absolute inset-0 md:flex flex-col gap-2 items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100"><img class="-mt-1 group-hover:translate-y-0 translate-y-6 transition-transform duration-300 p-0 mx-auto block aspect-1/1 object-fill w-[30%]" src="'+(game.thumbnail_squere||img)+'" alt="'+title+'" /><button class="animatedPlayBtn group-hover:translate-y-0 translate-y-6 transition-transform duration-300 capitalize bg-light-theme-color font-semibold text-white rounded-full px-5 py-1">Play <i class="fa-regular fa-circle-play"></i></button></div></a><h3 class="text-left font-medium pl-2 pb-4 mt-1">'+title+'</h3></div></div>';}return '<div class="md:col-span-2 col-span-3 gc-custom-game"><a href="'+url+'"><div class="group relative"><img src="'+img+'" class="w-full object-cover rounded-lg aspect-square transition-transform scale-1 hover:scale-105" alt="'+title+'" /></div></a></div>';}function inject(){var existing=new Set(Array.from(document.querySelectorAll('a[href^="/view-game/"]')).map(function(a){return a.getAttribute("href");}));var fresh=games.filter(function(g){return existing.has("/view-game/"+encodeURIComponent(g.slug))===false;});if(!fresh.length)return;var allGames=document.getElementById("all-games-list");if(allGames){fresh.forEach(function(game){allGames.insertAdjacentHTML("afterbegin",cardHtml(game,true));});return;}document.querySelectorAll(".grid.md\\:grid-cols-12").forEach(function(grid){if(grid.querySelector(".gc-custom-game"))return;if(grid.closest("footer"))return;fresh.slice(0,4).forEach(function(game){grid.insertAdjacentHTML("afterbegin",cardHtml(game,false));});});}document.addEventListener("DOMContentLoaded",inject);})();</script>`;
}

function buildSiteRuntimeScript(site) {
  const config = {
    homepage_most_popular: site.homepage_most_popular !== false,
    homepage_categories: site.homepage_categories !== false,
    homepage_recent: site.homepage_recent !== false,
  };
  if (config.homepage_most_popular && config.homepage_categories && config.homepage_recent) {
    return "";
  }
  const json = JSON.stringify(config);
  return `<script id="gc-site-runtime">(function(){var c=${json};function hideHeaderSection(h){var row=h.closest(".w-full.flex.items-center");if(!row)return;var grid=row.nextElementSibling;row.style.display="none";if(grid)grid.style.display="none";}function applySections(){document.querySelectorAll("h3").forEach(function(h){var t=h.textContent.trim().toLowerCase();if(!c.homepage_most_popular&&t==="most popular")hideHeaderSection(h);if(!c.homepage_categories&&t==="new arrival")hideHeaderSection(h);if(!c.homepage_recent&&t.indexOf("recent")>=0)hideHeaderSection(h);});}document.addEventListener("DOMContentLoaded",applySections);if(!c.homepage_recent){new MutationObserver(applySections).observe(document.body,{childList:true,subtree:true});}})();</script>`;
}

function applySiteConfigToHtml(html, site) {
  return applyAdminConfigToHtml(html, { site, nav: {}, code: {}, analytics: {} });
}

function getConfigVersion() {
  try {
    return String(Math.floor(fs.statSync(CONFIG_PATH).mtimeMs));
  } catch {
    return String(Date.now());
  }
}

function applyAdminConfigToHtml(html, config) {
  const site = config?.site || {};
  const nav = config?.nav || {};
  const code = config?.code || {};
  const analytics = config?.analytics || {};

  let text = String(html || "");
  const siteName = String(site.site_name || "GamesCandy").trim();
  const theme = colorValue.cssColor(String(site.theme_color || ""), colorValue.cssColor(String(site.primary_color || ""), "#6340F5"));
  const metaTitle = String(site.meta_title || siteName).trim();
  const metaDescription = String(site.meta_description || "").trim();
  const metaKeywords = String(site.meta_keywords || "").trim();
  const footerText =
    String(site.footer_text || "").trim() ||
    `Copyright @ ${String(site.copyright_year || new Date().getFullYear()).trim()} ${siteName}`;

  if (!text.includes("/site-theme.css")) {
    const themeHref = `/site-theme.css?v=${getConfigVersion()}`;
    text = text.replace(
      /<link rel="stylesheet" type="text\/css" href="\/css\/style\.css">/i,
      `<link rel="stylesheet" type="text/css" href="/css/style.css">\n    <link rel="stylesheet" href="${themeHref}">`
    );
    if (!text.includes("/site-theme.css")) {
      text = text.replace("</head>", `    <link rel="stylesheet" href="${themeHref}">\n</head>`);
    }
  } else {
    text = text.replace(/\/site-theme\.css(\?v=[^"']*)?/g, `/site-theme.css?v=${getConfigVersion()}`);
  }

  text = text.replace(/<meta name="theme-color" content="[^"]*">/gi, `<meta name="theme-color" content="${theme}">`);
  text = text.replace(/<meta name="msapplication-TileColor" content="[^"]*">/gi, `<meta name="msapplication-TileColor" content="${theme}">`);
  text = text.replace(/<link rel="mask-icon" href="[^"]*" color="[^"]*">/gi, `<link rel="mask-icon" href="/safari-pinned-tab.svg" color="${theme}">`);

  if (metaTitle) {
    text = text.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escAttr(metaTitle)}</title>`);
    text = replaceMetaByProperty(text, "og:title", metaTitle);
  }
  if (metaDescription) {
    text = replaceMetaByName(text, "description", metaDescription);
    text = replaceMetaByProperty(text, "og:description", metaDescription);
  }
  if (metaKeywords) {
    text = replaceMetaByName(text, "keywords", metaKeywords);
  }

  const logoDesktop = String(site.logo_desktop || "/images/logo.svg").trim();
  const logoMobile = String(site.logo_mobile || "/images/logo_mobile.svg").trim();
  text = text.replace(/(<img src=")\/images\/logo\.svg/gi, `$1${logoDesktop}`);
  text = text.replace(/(<img src=")\/images\/logo_mobile\.svg/gi, `$1${logoMobile}`);
  text = text.replace(/alt="GamesCandy Logo"/gi, `alt="${escAttr(siteName)} Logo"`);

  if (site.favicon) {
    text = text.replace(/<link rel="shortcut icon" href="[^"]*">/i, `<link rel="shortcut icon" href="${escAttr(site.favicon)}">`);
  }

  if (site.home_hero_title) {
    text = text.replace(/(<h3 class="text-\[24px\][^>]*>)(Most Popular|Featured|Popular Games)(<\/h3>)/i, `$1${site.home_hero_title}$3`);
  }

  text = text.replace(/Copyright @ \d{4}[^<]*/gi, footerText);
  text = text.replace(/©\s*\d{4}\s*GamesCandy[^<]*/gi, footerText);

  text = applyFooterCreditLinks(text, site);
  text = applyNav(text, nav, site);
  text = applyCustomCode(text, code);

  const analyticsHtml = buildAnalyticsHtml(analytics);
  if (analyticsHtml && !text.includes("gc-analytics")) {
    text = text.replace("</head>", `    ${analyticsHtml}\n</head>`);
  }

  const runtime = buildSiteRuntimeScript(site);
  if (runtime && !text.includes("gc-site-runtime")) {
    text = text.replace("</body>", `${runtime}\n</body>`);
  }

  const customGamesScript = buildCustomGamesScript();
  if (customGamesScript && !text.includes("gc-custom-games")) {
    text = text.replace("</body>", `${customGamesScript}\n</body>`);
  }

  const hiddenGamesScript = buildHiddenGamesScript();
  if (hiddenGamesScript && !text.includes("gc-hidden-games")) {
    text = text.replace("</body>", `${hiddenGamesScript}\n</body>`);
  }

  text = siteAds.applyAdsToHtml(text, config);
  text = siteAuth.applyAuthToHtml(text);
  text = contactPage.applyContactPage(text, site);
  text = privacyPage.applyPrivacyPage(text, site);
  text = categorySort.applyCategorySort(text);
  text = siteSearch.applySiteSearch(text);

  return text;
}

module.exports = {
  loadFullConfig,
  loadSiteConfig,
  buildThemeCss,
  applySiteConfigToHtml,
  applyAdminConfigToHtml,
  getConfigVersion,
  normalizeHex,
};
