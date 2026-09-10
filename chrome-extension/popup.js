import { send, appUrl, webUrl, money, newerVersion } from "./lib/popup-api.js";
const $ = (id) => document.getElementById(id);
let item,
  sourceUrl,
  images = [],
  tags = [],
  saving = false,
  dirty = false,
  loadingDetails = false,
  connected = false;
let nameBeforeFocus = "";
function state(name) {
  document.querySelectorAll(".state").forEach((el) => {
    el.hidden = el.id !== `state-${name}`;
  });
}
function showError(error, inline = false) {
  const el = $(inline ? "form-error" : "error-message");
  el.textContent = error.message || String(error);
  if (inline) $("form-reconnect").hidden = error.code !== "auth";
  else state("error");
}
function connect() {
  chrome.tabs.create({ url: `${appUrl}/auth/extension` });
  window.close();
}
function setImage(url) {
  item.image_url = url || "";
  const img = $("product-image");
  img.hidden = !url;
  $("image-placeholder").hidden = !!url;
  if (url) img.src = url;
  else img.removeAttribute("src");
}
function renderPrice() {
  $("price-label").textContent = money(item.current_price, item.currency);
  $("price-input").value = item.current_price ?? "";
  $("currency-input").value = item.currency;
}
function renderTags() {
  $("tag-section").hidden = !tags.length;
  const container = $("tags");
  container.replaceChildren();
  for (const tag of tags) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tag";
    button.textContent = tag.name;
    button.setAttribute("aria-pressed", String(item.tagIds.includes(tag.id)));
    button.addEventListener("click", () => {
      item.tagIds = item.tagIds.includes(tag.id)
        ? item.tagIds.filter((id) => id !== tag.id)
        : [...item.tagIds, tag.id];
      renderTags();
      persist();
    });
    container.append(button);
  }
}
function render() {
  $("item-name").textContent = item.name;
  setImage(item.image_url);
  renderPrice();
  $("source-label").textContent = item.store || new URL(sourceUrl).hostname;
  $("store-input").value = item.store || "";
  $("url-input").value = item.url;
  $("note-input").value = item.notes || "";
  $("note-section").hidden = !item.notes;
  $("add-note").hidden = !!item.notes;
  renderTags();
  state("form");
}
function snapshot() {
  return {
    ...item,
    name: $("item-name").textContent.trim(),
    notes: $("note-input").value,
    store: $("store-input").value.trim(),
    url: $("url-input").value.trim(),
  };
}
function persist() {
  if (!item || saving) return;
  dirty = true;
  item = snapshot();
  send("SAVE_DRAFT", { url: sourceUrl, item })
    .then(() => {
      $("draft-status").textContent = "Draft kept on this device.";
    })
    .catch(() => {
      $("draft-status").textContent =
        "Could not keep the draft. Leave this window open.";
    });
}
function resetError() {
  $("form-error").textContent = "";
  $("form-reconnect").hidden = true;
}
function setBusy(busy) {
  saving = busy;
  $("save").disabled = busy;
  $("save").textContent = busy ? "Saving your find…" : "Save to wishlist +";
  $("item-name").contentEditable = busy ? "false" : "plaintext-only";
  document
    .querySelectorAll(
      "#item-form input,#item-form textarea,#item-form select,#item-form button",
    )
    .forEach((el) => {
      el.disabled = busy;
    });
}
async function init() {
  state("loading");
  try {
    const session = await send("GET_SESSION");
    if (!session) {
      state("login");
      return;
    }
    connected = true;
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    sourceUrl = webUrl(tab?.url);
    if (
      !sourceUrl ||
      new URL(sourceUrl).origin === appUrl ||
      new URL(sourceUrl).hostname === "chromewebstore.google.com"
    ) {
      state("ready");
      return;
    }
    let extracted = {};
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["price.js", "content.js"],
      });
      extracted = results?.[0]?.result || {};
    } catch {
      $("notice").textContent =
        "This page could not be read. You can still add the details yourself.";
    }
    images =
      extracted.images || (extracted.image_url ? [extracted.image_url] : []);
    const entry = await send("GET_DRAFT", { url: sourceUrl });
    item = entry?.item || {
      id: crypto.randomUUID(),
      name: extracted.name || tab.title || "",
      url: sourceUrl,
      image_url: webUrl(extracted.image_url) || "",
      current_price: extracted.price ?? undefined,
      currency: extracted.currency || "USD",
      store: extracted.store || new URL(sourceUrl).hostname,
      notes: "",
      tagIds: [],
    };
    dirty = !!entry;
    if (!Intl.supportedValuesOf("currency").includes(item.currency))
      item.currency = "USD";
    if (entry?.saved) {
      $("saved-name").textContent = item.name;
      state("success");
    } else {
      render();
      if (entry) $("draft-status").textContent = "Your draft is back.";
    }
    send("GET_TAGS")
      .then((result) => {
        tags = result;
        renderTags();
      })
      .catch((error) => {
        $("notice").textContent =
          error.code === "auth"
            ? "Reconnect to load your tags."
            : "Tags are unavailable right now. You can still save this item.";
      });
    send("GET_CONFIG")
      .then((config) => {
        if (
          newerVersion(
            chrome.runtime.getManifest().version,
            config.extensionVersion,
          )
        )
          $("version").textContent += " · Update available";
      })
      .catch(() => {});
  } catch (error) {
    if (error.code === "auth") state("login");
    else showError(error);
  }
}
$("version").textContent = `Version ${chrome.runtime.getManifest().version}`;
for (const currency of Intl.supportedValuesOf("currency")) {
  const option = document.createElement("option");
  option.value = currency;
  option.textContent = currency;
  $("currency-input").append(option);
}
$("menu-button").addEventListener("click", () => {
  const open = $("menu").hidden;
  $("menu").hidden = !open;
  $("menu-button").setAttribute("aria-expanded", String(open));
});
document.addEventListener("click", (event) => {
  if (
    !$("menu").contains(event.target) &&
    !$("menu-button").contains(event.target)
  ) {
    $("menu").hidden = true;
    $("menu-button").setAttribute("aria-expanded", "false");
  }
});
for (const id of ["connect", "reconnect", "error-connect", "form-reconnect"])
  $(id).addEventListener("click", connect);
