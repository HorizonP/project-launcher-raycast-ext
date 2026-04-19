import { describe, expect, it } from "vitest";

import { mergeRecentLaunches } from "../recent-launches";
import type { RecentLaunch } from "../types";

function recent(
  path: string,
  appId: string,
  launchedAt: string,
  launchCount = 1,
): RecentLaunch {
  return {
    id: `${path}-${appId}`,
    path,
    appId,
    appNameSnapshot: appId,
    launchedAt,
    launchCount,
  };
}

describe("mergeRecentLaunches", () => {
  it("inserts a new recent launch", () => {
    const result = mergeRecentLaunches([], {
      path: "/tmp/project",
      appId: "code",
      appNameSnapshot: "VS Code",
      launchedAt: "2026-04-18T10:00:00.000Z",
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      path: "/tmp/project",
      appId: "code",
      launchCount: 1,
    });
  });

  it("deduplicates an existing path and app pair while incrementing launch count", () => {
    const result = mergeRecentLaunches(
      [recent("/tmp/project", "code", "2026-04-18T09:00:00.000Z", 2)],
      {
        path: "/tmp/project/",
        appId: "code",
        appNameSnapshot: "VS Code",
        launchedAt: "2026-04-18T10:00:00.000Z",
      },
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      path: "/tmp/project",
      appId: "code",
      launchCount: 3,
      launchedAt: "2026-04-18T10:00:00.000Z",
    });
  });

  it("keeps the most recent launches first", () => {
    const result = mergeRecentLaunches(
      [
        recent("/tmp/older", "finder", "2026-04-18T08:00:00.000Z"),
        recent("/tmp/newer", "code", "2026-04-18T09:00:00.000Z"),
      ],
      {
        path: "/tmp/latest",
        appId: "terminal",
        appNameSnapshot: "Terminal",
        launchedAt: "2026-04-18T10:00:00.000Z",
      },
    );

    expect(result.map((item) => item.path)).toEqual([
      "/tmp/latest",
      "/tmp/newer",
      "/tmp/older",
    ]);
  });

  it("caps the list at one hundred items", () => {
    const launches = Array.from({ length: 100 }, (_, index) =>
      recent(
        `/tmp/project-${index}`,
        `app-${index}`,
        `2026-04-18T${String(index % 24).padStart(2, "0")}:00:00.000Z`,
      ),
    );

    const result = mergeRecentLaunches(launches, {
      path: "/tmp/overflow",
      appId: "overflow-app",
      appNameSnapshot: "Overflow",
      launchedAt: "2026-04-19T00:00:00.000Z",
    });

    expect(result).toHaveLength(100);
    expect(result[0].path).toBe("/tmp/overflow");
  });
});
