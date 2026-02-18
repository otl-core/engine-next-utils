/**
 * Website Configuration Helpers
 * Cached accessors for website config values
 */

import type { WebsiteConfig } from "@otl-core/cms-types";
import { getLocalizedString } from "@otl-core/cms-utils";
import { fetchConfigs } from "./fetch-configs.utils";

let websiteConfigCache: WebsiteConfig | null = null;

/**
 * Get website configuration (with caching)
 */
export async function getWebsiteConfig(): Promise<WebsiteConfig | null> {
  if (websiteConfigCache) {
    return websiteConfigCache;
  }

  const configs = await fetchConfigs();

  if (!configs || Object.keys(configs).length === 0 || !configs.website) {
    return null;
  }

  websiteConfigCache = configs.website || null;
  return websiteConfigCache;
}

/**
 * Clear config cache (useful for testing or manual refresh)
 */
export function clearConfigCache(): void {
  websiteConfigCache = null;
}

/**
 * Get site name from config
 */
export async function getSiteName(locale: string = "en"): Promise<string> {
  const config = await getWebsiteConfig();
  if (!config) return "";

  return getLocalizedString(config.site_name, { preferredLocale: locale });
}

/**
 * Get site description from config
 */
export async function getSiteDescription(
  locale: string = "en"
): Promise<string> {
  const config = await getWebsiteConfig();
  if (!config) return "";

  return getLocalizedString(config.description, { preferredLocale: locale });
}

/**
 * Get timezone from config
 */
export async function getTimezone(): Promise<string> {
  const config = await getWebsiteConfig();
  return config?.timezone || "UTC";
}
