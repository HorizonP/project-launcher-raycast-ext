import { describe, expect, it } from "vitest";

import { buildSearchItems } from "../search";
import type { RecentLaunch, SavedPath } from "../types";

const savedPaths: SavedPath[] = [
  {
    id: "saved-1",
    label: "Alpha Project",
    path: "/Users/peiyu/Projects/alpha",
    createdAt: "2026-04-18T00:00:00.000Z",
    updatedAt: "2026-04-18T00:00:00.000Z",
  },
];

const recentLaunches: RecentLaunch[] = [
  {
    id: "recent-1",
    path: "/Users/peiyu/Projects/beta",
    pathLabel: "Beta Project",
    appId: "code",
    appNameSnapshot: "VS Code",
    launchedAt: "2026-04-18T01:00:00.000Z",
    launchCount: 2,
  },
];

describe("buildSearchItems", () => {
  it("places the typed path candidate first", () => {
    const result = buildSearchItems({
      query: "/Users/peiyu/Projects/gamma",
      savedPaths,
      recentLaunches,
      typedPathCandidates: ["/Users/peiyu/Projects/gamma"],
    });

    expect(result[0]).toMatchObject({
      type: "typed-path",
      path: "/Users/peiyu/Projects/gamma",
    });
  });

  it("places multiple typed path candidates before recent and saved paths", () => {
    const result = buildSearchItems({
      query: "Projects",
      savedPaths,
      recentLaunches,
      typedPathCandidates: [
        "/Users/peiyu/Projects/gamma",
        "/Users/peiyu/Projects/garden",
      ],
    });

    expect(result.map((item) => item.type)).toEqual([
      "typed-path",
      "typed-path",
      "recent-launch",
      "saved-path",
    ]);
    expect(result.slice(0, 2)).toMatchObject([
      { path: "/Users/peiyu/Projects/gamma" },
      { path: "/Users/peiyu/Projects/garden" },
    ]);
  });

  it("matches saved paths by label, basename, and full path", () => {
    expect(
      buildSearchItems({
        query: "alpha",
        savedPaths,
        recentLaunches: [],
        typedPathCandidates: [],
      }).map((item) => item.type),
    ).toContain("saved-path");
    expect(
      buildSearchItems({
        query: "Projects/alpha",
        savedPaths,
        recentLaunches: [],
        typedPathCandidates: [],
      }).map((item) => item.type),
    ).toContain("saved-path");
  });

  it("matches recent launches by app snapshot and preserves the app id for reopening", () => {
    const result = buildSearchItems({
      query: "code",
      savedPaths: [],
      recentLaunches,
      typedPathCandidates: [],
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      type: "recent-launch",
      recentLaunch: { appId: "code" },
    });
  });

  it("returns recents before saved paths", () => {
    const result = buildSearchItems({
      query: "",
      savedPaths,
      recentLaunches,
      typedPathCandidates: [],
    });

    expect(result.map((item) => item.type)).toEqual([
      "recent-launch",
      "saved-path",
    ]);
  });
});
