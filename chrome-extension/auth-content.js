// Wantry Chrome Extension — Auth Content Script
// Runs on the /auth/extension page to grab the session token and send it to the extension

(function () {
  // Wait for the page to store the token in sessionStorage
  function checkForToken() {
    const tokenStr = sessionStorage.getItem("wantry_ext_token");
    if (tokenStr) {
      try {
        const token = JSON.parse(tokenStr);
        // Send to extension background
        chrome.runtime.sendMessage(
          {
            type: "AUTH_TOKEN",
            access_token: token.access_token,
            refresh_token: token.refresh_token,
            user: token.user,
          },
          (response) => {
            if (response?.ok) {
              // Clean up
              sessionStorage.removeItem("wantry_ext_token");
              console.log("[Wantry] Token sent to extension successfully");
            }
          }
        );
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  // Check immediately
  if (checkForToken()) return;

  // Poll for the token (the page sets it asynchronously)
  let attempts = 0;
  const interval = setInterval(() => {
    attempts++;
    if (checkForToken() || attempts > 30) {
      clearInterval(interval);
    }
  }, 500);
})();
