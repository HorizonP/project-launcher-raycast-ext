import { open } from "@raycast/api";

import { getOpenTargetForApp } from "../apps";
import type { ConfiguredApp, LaunchRequest } from "../types";

export const OpenOnlyLauncher = {
  canHandle() {
    return true;
  },
  async launch(app: ConfiguredApp, request: LaunchRequest) {
    await open(request.path, getOpenTargetForApp(app));
  },
};
