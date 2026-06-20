function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isContactPage(html) {
  return /id="contact_us_form"/.test(html) && /Contact Us/i.test(html);
}

function buildContactCss() {
  return `<style id="gc-contact-css">
.gc-contact-page {
  margin: 1.25rem 0 1.75rem;
  font-family: "Poppins", Roboto, sans-serif;
}
.gc-contact-shell {
  position: relative;
  border-radius: 30px;
  overflow: hidden;
  box-shadow: 0 28px 70px rgba(31, 17, 71, 0.16);
  background: #fff;
  border: 1px solid rgba(99, 64, 245, 0.08);
}
.gc-contact-grid {
  display: grid;
  grid-template-columns: 1fr;
  min-height: 560px;
}
@media (min-width: 960px) {
  .gc-contact-grid {
    grid-template-columns: 1fr 1fr;
    min-height: 580px;
  }
}
.gc-contact-hero {
  position: relative;
  z-index: 1;
  padding: 2.75rem 2rem 2.5rem;
  color: #fff;
  background:
    radial-gradient(circle at 12% 18%, rgba(255,255,255,0.2), transparent 42%),
    radial-gradient(circle at 88% 82%, rgba(0,254,254,0.22), transparent 38%),
    linear-gradient(145deg, #6340f5 0%, #8b2fc9 42%, #502cba 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
}
@media (min-width: 960px) {
  .gc-contact-hero { padding: 3rem 2.75rem; }
}
.gc-contact-hero::before,
.gc-contact-hero::after {
  content: "";
  position: absolute;
  border-radius: 9999px;
  pointer-events: none;
}
.gc-contact-hero::before {
  width: 260px;
  height: 260px;
  top: -90px;
  right: -60px;
  background: rgba(255,255,255,0.07);
}
.gc-contact-hero::after {
  width: 180px;
  height: 180px;
  bottom: -55px;
  left: -40px;
  background: rgba(0,254,254,0.1);
}
.gc-contact-hero-inner { position: relative; z-index: 2; max-width: 24rem; }
.gc-contact-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  width: fit-content;
  padding: 0.4rem 0.95rem;
  border-radius: 9999px;
  background: rgba(255,255,255,0.14);
  border: 1px solid rgba(255,255,255,0.28);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 1.15rem;
}
.gc-contact-hero h1 {
  font-size: clamp(1.85rem, 4vw, 2.65rem);
  font-weight: 700;
  line-height: 1.12;
  margin: 0 0 0.85rem;
  letter-spacing: -0.03em;
}
.gc-contact-hero p {
  margin: 0;
  font-size: 0.98rem;
  line-height: 1.65;
  color: rgba(255,255,255,0.94);
}
.gc-contact-perks {
  list-style: none;
  margin: 2rem 0 0;
  padding: 0;
  display: grid;
  gap: 0.9rem;
}
.gc-contact-perks li {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-size: 0.9rem;
  font-weight: 500;
  line-height: 1.4;
}
.gc-contact-perks i {
  width: 2.15rem;
  height: 2.15rem;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.15);
  font-size: 0.85rem;
  flex-shrink: 0;
}
.gc-contact-form-wrap {
  padding: 2.25rem 1.5rem 2.5rem;
  background: #fff;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
@media (min-width: 960px) {
  .gc-contact-form-wrap {
    padding: 3rem 2.75rem;
    border-left: 1px solid rgba(99, 64, 245, 0.08);
    background:
      linear-gradient(180deg, rgba(99,64,245,0.035) 0%, rgba(255,255,255,0) 28%),
      #fff;
  }
}
.gc-contact-form-head {
  margin-bottom: 1.65rem;
}
.gc-contact-form-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: #1f1147;
  margin: 0 0 0.4rem;
  letter-spacing: -0.02em;
}
.gc-contact-form-sub {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0;
  line-height: 1.55;
}
#success:empty,
#errors:empty {
  display: none !important;
  margin: 0 !important;
  padding: 0 !important;
  border: 0 !important;
}
.gc-contact-alert {
  border-radius: 14px;
  padding: 0.85rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0 0 1rem;
  line-height: 1.45;
}
.gc-contact-alert-success {
  background: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
}
.gc-contact-alert-error {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}
.gc-contact-field {
  position: relative;
  margin-bottom: 1rem;
}
.gc-contact-field label {
  display: block;
  font-size: 0.78rem;
  font-weight: 600;
  color: #475569;
  margin-bottom: 0.45rem;
  letter-spacing: 0.02em;
}
.gc-contact-input-wrap {
  position: relative;
}
.gc-contact-input-wrap i {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6340f5;
  font-size: 0.88rem;
  pointer-events: none;
}
.gc-contact-field input,
.gc-contact-field textarea {
  width: 100%;
  border: 1.5px solid #e2e8f0;
  border-radius: 16px;
  background: #f8fafc;
  color: #1f1147;
  font-size: 0.94rem;
  font-family: inherit;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}
.gc-contact-field input {
  padding: 0.9rem 1rem 0.9rem 2.85rem;
}
.gc-contact-field textarea {
  padding: 0.95rem 1rem;
  min-height: 150px;
  resize: vertical;
  line-height: 1.55;
}
.gc-contact-field input::placeholder,
.gc-contact-field textarea::placeholder {
  color: #94a3b8;
}
.gc-contact-field input:focus,
.gc-contact-field textarea:focus {
  outline: none;
  border-color: #6340f5;
  background: #fff;
  box-shadow: 0 0 0 4px rgba(99,64,245,0.1);
}
.gc-contact-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}
@media (min-width: 640px) {
  .gc-contact-row { grid-template-columns: 1fr 1fr; }
}
.gc-contact-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.65rem;
  margin-top: 1.65rem;
}
.gc-contact-submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  width: 100%;
  max-width: 16rem;
  padding: 0.95rem 1.75rem;
  border: 0;
  border-radius: 9999px;
  background: linear-gradient(135deg, #6340f5 0%, #9b00cc 100%);
  color: #fff;
  font-size: 0.92rem;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  cursor: pointer;
  box-shadow: 0 12px 30px rgba(99,64,245,0.32);
  transition: transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease;
}
.gc-contact-submit:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 36px rgba(99,64,245,0.4);
  filter: brightness(1.03);
}
.gc-contact-submit:active { transform: translateY(0); }
.gc-contact-note {
  font-size: 0.75rem;
  color: #94a3b8;
  text-align: center;
  margin: 0;
}
#loader {
  color: #6340f5;
  font-size: 1.5rem;
}
@media (max-width: 639px) {
  body.gc-contact-page header nav {
    border-radius: 0 0 22px 22px;
  }
  body.gc-contact-page footer {
    margin-top: 0.5rem;
  }
  .gc-contact-page {
    margin: 0.65rem 0 1.25rem;
    padding: 0 0.5rem;
  }
  .gc-contact-shell {
    border-radius: 22px;
    box-shadow: 0 16px 40px rgba(31, 17, 71, 0.14);
  }
  .gc-contact-grid {
    min-height: auto;
  }
  .gc-contact-hero {
    padding: 1.65rem 1.15rem 1.45rem;
    border-radius: 22px 22px 0 0;
  }
  .gc-contact-hero-inner {
    max-width: none;
  }
  .gc-contact-badge {
    font-size: 0.62rem;
    padding: 0.35rem 0.75rem;
    margin-bottom: 0.85rem;
  }
  .gc-contact-hero h1 {
    font-size: 1.55rem;
    margin-bottom: 0.65rem;
  }
  .gc-contact-hero p {
    font-size: 0.88rem;
    line-height: 1.55;
  }
  .gc-contact-perks {
    margin-top: 1.15rem;
    gap: 0.65rem;
  }
  .gc-contact-perks li {
    font-size: 0.82rem;
    gap: 0.65rem;
  }
  .gc-contact-perks i {
    width: 1.85rem;
    height: 1.85rem;
    font-size: 0.75rem;
    border-radius: 10px;
  }
  .gc-contact-form-wrap {
    padding: 1.35rem 1.05rem 1.65rem;
    border-left: 0;
  }
  .gc-contact-form-head {
    margin-bottom: 1.15rem;
  }
  .gc-contact-form-title {
    font-size: 1.15rem;
  }
  .gc-contact-form-sub {
    font-size: 0.82rem;
  }
  .gc-contact-field label {
    font-size: 0.74rem;
  }
  .gc-contact-field input,
  .gc-contact-field textarea {
    font-size: 16px;
    border-radius: 14px;
  }
  .gc-contact-field input {
    padding: 0.82rem 0.95rem 0.82rem 2.65rem;
  }
  .gc-contact-field textarea {
    min-height: 120px;
  }
  .gc-contact-row {
    gap: 0.85rem;
  }
  .gc-contact-actions {
    margin-top: 1.25rem;
  }
  .gc-contact-submit {
    max-width: none;
    width: 100%;
    padding: 0.88rem 1rem;
    font-size: 0.85rem;
  }
  .gc-contact-note {
    font-size: 0.7rem;
    line-height: 1.45;
    padding: 0 0.25rem;
  }
}
</style>`;
}

