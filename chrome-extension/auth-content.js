// This content script runs only on Wantio's extension connection page.
(() => {
  let pending = false,
    connected = false;
  const deadline = Date.now() + 60000;
  const timer = setInterval(async () => {
    if (connected || Date.now() > deadline) {
      clearInterval(timer);
      return;
    }
    if (pending) return;
    const raw = sessionStorage.getItem("wantio_ext_token");
    if (!raw) return;
    let session;
    try {
      session = JSON.parse(raw);
    } catch {
      return;
    }
    pending = true;
    try {
      const reply = await chrome.runtime.sendMessage({
        type: "AUTH_TOKEN",
        ...session,
      });
      if (reply?.ok) {
        connected = true;
        sessionStorage.removeItem("wantio_ext_token");
        window.postMessage(
          { type: "WANTIO_EXTENSION_CONNECTED", version: reply.version },
          location.origin,
        );
        clearInterval(timer);
      }
    } catch {
      /* Updating an unpacked extension invalidates the old content script; the page offers reload. */
    } finally {
      pending = false;
    }
  }, 250);
})();
