import { closeMainWindow } from "@raycast/api";
import { stat } from "node:fs/promises";

import { getDefaultConfiguredApp } from "./apps";
import { getLaunchExecutor } from "./launchers";
import { normalizePath } from "./paths";
import { getConfiguredApps, recordRecentLaunch } from "./storage";
import type { ConfiguredApp, LaunchRequest } from "./types";

export class LaunchConfigurationError extends Error {}

async function ensureDirectoryExists(path: string): Promise<void> {
  const result = await stat(path).catch(() => undefined);
  if (!result?.isDirectory()) {
    throw new LaunchConfigurationError("That directory no longer exists.");
  }
}

async function resolveConfiguredApp(appId: string): Promise<ConfiguredApp> {
  const apps = await getConfiguredApps();
  const app = apps.find((candidate) => candidate.id === appId);
  if (!app) {
    throw new LaunchConfigurationError("That app is no longer configured.");
  }

  return app;
}

export async function launchPathWithApp(
  request: LaunchRequest,
  options?: { pathLabel?: string; clearRootSearch?: boolean },
): Promise<ConfiguredApp> {
  const normalizedPath = normalizePath(request.path);
  if (!normalizedPath) {
    throw new LaunchConfigurationError("Choose a valid directory path.");
  }

  const app = await resolveConfiguredApp(request.appId);
  await ensureDirectoryExists(normalizedPath);

  const executor = getLaunchExecutor(app, { ...request, path: normalizedPath });
  await closeMainWindow({ clearRootSearch: options?.clearRootSearch ?? true });
  await executor.launch(app, { ...request, path: normalizedPath });
  await recordRecentLaunch({
    path: normalizedPath,
    pathLabel: options?.pathLabel,
    appId: app.id,
    appNameSnapshot: app.name,
  });

  return app;
}

export async function launchPathWithDefaultApp(
  path: string,
  options?: { pathLabel?: string; clearRootSearch?: boolean },
): Promise<ConfiguredApp> {
  const apps = await getConfiguredApps();
  const defaultApp = getDefaultConfiguredApp(apps);
  if (!defaultApp) {
    throw new LaunchConfigurationError(
      "Set a default app in Manage Apps before using the default launch action.",
    );
  }

  return launchPathWithApp(
    {
      path,
      appId: defaultApp.id,
    },
    options,
  );
}
