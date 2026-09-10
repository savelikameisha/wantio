import Link from "next/link";
import { ArrowUpRight, Download } from "lucide-react";
import manifest from "../../../chrome-extension/manifest.json";
export const metadata = {
  title: "Wantio for Chrome",
  description: "Install, connect, and update the Wantio extension.",
};
export default function ExtensionPage() {
  return (
    <main
      data-wantio-workspace
      className="min-h-dvh bg-background text-foreground px-6 py-8"
    >
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-semibold min-h-11"
        >
          <img src="/icon.svg" width="32" height="32" alt="" />
          Wantio
        </Link>
        <p className="mt-16 text-sm text-muted-foreground">WANTIO FOR CHROME</p>
        <h1 className="text-4xl font-semibold tracking-tight mt-3">
          A little home for your next find.
        </h1>
        <p className="mt-5 text-muted-foreground leading-7">
          Open a product, click Wantio, and make it yours. Choose a photo, edit
          the name and price, then save it to your wishlist.
        </p>
        <a
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 min-h-12 font-medium"
          href="https://chromewebstore.google.com/detail/wantio/imblfhjhilgcemgfodeoiolcdibhceah"
        >
          Open Chrome Web Store <ArrowUpRight size={18} />
        </a>
        <section className="mt-12 border-t pt-8">
          <h2 className="text-xl font-semibold">
            Try version {manifest.version}
          </h2>
          <p className="mt-3 text-sm text-muted-foreground leading-6">
            The new version is available as a manual download. The Chrome Web
            Store version is updated separately after review.
          </p>
          <a
            className="inline-flex items-center gap-2 min-h-12 underline underline-offset-4"
            href="/wantio-extension.zip"
            download
          >
            <Download size={16} />
            Download the extension
          </a>
          <ol className="list-decimal pl-5 space-y-3 text-sm leading-6 mt-4">
            <li>Unzip the download into a folder you will keep.</li>
            <li>
              Open <code>chrome://extensions</code> in Chrome and turn on
              Developer mode.
            </li>
            <li>Choose Load unpacked and select the unzipped folder.</li>
            <li>Pin Wantio, open it, and connect your Google account.</li>
          </ol>
          <p className="text-sm text-muted-foreground leading-6 mt-5">
            Already installed manually? Replace the files in the same folder and
            click Reload on the Wantio card in Chrome. Close old Wantio windows
            and open it again. Keep just one copy enabled, so the right
            extension receives your connection.
          </p>
        </section>
        <section className="mt-10 border-t pt-8">
          <h2 className="text-xl font-semibold">Need to reconnect?</h2>
          <p className="text-sm text-muted-foreground leading-6 mt-3">
            Use the same Chrome profile where Wantio is installed. Open a
            product page before clicking the extension; Chrome does not allow it
            to read browser settings or the Web Store.
          </p>
          <Link
            href="/auth/extension"
            className="inline-flex min-h-12 items-center underline underline-offset-4"
          >
            Connect my account
          </Link>
        </section>
        <footer className="mt-12 flex gap-6 text-sm text-muted-foreground">
          <Link className="min-h-11" href="/privacy">
            Privacy
          </Link>
          <a className="min-h-11" href="mailto:saveli.design@gmail.com">
            Get help
          </a>
        </footer>
      </div>
    </main>
  );
}
