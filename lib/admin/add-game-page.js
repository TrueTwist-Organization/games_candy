const gamesStore = require("./games-store");
const gamePageBuilder = require("../game-page-builder");
const imageUpload = require("./image-upload");

function field(label, name, value, escapeHtml, attrs = "") {
  return `<div><label class="block text-xs font-semibold text-slate-600 mb-1">${label}</label><input type="text" name="${escapeHtml(name)}" value="${escapeHtml(value)}" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" ${attrs}></div>`;
}

function renderAddGamePage(escapeHtml, query = {}, error = "", values = {}) {
  const v = (key, fallback = "") => escapeHtml(String(values[key] ?? fallback));
  const categories = gamesStore.CATEGORIES;
  const categoryOptions = categories
    .map((cat) => {
      const selected = (values.category || "Puzzle") === cat ? "selected" : "";
      return `<option value="${escapeHtml(cat)}" ${selected}>${escapeHtml(cat.toLowerCase())}</option>`;
    })
    .join("");

  const banner =
    query.added === "1"
      ? `<div class="mb-4 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-2">Game added and published successfully. It is live on your site now.</div>`
      : query.error
        ? `<div class="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-2">${escapeHtml(query.error)}</div>`
        : error
          ? `<div class="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-2">${escapeHtml(error)}</div>`
          : "";

  const hot = values.flag_hot === "1" || values.flag_hot === true ? "checked" : "";
  const trending = values.flag_trending === "1" || values.flag_trending === true ? "checked" : "";
  const newFlag = values.flag_new === "1" || values.flag_new === true || values.flag_new === undefined ? "checked" : "";

  return `${banner}
<div class="gc-admin-card border border-slate-200 rounded-xl bg-white p-6 shadow-sm">
  <h2 class="font-bold text-lg mb-1">Add new game</h2>
  <p class="text-xs text-slate-500 mb-6">Fill in the game details below. Use the GameMonetize hash or embed folder name (e.g. <code class="bg-slate-100 px-1 rounded">BubbleCloud_</code>). Save &amp; Publish creates play/view pages and shows the game on your site.</p>
  <form method="post" action="/admin/games/add" enctype="multipart/form-data" class="space-y-5" id="add-game-form">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      ${field('Title <span class="text-red-500">*</span>', "title", v("title"), escapeHtml, 'required id="game-title"')}
      <div>
        <label class="block text-xs font-semibold text-slate-600 mb-1">Slug (URL)</label>
        <input type="text" name="slug" id="game-slug" value="${v("slug")}" placeholder="auto from title" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono">
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="md:col-span-2">
        <label class="block text-xs font-semibold text-slate-600 mb-1">GameMonetize hash / embed folder <span class="text-red-500">*</span></label>
        <div class="flex gap-2">
          <input type="text" name="gamemonetize_hash" id="game-embed-id" value="${v("gamemonetize_hash")}" required class="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono" placeholder="32-char hash or BubbleCloud_">
          <button type="button" id="preview-embed" class="shrink-0 border border-slate-300 rounded-lg px-3 py-2 text-sm hover:bg-slate-50">Preview embed</button>
        </div>
        <p id="embed-preview" class="text-xs text-slate-500 mt-1">Embed path will be generated automatically.</p>
      </div>
      <div>
        <label class="block text-xs font-semibold text-slate-600 mb-1">Category</label>
        <select name="category" id="game-category" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm capitalize">${categoryOptions}</select>
      </div>
      <div>
        <label class="block text-xs font-semibold text-slate-600 mb-1">Genre</label>
        <input type="text" name="genre" id="game-genre" value="${v("genre")}" placeholder="e.g. Soccer" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
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
      <input type="text" name="tags" id="game-tags" value="${v("tags")}" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="action, arcade, multiplayer">
    </div>

    <div>
      <label class="block text-xs font-semibold text-slate-600 mb-1">Description</label>
      <textarea name="description" id="game-description" rows="4" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="Auto-filled from title if left empty">${v("description")}</textarea>
    </div>

    <div>
      <label class="block text-xs font-semibold text-slate-600 mb-1">How to Play</label>
      <textarea name="how_to_play" rows="4" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="Controls and gameplay instructions">${v("how_to_play")}</textarea>
    </div>

    <div>
      <label class="block text-xs font-semibold text-slate-600 mb-1">Editor's View / Review</label>
      <textarea name="editors_review" rows="4" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="Optional editorial review">${v("editors_review")}</textarea>
    </div>

    <div class="gc-admin-form-actions flex flex-wrap items-center gap-4 pt-2">
      <button type="submit" name="save_game" value="1" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg px-6 py-2.5 text-sm">Save &amp; Publish</button>
      <a href="/admin/games" class="text-slate-600 hover:text-slate-900 text-sm font-medium">Cancel</a>
    </div>
  </form>
</div>
<script>
(function () {
  var title = document.getElementById('game-title');
  var slug = document.getElementById('game-slug');
  var embed = document.getElementById('game-embed-id');
  var preview = document.getElementById('embed-preview');
  var description = document.getElementById('game-description');
  var category = document.getElementById('game-category');
  var genre = document.getElementById('game-genre');
  var tags = document.getElementById('game-tags');
  var genreMap = ${JSON.stringify(gamesStore.GENRE_LABELS)};

  if (!title || !slug) return;
  var slugEdited = slug.value.trim() !== '';
  slug.addEventListener('input', function () { slugEdited = slug.value.trim() !== ''; });
  title.addEventListener('input', function () {
    if (slugEdited) return;
    slug.value = title.value.trim().toLowerCase().replace(/[^\\w\\s-]/g, '').replace(/[\\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (description && !description.dataset.manual) {
      description.value = 'Enjoy ' + title.value.trim() + ' online for free at GamesCandy. Play instantly in your browser — no download required.';
    }
  });
  if (description) {
    description.addEventListener('input', function () { description.dataset.manual = description.value.trim() ? '1' : ''; });
  }
  if (category && genre) {
    category.addEventListener('change', function () {
      if (genre.value.trim()) return;
      genre.value = genreMap[(category.value || '').toLowerCase()] || category.value;
      if (tags && !tags.value.trim()) tags.value = category.value.toLowerCase();
    });
  }
  function updateEmbedPreview() {
    if (!embed || !preview) return;
    var raw = embed.value.trim();
    if (!raw) { preview.textContent = 'Embed path will be generated automatically.'; return; }
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

module.exports = { renderAddGamePage };
