const adminConfig = require("./admin-config");
const { renderSitePage } = require("./site-page");

function savedBanner(query) {
  if (!query.saved) return "";
  return `<div class="mb-4 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-2">Saved successfully.</div>`;
}

function placementField(key, label, placement, escapeHtml) {
  const checked = placement.enabled ? "checked" : "";
  return `<label class="gc-admin-placement-row flex items-center gap-2 text-sm py-1.5">
    <input type="checkbox" name="placement_enabled[${escapeHtml(key)}]" value="1" ${checked} class="rounded border-slate-300 text-indigo-600">
    <span class="flex-1 min-w-0 text-slate-700">${escapeHtml(label)}</span>
    <input type="text" name="placement_code[${escapeHtml(key)}]" value="${escapeHtml(placement.code || "")}" class="w-14 border border-slate-300 rounded px-2 py-1 text-sm text-center">
  </label>`;
}

function renderAdsPage(escapeHtml, query = {}) {
  const ads = adminConfig.load().ads;
  const left = adminConfig.PLACEMENTS.filter((p) => p.col === "left");
  const right = adminConfig.PLACEMENTS.filter((p) => p.col === "right");

  return `${savedBanner(query)}
<form method="post" action="/admin/ads" class="gc-admin-card border border-slate-200 rounded-xl bg-white p-6 mb-4 shadow-sm">
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    <div><label class="block text-xs font-semibold text-slate-600 mb-1">GAM network</label><input type="text" name="gam_network" value="${escapeHtml(ads.gam_network)}" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"></div>
    <div><label class="block text-xs font-semibold text-slate-600 mb-1">Refresh sec (0=off)</label><input type="text" name="refresh_sec" value="${escapeHtml(ads.refresh_sec)}" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"></div>
    <div><label class="block text-xs font-semibold text-slate-600 mb-1">Amazon a9 pub ID</label><input type="text" name="amazon_pub_id" value="${escapeHtml(ads.amazon_pub_id)}" placeholder="(empty = off)" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"></div>
    <div><label class="block text-xs font-semibold text-slate-600 mb-1">Prebid timeout (ms)</label><input type="text" name="prebid_timeout" value="${escapeHtml(ads.prebid_timeout)}" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"></div>
  </div>
  <p class="text-sm font-semibold text-slate-700 mb-3">Placements — enable + GAM ad-unit code</p>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 mb-6">
    <div>${left.map((item) => placementField(item.key, item.label, ads.placements[item.key], escapeHtml)).join("")}</div>
    <div>${right.map((item) => placementField(item.key, item.label, ads.placements[item.key], escapeHtml)).join("")}</div>
  </div>
  <label class="block text-xs font-semibold text-slate-600 mb-1">Prebid bids (JSON, keyed by unit code — leave blank for none)</label>
  <textarea name="prebid_bids" rows="4" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono mb-4">${escapeHtml(ads.prebid_bids)}</textarea>
  <button type="submit" name="save_ads" value="1" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg px-5 py-2.5 text-sm">Save &amp; Publish</button>
</form>
<form method="post" action="/admin/ads" class="gc-admin-card border border-slate-200 rounded-xl bg-white p-6 shadow-sm">
  <h2 class="font-bold text-base mb-1">ads.txt</h2>
  <p class="text-xs text-slate-500 mb-1">this domain's authorized sellers — live at <code class="bg-slate-100 px-1 rounded">/ads.txt</code></p>
  <p class="text-xs text-slate-500 mb-3">One seller per line, e.g. google.com, pub-XXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0</p>
  <textarea name="ads_txt" rows="6" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono mb-4">${escapeHtml(ads.ads_txt)}</textarea>
  <button type="submit" name="save_ads_txt" value="1" class="bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg px-5 py-2.5 text-sm">Save ads.txt</button>
</form>`;
}

function renderSitePageWrapper(escapeHtml, query = {}) {
  return renderSitePage(escapeHtml, query);
}

