import { describe, expect, it } from "vitest";
import { countUnread } from "./messages";

const msg = (project_id: string, created_at: string, author_id = "axel") => ({ project_id, created_at, author_id });

describe("countUnread", () => {
  it("counts other people's messages newer than the reader's last visit", () => {
    const counts = countUnread(
      [msg("p1", "2026-10-10T09:00:00Z"), msg("p1", "2026-10-12T09:00:00Z"), msg("p1", "2026-10-13T09:00:00Z")],
      [{ project_id: "p1", last_read_at: "2026-10-11T00:00:00Z" }],
      "maja"
    );
    expect(counts).toEqual({ p1: 2 });
  });

  it("treats a thread never opened as fully unread", () => {
    expect(countUnread([msg("p2", "2026-10-10T09:00:00Z")], [], "maja")).toEqual({ p2: 1 });
  });

  it("never counts the reader's own messages", () => {
    expect(countUnread([msg("p1", "2026-10-13T09:00:00Z", "maja")], [], "maja")).toEqual({});
  });
});
