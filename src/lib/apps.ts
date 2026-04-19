import type { Application } from "@raycast/api";

import type { AppKind, ConfiguredApp, LauncherType } from "./types";

const KNOWN_TERMINAL_BUNDLE_IDS = new Set([
  "com.apple.Terminal",
  "com.googlecode.iterm2",
  "dev.warp.Warp-Stable",
  "dev.warp.Warp",
  "net.kovidgoyal.kitty",
  "com.github.wez.wezterm",
  "org.alacritty",
  "co.zeit.hyper",
]);

const TERMINAL_NAME_HINTS = [
  "terminal",
  "iterm",
  "warp",
  "kitty",
  "wezterm",
  "alacritty",
  "hyper",
];

export function inferAppCapabilities(
  seed: Pick<ConfiguredApp, "name" | "bundleId">,
): {
  kind: AppKind;
  launcherType: LauncherType;
} {
  const normalizedName = seed.name.trim().toLowerCase();
  const isTerminal =
    (seed.bundleId && KNOWN_TERMINAL_BUNDLE_IDS.has(seed.bundleId)) ||
    TERMINAL_NAME_HINTS.some((hint) => normalizedName.includes(hint));

  return isTerminal
    ? { kind: "terminal", launcherType: "terminal-session" }
    : { kind: "desktop", launcherType: "open-only" };
}

export function normalizeConfiguredApp(input: unknown): ConfiguredApp | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const candidate = input as Partial<ConfiguredApp>;
  if (
    typeof candidate.id !== "string" ||
    typeof candidate.name !== "string" ||
    typeof candidate.kind !== "string" ||
    typeof candidate.launcherType !== "string" ||
    typeof candidate.isDefault !== "boolean" ||
    typeof candidate.createdAt !== "string" ||
    typeof candidate.updatedAt !== "string"
  ) {
    return null;
  }

  const name = candidate.name.trim();
  if (!name) {
    return null;
  }

  if (candidate.kind !== "desktop" && candidate.kind !== "terminal") {
    return null;
  }

  if (
    candidate.launcherType !== "open-only" &&
    candidate.launcherType !== "terminal-session"
  ) {
    return null;
  }

  const bundleId =
    typeof candidate.bundleId === "string"
      ? candidate.bundleId.trim() || undefined
      : undefined;
  const path =
    typeof candidate.path === "string"
      ? candidate.path.trim() || undefined
      : undefined;

  return {
    id: candidate.id,
    name,
    bundleId,
    path,
    kind: candidate.kind,
    launcherType: candidate.launcherType,
    isDefault: candidate.isDefault,
    createdAt: candidate.createdAt,
    updatedAt: candidate.updatedAt,
  };
}

export function getConfiguredAppIdentityKey(
  app: Pick<ConfiguredApp, "bundleId" | "path" | "name">,
): string {
  return (app.bundleId || app.path || app.name).trim().toLowerCase();
}

export function getDefaultConfiguredApp(
  apps: ConfiguredApp[],
): ConfiguredApp | undefined {
  return apps.find((app) => app.isDefault);
}

export function sortInstalledApplications(
  applications: Application[],
): Application[] {
  return [...applications].sort((left, right) =>
    left.name.localeCompare(right.name),
  );
}

export function getOpenTargetForApp(app: ConfiguredApp): string {
  return app.bundleId || app.path || app.name;
}

export function buildConfiguredAppSeed(application: Application) {
  const inferred = inferAppCapabilities({
    name: application.name,
    bundleId: application.bundleId,
  });

  return {
    name: application.name,
    bundleId: application.bundleId ?? "",
    path: application.path,
    kind: inferred.kind,
    launcherType: inferred.launcherType,
  };
}
