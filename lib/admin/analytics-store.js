const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA_DIR = path.join(__dirname, "../../admin/data");
const EVENTS_FILE = path.join(DATA_DIR, "analytics-events.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadEvents() {
  ensureDataDir();
  if (!fs.existsSync(EVENTS_FILE)) {
    return [];
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(EVENTS_FILE, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveEvents(events) {
  ensureDataDir();
  fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2));
}

function resolveGuestUserId(req, res) {
  const cookies = parseCookies(req.headers.cookie || "");
  let userId = cookies.gc_user_id;
  if (!userId) {
    userId = "G" + crypto.randomBytes(4).toString("hex").toUpperCase().slice(0, 8);
    res.setHeader(
      "Set-Cookie",
      `gc_user_id=${encodeURIComponent(userId)}; Path=/; Max-Age=${365 * 24 * 60 * 60}; HttpOnly; SameSite=Lax`
    );
  }
  return userId;
}

function parseCookies(header) {
  return header.split(";").reduce((cookies, part) => {
    const [key, ...rest] = part.trim().split("=");
    if (key) cookies[key] = decodeURIComponent(rest.join("="));
    return cookies;
  }, {});
}

function recordPlays(userId, pendingGames) {
  if (!Array.isArray(pendingGames) || pendingGames.length === 0) return;
  const events = loadEvents();
  const now = new Date().toISOString().replace("T", " ").slice(0, 19);
  pendingGames.forEach((entry) => {
    if (!entry || !entry.game_id) return;
    events.push({
      user_id: userId,
      game_id: String(entry.game_id),
      game_slug: entry.game_slug ? String(entry.game_slug) : "",
      play_time_ms: Number(entry.play_time || 0),
      created_at: now,
    });
  });
  saveEvents(events);
}

function summary() {
  const events = loadEvents();
  const users = new Set(events.map((e) => e.user_id));
  const today = new Date().toISOString().slice(0, 10);
  return {
    total_plays: events.length,
    total_users: users.size,
    total_play_time_ms: events.reduce((sum, e) => sum + (e.play_time_ms || 0), 0),
    today_plays: events.filter((e) => String(e.created_at).startsWith(today)).length,
  };
}

function topGames(limit = 10) {
  const map = new Map();
  loadEvents().forEach((event) => {
    const key = `${event.game_id}::${event.game_slug || ""}`;
    const row = map.get(key) || {
      game_id: event.game_id,
      game_slug: event.game_slug || "",
      plays: 0,
      total_time_ms: 0,
    };
    row.plays += 1;
    row.total_time_ms += event.play_time_ms || 0;
    map.set(key, row);
  });
  return [...map.values()].sort((a, b) => b.plays - a.plays).slice(0, limit);
}

function recentPlays(limit = 20) {
  return [...loadEvents()].reverse().slice(0, limit);
}

function userAnalytics(userId) {
  const events = loadEvents().filter((e) => e.user_id === userId);
  const gameMap = new Map();
  events.forEach((event) => {
    const key = `${event.game_id}::${event.game_slug || ""}`;
    const row = gameMap.get(key) || {
      game_id: event.game_id,
      game_slug: event.game_slug || "",
      plays: 0,
      total_time_ms: 0,
      last_played: event.created_at,
    };
    row.plays += 1;
    row.total_time_ms += event.play_time_ms || 0;
    row.last_played = event.created_at;
    gameMap.set(key, row);
  });
  const games = [...gameMap.values()].sort((a, b) => b.total_time_ms - a.total_time_ms);
  const times = events.map((e) => e.created_at).sort();
  return {
    summary: {
      total_plays: events.length,
      total_time_ms: events.reduce((sum, e) => sum + (e.play_time_ms || 0), 0),
      unique_games: gameMap.size,
      first_seen: times[0] || "",
      last_seen: times[times.length - 1] || "",
    },
    games,
  };
}

function listAllUsers(limit = 50) {
  const map = new Map();
  loadEvents().forEach((event) => {
    const row = map.get(event.user_id) || {
      user_id: event.user_id,
      total_plays: 0,
      total_time_ms: 0,
      last_seen: event.created_at,
    };
    row.total_plays += 1;
    row.total_time_ms += event.play_time_ms || 0;
    row.last_seen = event.created_at;
    map.set(event.user_id, row);
  });
  return [...map.values()].sort((a, b) => (a.last_seen < b.last_seen ? 1 : -1)).slice(0, limit);
}

function searchUsers(query, limit = 20) {
  const map = new Map();
  loadEvents()
    .filter((e) => e.user_id.includes(query))
    .forEach((event) => {
      const row = map.get(event.user_id) || {
        user_id: event.user_id,
        total_plays: 0,
        total_time_ms: 0,
        last_seen: event.created_at,
      };
      row.total_plays += 1;
      row.total_time_ms += event.play_time_ms || 0;
      row.last_seen = event.created_at;
      map.set(event.user_id, row);
    });
  return [...map.values()].sort((a, b) => (a.last_seen < b.last_seen ? 1 : -1)).slice(0, limit);
}

function gameAnalytics(gameId) {
  const map = new Map();
  loadEvents()
    .filter((e) => e.game_id === gameId)
    .forEach((event) => {
      const row = map.get(event.user_id) || {
        user_id: event.user_id,
        plays: 0,
        total_time_ms: 0,
        last_seen: event.created_at,
      };
      row.plays += 1;
      row.total_time_ms += event.play_time_ms || 0;
      row.last_seen = event.created_at;
      map.set(event.user_id, row);
    });
  return [...map.values()].sort((a, b) => b.total_time_ms - a.total_time_ms);
}

function seedDemoData(games) {
  if (loadEvents().length > 0 || !games.length) return;
  const demoUsers = ["G10001", "G10002", "G10003"];
  const events = [];
  demoUsers.forEach((userId, index) => {
    games.slice(index * 7, index * 7 + 7).forEach((game) => {
      events.push({
        user_id: userId,
        game_id: String(game.game_id || "0"),
        game_slug: game.slug,
        play_time_ms: (30 + Math.floor(Math.random() * 570)) * 1000,
        created_at: new Date(Date.now() - Math.floor(Math.random() * 14 * 86400000))
          .toISOString()
          .replace("T", " ")
          .slice(0, 19),
      });
    });
  });
  saveEvents(events);
}

module.exports = {
  recordPlays,
  resolveGuestUserId,
  summary,
  topGames,
  recentPlays,
  userAnalytics,
  searchUsers,
  listAllUsers,
  gameAnalytics,
  seedDemoData,
};
