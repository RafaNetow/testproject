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
        ariaLabel="Project"
        options={projects.map((p) => ({ value: p.id, label: p.name }))}
      />
    </form>
  );
}
