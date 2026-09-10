export class RequestSizeError extends Error {}
export async function readJson(
  request: Request,
  limit = 20000,
): Promise<unknown> {
  if (Number(request.headers.get("content-length") || 0) > limit)
    throw new RequestSizeError("Request is too large.");
  const reader = request.body?.getReader();
  if (!reader) throw new SyntaxError("Empty request.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new RequestSizeError("Request is too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
