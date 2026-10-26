import { getPortalProjectContext } from "@/lib/portal-context";
import { loadFilesData } from "@/lib/files-data";
import { FilesView } from "@/components/files/files-view";
import { ProjectSwitcher } from "@/components/board/project-switcher";
import { SectionHeader } from "@/components/shared/section-header";
import { isAxelAdmin } from "@/lib/dal";
import Stack from "@mui/material/Stack";
import { EmptyState } from "@/components/shared/empty-state";

export default async function FilesPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; folder?: string; technique?: string; file?: string }>;
}) {
  const { project: projectParam, folder, technique, file } = await searchParams;
  const { projects, project } = await getPortalProjectContext(projectParam);

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

  const [data, admin] = await Promise.all([loadFilesData(project.id), isAxelAdmin()]);

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
        {...data}
        currentFolderId={folder ?? null}
        technique={technique ?? null}
        openFileId={file ?? null}
        basePath="/portal/files"
        extraQuery={`project=${project.id}`}
        revalidatePaths={["/portal/files"]}
        canManage={admin}
      />
    </Stack>
  );
}
