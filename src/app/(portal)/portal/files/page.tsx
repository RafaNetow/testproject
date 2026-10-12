import { createClient } from "@/lib/supabase/server";
import { getPortalProjectContext } from "@/lib/portal-context";
import { FilesView } from "@/components/files/files-view";
import { ProjectSwitcher } from "@/components/board/project-switcher";
import { SectionHeader } from "@/components/shared/section-header";
import { isAxelAdmin } from "@/lib/dal";
import Stack from "@mui/material/Stack";
import { EmptyState } from "@/components/shared/empty-state";

const BUCKET = "project-files";

export default async function FilesPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; folder?: string; technique?: string }>;
}) {
  const { project: projectParam, folder, technique } = await searchParams;
  const { projects, project } = await getPortalProjectContext(projectParam);
  const currentFolderId = folder ?? null;

  if (!project) {
    return (
      <Stack spacing={4}>
        <SectionHeader eyebrow="Files" title="Files" />
        <EmptyState title="No project yet">
          Once your engagement is set up, shared files will show up here.
        </EmptyState>
      </Stack>
    );
  }

  const supabase = await createClient();

  const { data: folders } = await supabase
    .from("folders")
    .select("id, name, parent_folder_id")
    .eq("project_id", project.id);

  const { data: files } = await supabase
    .from("files")
    .select("id, filename, size_bytes, version_tag, created_at, storage_path, folder_id, mime_type, technique")
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
    <Stack spacing={4}>
      <SectionHeader
        eyebrow="Files"
        title={project.name}
        actions={
          projects.length > 1 ? (
            <ProjectSwitcher projects={projects} current={project.id} basePath="/portal/files" />
          ) : undefined
        }
      />

      <FilesView
        projectId={project.id}
        folders={folders ?? []}
        files={filesWithUrls}
        currentFolderId={currentFolderId}
        technique={technique ?? null}
        basePath="/portal/files"
        extraQuery={`project=${project.id}`}
        revalidatePaths={["/portal/files"]}
        canManage={admin}
      />
    </Stack>
  );
}
