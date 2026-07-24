import { Reveal } from "@/components/reveal";
import { SectionHeader } from "@/components/section-header";

const FEATURES = [
  {
    title: "One live board",
    detail: "The status of every workstream, visible at a glance.",
  },
  {
    title: "Decisions, logged",
    detail: "Every agreement written down, with who approved it.",
  },
  {
    title: "Files with history",
    detail: "Reports and datasets in one place, versioned.",
  },
];

const NAV_ITEMS = ["Summary", "Board", "Files", "Decisions"];

const KPIS = [
  { label: "Open items", value: "4" },
  { label: "Decisions", value: "12" },
  { label: "Files", value: "28" },
];

/**
 * The client-portal selling point as a "product moment": feature ledger on
 * the left, a stylised CSS-built portal vignette on the right. The vignette
 * is deliberately abstract (generic labels, no client data) — it shows the
 * shape of the working experience, not a fabricated engagement.
 */
export function PortalShowcase() {
  return (
    <section id="portal" className="bg-primary py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <SectionHeader
              dark
              index="03"
              label="The client portal"
              title="You see the work as it happens."
            />
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-white/55">
              Every engagement runs in a dedicated portal — one place for the
              work, instead of scattered across email.
            </p>
            <div className="mt-10 border-t border-white/10">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="grid grid-cols-1 gap-1 border-b border-white/10 py-5 sm:grid-cols-[11rem_1fr] sm:gap-6"
                >
                  <h3 className="font-display text-lg font-medium leading-tight text-white">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-white/55">
                    {feature.detail}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="relative" aria-hidden="true">
              <div className="absolute -inset-8 rounded-[2rem] bg-accent/15 blur-3xl" />
              <div className="relative overflow-hidden rounded-2xl bg-card shadow-2xl ring-1 ring-white/10">
                <div className="flex items-center gap-1.5 border-b border-border bg-muted px-4 py-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-border" />
                  <span className="h-2.5 w-2.5 rounded-full bg-border" />
                  <span className="h-2.5 w-2.5 rounded-full bg-border" />
                  <span className="ml-3 flex-1 rounded-full bg-card px-3 py-1 font-mono text-[10px] text-muted-foreground">
                    alchemica.com/portal
                  </span>
                </div>
                <div className="flex">
                  <div className="hidden w-36 shrink-0 border-r border-border p-4 sm:block">
                    <p className="font-display text-sm text-primary">Alchemica</p>
                    <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground">
                      Client portal
                    </p>
                    <div className="mt-4 flex flex-col gap-1">
                      {NAV_ITEMS.map((item, i) => (
                        <span
                          key={item}
                          className={`rounded-md px-2 py-1.5 text-[11px] ${
                            i === 0
                              ? "bg-accent/10 font-medium text-accent"
                              : "text-secondary"
                          }`}
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 p-4 sm:p-5">
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-accent">
                      Executive summary
                    </p>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {KPIS.map((kpi) => (
                        <div
                          key={kpi.label}
                          className="rounded-lg border border-border p-2.5"
                        >
                          <p className="text-[9px] text-muted-foreground">
                            {kpi.label}
                          </p>
                          <p className="mt-0.5 font-display text-lg font-medium text-primary">
                            {kpi.value}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 rounded-lg border border-border p-3">
                      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                        Latest decision
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                        <p className="text-xs font-medium text-primary">
                          Crosslinker swap approved
                        </p>
                        <span className="ml-auto text-[10px] text-muted-foreground">
                          Tue
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2 rounded-lg border border-border p-3">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-secondary/40" />
                      <p className="text-xs text-primary">TGA-batch-07.pdf</p>
                      <span className="ml-auto rounded-full bg-muted px-2 py-0.5 font-mono text-[9px] text-muted-foreground">
                        v3
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-5 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                Included with every engagement
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
