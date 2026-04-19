import { randomUUID } from "node:crypto";

import { normalizePath } from "./paths";
import type { RecentLaunch } from "./types";

export const RECENT_LAUNCH_LIMIT = 100;

function sortRecentLaunches(recentLaunches: RecentLaunch[]): RecentLaunch[] {
  return [...recentLaunches].sort((left, right) => {
    const timestampDifference =
      Date.parse(right.launchedAt) - Date.parse(left.launchedAt);
    if (timestampDifference !== 0) {
      return timestampDifference;
    }

    return right.launchCount - left.launchCount;
  });
}

export function mergeRecentLaunches(
  recentLaunches: RecentLaunch[],
  input: {
    path: string;
    pathLabel?: string;
    appId: string;
    appNameSnapshot: string;
    launchedAt?: string;
  },
): RecentLaunch[] {
  const normalizedPath = normalizePath(input.path);
  const launchedAt = input.launchedAt ?? new Date().toISOString();
  const existing = recentLaunches.find(
    (recentLaunch) =>
      recentLaunch.path === normalizedPath &&
      recentLaunch.appId === input.appId,
  );

  const nextRecentLaunch: RecentLaunch = existing
    ? {
        ...existing,
        path: normalizedPath,
        pathLabel: input.pathLabel?.trim() || existing.pathLabel,
        appNameSnapshot: input.appNameSnapshot.trim(),
        launchedAt,
        launchCount: existing.launchCount + 1,
      }
    : {
        id: randomUUID(),
        path: normalizedPath,
        pathLabel: input.pathLabel?.trim() || undefined,
        appId: input.appId,
        appNameSnapshot: input.appNameSnapshot.trim(),
        launchedAt,
        launchCount: 1,
      };

  const remaining = recentLaunches.filter(
    (recentLaunch) =>
      !(
        recentLaunch.path === normalizedPath &&
        recentLaunch.appId === input.appId
      ),
  );
  return sortRecentLaunches([nextRecentLaunch, ...remaining]).slice(
    0,
    RECENT_LAUNCH_LIMIT,
  );
}

export function clampAndSortRecentLaunches(
  recentLaunches: RecentLaunch[],
): RecentLaunch[] {
  return sortRecentLaunches(recentLaunches).slice(0, RECENT_LAUNCH_LIMIT);
}
