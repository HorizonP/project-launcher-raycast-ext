import {
  Action,
  ActionPanel,
  Icon,
  LaunchType,
  List,
  Toast,
  confirmAlert,
  launchCommand,
  showInFinder,
  showToast,
} from "@raycast/api";
import { useCallback, useEffect, useState } from "react";

import { PathForm } from "./components/PathForm";
import { launchPathWithDefaultApp } from "./lib/launch";
import { removeSavedPath, getSavedPaths } from "./lib/storage";
import type { SavedPath } from "./lib/types";

export default function ManagePathsCommand() {
  const [savedPaths, setSavedPaths] = useState<SavedPath[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      setSavedPaths(await getSavedPaths());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function handleRemove(savedPath: SavedPath) {
    const confirmed = await confirmAlert({
      title: "Remove saved path?",
      message: savedPath.label,
    });

    if (!confirmed) {
      return;
    }

    await removeSavedPath(savedPath.id);
    await reload();
    await showToast({
      style: Toast.Style.Success,
      title: "Saved path removed",
    });
  }

  async function handleOpen(savedPath: SavedPath) {
    try {
      await launchPathWithDefaultApp(savedPath.path, {
        pathLabel: savedPath.label,
      });
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Could not open path",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async function handleReveal(savedPath: SavedPath) {
    try {
      await showInFinder(savedPath.path);
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Could not reveal path",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return (
    <List
      isLoading={isLoading}
      navigationTitle="Manage Paths"
      searchBarPlaceholder="Search saved paths..."
    >
      {savedPaths.length === 0 ? (
        <List.EmptyView
          icon={Icon.Folder}
          title="No saved paths yet"
          description="Save project folders here, or jump to app setup if you haven't configured any apps yet."
          actions={
            <ActionPanel>
              <Action.Push
                title="Add Path"
                icon={Icon.Plus}
                target={<PathForm onDidSave={reload} />}
              />
              <Action
                title="Manage Apps"
                icon={Icon.AppWindow}
                onAction={() =>
                  launchCommand({
                    name: "manage-apps",
                    type: LaunchType.UserInitiated,
                  })
                }
              />
            </ActionPanel>
          }
        />
      ) : (
        savedPaths.map((savedPath) => (
          <List.Item
            key={savedPath.id}
            icon={Icon.Folder}
            title={savedPath.label}
            subtitle={savedPath.path}
            actions={
              <ActionPanel>
                <Action
                  title="Open With Default App"
                  icon={Icon.AppWindow}
                  onAction={() => handleOpen(savedPath)}
                />
                <Action.Push
                  title="Edit Path"
                  icon={Icon.Pencil}
                  target={<PathForm savedPath={savedPath} onDidSave={reload} />}
                />
                <Action.Push
                  title="Add Path"
                  icon={Icon.Plus}
                  target={<PathForm onDidSave={reload} />}
                />
                <Action
                  title="Reveal in Finder"
                  icon={Icon.Eye}
                  onAction={() => handleReveal(savedPath)}
                />
                <Action.CopyToClipboard
                  title="Copy Path"
                  content={savedPath.path}
                />
                <Action
                  title="Remove Saved Path"
                  icon={Icon.Trash}
                  style={Action.Style.Destructive}
                  onAction={() => handleRemove(savedPath)}
                />
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}
