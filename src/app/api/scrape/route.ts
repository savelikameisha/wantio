import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

interface ScrapedData {
  name: string | null;
  price: number | null;
  image_url: string | null;
  store: string | null;
  url: string;
}

// Common store name mappings from hostname
const STORE_NAMES: Record<string, string> = {
  "amazon.com": "Amazon",
  "amazon.co.uk": "Amazon UK",
  "amazon.de": "Amazon DE",
  "amazon.ca": "Amazon CA",
  "ebay.com": "eBay",
  "etsy.com": "Etsy",
  "walmart.com": "Walmart",
  "target.com": "Target",
  "bestbuy.com": "Best Buy",
  "apple.com": "Apple",
  "nike.com": "Nike",
  "adidas.com": "Adidas",
  "ikea.com": "IKEA",
  "costco.com": "Costco",
  "homedepot.com": "Home Depot",
  "lowes.com": "Lowe's",
  "nordstrom.com": "Nordstrom",
  "macys.com": "Macy's",
  "zara.com": "Zara",
  "hm.com": "H&M",
  "uniqlo.com": "Uniqlo",
  "asos.com": "ASOS",
  "newegg.com": "Newegg",
  "bhphotovideo.com": "B&H Photo",
  "aliexpress.com": "AliExpress",
  "shopify.com": "Shopify",
  "wayfair.com": "Wayfair",
  "overstock.com": "Overstock",
  "sephora.com": "Sephora",
  "ulta.com": "Ulta",
  "rei.com": "REI",
  "brooklinen.com": "Brooklinen",
  "bellroy.com": "Bellroy",
  "keychron.com": "Keychron",
};

function getStoreName(url: string): string | null {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");

    // Check exact match
    if (STORE_NAMES[hostname]) return STORE_NAMES[hostname];

    // Check if hostname ends with a known domain
    for (const [domain, name] of Object.entries(STORE_NAMES)) {
      if (hostname.endsWith(domain)) return name;
    }

    // Fallback: clean up the hostname as a store name
    const parts = hostname.split(".");
    if (parts.length >= 2) {
      const name = parts[parts.length - 2];
      // Capitalize first letter
      return name.charAt(0).toUpperCase() + name.slice(1);
    }

    return null;
  } catch {
    return null;
  }
}

function parsePrice(priceStr: string | undefined | null): number | null {
  if (!priceStr) return null;

  // Remove currency symbols, whitespace, and common separators
  const cleaned = priceStr
    .replace(/[^0-9.,]/g, "")
    .replace(/,(\d{2})$/, ".$1") // Handle European format: 1.234,56 -> 1234.56
    .replace(/,/g, ""); // Remove remaining commas

  const num = parseFloat(cleaned);
  return isNaN(num) ? null : Math.round(num * 100) / 100;
}

function extractJsonLd($: cheerio.CheerioAPI): {
  name?: string;
  price?: number | null;
  image?: string;
} {
  const result: { name?: string; price?: number | null; image?: string } = {};

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const text = $(el).html();
      if (!text) return;

      const data = JSON.parse(text);

      // Handle both single objects and arrays
      const items = Array.isArray(data) ? data : [data];

      for (const item of items) {
        // Look for Product schema
        const product =
          item["@type"] === "Product"
            ? item
            : item["@graph"]?.find(
                (g: { "@type"?: string }) => g["@type"] === "Product"
              );

        if (product) {
          if (product.name && !result.name) {
            result.name = product.name;
          }

          if (product.image && !result.image) {
            const img = Array.isArray(product.image)
              ? product.image[0]
              : product.image;
            result.image = typeof img === "string" ? img : img?.url;
          }

          // Price from offers
          const offers = product.offers;
          if (offers && !result.price) {
            const offer = Array.isArray(offers) ? offers[0] : offers;
            const price =
              offer.price ?? offer.lowPrice ?? offer.highPrice;
            if (price) {
              result.price = parsePrice(String(price));
            }
          }
        }
      }
    } catch {
      // Invalid JSON-LD, skip
    }
  });

  return result;
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("Invalid protocol");
      }
    } catch {
      return NextResponse.json(
        { error: "Invalid URL" },
        { status: 400 }
      );
    }

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL (${response.status})` },
        { status: 422 }
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // 1. Try JSON-LD structured data first (most reliable)
    const jsonLd = extractJsonLd($);

    // 2. Extract from Open Graph / meta tags
    const ogTitle =
      $('meta[property="og:title"]').attr("content") ||
      $('meta[name="og:title"]').attr("content");
    const ogImage =
      $('meta[property="og:image"]').attr("content") ||
      $('meta[name="og:image"]').attr("content");
    const ogPrice =
      $('meta[property="og:price:amount"]').attr("content") ||
      $('meta[property="product:price:amount"]').attr("content") ||
      $('meta[property="product:price"]').attr("content");

    // 3. Extract from Twitter card
    const twitterTitle = $('meta[name="twitter:title"]').attr("content");
    const twitterImage = $('meta[name="twitter:image"]').attr("content");

    // 4. Fallback to page title
    const pageTitle = $("title").text().trim();

    // 5. Try to find price in common selectors
    let selectorPrice: number | null = null;
    const priceSelectors = [
      '[data-price]',
      '.price',
      '#price',
      '.product-price',
      '.current-price',
      '[class*="price"] [class*="current"]',
      '[class*="Price"]',
      '.a-price .a-offscreen', // Amazon
      '#priceblock_ourprice', // Amazon
      '#priceblock_dealprice', // Amazon
      '.price-characteristic', // Walmart
      '[data-test="product-price"]', // Target
    ];

    for (const selector of priceSelectors) {
      const el = $(selector).first();
      if (el.length) {
        const priceText = el.attr("data-price") || el.text();
        selectorPrice = parsePrice(priceText);
        if (selectorPrice) break;
      }
    }

    // Resolve image URL (make absolute if relative)
    const resolveUrl = (imgUrl: string | undefined | null): string | null => {
      if (!imgUrl) return null;
      try {
        return new URL(imgUrl, url).href;
      } catch {
        return null;
      }
    };

    // Assemble result with priority: JSON-LD > OG > Twitter > Selectors > Page
    const result: ScrapedData = {
      name:
        jsonLd.name ||
        ogTitle ||
        twitterTitle ||
        pageTitle ||
        null,
      price:
        jsonLd.price ??
        parsePrice(ogPrice) ??
        selectorPrice ??
        null,
      image_url:
        resolveUrl(jsonLd.image) ||
        resolveUrl(ogImage) ||
        resolveUrl(twitterImage) ||
        null,
      store: getStoreName(url),
      url,
    };

    // Clean up the name (remove site name suffixes like " | Amazon.com" or " - Best Buy")
    if (result.name) {
      result.name = result.name
        .replace(/\s*[\|–—-]\s*[^|–—-]*$/, "")
        .trim();

      // If name is too long, truncate
      if (result.name.length > 200) {
        result.name = result.name.substring(0, 200).trim();
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";

    if (message.includes("timeout") || message.includes("abort")) {
      return NextResponse.json(
        { error: "Request timed out. The site may be too slow or blocking requests." },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { error: "Failed to scrape URL" },
      { status: 500 }
    );
  }
}
