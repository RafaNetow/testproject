import { AutoSubmitSelect } from "./auto-submit-select";
import type { PortalProject } from "@/lib/portal-context";

/** GET-based project picker — no client JS needed beyond the auto-submit select. */
export function ProjectSwitcher({
  projects,
  current,
  basePath,
}: {
  projects: PortalProject[];
  current: string;
  basePath: string;
}) {
  return (
    <form action={basePath} method="GET">
      <AutoSubmitSelect
        name="project"
        defaultValue={current}
        options={projects.map((p) => ({ value: p.id, label: p.name }))}
        className="rounded-lg border border-border bg-card px-3.5 py-2 text-sm text-primary outline-none transition-colors focus:border-accent"
      />
    </form>
  );
}
