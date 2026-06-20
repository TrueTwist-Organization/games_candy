const fs = require("fs");
const path = require("path");
const gamePageBuilder = require("../game-page-builder");

const PUBLIC = path.join(__dirname, "../../public");
const MANIFEST_PATH = path.join(PUBLIC, "embed/manifest.json");
const CUSTOM_GAMES_PATH = path.join(__dirname, "../../admin/data/custom-games.json");
const HIDDEN_GAMES_PATH = path.join(__dirname, "../../admin/data/hidden-games.json");

const CATEGORIES = ["Action", "Arcade", "Casual", "Puzzle", "Quiz", "Sports", "Board", "Match 3", "Card"];

const GENRE_LABELS = {
  action: "Action",
  arcade: "Arcade",
  casual: "Casual",
  puzzle: "Puzzles",
  quiz: "Trivia",
  sports: "Sports",
  board: "Board",
  "match 3": "Match 3",
  card: "Card",
};

function slugify(value) {
  return String(value || "")
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseFlags(input) {
  const flags = [];
  if (input.flag_hot === "1" || input.flag_hot === true) flags.push("hot");
  if (input.flag_trending === "1" || input.flag_trending === true) flags.push("trending");
  if (input.flag_new === "1" || input.flag_new === true) flags.push("new");
  return flags;
}

function loadCustomGames() {
  if (!fs.existsSync(CUSTOM_GAMES_PATH)) return {};
  try {
    const data = JSON.parse(fs.readFileSync(CUSTOM_GAMES_PATH, "utf8"));
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

function saveCustomGames(data) {
  fs.mkdirSync(path.dirname(CUSTOM_GAMES_PATH), { recursive: true });
  fs.writeFileSync(CUSTOM_GAMES_PATH, JSON.stringify(data, null, 2));
}

function loadManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveManifest(manifest) {
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

function loadHiddenGames() {
  if (!fs.existsSync(HIDDEN_GAMES_PATH)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(HIDDEN_GAMES_PATH, "utf8"));
    return Array.isArray(data?.slugs) ? data.slugs.map(String) : [];
  } catch {
    return [];
  }
}

function saveHiddenGames(slugs) {
  fs.mkdirSync(path.dirname(HIDDEN_GAMES_PATH), { recursive: true });
  fs.writeFileSync(HIDDEN_GAMES_PATH, JSON.stringify({ slugs: [...new Set(slugs.map(String))] }, null, 2));
}

function embedFolderFromPath(embed) {
  const match = String(embed || "").match(/\/embed\/g\/([^/]+)\//);
  return match ? match[1] : "";
}

function isAdminGeneratedPage(slug) {
  for (const base of ["game", "view-game"]) {
    const filePath = path.join(PUBLIC, base, slug, "index.html");
    if (!fs.existsSync(filePath)) continue;
    const html = fs.readFileSync(filePath, "utf8");
    if (html.includes("gc-admin-game")) return true;
  }
  return false;
}

function buildStoredMeta(input, slug, existing = {}) {
  const title = String(input.title || "").trim();
  const category = String(input.category || "Puzzle").trim();
  const genre = String(input.genre || "").trim();
  const score = String(input.score || "7.5").trim();
  const tags = String(input.tags || "").trim();
  const description = String(input.description || "").trim();
  const howToPlay = String(input.how_to_play || "").trim();
  const editorsReview = String(input.editors_review || "").trim();
  const thumb = String(input.thumb || "").trim();
  const landscapeThumb = String(input.landscape_thumb || "").trim();
  const portraitThumb = String(input.portrait_thumb || "").trim();
  const embedFolder = String(input.gamemonetize_hash || input.embed_folder || "").trim();
  const categoryKey = category.toLowerCase();
  const flags = parseFlags(input);

  return {
    ...existing,
    title,
    category: categoryKey,
    genre: genre || GENRE_LABELS[categoryKey] || "Casual",
    score,
    tags,
    description: description || gamePageBuilder.defaultDescription(title),
    how_to_play: howToPlay,
    editors_review: editorsReview,
    gamemonetize_hash: embedFolder,
    embed_folder: embedFolder,
    thumb,
    landscape_thumb: landscapeThumb,
    portrait_thumb: portraitThumb,
    flags,
    game_id: existing.game_id || gamePageBuilder.generateGameId(slug),
    updated_at: new Date().toISOString(),
  };
}

function writePagesForSlug(slug, stored, embed) {
  gamePageBuilder.writeGamePages({
    slug,
    title: stored.title,
    embed,
    description: stored.description,
    how_to_play: stored.how_to_play,
    editors_review: stored.editors_review,
    thumb: stored.thumb,
    landscape_thumb: stored.landscape_thumb,
    portrait_thumb: stored.portrait_thumb,
    game_id: stored.game_id,
  });
}

function getGameEditData(slug) {
  const manifest = loadManifest();
  const entry = manifest.find((item) => item.slug === slug);
  if (!entry) throw new Error("Game not found.");

  const custom = getCustomMeta(slug) || {};
  const gamePage = path.join(PUBLIC, "game", slug, "index.html");
  let title = slug.replace(/[_-]/g, " ");
  if (fs.existsSync(gamePage)) {
    const html = fs.readFileSync(gamePage, "utf8");
    const titleMatch = html.match(/<title>([^<|]+)/);
    if (titleMatch) title = titleMatch[1].replace(/\s*-\s*Play online games.*/i, "").trim();
  }

  const storedTitle = custom.title || title;
  const embedFolder =
    custom.gamemonetize_hash || custom.embed_folder || embedFolderFromPath(entry.embed) || "";

  return {
    title: storedTitle,
    slug,
    gamemonetize_hash: embedFolder,
    embed: entry.embed || "",
    category: custom.category
      ? custom.category.charAt(0).toUpperCase() + custom.category.slice(1)
      : "Puzzle",
    genre: custom.genre || "",
    score: custom.score || "7.5",
    tags: custom.tags || "",
    description: custom.description || "",
    how_to_play: custom.how_to_play || "",
    editors_review: custom.editors_review || "",
    thumb: custom.thumb || "",
    landscape_thumb: custom.landscape_thumb || "",
    portrait_thumb: custom.portrait_thumb || "",
    flag_hot: Array.isArray(custom.flags) && custom.flags.includes("hot") ? "1" : "",
    flag_trending: Array.isArray(custom.flags) && custom.flags.includes("trending") ? "1" : "",
    flag_new: Array.isArray(custom.flags) && custom.flags.includes("new") ? "1" : "",
    is_admin_added: Boolean(custom.added_at),
  };
}

function updateGame(slug, input) {
  const cleanSlug = String(slug || "").trim();
  if (!cleanSlug) throw new Error("Game slug is required.");

  const manifest = loadManifest();
  const index = manifest.findIndex((item) => item.slug === cleanSlug);
  if (index === -1) throw new Error("Game not found.");

  const embed = gamePageBuilder.resolveEmbed(input);
  manifest[index].embed = embed;
  saveManifest(manifest);

  const custom = loadCustomGames();
  const existing = custom[cleanSlug] || {};
  const stored = buildStoredMeta(input, cleanSlug, existing);
  if (!stored.flags.length) stored.flags = ["new"];
  if (existing.added_at) stored.added_at = existing.added_at;
  custom[cleanSlug] = stored;
  saveCustomGames(custom);

  if (existing.added_at || isAdminGeneratedPage(cleanSlug)) {
    writePagesForSlug(cleanSlug, stored, embed);
  }

  return { slug: cleanSlug, title: stored.title, embed };
}

function deleteGame(slug) {
  const cleanSlug = String(slug || "").trim();
  if (!cleanSlug) throw new Error("Game slug is required.");

  const manifest = loadManifest();
  if (!manifest.some((item) => item.slug === cleanSlug)) {
    throw new Error("Game not found.");
  }

  const custom = loadCustomGames();
  const wasAdminAdded = Boolean(custom[cleanSlug]?.added_at);

  saveManifest(manifest.filter((item) => item.slug !== cleanSlug));

  const hidden = loadHiddenGames();
  if (!hidden.includes(cleanSlug)) hidden.push(cleanSlug);
  saveHiddenGames(hidden);

  delete custom[cleanSlug];
  saveCustomGames(custom);

  if (wasAdminAdded || isAdminGeneratedPage(cleanSlug)) {
    gamePageBuilder.removeGamePages(cleanSlug);
  }

  return { slug: cleanSlug };
}

function getCustomMeta(slug) {
  return loadCustomGames()[slug] || null;
}

function getAllCustomMeta() {
  return loadCustomGames();
}

function listCustomGamesForSite() {
  const custom = loadCustomGames();
  const manifest = loadManifest();
  const hidden = new Set(loadHiddenGames());

  return Object.entries(custom)
    .filter(([slug]) => !hidden.has(slug))
    .map(([slug, meta]) => {
      const manifestEntry = manifest.find((item) => item.slug === slug);
      const normalized = gamePageBuilder.normalizeGameData({
        slug,
        title: meta.title,
        embed: manifestEntry?.embed,
        gamemonetize_hash: meta.gamemonetize_hash || meta.embed_folder,
        description: meta.description,
        thumb: meta.thumb,
        landscape_thumb: meta.landscape_thumb,
        portrait_thumb: meta.portrait_thumb,
        game_id: meta.game_id,
      });
      return {
        slug,
        title: meta.title || normalized.title,
        category: meta.category || "casual",
        genre: meta.genre || "Casual",
        score: meta.score || "7.5",
        flags: Array.isArray(meta.flags) ? meta.flags : [],
        embed: manifestEntry?.embed || normalized.embed,
        game_id: normalized.game_id,
        description: normalized.description,
        thumbnail_squere: meta.portrait_thumb || meta.thumb || normalized.portrait,
        thumbnail_landscape_16_9: meta.landscape_thumb || meta.thumb || normalized.landscape,
        added_at: meta.added_at || "",
      };
    })
    .sort((a, b) => String(b.added_at).localeCompare(String(a.added_at)));
}

function addGame(input) {
  const title = String(input.title || "").trim();
  const slug = slugify(input.slug || title);
  const category = String(input.category || "Puzzle").trim();
  const genre = String(input.genre || "").trim();
  const score = String(input.score || "7.5").trim();
  const tags = String(input.tags || "").trim();
  const description = String(input.description || "").trim();
  const howToPlay = String(input.how_to_play || "").trim();
  const editorsReview = String(input.editors_review || "").trim();
  const thumb = String(input.thumb || "").trim();
  const landscapeThumb = String(input.landscape_thumb || "").trim();
  const portraitThumb = String(input.portrait_thumb || "").trim();
  const flags = parseFlags(input);

  if (!title) throw new Error("Title is required.");
  if (!slug) throw new Error("Slug is required.");

  let embed;
  try {
    embed = gamePageBuilder.resolveEmbed(input);
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : "Embed path is required.");
  }

  const manifest = loadManifest();
  if (manifest.some((item) => item.slug === slug)) {
    throw new Error(`A game with slug "${slug}" already exists.`);
  }

  const gameId = gamePageBuilder.generateGameId(slug);
  const embedFolder = String(input.gamemonetize_hash || input.embed_folder || "").trim();

  manifest.push({ slug, embed });
  manifest.sort((a, b) => String(a.slug).localeCompare(String(b.slug), undefined, { sensitivity: "base" }));
  saveManifest(manifest);

  const custom = loadCustomGames();
  const stored = buildStoredMeta(input, slug, {
    added_at: new Date().toISOString(),
    flags: flags.length ? flags : ["new"],
  });
  custom[slug] = stored;
  saveCustomGames(custom);

  writePagesForSlug(slug, stored, embed);

  return { slug, title, embed, category, genre, score, hash: embedFolder, flags: stored.flags, game_id: stored.game_id };
}

module.exports = {
  CATEGORIES,
  GENRE_LABELS,
  slugify,
  addGame,
  updateGame,
  deleteGame,
  getGameEditData,
  getCustomMeta,
  getAllCustomMeta,
  loadManifest,
  loadHiddenGames,
  listCustomGamesForSite,
};
