/**
 * Site validation and site context utilities.
 *
 * These provide properly typed, cast-free access to site configuration
 * and resolved content. The engine page routes use these instead of manually
 * casting `Record<string, unknown>` everywhere.
 */

import type {
  Site,
  SiteConfig,
  FaviconConfig,
  FooterConfig,
  HeaderConfig,
  LocalizedString,
  WebsiteConfig,
} from "@otl-core/cms-types";
import { buildHreflangAlternates, localeToOgFormat } from "@otl-core/cms-utils";
import type {
  ResolvedListingContent,
  ResolvedEntryContent,
  ResolvedPageContent,
} from "./resolved-content.types";

/**
 * A `SiteConfig` where all essential fields are guaranteed present.
 * Extends `SiteConfig` so optional fields (theme, analytics, colors,
 * fonts, preset meta) remain accessible without additional casts.
 */
export interface ValidatedSiteConfig extends SiteConfig {
  site: Site & {
    supported_locales: string[];
    default_locale: string;
  };
  website: WebsiteConfig;
  header: HeaderConfig;
  footer: FooterConfig;
  favicon: FaviconConfig;
}

/**
 * Type guard that checks whether a `SiteConfig` has all the fields
 * required for the engine to render a page.
 */
export function isValidSite(
  configs: SiteConfig | null | undefined,
): configs is ValidatedSiteConfig {
  if (!configs) return false;
  if (Object.keys(configs).length === 0) return false;
  if (
    !configs.site ||
    !configs.website ||
    !configs.header ||
    !configs.footer ||
    !configs.favicon
  )
    return false;
  if (!configs.site.supported_locales || !configs.site.default_locale)
    return false;
  return true;
}

/**
 * Detect which supported locale the first URL segment refers to.
 *
 * Returns `{ locale, path, localeIndex }`.
 * If no locale prefix is found, the site's default locale is used.
 */
export function resolveLocaleFromSegments(
  segments: string[],
  fullPath: string,
  site: ValidatedSiteConfig["site"],
): { locale: string; path: string } {
  const { supported_locales: supportedLocales, default_locale: defaultLocale } =
    site;
  const normalised = supportedLocales.map((l) => l.toLowerCase());
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
 * Build a `SiteContext` from validated site configs.
 *
 * This replaces the old `deriveSiteUrl` / `deriveSiteName` /
 * `deriveSiteDescription` calls and the manual `localeToOgFormat` call.
 */
export function buildSiteContext(
  configs: ValidatedSiteConfig,
  locale: string,
  path: string,
  siteUrlOverride?: string,
): SiteContext {
  const siteUrl = resolveSiteUrl(configs.site, siteUrlOverride);
  const { supported_locales, default_locale } = configs.site;

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
      default_locale,
    ),
    twitterHandle: configs.website.twitter_handle || undefined,
  };
}

/**
 * Derive the public site origin (no trailing slash) from site config.
 */
function resolveSiteUrl(
  site: ValidatedSiteConfig["site"],
  override?: string,
): string {
  let url = "";
  if (override) {
    url = override;
  } else if (site.custom_domains?.[0]) {
    url = `https://${site.custom_domains[0]}`;
  } else {
    url = `https://${site.subdomain}.otl.studio`;
  }
  return url.replace(/\/+$/, "");
}

/**
 * Resolve a field that may be a plain string or a `LocalizedString`.
 */
function resolveLocalizedField(
  value: string | LocalizedString | undefined,
  locale: string,
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
  raw: Record<string, unknown> | undefined,
): ResolvedPageContent | undefined {
  if (!raw) return undefined;
  return raw as unknown as ResolvedPageContent;
}

/**
 * Parse a raw content map into a typed `ResolvedEntryContent`.
 */
export function parseEntryContent(
  raw: Record<string, unknown> | undefined,
): ResolvedEntryContent | undefined {
  if (!raw) return undefined;
  return raw as unknown as ResolvedEntryContent;
}

/**
 * Parse a raw content map into a typed `ResolvedListingContent`.
 */
export function parseListingContent(
  raw: Record<string, unknown> | undefined,
): ResolvedListingContent | undefined {
  if (!raw) return undefined;
  return raw as unknown as ResolvedListingContent;
}
