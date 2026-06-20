const fs = require("fs");
const path = require("path");

const CONFIG_PATH = path.join(__dirname, "../../admin/data/admin-config.json");
const NAV_CATEGORIES = ["Action", "Arcade", "Casual", "Puzzle", "Quiz", "Sports", "Board", "Match 3", "Card"];

const PLACEMENTS = [
  { key: "bottom_anchor", label: "Bottom anchor (site-wide)", defaultCode: "aa1", col: "left" },
  { key: "home_hero_mpu", label: "Home — hero MPU", defaultCode: "aa2", col: "left" },
  { key: "home_mpu_1", label: "Home — MPU 1", defaultCode: "aa3", col: "left" },
  { key: "list_top", label: "List — top", defaultCode: "aa4", col: "left" },
  { key: "game_preroll", label: "Game — pre-roll", defaultCode: "aa5", col: "left" },
  { key: "game_mpu_right", label: "Game — MPU right", defaultCode: "aa6", col: "left" },
  { key: "web_interstitial", label: "Web interstitial (site-wide)", defaultCode: "bb1", col: "right" },
  { key: "home_top_banner", label: "Home — top banner", defaultCode: "bb2", col: "right" },
  { key: "home_mpu_2", label: "Home — MPU 2", defaultCode: "bb3", col: "right" },
  { key: "list_mid", label: "List — mid", defaultCode: "bb4", col: "right" },
  { key: "game_mpu_left", label: "Game — MPU left", defaultCode: "bb5", col: "right" },
  { key: "game_preplay", label: "Game — pre-play gateway", defaultCode: "bb6", col: "right" },
];

function defaults() {
  const placements = {};
  for (const item of PLACEMENTS) {
    placements[item.key] = { enabled: true, code: item.defaultCode };
  }

  return {
    ads: {
      gam_network: "/23355254298/",
      refresh_sec: "35",
      amazon_pub_id: "",
      prebid_timeout: "1500",
      placements,
      prebid_bids: '{"f3":[{"bidder":"appnexus","params":{"placementId":"123"}}]}',
      ads_txt:
        "# ads.txt - GamesCandy games network\ngoogle.com, pub-7348172902389178, DIRECT, f08c47fec0942fa0\n",
    },
    site: {
      site_name: "GamesCandy",
      site_url: "http://localhost:3000",
      tagline: "Play free online games instantly",
      meta_title: "Play online games for Free | GamesCandy",
      meta_description: "Play free online games at GamesCandy. No downloads required.",
      meta_keywords: "games, free games, online games, html5 games",
      primary_color: "#6340F5",
      secondary_color: "#DF0F64",
      accent_color: "#8B5CF6",
      button_color: "#6340F5",
      button_hover_color: "#5230D5",
      link_color: "#6340F5",
      background_color: "#FFFFFF",
      text_color: "#1F1147",
      theme_color: "#6340F5",
      logo_desktop: "/images/logo.svg",
      logo_mobile: "/images/logo_mobile.svg",
      favicon: "/favicon.ico",
      home_hero_title: "Most Popular",
      footer_text: "© GamesCandy. All rights reserved.",
      copyright_year: "2026",
      footer_credit_links: [
        { label: "TrueTwist", url: "https://truetwist.in/" },
        { label: "369network", url: "https://369network.com/" },
      ],
      show_tournaments: true,
      enable_ads: false,
      homepage_most_popular: true,
      homepage_categories: true,
      homepage_recent: true,
    },
    nav: {
      items: [
        { label: "Home", url: "/home", enabled: true },
        { label: "All Games", url: "/games", enabled: true },
        { label: "Tournaments", url: "/tournaments", enabled: true },
        { label: "Action", url: "/category/Action", enabled: true },
        { label: "Arcade", url: "/category/Arcade", enabled: true },
        { label: "Casual", url: "/category/Casual", enabled: true },
        { label: "Puzzle", url: "/category/Puzzle", enabled: true },
        { label: "Quiz", url: "/category/Quiz", enabled: true },
        { label: "Sports", url: "/category/Sports", enabled: true },
        { label: "Board", url: "/category/Board", enabled: true },
        { label: "Match 3", url: "/category/Match 3", enabled: true },
        { label: "Card", url: "/category/Card", enabled: true },
      ],
    },
    code: {
      head_code: "",
      body_code: "",
      footer_code: "",
      custom_css: "",
    },
    analytics: {
      tracking_code: "",
      ga4_id: "",
      google_ads_id: "",
    },
  };
}

function mergeDeep(base, override) {
  const out = { ...base };
  for (const key of Object.keys(override || {})) {
    if (override[key] && typeof override[key] === "object" && !Array.isArray(override[key])) {
      out[key] = mergeDeep(base[key] || {}, override[key]);
    } else {
      out[key] = override[key];
    }
  }
  return out;
}

