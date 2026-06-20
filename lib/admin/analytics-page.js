const adminConfig = require("./admin-config");
const analytics = require("./analytics-store");
const gamesCatalog = require("./games-catalog");

function parseInput(input) {
  const trimmed = String(input || "").trim();
  if (!trimmed) return { type: "none" };

  if (/G-[A-Z0-9]+/i.test(trimmed) || /AW-[0-9]+/i.test(trimmed) || /UA-[0-9-]+/i.test(trimmed)) {
    const ga4 = trimmed.match(/G-[A-Z0-9]+/i);
    const aw = trimmed.match(/AW-[0-9]+/i);
    return {
      type: "tracking",
      tracking_code: trimmed,
      ga4_id: ga4 ? ga4[0] : "",
      google_ads_id: aw ? aw[0] : "",
    };
  }

  const compact = trimmed.replace(/\s+/g, "").toUpperCase();
  if (/^G[0-9A-F]{4,}$/.test(compact)) {
    return { type: "user", user_id: compact };
  }

  if (/^\d+$/.test(trimmed)) {
    return { type: "game", game_id: trimmed };
  }

  if (/^G/i.test(compact)) {
    return { type: "user_search", search: compact };
  }

  return { type: "tracking", tracking_code: trimmed, ga4_id: "", google_ads_id: "" };
}

function renderSiteDashboard(analyticsConfig, escapeHtml, formatNumber, formatDuration) {
  const summary = analytics.summary();
  const topGames = analytics.topGames(10);
  const recent = analytics.recentPlays(15);
  const users = analytics.listAllUsers(20);
  const codeLabel = String(analyticsConfig.tracking_code || "").trim();
  const ga4 = analyticsConfig.ga4_id ? ` · GA4 ${escapeHtml(analyticsConfig.ga4_id)}` : "";
  const ads = analyticsConfig.google_ads_id ? ` · Ads ${escapeHtml(analyticsConfig.google_ads_id)}` : "";

  const topRows = topGames
    .map((row) => {
      const game = gamesCatalog.findByGameId(row.game_id);
      return `<tr>
        <td class="px-4 py-3">${escapeHtml(row.game_id)}</td>
        <td class="px-4 py-3">${escapeHtml(game?.title || row.game_slug || "-")}</td>
        <td class="px-4 py-3">${formatNumber(row.plays)}</td>
        <td class="px-4 py-3">${formatDuration(row.total_time_ms)}</td>
      </tr>`;
    })
    .join("");

  const recentRows = recent
    .map((row) => {
      const game = gamesCatalog.findByGameId(row.game_id);
      return `<tr>
        <td class="px-4 py-3"><a class="text-blue-600 hover:text-blue-800 font-medium" href="/admin/analytics?q=${encodeURIComponent(row.user_id)}">${escapeHtml(row.user_id)}</a></td>
        <td class="px-4 py-3">${escapeHtml(game?.title || row.game_slug || "-")}</td>
        <td class="px-4 py-3">${formatDuration(row.play_time_ms)}</td>
        <td class="px-4 py-3">${escapeHtml(row.created_at)}</td>
      </tr>`;
    })
    .join("");

  const userRows = users
    .map(
      (row) => `<tr>
        <td class="px-4 py-3"><a class="text-blue-600 hover:text-blue-800 font-medium" href="/admin/analytics?q=${encodeURIComponent(row.user_id)}">${escapeHtml(row.user_id)}</a></td>
        <td class="px-4 py-3">${formatNumber(row.total_plays)}</td>
        <td class="px-4 py-3">${formatDuration(row.total_time_ms)}</td>
        <td class="px-4 py-3">${escapeHtml(row.last_seen)}</td>
      </tr>`
    )
    .join("");

  return `<div class="border border-slate-200 rounded-xl bg-white p-6 mb-4">
    <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
      <h2 class="font-bold">Site Analytics</h2>
      ${codeLabel ? `<span class="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-medium">Tracking: ${escapeHtml(codeLabel)}</span>` : ""}
    </div>
    <p class="text-xs text-slate-500 mb-4">Live play data from your GamesCandy site${ga4}${ads}.</p>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="bg-slate-50 rounded-xl p-4 border border-slate-200"><div class="text-xs font-semibold text-slate-500 uppercase">Total Plays</div><div class="text-2xl font-bold text-indigo-600 mt-1">${formatNumber(summary.total_plays)}</div></div>
      <div class="bg-slate-50 rounded-xl p-4 border border-slate-200"><div class="text-xs font-semibold text-slate-500 uppercase">Total Users</div><div class="text-2xl font-bold text-indigo-600 mt-1">${formatNumber(summary.total_users)}</div></div>
      <div class="bg-slate-50 rounded-xl p-4 border border-slate-200"><div class="text-xs font-semibold text-slate-500 uppercase">Today Plays</div><div class="text-2xl font-bold text-indigo-600 mt-1">${formatNumber(summary.today_plays)}</div></div>
      <div class="bg-slate-50 rounded-xl p-4 border border-slate-200"><div class="text-xs font-semibold text-slate-500 uppercase">Total Play Time</div><div class="text-2xl font-bold text-indigo-600 mt-1">${formatDuration(summary.total_play_time_ms)}</div></div>
    </div>
    <h3 class="font-semibold text-sm mb-2">Top Games</h3>
    <div class="gc-admin-table-wrap overflow-x-auto border border-slate-200 rounded-lg mb-6"><table class="w-full text-sm"><thead class="bg-slate-50 text-xs uppercase text-slate-500"><tr><th class="text-left px-4 py-3 font-semibold">Game ID</th><th class="text-left px-4 py-3 font-semibold">Game</th><th class="text-left px-4 py-3 font-semibold">Plays</th><th class="text-left px-4 py-3 font-semibold">Play Time</th></tr></thead><tbody class="divide-y divide-slate-100">${topRows}</tbody></table></div>
    <h3 class="font-semibold text-sm mb-2">Recent Activity</h3>
    <div class="gc-admin-table-wrap overflow-x-auto border border-slate-200 rounded-lg mb-6"><table class="w-full text-sm"><thead class="bg-slate-50 text-xs uppercase text-slate-500"><tr><th class="text-left px-4 py-3 font-semibold">User ID</th><th class="text-left px-4 py-3 font-semibold">Game</th><th class="text-left px-4 py-3 font-semibold">Time</th><th class="text-left px-4 py-3 font-semibold">When</th></tr></thead><tbody class="divide-y divide-slate-100">${recentRows}</tbody></table></div>
    <h3 class="font-semibold text-sm mb-2">All Users</h3>
    <div class="gc-admin-table-wrap overflow-x-auto border border-slate-200 rounded-lg"><table class="w-full text-sm"><thead class="bg-slate-50 text-xs uppercase text-slate-500"><tr><th class="text-left px-4 py-3 font-semibold">User ID</th><th class="text-left px-4 py-3 font-semibold">Plays</th><th class="text-left px-4 py-3 font-semibold">Play Time</th><th class="text-left px-4 py-3 font-semibold">Last Seen</th></tr></thead><tbody class="divide-y divide-slate-100">${userRows}</tbody></table></div>
  </div>`;
}

