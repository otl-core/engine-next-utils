/**
 * A/B/n Variant Resolver -- Next.js-specific
 *
 * Reads the bucket value from the `x-abn-bucket` request header
 * (set by the engine's proxy middleware).
 *
 * Framework-agnostic resolver logic lives in @otl-core/cms-utils.
 */

import { headers } from "next/headers";

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
