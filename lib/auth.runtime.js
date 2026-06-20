(function () {
  function esc(text) {
    return String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function renderGuest() {
    return (
      '<a href="/login" class="gc-user-link block w-full h-full rounded-full overflow-hidden" aria-label="Sign in">' +
      '<img src="/images/user_profile_icon.svg" alt="Sign in" class="object-cover w-full h-full">' +
      "</a>"
    );
  }

  function renderUser(user) {
    var initial = esc((user.name || user.email || "U").charAt(0).toUpperCase());
    var menuId = "gc-user-dropdown-" + Math.random().toString(36).slice(2, 9);
    return (
      '<div class="gc-user-menu relative inline-flex">' +
      '<button type="button" class="gc-user-menu-btn h-10 w-10 rounded-full bg-light-theme-color text-white font-semibold flex items-center justify-center text-sm cursor-pointer shrink-0" aria-label="Account menu" aria-haspopup="true" aria-expanded="false" aria-controls="' +
      menuId +
      '">' +
      initial +
      "</button>" +
      '<div id="' +
      menuId +
      '" class="gc-user-dropdown hidden" role="menu" aria-label="Account menu">' +
      '<div class="gc-user-dropdown-head">' +
      '<div class="gc-user-dropdown-avatar" aria-hidden="true">' +
      initial +
      "</div>" +
      '<div class="min-w-0">' +
      '<p class="gc-user-dropdown-name">' +
      esc(user.name || "Player") +
      "</p>" +
      '<p class="gc-user-dropdown-email">' +
      esc(user.email || "") +
      "</p>" +
      "</div></div>" +
      '<div class="gc-user-dropdown-actions">' +
      '<a href="/logout" class="gc-user-dropdown-signout" role="menuitem">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>' +
      "Sign out</a>" +
      "</div></div></div>"
    );
  }

  function portalDropdown(dropdown) {
    if (dropdown.parentElement !== document.body) {
      document.body.appendChild(dropdown);
    }
  }

  function closeAllDropdowns() {
    document.querySelectorAll(".gc-user-dropdown").forEach(function (item) {
      item.classList.add("hidden");
    });
    document.querySelectorAll(".gc-user-menu-btn").forEach(function (item) {
      item.setAttribute("aria-expanded", "false");
    });
  }

  function positionDropdown(btn, dropdown) {
    portalDropdown(dropdown);
    var rect = btn.getBoundingClientRect();
    dropdown.style.visibility = "hidden";
    dropdown.classList.remove("hidden");
    var width = dropdown.offsetWidth || 240;
    var height = dropdown.offsetHeight || 120;
    var gap = 10;
    var left = rect.right - width;
    var top = rect.bottom + gap;

    if (left < 12) left = 12;
    if (left + width > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - width - 12);
    }
    if (top + height > window.innerHeight - 12) {
      top = rect.top - height - gap;
    }

    dropdown.style.top = Math.round(top) + "px";
    dropdown.style.left = Math.round(left) + "px";
    dropdown.style.visibility = "visible";
  }

  function openDropdown(btn, dropdown) {
    positionDropdown(btn, dropdown);
    btn.setAttribute("aria-expanded", "true");
  }

  function bindMenus() {
    document.querySelectorAll("header .gc-user-menu").forEach(function (menu) {
      if (menu.dataset.gcBound === "1") return;
      menu.dataset.gcBound = "1";

      var btn = menu.querySelector(".gc-user-menu-btn");
      var dropdown = menu.querySelector(".gc-user-dropdown");
      if (!btn || !dropdown) return;

      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        var isOpen = !dropdown.classList.contains("hidden");
        closeAllDropdowns();
        if (!isOpen) {
          openDropdown(btn, dropdown);
        }
      });
    });

    if (!document.body.dataset.gcUserMenuBound) {
      document.body.dataset.gcUserMenuBound = "1";

      document.addEventListener("click", function (e) {
        if (e.target.closest(".gc-user-menu") || e.target.closest(".gc-user-dropdown")) return;
        closeAllDropdowns();
      });

      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") closeAllDropdowns();
      });

      window.addEventListener("resize", closeAllDropdowns);
    }
  }

  function mountProfile(user) {
    document.querySelectorAll(".gc-user-dropdown").forEach(function (node) {
      if (node.parentElement === document.body) node.remove();
    });

    document.querySelectorAll("header .gc-user-slot").forEach(function (slot) {
      if (user) {
        slot.classList.remove("overflow-hidden");
        slot.classList.add("overflow-visible", "relative", "z-[1201]");
        slot.innerHTML = renderUser(user);
      } else {
        slot.classList.remove("overflow-visible", "relative", "z-[1201]");
        slot.classList.add("overflow-hidden");
        slot.innerHTML = renderGuest();
      }
    });
    if (user) bindMenus();
  }

  if (document.body && document.body.id === "gc-auth-page") return;

  fetch("/api/auth/me", { credentials: "same-origin" })
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      mountProfile(data && data.user ? data.user : null);
    })
    .catch(function () {
      mountProfile(null);
    });
})();
