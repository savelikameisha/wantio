import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DesignLibrary } from "@/components/design-library";

export const metadata: Metadata = {
  title: "Design library · Wantio",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function DesignPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  // Authorize using the verified, immutable account ID, never editable metadata.
  const ownerId = process.env.WANTIO_ADMIN_USER_ID?.trim();
  if (error || !ownerId || !user || user.id !== ownerId) notFound();
  return <DesignLibrary />;
}