$("retry").addEventListener("click", () => location.reload());
$("product-image").addEventListener("error", () => {
  $("product-image").hidden = true;
  $("image-placeholder").hidden = false;
});
$("item-name").addEventListener("focus", () => {
  nameBeforeFocus = $("item-name").textContent;
});
$("item-name").addEventListener("input", persist);
$("item-name").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    event.currentTarget.blur();
  }
  if (event.key === "Escape") {
    event.currentTarget.textContent = nameBeforeFocus;
    event.currentTarget.blur();
    persist();
  }
});
$("edit-price").addEventListener("click", () => {
  $("price-editor").hidden = false;
  $("edit-price").setAttribute("aria-expanded", "true");
  $("price-input").focus();
});
function commitPrice() {
  const input = $("price-input");
  if (!input.checkValidity()) {
    input.reportValidity();
    return false;
  }
  item.current_price = input.value === "" ? undefined : Number(input.value);
  item.currency = $("currency-input").value;
  renderPrice();
  $("price-editor").hidden = true;
  $("edit-price").setAttribute("aria-expanded", "false");
  persist();
  return true;
}
$("price-done").addEventListener("click", commitPrice);
$("price-editor").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    commitPrice();
  }
  if (event.key === "Escape") {
    renderPrice();
    $("price-editor").hidden = true;
    $("edit-price").focus();
  }
});
$("add-note").addEventListener("click", () => {
  $("note-section").hidden = false;
  $("add-note").hidden = true;
  $("note-input").focus();
});
for (const id of ["note-input", "store-input", "url-input"])
  $(id).addEventListener("input", persist);
