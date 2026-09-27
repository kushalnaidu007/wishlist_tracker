import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Wishpri",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto max-w-2xl px-4 py-4 sm:px-6">
          <Link href="/" className="font-sans text-xl font-bold tracking-tight">
            Wishpri
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Legal
        </p>
        <h1 className="mt-1 font-heading text-3xl tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated September 26, 2026.</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-foreground">
          <section>
            <h2 className="font-heading text-lg tracking-tight">What Wishpri is</h2>
            <p className="mt-2 text-muted-foreground">
              Wishpri is a personal and group wishlist tracker — it helps you
              see what you can actually afford against your real balance,
              alone or pooled with a group. This policy explains what
              information the app collects, how it&apos;s used, and who it&apos;s
              shared with.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg tracking-tight">Information we collect</h2>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-muted-foreground">
              <li>
                <span className="text-foreground">Account information</span> —
                your email and password, handled by Supabase Auth (we never
                see or store your password ourselves), and a display name —
                either set automatically from your email or chosen by you —
                shown to anyone you share a group with instead of your email.
              </li>
              <li>
                <span className="text-foreground">Wishlist data</span> — the
                items you add: name, cost, priority, status, and an optional
                link to where you found it, along with your monthly balance
                entries.
              </li>
              <li>
                <span className="text-foreground">Group data</span> — if you
                create or join a group, your membership, role, the group&apos;s
                shared balance entries, and any contributions you record are
                visible to other members of that group.
              </li>
              <li>
                <span className="text-foreground">Feedback</span> — if you use
                the in-app feedback form, we store your ratings and any
                comments you write, tied to your account.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-lg tracking-tight">How we use it</h2>
            <p className="mt-2 text-muted-foreground">
              Everything above exists to run the app&apos;s core feature:
              comparing what you want against what you can afford, personally
              or pooled with a group. We don&apos;t sell your data, and we don&apos;t
              use it for advertising.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg tracking-tight">Third parties</h2>
            <p className="mt-2 text-muted-foreground">
              <span className="text-foreground">Supabase</span> stores and
              hosts all app data (accounts, wishlist items, balances, groups)
              on our behalf.
            </p>
            <p className="mt-2 text-muted-foreground">
              <span className="text-foreground">Product links</span> — if you
              add a link to where an item can be bought, clicking it takes you
              to that retailer&apos;s own website, governed by their own privacy
              policy; Wishpri has no visibility into what happens there.
              Wishpri may participate in affiliate programs (such as Amazon
              Associates) and could earn a commission on qualifying purchases
              made through these links, at no extra cost to you.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg tracking-tight">Cookies</h2>
            <p className="mt-2 text-muted-foreground">
              Wishpri uses one cookie, set by Supabase, to keep you signed in.
              We don&apos;t use advertising or analytics cookies, and no
              analytics tools are integrated into the app.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg tracking-tight">Data retention &amp; deletion</h2>
            <p className="mt-2 text-muted-foreground">
              Your data stays in the app for as long as your account exists.
              There&apos;s currently no self-serve way to delete your account —
              email us at{" "}
              <a href="mailto:hello@wishpri.com" className="text-foreground underline underline-offset-2">
                hello@wishpri.com
              </a>{" "}
              to request deletion, and we&apos;ll remove your account and its
              associated data.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg tracking-tight">Children</h2>
            <p className="mt-2 text-muted-foreground">
              Wishpri isn&apos;t directed at children under 13, and we don&apos;t
              knowingly collect information from them.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg tracking-tight">Changes to this policy</h2>
            <p className="mt-2 text-muted-foreground">
              If this policy changes, we&apos;ll update the date at the top of
              this page.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg tracking-tight">Contact</h2>
            <p className="mt-2 text-muted-foreground">
              Questions about this policy? Reach out at{" "}
              <a href="mailto:hello@wishpri.com" className="text-foreground underline underline-offset-2">
                hello@wishpri.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
