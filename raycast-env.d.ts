/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `open-path` command */
  export type OpenPath = ExtensionPreferences & {}
  /** Preferences accessible in the `manage-paths` command */
  export type ManagePaths = ExtensionPreferences & {}
  /** Preferences accessible in the `manage-apps` command */
  export type ManageApps = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `open-path` command */
  export type OpenPath = {}
  /** Arguments passed to the `manage-paths` command */
  export type ManagePaths = {}
  /** Arguments passed to the `manage-apps` command */
  export type ManageApps = {}
}

