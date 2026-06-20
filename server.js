const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const http = require("http");
const https = require("https");
const { transformProxiedHtml, isHtmlResponse } = require("./lib/strip-html");
const adminRoutes = require("./lib/admin/routes");
const analyticsStore = require("./lib/admin/analytics-store");
const siteTheme = require("./lib/site-theme");
const siteAds = require("./lib/site-ads");
const siteAuth = require("./lib/site-auth");
const authRoutes = require("./lib/auth-routes");
const gamesStore = require("./lib/admin/games-store");
const gamePageBuilder = require("./lib/game-page-builder");

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, "public");
const REMOTE = "https://gamesdonut.com";
const S3_REFERER = "https://gamesdonut.com/";

const S3_BUCKETS = {
  "gamesdonut-games-2026": "gamesdonut-games-2026.s3.ap-south-1.amazonaws.com",
  "gamesdonut-games-new": "gamesdonut-games-new.s3.ap-south-1.amazonaws.com",
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function proxyToRemote(req, res, targetPath) {
  const url = new URL(targetPath || req.originalUrl, REMOTE);
  const client = url.protocol === "https:" ? https : http;

  const headers = {
    "User-Agent": req.headers["user-agent"] || "Mozilla/5.0",
    Accept: req.headers.accept || "*/*",
    "Content-Type": req.headers["content-type"] || "application/json",
  };

  if (req.headers["x-requested-with"]) {
    headers["X-Requested-With"] = req.headers["x-requested-with"];
  }
  if (req.headers["x-csrf-token"]) {
    headers["X-CSRF-TOKEN"] = req.headers["x-csrf-token"];
  }

  const options = {
    hostname: url.hostname,
    port: url.port || 443,
    path: url.pathname + url.search,
    method: req.method,
    headers,
  };

  const proxyReq = client.request(options, (proxyRes) => {
    const status = proxyRes.statusCode || 200;
    const contentType = proxyRes.headers["content-type"] || "";
    const shouldTransformHtml = isHtmlResponse(contentType);

    if (shouldTransformHtml) {
      const chunks = [];
      proxyRes.on("data", (chunk) => chunks.push(chunk));
      proxyRes.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf8");
        const cleaned = transformProxiedHtml(body, url.pathname);
        res.status(status);
        res.setHeader("Content-Type", contentType.split(";")[0] + "; charset=utf-8");
        res.setHeader("Content-Length", Buffer.byteLength(cleaned));
        res.send(cleaned);
      });
      return;
    }

    res.status(status);
    Object.entries(proxyRes.headers).forEach(([key, value]) => {
      if (key.toLowerCase() !== "transfer-encoding") {
        res.setHeader(key, value);
      }
    });
    proxyRes.pipe(res);
  });

  proxyReq.on("error", () => {
    res.status(502).json({ error: "Proxy error" });
  });

  if (req.method !== "GET" && req.method !== "HEAD") {
    proxyReq.write(JSON.stringify(req.body || {}));
  }

  proxyReq.end();
}

