import { headers } from "next/headers";
import { fetchConfigs } from "./fetch-configs.utils";

/**
 * Detect the user's locale from the request URL on the server.
 * Uses the x-pathname header set by the proxy to determine
 * which locale prefix (e.g. /de/) was in the original request.
 *
 * Falls back to the deployment's default locale.
 */
export async function detectLocaleFromRequest(): Promise<{
  locale: string;
  configs: Awaited<ReturnType<typeof fetchConfigs>>;
}> {
  const configs = await fetchConfigs();
  const defaultLocale = configs?.deployment?.default_locale || "en";
  const supportedLocales = configs?.deployment?.supported_locales || [
    defaultLocale,
  ];

  try {
    const headersList = await headers();
    const pathname = headersList.get("x-pathname") || "";
    const segments = pathname.replace(/^\//, "").split("/");
    const firstSegment = segments[0]?.toLowerCase();

    if (firstSegment) {
      const normalizedLocales = supportedLocales.map((l: string) =>
        l.toLowerCase()
      );
      const localeIndex = normalizedLocales.indexOf(firstSegment);

      if (localeIndex !== -1) {
        return { locale: supportedLocales[localeIndex], configs };
      }
    }
  } catch {
    // headers() may fail in certain contexts; fall back to default
  }

  return { locale: defaultLocale, configs };
}
