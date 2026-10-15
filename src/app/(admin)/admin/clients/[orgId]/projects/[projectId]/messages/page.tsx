import { createClient } from "@/lib/supabase/server";
import { requireSessionUser } from "@/lib/dal";
import { loadThread } from "@/lib/messages";
import { MessageThread } from "@/components/messages/message-thread";

export default async function AdminProjectMessagesPage({ params }: { params: Promise<{ orgId: string; projectId: string }> }) {
  const { orgId, projectId } = await params;
  const [user, supabase] = await Promise.all([requireSessionUser(), createClient()]);
  const { messages, reads } = await loadThread(supabase, projectId);

  return (
    <MessageThread
      projectId={projectId}
      viewerId={user.id}
      isAdmin
      messages={messages}
      reads={reads}
      paths={[`/admin/clients/${orgId}/projects/${projectId}/messages`]}
    />
  );
}
