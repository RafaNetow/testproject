import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProjectSubNav } from "@/components/admin/project-sub-nav";
import { SectionHeader } from "@/components/shared/section-header";

// Always sits on the header's fixed-dark background, regardless of OS
// light/dark mode — see the same pattern in admin/clients/[orgId]/page.tsx.
const PROJECT_STATUS_STYLES_ON_DARK: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-300",
  paused: "bg-amber-500/20 text-amber-300",
  completed: "bg-white/10 text-white/60",
};

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
    <div className="flex flex-col gap-6">
      <SectionHeader
        backLink={{ href: `/admin/clients/${orgId}`, label: orgName }}
        title={project.name}
        titleExtra={
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              PROJECT_STATUS_STYLES_ON_DARK[project.status] ?? PROJECT_STATUS_STYLES_ON_DARK.active
            }`}
          >
            {project.status}
          </span>
        }
      />

      <ProjectSubNav orgId={orgId} projectId={projectId} />

      {children}
    </div>
  );
}
