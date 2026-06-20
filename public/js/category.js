(function () {
  function slugFromCard(card) {
    var link = card.querySelector('a[href^="/view-game/"]');
    if (!link) return "";
    return decodeURIComponent((link.getAttribute("href") || "").replace(/^\/view-game\//, ""));
  }

  function titleFromCard(card, meta) {
    var slug = slugFromCard(card);
    if (meta[slug] && meta[slug].title) return meta[slug].title;
    var h3 = card.querySelector("h3");
    return h3 ? h3.textContent.trim() : slug;
  }

  function scoreFromCard(card, meta) {
    var slug = slugFromCard(card);
    if (meta[slug] && meta[slug].score) return Number(meta[slug].score) || 0;
    var h = 0;
    for (var i = 0; i < slug.length; i += 1) {
      h = ((h << 5) - h + slug.charCodeAt(i)) | 0;
    }
    return Math.abs(h % 100);
  }

  function isNewCard(card, meta) {
    var slug = slugFromCard(card);
    var flags = meta[slug] && Array.isArray(meta[slug].flags) ? meta[slug].flags : [];
    return flags.indexOf("new") >= 0;
  }

  function findGrid(select) {
    var container = select.closest(".game-banner-container");
    if (container) {
      var grid = container.querySelector(".grid.md\\:grid-cols-12");
      if (grid) return grid;
    }
    return document.querySelector(".min-h-\\[100vh\\] .grid.md\\:grid-cols-12");
  }

  function getUrlSort() {
    return new URL(window.location.href).searchParams.get("sort") || "default";
  }

  function setUrlSort(mode) {
    var url = new URL(window.location.href);
    if (!mode || mode === "default") {
      url.searchParams.delete("sort");
    } else {
      url.searchParams.set("sort", mode);
    }
    window.history.replaceState({}, "", url.pathname + url.search + url.hash);
  }

  function applySort(grid, original, mode, meta) {
    var sorted = original.slice();

    if (mode === "name") {
      sorted.sort(function (a, b) {
        return titleFromCard(a, meta).localeCompare(titleFromCard(b, meta), undefined, {
          sensitivity: "base",
        });
      });
    } else if (mode === "most-popular") {
      sorted.sort(function (a, b) {
        var diff = scoreFromCard(b, meta) - scoreFromCard(a, meta);
        if (diff !== 0) return diff;
        return titleFromCard(a, meta).localeCompare(titleFromCard(b, meta), undefined, {
          sensitivity: "base",
        });
      });
    } else if (mode === "new-arrival") {
      sorted.sort(function (a, b) {
        var aNew = isNewCard(a, meta) ? 1 : 0;
        var bNew = isNewCard(b, meta) ? 1 : 0;
        if (bNew !== aNew) return bNew - aNew;
        return original.indexOf(b) - original.indexOf(a);
      });
    }

    sorted.forEach(function (card) {
      grid.appendChild(card);
    });
  }

  function init() {
    var select = document.getElementById("sort_category_games");
    if (!select) return;

    var grid = findGrid(select);
    if (!grid) return;

    var meta = window.__gcCategorySortMeta || {};
    var original = Array.from(grid.children);
    var form = select.closest("form");

    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
      });
    }

    var initial = getUrlSort();
    if (select.querySelector('option[value="' + initial + '"]')) {
      select.value = initial;
    }

    applySort(grid, original, select.value || "default", meta);

    select.addEventListener("change", function () {
      var mode = select.value || "default";
      applySort(grid, original, mode, meta);
      setUrlSort(mode);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
