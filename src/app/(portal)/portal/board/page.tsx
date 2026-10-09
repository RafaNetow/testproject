import { createClient } from "@/lib/supabase/server";
import { getPortalProjectContext } from "@/lib/portal-context";
import { BoardView } from "@/components/board/board-view";
import { ProjectSwitcher } from "@/components/board/project-switcher";
import { SectionHeader } from "@/components/shared/section-header";
import { isAxelAdmin } from "@/lib/dal";
import Stack from "@mui/material/Stack";
import { EmptyState } from "@/components/shared/empty-state";

const BUCKET = "project-files";

export default async function BoardPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project: projectParam } = await searchParams;
  const { org, projects, project } = await getPortalProjectContext(projectParam);

  if (!project) {
    return (
      <Stack spacing={4}>
        <SectionHeader eyebrow="Board" title="Board" />
        <EmptyState title="No project yet">
          Once your engagement is set up, its board will show up here.
        </EmptyState>
      </Stack>
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: columns } = await supabase
    .from("board_columns")
    .select("id, name, position")
    .eq("project_id", project.id)
    .order("position");
  const { data: cards } = await supabase
    .from("board_cards")
    .select("id, column_id, title, description, tags, due_date, position")
    .eq("project_id", project.id)
    .order("position");

  const cardIds = (cards ?? []).map((c) => c.id);

  const [{ data: memberships }, { data: admins }, { data: assignees }, { data: comments }, { data: links }, { data: cardFiles }, { data: files }, { data: folders }] =
    await Promise.all([
      supabase
        .from("org_memberships")
        .select("user_id, profiles(full_name)")
        .eq("org_id", org!.id)
        .not("user_id", "is", null),
      supabase.from("profiles").select("id, full_name").eq("platform_role", "axel_admin"),
      cardIds.length
        ? supabase.from("board_card_assignees").select("card_id, profile_id").in("card_id", cardIds)
        : Promise.resolve({ data: [] }),
      cardIds.length
        ? supabase
            .from("board_card_comments")
            .select("id, card_id, author_id, body, created_at, parent_comment_id")
            .in("card_id", cardIds)
            .order("created_at")
        : Promise.resolve({ data: [] }),
      cardIds.length
        ? supabase.from("board_card_links").select("id, card_id, url, label").in("card_id", cardIds)
        : Promise.resolve({ data: [] }),
      cardIds.length
        ? supabase.from("board_card_files").select("card_id, file_id").in("card_id", cardIds)
        : Promise.resolve({ data: [] }),
      supabase
        .from("files")
        .select("id, filename, folder_id, storage_path, mime_type")
        .eq("project_id", project.id),
      supabase.from("folders").select("id, name").eq("project_id", project.id),
    ]);

  const orgMembers = (memberships ?? []).map((m) => ({
    id: m.user_id as string,
    full_name: (m.profiles as unknown as { full_name: string | null } | null)?.full_name ?? null,
  }));
  const memberIds = new Set(orgMembers.map((m) => m.id));
  const members = [
    ...orgMembers,
    ...(admins ?? []).filter((a) => !memberIds.has(a.id)),
  ];

  const projectFiles = await Promise.all(
    (files ?? []).map(async (f) => {
      const { data } = await supabase.storage.from(BUCKET).createSignedUrl(f.storage_path, 3600);
      return {
        id: f.id,
        filename: f.filename,
        folder_id: f.folder_id,
        mime_type: f.mime_type,
        url: data?.signedUrl ?? null,
      };
    })
  );

  const canDelete = await isAxelAdmin();

  return (
    <Stack spacing={4}>
      <SectionHeader
        eyebrow="Board"
        title={project.name}
        actions={
          projects.length > 1 ? (
            <ProjectSwitcher projects={projects} current={project.id} basePath="/portal/board" />
          ) : undefined
        }
      />

      <BoardView
        projectId={project.id}
        filesBaseUrl={`/portal/files?project=${project.id}`}
        folders={folders ?? []}
        columns={columns ?? []}
        cards={cards ?? []}
        members={members}
        assignees={assignees ?? []}
        comments={comments ?? []}
        links={links ?? []}
        cardFiles={cardFiles ?? []}
        projectFiles={projectFiles}
        currentUserId={user?.id ?? ""}
        revalidatePaths={["/portal/board"]}
        canDelete={canDelete}
      />
    </Stack>
  );
}