function renderUserSection(userId, userData, escapeHtml, formatNumber, formatDuration) {
  if (!userData.summary.total_plays) {
    return `<div class="border border-slate-200 rounded-xl bg-white p-6 mb-4"><h2 class="font-bold mb-4">User Analytics: ${escapeHtml(userId)}</h2><p class="text-sm text-slate-500">No play data found for this user ID yet.</p></div>`;
  }

  const rows = userData.games
    .map((row) => {
      const game = gamesCatalog.findByGameId(row.game_id);
      return `<tr>
        <td class="px-4 py-3">${escapeHtml(row.game_id)}</td>
        <td class="px-4 py-3">${escapeHtml(game?.title || row.game_slug || "-")}</td>
        <td class="px-4 py-3">${formatNumber(row.plays)}</td>
        <td class="px-4 py-3">${formatDuration(row.total_time_ms)}</td>
        <td class="px-4 py-3">${escapeHtml(row.last_played)}</td>
      </tr>`;
    })
    .join("");

  return `<div class="border border-slate-200 rounded-xl bg-white p-6 mb-4">
    <h2 class="font-bold mb-4">User Analytics: ${escapeHtml(userId)}</h2>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div class="bg-slate-50 rounded-xl p-4 border border-slate-200"><div class="text-xs font-semibold text-slate-500 uppercase">Total Plays</div><div class="text-2xl font-bold text-indigo-600 mt-1">${formatNumber(userData.summary.total_plays)}</div></div>
      <div class="bg-slate-50 rounded-xl p-4 border border-slate-200"><div class="text-xs font-semibold text-slate-500 uppercase">Unique Games</div><div class="text-2xl font-bold text-indigo-600 mt-1">${formatNumber(userData.summary.unique_games)}</div></div>
      <div class="bg-slate-50 rounded-xl p-4 border border-slate-200"><div class="text-xs font-semibold text-slate-500 uppercase">Total Play Time</div><div class="text-2xl font-bold text-indigo-600 mt-1">${formatDuration(userData.summary.total_time_ms)}</div></div>
    </div>
    <div class="gc-admin-table-wrap overflow-x-auto border border-slate-200 rounded-lg"><table class="w-full text-sm"><thead class="bg-slate-50 text-xs uppercase text-slate-500"><tr><th class="text-left px-4 py-3 font-semibold">Game ID</th><th class="text-left px-4 py-3 font-semibold">Game</th><th class="text-left px-4 py-3 font-semibold">Plays</th><th class="text-left px-4 py-3 font-semibold">Play Time</th><th class="text-left px-4 py-3 font-semibold">Last Played</th></tr></thead><tbody class="divide-y divide-slate-100">${rows}</tbody></table></div>
  </div>`;
}

