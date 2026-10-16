import { describe, expect, it } from "vitest";
import { notificationHref } from "./notification-links";

describe("notificationHref", () => {
  it("opens the chat panel over the current page for messages", () => {
    const n = { kind: "message", project_id: "p1", org_id: "o1" };
    expect(notificationHref(n, "portal")).toBe("?chat=p1");
    expect(notificationHref(n, "admin")).toBe("?chat=p1");
  });

  it("still routes other kinds to their project section", () => {
    expect(notificationHref({ kind: "file", project_id: "p1", org_id: "o1" }, "admin")).toBe("/admin/clients/o1/projects/p1/files");
  });
});
