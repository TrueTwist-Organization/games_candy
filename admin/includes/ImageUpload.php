<?php

class ImageUpload
{
    public const GAME_IMAGE_FIELDS = ['thumb', 'landscape_thumb', 'portrait_thumb'];
    public const SITE_IMAGE_FIELDS = ['logo_desktop', 'logo_mobile', 'favicon'];

    private const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'ico'];
    private const MAX_SIZE = 5242880;

    public static function uploadRoot(): string
    {
        return PUBLIC_PATH . '/uploads/admin';
    }

    /** @param array<string, mixed> $post @param array<string, mixed> $files */
    public static function resolveField(array $post, array $files, string $field, string $subdir, string $slug = ''): string
    {
        $fileKey = $field . '_file';
        if (!empty($files[$fileKey]['tmp_name']) && is_uploaded_file($files[$fileKey]['tmp_name'])) {
            return self::saveUploadedFile($files[$fileKey], $field, $subdir, $slug);
        }

        return trim((string) ($post[$field] ?? ''));
    }

    /** @param array<string, mixed> $post @param array<string, mixed> $files @param list<string> $fields */
    public static function applyFields(array $post, array $files, array $fields, string $subdir, string $slug = ''): array
    {
        $out = $post;
        foreach ($fields as $field) {
            $out[$field] = self::resolveField($post, $files, $field, $subdir, $slug);
        }

        return $out;
    }

    /** @param array<string, mixed> $file */
    private static function saveUploadedFile(array $file, string $field, string $subdir, string $slug = ''): string
    {
        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            throw new InvalidArgumentException('Image upload failed.');
        }
        if (($file['size'] ?? 0) > self::MAX_SIZE) {
            throw new InvalidArgumentException('Image must be 5MB or smaller.');
        }

        $original = (string) ($file['name'] ?? '');
        $ext = strtolower(pathinfo($original, PATHINFO_EXTENSION));
        if (!in_array($ext, self::ALLOWED_EXT, true)) {
            throw new InvalidArgumentException('Only JPG, PNG, WebP, GIF, SVG, and ICO images are allowed.');
        }

        $safeSlug = preg_replace('/[^a-zA-Z0-9_-]/', '', $slug) ?? '';
        $dir = self::uploadRoot() . '/' . trim($subdir, '/');
        if ($safeSlug !== '') {
            $dir .= '/' . $safeSlug;
        }
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $filename = $field . '-' . time() . '-' . bin2hex(random_bytes(4)) . '.' . $ext;
        $target = $dir . '/' . $filename;
        if (!move_uploaded_file((string) $file['tmp_name'], $target)) {
            throw new InvalidArgumentException('Could not save uploaded image.');
        }

        $relative = str_replace(PUBLIC_PATH, '', $target);
        return str_replace('\\', '/', $relative);
    }

    public static function renderField(string $label, string $fieldName, string $currentUrl = '', string $hint = ''): void
    {
        $url = trim($currentUrl);
        $help = $hint !== '' ? $hint : 'Upload JPG, PNG, WebP, GIF, SVG, or ICO (max 5MB). Leave empty to keep current image.';
        ?>
        <div data-upload-wrap>
            <label class="block text-xs font-semibold text-slate-600 mb-1"><?= htmlspecialchars($label) ?></label>
            <input type="hidden" name="<?= htmlspecialchars($fieldName) ?>" value="<?= htmlspecialchars($url) ?>">
            <div class="flex items-start gap-3">
                <?php if ($url !== ''): ?>
                    <img data-upload-preview src="<?= htmlspecialchars($url) ?>" alt="" class="w-20 h-20 rounded-lg object-cover border border-slate-200 bg-slate-50 shrink-0">
                <?php else: ?>
                    <div data-upload-preview class="w-20 h-20 rounded-lg border border-dashed border-slate-300 bg-slate-50 shrink-0 flex items-center justify-center text-xs text-slate-400 text-center px-1">No image</div>
                <?php endif; ?>
                <div class="flex-1 min-w-0">
                    <input type="file" name="<?= htmlspecialchars($fieldName) ?>_file" accept="image/*,.svg,.ico" data-image-field="<?= htmlspecialchars($fieldName) ?>" class="block w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100">
                    <p class="text-xs text-slate-500 mt-1"><?= htmlspecialchars($help) ?></p>
                </div>
            </div>
        </div>
        <?php
    }

    public static function previewScript(): void
    {
        ?>
        <script>
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
        </script>
        <?php
    }
}
