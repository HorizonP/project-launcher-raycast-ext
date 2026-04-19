import type { ConfiguredApp, LaunchRequest } from "../types";

export const TerminalCommandLauncher = {
  canHandle(app: ConfiguredApp, request: LaunchRequest) {
    return (
      app.launcherType === "terminal-session" &&
      Boolean(request.command?.trim())
    );
  },
  async launch() {
    throw new Error("Terminal command execution is not implemented yet.");
  },
};
