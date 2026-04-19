import { LocalStorage } from "@raycast/api";
import { randomUUID } from "node:crypto";

import { getConfiguredAppIdentityKey, normalizeConfiguredApp } from "./apps";
import { getPathLabelFromPath, normalizePath } from "./paths";
import {
  clampAndSortRecentLaunches,
  mergeRecentLaunches,
  RECENT_LAUNCH_LIMIT,
} from "./recent-launches";
import type { ConfiguredApp, RecentLaunch, SavedPath } from "./types";

const SAVED_PATHS_KEY = "saved-paths";
const CONFIGURED_APPS_KEY = "configured-apps";
const RECENT_LAUNCHES_KEY = "recent-launches";
export function normalizeSavedPath(input: unknown): SavedPath | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const candidate = input as Partial<SavedPath>;
  if (
    typeof candidate.id !== "string" ||
    typeof candidate.label !== "string" ||
    typeof candidate.path !== "string" ||
    typeof candidate.createdAt !== "string" ||
    typeof candidate.updatedAt !== "string"
  ) {
    return null;
  }

  const normalizedPath = normalizePath(candidate.path);
  const label = candidate.label.trim();
  if (!normalizedPath || !label) {
    return null;
  }

  return {
    id: candidate.id,
    label,
    path: normalizedPath,
    createdAt: candidate.createdAt,
    updatedAt: candidate.updatedAt,
  };
}

export function normalizeRecentLaunch(input: unknown): RecentLaunch | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const candidate = input as Partial<RecentLaunch>;
  if (
    typeof candidate.id !== "string" ||
    typeof candidate.path !== "string" ||
    typeof candidate.appId !== "string" ||
    typeof candidate.appNameSnapshot !== "string" ||
    typeof candidate.launchedAt !== "string" ||
    typeof candidate.launchCount !== "number"
  ) {
    return null;
  }

  const normalizedPath = normalizePath(candidate.path);
  const appNameSnapshot = candidate.appNameSnapshot.trim();
  if (
    !normalizedPath ||
    !candidate.appId.trim() ||
    !appNameSnapshot ||
    candidate.launchCount < 1
  ) {
    return null;
  }

  const pathLabel =
    typeof candidate.pathLabel === "string"
      ? candidate.pathLabel.trim() || undefined
      : undefined;

  return {
    id: candidate.id,
    path: normalizedPath,
    pathLabel,
    appId: candidate.appId,
    appNameSnapshot,
    launchedAt: candidate.launchedAt,
    launchCount: candidate.launchCount,
  };
}

function sortSavedPaths(paths: SavedPath[]): SavedPath[] {
  return [...paths].sort(
    (left, right) =>
      left.label.localeCompare(right.label) ||
      left.path.localeCompare(right.path),
  );
}

function sanitizeConfiguredApps(apps: ConfiguredApp[]): ConfiguredApp[] {
  const seen = new Set<string>();
  let defaultAssigned = false;

  return apps.reduce<ConfiguredApp[]>((accumulator, app) => {
    const identityKey = getConfiguredAppIdentityKey(app);
    if (seen.has(identityKey)) {
      return accumulator;
    }

    seen.add(identityKey);
    const nextApp = { ...app, isDefault: app.isDefault && !defaultAssigned };
    if (nextApp.isDefault) {
      defaultAssigned = true;
    }

    accumulator.push(nextApp);
    return accumulator;
  }, []);
}

async function getJson<T>(key: string): Promise<T | undefined> {
  const rawValue = await LocalStorage.getItem<string>(key);
  if (!rawValue) {
    return undefined;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return undefined;
  }
}

async function setJson(key: string, value: unknown): Promise<void> {
  await LocalStorage.setItem(key, JSON.stringify(value));
}

export async function getSavedPaths(): Promise<SavedPath[]> {
  const rows = (await getJson<unknown[]>(SAVED_PATHS_KEY)) ?? [];
  return sortSavedPaths(
    rows
      .map((row) => normalizeSavedPath(row))
      .filter((row): row is SavedPath => Boolean(row)),
  );
}

export async function setSavedPaths(paths: SavedPath[]): Promise<void> {
  const normalizedRows = sortSavedPaths(
    paths
      .map((row) => normalizeSavedPath(row))
      .filter((row): row is SavedPath => Boolean(row)),
  );
  await setJson(SAVED_PATHS_KEY, normalizedRows);
}

