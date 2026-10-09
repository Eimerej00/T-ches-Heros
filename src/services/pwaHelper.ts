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
  const origin = window.location.origin;

  // 1. Ensure touch icons and icons in document head have exact resolved absolute URLs
  let appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement | null;
  if (!appleTouchIcon) {
    appleTouchIcon = document.createElement('link');
    appleTouchIcon.rel = 'apple-touch-icon';
    document.head.appendChild(appleTouchIcon);
  }
  appleTouchIcon.href = `${origin}${base}apple-touch-icon.png`;

  // 2. Ensure manifest link is present and points to the dynamic subpath
  let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
  if (!manifestLink) {
    manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    manifestLink.href = `${base}manifest.webmanifest`;
    document.head.appendChild(manifestLink);
  }

  // 3. Register service worker adapting to dynamic subpath immediately or on load
  if ('serviceWorker' in navigator) {
    const registerSW = () => {
      const swUrl = `${base}sw.js`;
      navigator.serviceWorker
        .register(swUrl, { scope: base })
        .then((reg) => {
          reg.onupdatefound = () => {
            const installing = reg.installing;
            if (installing) {
              installing.onstatechange = () => {
                if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                  // Service worker updated
                }
              };
            }
          };
        })
        .catch(() => {
          // Fallback to relative registration if scope restriction occurs
          navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {});
        });
    };

    if (document.readyState === 'complete') {
      registerSW();
    } else {
      window.addEventListener('load', registerSW);
    }
  }
}
