import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

export const metadata = {
  title: "Terms of Service | Alchemica",
};

export default function TermsPage() {
  return (
    <>
      <Nav forceSolid />
      <main className="mx-auto max-w-3xl px-6 pb-24 pt-32 lg:px-10 lg:pt-40">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Terms</p>
        <h1 className="mt-2 font-display text-3xl font-medium text-primary">
          Terms of service
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated 26 July 2026.</p>

        <div className="mt-10 flex flex-col gap-8 text-[15px] leading-relaxed text-secondary">
          <section>
            <h2 className="font-display text-lg font-medium text-primary">Who this is</h2>
            <p className="mt-2">
              Alchemica is Axel Rosenvinge&apos;s sole-practice chemistry and materials advisory.
              These terms apply to this website, the client portal, and any advisory engagement
              carried out under the Alchemica name, unless a signed engagement letter or
              statement of work says otherwise for a specific project — in which case that
              document takes precedence.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-medium text-primary">The services</h2>
            <p className="mt-2">
              Alchemica provides chemistry and materials advisory services: reviewing
              formulation data and characterisation results, proposing mechanisms, and
              recommending next experiments. Advice is based on the data, samples, and context
              a client provides, and on Axel&apos;s professional judgement at the time it&apos;s
              given. It is not a guarantee of any particular experimental or commercial
              outcome, and it does not replace a client&apos;s own safety, regulatory, or
              quality assessments before acting on it.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-medium text-primary">Client data & the portal</h2>
            <p className="mt-2">
              Anything a client uploads to the portal — data, files, board cards, decisions —
              remains that client&apos;s own property. Alchemica may use it only to deliver the
              engagement it was shared for. Clients are responsible for having the rights to
              share whatever they upload, and for keeping their own copies — the portal is a
              working tool, not a system of record you should rely on as your only backup.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-medium text-primary">
              Intellectual property
            </h2>
            <p className="mt-2">
              Alchemica&apos;s own methodologies, frameworks, and general chemistry know-how
              remain Alchemica&apos;s, before, during, and after any engagement. Deliverables
              produced specifically for a client under a paid engagement belong to that client
              once invoiced amounts are paid in full, except for Alchemica&apos;s underlying
              general methods, which Alchemica remains free to reuse with other clients.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-medium text-primary">Confidentiality</h2>
            <p className="mt-2">
              Alchemica treats client data, formulations, and results as confidential, and
              won&apos;t share them outside the engagement without permission. Where a signed
              NDA or confidentiality clause exists for a project, its terms govern; otherwise
              this general commitment applies.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-medium text-primary">Fees & payment</h2>
            <p className="mt-2">
              Fees, currency, and payment terms are set out on each invoice. Danish clients are
              invoiced at the standard 25% moms rate; EU business clients are invoiced under the
              reverse-charge mechanism where applicable; clients outside the EU are invoiced
              outside the scope of VAT. Invoices are due by the date stated on them. Late
              payment may pause active work until resolved.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-medium text-primary">
              Liability
            </h2>
            <p className="mt-2">
              To the extent permitted by Danish law, Alchemica&apos;s liability for any
              engagement is limited to the fees paid for that specific engagement, and
              Alchemica isn&apos;t liable for indirect or consequential losses. Nothing here
              limits liability that can&apos;t lawfully be limited, such as liability for
              gross negligence or wilful misconduct.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-medium text-primary">Termination</h2>
            <p className="mt-2">
              Either party can end an engagement with reasonable written notice. Work already
              performed is billed as usual; portal access for a client ends once its engagement
              is offboarded.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-medium text-primary">Governing law</h2>
            <p className="mt-2">
              These terms are governed by Danish law, and any dispute is subject to the
              jurisdiction of the Danish courts, unless a signed engagement letter specifies
              otherwise.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-medium text-primary">Questions</h2>
            <p className="mt-2">
              Email{" "}
              <a
                href="mailto:hello@alchemica.com"
                className="text-accent underline underline-offset-2"
              >
                hello@alchemica.com
              </a>{" "}
              about anything on this page, or see the{" "}
              <a href="/privacy" className="text-accent underline underline-offset-2">
                privacy policy
              </a>{" "}
              for how data is handled.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
