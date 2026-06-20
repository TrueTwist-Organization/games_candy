const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const gamesStore = require("./games-store");

const PUBLIC = path.join(__dirname, "../../public");
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

let categoryMapCache = null;

function slugToPath(slug) {
  return slug.replace(/_/g, "-").toLowerCase();
}

function buildCategoryMap() {
  if (categoryMapCache) return categoryMapCache;
  const map = {};
  for (const category of CATEGORIES) {
    const page = path.join(PUBLIC, "category", category, "index.html");
    if (!fs.existsSync(page)) continue;
    const html = fs.readFileSync(page, "utf8");
    for (const match of html.matchAll(/href="\/view-game\/([^"]+)"/g)) {
      const slug = decodeURIComponent(match[1]);
      if (!map[slug]) map[slug] = category.toLowerCase();
    }
  }
  categoryMapCache = map;
  return map;
}

function hashSeed(value) {
  return crypto.createHash("md5").update(String(value)).digest("hex");
}

function deriveScore(seed) {
  const n = parseInt(seed.slice(0, 6), 16);
  return (6 + (n % 35) / 10).toFixed(1);
}

function deriveFlags(slug, gameId) {
  const seed = parseInt(hashSeed(`${slug}:${gameId}`).slice(0, 8), 16);
  const flags = [];
  if (seed % 7 === 0) flags.push("hot");
  if (seed % 11 === 0) flags.push("trending");
  if (seed % 13 === 0 || slug.includes("202") || slug.includes("Slide") || slug.includes("Sort")) {
    flags.push("new");
  }
  return flags;
}

function extractGameMeta(slug) {
  let gameId = "";
  let title = slug.replace(/[_-]/g, " ");
  let thumb = "";
  const custom = gamesStore.getCustomMeta(slug);

  if (custom?.game_id) {
    gameId = String(custom.game_id);
  }

  const gamePage = path.join(PUBLIC, "game", slug, "index.html");
  if (fs.existsSync(gamePage)) {
    const html = fs.readFileSync(gamePage, "utf8");
    const idMatch = html.match(/game_id\s*=\s*"(\d+)"/) || html.match(/game_id\s*=\s*['"](\d+)['"]/);
    if (idMatch && !gameId) gameId = idMatch[1];
    const titleMatch = html.match(/<title>([^<|]+)/);
    if (titleMatch) {
      title = titleMatch[1].replace(/\s*-\s*Play online games.*/i, "").trim();
    }
    const thumbMatch = html.match(/game_thumbnail_images\/[^"' ]+\.webp/i);
    if (thumbMatch) {
      thumb = `https://d3dnyybxkc04mp.cloudfront.net/${thumbMatch[0]}`;
    }
  }

  const categories = buildCategoryMap();
  const category = custom?.category || categories[slug] || "casual";
  let genre = GENRE_LABELS[category] || "Casual";
  let score = deriveScore(hashSeed(gameId || slug));
  let flags = deriveFlags(slug, gameId);

  if (custom) {
    if (custom.title) title = custom.title;
    if (custom.thumb) thumb = custom.thumb;
    if (custom.portrait_thumb && !thumb) thumb = custom.portrait_thumb;
    if (custom.genre) genre = custom.genre;
    if (custom.score) score = String(custom.score);
    if (Array.isArray(custom.flags) && custom.flags.length) flags = custom.flags;
    if (!gameId && custom.game_id) gameId = String(custom.game_id);
  }

  if (!gameId && custom) {
    gameId = String(900000 + (parseInt(hashSeed(slug).slice(0, 6), 16) % 99999));
  }

  return {
    game_id: gameId,
    title,
    thumb,
    category,
    genre,
    score,
    flags,
    slug_path: slugToPath(slug),
  };
}

function gameSearchHaystack(game) {
  return [
    game.title,
    game.slug,
    game.slug_path,
    game.category,
    game.genre,
    game.game_id,
    ...(Array.isArray(game.flags) ? game.flags : []),
  ]
    .join(" ")
    .toLowerCase()
    .replace(/[_-]/g, " ");
}

function matchGameSearch(game, query) {
  const raw = String(query || "").trim().toLowerCase();
  if (!raw) return true;

  const haystack = gameSearchHaystack(game);

  const terms = raw.split(/\s+/).filter(Boolean);
  return terms.every((term) => haystack.includes(term.replace(/[_-]/g, " ")));
}

function filterGamesBySearch(games, query) {
  return games.filter((game) => matchGameSearch(game, query));
}

function getAllGames() {
  const manifestPath = path.join(PUBLIC, "embed/manifest.json");
  if (!fs.existsSync(manifestPath)) return [];
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const hidden = new Set(gamesStore.loadHiddenGames());
  const games = manifest
    .filter((item) => item.slug && !hidden.has(item.slug))
    .map((item) => {
      const meta = extractGameMeta(item.slug);
      return {
        slug: item.slug,
        embed: item.embed || "",
        game_id: meta.game_id,
        title: meta.title,
        thumb: meta.thumb,
        category: meta.category,
        genre: meta.genre,
        score: meta.score,
        flags: meta.flags,
        slug_path: meta.slug_path,
        play_url: `/game/${encodeURIComponent(item.slug)}`,
        view_url: `/view-game/${encodeURIComponent(item.slug)}`,
      };
    });
  games.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));
  return games;
}

function findByGameId(gameId) {
  return getAllGames().find((game) => String(game.game_id) === String(gameId)) || null;
}

function findBySlug(slug) {
  return getAllGames().find((game) => game.slug === slug) || null;
}

module.exports = {
  getAllGames,
  findByGameId,
  findBySlug,
  buildCategoryMap,
  filterGamesBySearch,
  matchGameSearch,
  gameSearchHaystack,
};