export async function upsertSavedPath(input: {
  id?: string;
  label: string;
  path: string;
}): Promise<SavedPath> {
  const savedPaths = await getSavedPaths();
  const normalizedPath = normalizePath(input.path);
  const label = input.label.trim() || getPathLabelFromPath(normalizedPath);
  const now = new Date().toISOString();
  const duplicate = savedPaths.find(
    (savedPath) =>
      savedPath.path === normalizedPath && savedPath.id !== input.id,
  );
  if (duplicate) {
    throw new Error("That path is already saved.");
  }

  const existing = input.id
    ? savedPaths.find((savedPath) => savedPath.id === input.id)
    : undefined;
  const nextSavedPath: SavedPath = {
    id: existing?.id ?? randomUUID(),
    label,
    path: normalizedPath,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  const nextRows = existing
    ? savedPaths.map((savedPath) =>
        savedPath.id === existing.id ? nextSavedPath : savedPath,
      )
    : [...savedPaths, nextSavedPath];
  await setSavedPaths(nextRows);
  return nextSavedPath;
}

export async function removeSavedPath(id: string): Promise<void> {
  const savedPaths = await getSavedPaths();
  await setSavedPaths(savedPaths.filter((savedPath) => savedPath.id !== id));
}

export async function getConfiguredApps(): Promise<ConfiguredApp[]> {
  const rows = (await getJson<unknown[]>(CONFIGURED_APPS_KEY)) ?? [];
  return sanitizeConfiguredApps(
    rows
      .map((row) => normalizeConfiguredApp(row))
      .filter((row): row is ConfiguredApp => Boolean(row)),
  );
}

export async function setConfiguredApps(apps: ConfiguredApp[]): Promise<void> {
  const normalizedRows = sanitizeConfiguredApps(
    apps
      .map((row) => normalizeConfiguredApp(row))
      .filter((row): row is ConfiguredApp => Boolean(row)),
  );
  await setJson(CONFIGURED_APPS_KEY, normalizedRows);
}

export async function upsertConfiguredApp(
  input: Omit<ConfiguredApp, "createdAt" | "updatedAt">,
): Promise<ConfiguredApp> {
  const apps = await getConfiguredApps();
  const now = new Date().toISOString();
  const name = input.name.trim();
  if (!name) {
    throw new Error("App name is required.");
  }

  const nextApp: ConfiguredApp = {
    ...input,
    name,
    bundleId: input.bundleId?.trim() || undefined,
    path: input.path?.trim() || undefined,
    createdAt: apps.find((app) => app.id === input.id)?.createdAt ?? now,
    updatedAt: now,
  };

  if (!nextApp.bundleId && !nextApp.path) {
    throw new Error("Choose an installed app before saving.");
  }

  const duplicate = apps.find(
    (app) =>
      getConfiguredAppIdentityKey(app) ===
        getConfiguredAppIdentityKey(nextApp) && app.id !== nextApp.id,
  );
  if (duplicate) {
    throw new Error("That app is already configured.");
  }

  const existingIndex = apps.findIndex((app) => app.id === nextApp.id);
  const baseRows = nextApp.isDefault
    ? apps.map((app) => ({ ...app, isDefault: false }))
    : [...apps];
  const nextRows =
    existingIndex >= 0
      ? baseRows.map((app, index) => (index === existingIndex ? nextApp : app))
      : [...baseRows, nextApp];
  await setConfiguredApps(nextRows);
  return nextApp;
}

export async function removeConfiguredApp(id: string): Promise<void> {
  const apps = await getConfiguredApps();
  const nextRows = apps.filter((app) => app.id !== id);
  if (nextRows.length > 0 && !nextRows.some((app) => app.isDefault)) {
    nextRows[0] = { ...nextRows[0], isDefault: true };
  }
  await setConfiguredApps(nextRows);
}

export async function moveConfiguredApp(
  id: string,
  direction: "up" | "down",
): Promise<void> {
  const apps = await getConfiguredApps();
  const index = apps.findIndex((app) => app.id === id);
  if (index < 0) {
    return;
  }

  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= apps.length) {
    return;
  }

  const nextRows = [...apps];
  const [moved] = nextRows.splice(index, 1);
  nextRows.splice(targetIndex, 0, moved);
  await setConfiguredApps(nextRows);
}

export async function setDefaultConfiguredApp(id: string): Promise<void> {
  const apps = await getConfiguredApps();
  await setConfiguredApps(
    apps.map((app) => ({ ...app, isDefault: app.id === id })),
  );
}

export async function getRecentLaunches(): Promise<RecentLaunch[]> {
  const rows = (await getJson<unknown[]>(RECENT_LAUNCHES_KEY)) ?? [];
  const normalizedRows = rows
    .map((row) => normalizeRecentLaunch(row))
    .filter((row): row is RecentLaunch => Boolean(row))
    .slice(0, RECENT_LAUNCH_LIMIT);
  return clampAndSortRecentLaunches(normalizedRows);
}

export async function setRecentLaunches(
  recentLaunches: RecentLaunch[],
): Promise<void> {
  const normalizedRows = clampAndSortRecentLaunches(
    recentLaunches
      .map((row) => normalizeRecentLaunch(row))
      .filter((row): row is RecentLaunch => Boolean(row)),
  );
  await setJson(RECENT_LAUNCHES_KEY, normalizedRows);
}

export async function recordRecentLaunch(input: {
  path: string;
  pathLabel?: string;
  appId: string;
  appNameSnapshot: string;
}): Promise<void> {
  const recentLaunches = await getRecentLaunches();
  await setRecentLaunches(mergeRecentLaunches(recentLaunches, input));
}

export async function removeRecentLaunch(id: string): Promise<void> {
  const recentLaunches = await getRecentLaunches();
  await setRecentLaunches(
    recentLaunches.filter((recentLaunch) => recentLaunch.id !== id),
  );
}
