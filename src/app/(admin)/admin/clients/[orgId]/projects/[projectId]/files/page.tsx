import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { FilesView } from "@/components/files/files-view";

const BUCKET = "project-files";

export default async function AdminProjectFilesPage({
  params,
}: {
  params: Promise<{ orgId: string; projectId: string }>;
}) {
  const { orgId, projectId } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, org_id")
    .eq("id", projectId)
    .maybeSingle();
  if (!project || project.org_id !== orgId) notFound();

  const { data: files } = await supabase
    .from("files")
    .select("id, filename, size_bytes, version_tag, created_at, storage_path")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  const filesWithUrls = await Promise.all(
    (files ?? []).map(async (f) => {
      const { data } = await supabase.storage.from(BUCKET).createSignedUrl(f.storage_path, 3600);
      return { ...f, url: data?.signedUrl ?? null };
    })
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link
          href={`/admin/clients/${orgId}`}
          className="inline-flex items-center gap-2 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft size={16} />
          Back to client
        </Link>
        <p className="mt-3 font-mono text-xs uppercase tracking-[0.2em] text-accent">Files</p>
        <h1 className="mt-2 font-display text-2xl font-medium text-primary">{project.name}</h1>
      </div>

      <FilesView
        projectId={projectId}
        files={filesWithUrls}
        revalidatePaths={[`/admin/clients/${orgId}/projects/${projectId}/files`]}
        canDelete
      />
    </div>
  );
}
