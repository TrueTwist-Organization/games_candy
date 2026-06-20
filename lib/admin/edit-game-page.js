const gamesStore = require("./games-store");
const imageUpload = require("./image-upload");

function renderEditGamePage(escapeHtml, slug, query = {}, error = "", values = {}) {
  const v = (key, fallback = "") => escapeHtml(String(values[key] ?? fallback));
  const categories = gamesStore.CATEGORIES;
  const categoryValue = values.category || "Puzzle";
  const normalizedCategory =
    categories.find((cat) => cat.toLowerCase() === String(categoryValue).toLowerCase()) || categoryValue;
  const categoryOptions = categories
    .map((cat) => {
      const selected = normalizedCategory === cat ? "selected" : "";
      return `<option value="${escapeHtml(cat)}" ${selected}>${escapeHtml(cat.toLowerCase())}</option>`;
    })
    .join("");

  const banner =
    query.updated === "1"
      ? `<div class="mb-4 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-2">Game updated and published successfully.</div>`
      : error
        ? `<div class="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-2">${escapeHtml(error)}</div>`
        : "";

  const hot = values.flag_hot === "1" || values.flag_hot === true ? "checked" : "";
  const trending = values.flag_trending === "1" || values.flag_trending === true ? "checked" : "";
  const newFlag = values.flag_new === "1" || values.flag_new === true ? "checked" : "";

  return `${banner}
<div class="gc-admin-card border border-slate-200 rounded-xl bg-white p-6 shadow-sm">
  <h2 class="font-bold text-lg mb-1">Edit game</h2>
  <p class="text-xs text-slate-500 mb-6">Update game details below. Slug stays fixed. Save &amp; Publish applies changes to your live site.</p>
  <form method="post" action="/admin/games/edit" enctype="multipart/form-data" class="space-y-5" id="edit-game-form">
    <input type="hidden" name="slug" value="${escapeHtml(slug)}">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="block text-xs font-semibold text-slate-600 mb-1">Title <span class="text-red-500">*</span></label>
        <input type="text" name="title" required value="${v("title")}" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
      </div>
      <div>
        <label class="block text-xs font-semibold text-slate-600 mb-1">Slug (URL)</label>
        <input type="text" value="${escapeHtml(slug)}" readonly class="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-sm font-mono text-slate-500">
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="md:col-span-2">
        <label class="block text-xs font-semibold text-slate-600 mb-1">GameMonetize hash / embed folder <span class="text-red-500">*</span></label>
        <div class="flex gap-2">
          <input type="text" name="gamemonetize_hash" id="game-embed-id" value="${v("gamemonetize_hash")}" required class="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono" placeholder="32-char hash or BubbleCloud_">
          <button type="button" id="preview-embed" class="shrink-0 border border-slate-300 rounded-lg px-3 py-2 text-sm hover:bg-slate-50">Preview embed</button>
        </div>
        <p id="embed-preview" class="text-xs text-slate-500 mt-1">${escapeHtml(values.embed || "")}</p>
      </div>
      <div>
        <label class="block text-xs font-semibold text-slate-600 mb-1">Category</label>
        <select name="category" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm capitalize">${categoryOptions}</select>
      </div>
      <div>
        <label class="block text-xs font-semibold text-slate-600 mb-1">Genre</label>
        <input type="text" name="genre" value="${v("genre")}" placeholder="e.g. Soccer" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div>
        <label class="block text-xs font-semibold text-slate-600 mb-1">Score</label>
        <input type="text" name="score" value="${v("score", "7.5")}" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      ${imageUpload.renderImageUploadField(escapeHtml, "Thumbnail", "thumb", values.thumb || "", "Square image used in game lists.")}
      ${imageUpload.renderImageUploadField(escapeHtml, "Landscape banner (optional)", "landscape_thumb", values.landscape_thumb || "", "Wide banner on the view-game page.")}
      ${imageUpload.renderImageUploadField(escapeHtml, "Portrait image (optional)", "portrait_thumb", values.portrait_thumb || "", "Portrait image for grids and cards.")}
    </div>

    <div class="flex flex-wrap items-center gap-5 text-sm">
      <label class="inline-flex items-center gap-2"><input type="checkbox" name="flag_hot" value="1" ${hot} class="rounded border-slate-300 text-indigo-600"> Hot</label>
      <label class="inline-flex items-center gap-2"><input type="checkbox" name="flag_trending" value="1" ${trending} class="rounded border-slate-300 text-indigo-600"> Trending</label>
      <label class="inline-flex items-center gap-2"><input type="checkbox" name="flag_new" value="1" ${newFlag} class="rounded border-slate-300 text-indigo-600"> New</label>
    </div>

    <div>
      <label class="block text-xs font-semibold text-slate-600 mb-1">Tags (comma-separated)</label>
      <input type="text" name="tags" value="${v("tags")}" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
    </div>

    <div>
      <label class="block text-xs font-semibold text-slate-600 mb-1">Description</label>
      <textarea name="description" rows="4" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">${v("description")}</textarea>
    </div>

    <div>
      <label class="block text-xs font-semibold text-slate-600 mb-1">How to Play</label>
      <textarea name="how_to_play" rows="4" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">${v("how_to_play")}</textarea>
    </div>

    <div>
      <label class="block text-xs font-semibold text-slate-600 mb-1">Editor's View / Review</label>
      <textarea name="editors_review" rows="4" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">${v("editors_review")}</textarea>
    </div>

    <div class="gc-admin-form-actions flex flex-wrap items-center gap-4 pt-2">
      <button type="submit" name="save_game" value="1" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg px-6 py-2.5 text-sm">Save &amp; Publish</button>
      <a href="/admin/games" class="text-slate-600 hover:text-slate-900 text-sm font-medium">Cancel</a>
    </div>
  </form>
</div>
<script>
(function () {
  var embed = document.getElementById('game-embed-id');
  var preview = document.getElementById('embed-preview');
  function updateEmbedPreview() {
    if (!embed || !preview) return;
    var raw = embed.value.trim();
    if (!raw) return;
    if (raw.indexOf('/embed/') === 0) { preview.textContent = 'Embed: ' + raw; return; }
    if (/^[A-Za-z0-9]{32}$/.test(raw)) { preview.textContent = 'Embed: /embed/g/' + raw + '/index.html'; return; }
    preview.textContent = 'Embed: /embed/g/' + raw.replace(/^\\/+|\\/+$/g, '') + '/index.html';
  }
  if (embed) {
    embed.addEventListener('input', updateEmbedPreview);
    updateEmbedPreview();
  }
  document.getElementById('preview-embed')?.addEventListener('click', function () {
    updateEmbedPreview();
    var raw = embed.value.trim();
    if (!raw) return;
    var path = raw.indexOf('/embed/') === 0 ? raw : (/^[A-Za-z0-9]{32}$/.test(raw) ? '/embed/g/' + raw + '/index.html' : '/embed/g/' + raw.replace(/^\\/+|\\/+$/g, '') + '/index.html');
    window.open(path, '_blank', 'noopener');
  });
})();
</script>
${imageUpload.imageUploadPreviewScript()}`;
}

module.exports = { renderEditGamePage };
