import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { ProjectSubNav } from "@/components/admin/project-sub-nav";

const PROJECT_STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  paused: "bg-amber-100 text-amber-700",
  completed: "bg-muted text-muted-foreground",
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
      <div>
        <Link
          href={`/admin/clients/${orgId}`}
          className="inline-flex items-center gap-2 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft size={16} />
          {orgName}
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-medium text-primary">{project.name}</h1>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              PROJECT_STATUS_STYLES[project.status] ?? PROJECT_STATUS_STYLES.active
            }`}
          >
            {project.status}
          </span>
        </div>
      </div>

      <ProjectSubNav orgId={orgId} projectId={projectId} />

      {children}
    </div>
  );
}
