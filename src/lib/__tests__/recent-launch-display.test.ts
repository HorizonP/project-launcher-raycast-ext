import { describe, expect, it } from "vitest";

import { getRecentLaunchDisplay } from "../recent-launch-display";
import type { ConfiguredApp, RecentLaunch } from "../types";

const recentLaunch: RecentLaunch = {
  id: "recent-1",
  path: "/Users/peiyu/Projects/alpha",
  pathLabel: "Alpha Project",
  appId: "code",
  appNameSnapshot: "VS Code",
  launchedAt: "2026-04-18T01:00:00.000Z",
  launchCount: 3,
};

const configuredApp: ConfiguredApp = {
  id: "code",
  name: "VS Code",
  path: "/Applications/Visual Studio Code.app",
  kind: "desktop",
  launcherType: "open-only",
  isDefault: true,
  createdAt: "2026-04-18T00:00:00.000Z",
  updatedAt: "2026-04-18T00:00:00.000Z",
};

describe("getRecentLaunchDisplay", () => {
  it("uses the launched path as the main icon and includes the configured app icon", () => {
    const result = getRecentLaunchDisplay(recentLaunch, [configuredApp]);

    expect(result).toEqual({
      icon: "/Users/peiyu/Projects/alpha",
      appAccessoryIcon: "/Applications/Visual Studio Code.app",
      appAccessoryTooltip: "VS Code",
      launchCountText: "3x",
    });
  });

  it("omits the app icon accessory when the configured app cannot be resolved", () => {
    const result = getRecentLaunchDisplay(recentLaunch, []);

    expect(result).toEqual({
      icon: "/Users/peiyu/Projects/alpha",
      appAccessoryIcon: undefined,
      appAccessoryTooltip: undefined,
      launchCountText: "3x",
    });
  });

  it("omits the app icon accessory when the configured app has no path", () => {
    const result = getRecentLaunchDisplay(recentLaunch, [
      { ...configuredApp, path: undefined },
    ]);

    expect(result).toEqual({
      icon: "/Users/peiyu/Projects/alpha",
      appAccessoryIcon: undefined,
      appAccessoryTooltip: "VS Code",
      launchCountText: "3x",
    });
  });
});
