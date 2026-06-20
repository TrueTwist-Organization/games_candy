const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");

const PUBLIC = path.join(__dirname, "../../public");
const UPLOAD_ROOT = path.join(PUBLIC, "uploads/admin");

const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".ico"]);
const MAX_SIZE = 5 * 1024 * 1024;

const GAME_IMAGE_FIELDS = ["thumb", "landscape_thumb", "portrait_thumb"];
const SITE_IMAGE_FIELDS = ["logo_desktop", "logo_mobile", "favicon"];

function safeExt(originalname, mimetype) {
  let ext = path.extname(originalname || "").toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    if (mimetype === "image/svg+xml") ext = ".svg";
    else if (mimetype === "image/x-icon" || mimetype === "image/vnd.microsoft.icon") ext = ".ico";
    else if (mimetype === "image/png") ext = ".png";
    else if (mimetype === "image/webp") ext = ".webp";
    else if (mimetype === "image/gif") ext = ".gif";
    else ext = ".jpg";
  }
  return ext;
}

function createUploadMiddleware(subdir) {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const slugPart = req.uploadSlug ? path.basename(String(req.uploadSlug)) : "";
      const dir = slugPart ? path.join(UPLOAD_ROOT, subdir, slugPart) : path.join(UPLOAD_ROOT, subdir);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const prefix = String(file.fieldname || "image").replace(/_file$/, "");
      const ext = safeExt(file.originalname, file.mimetype);
      cb(null, `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}${ext}`);
    },
  });

  return multer({
    storage,
    limits: { fileSize: MAX_SIZE, files: 12 },
    fileFilter: (req, file, cb) => {
      const ext = safeExt(file.originalname, file.mimetype);
      if (!ALLOWED_EXT.has(ext) && !/^image\//.test(file.mimetype || "")) {
        return cb(new Error("Only image files (JPG, PNG, WebP, GIF, SVG, ICO) are allowed."));
      }
      cb(null, true);
    },
  });
}

function publicPathFromFile(file) {
  if (!file?.path) return "";
  return `/${path.relative(PUBLIC, file.path).split(path.sep).join("/")}`;
}

function resolveImageField(body, files, fieldName) {
  const uploaded = files?.[`${fieldName}_file`]?.[0];
  if (uploaded) return publicPathFromFile(uploaded);
  return String(body?.[fieldName] || "").trim();
}

function applyImageFields(body, files, fields) {
  const out = { ...(body || {}) };
  for (const field of fields) {
    out[field] = resolveImageField(body, files, field);
  }
  return out;
}

function renderImageUploadField(escapeHtml, label, fieldName, currentUrl = "", hint = "") {
  const url = String(currentUrl || "").trim();
  const preview = url
    ? `<img data-upload-preview src="${escapeHtml(url)}" alt="" class="w-20 h-20 rounded-lg object-cover border border-slate-200 bg-slate-50 shrink-0">`
    : `<div data-upload-preview class="w-20 h-20 rounded-lg border border-dashed border-slate-300 bg-slate-50 shrink-0 flex items-center justify-center text-xs text-slate-400 text-center px-1">No image</div>`;
  const help = hint || "Upload JPG, PNG, WebP, GIF, SVG, or ICO (max 5MB). Leave empty to keep current image.";

  return `<div data-upload-wrap>
    <label class="block text-xs font-semibold text-slate-600 mb-1">${label}</label>
    <input type="hidden" name="${escapeHtml(fieldName)}" value="${escapeHtml(url)}">
    <div class="flex items-start gap-3">
      ${preview}
      <div class="flex-1 min-w-0">
        <input type="file" name="${escapeHtml(fieldName)}_file" accept="image/*,.svg,.ico" data-image-field="${escapeHtml(fieldName)}" class="block w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100">
        <p class="text-xs text-slate-500 mt-1">${escapeHtml(help)}</p>
      </div>
    </div>
  </div>`;
}

function imageUploadPreviewScript() {
  return `<script>
(function () {
  document.querySelectorAll('input[type="file"][data-image-field]').forEach(function (input) {
    input.addEventListener('change', function () {
      if (!this.files || !this.files[0]) return;
      var wrap = this.closest('[data-upload-wrap]');
      if (!wrap) return;
      var preview = wrap.querySelector('[data-upload-preview]');
      if (!preview) return;
      var url = URL.createObjectURL(this.files[0]);
      if (preview.tagName === 'IMG') {
        preview.src = url;
      } else {
        preview.outerHTML = '<img data-upload-preview src="' + url + '" alt="" class="w-20 h-20 rounded-lg object-cover border border-slate-200 bg-slate-50 shrink-0">';
      }
    });
  });
})();
</script>`;
}

function gameUploadFields() {
  return GAME_IMAGE_FIELDS.map((field) => ({ name: `${field}_file`, maxCount: 1 }));
}

function siteUploadFields() {
  return SITE_IMAGE_FIELDS.map((field) => ({ name: `${field}_file`, maxCount: 1 }));
}

module.exports = {
  GAME_IMAGE_FIELDS,
  SITE_IMAGE_FIELDS,
  createUploadMiddleware,
  applyImageFields,
  resolveImageField,
  renderImageUploadField,
  imageUploadPreviewScript,
  gameUploadFields,
  siteUploadFields,
};
