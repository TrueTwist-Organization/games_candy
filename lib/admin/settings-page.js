const adminSettings = require("./admin-settings");

function renderSettingsPage(escapeHtml, options = {}) {
  const overview = adminSettings.getOverview();
  const gameCount = Number(options.gameCount || 0);
  const message = String(options.message || "").trim();
  const error = String(options.error || "").trim();

  const banner = error
    ? `<div class="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-2">${escapeHtml(error)}</div>`
    : message
      ? `<div class="mb-4 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-2">${escapeHtml(message)}</div>`
      : "";

  const publishedAt = overview.published_at
    ? new Date(overview.published_at).toLocaleString("en-US")
    : "Not published yet";
  const passwordUpdated = overview.password_updated_at
    ? new Date(overview.password_updated_at).toLocaleString("en-US")
    : overview.uses_custom_password
      ? "Updated"
      : "Default password in use";

  return `${banner}
<div class="grid gap-4 lg:grid-cols-2">
  <div class="gc-admin-card border border-slate-200 rounded-xl bg-white p-6 shadow-sm">
    <h2 class="font-bold text-lg mb-1">Site overview</h2>
    <p class="text-xs text-slate-500 mb-4">Quick details about your public site and admin data.</p>
    <dl class="grid gap-3 text-sm">
      <div class="flex justify-between border-b border-slate-100 pb-2 gap-4">
        <dt class="text-slate-500 shrink-0">Site name</dt>
        <dd class="font-medium text-right">${escapeHtml(overview.site_name)}</dd>
      </div>
      <div class="flex justify-between border-b border-slate-100 pb-2 gap-4">
        <dt class="text-slate-500 shrink-0">Total games</dt>
        <dd class="font-medium text-right">${escapeHtml(String(gameCount))}</dd>
      </div>
      <div class="flex justify-between border-b border-slate-100 pb-2 gap-4">
        <dt class="text-slate-500 shrink-0">Last published</dt>
        <dd class="font-medium text-right">${escapeHtml(publishedAt)}</dd>
      </div>
      <div class="flex justify-between border-b border-slate-100 pb-2 gap-4">
        <dt class="text-slate-500 shrink-0">Password status</dt>
        <dd class="font-medium text-right">${escapeHtml(passwordUpdated)}</dd>
      </div>
      <div class="flex justify-between pb-1 gap-4">
        <dt class="text-slate-500 shrink-0">Public site</dt>
        <dd class="text-right"><a class="text-blue-600 hover:text-blue-800 font-medium" href="/home" target="_blank" rel="noopener">Open GamesCandy</a></dd>
      </div>
    </dl>
  </div>

  <div class="gc-admin-card border border-slate-200 rounded-xl bg-white p-6 shadow-sm">
    <h2 class="font-bold text-lg mb-1">Change admin password</h2>
    <p class="text-xs text-slate-500 mb-4">Update the password used to sign in to this admin panel.</p>
    <form method="post" action="/admin/settings" class="space-y-3">
      <input type="hidden" name="action" value="change_password">
      <div>
        <label class="block text-xs font-semibold text-slate-600 mb-1">Current password</label>
        <input type="password" name="current_password" autocomplete="current-password" required class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
      </div>
      <div>
        <label class="block text-xs font-semibold text-slate-600 mb-1">New password</label>
        <input type="password" name="new_password" autocomplete="new-password" minlength="6" required class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
      </div>
      <div>
        <label class="block text-xs font-semibold text-slate-600 mb-1">Confirm new password</label>
        <input type="password" name="confirm_password" autocomplete="new-password" minlength="6" required class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
      </div>
      <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg px-4 py-2 text-sm">Save new password</button>
    </form>
  </div>
</div>

<div class="gc-admin-card border border-slate-200 rounded-xl bg-white p-6 shadow-sm mt-4">
  <h2 class="font-bold text-lg mb-1">Backup &amp; download</h2>
  <p class="text-xs text-slate-500 mb-4">Download your site settings and admin data for backup or migration.</p>
  <div class="gc-admin-backup-actions flex flex-wrap gap-3">
    <a href="/admin/settings/backup/full" class="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Download full backup</a>
    <a href="/admin/settings/backup/config" class="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Download site config</a>
    <a href="/admin/settings/backup/custom-games" class="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Download custom games</a>
  </div>
  <p class="text-xs text-slate-400 mt-3">Full backup includes site config, custom games, hidden games, users, analytics, and admin settings.</p>
</div>`;
}

function handleSettingsPost(req) {
  const action = String(req.body?.action || "").trim();
  if (action !== "change_password") {
    throw new Error("Unknown settings action.");
  }
  adminSettings.changePassword(
    req.body?.current_password,
    req.body?.new_password,
    req.body?.confirm_password
  );
}

function sendBackup(res, filename, payload) {
  const stamp = new Date().toISOString().slice(0, 10);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}-${stamp}.json"`);
  res.send(JSON.stringify(payload, null, 2));
}

function handleBackupDownload(req, res, type) {
  if (type === "config") {
    return sendBackup(res, "gamescandy-site-config", adminSettings.buildConfigBackup());
  }
  if (type === "custom-games") {
    return sendBackup(res, "gamescandy-custom-games", adminSettings.buildCustomGamesBackup());
  }
  return sendBackup(res, "gamescandy-full-backup", adminSettings.buildBackupPayload());
}

module.exports = {
  renderSettingsPage,
  handleSettingsPost,
  handleBackupDownload,
};
