import { readJson, RequestSizeError } from "@/lib/server/request";
import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import OpenAI from "openai";
import { parsePrice } from "@/lib/price";
import { fetchProductHtml } from "@/lib/server/safe-fetch";
import { authenticatedClient } from "@/lib/server/auth";
import { z } from "zod";
import { webUrl } from "@/lib/validation";

interface ScrapedData {
  name: string | null;
  price: number | null;
  image_url: string | null;
  store: string | null;
  currency: string | null;
  url: string;
  suggested_tags: string[];
  notes: string | null;
  ai_enhanced: boolean;
}

// Domain-based currency detection
const DOMAIN_CURRENCIES: Record<string, string> = {
  ".co.uk": "GBP",
  ".de": "EUR",
  ".fr": "EUR",
  ".it": "EUR",
  ".es": "EUR",
  ".nl": "EUR",
  ".be": "EUR",
  ".at": "EUR",
  ".ca": "CAD",
  ".co.jp": "JPY",
  ".jp": "JPY",
  ".com.au": "AUD",
  ".co.kr": "KRW",
  ".co.in": "INR",
  ".com.br": "BRL",
  ".com.mx": "MXN",
  ".se": "SEK",
  ".no": "NOK",
  ".dk": "DKK",
  ".pl": "PLN",
  ".ch": "CHF",
};

