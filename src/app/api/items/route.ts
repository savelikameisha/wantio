import { readJson, RequestSizeError } from "@/lib/server/request";
import { NextResponse } from "next/server";
import { authenticatedClient } from "@/lib/server/auth";
import { saveItem } from "@/lib/server/items";
import { itemSchema } from "@/lib/validation";
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
    if (Number(request.headers.get("content-length") || 0) > 20000)
      return NextResponse.json(
        { error: "Request is too large." },
        { status: 413 },
      );
    const input = itemSchema.safeParse(await readJson(request));
    if (!input.success)
      return NextResponse.json(
        { error: input.error.issues[0].message },
        { status: 400 },
      );
    const id = await saveItem(client, input.data, true);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    if (error instanceof RequestSizeError)
      return NextResponse.json({ error: error.message }, { status: 413 });
    return NextResponse.json(
      {
        error:
          error instanceof SyntaxError
            ? "Invalid request."
            : "Could not save this item. Try again.",
      },
      { status: error instanceof SyntaxError ? 400 : 500 },
    );
  }
}
