/**
 * A/B/n Variant Resolver -- Next.js-specific
 *
 * Re-exports all framework-agnostic resolver logic from @otl-core/cms-utils
 * and adds the Next.js-specific `getABnBucket` helper that reads the bucket
 * value from the `x-abn-bucket` request header (set by the engine's proxy middleware).
 */

import { headers } from "next/headers";
export {
  isMultivariateContent,
  resolveBlogPostVariant,
  resolveFormVariantsInSections,
  resolvePageVariant,
  selectVariant,
} from "@otl-core/cms-utils";
export type {
  MultivariateFormBlockData,
  MultivariatePageContent,
  VariantConfig,
} from "@otl-core/cms-utils";

/**
 * Read the A/B/n bucket value from the `x-abn-bucket` request header.
 * Returns a float [0, 1) or a fallback random value if the header is absent.
 */
export async function getABnBucket(): Promise<number> {
  const headerStore = await headers();
  const bucketStr = headerStore.get("x-abn-bucket");

  if (bucketStr) {
    const num = parseFloat(bucketStr);
    if (!isNaN(num) && num >= 0 && num < 1) {
      return num;
    }
  }

  return Math.random();
}
