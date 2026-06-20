const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const USERS_PATH = path.join(__dirname, "../admin/data/users.json");
const SESSION_COOKIE = "gc_user_session";
const SESSION_SECRET = process.env.USER_SESSION_SECRET || "gamescandy-user-session-secret";
const SESSION_MAX_AGE = 30 * 24 * 60 * 60;

function parseCookies(header = "") {
  return header.split(";").reduce((cookies, part) => {
    const [key, ...rest] = part.trim().split("=");
    if (key) cookies[key] = decodeURIComponent(rest.join("="));
    return cookies;
  }, {});
}

function loadStore() {
  if (!fs.existsSync(USERS_PATH)) {
    return { users: [] };
  }
  try {
    const data = JSON.parse(fs.readFileSync(USERS_PATH, "utf8"));
    return { users: Array.isArray(data.users) ? data.users : [] };
  } catch {
    return { users: [] };
  }
}

function saveStore(store) {
  fs.mkdirSync(path.dirname(USERS_PATH), { recursive: true });
  fs.writeFileSync(USERS_PATH, JSON.stringify(store, null, 2));
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(String(password), salt, 100000, 64, "sha256").toString("hex");
}

function createPasswordRecord(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  return {
    salt,
    hash: hashPassword(password, salt),
  };
}

function verifyPassword(password, record) {
  if (!record?.salt || !record?.hash) return false;
  const hash = hashPassword(password, record.salt);
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(record.hash, "hex"));
}

function signSession(userId) {
  const expires = Date.now() + SESSION_MAX_AGE * 1000;
  const payload = `${userId}.${expires}`;
  const sig = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

function verifySessionToken(token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) return null;
  const [userId, expiresRaw, sig] = parts;
  const expires = Number(expiresRaw);
  if (!userId || !Number.isFinite(expires) || expires < Date.now()) return null;
  const payload = `${userId}.${expiresRaw}`;
  const expected = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  return userId;
}

function findUserByEmail(email) {
  const normalized = normalizeEmail(email);
  return loadStore().users.find((user) => user.email === normalized) || null;
}

function findUserById(id) {
  return loadStore().users.find((user) => user.id === id) || null;
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

function registerUser({ name, email, password }) {
  const cleanName = String(name || "").trim();
  const cleanEmail = normalizeEmail(email);
  const cleanPassword = String(password || "");

  if (!cleanName || cleanName.length < 2) {
    return { ok: false, error: "Please enter your name (at least 2 characters)." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (cleanPassword.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters." };
  }
  if (findUserByEmail(cleanEmail)) {
    return { ok: false, error: "An account with this email already exists." };
  }

  const passwordRecord = createPasswordRecord(cleanPassword);
  const user = {
    id: crypto.randomUUID(),
    name: cleanName,
    email: cleanEmail,
    salt: passwordRecord.salt,
    hash: passwordRecord.hash,
    createdAt: new Date().toISOString(),
  };

  const store = loadStore();
  store.users.push(user);
  saveStore(store);
  return { ok: true, user: publicUser(user) };
}

function loginUser({ email, password }) {
  const user = findUserByEmail(email);
  if (!user || !verifyPassword(password, user)) {
    return { ok: false, error: "Incorrect email or password." };
  }
  return { ok: true, user: publicUser(user) };
}

function setSessionCookie(res, userId) {
  const token = signSession(userId);
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${SESSION_MAX_AGE}; HttpOnly; SameSite=Lax`
  );
}

function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`);
}

function getUserFromRequest(req) {
  const cookies = parseCookies(req.headers.cookie || "");
  const userId = verifySessionToken(cookies[SESSION_COOKIE]);
  if (!userId) return null;
  return publicUser(findUserById(userId));
}

module.exports = {
  SESSION_COOKIE,
  registerUser,
  loginUser,
  setSessionCookie,
  clearSessionCookie,
  getUserFromRequest,
  publicUser,
  normalizeEmail,
};
