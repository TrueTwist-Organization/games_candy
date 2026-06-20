<?php

require_once __DIR__ . '/UserAuth.php';

class SiteAuth
{
    public static function buildAuthCss(): string
    {
        return '<style id="gc-auth-css">
header { position: relative; z-index: 1200; }
header nav { position: relative; z-index: 1200; }
.gc-user-slot { position: relative; }
.gc-user-menu-btn {
  border: 2px solid rgba(255,255,255,0.95);
  box-shadow: 0 2px 10px rgba(99,64,245,0.35);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.gc-user-menu-btn:hover {
  transform: scale(1.04);
  box-shadow: 0 4px 14px rgba(99,64,245,0.45);
}
.gc-user-menu-btn[aria-expanded="true"] {
  outline: 2px solid var(--gc-primary, #6340F5);
  outline-offset: 2px;
}
.gc-user-dropdown {
  position: fixed;
  z-index: 99999;
  width: 15rem;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 16px 48px rgba(31,17,71,0.2), 0 4px 12px rgba(99,64,245,0.12);
  border: 1px solid rgba(99,64,245,0.14);
  overflow: hidden;
  pointer-events: auto;
  animation: gcUserMenuIn 0.16s ease-out;
}
@keyframes gcUserMenuIn {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
}
.gc-user-dropdown-head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: linear-gradient(135deg, rgba(99,64,245,0.1), rgba(155,0,204,0.06));
  border-bottom: 1px solid rgba(99,64,245,0.1);
}
.gc-user-dropdown-avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 9999px;
  background: var(--gc-primary, #6340F5);
  color: #fff;
  font-weight: 700;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(99,64,245,0.35);
}
.gc-user-dropdown-name {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 700;
  color: #1e1147;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.gc-user-dropdown-email {
  margin: 0.125rem 0 0;
  font-size: 0.75rem;
  color: #64748b;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.gc-user-dropdown-actions { padding: 0.4rem; }
.gc-user-dropdown-signout {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.7rem 0.85rem;
  border-radius: 10px;
  color: #dc2626;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.15s ease, color 0.15s ease;
}
.gc-user-dropdown-signout:hover {
  background: #fef2f2;
  color: #b91c1c;
}
</style>';
    }

    public static function buildAuthHeaderScript(): string
    {
        return '<script id="gc-auth-header">document.querySelectorAll(\'header a[href="/login"] img[src*="user_profile_icon"]\').forEach(function(img){var wrap=img.closest(\'.w-8,.h-8,.h-10,.w-10,.overflow-hidden.rounded-full\')||img.parentElement;if(!wrap||wrap.classList.contains(\'gc-user-slot\'))return;wrap.classList.add(\'gc-user-slot\',\'rounded-full\');if(!wrap.classList.contains(\'w-8\')&&!wrap.classList.contains(\'w-10\'))wrap.classList.add(\'w-10\',\'h-10\');});</script>';
    }

    public static function buildAuthRuntimeScript(): string
    {
        return '<script src="/js/auth.js" defer></script>';
    }

    public static function applyAuthToHtml(string $html): string
    {
        if (str_contains($html, 'game-play-page') || str_contains($html, 'id="gc-auth-page"')) {
            return $html;
        }
        if (!str_contains($html, 'user_profile_icon.svg')) {
            return $html;
        }

        if (!str_contains($html, 'gc-auth-css')) {
            $html = str_replace('</head>', '    ' . self::buildAuthCss() . "\n</head>", $html);
        }
        if (!str_contains($html, 'gc-auth-header')) {
            $html = str_replace('</body>', '    ' . self::buildAuthHeaderScript() . "\n</body>", $html);
        }
        if (!str_contains($html, '/js/auth.js')) {
            $html = str_replace('</body>', '    ' . self::buildAuthRuntimeScript() . "\n</body>", $html);
        }
        return $html;
    }

    public static function buildAuthJs(): string
    {
        return (string) file_get_contents(dirname(__DIR__) . '/lib/auth.runtime.js');
    }
}
