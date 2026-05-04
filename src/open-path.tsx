import {
  Action,
  ActionPanel,
  Icon,
  LaunchType,
  List,
  Toast,
  launchCommand,
  showInFinder,
  showToast,
  updateCommandMetadata,
} from "@raycast/api";
import { useCallback, useEffect, useMemo, useState } from "react";

import { PathForm } from "./components/PathForm";
import { launchPathWithApp, launchPathWithDefaultApp } from "./lib/launch";
import { getCompletedPathQuery, resolveTypedPathCandidates } from "./lib/paths";
import { getRecentLaunchDisplay } from "./lib/recent-launch-display";
import { buildSearchItems } from "./lib/search";
import {
  getConfiguredApps,
  getRecentLaunches,
  getSavedPaths,
  removeRecentLaunch,
  removeSavedPath,
} from "./lib/storage";
import type {
  ConfiguredApp,
  RecentLaunch,
  SavedPath,
  SearchItem,
} from "./lib/types";

type LaunchActionOptions = {
  path: string;
  pathLabel?: string;
  appId?: string;
};

const OPEN_PATH_NAVIGATION_TITLE = "Open Path · Tab to Complete";

export default function OpenPathCommand() {
  const [savedPaths, setSavedPaths] = useState<SavedPath[]>([]);
  const [configuredApps, setConfiguredApps] = useState<ConfiguredApp[]>([]);
  const [recentLaunches, setRecentLaunches] = useState<RecentLaunch[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      const [nextSavedPaths, nextApps, nextRecentLaunches] = await Promise.all([
        getSavedPaths(),
        getConfiguredApps(),
        getRecentLaunches(),
      ]);
      setSavedPaths(nextSavedPaths);
      setConfiguredApps(nextApps);
      setRecentLaunches(nextRecentLaunches);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    void updateCommandMetadata({ subtitle: "Tab completes path" });
  }, []);

  const typedPathCandidates = useMemo(
    () => resolveTypedPathCandidates(query),
    [query],
  );
  const searchItems = useMemo(
    () =>
      buildSearchItems({
        query,
        savedPaths,
        recentLaunches,
        typedPathCandidates,
      }),
    [query, recentLaunches, savedPaths, typedPathCandidates],
  );

  async function handleLaunch(options: LaunchActionOptions) {
    try {
      if (options.appId) {
        await launchPathWithApp(
          { path: options.path, appId: options.appId },
          { pathLabel: options.pathLabel },
        );
      } else {
        await launchPathWithDefaultApp(options.path, {
          pathLabel: options.pathLabel,
        });
      }
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Could not open path",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async function handleReveal(path: string) {
    try {
      await showInFinder(path);
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Could not reveal path",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async function handleRemoveRecent(recentLaunch: RecentLaunch) {
    await removeRecentLaunch(recentLaunch.id);
    await reload();
    await showToast({
      style: Toast.Style.Success,
      title: "Removed from recents",
    });
  }

  async function handleRemoveSavedPath(savedPath: SavedPath) {
    await removeSavedPath(savedPath.id);
    await reload();
    await showToast({
      style: Toast.Style.Success,
      title: "Removed saved path",
    });
  }

  function renderOpenWithActions(
    path: string,
    pathLabel?: string,
    excludeAppId?: string,
  ) {
    return configuredApps
      .filter((app) => app.id !== excludeAppId)
      .map((app) => (
        <Action
          key={app.id}
          title={`Open With ${app.name}`}
          icon={
            app.path ||
            (app.kind === "terminal" ? Icon.Terminal : Icon.AppWindow)
          }
          onAction={() => handleLaunch({ path, pathLabel, appId: app.id })}
        />
      ));
  }

  function renderCompletePathAction(path: string) {
    return (
      <Action
        title="Complete Path"
        icon={Icon.TextCursor}
        shortcut={{ modifiers: [], key: "tab" }}
        onAction={() => setQuery(getCompletedPathQuery(query, path))}
      />
    );
  }

  function renderActionsForItem(item: SearchItem) {
    if (item.type === "saved-path") {
      return (
        <ActionPanel>
          <Action
            title="Open"
            icon={Icon.AppWindow}
            onAction={() =>
              handleLaunch({
                path: item.savedPath.path,
                pathLabel: item.savedPath.label,
              })
            }
          />
          <Action
            title="Open With Default App"
            icon={Icon.Star}
            onAction={() =>
              handleLaunch({
                path: item.savedPath.path,
                pathLabel: item.savedPath.label,
              })
            }
          />
          {renderOpenWithActions(item.savedPath.path, item.savedPath.label)}
          {renderCompletePathAction(item.savedPath.path)}
          <Action.Push
            title="Edit Path"
            icon={Icon.Pencil}
            target={<PathForm savedPath={item.savedPath} onDidSave={reload} />}
          />
          <Action
            title="Remove Saved Path"
            icon={Icon.Trash}
            style={Action.Style.Destructive}
            onAction={() => handleRemoveSavedPath(item.savedPath)}
          />
          <Action
            title="Reveal in Finder"
            icon={Icon.Eye}
            onAction={() => handleReveal(item.savedPath.path)}
          />
          <Action.CopyToClipboard
            title="Copy Path"
            content={item.savedPath.path}
          />
        </ActionPanel>
      );
    }

    if (item.type === "recent-launch") {
      return (
        <ActionPanel>
          <Action
            title="Open Again"
            icon={Icon.Repeat}
            onAction={() =>
              handleLaunch({
                path: item.recentLaunch.path,
                pathLabel: item.recentLaunch.pathLabel,
                appId: item.recentLaunch.appId,
              })
            }
          />
          <Action
            title="Open With Default App"
            icon={Icon.Star}
            onAction={() =>
              handleLaunch({
                path: item.recentLaunch.path,
                pathLabel: item.recentLaunch.pathLabel,
              })
            }
          />
          {renderOpenWithActions(
            item.recentLaunch.path,
            item.recentLaunch.pathLabel,
            item.recentLaunch.appId,
          )}
          {renderCompletePathAction(item.recentLaunch.path)}
          <Action.Push
            title="Save Path"
            icon={Icon.Plus}
            target={
              <PathForm
                initialPath={item.recentLaunch.path}
                initialLabel={item.recentLaunch.pathLabel}
                onDidSave={reload}
              />
            }
          />
          <Action
            title="Remove From Recent"
            icon={Icon.Trash}
            style={Action.Style.Destructive}
            onAction={() => handleRemoveRecent(item.recentLaunch)}
          />
          <Action
            title="Reveal in Finder"
            icon={Icon.Eye}
            onAction={() => handleReveal(item.recentLaunch.path)}
          />
          <Action.CopyToClipboard
            title="Copy Path"
            content={item.recentLaunch.path}
          />
        </ActionPanel>
      );
    }

    return (
      <ActionPanel>
        <Action
          title="Open With Default App"
          icon={Icon.Star}
          onAction={() =>
            handleLaunch({ path: item.path, pathLabel: item.label })
          }
        />
        {renderOpenWithActions(item.path, item.label)}
        {renderCompletePathAction(item.path)}
        <Action.Push
          title="Save Path"
          icon={Icon.Plus}
          target={
            <PathForm
              initialPath={item.path}
              initialLabel={item.label}
              onDidSave={reload}
            />
          }
        />
        <Action
          title="Reveal in Finder"
          icon={Icon.Eye}
          onAction={() => handleReveal(item.path)}
        />
      </ActionPanel>
    );
  }

  if (!isLoading && configuredApps.length === 0) {
    return (
      <List navigationTitle={OPEN_PATH_NAVIGATION_TITLE}>
        <List.EmptyView
          icon={Icon.AppWindow}
          title="No apps configured"
          description="Add a few apps first so the launcher knows where to open your project paths."
          actions={
            <ActionPanel>
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
      </List>
    );
  }

  return (
    <List
      isLoading={isLoading}
      filtering={false}
      navigationTitle={OPEN_PATH_NAVIGATION_TITLE}
      searchBarPlaceholder="Search saved paths, recent launches, or type a directory path..."
      searchText={query}
      onSearchTextChange={setQuery}
    >
      {searchItems.length === 0 ? (
        <List.EmptyView
          icon={Icon.Folder}
          title={
            savedPaths.length === 0 && recentLaunches.length === 0
              ? "No paths yet"
              : "No matching paths"
          }
          description={
            savedPaths.length === 0 && recentLaunches.length === 0
              ? "Save a project path, or type a real directory like ~/Projects/example."
              : "Try a label, basename, full path, or an existing directory path."
          }
          actions={
            <ActionPanel>
              <Action.Push
                title="Save Path"
                icon={Icon.Plus}
                target={
                  <PathForm
                    initialPath={typedPathCandidates[0]}
                    onDidSave={reload}
                  />
                }
              />
              <Action
                title="Manage Paths"
                icon={Icon.Folder}
                onAction={() =>
                  launchCommand({
                    name: "manage-paths",
                    type: LaunchType.UserInitiated,
                  })
                }
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
        searchItems.map((item) => {
          if (item.type === "saved-path") {
            return (
              <List.Item
                key={`saved-${item.savedPath.id}`}
                icon={Icon.Folder}
                title={item.savedPath.label}
                subtitle={item.savedPath.path}
                actions={renderActionsForItem(item)}
              />
            );
          }

          if (item.type === "recent-launch") {
            const display = getRecentLaunchDisplay(
              item.recentLaunch,
              configuredApps,
            );

            return (
              <List.Item
                key={`recent-${item.recentLaunch.id}`}
                icon={display.icon}
                title={item.recentLaunch.pathLabel || item.recentLaunch.path}
                subtitle={`${item.recentLaunch.appNameSnapshot} • ${item.recentLaunch.path}`}
                accessories={[
                  ...(display.appAccessoryIcon
                    ? [
                        {
                          icon: display.appAccessoryIcon,
                          tooltip: display.appAccessoryTooltip,
                        } as List.Item.Accessory,
                      ]
                    : []),
                  { text: display.launchCountText },
                ]}
                actions={renderActionsForItem(item)}
              />
            );
          }

          return (
            <List.Item
              key={`typed-${item.path}`}
              icon={Icon.Terminal}
              title={item.label}
              subtitle={item.path}
              accessories={[{ tag: "Typed Path" }]}
              actions={renderActionsForItem(item)}
            />
          );
        })
      )}
    </List>
  );
}
