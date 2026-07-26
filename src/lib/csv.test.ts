import { describe, expect, it } from "vitest";
import { toCsv } from "./csv";

describe("toCsv", () => {
  it("renders a header row and plain data rows", () => {
    const csv = toCsv(["Name", "Amount"], [["Visibuilt ApS", 500]]);
    expect(csv).toBe("Name,Amount\r\nVisibuilt ApS,500");
  });

  it("quotes a field containing a comma", () => {
    const csv = toCsv(["Description"], [["Formulation, batch 2"]]);
    expect(csv).toBe('Description\r\n"Formulation, batch 2"');
  });

  it("quotes and escapes a field containing double quotes", () => {
    const csv = toCsv(["Note"], [['Say "hello"']]);
    expect(csv).toBe('Note\r\n"Say ""hello"""');
  });

  it("quotes a field containing a newline", () => {
    const csv = toCsv(["Note"], [["line one\nline two"]]);
    expect(csv).toBe('Note\r\n"line one\nline two"');
  });

  it("renders null and undefined as empty fields", () => {
    const csv = toCsv(["A", "B"], [[null, undefined]]);
    expect(csv).toBe("A,B\r\n,");
  });

  it("renders multiple rows in order", () => {
    const csv = toCsv(["Id"], [["1"], ["2"], ["3"]]);
    expect(csv).toBe("Id\r\n1\r\n2\r\n3");
  });
});
