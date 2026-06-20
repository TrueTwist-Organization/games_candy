<?php

function adminRenderSavedBanner(): void
{
    if (!isset($_GET['saved'])) {
        return;
    }
    ?>
    <div class="mb-4 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-2">Saved successfully.</div>
    <?php
}

function adminPlacementField(string $key, string $label, array $placement): void
{
    $checked = !empty($placement['enabled']) ? 'checked' : '';
    $code = htmlspecialchars((string) ($placement['code'] ?? ''));
    ?>
    <label class="flex items-center gap-2 text-sm py-1.5">
        <input type="checkbox" name="placement_enabled[<?= htmlspecialchars($key) ?>]" value="1" <?= $checked ?> class="rounded border-slate-300 text-indigo-600">
        <span class="flex-1 min-w-0 text-slate-700"><?= htmlspecialchars($label) ?></span>
        <input type="text" name="placement_code[<?= htmlspecialchars($key) ?>]" value="<?= $code ?>" class="w-14 border border-slate-300 rounded px-2 py-1 text-sm text-center">
    </label>
    <?php
}

function adminColorField(string $name, string $label, string $value): void
{
    require_once __DIR__ . '/ColorValue.php';
    $raw = trim($value);
    $parsed = ColorValue::parseLinearGradient($raw);
    $isGrad = $parsed !== null;
    $solid = $isGrad ? $parsed['from'] : ColorValue::normalizeHex($raw, '#6340F5');
    $gradFrom = $parsed['from'] ?? $solid;
    $gradTo = $parsed['to'] ?? '#DF0F64';
    $gradDir = $parsed['direction'] ?? '135deg';
    $hiddenValue = $isGrad ? $raw : $solid;
    $directions = [
        'to right' => 'Left → Right',
        'to bottom' => 'Top → Bottom',
        '135deg' => 'Diagonal ↘',
        'to left' => 'Right → Left',
        '45deg' => 'Diagonal ↗',
    ];
    ?>
    <div class="gc-color-field border border-slate-200 rounded-lg p-3" data-color-field="<?= htmlspecialchars($name) ?>">
        <label class="block text-xs font-semibold text-slate-600 mb-2"><?= htmlspecialchars($label) ?></label>
        <div class="flex flex-wrap gap-3 text-xs mb-3">
            <label class="inline-flex items-center gap-1.5 cursor-pointer"><input type="radio" name="<?= htmlspecialchars($name) ?>_mode" value="solid" <?= $isGrad ? '' : 'checked' ?> class="text-indigo-600"> Solid</label>
            <label class="inline-flex items-center gap-1.5 cursor-pointer"><input type="radio" name="<?= htmlspecialchars($name) ?>_mode" value="gradient" <?= $isGrad ? 'checked' : '' ?> class="text-indigo-600"> Gradient</label>
        </div>
        <div class="gc-solid-panel <?= $isGrad ? 'hidden' : '' ?> flex items-center gap-2">
            <input type="color" value="<?= htmlspecialchars($solid) ?>" data-solid-picker class="h-10 w-14 border border-slate-300 rounded cursor-pointer">
            <input type="text" data-solid-text value="<?= htmlspecialchars($solid) ?>" class="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono" placeholder="#6340F5">
        </div>
        <div class="gc-gradient-panel <?= $isGrad ? '' : 'hidden' ?> space-y-2">
            <div class="grid grid-cols-2 gap-2">
                <div>
                    <span class="block text-[11px] text-slate-500 mb-1">Color 1</span>
                    <div class="flex items-center gap-2">
                        <input type="color" value="<?= htmlspecialchars($gradFrom) ?>" data-gradient-from class="h-10 w-14 border border-slate-300 rounded cursor-pointer">
                        <input type="text" value="<?= htmlspecialchars($gradFrom) ?>" data-gradient-from-text class="flex-1 border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-mono">
                    </div>
                </div>
                <div>
                    <span class="block text-[11px] text-slate-500 mb-1">Color 2</span>
                    <div class="flex items-center gap-2">
                        <input type="color" value="<?= htmlspecialchars($gradTo) ?>" data-gradient-to class="h-10 w-14 border border-slate-300 rounded cursor-pointer">
                        <input type="text" value="<?= htmlspecialchars($gradTo) ?>" data-gradient-to-text class="flex-1 border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-mono">
                    </div>
                </div>
            </div>
            <div>
                <span class="block text-[11px] text-slate-500 mb-1">Direction</span>
                <select data-gradient-direction class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                    <?php foreach ($directions as $dirValue => $dirLabel): ?>
                        <option value="<?= htmlspecialchars($dirValue) ?>" <?= $gradDir === $dirValue ? 'selected' : '' ?>><?= htmlspecialchars($dirLabel) ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
        </div>
        <div class="mt-3 h-9 rounded-lg border border-slate-200" data-color-preview style="background:<?= htmlspecialchars($hiddenValue) ?>"></div>
        <input type="hidden" name="<?= htmlspecialchars($name) ?>" id="<?= htmlspecialchars($name) ?>" value="<?= htmlspecialchars($hiddenValue) ?>">
    </div>
    <?php
}

