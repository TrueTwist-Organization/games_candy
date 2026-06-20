const express = require("express");
const crypto = require("crypto");
const path = require("path");
const gamesCatalog = require("./games-catalog");
const analytics = require("./analytics-store");
const adminConfig = require("./admin-config");
const adminPages = require("./admin-pages");
const analyticsPage = require("./analytics-page");
const addGamePage = require("./add-game-page");
const editGamePage = require("./edit-game-page");
const settingsPage = require("./settings-page");
const adminSettings = require("./admin-settings");
const gamesStore = require("./games-store");
const imageUpload = require("./image-upload");

const siteUpload = imageUpload.createUploadMiddleware("site");
const gameUpload = imageUpload.createUploadMiddleware("games");

const ADMIN_COOKIE = "gc_admin_auth";
const ADMIN_SECRET = process.env.ADMIN_SECRET || "gamescandy-local-admin-secret";

const router = express.Router();
const games = gamesCatalog.getAllGames();
analytics.seedDemoData(games);

router.use("/assets", express.static(path.join(__dirname, "../../admin/assets")));

function uploadErrorMessage(err) {
  return err instanceof Error ? err.message : "Upload failed.";
}

function siteUploadMiddleware(req, res, next) {
  siteUpload.fields(imageUpload.siteUploadFields())(req, res, (err) => {
    if (err) {
      return res.send(
        wonderLayout(
          "site",
          `<div class="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-2">${escapeHtml(uploadErrorMessage(err))}</div>${adminPages.renderSitePage(escapeHtml)}`
        )
      );
    }
    next();
  });
}

