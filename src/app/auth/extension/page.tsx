"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Check,
  LoaderCircle,
  MousePointer2,
  ShoppingBag,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type Status = "checking" | "sending" | "success" | "no-session" | "missing";
export default function ExtensionAuthPage() {
  const [status, setStatus] = useState<Status>("checking");
  const [error, setError] = useState("");
  const [opening, setOpening] = useState(false);
  const [version, setVersion] = useState("");
  useEffect(() => {
    let active = true;
    let timeout: ReturnType<typeof setTimeout>;
    const connected = (event: MessageEvent) => {
      if (
        event.source === window &&
        event.origin === location.origin &&
        event.data?.type === "WANTIO_EXTENSION_CONNECTED"
      ) {
        clearTimeout(timeout);
        sessionStorage.removeItem("wantio_ext_token");
        setVersion(
          typeof event.data.version === "string" ? event.data.version : "",
        );
        setStatus("success");
      }
    };
    window.addEventListener("message", connected);
    async function start() {
      const {
        data: { session },
        error,
      } = await createClient().auth.getSession();
      if (!active) return;
      if (error || !session) {
        setStatus("no-session");
        return;
      }
      setStatus("sending");
      sessionStorage.setItem(
        "wantio_ext_token",
        JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
        }),
      );
      timeout = setTimeout(() => {
        sessionStorage.removeItem("wantio_ext_token");
        setStatus("missing");
      }, 18000);
    }
    start().catch(() => {
      if (active) {
        setError("We could not check your account. Please try again.");
        setStatus("no-session");
      }
    });
    return () => {
      active = false;
      clearTimeout(timeout);
      window.removeEventListener("message", connected);
      sessionStorage.removeItem("wantio_ext_token");
    };
  }, []);
  async function login() {
    setOpening(true);
    setError("");
    try {
      const { data, error } = await createClient().auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${location.origin}/auth/callback?next=/auth/extension`,
        },
      });
      if (error || !data.url) throw error || new Error();
      location.assign(data.url);
    } catch {
      setError("Google sign-in did not open. Please try again.");
      setOpening(false);
    }
  }
  const waiting = status === "checking" || status === "sending";
  return (
    <div
      data-wantio-workspace
      className="min-h-dvh bg-background text-foreground flex flex-col"
    >
      <header className="flex items-center justify-between max-w-5xl w-full mx-auto px-6 py-5">
        <Link
          href="/"
          className="inline-flex items-center gap-2 min-h-11 text-base font-semibold"
        >
          <img src="/icon.svg" width="30" height="30" alt="" />
          Wantio
        </Link>
        <Link
          href="/extension"
          className="inline-flex items-center gap-1 min-h-11 text-sm text-muted-foreground"
        >
          Extension help <ArrowUpRight size={15} />
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-6 pb-16">
        <section
          className="max-w-sm w-full"
          aria-live="polite"
          aria-busy={waiting}
        >
          <div className="mb-7 h-14 w-14 flex items-center justify-center rounded-2xl bg-card border border-border/60">
            {status === "success" ? (
              <Check size={26} strokeWidth={1.5} />
            ) : waiting ? (
              <LoaderCircle className="animate-spin" size={24} />
            ) : (
              <img src="/icon.svg" width="38" height="38" alt="" />
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-3 tracking-wide">
            WANTIO FOR CHROME{version ? ` · ${version}` : ""}
          </p>
          <h1 className="text-4xl font-semibold tracking-tight leading-[1.12]">
            {status === "success" ? (
              <>
                Your next find.
                <br />
                One click away.
              </>
            ) : status === "missing" ? (
              <>
                Almost there.
                <br />
                Let’s connect Chrome.
              </>
            ) : waiting ? (
              "Making the connection…"
            ) : (
              <>
                Good finds deserve
                <br />a place to stay.
              </>
            )}
          </h1>
          <p className="text-muted-foreground text-sm leading-6 mt-5">
            {status === "success"
              ? "Your account is connected. You can close this tab and go back to the store."
              : status === "missing"
                ? "We could not find the extension in this browser. Install or update Wantio, then come back here."
                : waiting
                  ? "Keep this tab open for a moment while Wantio connects to your extension."
                  : "Sign in with your usual Google account to connect the Wantio extension."}
          </p>
          {error && (
            <p role="alert" className="text-sm text-destructive mt-4">
              {error}
            </p>
          )}
          {status === "success" && (
            <>
              <div className="mt-8 space-y-4 text-sm">
                <p className="flex items-center gap-3">
                  <ShoppingBag size={18} className="text-muted-foreground" />
                  Open a product you like.
                </p>
                <p className="flex items-center gap-3">
                  <MousePointer2 size={18} className="text-muted-foreground" />
                  Click Wantio in your extensions.
                </p>
              </div>
              <Button asChild className="mt-8 w-full">
                <Link href="/">
                  Open my wishlist <ArrowUpRight size={16} />
                </Link>
              </Button>
            </>
          )}
          {status === "no-session" && (
            <>
              <Button
                className="mt-8 w-full"
                disabled={opening}
                onClick={login}
              >
                {opening ? "Opening Google…" : "Continue with Google"}
                <ArrowUpRight size={16} />
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                Connect in the same Chrome profile where you installed Wantio.
              </p>
            </>
          )}
          {status === "missing" && (
            <div className="mt-8 flex flex-col gap-3">
              <Button asChild>
                <Link href="/extension">
                  Install or update Wantio <ArrowUpRight size={16} />
                </Link>
              </Button>
              <Button variant="outline" onClick={() => location.reload()}>
                Try connecting again
              </Button>
            </div>
          )}
        </section>
      </main>
      <footer className="px-6 pb-6 text-center text-xs text-muted-foreground">
        <Link className="underline underline-offset-4" href="/privacy">
          Privacy
        </Link>
        <span className="mx-3">·</span>Saved for you, shared only when you
        choose.
      </footer>
    </div>
  );
}
