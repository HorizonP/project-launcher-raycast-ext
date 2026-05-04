import { existsSync, lstatSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import {
  basename,
  dirname,
  isAbsolute,
  join,
  normalize,
  resolve,
} from "node:path";

const DIRECTORY_QUERY_PREFIXES = ["~", "/"];

function expandHome(input: string): string {
  return input === "~" || input.startsWith("~/")
    ? `${homedir()}${input.slice(1)}`
    : input;
}

export function normalizePath(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    return "";
  }

  const expandedHome = expandHome(trimmed);
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

export function resolveTypedPathCandidates(query: string, limit = 8): string[] {
  if (!looksLikeDirectoryQuery(query)) {
    return [];
  }

  const trimmed = query.trim();
  const normalizedPath = normalizePath(query);
  const exactCandidate = isExistingDirectory(normalizedPath)
    ? normalizedPath
    : undefined;
  const expandedQuery = expandHome(trimmed);
  const queryEndsWithSeparator = trimmed.endsWith("/");
  const parentPath = queryEndsWithSeparator
    ? normalizedPath
    : normalizePath(dirname(expandedQuery));
  const segmentPrefix = queryEndsWithSeparator ? "" : basename(expandedQuery);
  const suggestedCandidates = listDirectChildDirectoryCandidates(
    parentPath,
    segmentPrefix,
    limit,
  );

  return dedupeCandidates([
    ...(exactCandidate ? [exactCandidate] : []),
    ...suggestedCandidates,
  ]).slice(0, limit);
}

export function resolveTypedPathCandidate(query: string): string | undefined {
  return resolveTypedPathCandidates(query, 1)[0];
}

export function getCompletedPathQuery(query: string, path: string): string {
  const trimmedQuery = query.trim();
  const normalizedPath = normalizePath(path);

  if (
    trimmedQuery &&
    normalizePath(trimmedQuery) === normalizedPath &&
    !trimmedQuery.endsWith("/")
  ) {
    return normalizedPath === "/" ? normalizedPath : `${normalizedPath}/`;
  }

  if (
    trimmedQuery &&
    normalizePath(trimmedQuery) === normalizedPath &&
    trimmedQuery.endsWith("/")
  ) {
    return trimmedQuery;
  }

  return normalizedPath;
}

function listDirectChildDirectoryCandidates(
  parentPath: string,
  segmentPrefix: string,
  limit: number,
): string[] {
  try {
    if (!parentPath || !isExistingDirectory(parentPath)) {
      return [];
    }

    const normalizedPrefix = segmentPrefix.toLowerCase();
    return readdirSync(parentPath, { withFileTypes: true })
      .filter(
        (entry) =>
          entry.isDirectory() &&
          entry.name.toLowerCase().startsWith(normalizedPrefix),
      )
      .map((entry) => join(parentPath, entry.name))
      .sort((left, right) =>
        getPathLabelFromPath(left).localeCompare(getPathLabelFromPath(right)),
      )
      .slice(0, limit);
  } catch {
    return [];
  }
}

function dedupeCandidates(candidates: string[]): string[] {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    if (seen.has(candidate)) {
      return false;
    }

    seen.add(candidate);
    return true;
  });
}
