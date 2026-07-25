import { ArrowRight, Plus, Trash } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { ConfirmButton } from "@/components/confirm-button";
import { AutoSubmitSelect } from "@/components/board/auto-submit-select";
import {
  createProspect,
  updateProspectStage,
  deleteProspect,
  convertProspectToClient,
} from "@/lib/actions/prospects";

const STAGES = [
  { value: "lead", label: "Lead" },
  { value: "contacted", label: "Contacted" },
  { value: "proposal", label: "Proposal" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
] as const;

function formatValue(cents: number | null) {
  if (!cents) return null;
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "DKK" }).format(
    cents / 100
  );
}

export default async function ProspectsPage() {
  const supabase = await createClient();
  const { data: prospects } = await supabase
    .from("prospects")
    .select("id, company_name, contact_name, contact_email, stage, estimated_value_cents, notes")
    .order("created_at", { ascending: false });

  const byStage = (stage: string) => (prospects ?? []).filter((p) => p.stage === stage);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Prospects</p>
        <h1 className="mt-2 font-display text-2xl font-medium text-primary">Sales pipeline</h1>
      </div>

      <form
        action={createProspect}
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-5"
      >
        <div className="flex min-w-[180px] flex-1 flex-col gap-1.5">
          <label htmlFor="company-name" className="text-sm font-medium text-secondary">
            Company
          </label>
          <input
            id="company-name"
            name="company_name"
            required
            placeholder="Acme Materials"
            className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent"
          />
        </div>
        <div className="flex min-w-[160px] flex-1 flex-col gap-1.5">
          <label htmlFor="contact-name" className="text-sm font-medium text-secondary">
            Contact name
          </label>
          <input
            id="contact-name"
            name="contact_name"
            placeholder="Jane Doe"
            className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent"
          />
        </div>
        <div className="flex min-w-[180px] flex-1 flex-col gap-1.5">
          <label htmlFor="contact-email" className="text-sm font-medium text-secondary">
            Contact email
          </label>
          <input
            id="contact-email"
            name="contact_email"
            type="email"
            placeholder="jane@acme.com"
            className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent"
          />
        </div>
        <div className="flex w-32 flex-col gap-1.5">
          <label htmlFor="estimated-value" className="text-sm font-medium text-secondary">
            Est. value
          </label>
          <input
            id="estimated-value"
            name="estimated_value"
            type="number"
            min={0}
            placeholder="50000"
            className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent"
          />
        </div>
        <button
          type="submit"
          className="btn-primary inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium"
        >
          <Plus size={16} weight="bold" />
          Add prospect
        </button>
      </form>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {STAGES.map((stage) => (
          <div
            key={stage.value}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-medium text-primary">{stage.label}</h3>
              <span className="font-mono text-xs text-muted-foreground">
                {byStage(stage.value).length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {byStage(stage.value).map((p) => {
                const updateThis = updateProspectStage.bind(null, p.id);
                const deleteThis = deleteProspect.bind(null, p.id);
                const convertThis = convertProspectToClient.bind(null, p.id);
                const value = formatValue(p.estimated_value_cents);
                return (
                  <div key={p.id} className="rounded-lg border border-border bg-background p-3">
                    <p className="text-sm font-medium text-primary">{p.company_name}</p>
                    {(p.contact_name || p.contact_email) && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {p.contact_name}
                        {p.contact_name && p.contact_email ? " · " : ""}
                        {p.contact_email}
                      </p>
                    )}
                    {value && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{value}</p>
                    )}
                    {stage.value === "won" && (
                      <form action={convertThis} className="mt-2">
                        <ConfirmButton
                          confirmText={`Create a client workspace for "${p.company_name}"?`}
                          ariaLabel={`Convert ${p.company_name} to a client`}
                          className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
                        >
                          Convert to client
                          <ArrowRight size={12} weight="bold" />
                        </ConfirmButton>
                      </form>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <form action={updateThis} className="flex-1">
                        <AutoSubmitSelect
                          name="stage"
                          defaultValue={p.stage}
                          options={STAGES.map((s) => ({ value: s.value, label: s.label }))}
                          className="w-full rounded-md border border-border bg-card px-2 py-1.5 text-xs text-primary outline-none transition-colors focus:border-accent"
                        />
                      </form>
                      <form action={deleteThis}>
                        <ConfirmButton
                          confirmText={`Delete "${p.company_name}" from the pipeline?`}
                          ariaLabel={`Delete prospect ${p.company_name}`}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash size={13} />
                        </ConfirmButton>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
