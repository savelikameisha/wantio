import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
export async function authenticatedClient(request?: Request) {
  const bearer = request?.headers.get("authorization");
  if (bearer) {
    if (!bearer.startsWith("Bearer ")) throw new Error("Sign in to continue.");
    const token = bearer.slice(7);
    const client = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      },
    );
    const {
      data: { user },
      error,
    } = await client.auth.getUser(token);
    if (error || !user) throw new Error("Sign in to continue.");
    return { client, user };
  }
  const client = await createClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) throw new Error("Sign in to continue.");
  return { client, user };
}
