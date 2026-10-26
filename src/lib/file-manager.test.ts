import { describe, expect, it } from "vitest";
import { NO_FILTERS, fileType, filterFiles, filterFolders, folderTotals, formatSize, hasFilters } from "./file-manager";

const file = (filename: string, created_at: string, extra: Partial<{ favourite: boolean; technique: string | null; mime_type: string | null }> = {}) => ({
  filename,
  created_at,
  mime_type: null,
  favourite: false,
  technique: null,
  ...extra,
});

describe("fileType", () => {
  it("groups files the way the Type filter does", () => {
    expect(fileType("report.pdf", null).group).toBe("pdf");
    expect(fileType("notes.docx", null).group).toBe("doc");
    expect(fileType("results.csv", null)).toMatchObject({ label: "CSV", group: "sheet" });
    expect(fileType("deck.pptx", null).group).toBe("slides");
    expect(fileType("spectrum", "image/png").group).toBe("image");
    expect(fileType("raw.zip", null).group).toBe("archive");
    expect(fileType("trace.jdx", null)).toMatchObject({ label: "JDX", group: "other" });
  });
});

describe("filterFiles", () => {
  const files = [
    file("FTIR spectra.pdf", "2026-10-01T09:00:00Z", { technique: "FTIR", favourite: true }),
    file("DSC results.xlsx", "2026-10-12T09:00:00Z", { technique: "DSC" }),
    file("Photo.png", "2026-10-20T09:00:00Z", { mime_type: "image/png" }),
  ];

  it("lets everything through with no filters", () => {
    expect(filterFiles(files, NO_FILTERS)).toHaveLength(3);
    expect(hasFilters(NO_FILTERS)).toBe(false);
  });

  it("searches names, case-insensitively", () => {
    expect(filterFiles(files, { ...NO_FILTERS, search: "dsc" }).map((f) => f.filename)).toEqual(["DSC results.xlsx"]);
  });

  it("filters by type groups", () => {
    expect(filterFiles(files, { ...NO_FILTERS, groups: ["pdf", "image"] })).toHaveLength(2);
  });

  it("keeps the date range inclusive", () => {
    expect(filterFiles(files, { ...NO_FILTERS, from: "2026-10-12", to: "2026-10-20" }).map((f) => f.filename)).toEqual(["DSC results.xlsx", "Photo.png"]);
  });

  it("shows only favourites, or one technique", () => {
    expect(filterFiles(files, { ...NO_FILTERS, favouritesOnly: true })).toHaveLength(1);
    expect(filterFiles(files, { ...NO_FILTERS, technique: "DSC" })).toHaveLength(1);
  });

  it("applies search and favourites to folders", () => {
    const folders = [{ name: "Raw data", favourite: true }, { name: "Reports", favourite: false }];
    expect(filterFolders(folders, { ...NO_FILTERS, search: "rep" })).toEqual([folders[1]]);
    expect(filterFolders(folders, { ...NO_FILTERS, favouritesOnly: true })).toEqual([folders[0]]);
    // File-only filters hide folders.
    expect(filterFolders(folders, { ...NO_FILTERS, groups: ["pdf"] })).toEqual([]);
    expect(filterFolders(folders, { ...NO_FILTERS, from: "2026-10-01" })).toEqual([]);
  });
});

describe("folderTotals", () => {
  it("adds up nested folders", () => {
    const folders = [
      { id: "a", parent_folder_id: null },
      { id: "b", parent_folder_id: "a" },
      { id: "c", parent_folder_id: "b" },
    ];
    const files = [
      { folder_id: "a", size_bytes: 100 },
      { folder_id: "c", size_bytes: 50 },
      { folder_id: null, size_bytes: 999 },
    ];
    const t = folderTotals(folders, files);
    expect(t.get("a")).toEqual({ count: 2, size: 150 });
    expect(t.get("b")).toEqual({ count: 1, size: 50 });
  });

  it("formats sizes", () => {
    expect(formatSize(512)).toBe("512 B");
    expect(formatSize(2048)).toBe("2.0 KB");
    expect(formatSize(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});
