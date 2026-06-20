$(document).ready(function () {
    $("#btn-back-to-top").click(function () {
        $("html, body").animate({ scrollTop: 0 }, "slow");
    });

    $(window).on("scroll", function () {
        if ($(this).scrollTop() > 20) {
            $("#btn-back-to-top").removeClass("hidden");
        } else {
            $("#btn-back-to-top").addClass("hidden");
        }
    });

    function closeMobileSearch($nav) {
        $nav.find(".gc-mobile-search-panel").addClass("hidden");
        $nav.removeClass("gc-search-open");
        $nav.find(".gc-mobile-search-toggle").attr("aria-expanded", "false");
        $nav.find(".gc-mobile-search-toggle i").attr("class", "fa-solid fa-magnifying-glass");
    }

    function initMobileSearch($nav) {
        if (window.innerWidth >= 1280) {
            return;
        }

        var $mobileRow = $nav.find('[class*="2xl:hidden"].flex.items-center').first();
        var $form = $mobileRow.find("form.search").first();
        if (!$form.length || $form.data("gc-search-init")) {
            return;
        }
        $form.data("gc-search-init", true);

        var $input = $form.find('input[name="search"]');
        var $navCol = $nav.find("> div.flex.flex-col").first();
        var $panel = $('<div class="gc-mobile-search-panel hidden"></div>');

        $form.addClass("gc-mobile-search-form").detach().appendTo($panel);
        $navCol.append($panel);

        var $toggle = $(
            '<button type="button" class="gc-mobile-search-toggle" aria-label="Search games" aria-expanded="false">' +
                '<i class="fa-solid fa-magnifying-glass"></i>' +
            "</button>"
        );
        $mobileRow.append($toggle);

        $toggle.on("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            var $panelEl = $nav.find(".gc-mobile-search-panel");
            var isOpen = !$panelEl.hasClass("hidden");
            if (isOpen) {
                closeMobileSearch($nav);
                return;
            }
            closeMobileSearch($("nav").not($nav));
            $nav.find(".group.relative").removeClass("gc-dropdown-open");
            $nav.removeClass("gc-nav-open");
            $nav.find(".gc-mobile-toggle i").attr("class", "fa-solid fa-bars");
            $nav.find(".gc-mobile-toggle").attr("aria-expanded", "false");
            $panelEl.removeClass("hidden");
            $nav.addClass("gc-search-open");
            $toggle.attr("aria-expanded", "true");
            $toggle.find("i").attr("class", "fa-solid fa-xmark");
            window.setTimeout(function () {
                $input.trigger("focus");
            }, 60);
        });

        $form.on("submit", function (e) {
            var query = String($input.val() || "").trim();
            if (!query) {
                e.preventDefault();
            }
        });
    }

    $("nav").each(function () {
        var $nav = $(this);
        if ($nav.data("gc-mobile-init")) {
            return;
        }
        $nav.data("gc-mobile-init", true);

        var $topRow = $nav.find("> div > div.flex.justify-between").first();
        var $links = $nav.find("> div > div.flex.items-center.justify-center").first();

        if (!$topRow.length || !$links.length) {
            return;
        }

        $links.addClass("gc-nav-links");

        if (!$nav.find(".gc-mobile-toggle").length) {
            var $toggle = $(
                '<button type="button" class="gc-mobile-toggle" aria-label="Open menu" aria-expanded="false">' +
                    '<i class="fa-solid fa-bars"></i>' +
                "</button>"
            );
            $topRow.prepend($toggle);

            $toggle.on("click", function (e) {
                e.stopPropagation();
                closeMobileSearch($nav);
                var open = $nav.toggleClass("gc-nav-open").hasClass("gc-nav-open");
                $toggle.attr("aria-expanded", open ? "true" : "false");
                $toggle.find("i").attr(
                    "class",
                    open ? "fa-solid fa-xmark" : "fa-solid fa-bars"
                );
            });
        }

        initMobileSearch($nav);

        $nav.find(".group.relative").each(function () {
            var $group = $(this);
            $group.find("> button").on("click", function (e) {
                if (window.innerWidth >= 1280) {
                    return;
                }
                e.preventDefault();
                e.stopPropagation();
                closeMobileSearch($nav);
                $nav.find(".group.relative").not($group).removeClass("gc-dropdown-open");
                $group.toggleClass("gc-dropdown-open");
            });
        });
    });

    $(document).on("click", function (e) {
        if ($(e.target).closest(".gc-mobile-search-panel, .gc-mobile-search-toggle").length) {
            return;
        }
        $("nav").each(function () {
            closeMobileSearch($(this));
        });
        $("nav .group.relative").removeClass("gc-dropdown-open");
    });
});
