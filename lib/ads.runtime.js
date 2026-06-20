(function(){
  var cfg = window.__gcAds;
  if (!cfg || !cfg.enabled) return;

  function byPlacement(key){
    return (cfg.placements || []).find(function(item){ return item.key === key; });
  }

  function insertAfter(node, html){
    if (!node) return null;
    node.insertAdjacentHTML("afterend", html);
    return node.nextElementSibling;
  }

  function slotHtml(key, extraClass){
    return '<div id="gc-ad-'+key+'" class="gc-ad-slot ads-content my-5 '+ (extraClass || "") +'" data-gc-placement="'+key+'"></div>';
  }

  function findHeader(){
    return document.querySelector("header");
  }

  function findSectionHeader(text){
    var headers = document.querySelectorAll("h3");
    for (var i = 0; i < headers.length; i++) {
      if ((headers[i].textContent || "").trim().toLowerCase() === text) return headers[i];
    }
    return null;
  }

  function mountStandardSlots(){
    var pageType = cfg.pageType || "other";

    if (pageType === "home") {
      if (byPlacement("home_top_banner")) insertAfter(findHeader(), slotHtml("home_top_banner", "gc-ad-banner"));
      var popular = findSectionHeader("most popular");
      if (popular && byPlacement("home_hero_mpu")) insertAfter(popular.closest(".w-full.flex.items-center") || popular, slotHtml("home_hero_mpu", "gc-ad-mpu"));
      var popularGrid = popular && popular.closest(".game-banner-container, .bg-white");
      if (popularGrid && byPlacement("home_mpu_1")) {
        var grid = popularGrid.querySelector(".grid");
        if (grid) insertAfter(grid, slotHtml("home_mpu_1", "gc-ad-mpu"));
      }
      var arrival = findSectionHeader("new arrival");
      if (arrival && byPlacement("home_mpu_2")) {
        var arrivalGrid = (arrival.closest(".game-banner-container, .bg-white") || arrival.parentElement).querySelector(".grid");
        if (arrivalGrid) insertAfter(arrivalGrid, slotHtml("home_mpu_2", "gc-ad-mpu"));
      }
    }

    if (pageType === "list") {
      var firstSection = document.querySelector(".game-banner-container");
      if (firstSection && byPlacement("list_top")) {
        var topTarget = firstSection.querySelector(".w-full.flex.items-center") || firstSection;
        insertAfter(topTarget, slotHtml("list_top", "gc-ad-banner"));
      }
      var sections = document.querySelectorAll(".game-banner-container");
      if (sections.length && byPlacement("list_mid")) {
        var midIndex = Math.min(2, sections.length - 1);
        var midSection = sections[midIndex];
        var midGrid = midSection.querySelector(".grid");
        if (midGrid) insertAfter(midGrid, slotHtml("list_mid", "gc-ad-mpu"));
      }
    }

    if (pageType === "game_view") {
      var playBtn = document.querySelector(".animatedPlayBtn");
      if (playBtn && byPlacement("game_preplay")) {
        var host = playBtn.closest(".game-banner-container") || playBtn.closest(".my-5") || playBtn.parentElement;
        if (host) insertAfter(host, slotHtml("game_preplay", "gc-ad-mpu"));
      }
    }

    if (pageType === "game_play") {
      if (byPlacement("game_mpu_left") && !document.getElementById("gc-ad-game_mpu_left")) {
        document.body.insertAdjacentHTML("beforeend", '<div id="gc-ad-game_mpu_left" class="gc-ad-rail gc-ad-rail-left gc-ad-slot ads-content" data-gc-placement="game_mpu_left"></div>');
      }
      if (byPlacement("game_mpu_right") && !document.getElementById("gc-ad-game_mpu_right")) {
        document.body.insertAdjacentHTML("beforeend", '<div id="gc-ad-game_mpu_right" class="gc-ad-rail gc-ad-rail-right gc-ad-slot ads-content" data-gc-placement="game_mpu_right"></div>');
      }
    }
  }

  function loadScript(src, cb){
    var s = document.createElement("script");
    s.async = true;
    s.src = src;
    s.onload = function(){ if (cb) cb(); };
    s.onerror = function(){ if (cb) cb(); };
    document.head.appendChild(s);
  }

  function renderAdsenseSlot(node, placement){
    if (!node || !cfg.adsenseClient) return;
    var ins = document.createElement("ins");
    ins.className = "adsbygoogle ads-content";
    ins.style.display = "block";
    ins.style.textAlign = "center";
    ins.setAttribute("data-ad-client", cfg.adsenseClient);
    ins.setAttribute("data-ad-slot", /^\d+$/.test(placement.code) ? placement.code : "5203068982");
    ins.setAttribute("data-ad-format", placement.key.indexOf("banner") >= 0 ? "horizontal" : "auto");
    ins.setAttribute("data-full-width-responsive", "true");
    node.innerHTML = "";
    node.appendChild(ins);
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  }

  function defineGptSlots(){
    var slots = [];
    (cfg.placements || []).forEach(function(placement){
      if (placement.key === "game_preroll") return;
      var node = document.querySelector('[data-gc-placement="'+placement.key+'"]');
      if (!node) node = document.getElementById("gc-ad-" + placement.key);
      if (!node || !placement.unitPath) return;

      if (placement.sizes === "anchor") {
        var anchorSlot = googletag.defineOutOfPageSlot(placement.unitPath, googletag.enums.OutOfPageFormat.BOTTOM_ANCHOR);
        if (anchorSlot) {
          anchorSlot.addService(googletag.pubads());
          slots.push({ slot: anchorSlot, node: null, key: placement.key });
        }
        return;
      }

      if (placement.sizes === "interstitial") {
        var interstitialSlot = googletag.defineOutOfPageSlot(placement.unitPath, googletag.enums.OutOfPageFormat.INTERSTITIAL);
        if (interstitialSlot) {
          interstitialSlot.addService(googletag.pubads());
          slots.push({ slot: interstitialSlot, node: null, key: placement.key });
        }
        return;
      }

      var divId = node.id || ("gc-ad-" + placement.key);
      node.id = divId;
      var slot = googletag.defineSlot(placement.unitPath, placement.sizes || [[300,250], "fluid"], divId);
      if (!slot) return;
      slot.addService(googletag.pubads());
      slots.push({ slot: slot, node: node, key: placement.key });
    });
    return slots;
  }

  function displayGptSlots(slots){
    googletag.pubads().enableSingleRequest();
    googletag.pubads().collapseEmptyDivs();
    googletag.enableServices();
    slots.forEach(function(item){
      if (item.node) googletag.display(item.node.id);
    });
    if (cfg.refreshSec > 0) {
      setInterval(function(){
        googletag.pubads().refresh(slots.map(function(item){ return item.slot; }));
      }, cfg.refreshSec * 1000);
    }
  }

  function initAds(){
    mountStandardSlots();

    var useGpt = !!cfg.gamNetwork;
    if (useGpt) {
      window.googletag = window.googletag || { cmd: [] };
      googletag.cmd.push(function(){
        var slots = defineGptSlots();
        displayGptSlots(slots);
      });
      if (!document.querySelector('script[src*="securepubads.g.doubleclick.net/tag/js/gpt.js"]')) {
        loadScript("https://securepubads.g.doubleclick.net/tag/js/gpt.js");
      }
      return;
    }

    if (cfg.adsenseClient) {
      (cfg.placements || []).forEach(function(placement){
        if (placement.key === "game_preroll") return;
        var node = document.querySelector('[data-gc-placement="'+placement.key+'"]') || document.getElementById("gc-ad-" + placement.key);
        renderAdsenseSlot(node, placement);
      });
      if (!document.querySelector('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]')) {
        loadScript("https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + encodeURIComponent(cfg.adsenseClient));
      }
    }
  }

  function setupGamePreroll(getGameProxyUrl){
    if (document.body && document.body.dataset.gcPrerollBound === "1") return;
    document.body.dataset.gcPrerollBound = "1";

    var placement = byPlacement("game_preroll");
    var container = document.querySelector(".game-ad-container");
    var button = document.getElementById("continue-btn");
    if (!container || !button) {
      startGame(getGameProxyUrl);
      return;
    }

    if (cfg.gamNetwork && placement && placement.unitPath) {
      window.googletag = window.googletag || { cmd: [] };
      googletag.cmd.push(function(){
        container.id = "gc-ad-game_preroll";
        var slot = googletag.defineSlot(placement.unitPath, placement.sizes || [[300,250], "fluid"], container.id);
        if (slot) {
          slot.addService(googletag.pubads());
          googletag.pubads().enableSingleRequest();
          googletag.enableServices();
          googletag.display(container.id);
        }
      });
      if (!document.querySelector('script[src*="securepubads.g.doubleclick.net/tag/js/gpt.js"]')) {
        loadScript("https://securepubads.g.doubleclick.net/tag/js/gpt.js");
      }
    } else if (cfg.adsenseClient) {
      renderAdsenseSlot(container, placement || { key: "game_preroll", code: "5203068982" });
      if (!document.querySelector('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]')) {
        loadScript("https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + encodeURIComponent(cfg.adsenseClient));
      }
    }

    var timeLeft = 3;
    button.disabled = true;
    button.textContent = "Continue in " + timeLeft + "!";
    var countdown = setInterval(function(){
      timeLeft -= 1;
      if (timeLeft <= 0) {
        clearInterval(countdown);
        button.disabled = false;
        button.textContent = "Continue!";
        button.classList.remove("bg-gray-600");
        button.classList.add("bg-light-theme-color");
      } else {
        button.textContent = "Continue in " + timeLeft + "!";
      }
    }, 1000);

    button.addEventListener("click", function(){
      button.style.display = "none";
      var adMain = document.getElementById("game-ad-container-main");
      if (adMain) adMain.style.display = "none";
      startGame(getGameProxyUrl);
    });
  }

  function startGame(getGameProxyUrl){
    var gameMain = document.getElementById("game-content-main");
    var gameContent = document.getElementById("game-content");
    var loading = document.getElementById("loading");
    if (!gameMain || !gameContent) return;

    gameMain.classList.remove("hidden");
    gameMain.style.height = "calc(100dvh - 40px)";
    gameMain.style.background = "#000";
    gameContent.style.position = "relative";
    gameContent.style.width = "100%";
    gameContent.style.height = "100%";
    gameContent.style.background = "#000";
    gameContent.style.overflow = "hidden";
    if (loading) loading.classList.remove("hidden");

    var proxyUrl = typeof getGameProxyUrl === "function" ? getGameProxyUrl(window.game_url || "") : (window.game_url || "");
    if (window.jQuery) {
      window.jQuery(gameContent).load(proxyUrl, function(response, status){
        if (loading) loading.classList.add("hidden");
        if (status === "error") {
          gameContent.innerHTML = '<p style="color:#fff;text-align:center;padding:2rem;">Game failed to load. Please refresh.</p>';
        }
      });
    } else {
      fetch(proxyUrl).then(function(res){ return res.text(); }).then(function(html){
        gameContent.innerHTML = html;
        if (loading) loading.classList.add("hidden");
      }).catch(function(){
        if (loading) loading.classList.add("hidden");
        gameContent.innerHTML = '<p style="color:#fff;text-align:center;padding:2rem;">Game failed to load. Please refresh.</p>';
      });
    }
    setTimeout(function(){ if (loading) loading.classList.add("hidden"); }, 12000);
  }

  window.GCAds = {
    setupGamePreroll: setupGamePreroll,
    startGame: startGame
  };

  function bootGamePlayPage(){
    if ((cfg.pageType || "") !== "game_play") return;
    if (typeof window.getGameProxyUrl !== "function" && !window.game_url) return;
    var getProxy = typeof window.getGameProxyUrl === "function" ? window.getGameProxyUrl : function(url){ return url; };
    setupGamePreroll(getProxy);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function(){
      initAds();
      bootGamePlayPage();
    });
  } else {
    initAds();
    bootGamePlayPage();
  }
})();
