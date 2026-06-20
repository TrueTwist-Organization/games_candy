const adminConfig = require("./admin-config");
const gamesCatalog = require("./games-catalog");
const imageUpload = require("./image-upload");
const gradientColorField = require("./gradient-color-field");

function colorField(name, label, value, escapeHtml) {
  return gradientColorField.renderGradientColorField(name, label, value, escapeHtml);
}

function checkbox(name, label, checked, escapeHtml) {
  return `<label class="flex items-center gap-2 text-sm"><input type="checkbox" name="${escapeHtml(name)}" value="1" ${checked ? "checked" : ""} class="rounded border-slate-300 text-indigo-600"><span>${escapeHtml(label)}</span></label>`;
}

function renderFooterCreditLinks(links, escapeHtml) {
  const items = Array.isArray(links) && links.length
    ? links
    : [
        { label: "TrueTwist", url: "https://truetwist.in/" },
        { label: "369network", url: "https://369network.com/" },
      ];
  const rows = items
    .map(
      (item) => `<div class="flex gap-2 gc-admin-footer-credit-row">
      <input type="text" name="footer_credit_label[]" value="${escapeHtml(item.label || "")}" placeholder="Link text" class="w-1/3 border border-slate-300 rounded-lg px-3 py-2 text-sm">
      <input type="text" name="footer_credit_url[]" value="${escapeHtml(item.url || "")}" placeholder="https://..." class="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono">
    </div>`
    )
    .join("");
  return `<div>
      <label class="block text-xs font-semibold text-slate-600 mb-1">Footer credit links</label>
      <div id="footer-credit-links" class="space-y-2">${rows}</div>
      <button type="button" id="add-footer-credit" class="mt-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium">+ Add link</button>
    </div>`;
}

function savedBanner(query) {
  if (!query.saved) return "";
  return `<div class="mb-4 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-2">Saved successfully.</div>`;
}