function hasTrackingCode(analyticsConfig) {
  return Boolean(
    String(analyticsConfig?.tracking_code || "").trim() ||
      String(analyticsConfig?.ga4_id || "").trim() ||
      String(analyticsConfig?.google_ads_id || "").trim()
  );
}

function renderAnalyticsPage(req, helpers) {
  const { escapeHtml, formatNumber, formatDuration } = helpers;
  const hasQueryParam = Object.prototype.hasOwnProperty.call(req.query, "q");
  const query = String(req.query.q ?? "").trim();
  const gameIdParam = String(req.query.game_id || "").trim();
  const parsed = parseInput(query);
  let analyticsConfig = adminConfig.load().analytics;
  let showSiteDashboard = false;
  let userId = "";
  let userData = null;
  let userResults = [];
  let gameId = gameIdParam;
  let gameSection = "";
  let statusMessage = "";

  if (hasQueryParam) {
    if (query === "") {
      adminConfig.clearAnalyticsCodes();
      adminConfig.publishSite();
      analyticsConfig = adminConfig.load().analytics;
      showSiteDashboard = false;
      statusMessage = "Tracking code removed from your site.";
    } else if (parsed.type === "tracking") {
      adminConfig.saveAnalyticsCodes(parsed.tracking_code, parsed.ga4_id, parsed.google_ads_id);
      adminConfig.publishSite();
      analyticsConfig = adminConfig.load().analytics;
      showSiteDashboard = true;
      statusMessage = "Tracking code saved and published to your site.";
    } else if (parsed.type === "user") {
      userId = parsed.user_id;
      userData = analytics.userAnalytics(userId);
      showSiteDashboard = false;
    } else if (parsed.type === "user_search") {
      userResults = analytics.searchUsers(parsed.search);
      showSiteDashboard = false;
    } else if (parsed.type === "game") {
      gameId = parsed.game_id;
    }
  } else if (query) {
    if (parsed.type === "user") {
      userId = parsed.user_id;
      userData = analytics.userAnalytics(userId);
      showSiteDashboard = false;
    } else if (parsed.type === "user_search") {
      userResults = analytics.searchUsers(parsed.search);
      showSiteDashboard = false;
    } else if (parsed.type === "game") {
      gameId = parsed.game_id;
    }
  }

  if (gameId) {
    const game = gamesCatalog.findByGameId(gameId);
    const users = analytics.gameAnalytics(gameId);
    const rows = users
      .map(
        (row) => `<tr>
          <td class="px-4 py-3"><a class="text-blue-600 hover:text-blue-800 font-medium" href="/admin/analytics?q=${encodeURIComponent(row.user_id)}">${escapeHtml(row.user_id)}</a></td>
          <td class="px-4 py-3">${formatNumber(row.plays)}</td>
          <td class="px-4 py-3">${formatDuration(row.total_time_ms)}</td>
          <td class="px-4 py-3">${escapeHtml(row.last_seen)}</td>
        </tr>`
      )
      .join("");
    gameSection = `<div class="border border-slate-200 rounded-xl bg-white p-6 mb-4"><h2 class="font-bold mb-4">Game Analytics: ${escapeHtml(game?.title || `Game #${gameId}`)}</h2><div class="gc-admin-table-wrap overflow-x-auto border border-slate-200 rounded-lg"><table class="w-full text-sm"><thead class="bg-slate-50 text-xs uppercase text-slate-500"><tr><th class="text-left px-4 py-3 font-semibold">User ID</th><th class="text-left px-4 py-3 font-semibold">Plays</th><th class="text-left px-4 py-3 font-semibold">Play Time</th><th class="text-left px-4 py-3 font-semibold">Last Seen</th></tr></thead><tbody class="divide-y divide-slate-100">${rows || "<tr><td class='px-4 py-3' colspan='4'>No data yet</td></tr>"}</tbody></table></div></div>`;
    showSiteDashboard = false;
  }

  const search = String(req.body.search || "").trim();
  if (search) {
    userResults = analytics.searchUsers(search);
    showSiteDashboard = false;
  }

  const inputValue = hasQueryParam ? query : String(analyticsConfig.tracking_code || "");

  const statusBanner = statusMessage
    ? `<div class="mb-4 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-2">${escapeHtml(statusMessage)}</div>`
    : "";

  let body = `${statusBanner}<div class="gc-admin-card border border-slate-200 rounded-xl bg-white p-6 mb-4">
    <h2 class="font-bold mb-1">Analytics</h2>
    <p class="text-xs text-slate-500 mb-4">Enter your tracking code for site stats, or a user ID for player details. Clear the field and click Show Analytics to remove tracking from your site.</p>
    <form class="gc-admin-analytics-form flex flex-wrap gap-3" method="get" action="/admin/analytics">
      <input type="text" name="q" value="${escapeHtml(inputValue)}" placeholder="Enter code" class="flex-1 min-w-[280px] border border-slate-300 rounded-lg px-3 py-2 text-sm">
      <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg px-4 py-2 text-sm">Show Analytics</button>
    </form>
  </div>`;

  if (showSiteDashboard) {
    body += renderSiteDashboard(analyticsConfig, escapeHtml, formatNumber, formatDuration);
  } else if (!userId && !gameId && !userResults.length && !statusMessage) {
    body += `<div class="border border-slate-200 rounded-xl bg-white p-6 mb-4"><p class="text-sm text-slate-500">Enter your Google Analytics tracking code above and click <strong>Show Analytics</strong> to view site stats. Clear the field and click again to remove tracking.</p></div>`;
  }

  if (userId) {
    body += renderUserSection(userId, userData, escapeHtml, formatNumber, formatDuration);
  }

  if (userResults.length) {
    const rows = userResults
      .map(
        (row) => `<tr>
          <td class="px-4 py-3"><a class="text-blue-600 hover:text-blue-800 font-medium" href="/admin/analytics?q=${encodeURIComponent(row.user_id)}">${escapeHtml(row.user_id)}</a></td>
          <td class="px-4 py-3">${formatNumber(row.total_plays)}</td>
          <td class="px-4 py-3">${formatDuration(row.total_time_ms)}</td>
          <td class="px-4 py-3">${escapeHtml(row.last_seen)}</td>
        </tr>`
      )
      .join("");
    body += `<div class="border border-slate-200 rounded-xl bg-white p-6 mb-4"><h2 class="font-bold mb-4">Matching Users</h2><div class="gc-admin-table-wrap overflow-x-auto border border-slate-200 rounded-lg"><table class="w-full text-sm"><thead class="bg-slate-50 text-xs uppercase text-slate-500"><tr><th class="text-left px-4 py-3 font-semibold">User ID</th><th class="text-left px-4 py-3 font-semibold">Plays</th><th class="text-left px-4 py-3 font-semibold">Play Time</th><th class="text-left px-4 py-3 font-semibold">Last Seen</th></tr></thead><tbody class="divide-y divide-slate-100">${rows}</tbody></table></div></div>`;
  }

  body += gameSection;
  body += `<p class="text-sm text-slate-500">Demo user IDs: <code class="text-xs bg-slate-100 px-2 py-1 rounded">G10001</code>, <code class="text-xs bg-slate-100 px-2 py-1 rounded">G10002</code>, <code class="text-xs bg-slate-100 px-2 py-1 rounded">G10003</code></p>`;

  return body;
}

module.exports = { renderAnalyticsPage, parseInput, hasTrackingCode };
