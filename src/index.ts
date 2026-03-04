/**
 * @otl-core/engine-next-utils
 * Next.js server-side utilities for OTL CMS engine.
 *
 * This package is enforced server-only via the `server-only` package.
 * Engine users should not need to modify these utilities.
 */

import "server-only";

// Collection data fetching
export {
  fetchCollections,
  fetchEntries,
  fetchEntry,
  fetchCategories,
} from "./fetch-collections.utils";

// Configuration fetching
export { fetchConfigs } from "./fetch-configs.utils";

// Path resolution
export {
  resolvePath,
  resolvePaths,
  fetchAllPaths,
  handlePathResolution,
  pathExists,
  fetchPathContentType,
  generateSitemapData,
} from "./resolve-paths.utils";

// Website config helpers
export {
  getWebsiteConfig,
  getSiteName,
  getSiteDescription,
  getTimezone,
  clearConfigCache,
} from "./website-config.utils";

// Password verification
export { hasValidPasswordCookie } from "./password-check.utils";

// A/B/n resolver (Next.js-specific + re-exports from cms-utils)
export {
  getABnBucket,
  isMultivariateContent,
  resolveEntryVariant,
  resolveFormVariantsInSections,
  resolvePageVariant,
  selectVariant,
} from "./abn-resolver.utils";

export type {
  MultivariateFormBlockData,
  MultivariatePageContent,
  VariantConfig,
} from "./abn-resolver.utils";

// Locale detection (server-side)
export { detectLocaleFromRequest } from "./detect-locale-server.utils";

// Site validation & site context
export {
  isValidSite,
  resolveLocaleFromSegments,
  buildSiteContext,
  parsePageContent,
  parseEntryContent,
  parseListingContent,
} from "./site-helpers.utils";

export type { ValidatedSiteConfig, SiteContext } from "./site-helpers.utils";

// Resolved content types
export type {
  ResolvedPageContent,
  ResolvedEntryContent,
  ResolvedListingContent,
  ResolvedContent,
} from "./resolved-content.types";
