import Stack from "@mui/material/Stack";
import { createClient } from "@/lib/supabase/server";
import { getPortalProjectContext } from "@/lib/portal-context";
import { requireSessionUser, isAxelAdmin } from "@/lib/dal";
import { loadThread } from "@/lib/messages";
import { MessageThread } from "@/components/messages/message-thread";
import { ProjectSwitcher } from "@/components/board/project-switcher";
import { SectionHeader } from "@/components/shared/section-header";
import { EmptyState } from "@/components/shared/empty-state";

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const { project: projectParam } = await searchParams;
  const { projects, project } = await getPortalProjectContext(projectParam);

  if (!project) {
    return (
      <Stack spacing={4}>
        <SectionHeader eyebrow="Messages" title="Messages" />
        <EmptyState title="No project yet">Once your engagement is set up, you can message Axel here.</EmptyState>
      </Stack>
    );
  }

  const [user, admin, supabase] = await Promise.all([requireSessionUser(), isAxelAdmin(), createClient()]);
  const { messages, reads } = await loadThread(supabase, project.id);

  return (
    <Stack spacing={3}>
      <SectionHeader
        eyebrow="Messages"
        title={project.name}
        subtitle="Ask questions, share files and agree next steps with Axel."
        actions={projects.length > 1 ? <ProjectSwitcher projects={projects} current={project.id} basePath="/portal/messages" /> : undefined}
      />
      <MessageThread
        projectId={project.id}
        viewerId={user.id}
        isAdmin={admin}
        messages={messages}
        reads={reads}
        paths={["/portal/messages"]}
      />
    </Stack>
  );
}
