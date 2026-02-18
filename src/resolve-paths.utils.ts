/**
 * Path Resolver Utility
 * Helper functions for path resolution in the engine
 */

import {
  getAPIClient,
  type AllPathsResponse,
  type PathResolutionResponse,
} from "@otl-core/cms-api";
import { cache } from "react";

function getDeploymentId(): string {
  const backend = getAPIClient();
  return backend.getDeploymentId();
}

/**
 * Resolve a single path
 * Uses React cache() to deduplicate requests within a single render
 */
export const resolvePath = cache(
  async (
    path: string,
    locale: string = "en",
    options?: {
      fetchContent?: boolean;
      mode?: "default" | "all";
      page?: number;
      perPage?: number;
      searchQuery?: string;
    }
  ): Promise<PathResolutionResponse> => {
    const backend = getAPIClient();
    const response = await backend.website.resolvePath(
      getDeploymentId(),
      path,
      locale,
      options
    );

    if (!response.success || !response.data) {
      throw new Error(`Failed to resolve path: ${path}`);
    }

    return response.data;
  }
);

/**
 * Resolve multiple paths in batch
 */
export async function resolvePaths(
  paths: string[],
  locale: string = "en",
  fetchContent: boolean = false
): Promise<PathResolutionResponse[]> {
  const backend = getAPIClient();
  const response = await backend.website.resolvePaths(
    getDeploymentId(),
    paths,
    locale,
    fetchContent
  );

  if (!response.success || !response.data) {
    throw new Error("Failed to resolve paths");
  }

  return response.data.results;
}

/**
 * Fetch all paths for the deployment (for sitemap/SSG)
 */
export async function fetchAllPaths(
  locale: string = "en",
  options?: {
    limit?: number;
    offset?: number;
  }
): Promise<AllPathsResponse> {
  const backend = getAPIClient();
  const response = await backend.website.fetchAllPaths(
    getDeploymentId(),
    locale,
    options
  );

  if (!response.success || !response.data) {
    throw new Error("Failed to get all paths");
  }

  return response.data;
}

/**
 * Handle resolved path and return appropriate response
 */
export function handlePathResolution(resolution: PathResolutionResponse): {
  type: string;
  action: "render" | "redirect" | "notfound";
  data?: unknown;
  redirectTo?: string;
  statusCode?: number;
} {
  switch (resolution.type) {
    case "redirect":
      return {
        type: "redirect",
        action: "redirect",
        redirectTo:
          resolution.redirect?.to_path || resolution.redirect?.to_url || "/",
        statusCode: resolution.status_code || 301,
      };

    case "not_found":
      return {
        type: "not_found",
        action: "notfound",
      };

    case "page":
    case "blog_post":
    case "blog_category":
      return {
        type: resolution.type,
        action: "render",
        data: resolution.content || { id: resolution.content_id },
      };

    case "multiple": {
      const primaryType = resolution.all_matches?.primary_match;
      if (primaryType === "redirect" && resolution.all_matches?.redirect) {
        const redirect = resolution.all_matches.redirect as Record<
          string,
          unknown
        >;
        return {
          type: "redirect",
          action: "redirect",
          redirectTo: (redirect.to_path as string) || "/",
          statusCode: (redirect.status_code as number) || 301,
        };
      }
      return {
        type: primaryType || "page",
        action: "render",
        data: resolution.all_matches,
      };
    }

    default:
      return {
        type: "unknown",
        action: "notfound",
      };
  }
}

/**
 * Check if a path exists (without fetching content)
 */
export async function pathExists(
  path: string,
  locale: string = "en"
): Promise<boolean> {
  try {
    const resolution = await resolvePath(path, locale);
    return resolution.type !== "not_found";
  } catch {
    return false;
  }
}

/**
 * Fetch the content type for a path
 */
export async function fetchPathContentType(
  path: string,
  locale: string = "en"
): Promise<string | null> {
  try {
    const resolution = await resolvePath(path, locale);
    return resolution.type !== "not_found" ? resolution.type : null;
  } catch {
    return null;
  }
}

/**
 * Generate sitemap data
 */
export async function generateSitemapData(
  locale: string = "en",
  limit: number = 1000
): Promise<{ path: string; type: string }[]> {
  const allPaths: { path: string; type: string }[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const response = await fetchAllPaths(locale, { limit, offset });

    allPaths.push(
      ...response.paths
        .filter(p => p.content_type !== "redirect")
        .map(p => ({
          path: p.path,
          type: p.content_type,
        }))
    );

    hasMore = response.pagination.has_next;
    offset += limit;
  }

  return allPaths;
}