function detectCurrencyFromDomain(url: string): string | null {
  try {
    const hostname = new URL(url).hostname;
    for (const [suffix, currency] of Object.entries(DOMAIN_CURRENCIES)) {
      if (hostname.endsWith(suffix)) return currency;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function detectCurrencyFromPrice(
  priceStr: string | undefined | null,
): string | null {
  if (!priceStr) return null;
  const s = priceStr.trim();
  if (s.startsWith("€") || s.includes("EUR")) return "EUR";
  if (s.startsWith("£") || s.includes("GBP")) return "GBP";
  if (s.startsWith("¥") || s.includes("JPY")) return "JPY";
  if (s.includes("CA$") || s.includes("CAD")) return "CAD";
  if (s.includes("A$") || s.includes("AUD")) return "AUD";
  if (s.startsWith("₹") || s.includes("INR")) return "INR";
  if (s.startsWith("R$") || s.includes("BRL")) return "BRL";
  if (s.startsWith("₩") || s.includes("KRW")) return "KRW";
  if (s.startsWith("$") || s.includes("USD")) return "USD";
  return null;
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

    if (STORE_NAMES[hostname]) return STORE_NAMES[hostname];

    for (const [domain, name] of Object.entries(STORE_NAMES)) {
      if (hostname === domain || hostname.endsWith("." + domain)) return name;
    }

    const parts = hostname.split(".");
    if (parts.length >= 2) {
      const name = parts[parts.length - 2];
      return name.charAt(0).toUpperCase() + name.slice(1);
    }

    return null;
  } catch {
    return null;
  }
}

function extractJsonLd($: cheerio.CheerioAPI): {
  name?: string;
  price?: number | null;
  image?: string;
  currency?: string;
} {
  const result: {
    name?: string;
    price?: number | null;
    image?: string;
    currency?: string;
  } = {};

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const text = $(el).html();
      if (!text) return;

      const data = JSON.parse(text);
      const items = Array.isArray(data) ? data : [data];

      for (const item of items) {
        const product =
          item["@type"] === "Product"
            ? item
            : item["@graph"]?.find(
                (g: { "@type"?: string }) => g["@type"] === "Product",
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

          const offers = product.offers;
          if (offers && !result.price) {
            const offer = Array.isArray(offers) ? offers[0] : offers;
            const price = offer.price ?? offer.lowPrice ?? offer.highPrice;
            if (price) {
              result.price = parsePrice(String(price));
            }
            if (offer.priceCurrency && !result.currency) {
              result.currency = offer.priceCurrency;
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

// ── AI Enhancement ──────────────────────────────────────────────────

function truncateHtml(html: string, maxLength: number = 15000): string {
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);

  const head = headMatch ? headMatch[0] : "";
  const bodyContent = bodyMatch ? bodyMatch[1] || "" : html;
  const remainingLength = maxLength - head.length;

  return (head + bodyContent.substring(0, Math.max(0, remainingLength))).slice(
    0,
    maxLength,
  );
}

async function enhanceWithAI(
  html: string,
  basicData: {
    name: string | null;
    price: number | null;
    image_url: string | null;
    store: string | null;
    currency: string | null;
  },
  existingTags: string[],
): Promise<{
  name: string | null;
  price: number | null;
  image_url: string | null;
  suggested_tags: string[];
  notes: string | null;
} | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const openai = new OpenAI({ apiKey, timeout: 12000, maxRetries: 0 });
    const truncatedHtml = truncateHtml(html);

    const tagContext =
      existingTags.length > 0
        ? `\nUser's existing tags: [${existingTags.join(", ")}]\nSelect 0-3 tags from this list that fit the product. Only use exact tag names from this list.`
        : "\nNo existing tags available. Return an empty suggested_tags array.";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content:
            "You are a product data extraction assistant. Return only valid JSON.",
        },
        {
          role: "user",
          content: `Extract and clean product data from this page.

Preliminary scrape results:
- Name: ${basicData.name || "not found"}
- Price: ${basicData.price ?? "not found"}
- Store: ${basicData.store || "unknown"}
- Image: ${basicData.image_url || "not found"}
${tagContext}

HTML (truncated):
${truncatedHtml}

Return JSON:
{
  "name": "Clean product name — remove SEO junk, store names, promotional text. Keep concise but descriptive.",
  "price": number or null,
  "image_url": "best product image URL from the page, or null if the existing one is good",
  "suggested_tags": ["tag1"] (from user's existing tags only, or empty array),
  "notes": "Brief 1-2 sentence product description for a wishlist note."
}`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);

    return {
      name: typeof parsed.name === "string" ? parsed.name : null,
      price:
        typeof parsed.price === "number"
          ? Math.round(parsed.price * 100) / 100
          : null,
      image_url:
        typeof parsed.image_url === "string" &&
        parsed.image_url.startsWith("http")
          ? parsed.image_url
          : null,
      suggested_tags: Array.isArray(parsed.suggested_tags)
        ? parsed.suggested_tags
            .filter(
              (t: unknown) => typeof t === "string" && existingTags.includes(t),
            )
            .slice(0, 3)
        : [],
      notes: typeof parsed.notes === "string" ? parsed.notes : null,
    };
  } catch {
    // AI enhancement failed silently — fall back to basic scrape
    return null;
  }
}

// ── Main Handler ────────────────────────────────────────────────────

export async function POST(request: Request) {
  let client;
  try {
    ({ client } = await authenticatedClient(request));
  } catch {
    return NextResponse.json(
      { error: "Sign in to continue." },
      { status: 401 },
    );
  }
  try {
    const body = z
      .object({
        url: webUrl,
        existingTags: z.array(z.string().max(40)).max(100).default([]),
      })
      .safeParse(await readJson(request));
    if (!body.success)
      return NextResponse.json(
        { error: "Enter a valid product URL." },
        { status: 400 },
      );
    const { data: allowed, error: quotaError } = await client.rpc(
      "consume_scrape_quota",
    );
    if (quotaError)
      return NextResponse.json(
        {
          error:
            "Product lookup is temporarily unavailable. Add details manually.",
        },
        { status: 503 },
      );
    if (!allowed)
      return NextResponse.json(
        {
          error:
            "You have reached the hourly lookup limit. Add details manually or try later.",
        },
        { status: 429 },
      );
    const { existingTags } = body.data;
    const { html, url } = await fetchProductHtml(body.data.url);
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
    const ogCurrency =
      $('meta[property="og:price:currency"]').attr("content") ||
      $('meta[property="product:price:currency"]').attr("content");

    // 3. Extract from Twitter card
    const twitterTitle = $('meta[name="twitter:title"]').attr("content");
    const twitterImage = $('meta[name="twitter:image"]').attr("content");

    // 4. Fallback to page title
    const pageTitle = $("title").text().trim();

    // 5. Try to find price in common selectors
    let selectorPrice: number | null = null;
    const priceSelectors = [
      "[data-price]",
      ".price",
      "#price",
      ".product-price",
      ".current-price",
      '[class*="price"] [class*="current"]',
      '[class*="Price"]',
      ".a-price .a-offscreen", // Amazon
      "#priceblock_ourprice", // Amazon
      "#priceblock_dealprice", // Amazon
      ".price-characteristic", // Walmart
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

    // Detect currency: JSON-LD > OG > price string > domain TLD
    const rawPriceStr =
      $("[data-price]").first().text() ||
      $(".price").first().text() ||
      ogPrice ||
      "";
    const detectedCurrency =
      jsonLd.currency ||
      ogCurrency ||
      detectCurrencyFromPrice(rawPriceStr) ||
      detectCurrencyFromDomain(url) ||
      null;

    // Assemble result with priority: JSON-LD > OG > Twitter > Selectors > Page
    const result: ScrapedData = {
      name: jsonLd.name || ogTitle || twitterTitle || pageTitle || null,
      price: jsonLd.price ?? parsePrice(ogPrice) ?? selectorPrice ?? null,
      image_url:
        resolveUrl(jsonLd.image) ||
        resolveUrl(ogImage) ||
        resolveUrl(twitterImage) ||
        null,
      store: getStoreName(url),
      currency: detectedCurrency,
      url,
      suggested_tags: [],
      notes: null,
      ai_enhanced: false,
    };

    // Clean up the name (remove site name suffixes like " | Amazon.com" or " - Best Buy")
    if (result.name) {
      result.name = result.name.replace(/\s*[\|–—-]\s*[^|–—-]*$/, "").trim();

      if (result.name.length > 200) {
        result.name = result.name.substring(0, 200).trim();
      }
    }

    // ── AI Enhancement Step ──
    const aiResult = await enhanceWithAI(
      html,
      {
        name: result.name,
        price: result.price,
        image_url: result.image_url,
        store: result.store,
        currency: result.currency,
      },
      Array.isArray(existingTags) ? existingTags : [],
    );

    if (aiResult) {
      if (aiResult.name) result.name = aiResult.name;
      if (
        result.price === null &&
        aiResult.price !== null &&
        aiResult.price >= 0
      )
        result.price = aiResult.price;
      if (aiResult.image_url) result.image_url = aiResult.image_url;
      result.suggested_tags = aiResult.suggested_tags;
      result.notes = aiResult.notes;
      result.ai_enhanced = true;
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof RequestSizeError)
      return NextResponse.json({ error: error.message }, { status: 413 });
    if (error instanceof SyntaxError)
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message.includes("timeout") || message.includes("abort")) {
      return NextResponse.json(
        {
          error:
            "Request timed out. The site may be too slow or blocking requests.",
        },
        { status: 408 },
      );
    }

    return NextResponse.json(
      { error: "Failed to scrape URL" },
      { status: 500 },
    );
  }
}
