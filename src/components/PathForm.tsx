import {
  Action,
  ActionPanel,
  Form,
  Icon,
  Toast,
  showToast,
  useNavigation,
} from "@raycast/api";

import { getPathLabelFromPath, isExistingDirectory } from "../lib/paths";
import { upsertSavedPath } from "../lib/storage";
import type { PathFormValues, SavedPath } from "../lib/types";

type PathFormProps = {
  savedPath?: SavedPath;
  initialLabel?: string;
  initialPath?: string;
  onDidSave?: () => Promise<void> | void;
};

export function PathForm(props: PathFormProps) {
  const { pop } = useNavigation();

  async function handleSubmit(values: PathFormValues) {
    try {
      const directory = values.directory[0];
      if (!directory || !isExistingDirectory(directory)) {
        throw new Error("Choose an existing directory before saving.");
      }

      await upsertSavedPath({
        id: props.savedPath?.id,
        label: values.label.trim() || getPathLabelFromPath(directory),
        path: directory,
      });

      await props.onDidSave?.();
      await showToast({
        style: Toast.Style.Success,
        title: props.savedPath ? "Path updated" : "Path saved",
      });
      pop();
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: props.savedPath ? "Could not save path" : "Could not add path",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return (
    <Form
      navigationTitle={props.savedPath ? "Edit Path" : "Save Path"}
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title={props.savedPath ? "Update Path" : "Save Path"}
            icon={Icon.Checkmark}
            onSubmit={handleSubmit}
          />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="label"
        title="Label"
        placeholder="My Project"
        defaultValue={props.savedPath?.label ?? props.initialLabel ?? ""}
      />
      <Form.FilePicker
        id="directory"
        title="Directory"
        allowMultipleSelection={false}
        canChooseDirectories
        canChooseFiles={false}
        defaultValue={
          props.savedPath?.path
            ? [props.savedPath.path]
            : props.initialPath
              ? [props.initialPath]
              : []
        }
      />
    </Form>
  );
}