function rewriteGameCss(css) {
  return css
    .replace(/body\s*\{/g, "#game-content {")
    .replace(/#unity-container(?![\w-])/g, "#game-content #unity-container");
}

function rewriteGameHtml(html, host) {
  return html
    .replace(/https:\/\/gamesdonut\.com\/aws-s3-url/g, "/aws-s3-url")
    .replace(
      /https:\/\/gamesdonut-games-2026\.s3\.[^"']+\.amazonaws\.com\//g,
      `${host}/s3-proxy/gamesdonut-games-2026/`
    )
    .replace(
      /https:\/\/gamesdonut-games-new\.s3\.[^"']+\.amazonaws\.com\//g,
      `${host}/s3-proxy/gamesdonut-games-new/`
    )
    .replace(/<!--H5Ads[\s\S]*?<!--H5Ads[\s\S]*?-->/g, "")
    .replace(
      /<script async data-ad-frequency-hint[\s\S]*?<\/script>\s*<script>[\s\S]*?adConfig[\s\S]*?<\/script>/gi,
      ""
    );
}

function getMimeType(s3Path, upstreamType) {
  const lower = s3Path.toLowerCase();
  if (lower.endsWith(".wasm.unityweb") || lower.endsWith(".wasm")) {
    return "application/wasm";
  }
  if (lower.endsWith(".js.unityweb") || lower.endsWith(".loader.js") || lower.endsWith(".js")) {
    return "application/javascript";
  }
  if (lower.endsWith(".css")) {
    return "text/css";
  }
  if (lower.endsWith(".data.unityweb") || lower.endsWith(".unityweb")) {
    return "application/octet-stream";
  }
  return upstreamType || "application/octet-stream";
}

function getRequestHost(req) {
  if (req && typeof req.get === "function") {
    return `${req.protocol}://${req.get("host")}`;
  }
  return `http://localhost:${PORT}`;
}

function proxyS3FileWithFallback(req, res, onFailure) {
  proxyS3File(req, res, onFailure);
}

function proxyS3File(req, res, onFailure) {
  const requestPath = decodeURIComponent(
    req.path.replace(/^\/s3-proxy\/?/, "")
  );
  const slashIndex = requestPath.indexOf("/");

  if (slashIndex === -1) {
    res.status(400).send("Invalid S3 proxy path");
    return;
  }

  const bucketKey = requestPath.slice(0, slashIndex);
  const s3Path = requestPath.slice(slashIndex + 1);
  const hostname = S3_BUCKETS[bucketKey];

  if (!hostname || !s3Path) {
    res.status(404).send("Unknown S3 bucket");
    return;
  }

  const query = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
  const options = {
    hostname,
    port: 443,
    path: `/${s3Path}${query}`,
    method: "GET",
    headers: {
      Referer: S3_REFERER,
      "User-Agent": (req.headers && req.headers["user-agent"]) || "Mozilla/5.0",
      Accept: (req.headers && req.headers.accept) || "*/*",
    },
  };

  const proxyReq = https.request(options, (proxyRes) => {
    const contentType = proxyRes.headers["content-type"] || "application/octet-stream";
    const chunks = [];

    proxyRes.on("data", (chunk) => chunks.push(chunk));
    proxyRes.on("end", () => {
      const body = Buffer.concat(chunks);
      const status = proxyRes.statusCode || 200;
      const mimeType = getMimeType(s3Path, contentType);

      if (status >= 400) {
        if (typeof onFailure === "function") {
          onFailure();
          return;
        }
        res.status(status);
        res.setHeader("Content-Type", mimeType);
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.send(body);
        return;
      }

      res.status(status);
      res.setHeader("Content-Type", mimeType);
      res.setHeader("Access-Control-Allow-Origin", "*");

      if (mimeType.includes("text/html")) {
        const host = getRequestHost(req);
        res.send(rewriteGameHtml(body.toString("utf8"), host));
        return;
      }

      if (mimeType.includes("text/css")) {
        res.send(rewriteGameCss(body.toString("utf8")));
        return;
      }

      res.send(body);
    });
  });

  proxyReq.on("error", () => {
    res.status(502).send("Failed to load game asset");
  });

  proxyReq.end();
}

function sendHtmlFile(filePath, res) {
  const body = fs.readFileSync(filePath, "utf8");
  const config = siteTheme.loadFullConfig();
  const themed = siteTheme.applyAdminConfigToHtml(body, config);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.send(themed);
}

function sendFileIfExists(filePath, res, next) {
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    if (filePath.toLowerCase().endsWith(".html")) {
      return sendHtmlFile(filePath, res);
    }
    return res.sendFile(filePath);
  }
  return next();
}

function resolveHtmlRoute(urlPath) {
  if (urlPath === "/" || urlPath === "") {
    return path.join(PUBLIC, "index.html");
  }

  const clean = urlPath.replace(/\/$/, "");
  const candidates = [
    path.join(PUBLIC, clean, "index.html"),
    path.join(PUBLIC, `${clean}.html`),
    path.join(PUBLIC, clean),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }

  return null;
}

app.get("/aws-s3-url", (req, res) => {
  const host = getRequestHost(req);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.json({
    status: 200,
    message: "Game assets base URL",
    data: {
      s3_bucket_url: `${host}/embed/g/`,
    },
  });
});

app.get("/api/game-assets", (req, res) => {
  const host = getRequestHost(req);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.json({
    status: 200,
    message: "Game assets base URL",
    data: {
      s3_bucket_url: `${host}/embed/g/`,
    },
  });
});

app.get(/^\/embed\/(.+)/, (req, res) => {
  const decodedPath = decodeURIComponent(req.path);
  const localCandidates = [decodedPath, req.path].filter(
    (candidate, index, list) => list.indexOf(candidate) === index
  );

  for (const candidate of localCandidates) {
    const localFile = path.join(PUBLIC, candidate);
    if (fs.existsSync(localFile) && fs.statSync(localFile).isFile()) {
      return sendEmbedFile(req, res, localFile);
    }
  }

  const bucketMap = {
    g: "gamesdonut-games-2026",
    n: "gamesdonut-games-new",
  };
  const match = decodedPath.match(/^\/embed\/([gn])\/(.+)/);
  if (!match) {
    return res.status(404).send("Game not found");
  }

  const query = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
  const s3GamePath = decodeURIComponent(match[2]);
  const primaryBucket = bucketMap[match[1]];
  const fallbackBucket =
    match[1] === "n" ? bucketMap.g : null;

  function tryProxy(bucketKey, onDone) {
    const proxyPath = `/s3-proxy/${bucketKey}/GamesDonut/${s3GamePath}${query}`;
    proxyS3FileWithFallback(
      { ...req, path: proxyPath, url: proxyPath },
      res,
      fallbackBucket && bucketKey !== fallbackBucket
        ? () => tryProxy(fallbackBucket, onDone)
        : onDone
    );
  }

  return tryProxy(primaryBucket, () => {
    if (!res.headersSent) {
      res.status(404).send("Game not found");
    }
  });
});

function sendEmbedFile(req, res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const lower = filePath.toLowerCase();
  let mimeType = "application/octet-stream";
  if (lower.endsWith(".wasm.unityweb")) mimeType = "application/wasm";
  else if (lower.endsWith(".js.unityweb") || lower.endsWith(".loader.js") || ext === ".js") mimeType = "application/javascript";
  else if (ext === ".css") mimeType = "text/css";
  else if (ext === ".html") mimeType = "text/html; charset=utf-8";
  else if (ext === ".data.unityweb") mimeType = "application/octet-stream";

  res.setHeader("Content-Type", mimeType);
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (ext === ".html") {
    const host = getRequestHost(req);
    const body = fs.readFileSync(filePath, "utf8");
    return res.send(rewriteGameHtml(body, host));
  }
  if (ext === ".css") {
    return res.send(rewriteGameCss(fs.readFileSync(filePath, "utf8")));
  }
  return res.sendFile(filePath);
}

app.get(/^\/s3-proxy\/(.+)/, proxyS3File);

const API_ROUTES = [
  "/update-game-time",
  "/get-recent-games",
  "/update-tournament-play-time",
  "/save-fcm-token",
];

function normalizePendingGames(body) {
  const pending = body?.pending_games;
  if (!Array.isArray(pending)) {
    return [];
  }
  return pending
    .filter((entry) => entry && entry.game_id)
    .map((entry) => ({
      game_id: String(entry.game_id),
      game_slug: entry.game_slug ? String(entry.game_slug) : "",
      play_time: Number(entry.play_time || 0),
    }));
}

function parseCookies(req) {
  const header = req.headers.cookie || "";
  return header.split(";").reduce((cookies, part) => {
    const [key, ...rest] = part.trim().split("=");
    if (key) {
      cookies[key] = decodeURIComponent(rest.join("="));
    }
    return cookies;
  }, {});
}

function recordAnalytics(req, res, pendingGames) {
  if (!pendingGames.length) {
    return;
  }
  const userId = analyticsStore.resolveGuestUserId(req, res);
  analyticsStore.recordPlays(userId, pendingGames);
}

API_ROUTES.forEach((route) => {
  app.all(route, (req, res) => {
    if (route === "/get-recent-games") {
      res.json({ success: 1, recent_games: [] });
      return;
    }
    if (route === "/update-game-time") {
      const pendingGames = normalizePendingGames(req.body);
      recordAnalytics(req, res, pendingGames);
    }
    res.json({ success: 1 });
  });
});

app.get("/home", (req, res) => {
  if (req.query.offset !== undefined || req.headers["x-requested-with"]) {
    return proxyToRemote(
      req,
      res,
      `/home${req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : ""}`
    );
  }

  const file = resolveHtmlRoute("/home");
  if (file) return sendHtmlFile(file, res);
  return proxyToRemote(req, res, "/home");
});

app.get("/site-theme.css", (req, res) => {
  const site = siteTheme.loadSiteConfig();
  res.setHeader("Content-Type", "text/css; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.send(siteTheme.buildThemeCss(site));
});

app.get("/js/ads.js", (req, res) => {
  res.setHeader("Content-Type", "application/javascript; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.send(siteAds.buildAdsJs());
});

app.get("/ads.txt", (req, res) => {
  const config = siteTheme.loadFullConfig();
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.send(siteAds.getAdsTxt(config.ads || {}));
});

app.get("/js/auth.js", (req, res) => {
  res.setHeader("Content-Type", "application/javascript; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.send(siteAuth.buildAuthJs());
});

app.use(authRoutes);

app.get("/api/custom-games.json", (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.json({ success: 1, games: gamesStore.listCustomGamesForSite() });
});

function renderDynamicCustomGamePage(req, res, next, mode) {
  const match = req.path.match(/^\/(game|view-game)\/([^/]+)\/?$/);
  if (!match) return next();

  const slug = decodeURIComponent(match[2]);
  if (gamesStore.loadHiddenGames().includes(slug)) {
    res.status(404);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send("<!DOCTYPE html><html><head><title>Game not found</title></head><body><p>Game not found.</p><p><a href=\"/games\">Browse all games</a></p></body></html>");
  }

  const staticPath = path.join(PUBLIC, match[1], slug, "index.html");
  if (fs.existsSync(staticPath)) return next();

  const custom = gamesStore.getCustomMeta(slug);
  if (!custom) return next();

  const manifestEntry = gamesStore.loadManifest().find((item) => item.slug === slug);
  const config = siteTheme.loadFullConfig();
  const pageData = {
    slug,
    title: custom.title,
    embed: manifestEntry?.embed,
    gamemonetize_hash: custom.gamemonetize_hash || custom.embed_folder,
    description: custom.description,
    how_to_play: custom.how_to_play,
    editors_review: custom.editors_review,
    thumb: custom.thumb,
    landscape_thumb: custom.landscape_thumb,
    portrait_thumb: custom.portrait_thumb,
    game_id: custom.game_id,
  };
  const html =
    mode === "play"
      ? gamePageBuilder.renderPlayPage(pageData)
      : gamePageBuilder.renderViewPage(pageData);
  const themed = siteTheme.applyAdminConfigToHtml(html, config);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  return res.send(themed);
}

app.get(/^\/game\/[^/]+\/?$/, (req, res, next) => renderDynamicCustomGamePage(req, res, next, "play"));
app.get(/^\/view-game\/[^/]+\/?$/, (req, res, next) => renderDynamicCustomGamePage(req, res, next, "view"));

app.use("/admin", adminRoutes);

app.use(express.static(PUBLIC, { index: false }));

app.get("*", (req, res, next) => {
  const staticFile = path.join(PUBLIC, req.path);
  sendFileIfExists(staticFile, res, () => {
    const htmlFile = resolveHtmlRoute(req.path);
    if (htmlFile) {
      return sendHtmlFile(htmlFile, res);
    }
    next();
  });
});

app.use((req, res) => {
  proxyToRemote(req, res);
});

app.listen(PORT, () => {
  console.log(`GamesCandy running at http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin/`);
});
