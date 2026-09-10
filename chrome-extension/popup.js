// Wantio Chrome Extension — Popup Logic

let supabaseUrl, supabaseAnonKey;
// State
let accessToken = null;
let wantioUrl = "https://wantio.app";
let selectedTagIds = new Set();
let allTags = [];
let productData = {};
let saving = false;
const itemId = crypto.randomUUID();
let userEdited = false;

// DOM refs
const states = {
  loading: document.getElementById("state-loading"),
  login: document.getElementById("state-login"),
  form: document.getElementById("state-form"),
  success: document.getElementById("state-success"),
  error: document.getElementById("state-error"),
};

function showState(name) {
  Object.values(states).forEach((el) => (el.style.display = "none"));
  states[name].style.display = "block";
}

// ── Init ──────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", async () => {
  showState("loading");
  document.querySelectorAll("input,textarea").forEach((el) =>
    el.addEventListener("input", () => {
      userEdited = true;
    }),
  );

  try {
    // Get Wantio URL from storage
    const urlResult = await chrome.runtime.sendMessage({
      type: "GET_CONFIG",
    });
    if (urlResult?.error) throw new Error(urlResult.error);
    if (urlResult?.url) wantioUrl = urlResult.url;
    supabaseUrl = urlResult.supabaseUrl;
    supabaseAnonKey = urlResult.supabaseAnonKey;

    // Check auth session
    const session = await chrome.runtime.sendMessage({ type: "GET_SESSION" });

    if (!session?.access_token) {
      showState("login");
      setupLoginButton();
      return;
    }

    accessToken = session.access_token;

    // Get current tab
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (
      !tab?.id ||
      tab.url?.startsWith("chrome://") ||
      tab.url?.startsWith("about:")
    ) {
      showError(
        "Cannot extract data from this page. Navigate to a product page and try again.",
      );
      return;
    }

    // Run content script to extract data from page
    let contentData = null;
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["price.js", "content.js"],
      });
      contentData = results?.[0]?.result;
    } catch {
      // Content script injection may fail on some pages
    }

    if (contentData) {
      productData = contentData;
      displayForm(contentData);
    } else {
      // Fallback: just use the tab URL
      productData = { url: tab.url, name: tab.title };
      displayForm(productData);
    }

    // Fetch tags and AI-enhanced scrape in parallel
    await fetchTags();
    await fetchAiScrape(tab.url);
  } catch (err) {
    showError(err.message || "Something went wrong");
  }
});

// ── Login ─────────────────────────────────────────────────────────────

function setupLoginButton() {
  document.getElementById("btn-open-wantio").addEventListener("click", () => {
    chrome.tabs.create({ url: `${wantioUrl}/auth/extension` });
    window.close();
  });
}

// ── Form Display ──────────────────────────────────────────────────────

function displayForm(data) {
  showState("form");

  // Preview
  const imgEl = document.getElementById("product-image");
  const imgPlaceholder = document.getElementById("product-image-placeholder");
  if (data.image_url) {
    imgEl.src = data.image_url;
    imgEl.style.display = "block";
    imgPlaceholder.style.display = "none";
    imgEl.onerror = () => {
      imgEl.style.display = "none";
      imgPlaceholder.style.display = "flex";
    };
  }

  document.getElementById("product-name-preview").textContent =
    data.name || "Unknown Product";
  document.getElementById("product-price-preview").textContent = data.price
    ? `${getCurrencySymbol(data.currency)}${data.price}`
    : "";
  document.getElementById("product-store-preview").textContent =
    data.store || "";

  // Form inputs
  document.getElementById("input-name").value = data.name || "";
  document.getElementById("input-price").value = data.price ?? "";
  document.getElementById("input-currency").value = data.currency || "USD";
  document.getElementById("input-store").value = data.store || "";
  document.getElementById("input-notes").value = data.notes || "";

  // Save button
  document.getElementById("btn-save").addEventListener("click", handleSave);
}

function updateFormWithAiData(data) {
  if (userEdited || saving) return;
  if (data.name) {
    document.getElementById("input-name").value = data.name;
    document.getElementById("product-name-preview").textContent = data.name;
  }
  if (data.price != null) {
    document.getElementById("input-price").value = data.price;
    document.getElementById("product-price-preview").textContent =
      `${getCurrencySymbol(data.currency)}${data.price}`;
  }
  if (data.image_url) {
    const imgEl = document.getElementById("product-image");
    const imgPlaceholder = document.getElementById("product-image-placeholder");
    imgEl.src = data.image_url;
    imgEl.style.display = "block";
    imgPlaceholder.style.display = "none";
  }
  if (data.store) {
    document.getElementById("input-store").value = data.store;
    document.getElementById("product-store-preview").textContent = data.store;
  }
  if (data.currency) {
    document.getElementById("input-currency").value = data.currency;
  }
  if (data.notes) {
    document.getElementById("input-notes").value = data.notes;
  }
  if (data.ai_enhanced) {
    document.getElementById("ai-badge").style.display = "inline-flex";
  }

  // AI-suggested tags
  if (data.suggested_tags && Array.isArray(data.suggested_tags)) {
    data.suggested_tags.forEach((tagName) => {
      const tag = allTags.find(
        (t) => t.name.toLowerCase() === tagName.toLowerCase(),
      );
      if (tag) {
        selectedTagIds.add(tag.id);
      }
    });
    renderTags();
  }

  // Update productData
  Object.assign(productData, data);
}

