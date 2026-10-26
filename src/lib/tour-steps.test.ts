import { describe, expect, it } from "vitest";
import { ADMIN_TOUR, CLIENT_TOUR } from "./tour-steps";

describe.each([
  ["client", CLIENT_TOUR],
  ["admin", ADMIN_TOUR],
])("%s tour", (_, steps) => {
  it("has unique step ids", () => {
    expect(new Set(steps.map((s) => s.id)).size).toBe(steps.length);
  });

  it("opens with a welcome and ends with a centred finish", () => {
    expect(steps[0].target).toBeUndefined();
    expect(steps[steps.length - 1].target).toBeUndefined();
  });

  it("gives every spotlight step a placement and short copy", () => {
    for (const s of steps.filter((x) => x.target)) {
      expect(s.placement).toBeDefined();
      expect(s.body.length).toBeLessThan(220);
    }
  });
});
