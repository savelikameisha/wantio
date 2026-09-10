export async function send(type, data = {}) {
  let result;
  try {
    result = await chrome.runtime.sendMessage({ type, ...data });
  } catch {
    throw Object.assign(
      new Error(
        "The extension was updated. Close this window and open it again.",
      ),
      { code: "context" },
    );
  }
  if (result?.error)
    throw Object.assign(new Error(result.error), { code: result.code });
  return result;
}
export const appUrl = "https://wantio.app";
export function webUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}
export function money(price, currency) {
  if (price == null) return "Add a price";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(price);
  } catch {
    return `${price} ${currency}`;
  }
}
export function newerVersion(current, available) {
  const a = current.split(".").map(Number),
    b = (available || current).split(".").map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if ((b[i] || 0) !== (a[i] || 0)) return (b[i] || 0) > (a[i] || 0);
  }
  return false;
}
