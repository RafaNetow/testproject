import { describe, expect, it } from "vitest";
import { sortWaiting, type WaitingItem } from "./waiting";

const item = (over: Partial<WaitingItem>): WaitingItem => ({
  kind: "answer",
  id: Math.random().toString(36),
  title: "Item",
  projectId: "p1",
  projectName: "Project",
  href: "/portal",
  due: null,
  ...over,
});

describe("sortWaiting", () => {
  it("puts dated items first, soonest first", () => {
    const sorted = sortWaiting([
      item({ title: "No date", kind: "review" }),
      item({ title: "Later", due: "2026-11-01" }),
      item({ title: "Sooner", due: "2026-10-20" }),
    ]);
    expect(sorted.map((i) => i.title)).toEqual(["Sooner", "Later", "No date"]);
  });

  it("orders undated items by kind: review, sign, upload, answer", () => {
    const sorted = sortWaiting([
      item({ title: "a", kind: "answer" }),
      item({ title: "u", kind: "upload" }),
      item({ title: "s", kind: "sign" }),
      item({ title: "r", kind: "review" }),
    ]);
    expect(sorted.map((i) => i.kind)).toEqual(["review", "sign", "upload", "answer"]);
  });

  it("does not mutate the input", () => {
    const input = [item({ title: "b" }), item({ title: "a" })];
    sortWaiting(input);
    expect(input.map((i) => i.title)).toEqual(["b", "a"]);
  });
});

describe("sortWaiting with messages", () => {
  it("lists unread messages before undated tasks", () => {
    const sorted = sortWaiting([item({ title: "Card", kind: "answer" }), item({ title: "2 new messages", kind: "reply" })]);
    expect(sorted[0].kind).toBe("reply");
  });
});
