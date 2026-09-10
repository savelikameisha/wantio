import Link from "next/link";
export const metadata = { title: "Privacy · Wantio" };
const sections = [
  [
    "What Wantio stores",
    "When you sign in with Google, Wantio receives account information such as your email, name, and profile image. Your wishlist stores the product links, names, images, prices, currencies, tags, and notes you choose to save. Wantio does not receive your Google password or payment card details.",
  ],
  [
    "What the Chrome extension reads",
    "When you click the extension on a page, it reads that page’s product details and image addresses to prepare a draft. It does not read your browsing history or monitor the pages you visit in the background. Your chosen product details are sent to Wantio when you save. If you choose “Find details from this link”, the link is sent to Wantio to retrieve product information.",
  ],
  [
    "Local storage and drafts",
    "The extension keeps authentication tokens in Chrome’s local extension storage so you can stay connected. It also keeps up to ten recent drafts or save confirmations, separated by account. Drafts older than seven days are removed the next time drafts are accessed. Removing the extension clears its local storage. Signing out of the website does not automatically disconnect the extension.",
  ],
  [
    "Services used to run Wantio",
    "Wantio uses Supabase for authentication and database storage, Google for sign-in, and Vercel for hosting. These services process data needed to provide their functions and may retain operational logs under their own policies. Product images load from their source websites, which receive normal image requests, including your IP address. If AI-assisted product extraction is enabled on the server, public product-page content may also be processed by OpenAI to identify product details.",
  ],
  [
    "Sharing and data use",
    "Wishlist data is used to provide the wishlist and extension features. Public sharing is optional; when enabled, your public wishlist can be viewed by people with the link. Personal notes are excluded from the public wishlist. Wantio does not sell your personal data, use it for advertising, or use it to determine creditworthiness. Wantio’s use and transfer of information received through the extension adheres to the Chrome Web Store User Data Policy, including its Limited Use requirements.",
  ],
  [
    "Retention and your choices",
    "Saved wishlist information remains until it is deleted. You can edit or delete saved items in Wantio and disable public sharing in settings. To request access to or deletion of your account data, contact saveli.design@gmail.com from the email associated with your account. Provider backups and operational logs may remain according to the providers’ retention practices.",
  ],
  [
    "Contact and updates",
    "Wantio is operated by Saveli Kameisha. For privacy questions, contact saveli.design@gmail.com. This page will be updated if the way Wantio handles data changes.",
  ],
];
export default function PrivacyPage() {
  return (
    <main
      data-wantio-workspace
      className="min-h-dvh bg-background text-foreground px-6 py-8"
    >
      <article className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 min-h-11 font-semibold"
        >
          <img src="/icon.svg" alt="" width="32" height="32" />
          Wantio
        </Link>
        <h1 className="mt-16 text-4xl font-semibold tracking-tight">Privacy</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Updated September 10, 2026
        </p>
        {sections.map(([title, body]) => (
          <section className="mt-9" key={title}>
            <h2 className="font-semibold text-xl">{title}</h2>
            <p className="mt-3 text-muted-foreground leading-7">{body}</p>
          </section>
        ))}
        <p className="mt-8 text-sm">
          <a
            className="underline underline-offset-4"
            href="https://developer.chrome.com/docs/webstore/program-policies/limited-use/"
          >
            Chrome Web Store Limited Use policy
          </a>
        </p>
        <Link
          href="/extension"
          className="mt-8 inline-flex min-h-11 items-center underline underline-offset-4"
        >
          Wantio for Chrome
        </Link>
      </article>
    </main>
  );
}
