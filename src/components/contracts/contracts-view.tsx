"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Add from "@mui/icons-material/Add";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import Download from "@mui/icons-material/Download";
import Draw from "@mui/icons-material/Draw";
import { ConfirmButton } from "@/components/confirm-button";
import { AutoSubmitSelect } from "@/components/board/auto-submit-select";
import { FileInput } from "@/components/shared/file-input";
import { SelectField } from "@/components/shared/select-field";
import { StatusBadge } from "@/components/shared/status-badge";
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

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "partially_signed", label: "Partially signed" },
  { value: "signed", label: "Signed" },
];

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

  const [activeFilter, setActiveFilter] = useState<string>("all");
  const tabs = [
    { value: "all", label: "All", count: contracts.length },
    ...STATUS_OPTIONS.map((s) => ({
      value: s.value,
      label: s.label,
      count: contracts.filter((c) => c.signing_status === s.value).length,
    })),
  ].filter((t) => t.value === "all" || t.count > 0);
  const visibleContracts =
    activeFilter === "all" ? contracts : contracts.filter((c) => c.signing_status === activeFilter);

  return (
    <Stack spacing={3}>
      {canManage && (
        <Paper
          component="form"
          action={createForThisProject}
          variant="outlined"
          sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 1.5, p: 2.5 }}
        >
          <TextField name="title" label="Title" required placeholder="Master Services Agreement" sx={{ flex: 1, minWidth: 200 }} />
          <SelectField name="contract_type" label="Type" defaultValue="msa" sx={{ width: 160 }}>
            <option value="msa">MSA</option>
            <option value="nda">NDA</option>
            <option value="ip_agreement">IP Agreement</option>
            <option value="sow">SOW</option>
          </SelectField>
          <FileInput name="pdf" label="Signed PDF (optional)" accept="application/pdf" />
          <Button type="submit" variant="contained" startIcon={<Add />}>
            Create
          </Button>
        </Paper>
      )}

      {!contracts.length ? (
        <Typography sx={{ fontSize: 14, color: "text.muted" }}>No contracts yet.</Typography>
      ) : (
        <Stack spacing={2}>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, borderBottom: 1, borderColor: "divider", pb: 1.5 }}>
            {tabs.map((tab) => {
              const active = activeFilter === tab.value;
              return (
                <Chip
                  key={tab.value}
                  clickable
                  onClick={() => setActiveFilter(tab.value)}
                  variant={active ? "filled" : "outlined"}
                  label={
                    <>
                      {tab.label}
                      <Box component="span" sx={{ ml: 0.75, fontFamily: "var(--font-mono)", fontSize: 10, opacity: 0.7 }}>
                        {tab.count}
                      </Box>
                    </>
                  }
                  sx={{
                    fontSize: 12,
                    ...(active ? { bgcolor: "navy.main", color: "navy.contrastText", "&:hover": { bgcolor: "navy.dark" } } : {}),
                  }}
                />
              );
            })}
          </Box>

          {!visibleContracts.length ? (
            <Typography sx={{ fontSize: 14, color: "text.muted" }}>No contracts in this view.</Typography>
          ) : (
            <div>
              {visibleContracts.map((c) => {
                const updateThis = updateContractStatus.bind(null, c.id, revalidatePaths);
                const deleteThis = deleteContract.bind(null, c.id, c.signed_pdf_storage_path, revalidatePaths);
                const needsSignature = canManage && c.signing_status === "draft" && !c.documenso_document_id;
                const canSignNow = c.documenso_signing_url && c.signing_status !== "signed";

                return (
                  <Box key={c.id} sx={{ py: 2, borderBottom: 1, borderColor: "divider" }}>
                    <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 1.5 }}>
                      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>
                        <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{c.title}</Typography>
                        <Chip
                          size="small"
                          label={TYPE_LABELS[c.contract_type] ?? c.contract_type}
                          sx={{ height: 22, fontFamily: "var(--font-mono)", fontSize: 12 }}
                        />
                        <StatusBadge status={c.signing_status} />
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {canSignNow && (
                          <Button
                            component="a"
                            href={c.documenso_signing_url!}
                            target="_blank"
                            rel="noreferrer"
                            variant="contained"
                            size="small"
                            startIcon={<Draw />}
                          >
                            Sign now
                          </Button>
                        )}
                        {c.url && (
                          <IconButton
                            component="a"
                            href={c.url}
                            size="small"
                            title="Download PDF"
                            aria-label={`Download "${c.title}" PDF`}
                            sx={{ color: "text.muted", "&:hover": { color: "primary.main" } }}
                          >
                            <Download sx={{ fontSize: 18 }} />
                          </IconButton>
                        )}
                        {canManage && (
                          <>
                            <form action={updateThis}>
                              <AutoSubmitSelect
                                name="signing_status"
                                defaultValue={c.signing_status}
                                options={STATUS_OPTIONS}
                                ariaLabel={`Signing status of "${c.title}"`}
                              />
                            </form>
                            <form action={deleteThis}>
                              <ConfirmButton
                                confirmText={`Delete "${c.title}"? This can't be undone.`}
                                ariaLabel={`Delete contract "${c.title}"`}
                                icon={<DeleteOutlined sx={{ fontSize: 18 }} />}
                              />
                            </form>
                          </>
                        )}
                      </Box>
                    </Box>

                    {needsSignature && (
                      <SendForSignatureForm contractId={c.id} orgId={orgId} revalidatePaths={revalidatePaths} />
                    )}
                  </Box>
                );
              })}
            </div>
          )}
        </Stack>
      )}
    </Stack>
  );
}
