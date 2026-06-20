const express = require("express");
const userAuth = require("./user-auth");
const authPages = require("./auth-pages");
const siteTheme = require("./site-theme");

const router = express.Router();

function wantsJson(req) {
  const accept = String(req.headers.accept || "");
  return req.xhr || accept.includes("application/json") || String(req.headers["content-type"] || "").includes("application/json");
}

function safeRedirect(value) {
  const target = String(value || "").trim();
  if (!target.startsWith("/") || target.startsWith("//")) return "/home";
  return target;
}

function sendAuthPage(res, options) {
  const config = siteTheme.loadFullConfig();
  const html = siteTheme.applyAdminConfigToHtml(authPages.renderAuthPage(options), config);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.send(html);
}

router.get("/login", (req, res) => {
  const user = userAuth.getUserFromRequest(req);
  if (user) return res.redirect(safeRedirect(req.query.redirect));
  sendAuthPage(res, {
    mode: "login",
    error: String(req.query.error || ""),
    success: String(req.query.success || ""),
    values: { email: String(req.query.email || ""), redirect: safeRedirect(req.query.redirect) },
  });
});

router.get("/register", (req, res) => {
  const user = userAuth.getUserFromRequest(req);
  if (user) return res.redirect(safeRedirect(req.query.redirect));
  sendAuthPage(res, {
    mode: "register",
    error: String(req.query.error || ""),
    values: {
      name: String(req.query.name || ""),
      email: String(req.query.email || ""),
      redirect: safeRedirect(req.query.redirect),
    },
  });
});

router.get("/logout", (req, res) => {
  userAuth.clearSessionCookie(res);
  res.redirect("/home?signed_out=1");
});

router.get("/api/auth/me", (req, res) => {
  const user = userAuth.getUserFromRequest(req);
  res.json({ success: 1, user });
});

router.post("/api/auth/register", (req, res) => {
  const body = req.body || {};
  const password = String(body.password || "");
  const passwordConfirm = String(body.password_confirm || "");
  const redirect = safeRedirect(body.redirect);

  if (password !== passwordConfirm) {
    if (wantsJson(req)) {
      return res.status(400).json({ success: 0, error: "Passwords do not match." });
    }
    return res.redirect(`/register?error=${encodeURIComponent("Passwords do not match.")}&name=${encodeURIComponent(body.name || "")}&email=${encodeURIComponent(body.email || "")}&redirect=${encodeURIComponent(redirect)}`);
  }

  const result = userAuth.registerUser({
    name: body.name,
    email: body.email,
    password,
  });

  if (!result.ok) {
    if (wantsJson(req)) {
      return res.status(400).json({ success: 0, error: result.error });
    }
    return res.redirect(`/register?error=${encodeURIComponent(result.error)}&name=${encodeURIComponent(body.name || "")}&email=${encodeURIComponent(body.email || "")}&redirect=${encodeURIComponent(redirect)}`);
  }

  if (wantsJson(req)) {
    return res.json({ success: 1, user: result.user });
  }
  return res.redirect(
    `/login?success=${encodeURIComponent("Account created successfully. Please sign in.")}&email=${encodeURIComponent(body.email || "")}&redirect=${encodeURIComponent(redirect)}`
  );
});

router.post("/api/auth/login", (req, res) => {
  const body = req.body || {};
  const redirect = safeRedirect(body.redirect);
  const result = userAuth.loginUser({
    email: body.email,
    password: body.password,
  });

  if (!result.ok) {
    if (wantsJson(req)) {
      return res.status(401).json({ success: 0, error: result.error });
    }
    return res.redirect(`/login?error=${encodeURIComponent(result.error)}&email=${encodeURIComponent(body.email || "")}&redirect=${encodeURIComponent(redirect)}`);
  }

  userAuth.setSessionCookie(res, result.user.id);
  if (wantsJson(req)) {
    return res.json({ success: 1, user: result.user });
  }
  return res.redirect(redirect);
});

router.post("/api/auth/logout", (req, res) => {
  userAuth.clearSessionCookie(res);
  if (wantsJson(req)) {
    return res.json({ success: 1 });
  }
  return res.redirect("/home");
});

module.exports = router;
