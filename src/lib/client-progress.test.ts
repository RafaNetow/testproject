import { describe, expect, it } from "vitest";
import { clientProgress } from "./client-progress";

describe("clientProgress", () => {
  it("averages the running projects of each client", () => {
    const m = clientProgress([
      { org_id: "a", status: "active", progress_pct: 10 },
      { org_id: "a", status: "active", progress_pct: 61 },
      { org_id: "a", status: "completed", progress_pct: 100 },
      { org_id: "b", status: "completed", progress_pct: 100 },
    ]);
    expect(m.get("a")).toEqual({ pct: 36, projects: 3 });
    expect(m.get("b")).toEqual({ pct: 100, projects: 1 });
    expect(m.has("c")).toBe(false);
  });
});
