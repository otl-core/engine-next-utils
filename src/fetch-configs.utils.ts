/**
 * Batch Configuration Fetching
 * Fetches all configs in a single API call
 */

import { getAPIClient } from "@otl-core/cms-api";
import type { DeploymentConfig } from "@otl-core/cms-types";
import { cache } from "react";

/**
 * Fetch all configurations in a single API call
 * Uses React cache() to deduplicate requests within a single render
 */
export const fetchConfigs = cache(
  async (
    locale?: string,
    headerPresetId?: string,
    footerPresetId?: string
  ): Promise<DeploymentConfig | null> => {
    try {
      const connector = getAPIClient();
      const deploymentId = connector.getDeploymentId();

      const response = await connector.website.fetchConfigs(
        deploymentId,
        locale,
        headerPresetId,
        footerPresetId
      );

      if (response.success && response.data) {
        return response.data;
      }
    } catch (error) {
      if (error instanceof Error) {
        const is403or404 =
          error.message.includes("403") || error.message.includes("404");
        if (!is403or404) {
          console.error("[fetchConfigs] Unexpected error:", error);
        }
      }
    }

    return null;
  }
);
