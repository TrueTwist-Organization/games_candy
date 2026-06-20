(function () {
  const input = document.getElementById("gc-games-search");
  const form = document.getElementById("gc-games-search-form");
  const tbody = document.getElementById("gc-games-tbody");
  const emptyRow = document.getElementById("gc-games-empty");
  const emptyQuery = document.getElementById("gc-games-empty-query");
  const countEl = document.getElementById("gc-games-count");
  const suggestEl = document.getElementById("gc-games-suggest");
  const clearBtn = document.getElementById("gc-games-clear");
  const totalEl = document.getElementById("gc-games-total");

  if (!input || !tbody) return;

  const rows = Array.from(tbody.querySelectorAll(".gc-game-row"));
  const total = totalEl ? parseInt(totalEl.dataset.total || "0", 10) : rows.length;
  let suggestIndex = -1;

  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[_-]/g, " ");
  }

  function matches(haystack, query) {
    const raw = String(query || "").trim().toLowerCase();
    if (!raw) return true;
    const terms = raw.split(/\s+/).filter(Boolean);
    const h = normalize(haystack);
    return terms.every((term) => h.includes(normalize(term)));
  }

  function formatNumber(n) {
    return Number(n).toLocaleString();
  }

  function updateCount(visible, query) {
    if (!countEl) return;
    const q = String(query || "").trim();
    if (q) {
      countEl.textContent =
        "Found " +
        formatNumber(visible) +
        " result" +
        (visible === 1 ? "" : "s") +
        ' for "' +
        q +
        '" · Showing ' +
        formatNumber(visible) +
        " of " +
        formatNumber(total) +
        " games from your GamesCandy site.";
    } else {
      countEl.textContent =
        "Showing " +
        formatNumber(visible) +
        " of " +
        formatNumber(total) +
        " games from your GamesCandy site.";
    }
  }

  function hideSuggest() {
    suggestIndex = -1;
    if (suggestEl) {
      suggestEl.classList.add("hidden");
      suggestEl.innerHTML = "";
    }
  }

  function renderSuggest(query, matchedRows) {
    if (!suggestEl) return;
    const q = String(query || "").trim();
    if (!q) {
      hideSuggest();
      return;
    }

    suggestIndex = -1;
    const items = matchedRows.slice(0, 8).map((row) => ({
      title: row.dataset.title || "",
      category: row.dataset.category || "",
    }));

    if (items.length === 0) {
      suggestEl.innerHTML =
        '<div class="px-3 py-2 text-sm text-slate-500">No matching games</div>';
      suggestEl.classList.remove("hidden");
      return;
    }

    suggestEl.innerHTML = items
      .map(
        (item, i) =>
          '<button type="button" class="gc-games-suggest-item w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 focus:bg-indigo-50 focus:outline-none" data-index="' +
          i +
          '"><span class="font-medium text-slate-900">' +
          escapeHtml(item.title) +
          '</span><span class="text-slate-400 text-xs ml-2">' +
          escapeHtml(item.category) +
          "</span></button>"
      )
      .join("");
    suggestEl.classList.remove("hidden");

    suggestEl.querySelectorAll(".gc-games-suggest-item").forEach((btn) => {
      btn.addEventListener("mousedown", (e) => {
        e.preventDefault();
        const idx = parseInt(btn.dataset.index || "0", 10);
        const row = matchedRows[idx];
        if (row) {
          input.value = row.dataset.title || input.value;
          applyFilter();
          row.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
        hideSuggest();
        input.focus();
      });
    });
  }

  function updateSuggestHighlight() {
    if (!suggestEl) return;
    suggestEl.querySelectorAll(".gc-games-suggest-item").forEach((btn, i) => {
      btn.classList.toggle("bg-indigo-50", i === suggestIndex);
    });
  }

  function escapeHtml(text) {
    return String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  let matchedRows = [];

  function applyFilter() {
    const q = input.value;
    let visible = 0;
    matchedRows = [];

    rows.forEach((row) => {
      const ok = matches(row.dataset.search, q);
      row.classList.toggle("hidden", !ok);
      if (ok) {
        visible += 1;
        matchedRows.push(row);
      }
    });

    if (emptyRow) {
      const showEmpty = String(q).trim() !== "" && visible === 0;
      emptyRow.classList.toggle("hidden", !showEmpty);
      if (emptyQuery) emptyQuery.textContent = String(q).trim();
    }

    updateCount(visible, q);
    renderSuggest(q, matchedRows);

    if (clearBtn) {
      clearBtn.classList.toggle("hidden", !String(q).trim());
    }
  }

  input.addEventListener("input", applyFilter);

  input.addEventListener("keydown", (e) => {
    if (!suggestEl || suggestEl.classList.contains("hidden")) return;
    const items = suggestEl.querySelectorAll(".gc-games-suggest-item");
    if (items.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      suggestIndex = Math.min(suggestIndex + 1, items.length - 1);
      updateSuggestHighlight();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      suggestIndex = Math.max(suggestIndex - 1, 0);
      updateSuggestHighlight();
    } else if (e.key === "Enter" && suggestIndex >= 0) {
      e.preventDefault();
      items[suggestIndex].dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    } else if (e.key === "Escape") {
      hideSuggest();
    }
  });

  input.addEventListener("blur", () => {
    window.setTimeout(hideSuggest, 150);
  });

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      applyFilter();
      hideSuggest();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      input.value = "";
      applyFilter();
      input.focus();
    });
  }

  applyFilter();
})();
