import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MODE_ATTR, MODE_KEY, getModeChoice, setModeChoice } from "./color-mode";

// The tests run in Node: a stand-in <html>, localStorage and matchMedia are enough here.
describe("light / dark / system mode", () => {
  let attrs: Map<string, string>;
  let store: Map<string, string>;
  let systemDark: boolean;

  beforeEach(() => {
    attrs = new Map();
    store = new Map();
    systemDark = false;
    vi.stubGlobal("document", {
      documentElement: {
        getAttribute: (k: string) => attrs.get(k) ?? null,
        setAttribute: (k: string, v: string) => void attrs.set(k, v),
        removeAttribute: (k: string) => void attrs.delete(k),
      },
    });
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    });
    vi.stubGlobal("window", { matchMedia: () => ({ matches: systemDark }) });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("defaults to following the system", () => {
    expect(getModeChoice()).toBe("system");
  });

  it("forces dark and remembers it", () => {
    setModeChoice("dark");
    expect(attrs.get(MODE_ATTR)).toBe("dark");
    expect(store.get(MODE_KEY)).toBe("dark");
    expect(getModeChoice()).toBe("dark");
  });

  it("forces light even when the system is dark", () => {
    systemDark = true;
    setModeChoice("light");
    expect(attrs.get(MODE_ATTR)).toBe("light");
  });

  it("goes back to the system's setting on System", () => {
    setModeChoice("dark");
    systemDark = false;
    setModeChoice("system");
    expect(store.has(MODE_KEY)).toBe(false);
    expect(attrs.get(MODE_ATTR)).toBe("light");
    systemDark = true;
    setModeChoice("system");
    expect(attrs.get(MODE_ATTR)).toBe("dark");
  });
});
