// One-time handoff from the first-party sign-in page, with delivery acknowledgement.
(function () {
  let attempts = 0;
  const timer = setInterval(() => {
    if (++attempts > 60) {
      clearInterval(timer);
      return;
    }
    const raw = sessionStorage.getItem("wantio_ext_token");
    if (!raw) return;
    let session;
    try {
      session = JSON.parse(raw);
    } catch {
      return;
    }
    clearInterval(timer);
    chrome.runtime.sendMessage({ type: "AUTH_TOKEN", ...session }, (reply) => {
      if (reply?.ok) {
        sessionStorage.removeItem("wantio_ext_token");
        window.postMessage(
          { type: "WANTIO_EXTENSION_CONNECTED" },
          window.location.origin,
        );
      }
    });
  }, 250);
})();
