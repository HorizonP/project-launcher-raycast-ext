import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  getCompletedPathQuery,
  getPathLabelFromPath,
  normalizePath,
  resolveTypedPathCandidate,
  resolveTypedPathCandidates,
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

describe("resolveTypedPathCandidates", () => {
  it("returns a normalized directory when the query points to a real folder", () => {
    const directory = mkdtempSync(join(tmpdir(), "project-launcher-paths-"));

    try {
      expect(resolveTypedPathCandidates(directory)).toEqual([directory]);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("ignores non-path search text", () => {
    expect(resolveTypedPathCandidates("not-a-path")).toEqual([]);
  });

  it("suggests matching direct child directories for a partial segment", () => {
    const directory = mkdtempSync(join(tmpdir(), "project-launcher-paths-"));
    const alpha = join(directory, "alpha");
    const alpine = join(directory, "alpine");
    const beta = join(directory, "beta");

    try {
      mkdirSync(alpha);
      mkdirSync(alpine);
      mkdirSync(beta);

      expect(resolveTypedPathCandidates(join(directory, "al"))).toEqual([
        alpha,
        alpine,
      ]);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("suggests direct child directories when the query ends with a slash", () => {
    const directory = mkdtempSync(join(tmpdir(), "project-launcher-paths-"));
    const alpha = join(directory, "alpha");
    const beta = join(directory, "beta");

    try {
      mkdirSync(alpha);
      mkdirSync(beta);

      expect(resolveTypedPathCandidates(`${directory}/`)).toEqual([
        directory,
        alpha,
        beta,
      ]);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("does not suggest nested grandchildren until another slash is typed", () => {
    const directory = mkdtempSync(join(tmpdir(), "project-launcher-paths-"));
    const parent = join(directory, "parent");
    const child = join(parent, "child");

    try {
      mkdirSync(parent);
      mkdirSync(child);

      expect(resolveTypedPathCandidates(`${directory}/`)).not.toContain(child);
      expect(resolveTypedPathCandidates(`${parent}/`)).toEqual([parent, child]);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});

describe("getCompletedPathQuery", () => {
  it("adds a trailing slash when the query already matches the selected path", () => {
    expect(getCompletedPathQuery("/tmp/example", "/tmp/example")).toBe(
      "/tmp/example/",
    );
  });

  it("preserves an existing trailing slash when completing the same path", () => {
    expect(getCompletedPathQuery("/tmp/example/", "/tmp/example")).toBe(
      "/tmp/example/",
    );
  });

  it("does not duplicate the root slash", () => {
    expect(getCompletedPathQuery("/", "/")).toBe("/");
  });

  it("uses the selected path when the query does not already match", () => {
    expect(getCompletedPathQuery("/tmp/ex", "/tmp/example")).toBe(
      "/tmp/example",
    );
  });
});
