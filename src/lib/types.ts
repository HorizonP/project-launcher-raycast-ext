export type AppKind = "desktop" | "terminal";
export type LauncherType = "open-only" | "terminal-session";

export type SavedPath = {
  id: string;
  label: string;
  path: string;
  createdAt: string;
  updatedAt: string;
};

export type ConfiguredApp = {
  id: string;
  name: string;
  bundleId?: string;
  path?: string;
  kind: AppKind;
  launcherType: LauncherType;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RecentLaunch = {
  id: string;
  path: string;
  pathLabel?: string;
  appId: string;
  appNameSnapshot: string;
  launchedAt: string;
  launchCount: number;
};

export type LaunchRequest = {
  path: string;
  appId: string;
  command?: string;
};

export type SearchItem =
  | {
      type: "saved-path";
      savedPath: SavedPath;
    }
  | {
      type: "recent-launch";
      recentLaunch: RecentLaunch;
    }
  | {
      type: "typed-path";
      path: string;
      label: string;
    };

export type PathFormValues = {
  label: string;
  directory: string[];
};

export type AppFormValues = {
  name: string;
  bundleId: string;
  applicationPath: string[];
  kind: AppKind;
  launcherType: LauncherType;
  isDefault: boolean;
};
