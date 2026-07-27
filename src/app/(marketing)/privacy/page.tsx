import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

export const metadata = {
  title: "Privacy Policy | Alchemica",
};

export default function PrivacyPage() {
  return (
    <>
      <Nav forceSolid />
      <main className="mx-auto max-w-3xl px-6 pb-24 pt-32 lg:px-10 lg:pt-40">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
          Privacy
        </p>
        <h1 className="mt-2 font-display text-3xl font-medium text-primary">
          Privacy &amp; data handling
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Last updated 25 July 2026.
        </p>

        <div className="mt-10 flex flex-col gap-8 text-[15px] leading-relaxed text-secondary">
          <section>
            <h2 className="font-display text-lg font-medium text-primary">
              What this covers
            </h2>
            <p className="mt-2">
              This page explains what Alchemica collects when you visit this
              site, use the client portal, or send us a message — and what we
              do with it. Alchemica is Axel Rosenvinge&apos;s sole-practice
              advisory, so Axel is the person responsible for the data
              described here.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-medium text-primary">
              What we collect
            </h2>
            <ul className="mt-2 flex flex-col gap-2">
              <li>
                <strong className="text-primary">Your email address</strong> —
                to send you a one-time sign-in link, or to reply if you use
                the contact form.
              </li>
              <li>
                <strong className="text-primary">Contact form messages</strong>{" "}
                — whatever you write to us, sent to Axel&apos;s inbox.
              </li>
              <li>
                <strong className="text-primary">Project data you add to the portal</strong>{" "}
                — board cards, logged decisions, and files you or your team
                upload for an active engagement.
              </li>
              <li>
                <strong className="text-primary">Basic account info</strong> —
                your name if you provide one, and which organisation you
                belong to.
              </li>
            </ul>
            <p className="mt-2">
              We don&apos;t collect payment details, and we don&apos;t run
              analytics or advertising trackers on this site.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-medium text-primary">
              Where it&apos;s stored
            </h2>
            <p className="mt-2">
              Portal data and uploaded files are stored with Supabase
              (database and file storage), the site itself runs on Vercel,
              and emails are sent through Resend. These are the only outside
              services with access to any of this data, and each only sees
              what it needs to do its job — Resend sees an email address and
              message content when sending mail, for example, not your
              project files.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-medium text-primary">
              Who can see your data
            </h2>
            <p className="mt-2">
              Your organisation&apos;s data is only visible to people invited
              into that organisation, and to Axel as the practice&apos;s
              administrator. This is enforced at the database level, not
              just hidden in the interface — one client organisation cannot
              read another&apos;s records, projects, or files under any
              circumstance the application permits.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-medium text-primary">
              Cookies
            </h2>
            <p className="mt-2">
              This site uses one kind of cookie: a session cookie set when
              you sign in, so the portal knows it&apos;s you on your next
              request. It&apos;s strictly necessary for sign-in to work at
              all — there&apos;s no tracking, advertising, or analytics
              cookie anywhere on this site.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-medium text-primary">
              How long we keep it
            </h2>
            <p className="mt-2">
              We keep project data for as long as your engagement is active,
              plus a reasonable period afterward in case it&apos;s needed
              again. If you&apos;d like your organisation&apos;s data deleted
              sooner, just ask — see contact details below.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-medium text-primary">
              Your rights
            </h2>
            <p className="mt-2">
              You can ask to see what we hold about you, correct it, or have
              it deleted, at any time. Reach out using the email address
              below and we&apos;ll handle it directly.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-medium text-primary">
              Questions
            </h2>
            <p className="mt-2">
              Email{" "}
              <a
                href="mailto:hello@alchemica.dk"
                className="text-accent underline underline-offset-2"
              >
                hello@alchemica.dk
              </a>{" "}
              with anything about this page or your data.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