function ensureNavItems(items) {
  const list = Array.isArray(items) ? items.map((item) => ({ ...item })) : [];
  const urls = new Set(list.map((item) => String(item.url || "").trim()));
  for (const category of NAV_CATEGORIES) {
    const url = `/category/${category}`;
    if (!urls.has(url)) {
      list.push({ label: category, url, enabled: true });
    }
  }
  return list;
}

function load() {
  if (!fs.existsSync(CONFIG_PATH)) return defaults();
  try {
    const config = mergeDeep(defaults(), JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8")));
    config.nav.items = ensureNavItems(config.nav?.items);
    return config;
  } catch {
    return defaults();
  }
}

function save(config) {
  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

function saveAds(body) {
  const config = load();
  config.ads.gam_network = String(body.gam_network || "").trim();
  config.ads.refresh_sec = String(body.refresh_sec || "0").trim();
  config.ads.amazon_pub_id = String(body.amazon_pub_id || "").trim();
  config.ads.prebid_timeout = String(body.prebid_timeout || "1500").trim();
  config.ads.prebid_bids = String(body.prebid_bids || "");

  const enabled = body.placement_enabled || {};
  const codes = body.placement_code || {};
  for (const item of PLACEMENTS) {
    config.ads.placements[item.key].enabled = enabled[item.key] === "1" || enabled[item.key] === true;
    config.ads.placements[item.key].code = String(codes[item.key] || item.defaultCode).trim();
  }

  config.site.enable_ads = true;
  save(config);
  publishSite();
  return config;
}

function saveAdsTxt(content) {
  const config = load();
  config.ads.ads_txt = String(content ?? "");
  save(config);
  publishSite();
  return config;
}

function saveSite(body) {
  const config = load();
  const textFields = [
    "site_name", "site_url", "tagline", "meta_title", "meta_description", "meta_keywords",
    "primary_color", "secondary_color", "accent_color", "button_color", "button_hover_color",
    "link_color", "background_color", "text_color", "theme_color",
    "logo_desktop", "logo_mobile", "favicon",
    "home_hero_title", "footer_text", "copyright_year",
  ];
  for (const field of textFields) {
    config.site[field] = String(body[field] || "").trim();
  }
  config.site.show_tournaments = body.show_tournaments === "1";
  config.site.enable_ads = body.enable_ads === "1";
  config.site.homepage_most_popular = body.homepage_most_popular === "1";
  config.site.homepage_categories = body.homepage_categories === "1";
  config.site.homepage_recent = body.homepage_recent === "1";

  const creditLabels = body.footer_credit_label || [];
  const creditUrls = body.footer_credit_url || [];
  const footerCreditLinks = [];
  creditLabels.forEach((label, index) => {
    const cleanLabel = String(label || "").trim();
    const cleanUrl = String(creditUrls[index] || "").trim();
    if (!cleanLabel && !cleanUrl) return;
    footerCreditLinks.push({ label: cleanLabel, url: cleanUrl });
  });
  config.site.footer_credit_links = footerCreditLinks;

  save(config);
  return config;
}

function saveNav(body) {
  const config = load();
  const labels = body.nav_label || [];
  const urls = body.nav_url || [];
  const enabled = body.nav_enabled || {};
  const items = [];

  labels.forEach((label, index) => {
    const cleanLabel = String(label || "").trim();
    const cleanUrl = String(urls[index] || "").trim();
    if (!cleanLabel && !cleanUrl) return;
    items.push({
      label: cleanLabel,
      url: cleanUrl,
      enabled: enabled[String(index)] === "1" || enabled[index] === "1" || enabled[index] === true,
    });
  });

  config.nav.items = items;
  save(config);
  return config;
}

function saveCode(body) {
  const config = load();
  for (const field of ["head_code", "body_code", "footer_code", "custom_css"]) {
    config.code[field] = String(body[field] || "");
  }
  save(config);
  return config;
}

function saveAnalyticsCodes(trackingCode, ga4Id = "", googleAdsId = "") {
  const config = load();
  config.analytics.tracking_code = String(trackingCode || "").trim();
  config.analytics.ga4_id = String(ga4Id || "").trim();
  config.analytics.google_ads_id = String(googleAdsId || "").trim();
  save(config);
  return config;
}

function clearAnalyticsCodes() {
  return saveAnalyticsCodes("", "", "");
}

function publishSite() {
  const config = load();
  config.published_at = new Date().toISOString();
  save(config);
  const now = new Date();
  fs.utimesSync(CONFIG_PATH, now, now);
  return config;
}

module.exports = {
  PLACEMENTS,
  load,
  save,
  saveAds,
  saveAdsTxt,
  saveSite,
  saveNav,
  saveCode,
  saveAnalyticsCodes,
  clearAnalyticsCodes,
  publishSite,
};
