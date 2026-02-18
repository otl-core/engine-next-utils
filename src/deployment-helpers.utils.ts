/**
 * Deployment validation and site context utilities.
 *
 * These provide properly typed, cast-free access to deployment configuration
 * and resolved content. The engine page routes use these instead of manually
 * casting `Record<string, unknown>` everywhere.
 */

import type {
  Deployment,
  DeploymentConfig,
  FaviconConfig,
  FooterConfig,
  HeaderConfig,
  LocalizedString,
  WebsiteConfig,
} from "@otl-core/cms-types";
import { buildHreflangAlternates, localeToOgFormat } from "@otl-core/cms-utils";
import type {
  ResolvedBlogListingContent,
  ResolvedBlogPostContent,
  ResolvedPageContent,
} from "./resolved-content.types";

/**
 * A `DeploymentConfig` where all essential fields are guaranteed present.
 * Extends `DeploymentConfig` so optional fields (theme, analytics, colors,
 * fonts, preset meta) remain accessible without additional casts.
 */
export interface ValidatedDeploymentConfig extends DeploymentConfig {
  deployment: Deployment & {
    supported_locales: string[];
    default_locale: string;
  };
  website: WebsiteConfig;
  header: HeaderConfig;
  footer: FooterConfig;
  favicon: FaviconConfig;
}

/**
 * Type guard that checks whether a `DeploymentConfig` has all the fields
 * required for the engine to render a page.
 */
export function isValidDeployment(
  configs: DeploymentConfig | null | undefined
): configs is ValidatedDeploymentConfig {
  if (!configs) return false;
  if (Object.keys(configs).length === 0) return false;
  if (
    !configs.deployment ||
    !configs.website ||
    !configs.header ||
    !configs.footer ||
    !configs.favicon
  )
    return false;
  if (
    !configs.deployment.supported_locales ||
    !configs.deployment.default_locale
  )
    return false;
  return true;
}

/**
 * Detect which supported locale the first URL segment refers to.
 *
 * Returns `{ locale, path, localeIndex }`.
 * If no locale prefix is found, the deployment's default locale is used.
 */
export function resolveLocaleFromSegments(
  segments: string[],
  fullPath: string,
  deployment: ValidatedDeploymentConfig["deployment"]
): { locale: string; path: string } {
  const { supported_locales: supportedLocales, default_locale: defaultLocale } =
    deployment;
  const normalised = supportedLocales.map(l => l.toLowerCase());
  const first = segments[0]?.toLowerCase();
  const idx = normalised.indexOf(first);

  if (idx !== -1) {
    const restPath = "/" + segments.slice(1).join("/");
    return { locale: supportedLocales[idx], path: restPath || "/" };
  }

  return { locale: defaultLocale, path: fullPath };
}

/** All the site-level information required for metadata generation. */
export interface SiteContext {
  siteUrl: string;
  siteName: string;
  siteDescription?: string;
  locale: string;
  ogLocale: string;
  hreflang?: Record<string, string>;
  twitterHandle?: string;
}

/**
 * Build a `SiteContext` from validated deployment configs.
 *
 * This replaces the old `deriveSiteUrl` / `deriveSiteName` /
 * `deriveSiteDescription` calls and the manual `localeToOgFormat` call.
 */
export function buildSiteContext(
  configs: ValidatedDeploymentConfig,
  locale: string,
  path: string,
  siteUrlOverride?: string
): SiteContext {
  const siteUrl = resolveSiteUrl(configs.deployment, siteUrlOverride);
  const { supported_locales, default_locale } = configs.deployment;

  return {
    siteUrl,
    siteName:
      resolveLocalizedField(configs.website.site_name, locale) || "Website",
    siteDescription: resolveLocalizedField(configs.website.description, locale),
    locale,
    ogLocale: localeToOgFormat(locale),
    hreflang: buildHreflangAlternates(
      siteUrl,
      path,
      supported_locales,
      default_locale
    ),
    twitterHandle: configs.website.twitter_handle || undefined,
  };
}

/**
 * Derive the public site origin (no trailing slash) from deployment config.
 */
function resolveSiteUrl(
  deployment: ValidatedDeploymentConfig["deployment"],
  override?: string
): string {
  let url = "";
  if (override) {
    url = override;
  } else if (deployment.custom_domains?.[0]) {
    url = `https://${deployment.custom_domains[0]}`;
  } else {
    url = `https://${deployment.subdomain}.otl.studio`;
  }
  return url.replace(/\/+$/, "");
}

/**
 * Resolve a field that may be a plain string or a `LocalizedString`.
 */
function resolveLocalizedField(
  value: string | LocalizedString | undefined,
  locale: string
): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  return value[locale] || value.en || undefined;
}

/**
 * Parse a raw `Record<string, unknown>` from the path resolution API
 * into a typed `ResolvedPageContent`.
 */
export function parsePageContent(
  raw: Record<string, unknown> | undefined
): ResolvedPageContent | undefined {
  if (!raw) return undefined;
  return raw as unknown as ResolvedPageContent;
}

/**
 * Parse a raw content map into a typed `ResolvedBlogPostContent`.
 */
export function parseBlogPostContent(
  raw: Record<string, unknown> | undefined
): ResolvedBlogPostContent | undefined {
  if (!raw) return undefined;
  return raw as unknown as ResolvedBlogPostContent;
}

/**
 * Parse a raw content map into a typed `ResolvedBlogListingContent`.
 */
export function parseBlogListingContent(
  raw: Record<string, unknown> | undefined
): ResolvedBlogListingContent | undefined {
  if (!raw) return undefined;
  return raw as unknown as ResolvedBlogListingContent;
}
