const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA_DIR = path.join(__dirname, "../../admin/data");
const SETTINGS_PATH = path.join(DATA_DIR, "admin-settings.json");
const CONFIG_PATH = path.join(DATA_DIR, "admin-config.json");
const CUSTOM_GAMES_PATH = path.join(DATA_DIR, "custom-games.json");
const HIDDEN_GAMES_PATH = path.join(DATA_DIR, "hidden-games.json");
const USERS_PATH = path.join(DATA_DIR, "users.json");
const ANALYTICS_PATH = path.join(DATA_DIR, "analytics-events.json");

const DEFAULT_PASSWORD = process.env.ADMIN_PASSWORD || "gamescandy2026";

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadSettings() {
  ensureDataDir();
  if (!fs.existsSync(SETTINGS_PATH)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf8")) || {};
  } catch {
    return {};
  }
}

function saveSettings(settings) {
  ensureDataDir();
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(String(password), salt, 120000, 64, "sha256").toString("hex");
  return `${salt}:${hash}`;
}

function verifyHash(password, stored) {
  const value = String(stored || "");
  const parts = value.split(":");
  if (parts.length !== 2) return false;
  const [salt, hash] = parts;
  const check = crypto.pbkdf2Sync(String(password), salt, 120000, 64, "sha256").toString("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(check, "hex"));
  } catch {
    return false;
  }
}

function verifyPassword(password) {
  const settings = loadSettings();
  if (settings.password_hash) {
    return verifyHash(password, settings.password_hash);
  }
  return String(password) === DEFAULT_PASSWORD;
}

function changePassword(currentPassword, newPassword, confirmPassword) {
  const current = String(currentPassword || "");
  const next = String(newPassword || "");
  const confirm = String(confirmPassword || "");

  if (!verifyPassword(current)) {
    throw new Error("Current password is incorrect.");
  }
  if (next.length < 6) {
    throw new Error("New password must be at least 6 characters.");
  }
  if (next !== confirm) {
    throw new Error("New password and confirmation do not match.");
  }

  const settings = loadSettings();
  settings.password_hash = hashPassword(next);
  settings.password_updated_at = new Date().toISOString();
  saveSettings(settings);
  return settings;
}

function readJsonFile(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function buildBackupPayload() {
  const adminConfig = require("./admin-config");
  return {
    exported_at: new Date().toISOString(),
    site: "GamesCandy",
    admin_config: adminConfig.load(),
    custom_games: readJsonFile(CUSTOM_GAMES_PATH, []),
    hidden_games: readJsonFile(HIDDEN_GAMES_PATH, []),
    users: readJsonFile(USERS_PATH, []),
    analytics_events: readJsonFile(ANALYTICS_PATH, []),
    admin_settings: loadSettings(),
  };
}

function buildConfigBackup() {
  const adminConfig = require("./admin-config");
  return adminConfig.load();
}

function buildCustomGamesBackup() {
  return readJsonFile(CUSTOM_GAMES_PATH, []);
}

function getOverview() {
  const adminConfig = require("./admin-config");
  const config = adminConfig.load();
  return {
    site_name: config.site?.site_name || "GamesCandy",
    site_url: config.site?.site_url || "",
    published_at: config.published_at || "",
    password_updated_at: loadSettings().password_updated_at || "",
    uses_custom_password: Boolean(loadSettings().password_hash),
  };
}

module.exports = {
  verifyPassword,
  changePassword,
  buildBackupPayload,
  buildConfigBackup,
  buildCustomGamesBackup,
  getOverview,
};
