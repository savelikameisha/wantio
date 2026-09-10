// Wantio Chrome Extension — Content Script
// Extracts product data from the current page (runs in page context)

(function () {
  function getMetaContent(property) {
    const el = document.querySelector(
      `meta[property="${property}"], meta[name="${property}"]`,
    );
    return el ? el.getAttribute("content") : null;
  }

  function extractJsonLd() {
    const scripts = document.querySelectorAll(
      'script[type="application/ld+json"]',
    );
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent);
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          const product =
            item["@type"] === "Product"
              ? item
              : item["@graph"]?.find((g) => g["@type"] === "Product");
          if (product) {
            const offers = product.offers;
            const offer = Array.isArray(offers) ? offers[0] : offers;
            return {
              name: product.name || null,
              price: offer?.price ?? offer?.lowPrice ?? null,
              currency: offer?.priceCurrency || null,
              image: Array.isArray(product.image)
                ? product.image[0]
                : typeof product.image === "string"
                  ? product.image
                  : product.image?.url || null,
            };
          }
        }
      } catch {
        // Invalid JSON-LD, skip
      }
    }
    return {};
  }

  function extractPrice() {
    const selectors = [
      "[data-price]",
      ".price",
      "#price",
      ".product-price",
      ".current-price",
      '[class*="price"] [class*="current"]',
      '[class*="Price"]',
      ".a-price .a-offscreen",
      "#priceblock_ourprice",
      "#priceblock_dealprice",
      ".price-characteristic",
      '[data-test="product-price"]',
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        const text = el.getAttribute("data-price") || el.textContent;
        const num = globalThis.wantioParsePrice(text);
        if (num !== null) return num;
      }
    }
    return null;
  }

  function detectCurrency() {
    const ogCurrency =
      getMetaContent("og:price:currency") ||
      getMetaContent("product:price:currency");
    if (ogCurrency) return ogCurrency;

    const hostname = window.location.hostname;
    const domainCurrencies = {
      ".pl": "PLN",
      ".co.uk": "GBP",
      ".de": "EUR",
      ".fr": "EUR",
      ".it": "EUR",
      ".es": "EUR",
      ".ca": "CAD",
      ".co.jp": "JPY",
      ".com.au": "AUD",
      ".co.in": "INR",
    };
    for (const [suffix, curr] of Object.entries(domainCurrencies)) {
      if (hostname.endsWith(suffix)) return curr;
    }
    return null;
  }

  // Store name mapping (subset of the server-side list)
  const STORE_NAMES = {
    "amazon.com": "Amazon",
    "amazon.co.uk": "Amazon UK",
    "ebay.com": "eBay",
    "etsy.com": "Etsy",
    "walmart.com": "Walmart",
    "target.com": "Target",
    "bestbuy.com": "Best Buy",
    "apple.com": "Apple",
    "nike.com": "Nike",
    "adidas.com": "Adidas",
    "ikea.com": "IKEA",
    "nordstrom.com": "Nordstrom",
    "zara.com": "Zara",
    "hm.com": "H&M",
    "uniqlo.com": "Uniqlo",
    "asos.com": "ASOS",
    "sephora.com": "Sephora",
    "wayfair.com": "Wayfair",
    "costco.com": "Costco",
  };

  function getStoreName() {
    const hostname = window.location.hostname.replace(/^www\./, "");
    if (STORE_NAMES[hostname]) return STORE_NAMES[hostname];
    for (const [domain, name] of Object.entries(STORE_NAMES)) {
      if (hostname === domain || hostname.endsWith("." + domain)) return name;
    }
    // Fallback: capitalize the domain name
    const parts = hostname.split(".");
    if (parts.length >= 2) {
      const name = parts[parts.length - 2];
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return hostname;
  }

  // Extract everything
  const jsonLd = extractJsonLd();

  const result = {
    url: window.location.href,
    name:
      jsonLd.name ||
      getMetaContent("og:title") ||
      getMetaContent("twitter:title") ||
      document.title ||
      null,
    price: globalThis.wantioParsePrice(jsonLd.price) ?? extractPrice(),
    image_url:
      jsonLd.image ||
      getMetaContent("og:image") ||
      getMetaContent("twitter:image") ||
      null,
    currency: jsonLd.currency || detectCurrency() || null,
    store: getStoreName(),
  };

  // Clean up name — remove site name suffixes like " | Amazon.com"
  if (result.name) {
    result.name = result.name.replace(/\s*[|–—-]\s*[^|–—-]*$/, "").trim();
    if (result.name.length > 200)
      result.name = result.name.substring(0, 200).trim();
  }

  // Make relative image URLs absolute
  if (typeof result.image_url !== "string")
    result.image_url = result.image_url?.url || null;
  if (result.image_url && !result.image_url.startsWith("http")) {
    try {
      result.image_url = new URL(result.image_url, window.location.href).href;
    } catch {
      result.image_url = null;
    }
  }

  return result;
})();