function adminGradientColorFieldScript(): void
{
    ?>
    <script>
    (function () {
      function isGradientMode(field) {
        return field.querySelector('input[name="' + field.dataset.colorField + '_mode"][value="gradient"]')?.checked;
      }
      function syncField(field) {
        var name = field.dataset.colorField;
        var hidden = field.querySelector('input[name="' + name + '"]');
        var preview = field.querySelector('[data-color-preview]');
        if (!hidden) return;
        if (isGradientMode(field)) {
          var from = field.querySelector('[data-gradient-from-text]')?.value || field.querySelector('[data-gradient-from]')?.value || '#6340F5';
          var to = field.querySelector('[data-gradient-to-text]')?.value || field.querySelector('[data-gradient-to]')?.value || '#DF0F64';
          var dir = field.querySelector('[data-gradient-direction]')?.value || '135deg';
          hidden.value = 'linear-gradient(' + dir + ', ' + from + ', ' + to + ')';
          if (preview) preview.style.background = hidden.value;
          return;
        }
        var solid = field.querySelector('[data-solid-text]')?.value || field.querySelector('[data-solid-picker]')?.value || '#6340F5';
        hidden.value = solid;
        if (preview) preview.style.background = solid;
      }
      function setMode(field, mode) {
        var solidPanel = field.querySelector('.gc-solid-panel');
        var gradientPanel = field.querySelector('.gc-gradient-panel');
        if (mode === 'gradient') {
          solidPanel?.classList.add('hidden');
          gradientPanel?.classList.remove('hidden');
        } else {
          solidPanel?.classList.remove('hidden');
          gradientPanel?.classList.add('hidden');
        }
        syncField(field);
      }
      document.querySelectorAll('[data-color-field]').forEach(function (field) {
        var name = field.dataset.colorField;
        field.querySelectorAll('input[name="' + name + '_mode"]').forEach(function (radio) {
          radio.addEventListener('change', function () { setMode(field, this.value); });
        });
        field.querySelector('[data-solid-picker]')?.addEventListener('input', function () {
          var text = field.querySelector('[data-solid-text]');
          if (text) text.value = this.value;
          syncField(field);
        });
        field.querySelector('[data-solid-text]')?.addEventListener('input', function () {
          var picker = field.querySelector('[data-solid-picker]');
          if (/^#[0-9A-Fa-f]{3,6}$/.test(this.value) && picker) picker.value = this.value;
          syncField(field);
        });
        ['[data-gradient-from]', '[data-gradient-to]', '[data-gradient-from-text]', '[data-gradient-to-text]', '[data-gradient-direction]'].forEach(function (sel) {
          field.querySelector(sel)?.addEventListener('input', function () {
            if (sel.indexOf('-from') > 0 && sel.indexOf('text') === -1) {
              var t = field.querySelector('[data-gradient-from-text]');
              if (t) t.value = this.value;
            }
            if (sel.indexOf('-to') > 0 && sel.indexOf('text') === -1 && sel.indexOf('from') === -1) {
              var t2 = field.querySelector('[data-gradient-to-text]');
              if (t2) t2.value = this.value;
            }
            syncField(field);
          });
          field.querySelector(sel)?.addEventListener('change', function () { syncField(field); });
        });
        syncField(field);
      });
      document.getElementById('color-preset')?.addEventListener('change', function () {
        setTimeout(function () {
          document.querySelectorAll('[data-color-field]').forEach(syncField);
        }, 0);
      });
      document.querySelector('form')?.addEventListener('submit', function () {
        document.querySelectorAll('[data-color-field]').forEach(syncField);
      });
    })();
    </script>
    <?php
}

function adminCheckboxField(string $name, string $label, bool $checked): void
{
    ?>
    <label class="flex items-center gap-2 text-sm">
        <input type="checkbox" name="<?= htmlspecialchars($name) ?>" value="1" <?= $checked ? 'checked' : '' ?> class="rounded border-slate-300 text-indigo-600">
        <span><?= htmlspecialchars($label) ?></span>
    </label>
    <?php
}
