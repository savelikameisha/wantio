import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import { createHash } from "node:crypto";
const version = JSON.parse(
  fs.readFileSync("chrome-extension/manifest.json", "utf8"),
).version;
const output = path.resolve(
  process.env.WANTIO_RELEASE_DIR || `../releases/wantio-${version}`,
);
fs.mkdirSync(output, { recursive: true });
const dataUrl = (file, mime) =>
  `data:${mime};base64,${fs.readFileSync(file).toString("base64")}`;
const logo = dataUrl("public/icon.svg", "image/svg+xml");
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
  });
  for (const [file, title, copy, screen] of [
    [
      "01-save-a-find.png",
      "A little home for<br>your next find.",
      "Choose a photo. Make the details yours.<br>Keep it all in Wantio.",
      "form",
    ],
    [
      "02-choose-an-image.png",
      "The right photo.<br>Your kind of detail.",
      "Pick an image from the page,<br>or add a link of your own.",
      "image-picker",
    ],
  ]) {
    const shot = dataUrl(`test-results/extension/${screen}.png`, "image/png");
    await page.setContent(
      `<style>*{box-sizing:border-box}body{margin:0;background:#f4f4f2;color:#171717;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}.brand{position:absolute;left:80px;top:72px;display:flex;align-items:center;gap:12px;font-size:24px;font-weight:600}.brand img{width:46px}h1{position:absolute;left:80px;top:236px;font-size:55px;font-weight:550;letter-spacing:-2px;line-height:1.09;margin:0}p{position:absolute;left:82px;top:401px;font-size:20px;color:#727272;line-height:1.6}.screen{position:absolute;right:100px;top:100px;width:380px;height:600px;border-radius:20px;overflow:hidden;box-shadow:0 15px 60px #00000012;outline:1px solid #0000000a}.screen img{width:380px;height:600px}.foot{position:absolute;left:82px;bottom:75px;color:#777;font-size:14px}</style><div class="brand"><img src="${logo}">Wantio</div><h1>${title}</h1><p>${copy}</p><div class="screen"><img src="${shot}"></div><div class="foot">Wantio for Chrome · wantio.app</div>`,
    );
    await page.locator(".screen img").evaluate((img) => img.decode());
    await page.screenshot({ path: path.join(output, file) });
  }
  await page.setViewportSize({ width: 440, height: 280 });
  await page.setContent(
    `<style>body{margin:0;background:#f4f4f2;font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#171717;padding:30px}img{width:40px;vertical-align:middle;margin-right:8px}header{font-size:20px;font-weight:600}h1{font-size:36px;line-height:1.12;letter-spacing:-1px;font-weight:550;margin:30px 0 0}</style><header><img src="${logo}">Wantio</header><h1>Your finds,<br>all together.</h1>`,
  );
  await page.screenshot({ path: path.join(output, "small-promo-440x280.png") });
} finally {
  await browser.close();
}
fs.copyFileSync(
  "chrome-extension/icons/icon-128.png",
  path.join(output, "icon-128.png"),
);
const zip = fs.readFileSync("public/wantio-extension.zip");
fs.writeFileSync(path.join(output, `wantio-extension-${version}.zip`), zip);
fs.writeFileSync(
  path.join(output, "SHA256.txt"),
  `${createHash("sha256").update(zip).digest("hex")}  wantio-extension-${version}.zip\n`,
);
for (const file of ["listing.md", "testing.md"])
  fs.copyFileSync(`docs/chrome-web-store/${file}`, path.join(output, file));
console.log(output);
