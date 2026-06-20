document.addEventListener("DOMContentLoaded", function () {
  var btn = document.getElementById("gc-admin-menu-btn");
  var panel = document.getElementById("gc-admin-mobile-nav");
  if (!btn || !panel) return;

  function closeNav() {
    panel.classList.remove("gc-admin-nav-open");
    btn.setAttribute("aria-expanded", "false");
  }

  btn.addEventListener("click", function () {
    var open = panel.classList.toggle("gc-admin-nav-open");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  });

  panel.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", closeNav);
  });

  document.addEventListener("click", function (event) {
    if (!panel.classList.contains("gc-admin-nav-open")) return;
    if (event.target.closest("#gc-admin-mobile-nav, #gc-admin-menu-btn")) return;
    closeNav();
  });
});
