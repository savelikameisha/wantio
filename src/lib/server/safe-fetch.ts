import { lookup } from "node:dns/promises";
import http from "node:http";
import https from "node:https";
import ipaddr from "ipaddr.js";
export function isPublicAddress(address: string): boolean {
  try {
    return ipaddr.process(address).range() === "unicast";
  } catch {
    return false;
  }
}
export async function fetchProductHtml(
  input: string,
): Promise<{ html: string; url: string }> {
  let url = new URL(input);
  const deadline = Date.now() + 20000;
  for (let redirects = 0; redirects <= 3; redirects++) {
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      (url.port && !["80", "443"].includes(url.port))
    )
      throw new Error("This URL is not supported.");
    const hostname = url.hostname.replace(/^\[|\]$/g, "");
    let dnsTimer: ReturnType<typeof setTimeout> | undefined;
    const addresses = await Promise.race([
      lookup(hostname, { all: true }),
      new Promise<never>((_, reject) => {
        dnsTimer = setTimeout(
          () => reject(new Error("The store took too long to respond.")),
          Math.max(1, deadline - Date.now()),
        );
      }),
    ]).finally(() => clearTimeout(dnsTimer));
    if (!addresses.length || addresses.some((a) => !isPublicAddress(a.address)))
      throw new Error("Only public store websites are supported.");
    const selected = addresses[0];
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new Error("The store took too long to respond.");
    const result = await new Promise<{ html?: string; redirect?: string }>(
      (resolve, reject) => {
        const transport = url.protocol === "https:" ? https : http;
        const req = transport.get(
          url,
          {
            agent: false,
            // Pin the validated address for this connection; retain hostname for TLS/SNI.
            lookup: (_host, options, callback) =>
              options.all
                ? callback(null, [selected])
                : callback(null, selected.address, selected.family),
            headers: {
              "User-Agent": "Wantio/1.0 (product wishlist)",
              Accept: "text/html,application/xhtml+xml",
              "Accept-Encoding": "identity",
            },
          },
          (res) => {
            if (
              [301, 302, 303, 307, 308].includes(res.statusCode ?? 0) &&
              res.headers.location
            ) {
              res.destroy();
              resolve({ redirect: res.headers.location });
              return;
            }
            if ((res.statusCode ?? 500) >= 400) {
              res.destroy();
              reject(
                new Error(
                  `The store returned ${res.statusCode}. Add the details manually.`,
                ),
              );
              return;
            }
            if (
              !/text\/html|application\/xhtml\+xml/i.test(
                res.headers["content-type"] || "",
              )
            ) {
              res.destroy();
              reject(new Error("The URL must point to a product webpage."));
              return;
            }
            let length = 0;
            const chunks: Buffer[] = [];
            res.on("data", (chunk) => {
              length += chunk.length;
              if (length > 2 * 1024 * 1024) {
                res.destroy(
                  new Error(
                    "The store page is too large. Add the details manually.",
                  ),
                );
                return;
              }
              chunks.push(chunk);
            });
            res.on("end", () =>
              resolve({ html: Buffer.concat(chunks).toString("utf8") }),
            );
            res.on("error", reject);
          },
        );
        const timer = setTimeout(
          () => req.destroy(new Error("The store took too long to respond.")),
          remaining,
        );
        req.on("close", () => clearTimeout(timer));
        req.on("error", reject);
      },
    );
    if (result.redirect) {
      url = new URL(result.redirect, url);
      continue;
    }
    return { html: result.html || "", url: url.href };
  }
  throw new Error("The store redirected too many times.");
}
