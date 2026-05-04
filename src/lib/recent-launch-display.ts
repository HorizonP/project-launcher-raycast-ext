import type { ConfiguredApp, RecentLaunch } from "./types";

export type RecentLaunchDisplay = {
  icon: string;
  appAccessoryIcon?: string;
  appAccessoryTooltip?: string;
  launchCountText: string;
};

export function getRecentLaunchDisplay(
  recentLaunch: RecentLaunch,
  configuredApps: ConfiguredApp[],
): RecentLaunchDisplay {
  const configuredApp = configuredApps.find(
    (candidate) => candidate.id === recentLaunch.appId,
  );

  return {
    icon: recentLaunch.path,
    appAccessoryIcon: configuredApp?.path,
    appAccessoryTooltip: configuredApp?.name,
    launchCountText: `${recentLaunch.launchCount}x`,
  };
}
