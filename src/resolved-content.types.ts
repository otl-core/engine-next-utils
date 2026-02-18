/**
 * Typed interfaces for resolved content from the path resolution API.
 *
 * The backend returns `Record<string, unknown>` -- these interfaces describe
 * the shape of that map for each content type so that engine code can work
 * with proper types instead of casting everywhere.
 */

import type {
  MediaReference,
  SchemaInstance,
  SEOConfig,
} from "@otl-core/cms-types";

export interface ResolvedPageContent {
  /** Allow additional fields from the backend content map. */
  [key: string]: unknown;
  title?: string;
  sections?: SchemaInstance[];
  seo?: SEOConfig;
  created_at?: string;
  updated_at?: string;
  publish_at?: string;
  expires_at?: string;
  password_protected?: boolean;
  password_message?: string;
  header_preset_id?: string;
  footer_preset_id?: string;
  /** A/B test variants (raw from backend) */
  variants?: unknown[];
}

export interface ResolvedBlogPostContent {
  /** Allow additional fields from the backend content map. */
  [key: string]: unknown;
  title?: string;
  excerpt?: string;
  featured_image?: MediaReference;
  layout?: SchemaInstance[];
  blocks?: SchemaInstance[];
  seo?: SEOConfig;
  published_at?: string;
  created_at?: string;
  updated_at?: string;
  publish_at?: string;
  expires_at?: string;
  password_protected?: boolean;
  password_message?: string;
  header_preset_id?: string;
  footer_preset_id?: string;
  tags?: string[];
  category_id?: string;
}

export interface ResolvedBlogListingContent {
  /** Allow additional fields from the backend content map. */
  [key: string]: unknown;
  layout?: SchemaInstance[];
}

export type ResolvedContent =
  | ResolvedPageContent
  | ResolvedBlogPostContent
  | ResolvedBlogListingContent;
