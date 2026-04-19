import {
  Action,
  ActionPanel,
  Form,
  Icon,
  Toast,
  showToast,
  useNavigation,
} from "@raycast/api";
import { randomUUID } from "node:crypto";

import { upsertConfiguredApp } from "../lib/storage";
import type { AppFormValues, ConfiguredApp } from "../lib/types";

type AppSeed = {
  name: string;
  bundleId?: string;
  path?: string;
  kind: ConfiguredApp["kind"];
  launcherType: ConfiguredApp["launcherType"];
};

type AppFormProps = {
  configuredApp?: ConfiguredApp;
  configuredApps: ConfiguredApp[];
  seedApp?: AppSeed;
  onDidSave?: () => Promise<void> | void;
};

export function AppForm(props: AppFormProps) {
  const { pop } = useNavigation();
  const defaultChecked =
    props.configuredApp?.isDefault ?? props.configuredApps.length === 0;

  async function handleSubmit(values: AppFormValues) {
    try {
      const applicationPath =
        values.applicationPath[0] ||
        props.seedApp?.path ||
        props.configuredApp?.path;

      await upsertConfiguredApp({
        id: props.configuredApp?.id ?? randomUUID(),
        name: values.name.trim(),
        bundleId: values.bundleId.trim() || undefined,
        path: applicationPath || undefined,
        kind: values.kind,
        launcherType: values.launcherType,
        isDefault: values.isDefault,
      });

      await props.onDidSave?.();
      await showToast({
        style: Toast.Style.Success,
        title: props.configuredApp ? "App updated" : "App added",
      });
      pop();
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: props.configuredApp ? "Could not save app" : "Could not add app",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return (
    <Form
      navigationTitle={props.configuredApp ? "Edit App" : "Add App"}
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title={props.configuredApp ? "Update App" : "Add App"}
            icon={Icon.Checkmark}
            onSubmit={handleSubmit}
          />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="name"
        title="Name"
        placeholder="Visual Studio Code"
        defaultValue={props.configuredApp?.name ?? props.seedApp?.name ?? ""}
      />
      <Form.TextField
        id="bundleId"
        title="Bundle ID"
        placeholder="com.microsoft.VSCode"
        defaultValue={
          props.configuredApp?.bundleId ?? props.seedApp?.bundleId ?? ""
        }
      />
      <Form.FilePicker
        id="applicationPath"
        title="Application"
        allowMultipleSelection={false}
        canChooseDirectories
        canChooseFiles={false}
        defaultValue={
          props.configuredApp?.path
            ? [props.configuredApp.path]
            : props.seedApp?.path
              ? [props.seedApp.path]
              : []
        }
      />
      <Form.Dropdown
        id="kind"
        title="Kind"
        defaultValue={
          props.configuredApp?.kind ?? props.seedApp?.kind ?? "desktop"
        }
      >
        <Form.Dropdown.Item
          value="desktop"
          title="Desktop"
          icon={Icon.AppWindow}
        />
        <Form.Dropdown.Item
          value="terminal"
          title="Terminal"
          icon={Icon.Terminal}
        />
      </Form.Dropdown>
      <Form.Dropdown
        id="launcherType"
        title="Launcher Type"
        defaultValue={
          props.configuredApp?.launcherType ??
          props.seedApp?.launcherType ??
          "open-only"
        }
      >
        <Form.Dropdown.Item
          value="open-only"
          title="Open Only"
          icon={Icon.AppWindow}
        />
        <Form.Dropdown.Item
          value="terminal-session"
          title="Terminal Session"
          icon={Icon.Terminal}
        />
      </Form.Dropdown>
      <Form.Checkbox
        id="isDefault"
        title="Default App"
        label="Use as the default launch target"
        defaultValue={defaultChecked}
      />
    </Form>
  );
}