$("change-image").addEventListener("click", () => {
  const options = $("image-options");
  options.replaceChildren();
  const choices = [...new Set([item.image_url, ...images].filter(Boolean))];
  choices.forEach((url, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "image-option";
    button.setAttribute("aria-label", `Choose image ${index + 1}`);
    button.setAttribute("aria-pressed", String(url === item.image_url));
    const img = document.createElement("img");
    img.src = url;
    img.alt = "";
    img.referrerPolicy = "no-referrer";
    button.append(img);
    button.addEventListener("click", () => {
      setImage(url);
      $("image-picker").close();
      persist();
    });
    options.append(button);
  });
  $("image-error").textContent = "";
  $("image-link").value = "";
  $("image-picker").showModal();
});
$("close-picker").addEventListener("click", () => $("image-picker").close());
$("image-link-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const url = webUrl($("image-link").value);
  if (!url) {
    $("image-error").textContent = "Use an http or https image link.";
    return;
  }
  setImage(url);
  images.unshift(url);
  $("image-picker").close();
  persist();
});
$("remove-image").addEventListener("click", () => {
  setImage("");
  $("image-picker").close();
  persist();
});
$("refresh-details").addEventListener("click", async () => {
  const url = webUrl($("url-input").value);
  if (!url) {
    showError(new Error("Enter a valid product link."), true);
    return;
  }
  if (loadingDetails) return;
  loadingDetails = true;
  dirty = false;
  $("refresh-details").disabled = true;
  $("notice").textContent = "Looking up product details…";
  resetError();
  try {
    const result = await send("SCRAPE", { url, tags: tags.map((t) => t.name) });
    if (dirty || saving || item.url !== url) {
      $("notice").textContent =
        "Kept your edits. The lookup did not replace them.";
      return;
    }
    item = {
      ...item,
      name: result.name || item.name,
      current_price: result.price ?? item.current_price,
      currency: result.currency || item.currency,
      image_url: webUrl(result.image_url) || item.image_url,
      store: result.store || item.store,
    };
    render();
    persist();
    $("notice").textContent =
      "Details refreshed. Check the price before saving.";
  } catch (error) {
    showError(error, true);
    $("notice").textContent = "You can enter the details yourself.";
  } finally {
    loadingDetails = false;
    $("refresh-details").disabled = false;
  }
});
$("item-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (saving) return;
  if (!$("price-editor").hidden && !commitPrice()) return;
  item = snapshot();
  resetError();
  if (!item.name || item.name.length > 200) {
    showError(new Error("Give this find a name, up to 200 characters."), true);
    $("item-name").focus();
    return;
  }
  if (!webUrl(item.url)) {
    showError(new Error("Check the product link in More details."), true);
    $("details").open = true;
    $("url-input").focus();
    return;
  }
  if (!$("item-form").reportValidity()) return;
  setBusy(true);
  try {
    await send("SAVE_ITEM", { item, url: sourceUrl });
    $("saved-name").textContent = item.name;
    state("success");
  } catch (error) {
    showError(error, true);
  } finally {
    setBusy(false);
  }
});
$("save-another").addEventListener("click", async () => {
  await send("CLEAR_DRAFT", { url: sourceUrl });
  item.id = crypto.randomUUID();
  render();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !$("image-picker").open) {
    $("menu").hidden = true;
    $("menu-button").setAttribute("aria-expanded", "false");
  }
  if (
    (event.metaKey || event.ctrlKey) &&
    event.key === "Enter" &&
    !$("state-form").hidden
  ) {
    event.preventDefault();
    $("item-form").requestSubmit();
  }
});
chrome.storage.onChanged.addListener((changes, area) => {
  if (
    area === "local" &&
    changes.wantio_session &&
    !connected &&
    !$("state-login").hidden
  )
    init();
});
init();

$("disconnect").addEventListener("click", async () => {
  try {
    await send("LOGOUT");
    connected = false;
    $("menu").hidden = true;
    $("menu-button").setAttribute("aria-expanded", "false");
    state("login");
  } catch (error) {
    showError(error);
  }
});
for (const id of ["price-input", "currency-input"])
  $(id).addEventListener("input", () => {
    dirty = true;
    if (!$("price-input").checkValidity()) return;
    item.current_price =
      $("price-input").value === ""
        ? undefined
        : Number($("price-input").value);
    item.currency = $("currency-input").value;
    persist();
  });
