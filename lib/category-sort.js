function buildCategorySortMetaScript() {
  let games = [];
  try {
    games = require("./admin/games-catalog").getAllGames();
  } catch {
    games = [];
  }

  const meta = {};
  games.forEach((game) => {
    meta[game.slug] = {
      title: game.title,
      score: parseFloat(game.score) || 0,
      flags: Array.isArray(game.flags) ? game.flags : [],
    };
  });

  return `<script id="gc-category-sort-meta">window.__gcCategorySortMeta=${JSON.stringify(meta)};</script>`;
}

function isCategoryPage(html) {
  return /id="sort_category_games"/.test(html);
}

function applyCategorySort(html) {
  if (!isCategoryPage(html)) {
    return html;
  }

  let text = String(html || "");
  text = text.replace(/<script id="gc-category-sort-meta">[\s\S]*?<\/script>\s*/i, "");

  const metaScript = buildCategorySortMetaScript();
  if (text.includes('src="/js/category.js"')) {
    text = text.replace(
      '<script type="text/javascript" src="/js/category.js" async></script>',
      `${metaScript}\n    <script type="text/javascript" src="/js/category.js" defer></script>`
    );
  } else if (!text.includes("gc-category-sort-meta")) {
    text = text.replace("</body>", `${metaScript}\n</body>`);
  }

  return text;
}

module.exports = {
  applyCategorySort,
  buildCategorySortMetaScript,
  isCategoryPage,
};
