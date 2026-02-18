/**
 * Password Check Utility
 * Server-side only password cookie verification
 */

import { cookies } from "next/headers";

/**
 * Check if user has a valid password verification cookie for the given entity
 */
export async function hasValidPasswordCookie(
  entityId: string
): Promise<boolean> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(`__pp_${entityId}`);

  return !!cookie?.value;
}
