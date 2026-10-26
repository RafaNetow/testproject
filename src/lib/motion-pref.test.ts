import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LOADER_ATTR, LOADER_KEY, MOTION_ATTR, MOTION_KEY, getMotionChoice, setMotionChoice } from "./motion-pref";

// The tests run in Node: a stand-in <html> and localStorage are enough here.
function fakeStore() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  };
}

describe("loading animation choice", () => {
  let attrs: Map<string, string>;
  let storage: ReturnType<typeof fakeStore>;

  beforeEach(() => {
    attrs = new Map();
    storage = fakeStore();
    vi.stubGlobal("document", {
      documentElement: {
        getAttribute: (k: string) => attrs.get(k) ?? null,
        setAttribute: (k: string, v: string) => void attrs.set(k, v),
        removeAttribute: (k: string) => void attrs.delete(k),
      },
    });
    vi.stubGlobal("localStorage", storage);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("defaults to the gears", () => {
    expect(getMotionChoice()).toBe("gears");
  });

  it("switches to the bar and remembers it", () => {
    setMotionChoice("bar");
    expect(getMotionChoice()).toBe("bar");
    expect(attrs.get(LOADER_ATTR)).toBe("bar");
    expect(storage.getItem(LOADER_KEY)).toBe("bar");
  });

  it("turns everything off, then back on with the loader picked before", () => {
    setMotionChoice("bar");
    setMotionChoice("off");
    expect(getMotionChoice()).toBe("off");
    expect(attrs.get(MOTION_ATTR)).toBe("reduced");
    expect(storage.getItem(MOTION_KEY)).toBe("reduced");

    setMotionChoice("gears");
    expect(getMotionChoice()).toBe("gears");
    expect(attrs.has(MOTION_ATTR)).toBe(false);
    expect(attrs.has(LOADER_ATTR)).toBe(false);
    expect(storage.getItem(LOADER_KEY)).toBeNull();
  });
});
