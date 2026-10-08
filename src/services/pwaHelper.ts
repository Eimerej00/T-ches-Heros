/**
 * Helper to dynamically adapt PWA installation, icons, and service worker registration
 * to ANY host or subdirectory (e.g. root '/', GitHub Pages '/T-ches-Heros/', or any renamed folder).
 */

export function getAppBasePath(): string {
  if (typeof window === 'undefined') return '/';
  const path = window.location.pathname;
  if (path.endsWith('/')) return path;
  const lastSlash = path.lastIndexOf('/');
  return lastSlash >= 0 ? path.substring(0, lastSlash + 1) : '/';
}

export function getAssetUrl(assetName: string): string {
  if (typeof window === 'undefined') return `./${assetName}`;
  const base = getAppBasePath();
  // Return absolute path relative to domain root, e.g. '/T-ches-Heros/shortcut-icon.png'
  return `${base}${assetName}`;
}

export function initPWA(): void {
  if (typeof window === 'undefined') return;

  const base = getAppBasePath();

  // 1. Ensure touch icons and icons in document head have exact resolved URLs
  const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement | null;
  if (appleTouchIcon) {
    appleTouchIcon.href = `${base}apple-touch-icon.png`;
  }

  // 2. Register service worker adapting to dynamic subpath
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = `${base}sw.js`;
      navigator.serviceWorker
        .register(swUrl, { scope: base })
        .then((reg) => {
          // If a new service worker is waiting, activate immediately
          reg.onupdatefound = () => {
            const installing = reg.installing;
            if (installing) {
              installing.onstatechange = () => {
                if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content available
                }
              };
            }
          };
        })
        .catch((err) => {
          // Fallback to relative registration if scope restriction occurs
          navigator.serviceWorker.register('./sw.js').catch(() => {});
        });
    });
  }
}