function renderNavPage(escapeHtml, query = {}) {
  const items = adminConfig.load().nav.items;
  const rows = items
    .map(
      (item, index) => `<tr>
        <td class="px-4 py-2"><input type="checkbox" name="nav_enabled[${index}]" value="1" ${item.enabled ? "checked" : ""} class="rounded border-slate-300 text-indigo-600"></td>
        <td class="px-4 py-2"><input type="text" name="nav_label[]" value="${escapeHtml(item.label)}" class="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"></td>
        <td class="px-4 py-2"><input type="text" name="nav_url[]" value="${escapeHtml(item.url)}" class="w-full border border-slate-300 rounded px-2 py-1.5 text-sm font-mono"></td>
      </tr>`
    )
    .join("");

  return `${savedBanner(query)}
<form method="post" action="/admin/nav" class="gc-admin-card border border-slate-200 rounded-xl bg-white p-6 shadow-sm">
  <h2 class="font-bold text-base mb-1">Nav</h2>
  <p class="text-xs text-slate-500 mb-4">Main menu links shown on the public site header.</p>
  <div class="gc-admin-table-wrap overflow-x-auto border border-slate-200 rounded-lg mb-4">
    <table class="w-full text-sm">
      <thead class="bg-slate-50 text-xs uppercase text-slate-500"><tr><th class="text-left px-4 py-3 font-semibold w-16">Show</th><th class="text-left px-4 py-3 font-semibold">Label</th><th class="text-left px-4 py-3 font-semibold">URL</th></tr></thead>
      <tbody class="divide-y divide-slate-100">${rows}
        <tr><td class="px-4 py-2"><input type="checkbox" name="nav_enabled[new]" value="1" class="rounded border-slate-300 text-indigo-600"></td><td class="px-4 py-2"><input type="text" name="nav_label[]" placeholder="New link label" class="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"></td><td class="px-4 py-2"><input type="text" name="nav_url[]" placeholder="/path" class="w-full border border-slate-300 rounded px-2 py-1.5 text-sm font-mono"></td></tr>
      </tbody>
    </table>
  </div>
  <button type="submit" name="save_nav" value="1" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg px-5 py-2.5 text-sm">Save &amp; Publish</button>
</form>`;
}

function renderCodePage(escapeHtml, query = {}) {
  const code = adminConfig.load().code;
  return `${savedBanner(query)}
<form method="post" action="/admin/code" class="gc-admin-card border border-slate-200 rounded-xl bg-white p-6 shadow-sm">
  <h2 class="font-bold text-base mb-1">Code</h2>
  <p class="text-xs text-slate-500 mb-4">Custom scripts and CSS injected into the public site (stored in admin only).</p>
  <div class="grid gap-4 mb-6">
    <div><label class="block text-xs font-semibold text-slate-600 mb-1">Head code (before &lt;/head&gt;)</label><textarea name="head_code" rows="5" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono">${escapeHtml(code.head_code)}</textarea></div>
    <div><label class="block text-xs font-semibold text-slate-600 mb-1">Body start code (after &lt;body&gt;)</label><textarea name="body_code" rows="4" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono">${escapeHtml(code.body_code)}</textarea></div>
    <div><label class="block text-xs font-semibold text-slate-600 mb-1">Footer code (before &lt;/body&gt;)</label><textarea name="footer_code" rows="5" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono">${escapeHtml(code.footer_code)}</textarea></div>
    <div><label class="block text-xs font-semibold text-slate-600 mb-1">Custom CSS</label><textarea name="custom_css" rows="6" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono">${escapeHtml(code.custom_css)}</textarea></div>
  </div>
  <button type="submit" name="save_code" value="1" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg px-5 py-2.5 text-sm">Save &amp; Publish</button>
</form>`;
}

module.exports = {
  renderAdsPage,
  renderSitePage: renderSitePageWrapper,
  renderNavPage,
  renderCodePage,
};
