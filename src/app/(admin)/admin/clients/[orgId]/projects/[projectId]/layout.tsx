import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProjectSubNav } from "@/components/admin/project-sub-nav";
import { SectionHeader } from "@/components/shared/section-header";
import { StatusBadge } from "@/components/shared/status-badge";
import Stack from "@mui/material/Stack";

export default async function ProjectLayout({
  params,
  children,
}: {
  params: Promise<{ orgId: string; projectId: string }>;
  children: React.ReactNode;
}) {
  const { orgId, projectId } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, org_id, status, organizations(name)")
    .eq("id", projectId)
    .maybeSingle();
  if (!project || project.org_id !== orgId) notFound();

  const orgName = (project.organizations as unknown as { name: string } | null)?.name ?? "Client";

  return (
    <Stack spacing={3}>
      <SectionHeader
        backLink={{ href: `/admin/clients/${orgId}`, label: orgName }}
        title={project.name}
        titleExtra={<StatusBadge status={project.status} tone="dark" />}
      />

      <ProjectSubNav orgId={orgId} projectId={projectId} />

      {children}
    </Stack>
  );
}
