import { describe, expect, it } from "vitest";
import { digestIsWorthSending, renderDigest, summarizeActivity, type DigestData } from "./digest";

const base: DigestData = {
  firstName: "Maja",
  orgName: "Nordic Polymers",
  activity: [],
  waiting: [],
  nextMeeting: null,
  projects: [],
};

describe("summarizeActivity", () => {
  it("counts by kind, most frequent first, with singular and plural labels", () => {
    const activity = [
      { kind: "card", message: "a", created_at: "" },
      { kind: "card", message: "b", created_at: "" },
      { kind: "decision", message: "c", created_at: "" },
    ];
    expect(summarizeActivity(activity)).toEqual(["2 board updates", "1 decision logged"]);
  });
});

describe("digestIsWorthSending", () => {
  it("skips an empty week", () => {
    expect(digestIsWorthSending(base)).toBe(false);
  });

  it("sends when something is waiting", () => {
    expect(
      digestIsWorthSending({
        ...base,
        waiting: [{ kind: "review", id: "1", title: "Report", projectId: null, projectName: null, href: "/portal", due: null }],
      })
    ).toBe(true);
  });
});

describe("renderDigest", () => {
  it("leads the subject with what needs the client", () => {
    const { subject } = renderDigest({
      ...base,
      waiting: [{ kind: "sign", id: "1", title: "MSA", projectId: null, projectName: null, href: "https://sign.example", due: null }],
    });
    expect(subject).toBe("Your week with Alchemica: 1 thing needs you");
  });

  it("escapes user-supplied text in the HTML", () => {
    const { html } = renderDigest({ ...base, activity: [{ kind: "card", message: "<script>x</script>", created_at: "" }] });
    expect(html).not.toContain("<script>x</script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
