import { createClient } from "@/lib/supabase/server";
import { getPortalProjectContext } from "@/lib/portal-context";
import { FilesView } from "@/components/files/files-view";
import { ProjectSwitcher } from "@/components/board/project-switcher";
import { isAxelAdmin } from "@/lib/dal";

const BUCKET = "project-files";

export default async function FilesPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; folder?: string }>;
}) {
  const { project: projectParam, folder } = await searchParams;
  const { projects, project } = await getPortalProjectContext(projectParam);
  const currentFolderId = folder ?? null;

  if (!project) {
    return (
      <div className="flex flex-col gap-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Files</p>
          <h1 className="mt-2 font-display text-2xl font-medium text-primary">Files</h1>
        </div>
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <p className="font-display text-lg font-medium text-primary">No project yet</p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Once your engagement is set up, shared files will show up here.
          </p>
        </div>
      </div>
    );
  }

  const supabase = await createClient();

  const { data: folders } = await supabase
    .from("folders")
    .select("id, name, parent_folder_id")
    .eq("project_id", project.id);

  const { data: files } = await supabase
    .from("files")
    .select("id, filename, size_bytes, version_tag, created_at, storage_path, folder_id")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false });

  const filesWithUrls = await Promise.all(
    (files ?? []).map(async (f) => {
      const { data } = await supabase.storage.from(BUCKET).createSignedUrl(f.storage_path, 3600);
      return { ...f, url: data?.signedUrl ?? null };
    })
  );

  const admin = await isAxelAdmin();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Files</p>
          <h1 className="mt-2 font-display text-2xl font-medium text-primary">{project.name}</h1>
        </div>
        {projects.length > 1 && (
          <ProjectSwitcher projects={projects} current={project.id} basePath="/portal/files" />
        )}
      </div>

      <FilesView
        projectId={project.id}
        folders={folders ?? []}
        files={filesWithUrls}
        currentFolderId={currentFolderId}
        basePath="/portal/files"
        extraQuery={`project=${project.id}`}
        revalidatePaths={["/portal/files"]}
        canManage={admin}
      />
    </div>
  );
}
