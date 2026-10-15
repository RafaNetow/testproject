import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { requireAxelAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildDigest, digestIsWorthSending, renderDigest } from "@/lib/digest";
import { SectionHeader } from "@/components/shared/section-header";
import { EmptyState } from "@/components/shared/empty-state";
import { LinkBox } from "@/components/shared/link-box";

/**
 * Admin-only preview of the Monday digest for any client member — so the
 * email can be checked locally without sending it.
 */
export default async function DigestPreviewPage({ searchParams }: { searchParams: Promise<{ user?: string }> }) {
  await requireAxelAdmin();
  const { user } = await searchParams;

  const supabase = await createClient();
  const { data: members } = await supabase
    .from("org_memberships")
    .select("user_id, invited_email, organizations(name)")
    .not("user_id", "is", null)
    .not("accepted_at", "is", null)
    .order("invited_email");
  const list = (members ?? []).map((m) => ({
    id: m.user_id as string,
    email: m.invited_email as string,
    org: (m.organizations as unknown as { name: string } | null)?.name ?? "",
  }));
  const selected = list.find((m) => m.id === user) ?? list[0];

  const data = selected ? await buildDigest(createAdminClient(), selected.id) : null;
  const email = data ? renderDigest(data) : null;

  return (
    <Stack spacing={3}>
      <SectionHeader
        eyebrow="Weekly digest"
        title="Email preview"
        subtitle="What each client receives on Monday morning. Nothing is sent from this page."
      />

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {list.map((m) => (
          <LinkBox
            key={m.id}
            href={`/admin/digest-preview?user=${m.id}`}
            sx={{
              px: 1.5,
              py: 0.75,
              borderRadius: 999,
              border: "1px solid",
              borderColor: m.id === selected?.id ? "text.primary" : "rgb(145 158 171 / 0.32)",
              bgcolor: m.id === selected?.id ? "text.primary" : "transparent",
              color: m.id === selected?.id ? "background.paper" : "text.secondary",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            {m.email} · {m.org}
          </LinkBox>
        ))}
      </Box>

      {!email ? (
        <EmptyState title="No client members yet">Invite someone to a client workspace to preview their digest.</EmptyState>
      ) : (
        <Paper variant="outlined" sx={{ overflow: "hidden" }}>
          <Box sx={{ px: 3, py: 2, borderBottom: "1px dashed var(--border-dashed)" }}>
            <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
              To {selected?.email} · {data && digestIsWorthSending(data) ? "would be sent" : "would be skipped (nothing to report)"}
            </Typography>
            <Typography sx={{ mt: 0.5, fontSize: 15, fontWeight: 700 }}>{email.subject}</Typography>
          </Box>
          <Box component="iframe" title="Digest email preview" srcDoc={email.html} sx={{ display: "block", width: "100%", height: 900, border: 0, bgcolor: "#f4f6f8" }} />
        </Paper>
      )}
    </Stack>
  );
}