function gameUploadMiddleware(req, res, next) {
  const slug =
    String(req.body?.slug || "").trim() ||
    gamesStore.slugify(String(req.body?.title || "").trim()) ||
    "new";
  req.uploadSlug = slug;
  gameUpload.fields(imageUpload.gameUploadFields())(req, res, (err) => {
    if (err) {
      req.uploadError = uploadErrorMessage(err);
    }
    next();
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-US");
}

function formatDuration(ms) {
  const seconds = Math.max(0, Math.round(Number(ms || 0) / 1000));
  const minutes = Math.floor(seconds / 60);
  const rem = seconds % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  }
  return `${minutes}m ${rem}s`;
}

function signToken() {
  return crypto.createHmac("sha256", ADMIN_SECRET).update("admin").digest("hex");
}

function parseCookies(header = "") {
  return header.split(";").reduce((cookies, part) => {
    const [key, ...rest] = part.trim().split("=");
    if (key) cookies[key] = decodeURIComponent(rest.join("="));
    return cookies;
  }, {});
}

function isLoggedIn(req) {
  const cookies = parseCookies(req.headers.cookie || "");
  return cookies[ADMIN_COOKIE] === signToken();
}

function setLoginCookie(res) {
  res.setHeader(
    "Set-Cookie",
    `${ADMIN_COOKIE}=${signToken()}; Path=/admin; Max-Age=${7 * 24 * 60 * 60}; HttpOnly; SameSite=Lax`
  );
}

function clearLoginCookie(res) {
  res.setHeader("Set-Cookie", `${ADMIN_COOKIE}=; Path=/admin; Max-Age=0; HttpOnly; SameSite=Lax`);
}

function requireLogin(req, res, next) {
  if (isLoggedIn(req)) return next();
  return res.redirect("/admin/");
}

function navClass(key, active) {
  return key === active ? "font-semibold text-slate-900" : "text-slate-600 hover:text-slate-900";
}

function mobileNavClass(key, active) {
  return key === active
    ? "gc-admin-nav-active"
    : "text-slate-600 hover:bg-slate-50";
}

function adminNavItems() {
  return [
    ["games", "Games", "/admin/games"],
    ["ads", "Ads", "/admin/ads"],
    ["analytics", "Analytics", "/admin/analytics"],
    ["site", "Site", "/admin/site"],
    ["nav", "Nav", "/admin/nav"],
    ["code", "Code", "/admin/code"],
  ];
}

function renderFlags(flags = []) {
  if (!flags.length) return `<span class="text-slate-300">—</span>`;
  return flags
    .map((flag) => {
      if (flag === "hot") {
        return `<span class="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-700 mr-1">hot</span>`;
      }
      if (flag === "trending") {
        return `<span class="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-700 mr-1">trending</span>`;
      }
      if (flag === "new") {
        return `<span class="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700 mr-1">new</span>`;
      }
      return "";
    })
    .join("");
}

function wonderHeader(active, gameCount) {
  const nav = adminNavItems()
    .map(
      ([key, label, href]) =>
        `<a href="${href}" class="${navClass(key, active)}">${label}</a>`
    )
    .join("");
  const mobileNav = adminNavItems()
    .map(
      ([key, label, href]) =>
        `<a href="${href}" class="${mobileNavClass(key, active)}">${label}</a>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>GamesCandy Admin</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="/admin/assets/admin.css">
</head>
<body class="gc-admin-body bg-slate-50 text-slate-800 min-h-screen">
<header class="gc-admin-header border-b border-slate-200">
  <div class="max-w-[1400px] mx-auto px-4">
    <div class="flex items-center justify-between gap-2 py-3">
      <div class="flex items-center gap-2 min-w-0">
        <button type="button" id="gc-admin-menu-btn" class="gc-admin-menu-btn lg:hidden" aria-expanded="false" aria-controls="gc-admin-mobile-nav" aria-label="Open admin menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
        </button>
        <div class="flex items-center gap-2 font-bold text-base min-w-0">
          <span class="text-xl leading-none shrink-0" aria-hidden="true">🎮</span>
          <span class="truncate">GamesCandy Admin</span>
        </div>
      </div>
      <span class="text-slate-500 text-sm whitespace-nowrap lg:hidden">${formatNumber(gameCount)} games</span>
      <div class="gc-admin-desktop-nav flex flex-wrap items-center gap-x-4 gap-y-1 text-sm flex-1 min-w-0 px-2">
        <span class="text-slate-500 whitespace-nowrap">${formatNumber(gameCount)} games</span>
        ${nav}
      </div>
      <div class="gc-admin-mobile-quick flex items-center gap-2 shrink-0">
        <a href="/admin/games/add" class="bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg px-2.5 py-1.5 text-xs sm:text-sm">+ Add</a>
      </div>
      <div class="gc-admin-desktop-actions flex flex-wrap items-center gap-2 text-sm shrink-0">
        <a href="/admin/games/add" class="bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg px-3 py-1.5">+ Add game</a>
        <form method="post" action="/admin/publish" class="inline">
          <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg px-3 py-1.5 inline-flex items-center gap-1"><span aria-hidden="true">☁</span> Publish</button>
        </form>
        <a href="/admin/settings" class="text-slate-600 hover:text-slate-900 px-1">Settings</a>
        <a href="/admin/logout" class="text-slate-600 hover:text-slate-900 px-1">Logout</a>
      </div>
    </div>
    <nav id="gc-admin-mobile-nav" class="gc-admin-mobile-nav" aria-label="Admin navigation">
      ${mobileNav}
      <div class="gc-admin-mobile-actions">
        <a href="/admin/games/add" class="bg-green-600 hover:bg-green-700 text-white font-semibold">+ Add game</a>
        <form method="post" action="/admin/publish">
          <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold inline-flex items-center gap-1"><span aria-hidden="true">☁</span> Publish</button>
        </form>
        <a href="/admin/settings" class="text-slate-600 hover:bg-slate-50">Settings</a>
        <a href="/admin/logout" class="text-slate-600 hover:bg-slate-50">Logout</a>
      </div>
    </nav>
  </div>
</header>
<main class="gc-admin-main max-w-[1400px] mx-auto py-4">`;
}

function wonderFooter() {
  return `</main><script src="/admin/assets/admin-mobile.js"></script></body></html>`;
}

function wonderLayout(active, body) {
  const allGames = gamesCatalog.getAllGames();
  return wonderHeader(active, allGames.length) + body + wonderFooter();
}

function gamesToolbar(queryRaw = "") {
  const q = String(queryRaw || "").trim();
  const clearHidden = q ? "" : " hidden";
  return `<div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-3">
    <form id="gc-games-search-form" method="get" action="/admin/games" class="gc-admin-toolbar-form flex flex-1 max-w-2xl gap-2">
      <div class="relative flex-1 min-w-0">
        <input id="gc-games-search" type="search" name="q" value="${escapeHtml(q)}" autocomplete="off" spellcheck="false" placeholder="Search by title, slug, category, genre..." class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
        <div id="gc-games-suggest" class="hidden absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden max-h-64 overflow-y-auto"></div>
      </div>
      <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg px-4 py-2 text-sm whitespace-nowrap">Search</button>
      <button type="button" id="gc-games-clear" class="border border-slate-300 rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 whitespace-nowrap${clearHidden}">Clear</button>
    </form>
    <div class="gc-admin-toolbar-extra shrink-0">
      <button type="button" class="bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg px-4 py-2 text-sm inline-flex items-center justify-center gap-2 w-full lg:w-auto">
        <span aria-hidden="true">↻</span> Re-scrape from competitor
      </button>
    </div>
  </div>`;
}

function gamesSearchScript() {
  return `<script src="/admin/assets/games-search.js"></script>`;
}

function loginPage(error = "") {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>GamesCandy Admin</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="/admin/assets/admin.css">
</head>
<body class="gc-admin-body bg-slate-100 text-slate-800 min-h-screen">
  <div class="gc-admin-login-wrap max-w-sm mx-auto mt-24 bg-white rounded-xl shadow p-8">
    <h1 class="text-xl font-bold mb-1">GamesCandy Admin</h1>
    <p class="text-sm text-slate-500 mb-6">Sign in to manage games.</p>
    ${error ? `<div class="mb-4 text-sm text-red-600">${escapeHtml(error)}</div>` : ""}
    <form method="post" action="/admin/">
      <input type="hidden" name="action" value="login">
      <label class="block text-xs font-semibold mb-1">Password</label>
      <input type="password" name="password" autofocus class="w-full border rounded-lg px-3 py-2 mb-4" required>
      <button class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg py-2">Sign in</button>
    </form>
  </div>
</body></html>`;
}

function renderLogin(req, res) {
  if (isLoggedIn(req)) return res.redirect("/admin/games");
  return res.send(loginPage());
}

function handleLogin(req, res) {
  const password = String(req.body.password || "");
  if (!adminSettings.verifyPassword(password)) {
    return res.status(401).send(loginPage("Incorrect password."));
  }
  setLoginCookie(res);
  return res.redirect("/admin/games");
}

function renderGames(req, res) {
  const queryRaw = String(req.query.q || "").trim();
  const allGames = gamesCatalog.getAllGames();

  let banner = "";
  if (req.query.published === "1") {
    banner = `<div class="mb-4 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-2">Site published successfully. All admin changes are now live on the public site.</div>`;
  } else if (req.query.added === "1") {
    banner = `<div class="mb-4 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-2">Game added and published successfully. It is live on your site now.</div>`;
  } else if (req.query.updated === "1") {
    banner = `<div class="mb-4 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-2">Game updated and published successfully.</div>`;
  } else if (req.query.deleted === "1") {
    banner = `<div class="mb-4 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-2">Game deleted successfully.</div>`;
  } else if (req.query.error) {
    banner = `<div class="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-2">${escapeHtml(String(req.query.error))}</div>`;
  }

  const rows = allGames
    .map((game) => {
      const thumb = game.thumb
        ? `<img src="${escapeHtml(game.thumb)}" alt="" class="w-10 h-10 rounded object-cover bg-slate-100">`
        : `<div class="w-10 h-10 rounded bg-slate-100"></div>`;
      const searchHaystack = escapeHtml(gamesCatalog.gameSearchHaystack(game));
      return `<tr class="gc-game-row hover:bg-slate-50/70" data-search="${searchHaystack}" data-title="${escapeHtml(game.title)}" data-category="${escapeHtml(game.category)}">
        <td class="px-4 py-3">${thumb}</td>
        <td class="px-4 py-3">
          <div class="font-semibold text-slate-900">${escapeHtml(game.title)}</div>
          <div class="text-xs text-slate-400 mt-0.5">${escapeHtml(game.slug_path)}</div>
        </td>
        <td class="px-4 py-3"><span class="font-semibold">${escapeHtml(game.category)}</span><span class="text-slate-400"> / </span><span>${escapeHtml(game.genre)}</span></td>
        <td class="px-4 py-3 font-medium">${escapeHtml(game.score)}</td>
        <td class="px-4 py-3">${renderFlags(game.flags)}</td>
        <td class="px-4 py-3 gc-admin-inline-actions whitespace-nowrap">
          <a href="/admin/games/edit?slug=${encodeURIComponent(game.slug)}" class="text-blue-600 hover:text-blue-800 font-medium">Edit</a>
          <span class="text-slate-300 mx-1">|</span>
          <form method="post" action="/admin/games/delete" class="inline" onsubmit="return confirm('Delete this game from your site?');">
            <input type="hidden" name="slug" value="${escapeHtml(game.slug)}">
            <button type="submit" class="text-red-600 hover:text-red-800 font-medium">Delete</button>
          </form>
        </td>
      </tr>`;
    })
    .join("");

  const body = `${banner}${gamesToolbar(queryRaw)}
    <div class="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <div class="gc-admin-table-wrap overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
            <tr>
              <th class="text-left px-4 py-3 font-semibold w-16">Thumb</th>
              <th class="text-left px-4 py-3 font-semibold">Title</th>
              <th class="text-left px-4 py-3 font-semibold">Cat / Genre</th>
              <th class="text-left px-4 py-3 font-semibold w-20">Score</th>
              <th class="text-left px-4 py-3 font-semibold w-40">Flags</th>
              <th class="text-left px-4 py-3 font-semibold w-28">Actions</th>
            </tr>
          </thead>
          <tbody id="gc-games-tbody" class="divide-y divide-slate-100">${rows}
            <tr id="gc-games-empty" class="hidden">
              <td colspan="6" class="px-4 py-10 text-center text-slate-500">No games found for <span id="gc-games-empty-query" class="font-medium text-slate-700"></span>. Try a different title, slug, or category.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <p id="gc-games-count" class="text-xs text-slate-400 mt-3"></p>
    <span id="gc-games-total" data-total="${allGames.length}" class="hidden"></span>
    ${gamesSearchScript()}`;

  res.send(wonderLayout("games", body));
}

function renderAds(req, res) {
  res.send(wonderLayout("ads", adminPages.renderAdsPage(escapeHtml, req.query)));
}

function handleAdsPost(req, res) {
  if (req.body.save_ads_txt !== undefined) {
    adminConfig.saveAdsTxt(req.body.ads_txt);
  } else {
    adminConfig.saveAds(req.body);
  }
  return res.redirect("/admin/ads?saved=1");
}

function renderSite(req, res) {
  res.send(wonderLayout("site", adminPages.renderSitePage(escapeHtml, req.query)));
}

function handleSitePost(req, res) {
  const body = imageUpload.applyImageFields(req.body, req.files, imageUpload.SITE_IMAGE_FIELDS);
  adminConfig.saveSite(body);
  adminConfig.publishSite();
  return res.redirect("/admin/site?saved=1");
}

function renderNav(req, res) {
  res.send(wonderLayout("nav", adminPages.renderNavPage(escapeHtml, req.query)));
}

function handleNavPost(req, res) {
  adminConfig.saveNav(req.body);
  return res.redirect("/admin/nav?saved=1");
}

function renderCode(req, res) {
  res.send(wonderLayout("code", adminPages.renderCodePage(escapeHtml, req.query)));
}

function handleCodePost(req, res) {
  adminConfig.saveCode(req.body);
  return res.redirect("/admin/code?saved=1");
}

function renderAnalytics(req, res) {
  const body = analyticsPage.renderAnalyticsPage(req, { escapeHtml, formatNumber, formatDuration });
  res.send(wonderLayout("analytics", body));
}

function renderAddGame(req, res) {
  res.send(wonderLayout("games", addGamePage.renderAddGamePage(escapeHtml, req.query)));
}

function handleAddGamePost(req, res) {
  if (req.uploadError) {
    return res.send(wonderLayout("games", addGamePage.renderAddGamePage(escapeHtml, {}, req.uploadError, req.body || {})));
  }
  try {
    const body = imageUpload.applyImageFields(req.body, req.files, imageUpload.GAME_IMAGE_FIELDS);
    gamesStore.addGame(body);
    adminConfig.publishSite();
    return res.redirect("/admin/games?added=1");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not add game.";
    res.send(wonderLayout("games", addGamePage.renderAddGamePage(escapeHtml, {}, message, req.body || {})));
  }
}

function renderEditGame(req, res) {
  const slug = String(req.query.slug || req.params.slug || "").trim();
  if (!slug) return res.redirect("/admin/games");
  try {
    const values = gamesStore.getGameEditData(slug);
    res.send(wonderLayout("games", editGamePage.renderEditGamePage(escapeHtml, slug, req.query, "", values)));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Game not found.";
    res.send(wonderLayout("games", `<div class="rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-2">${escapeHtml(message)}</div><p class="mt-4"><a href="/admin/games" class="text-blue-600">Back to games</a></p>`));
  }
}

function handleEditGamePost(req, res) {
  const slug = String(req.body.slug || "").trim();
  if (!slug) return res.redirect("/admin/games");
  if (req.uploadError) {
    let values = req.body || {};
    try {
      values = { ...gamesStore.getGameEditData(slug), ...values };
    } catch {
      // keep posted values
    }
    return res.send(wonderLayout("games", editGamePage.renderEditGamePage(escapeHtml, slug, {}, req.uploadError, values)));
  }
  try {
    const body = imageUpload.applyImageFields(req.body, req.files, imageUpload.GAME_IMAGE_FIELDS);
    gamesStore.updateGame(slug, body);
    adminConfig.publishSite();
    return res.redirect("/admin/games?updated=1");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not update game.";
    let values = req.body || {};
    try {
      values = { ...gamesStore.getGameEditData(slug), ...values };
    } catch {
      // keep posted values
    }
    res.send(wonderLayout("games", editGamePage.renderEditGamePage(escapeHtml, slug, {}, message, values)));
  }
}

function handleDeleteGamePost(req, res) {
  const slug = String(req.body.slug || "").trim();
  if (!slug) return res.redirect("/admin/games");
  try {
    gamesStore.deleteGame(slug);
    adminConfig.publishSite();
    return res.redirect("/admin/games?deleted=1");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not delete game.";
    return res.redirect(`/admin/games?error=${encodeURIComponent(message)}`);
  }
}

function handlePublish(req, res) {
  adminConfig.publishSite();
  return res.redirect("/admin/games?published=1");
}

function renderSettings(req, res) {
  const count = gamesCatalog.getAllGames().length;
  const message =
    req.query.saved === "1"
      ? "Admin password updated successfully."
      : req.query.backup === "1"
        ? "Backup downloaded successfully."
        : "";
  const error = String(req.query.error || "").trim();
  const body = settingsPage.renderSettingsPage(escapeHtml, {
    gameCount: count,
    message,
    error,
  });
  res.send(wonderLayout("settings", body));
}

function handleSettingsPost(req, res) {
  try {
    settingsPage.handleSettingsPost(req);
    return res.redirect("/admin/settings?saved=1");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save settings.";
    return res.redirect(`/admin/settings?error=${encodeURIComponent(message)}`);
  }
}

function handleSettingsBackup(req, res, type) {
  settingsPage.handleBackupDownload(req, res, type);
}

router.get("/", renderLogin);
router.get("/index.php", renderLogin);
router.post("/", handleLogin);
router.post("/index.php", handleLogin);

router.get("/dashboard", requireLogin, (req, res) => res.redirect("/admin/games"));
router.get("/dashboard.php", requireLogin, (req, res) => res.redirect("/admin/games"));
router.get("/games", requireLogin, renderGames);
router.get("/games.php", requireLogin, renderGames);
router.get("/analytics", requireLogin, renderAnalytics);
router.get("/analytics.php", requireLogin, renderAnalytics);
router.post("/analytics", requireLogin, renderAnalytics);
router.post("/analytics.php", requireLogin, renderAnalytics);
router.get("/ads", requireLogin, renderAds);
router.get("/ads.php", requireLogin, renderAds);
router.post("/ads", requireLogin, handleAdsPost);
router.post("/ads.php", requireLogin, handleAdsPost);
router.get("/site", requireLogin, renderSite);
router.get("/site.php", requireLogin, renderSite);
router.post("/site", requireLogin, siteUploadMiddleware, handleSitePost);
router.post("/site.php", requireLogin, siteUploadMiddleware, handleSitePost);
router.get("/nav", requireLogin, renderNav);
router.get("/nav.php", requireLogin, renderNav);
router.post("/nav", requireLogin, handleNavPost);
router.post("/nav.php", requireLogin, handleNavPost);
router.get("/code", requireLogin, renderCode);
router.get("/code.php", requireLogin, renderCode);
router.post("/code", requireLogin, handleCodePost);
router.post("/code.php", requireLogin, handleCodePost);
router.get("/games/add", requireLogin, renderAddGame);
router.get("/games/add.php", requireLogin, renderAddGame);
router.post("/games/add", requireLogin, gameUploadMiddleware, handleAddGamePost);
router.post("/games/add.php", requireLogin, gameUploadMiddleware, handleAddGamePost);
router.get("/games/edit", requireLogin, renderEditGame);
router.get("/games/edit/:slug", requireLogin, renderEditGame);
router.get("/games/edit.php", requireLogin, renderEditGame);
router.post("/games/edit", requireLogin, gameUploadMiddleware, handleEditGamePost);
router.post("/games/edit.php", requireLogin, gameUploadMiddleware, handleEditGamePost);
router.post("/games/delete", requireLogin, handleDeleteGamePost);
router.post("/games/delete.php", requireLogin, handleDeleteGamePost);
router.post("/publish", requireLogin, handlePublish);
router.post("/publish.php", requireLogin, handlePublish);
router.get("/settings", requireLogin, renderSettings);
router.get("/settings.php", requireLogin, renderSettings);
router.post("/settings", requireLogin, handleSettingsPost);
router.post("/settings.php", requireLogin, handleSettingsPost);
router.get("/settings/backup/full", requireLogin, (req, res) => handleSettingsBackup(req, res, "full"));
router.get("/settings/backup/config", requireLogin, (req, res) => handleSettingsBackup(req, res, "config"));
router.get("/settings/backup/custom-games", requireLogin, (req, res) => handleSettingsBackup(req, res, "custom-games"));

router.get("/logout", (req, res) => {
  clearLoginCookie(res);
  res.redirect("/admin/");
});
router.get("/logout.php", (req, res) => {
  clearLoginCookie(res);
  res.redirect("/admin/");
});

module.exports = router;