function buildContactHtml(siteName) {
  const brand = esc(siteName || "GamesCandy");
  return `<section class="gc-contact-page">
  <div class="gc-contact-shell">
    <div class="gc-contact-grid">
      <div class="gc-contact-hero">
        <div class="gc-contact-hero-inner">
          <span class="gc-contact-badge"><i class="fa-solid fa-headset"></i> Player Support</span>
          <h1>Let's Talk</h1>
          <p>Questions, game ideas, or feedback? Send us a message and the ${brand} team will get back to you soon.</p>
          <ul class="gc-contact-perks">
            <li><i class="fa-solid fa-bolt"></i> Quick replies within 24 hours</li>
            <li><i class="fa-solid fa-gamepad"></i> Help with games &amp; accounts</li>
            <li><i class="fa-solid fa-shield-heart"></i> Safe &amp; friendly support</li>
          </ul>
        </div>
      </div>
      <div class="gc-contact-form-wrap">
        <div class="gc-contact-form-head">
          <h2 class="gc-contact-form-title">Send a message</h2>
          <p class="gc-contact-form-sub">Fill in the form below and we'll respond as soon as we can.</p>
        </div>
        <h3 id="success" class="gc-contact-alert gc-contact-alert-success"></h3>
        <h3 id="errors" class="gc-contact-alert gc-contact-alert-error"></h3>
        <form method="post" id="contact_us_form" onsubmit="sendContactUsMail(event);">
          <div class="gc-contact-row">
            <div class="gc-contact-field">
              <label for="name">Your name</label>
              <div class="gc-contact-input-wrap">
                <i class="fa-solid fa-user"></i>
                <input type="text" id="name" name="name" placeholder="Enter your name" autocomplete="name">
              </div>
            </div>
            <div class="gc-contact-field">
              <label for="email">Your email</label>
              <div class="gc-contact-input-wrap">
                <i class="fa-solid fa-envelope"></i>
                <input type="email" id="email" name="email" placeholder="Enter your email" autocomplete="email">
              </div>
            </div>
          </div>
          <div class="gc-contact-field gc-contact-field-textarea">
            <label for="message">Your message</label>
            <textarea rows="5" id="message" name="message" placeholder="Tell us what's on your mind..."></textarea>
          </div>
          <div class="gc-contact-actions">
            <button id="contactUsSubmitBtn" class="gc-contact-submit" type="submit">
              <i class="fa-solid fa-paper-plane"></i> Submit
            </button>
            <i id="loader" class="animate-spin fa-solid fa-spinner"></i>
            <p class="gc-contact-note">We respect your privacy. Your message is only used to reply to you.</p>
          </div>
        </form>
      </div>
    </div>
  </div>
</section>`;
}

const CONTACT_BLOCK =
  /<section class="gc-contact-page">[\s\S]*?<\/section>|<div class="my-5 game-banner-container[\s\S]*?<form method="post" id="contact_us_form"[\s\S]*?<\/form>\s*<\/div>\s*<\/div>/i;

function applyContactPage(html, site) {
  if (!isContactPage(html)) return html;

  let text = String(html || "");
  text = text.replace(/<style id="gc-contact-css">[\s\S]*?<\/style>\s*/i, "");
  text = text.replace("</head>", `${buildContactCss()}\n</head>`);
  if (CONTACT_BLOCK.test(text)) {
    text = text.replace(CONTACT_BLOCK, buildContactHtml(site?.site_name || site?.siteName || "GamesCandy"));
  }
  text = text.replace(/<body class="([^"]*)"/i, (match, classes) => {
    if (classes.includes("gc-contact-page")) return match;
    return `<body class="${classes} gc-contact-page"`;
  });
  return text;
}

module.exports = {
  applyContactPage,
  buildContactCss,
  buildContactHtml,
  isContactPage,
};
