import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  getPathLabelFromPath,
  normalizePath,
  resolveTypedPathCandidate,
} from "../paths";

describe("normalizePath", () => {
  it("trims whitespace and removes redundant separators", () => {
    expect(normalizePath("  /tmp//example///  ")).toBe("/tmp/example");
  });

  it("expands the home directory", () => {
    expect(normalizePath("~/projects")).toMatch(/\/projects$/);
  });

  it("treats equivalent paths the same", () => {
    expect(normalizePath("/tmp/example")).toBe(normalizePath("/tmp/example/"));
  });

  it("derives a fallback label from the basename", () => {
    expect(getPathLabelFromPath("/tmp/example")).toBe("example");
  });
});

describe("resolveTypedPathCandidate", () => {
  it("returns a normalized directory when the query points to a real folder", () => {
    const directory = mkdtempSync(join(tmpdir(), "project-launcher-paths-"));

    try {
      expect(resolveTypedPathCandidate(directory)).toBe(directory);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("ignores non-path search text", () => {
    expect(resolveTypedPathCandidate("not-a-path")).toBeUndefined();
  });
});
