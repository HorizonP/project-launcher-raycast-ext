import {
  Action,
  ActionPanel,
  Icon,
  List,
  Toast,
  confirmAlert,
  getApplications,
  showToast,
} from "@raycast/api";
import { useCallback, useEffect, useState } from "react";

import { AppForm } from "./components/AppForm";
import { buildConfiguredAppSeed, sortInstalledApplications } from "./lib/apps";
import {
  getConfiguredApps,
  moveConfiguredApp,
  removeConfiguredApp,
  setDefaultConfiguredApp,
} from "./lib/storage";
import type { ConfiguredApp } from "./lib/types";

function InstalledAppsList(props: {
  configuredApps: ConfiguredApp[];
  onDidSave: () => Promise<void> | void;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [applications, setApplications] = useState<
    Awaited<ReturnType<typeof getApplications>>
  >([]);

  const loadApplications = useCallback(async () => {
    setIsLoading(true);
    try {
      const installedApps = await getApplications();
      setApplications(sortInstalledApplications(installedApps));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  return (
    <List
      isLoading={isLoading}
      navigationTitle="Choose Installed App"
      searchBarPlaceholder="Search installed apps..."
    >
      {applications.map((application) => (
        <List.Item
          key={`${application.bundleId ?? application.path}-${application.name}`}
          icon={application.path}
          title={application.name}
          subtitle={application.bundleId ?? application.path}
          actions={
            <ActionPanel>
              <Action.Push
                title="Configure App"
                icon={Icon.Plus}
                target={
                  <AppForm
                    configuredApps={props.configuredApps}
                    seedApp={buildConfiguredAppSeed(application)}
                    onDidSave={props.onDidSave}
                  />
                }
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

export default function ManageAppsCommand() {
  const [configuredApps, setConfiguredApps] = useState<ConfiguredApp[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      setConfiguredApps(await getConfiguredApps());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function handleSetDefault(app: ConfiguredApp) {
    await setDefaultConfiguredApp(app.id);
    await reload();
    await showToast({
      style: Toast.Style.Success,
      title: `${app.name} is now the default app`,
    });
  }

  async function handleMove(app: ConfiguredApp, direction: "up" | "down") {
    await moveConfiguredApp(app.id, direction);
    await reload();
  }

  async function handleRemove(app: ConfiguredApp) {
    const confirmed = await confirmAlert({
      title: "Remove configured app?",
      message: app.name,
    });

    if (!confirmed) {
      return;
    }

    await removeConfiguredApp(app.id);
    await reload();
    await showToast({ style: Toast.Style.Success, title: "App removed" });
  }

  return (
    <List
      isLoading={isLoading}
      navigationTitle="Manage Apps"
      searchBarPlaceholder="Search configured apps..."
    >
      {configuredApps.length === 0 ? (
        <List.EmptyView
          icon={Icon.AppWindow}
          title="No apps configured yet"
          description="Choose the apps you want to expose in the launcher, then mark one as the default."
          actions={
            <ActionPanel>
              <Action.Push
                title="Add Installed App"
                icon={Icon.Plus}
                target={
                  <InstalledAppsList
                    configuredApps={configuredApps}
                    onDidSave={reload}
                  />
                }
              />
            </ActionPanel>
          }
        />
      ) : (
        configuredApps.map((app, index) => (
          <List.Item
            key={app.id}
            icon={
              app.path ||
              (app.kind === "terminal" ? Icon.Terminal : Icon.AppWindow)
            }
            title={app.name}
            subtitle={app.bundleId ?? app.path}
            accessories={app.isDefault ? [{ tag: "Default" }] : []}
            actions={
              <ActionPanel>
                <Action.Push
                  title="Edit App"
                  icon={Icon.Pencil}
                  target={
                    <AppForm
                      configuredApps={configuredApps}
                      configuredApp={app}
                      onDidSave={reload}
                    />
                  }
                />
                <Action.Push
                  title="Add Installed App"
                  icon={Icon.Plus}
                  target={
                    <InstalledAppsList
                      configuredApps={configuredApps}
                      onDidSave={reload}
                    />
                  }
                />
                {!app.isDefault ? (
                  <Action
                    title="Set as Default App"
                    icon={Icon.Star}
                    onAction={() => handleSetDefault(app)}
                  />
                ) : null}
                {index > 0 ? (
                  <Action
                    title="Move Up"
                    icon={Icon.ArrowUp}
                    onAction={() => handleMove(app, "up")}
                  />
                ) : null}
                {index < configuredApps.length - 1 ? (
                  <Action
                    title="Move Down"
                    icon={Icon.ArrowDown}
                    onAction={() => handleMove(app, "down")}
                  />
                ) : null}
                <Action
                  title="Remove App"
                  icon={Icon.Trash}
                  style={Action.Style.Destructive}
                  onAction={() => handleRemove(app)}
                />
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}
