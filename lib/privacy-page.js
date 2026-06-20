function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isPrivacyPage(html) {
  return /href="\/privacy-policy"/.test(html) && /What this Privacy Policy covers/i.test(html);
}

function buildPrivacyCss() {
  return `<style id="gc-privacy-css">
.gc-privacy-page {
  margin: 1.25rem 0 1.75rem;
  font-family: "Poppins", Roboto, sans-serif;
}
.gc-privacy-shell {
  border-radius: 30px;
  overflow: hidden;
  box-shadow: 0 28px 70px rgba(31, 17, 71, 0.16);
  background: #fff;
  border: 1px solid rgba(99, 64, 245, 0.08);
}
.gc-privacy-hero {
  position: relative;
  padding: 2.5rem 1.5rem 2.25rem;
  color: #fff;
  background:
    radial-gradient(circle at 12% 18%, rgba(255,255,255,0.18), transparent 42%),
    radial-gradient(circle at 88% 82%, rgba(0,254,254,0.18), transparent 38%),
    linear-gradient(145deg, #6340f5 0%, #8b2fc9 42%, #502cba 100%);
  overflow: hidden;
}
.gc-privacy-hero::before {
  content: "";
  position: absolute;
  width: 220px;
  height: 220px;
  top: -70px;
  right: -50px;
  border-radius: 9999px;
  background: rgba(255,255,255,0.07);
  pointer-events: none;
}
.gc-privacy-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.35rem 0.85rem;
  border-radius: 9999px;
  background: rgba(255,255,255,0.14);
  border: 1px solid rgba(255,255,255,0.22);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-bottom: 1rem;
}
.gc-privacy-hero h1 {
  position: relative;
  z-index: 1;
  margin: 0 0 0.75rem;
  font-size: clamp(1.75rem, 5vw, 2.35rem);
  font-weight: 700;
  line-height: 1.15;
  text-transform: none !important;
}
.gc-privacy-hero p {
  position: relative;
  z-index: 1;
  margin: 0;
  max-width: 36rem;
  font-size: 0.95rem;
  line-height: 1.65;
  color: rgba(255,255,255,0.92);
  text-transform: none !important;
}
.gc-privacy-updated {
  margin-top: 0.85rem !important;
  font-size: 0.8rem !important;
  opacity: 0.85;
}
.gc-privacy-body {
  padding: 1.75rem 1.25rem 2rem;
  overflow: visible;
  text-transform: none !important;
}
.gc-privacy-body * {
  text-transform: none !important;
}
.gc-privacy-body > ol.list-decimal {
  counter-reset: gc-privacy-section;
  list-style: none;
  margin: 0;
  padding: 0;
  max-width: 52rem;
}
.gc-privacy-body > ol.list-decimal > li.text-\\[24px\\] {
  counter-increment: gc-privacy-section;
  margin: 2rem 0 0.85rem;
  padding: 0;
  font-size: 1.2rem !important;
  font-weight: 700 !important;
  line-height: 1.35 !important;
  letter-spacing: -0.01em;
  color: #1f1147 !important;
  list-style: none;
}
.gc-privacy-body > ol.list-decimal > li.text-\\[24px\\]:first-child {
  margin-top: 0;
}
.gc-privacy-body > ol.list-decimal > li.text-\\[24px\\]::before {
  content: counter(gc-privacy-section) ". ";
  color: var(--gc-primary, #6340f5);
}
.gc-privacy-body > ol.list-decimal > p,
.gc-privacy-body > ol.list-decimal > ul > p,
.gc-privacy-body > ol.list-decimal > ul > li + p {
  margin: 0 0 1.1rem;
  padding: 0;
  font-size: 0.9375rem !important;
  line-height: 1.72 !important;
  color: #374151 !important;
  letter-spacing: normal !important;
}
.gc-privacy-body p br {
  display: none;
}
.gc-privacy-body ul,
.gc-privacy-body ol.list-\\[lower-alpha\\] {
  margin: 0 0 1.1rem;
  padding-left: 1.35rem;
}
.gc-privacy-body ul li,
.gc-privacy-body ol.list-\\[lower-alpha\\] li {
  margin-bottom: 0.55rem;
  font-size: 0.9375rem !important;
  line-height: 1.65 !important;
  color: #374151 !important;
  padding-left: 0.25rem;
}
.gc-privacy-body ul li br,
.gc-privacy-body ol.list-\\[lower-alpha\\] li br {
  display: none;
}
@media (min-width: 768px) {
  .gc-privacy-hero {
    padding: 3rem 2.75rem 2.75rem;
  }
  .gc-privacy-body {
    padding: 2.5rem 2.75rem 2.75rem;
  }
  .gc-privacy-body > ol.list-decimal > li.text-\\[24px\\] {
    font-size: 1.35rem !important;
  }
}
@media (max-width: 639px) {
  .gc-privacy-page {
    margin: 0.85rem 0 1.25rem;
  }
  .gc-privacy-hero {
    padding: 1.75rem 1.15rem 1.65rem;
  }
  .gc-privacy-hero h1 {
    font-size: 1.55rem;
  }
  .gc-privacy-body {
    padding: 1.35rem 1rem 1.65rem;
  }
  .gc-privacy-body > ol.list-decimal > li.text-\\[24px\\] {
    font-size: 1.05rem !important;
    margin-top: 1.5rem;
  }
  .gc-privacy-body > ol.list-decimal > p,
  .gc-privacy-body ul li,
  .gc-privacy-body ol.list-\\[lower-alpha\\] li {
    font-size: 0.875rem !important;
    line-height: 1.65 !important;
  }
}
</style>`;
}

function buildPrivacyHero(siteName) {
  const brand = esc(siteName || "GamesCandy");
  return `<section class="gc-privacy-page">
  <div class="gc-privacy-shell">
    <div class="gc-privacy-hero">
      <span class="gc-privacy-badge"><i class="fa-solid fa-shield-halved"></i> Your Privacy</span>
      <h1>Privacy Policy</h1>
      <p>Learn how ${brand} collects, uses, and protects your information when you use our games and website.</p>
      <p class="gc-privacy-updated">Last updated: January 2026</p>
    </div>
    <div class="gc-privacy-body">`;
}

const PRIVACY_OPEN =
  /<div class="my-5 bg-white py-8 px-4 md:py-12 md:px-16 grid justify-center place-item-center rounded-\[30px\]">/i;
const PRIVACY_CLOSE = /<\/ol>\s*<\/div>\s*(?=<script)/i;

function applyPrivacyPage(text, site) {
  if (!isPrivacyPage(text)) {
    return text;
  }

  text = text.replace(/<style id="gc-privacy-css">[\s\S]*?<\/style>\s*/i, "");
  text = text.replace("</head>", `${buildPrivacyCss()}\n</head>`);

  if (PRIVACY_OPEN.test(text)) {
    text = text.replace(PRIVACY_OPEN, buildPrivacyHero(site?.site_name || site?.siteName || "GamesCandy"));
  }

  if (PRIVACY_CLOSE.test(text)) {
    text = text.replace(PRIVACY_CLOSE, "</ol>\n    </div>\n  </div>\n</section>\n");
  }

  text = text.replace(/<h1 class="sr-only">Privacy Policy[^<]*<\/h1>\s*/i, "");

  text = text.replace(/<body class="([^"]*)"/i, (match, classes) => {
    if (classes.includes("gc-privacy-page")) {
      return match;
    }
    return `<body class="${classes} gc-privacy-page"`;
  });

  return text;
}

module.exports = {
  applyPrivacyPage,
  buildPrivacyCss,
  isPrivacyPage,
};
