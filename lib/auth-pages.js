const fs = require("fs");
const path = require("path");

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildAuthPageCss() {
  return `<style id="gc-auth-page-css">
.gc-auth-page-wrap {
  margin: 1rem 0 1.5rem;
  padding: 0 0.35rem;
  font-family: "Poppins", Roboto, sans-serif;
}
.gc-auth-card {
  max-width: 32rem;
  margin: 0 auto;
}
.gc-auth-card-inner {
  padding: 1.5rem 0.25rem;
}
.gc-auth-card h2 {
  letter-spacing: -0.02em;
}
.gc-auth-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.35rem;
  padding: 0.3rem;
  background: #f1f5f9;
  border-radius: 9999px;
  margin-bottom: 1.35rem;
}
.gc-auth-tabs a {
  display: block;
  text-align: center;
  padding: 0.65rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.82rem;
  font-weight: 600;
  line-height: 1.2;
  text-decoration: none;
}
.gc-auth-card input {
  font-size: 16px;
}
.gc-auth-footer-note {
  margin-top: 1.25rem;
  padding-top: 1.15rem;
  border-top: 1px solid #e2e8f0;
}
@media (max-width: 639px) {
  body.gc-auth-page header nav {
    border-radius: 0 0 22px 22px;
  }
  body.gc-auth-page .md\\:w-\\[80\\%\\] {
    width: 100%;
  }
  .gc-auth-page-wrap {
    margin: 0.65rem 0 1rem;
    padding: 0 0.5rem;
  }
  .gc-auth-card.game-banner-container {
    padding: 1rem 0.85rem 1.15rem !important;
    border-radius: 22px !important;
  }
  .gc-auth-card-inner {
    padding: 0.75rem 0.15rem 0.25rem;
  }
  .gc-auth-card h2 {
    font-size: 1.35rem;
    margin-bottom: 0.45rem;
  }
  .gc-auth-card .text-sm.text-slate-500.mb-6 {
    font-size: 0.82rem;
    margin-bottom: 1.15rem;
    line-height: 1.5;
    padding: 0 0.15rem;
  }
  .gc-auth-tabs a {
    font-size: 0.74rem;
    padding: 0.58rem 0.35rem;
  }
  .gc-auth-card label {
    font-size: 0.82rem;
  }
  .gc-auth-card input {
    padding-top: 0.8rem;
    padding-bottom: 0.8rem;
  }
  .gc-auth-card button.animatedPlayBtn {
    padding-top: 0.85rem;
    padding-bottom: 0.85rem;
    font-size: 0.95rem;
  }
  .gc-auth-footer-note p {
    font-size: 0.72rem;
    line-height: 1.55;
  }
  body.gc-auth-page footer {
    margin-top: 0.5rem;
  }
}
@media (min-width: 640px) {
  .gc-auth-page-wrap { padding: 0; }
  .gc-auth-card-inner { padding: 1.75rem 0.5rem; }
  .gc-auth-tabs a { font-size: 0.875rem; padding: 0.65rem 0.75rem; }
}
</style>`;
}

