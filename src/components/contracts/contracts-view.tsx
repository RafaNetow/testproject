"use client";

import { useState } from "react";
import { DownloadSimple, PenNib, Plus, Trash } from "@phosphor-icons/react/dist/ssr";
import { ConfirmButton } from "@/components/confirm-button";
import { AutoSubmitSelect } from "@/components/board/auto-submit-select";
import { createContract, updateContractStatus, deleteContract } from "@/lib/actions/contracts";
import { SendForSignatureForm } from "./send-for-signature-form";

type Contract = {
  id: string;
  title: string;
  contract_type: string;
  signing_status: string;
  signed_pdf_storage_path: string | null;
  documenso_document_id: string | null;
  documenso_signing_url: string | null;
  url: string | null;
};

const TYPE_LABELS: Record<string, string> = {
  msa: "MSA",
  nda: "NDA",
  ip_agreement: "IP Agreement",
  sow: "SOW",
};

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-accent/10 text-accent",
  partially_signed: "bg-amber-100 text-amber-700",
  signed: "bg-emerald-100 text-emerald-700",
};

export function ContractsView({
  orgId,
  projectId,
  contracts,
  revalidatePaths,
  canManage,
}: {
  orgId: string;
  projectId: string;
  contracts: Contract[];
  revalidatePaths: string[];
  canManage: boolean;
}) {
  const createForThisProject = createContract.bind(null, orgId, projectId, revalidatePaths);
  const statusOptions = [
    { value: "draft", label: "Draft" },
    { value: "sent", label: "Sent" },
    { value: "partially_signed", label: "Partially signed" },
    { value: "signed", label: "Signed" },
  ];

  const [activeFilter, setActiveFilter] = useState<string>("all");
  const tabs = [
    { value: "all", label: "All", count: contracts.length },
    ...statusOptions.map((s) => ({
      value: s.value,
      label: s.label,
      count: contracts.filter((c) => c.signing_status === s.value).length,
    })),
  ].filter((t) => t.value === "all" || t.count > 0);
  const visibleContracts =
    activeFilter === "all" ? contracts : contracts.filter((c) => c.signing_status === activeFilter);

  return (
    <div className="flex flex-col gap-6">
      {canManage && (
        <form
          action={createForThisProject}
          className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-5"
        >
          <div className="flex min-w-[200px] flex-1 flex-col gap-1.5">
            <label htmlFor="contract-title" className="text-sm font-medium text-secondary">
              Title
            </label>
            <input
              id="contract-title"
              name="title"
              required
              placeholder="Master Services Agreement"
              className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="contract-type" className="text-sm font-medium text-secondary">
              Type
            </label>
            <select
              id="contract-type"
              name="contract_type"
              defaultValue="msa"
              className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none transition-colors focus:border-accent"
            >
              <option value="msa">MSA</option>
              <option value="nda">NDA</option>
              <option value="ip_agreement">IP Agreement</option>
              <option value="sow">SOW</option>
            </select>
          </div>
          <div className="flex min-w-[180px] flex-1 flex-col gap-1.5">
            <label htmlFor="contract-pdf" className="text-sm font-medium text-secondary">
              Signed PDF (optional)
            </label>
            <input
              id="contract-pdf"
              name="pdf"
              type="file"
              accept="application/pdf"
              className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-primary outline-none transition-colors file:mr-3 file:rounded-full file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-secondary focus:border-accent"
            />
          </div>
          <button
            type="submit"
            className="btn-primary inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium"
          >
            <Plus size={16} weight="bold" />
            Create
          </button>
        </form>
      )}

      {!contracts.length ? (
        <p className="text-sm text-muted-foreground">No contracts yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-1.5 border-b border-border pb-3">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveFilter(tab.value)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  activeFilter === tab.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-primary"
                }`}
              >
                {tab.label}
                <span
                  className={`font-mono text-[10px] ${
                    activeFilter === tab.value ? "text-primary-foreground/70" : "text-muted-foreground"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {!visibleContracts.length ? (
            <p className="text-sm text-muted-foreground">No contracts in this view.</p>
          ) : (
            <div className="divide-y divide-border">
              {visibleContracts.map((c) => {
            const updateThis = updateContractStatus.bind(null, c.id, revalidatePaths);
            const deleteThis = deleteContract.bind(
              null,
              c.id,
              c.signed_pdf_storage_path,
              revalidatePaths
            );
            const needsSignature =
              canManage && c.signing_status === "draft" && !c.documenso_document_id;
            const canSignNow = c.documenso_signing_url && c.signing_status !== "signed";

            return (
              <div key={c.id} className="py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-primary">{c.title}</p>
                      <span className="rounded-full bg-muted px-2.5 py-0.5 font-mono text-xs text-muted-foreground">
                        {TYPE_LABELS[c.contract_type] ?? c.contract_type}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          STATUS_STYLES[c.signing_status] ?? STATUS_STYLES.draft
                        }`}
                      >
                        {c.signing_status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {canSignNow && (
                      <a
                        href={c.documenso_signing_url!}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
                      >
                        <PenNib size={13} weight="bold" />
                        Sign now
                      </a>
                    )}
                    {c.url && (
                      <a
                        href={c.url}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-accent"
                        title="Download PDF"
                        aria-label={`Download "${c.title}" PDF`}
                      >
                        <DownloadSimple size={16} />
                      </a>
                    )}
                    {canManage && (
                      <>
                        <form action={updateThis}>
                          <AutoSubmitSelect
                            name="signing_status"
                            defaultValue={c.signing_status}
                            options={statusOptions}
                            className="rounded-md border border-border bg-background px-2 py-1.5 text-xs text-primary outline-none transition-colors focus:border-accent"
                          />
                        </form>
                        <form action={deleteThis}>
                          <ConfirmButton
                            confirmText={`Delete "${c.title}"? This can't be undone.`}
                            ariaLabel={`Delete contract "${c.title}"`}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash size={15} />
                          </ConfirmButton>
                        </form>
                      </>
                    )}
                  </div>
                </div>

                {needsSignature && (
                  <SendForSignatureForm
                    contractId={c.id}
                    orgId={orgId}
                    revalidatePaths={revalidatePaths}
                  />
                )}
              </div>
            );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