// ── Tags ──────────────────────────────────────────────────────────────

async function fetchTags() {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/tags?select=*&order=name`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) return;

    allTags = await res.json();
    if (allTags.length > 0) {
      renderTags();
    }
  } catch {
    // Tags fetch failed — not critical
  }
}

function renderTags() {
  if (allTags.length === 0) return;

  const section = document.getElementById("tags-section");
  section.style.display = "flex";

  const container = document.getElementById("tags-container");
  container.innerHTML = "";

  allTags.forEach((tag) => {
    const badge = document.createElement("button");
    badge.type = "button";
    badge.setAttribute("aria-pressed", String(selectedTagIds.has(tag.id)));
    badge.className = `tag-badge${selectedTagIds.has(tag.id) ? " selected" : ""}`;
    badge.textContent = tag.name;

    if (selectedTagIds.has(tag.id)) {
      badge.style.backgroundColor = tag.color;
      badge.style.borderColor = "transparent";
    }

    badge.addEventListener("click", () => {
      userEdited = true;
      badge.setAttribute("aria-pressed", String(!selectedTagIds.has(tag.id)));
      if (selectedTagIds.has(tag.id)) {
        selectedTagIds.delete(tag.id);
        badge.classList.remove("selected");
        badge.style.backgroundColor = "";
        badge.style.borderColor = "";
      } else {
        selectedTagIds.add(tag.id);
        badge.classList.add("selected");
        badge.style.backgroundColor = tag.color;
        badge.style.borderColor = "transparent";
      }
    });

    container.appendChild(badge);
  });
}

// ── AI Scrape ─────────────────────────────────────────────────────────

async function fetchAiScrape(url) {
  try {
    const tagNames = allTags.map((t) => t.name);

    const res = await fetch(`${wantioUrl}/api/scrape`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ url, existingTags: tagNames }),
    });

    if (!res.ok) return;

    const data = await res.json();
    updateFormWithAiData(data);
  } catch {
    // AI scrape failed — content script data is sufficient
  }
}

// ── Save ──────────────────────────────────────────────────────────────

async function handleSave() {
  if (saving) return;
  saving = true;
  const btn = document.getElementById("btn-save");
  const btnText = document.getElementById("btn-save-text");
  const btnSpinner = document.getElementById("btn-save-spinner");

  btn.disabled = true;
  btnText.textContent = "Saving...";
  btnSpinner.style.display = "block";

  try {
    const name = document.getElementById("input-name").value.trim();
    if (!name) {
      throw new Error("Product name is required");
    }

    const priceStr = document.getElementById("input-price").value;
    const price = priceStr ? parseFloat(priceStr) : undefined;

    const body = {
      id: itemId,
      name,
      url: productData.url || undefined,
      image_url: productData.image_url || undefined,
      current_price: price,
      store: document.getElementById("input-store").value.trim() || undefined,
      notes: document.getElementById("input-notes").value.trim() || undefined,
      currency: document.getElementById("input-currency").value.trim() || "USD",
      tagIds: Array.from(selectedTagIds),
    };

    const latest = await chrome.runtime.sendMessage({ type: "GET_SESSION" });
    if (!latest?.access_token) throw new Error("Sign in to Wantio again.");
    accessToken = latest.access_token;
    const res = await fetch(`${wantioUrl}/api/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to save item");
    }

    // Success!
    showState("success");
    setTimeout(() => window.close(), 1500);
  } catch (err) {
    saving = false;
    btn.disabled = false;
    btnText.textContent = "Save to Wishlist";
    btnSpinner.style.display = "none";
    document.getElementById("save-error").textContent = err.message;
  }
}

// ── Error ─────────────────────────────────────────────────────────────

function showError(message) {
  showState("error");
  document.getElementById("error-message").textContent = message;
  document.getElementById("btn-retry").addEventListener("click", () => {
    window.location.reload();
  });
}

// ── Helpers ───────────────────────────────────────────────────────────

function getCurrencySymbol(currency) {
  const symbols = {
    USD: "$",
    EUR: "\u20AC",
    GBP: "\u00A3",
    JPY: "\u00A5",
    CAD: "CA$",
    AUD: "A$",
    INR: "\u20B9",
    KRW: "\u20A9",
    BRL: "R$",
    MXN: "MX$",
    SEK: "kr ",
    NOK: "kr ",
    DKK: "kr ",
    CHF: "CHF ",
    PLN: "z\u0142",
  };
  return symbols[currency] || "$";
}
