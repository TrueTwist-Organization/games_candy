function normalizeHex(color, fallback = "#6340F5") {
  const value = String(color || "").trim();
  if (/^#[0-9A-Fa-f]{3}$/.test(value)) return value.toUpperCase();
  if (/^#[0-9A-Fa-f]{6}$/.test(value)) return value.toUpperCase();
  return fallback;
}

function isGradient(value) {
  return /gradient\s*\(/i.test(String(value || ""));
}

function parseLinearGradient(value) {
  const raw = String(value || "").trim();
  const match = raw.match(
    /linear-gradient\s*\(\s*([^,]+?)\s*,\s*(#[0-9A-Fa-f]{3,8}|rgb[a]?\([^)]+\))\s*,\s*(#[0-9A-Fa-f]{3,8}|rgb[a]?\([^)]+\))\s*\)/i
  );
  if (!match) return null;
  return {
    direction: match[1].trim(),
    from: normalizeHex(match[2]),
    to: normalizeHex(match[3]),
  };
}

function buildLinearGradient(from, to, direction = "135deg") {
  return `linear-gradient(${direction}, ${normalizeHex(from)}, ${normalizeHex(to)})`;
}

function cssColor(value, fallback = "#6340F5") {
  if (isGradient(value)) {
    const parsed = parseLinearGradient(value);
    return parsed ? parsed.from : normalizeHex(fallback);
  }
  return normalizeHex(value, fallback);
}

function cssBackground(value, fallback = "#6340F5") {
  const raw = String(value || "").trim();
  if (isGradient(raw)) return raw;
  return normalizeHex(raw, fallback);
}

function backgroundCss(value, fallback = "#6340F5") {
  const bg = cssBackground(value, fallback);
  if (isGradient(bg)) {
    return `background-image: ${bg} !important; background-color: transparent !important;`;
  }
  return `background-color: ${bg} !important;`;
}

function tournamentGradient(primary, accent) {
  if (isGradient(primary)) return String(primary).trim();
  return `linear-gradient(to right, ${cssColor(primary)}, ${cssColor(accent)})`;
}

module.exports = {
  normalizeHex,
  isGradient,
  parseLinearGradient,
  buildLinearGradient,
  cssColor,
  cssBackground,
  backgroundCss,
  tournamentGradient,
};