function renderSitePage(escapeHtml, query = {}) {
  const site = adminConfig.load().site;
  const gameCount = gamesCatalog.getAllGames().length;

  return `${savedBanner(query)}
<form method="post" action="/admin/site" enctype="multipart/form-data" class="space-y-4">
  <div class="gc-admin-card border border-slate-200 rounded-xl bg-white p-6 shadow-sm">
    <h2 class="font-bold text-base mb-1">Site identity</h2>
    <p class="text-xs text-slate-500 mb-4">Basic info for your new games site.</p>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div><label class="block text-xs font-semibold text-slate-600 mb-1">Site name</label><input type="text" name="site_name" value="${escapeHtml(site.site_name)}" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"></div>
      <div><label class="block text-xs font-semibold text-slate-600 mb-1">Site URL</label><input type="text" name="site_url" value="${escapeHtml(site.site_url)}" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"></div>
      <div class="md:col-span-2"><label class="block text-xs font-semibold text-slate-600 mb-1">Tagline</label><input type="text" name="tagline" value="${escapeHtml(site.tagline || "")}" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"></div>
    </div>
  </div>
  <div class="gc-admin-card border border-slate-200 rounded-xl bg-white p-6 shadow-sm">
    <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div><h2 class="font-bold text-base">Theme &amp; colors</h2><p class="text-xs text-slate-500">Pick solid colors or two-color gradients — live on public site after Save &amp; Publish.</p></div>
      <select id="color-preset" class="border border-slate-300 rounded-lg px-3 py-2 text-sm"><option value="">Color preset…</option><option value="gamescandy">GamesCandy Purple</option><option value="rose">Rose Pink</option><option value="ocean">Ocean Blue</option><option value="emerald">Emerald Green</option><option value="sunset">Sunset Orange</option></select>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      ${colorField("primary_color", "Primary color", site.primary_color, escapeHtml)}
      ${colorField("secondary_color", "Secondary color", site.secondary_color, escapeHtml)}
      ${colorField("accent_color", "Accent color", site.accent_color, escapeHtml)}
      ${colorField("button_color", "Button color", site.button_color, escapeHtml)}
      ${colorField("button_hover_color", "Button hover", site.button_hover_color, escapeHtml)}
      ${colorField("link_color", "Link color", site.link_color, escapeHtml)}
      ${colorField("background_color", "Background", site.background_color, escapeHtml)}
      ${colorField("text_color", "Text color", site.text_color, escapeHtml)}
      ${colorField("theme_color", "Browser theme color", site.theme_color, escapeHtml)}
    </div>
  </div>
  <div class="gc-admin-card border border-slate-200 rounded-xl bg-white p-6 shadow-sm">
    <h2 class="font-bold text-base mb-4">Branding</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      ${imageUpload.renderImageUploadField(escapeHtml, "Desktop logo", "logo_desktop", site.logo_desktop || "", "Shown in desktop header navigation.")}
      ${imageUpload.renderImageUploadField(escapeHtml, "Mobile logo", "logo_mobile", site.logo_mobile || "", "Shown on mobile header.")}
      ${imageUpload.renderImageUploadField(escapeHtml, "Favicon", "favicon", site.favicon || "", "Browser tab icon. ICO, PNG, or SVG recommended.")}
    </div>
  </div>
  <div class="gc-admin-card border border-slate-200 rounded-xl bg-white p-6 shadow-sm">
    <h2 class="font-bold text-base mb-4">SEO</h2>
    <div class="grid gap-4">
      <div><label class="block text-xs font-semibold text-slate-600 mb-1">Default meta title</label><input type="text" name="meta_title" value="${escapeHtml(site.meta_title)}" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"></div>
      <div><label class="block text-xs font-semibold text-slate-600 mb-1">Default meta description</label><textarea name="meta_description" rows="2" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">${escapeHtml(site.meta_description)}</textarea></div>
      <div><label class="block text-xs font-semibold text-slate-600 mb-1">Meta keywords</label><input type="text" name="meta_keywords" value="${escapeHtml(site.meta_keywords || "")}" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"></div>
    </div>
  </div>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <div class="gc-admin-card border border-slate-200 rounded-xl bg-white p-6 shadow-sm">
      <h2 class="font-bold text-base mb-4">Homepage</h2>
      <div class="grid gap-4">
        <div><label class="block text-xs font-semibold text-slate-600 mb-1">Hero section title</label><input type="text" name="home_hero_title" value="${escapeHtml(site.home_hero_title)}" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"></div>
        <div class="grid gap-2">
          ${checkbox("homepage_most_popular", "Show Most Popular section", site.homepage_most_popular !== false, escapeHtml)}
          ${checkbox("homepage_categories", "Show category sections", site.homepage_categories !== false, escapeHtml)}
          ${checkbox("homepage_recent", "Show recent games", site.homepage_recent !== false, escapeHtml)}
        </div>
      </div>
    </div>
    <div class="gc-admin-card border border-slate-200 rounded-xl bg-white p-6 shadow-sm">
      <h2 class="font-bold text-base mb-4">Features &amp; footer</h2>
      <div class="grid gap-4">
        ${checkbox("show_tournaments", "Show Tournaments button in menu", !!site.show_tournaments, escapeHtml)}
        ${checkbox("enable_ads", "Enable ads on public site", !!site.enable_ads, escapeHtml)}
        <div><label class="block text-xs font-semibold text-slate-600 mb-1">Footer text</label><input type="text" name="footer_text" value="${escapeHtml(site.footer_text)}" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"></div>
        <div><label class="block text-xs font-semibold text-slate-600 mb-1">Copyright year</label><input type="text" name="copyright_year" value="${escapeHtml(site.copyright_year || "2026")}" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"></div>
        ${renderFooterCreditLinks(site.footer_credit_links, escapeHtml)}
      </div>
    </div>
  </div>
  <div class="gc-admin-card border border-slate-200 rounded-xl bg-white p-6 shadow-sm">
    <h2 class="font-bold text-base mb-2">Complete your site setup</h2>
    <div class="flex flex-wrap gap-2 text-sm">
      <a href="/admin/games" class="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200">Games (${gameCount.toLocaleString("en-US")})</a>
      <a href="/admin/nav" class="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200">Nav menu</a>
      <a href="/admin/ads" class="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200">Ads</a>
      <a href="/admin/analytics" class="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200">Analytics</a>
      <a href="/admin/code" class="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200">Custom code</a>
      <a href="/home" target="_blank" rel="noopener" class="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100">Preview site</a>
    </div>
  </div>
  <button type="submit" name="save_site" value="1" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg px-5 py-2.5 text-sm">Save &amp; Publish</button>
</form>
<script>
document.getElementById('color-preset')?.addEventListener('change', function () {
  const presets = {
    gamescandy: { primary_color:'#6340F5', secondary_color:'#DF0F64', accent_color:'#8B5CF6', button_color:'#6340F5', button_hover_color:'#5230D5', link_color:'#6340F5', background_color:'#FFFFFF', text_color:'#1F1147', theme_color:'#6340F5' },
    rose: { primary_color:'#E11D48', secondary_color:'#FB7185', accent_color:'#F472B6', button_color:'#E11D48', button_hover_color:'#BE123C', link_color:'#E11D48', background_color:'#FFF1F2', text_color:'#881337', theme_color:'#E11D48' },
    ocean: { primary_color:'#2563EB', secondary_color:'#0EA5E9', accent_color:'#38BDF8', button_color:'#2563EB', button_hover_color:'#1D4ED8', link_color:'#2563EB', background_color:'#F0F9FF', text_color:'#1E3A8A', theme_color:'#2563EB' },
    emerald: { primary_color:'#059669', secondary_color:'#10B981', accent_color:'#34D399', button_color:'#059669', button_hover_color:'#047857', link_color:'#059669', background_color:'#ECFDF5', text_color:'#064E3B', theme_color:'#059669' },
    sunset: { primary_color:'#EA580C', secondary_color:'#F97316', accent_color:'#FBBF24', button_color:'#EA580C', button_hover_color:'#C2410C', link_color:'#EA580C', background_color:'#FFF7ED', text_color:'#7C2D12', theme_color:'#EA580C' }
  };
  const p = presets[this.value];
  if (!p) return;
  Object.keys(p).forEach(function (key) {
    const input = document.getElementById(key);
    if (!input) return;
    input.value = p[key];
    const field = input.closest('[data-color-field]');
    if (field) {
      field.querySelector('input[name="' + key + '_mode"][value="solid"]')?.click();
      const solidText = field.querySelector('[data-solid-text]');
      const solidPicker = field.querySelector('[data-solid-picker]');
      if (solidText) solidText.value = p[key];
      if (solidPicker) solidPicker.value = p[key];
      const preview = field.querySelector('[data-color-preview]');
      if (preview) preview.style.background = p[key];
    }
  });
  this.value = '';
});
document.getElementById('add-footer-credit')?.addEventListener('click', function () {
  const container = document.getElementById('footer-credit-links');
  if (!container) return;
  const row = document.createElement('div');
  row.className = 'flex gap-2 gc-admin-footer-credit-row';
  row.innerHTML = '<input type="text" name="footer_credit_label[]" placeholder="Link text" class="w-1/3 border border-slate-300 rounded-lg px-3 py-2 text-sm"><input type="text" name="footer_credit_url[]" placeholder="https://..." class="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono">';
  container.appendChild(row);
});
</script>
${imageUpload.imageUploadPreviewScript()}
${gradientColorField.gradientColorFieldScript()}`;
}

module.exports = { renderSitePage };
