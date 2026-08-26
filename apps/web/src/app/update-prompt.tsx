import { useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * The update prompt.
 *
 * This site is an installable PWA, so a visitor is served from a cached
 * copy of a specific build. Silently swapping that copy underneath them
 * would sit badly with a site whose whole claim is that you can check
 * what you are running, so when a new build is ready we say so, name the
 * consequence, and let the reader choose the moment.
 *
 * Two independent notices, deliberately quiet: one when a new version is
 * waiting, one the first time the site becomes usable offline.
 */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW();
  const [reloading, setReloading] = useState(false);

  /**
   * Take the update. updateServiceWorker normally reloads for us once the
   * new worker takes control, but if this page is not controlled by a
   * worker (which happens on the very first registration) there is nothing
   * to take control, no controllerchange fires, and it would quietly do
   * nothing. A button that says Reload must always reload, so fall back.
   */
  const takeUpdate = async () => {
    setReloading(true);
    await updateServiceWorker(true);
    setTimeout(() => window.location.reload(), 1200);
  };

  if (!needRefresh && !offlineReady) return null;

  return (
    <div className="sw-toast" role="status" aria-live="polite">
      {needRefresh ? (
        <>
          <div className="sw-toast-text">
            <strong>A new version of this site is ready.</strong>
            <span>
              You are currently reading a cached copy of an earlier build. Reloading swaps in
              the new one, nothing you have marked verified is lost.
            </span>
          </div>
          <div className="sw-toast-actions">
            <button className="sw-toast-primary" onClick={takeUpdate} disabled={reloading}>
              {reloading ? 'Reloading…' : 'Reload'}
            </button>
            <button
              className="sw-toast-dismiss"
              onClick={() => setNeedRefresh(false)}
              disabled={reloading}
            >
              Not now
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="sw-toast-text">
            <strong>Ready to work offline.</strong>
            <span>
              The whole curriculum is now cached on this device. Live panels need a network;
              everything else does not.
            </span>
          </div>
          <div className="sw-toast-actions">
            <button className="sw-toast-dismiss" onClick={() => setOfflineReady(false)}>
              Got it
            </button>
          </div>
        </>
      )}
    </div>
  );
}
