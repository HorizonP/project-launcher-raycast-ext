import { existsSync, lstatSync } from "node:fs";
import { homedir } from "node:os";
import { basename, isAbsolute, normalize, resolve } from "node:path";

const DIRECTORY_QUERY_PREFIXES = ["~", "/"];

export function normalizePath(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    return "";
  }

  const expandedHome =
    trimmed === "~" || trimmed.startsWith("~/")
      ? `${homedir()}${trimmed.slice(1)}`
      : trimmed;
  const absolutePath = isAbsolute(expandedHome)
    ? expandedHome
    : resolve(expandedHome);
  const normalizedPath = normalize(absolutePath);

  return stripTrailingSeparator(normalizedPath);
}

export function stripTrailingSeparator(input: string): string {
  if (input.length <= 1) {
    return input;
  }

  return input.replace(/\/+$/, "") || "/";
}

export function getPathLabelFromPath(input: string): string {
  const normalizedPath = normalizePath(input);
  return basename(normalizedPath) || normalizedPath;
}

export function isExistingDirectory(input: string): boolean {
  try {
    const normalizedPath = normalizePath(input);
    return (
      Boolean(normalizedPath) &&
      existsSync(normalizedPath) &&
      lstatSync(normalizedPath).isDirectory()
    );
  } catch {
    return false;
  }
}

export function looksLikeDirectoryQuery(input: string): boolean {
  const trimmed = input.trim();
  return DIRECTORY_QUERY_PREFIXES.some((prefix) => trimmed.startsWith(prefix));
}

export function resolveTypedPathCandidate(query: string): string | undefined {
  if (!looksLikeDirectoryQuery(query)) {
    return undefined;
  }

  const normalizedPath = normalizePath(query);
  return isExistingDirectory(normalizedPath) ? normalizedPath : undefined;
}