function renderAuthShell({ mode = "login", error = "", success = "", values = {} }) {
  const isRegister = mode === "register";
  const name = esc(values.name || "");
  const email = esc(values.email || "");
  const redirect = esc(values.redirect || "/home");
  const message = error
    ? `<div class="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3">${esc(error)}</div>`
    : success
      ? `<div class="mb-4 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-3">${esc(success)}</div>`
      : "";

  const loginActive = isRegister
    ? "text-slate-500 hover:text-slate-800"
    : "text-white bg-light-theme-color shadow";
  const registerActive = isRegister
    ? "text-white bg-light-theme-color shadow"
    : "text-slate-500 hover:text-slate-800";

  const signInPanel = isRegister
    ? "hidden"
    : "block";
  const registerPanel = isRegister
    ? "block"
    : "hidden";

  return `<h1 class="sr-only">${isRegister ? "Create Account" : "Sign In"} | GamesCandy</h1>
<div class="gc-auth-page-wrap">
  <div class="gc-auth-card bg-white border-gray-200 rounded-[30px] bg-cover bg-no-repeat game-banner-container mx-0 p-4 md:p-8">
    <div class="gc-auth-card-inner max-w-md mx-auto">
      <h2 class="text-center text-2xl font-semibold text-[#1F1147] mb-2">${isRegister ? "Create your account" : "Welcome back"}</h2>
      <p class="text-center text-sm text-slate-500 mb-6">Sign in to save progress, join tournaments, and track your stats.</p>
      ${message}
      <div class="gc-auth-tabs">
        <a href="/login" class="transition ${loginActive}">Sign In</a>
        <a href="/register" class="transition ${registerActive}">Create Account</a>
      </div>

      <div id="gc-auth-signin" class="${signInPanel}">
        <form method="post" action="/api/auth/login" class="space-y-4">
          <input type="hidden" name="redirect" value="${redirect}">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1" for="login-email">Email</label>
            <input id="login-email" name="email" type="email" required autocomplete="email" value="${email}" class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-theme-color" placeholder="you@example.com">
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1" for="login-password">Password</label>
            <input id="login-password" name="password" type="password" required autocomplete="current-password" minlength="6" class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-theme-color" placeholder="Enter your password">
          </div>
          <button type="submit" class="w-full animatedPlayBtn font-semibold text-white rounded-full py-3 text-base">Sign In</button>
        </form>
        <p class="text-center text-sm text-slate-500 mt-4">Don't have an account? <a href="/register" class="text-theme-color font-semibold hover:underline">Create Account</a></p>
      </div>

      <div id="gc-auth-register" class="${registerPanel}">
        <form method="post" action="/api/auth/register" class="space-y-4">
          <input type="hidden" name="redirect" value="${redirect}">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1" for="register-name">Full name</label>
            <input id="register-name" name="name" type="text" required autocomplete="name" value="${name}" class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-theme-color" placeholder="Your name">
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1" for="register-email">Email</label>
            <input id="register-email" name="email" type="email" required autocomplete="email" value="${email}" class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-theme-color" placeholder="you@example.com">
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1" for="register-password">Password</label>
            <input id="register-password" name="password" type="password" required autocomplete="new-password" minlength="6" class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-theme-color" placeholder="At least 6 characters">
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1" for="register-password-confirm">Confirm password</label>
            <input id="register-password-confirm" name="password_confirm" type="password" required autocomplete="new-password" minlength="6" class="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-theme-color" placeholder="Repeat your password">
          </div>
          <button type="submit" class="w-full animatedPlayBtn font-semibold text-white rounded-full py-3 text-base">Create Account</button>
        </form>
        <p class="text-center text-sm text-slate-500 mt-4">Already have an account? <a href="/login" class="text-theme-color font-semibold hover:underline">Sign In</a></p>
      </div>

      <div class="gc-auth-footer-note">
        <p class="text-xs text-center text-slate-500 leading-relaxed">
          Log in to join tournaments and track your live stats. Compete, play, and see how you rank among others.
        </p>
      </div>
    </div>
  </div>
</div>`;
}

function renderAuthPage(options) {
  const templatePath = path.join(__dirname, "../public/login/index.html");
  const template = fs.readFileSync(templatePath, "utf8");
  const content = renderAuthShell(options);

  let html = template.replace(
    /<h1 class="sr-only">Login Page[\s\S]*?<div class="my-5">[\s\S]*?<\/div>\s*<\/div>\s*<!-- <div class="js-cookie-consent/,
    `${content}\n<!-- <div class="js-cookie-consent`
  );

  if (html === template) {
    html = template.replace(
      /<h1 class="sr-only">[\s\S]*?<footer class="/,
      `${content}\n            <footer class="`
    );
  }

  const title = options.mode === "register" ? "Create Account | GamesCandy" : "Sign In | GamesCandy";
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(title)}</title>`);
  html = html.replace(/property="og:url" content="[^"]*"/i, `property="og:url" content="/${options.mode === "register" ? "register" : "login"}"`);
  html = html.replace(/rel="canonical" href="[^"]*"/i, `rel="canonical" href="/${options.mode === "register" ? "register" : "login"}"`);

  html = html.replace(/<body class="([^"]*)"/i, '<body id="gc-auth-page" class="$1 gc-auth-page"');
  html = html.replace(/<style id="gc-auth-page-css">[\s\S]*?<\/style>\s*/i, "");
  html = html.replace("</head>", `    ${buildAuthPageCss()}\n</head>`);

  return html;
}

module.exports = {
  renderAuthPage,
  renderAuthShell,
};
