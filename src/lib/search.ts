import { basename } from "node:path";

import type { RecentLaunch, SavedPath, SearchItem } from "./types";

type BuildSearchItemsOptions = {
  query: string;
  savedPaths: SavedPath[];
  recentLaunches: RecentLaunch[];
  typedPathCandidates: string[];
};

export function buildSearchItems(
  options: BuildSearchItemsOptions,
): SearchItem[] {
  const normalizedQuery = options.query.trim().toLowerCase();
  const typedItems = options.typedPathCandidates.map((typedPathCandidate) => ({
    type: "typed-path" as const,
    path: typedPathCandidate,
    label: basename(typedPathCandidate) || typedPathCandidate,
  }));

  const recentItems = options.recentLaunches
    .filter((recentLaunch) =>
      matchesRecentLaunchQuery(recentLaunch, normalizedQuery),
    )
    .map((recentLaunch) => ({ type: "recent-launch" as const, recentLaunch }));

  const savedItems = options.savedPaths
    .filter((savedPath) => matchesSavedPathQuery(savedPath, normalizedQuery))
    .map((savedPath) => ({ type: "saved-path" as const, savedPath }));

  return [...typedItems, ...recentItems, ...savedItems];
}

export function matchesSavedPathQuery(
  savedPath: SavedPath,
  normalizedQuery: string,
): boolean {
  if (!normalizedQuery) {
    return true;
  }

  const haystacks = [savedPath.label, basename(savedPath.path), savedPath.path];
  return haystacks.some((value) =>
    value.toLowerCase().includes(normalizedQuery),
  );
}

export function matchesRecentLaunchQuery(
  recentLaunch: RecentLaunch,
  normalizedQuery: string,
): boolean {
  if (!normalizedQuery) {
    return true;
  }

  const haystacks = [
    recentLaunch.pathLabel ?? "",
    basename(recentLaunch.path),
    recentLaunch.path,
    recentLaunch.appNameSnapshot,
  ];
  return haystacks.some((value) =>
    value.toLowerCase().includes(normalizedQuery),
  );
}
