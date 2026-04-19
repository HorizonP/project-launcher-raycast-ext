import type { ConfiguredApp, LaunchRequest } from "../types";
import { OpenOnlyLauncher } from "./openOnlyLauncher";
import { TerminalCommandLauncher } from "./terminalCommandLauncher";

export type LaunchExecutor = {
  canHandle(app: ConfiguredApp, request: LaunchRequest): boolean;
  launch(app: ConfiguredApp, request: LaunchRequest): Promise<void>;
};

const executors: LaunchExecutor[] = [TerminalCommandLauncher, OpenOnlyLauncher];

export function getLaunchExecutor(
  app: ConfiguredApp,
  request: LaunchRequest,
): LaunchExecutor {
  const executor = executors.find((candidate) =>
    candidate.canHandle(app, request),
  );
  if (!executor) {
    throw new Error(`No launcher is configured for ${app.name}.`);
  }

  return executor;
}
