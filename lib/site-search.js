function buildSiteSearchScript() {
  return `<script id="gc-site-search">(function(){
  var CATEGORIES = [
    ["action", "Action"],
    ["arcade", "Arcade"],
    ["casual", "Casual"],
    ["puzzle", "Puzzle"],
    ["quiz", "Quiz"],
    ["sports", "Sports"],
    ["board", "Board"],
    ["match 3", "Match 3"],
    ["card", "Card"]
  ];

  function normalize(value) {
    return String(value || "").toLowerCase().replace(/[_-]/g, " ").replace(/\\s+/g, " ").trim();
  }

  function resolveCategorySlug(query) {
    var q = normalize(query);
    if (!q) return "";

    var i;
    for (i = 0; i < CATEGORIES.length; i += 1) {
      if (q === CATEGORIES[i][0] || q === normalize(CATEGORIES[i][1])) {
        return CATEGORIES[i][1];
      }
    }
    for (i = 0; i < CATEGORIES.length; i += 1) {
      var key = CATEGORIES[i][0];
      var slug = normalize(CATEGORIES[i][1]);
      if (key.indexOf(q) === 0 || q.indexOf(key) === 0 || slug.indexOf(q) === 0 || q.indexOf(slug) === 0) {
        return CATEGORIES[i][1];
      }
    }
    return "";
  }

  function getSearchQuery() {
    return new URLSearchParams(window.location.search).get("search") || "";
  }

  function syncSearchInputs(query) {
    document.querySelectorAll('form.search input[name="search"]').forEach(function(input) {
      input.value = query;
    });
  }

  function getSectionMeta(container) {
    var h3 = container.querySelector("h3");
    var title = h3 ? normalize(h3.textContent) : "";
    var catLink = container.querySelector('a[href^="/category/"]');
    var category = "";
    if (catLink) {
      category = normalize(decodeURIComponent((catLink.getAttribute("href") || "").replace(/^\\/category\\//, "")));
    }
    return { title: title, category: category };
  }

  function sectionMatches(container, query) {
    var q = normalize(query);
    if (!q) return true;
    var meta = getSectionMeta(container);
    return (
      meta.title.indexOf(q) >= 0 ||
      meta.category.indexOf(q) >= 0 ||
      q.indexOf(meta.title) >= 0 ||
      q.indexOf(meta.category) >= 0
    );
  }

  function cardMatches(card, query) {
    var q = normalize(query);
    if (!q) return true;
    var link = card.querySelector('a[href^="/view-game/"]');
    var slug = link ? decodeURIComponent((link.getAttribute("href") || "").replace(/^\\/view-game\\//, "")) : "";
    var h3 = card.querySelector("h3");
    var title = h3 ? h3.textContent : "";
    var img = card.querySelector("img[alt]");
    var alt = img ? img.getAttribute("alt") : "";
    var haystack = normalize(slug + " " + title + " " + alt);
    return q.split(/\\s+/).filter(Boolean).every(function(term) {
      return haystack.indexOf(term) >= 0;
    });
  }

  function pagePath() {
    return window.location.pathname.replace(/\\/$/, "") || "/";
  }

  function shouldFilterPage() {
    var path = pagePath();
    return path === "/games" || path === "/home" || path.indexOf("/category/") === 0;
  }

  function filterContainer(container, query) {
    var grid = container.querySelector('[class*="grid-cols-12"]') || container.querySelector("#all-games-list");
    if (!grid) return 0;

    var sectionHit = !!query && sectionMatches(container, query);
    var visible = 0;

    Array.prototype.forEach.call(grid.children, function(card) {
      var show = !query || sectionHit || cardMatches(card, query);
      card.style.display = show ? "" : "none";
      if (show) visible += 1;
    });

    if (query) {
      container.style.display = visible ? "" : "none";
    } else {
      container.style.display = "";
      Array.prototype.forEach.call(grid.children, function(card) {
        card.style.display = "";
      });
      visible = grid.children.length;
    }

    return visible;
  }

  function applySearchFilter() {
    if (!shouldFilterPage()) return;

    var query = getSearchQuery().trim();
    syncSearchInputs(query);

    var totalVisible = 0;
    document.querySelectorAll(".game-banner-container").forEach(function(container) {
      totalVisible += filterContainer(container, query);
    });

    if (query && totalVisible === 0) {
      window.location.replace("/games/");
      return;
    }

    if (query && totalVisible > 0) {
      var first = document.querySelector('.game-banner-container:not([style*="display: none"])');
      if (first) {
        window.setTimeout(function() {
          first.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 120);
      }
    }
  }

  function bindSearchForms() {
    document.querySelectorAll("form.search").forEach(function(form) {
      if (form.dataset.gcSearchBound === "1") return;
      form.dataset.gcSearchBound = "1";
      form.setAttribute("method", "get");
      form.setAttribute("action", "/games/");

      form.addEventListener("submit", function(event) {
        event.preventDefault();
        var input = form.querySelector('input[name="search"]');
        var query = input ? String(input.value || "").trim() : "";
        if (!query) {
          window.location.href = "/games/";
          return;
        }

        var categorySlug = resolveCategorySlug(query);
        if (categorySlug) {
          window.location.href = "/category/" + encodeURIComponent(categorySlug) + "/";
          return;
        }

        window.location.href = "/games/?search=" + encodeURIComponent(query);
      });

      var button = form.querySelector(".search-icon");
      if (button) {
        button.setAttribute("type", "submit");
        button.setAttribute("aria-label", "Search games");
      }
    });
  }

  function init() {
    bindSearchForms();
    applySearchFilter();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();</script>`;
}

function hasSiteSearch(html) {
  return /form[^>]*class="[^"]*search|class="search[^"]*"/.test(html);
}

function applySiteSearch(html) {
  if (!hasSiteSearch(html)) {
    return html;
  }
  let text = String(html || "");
  text = text.replace(/<script id="gc-site-search">[\s\S]*?<\/script>\s*/i, "");
  if (!text.includes("gc-site-search")) {
    text = text.replace("</body>", `${buildSiteSearchScript()}\n</body>`);
  }
  return text;
}

module.exports = {
  applySiteSearch,
  buildSiteSearchScript,
  hasSiteSearch,
};
