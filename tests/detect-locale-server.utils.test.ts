import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));
vi.mock("../src/fetch-configs.utils", () => ({
  fetchConfigs: vi.fn(),
}));
vi.mock("react", () => ({
  cache: (fn: Function) => fn,
}));

import { detectLocaleFromRequest } from "../src/detect-locale-server.utils";
import { headers } from "next/headers";
import { fetchConfigs } from "../src/fetch-configs.utils";

const mockHeaders = headers as ReturnType<typeof vi.fn>;
const mockFetchConfigs = fetchConfigs as ReturnType<typeof vi.fn>;

const mockConfigs = {
  deployment: {
    default_locale: "en",
    supported_locales: ["en", "de"],
  },
};

describe("detectLocaleFromRequest", () => {
  beforeEach(() => {
    mockHeaders.mockReset();
    mockFetchConfigs.mockResolvedValue(mockConfigs);
  });

  it("returns detected locale from URL path (e.g. /de/page -> de)", async () => {
    mockHeaders.mockResolvedValue({
      get: vi.fn((name: string) => (name === "x-pathname" ? "/de/page" : null)),
    });

    const result = await detectLocaleFromRequest();

    expect(result.locale).toBe("de");
    expect(result.configs).toEqual(mockConfigs);
  });

  it("returns default locale when path has no locale prefix", async () => {
    mockHeaders.mockResolvedValue({
      get: vi.fn((name: string) => (name === "x-pathname" ? "/page" : null)),
    });

    const result = await detectLocaleFromRequest();

    expect(result.locale).toBe("en");
  });

  it("falls back to default locale when headers() throws", async () => {
    mockHeaders.mockRejectedValue(new Error("headers unavailable"));

    const result = await detectLocaleFromRequest();

    expect(result.locale).toBe("en");
  });

  it("handles case-insensitive locale matching", async () => {
    mockHeaders.mockResolvedValue({
      get: vi.fn((name: string) => (name === "x-pathname" ? "/DE/page" : null)),
    });

    const result = await detectLocaleFromRequest();

    expect(result.locale).toBe("de");
  });

  it("uses deployment config for supported locales", async () => {
    const customConfigs = {
      deployment: {
        default_locale: "fr",
        supported_locales: ["fr", "de", "es"],
      },
    };
    mockFetchConfigs.mockResolvedValue(customConfigs);
    mockHeaders.mockResolvedValue({
      get: vi.fn((name: string) =>
        name === "x-pathname" ? "/es/about" : null
      ),
    });

    const result = await detectLocaleFromRequest();

    expect(result.locale).toBe("es");
    expect(result.configs).toEqual(customConfigs);
  });

  it("returns default locale when first segment is not in supported locales", async () => {
    mockHeaders.mockResolvedValue({
      get: vi.fn((name: string) => (name === "x-pathname" ? "/fr/page" : null)),
    });

    const result = await detectLocaleFromRequest();

    expect(result.locale).toBe("en");
  });

  it("falls back to en when deployment config has no default_locale", async () => {
    mockFetchConfigs.mockResolvedValue({
      deployment: { supported_locales: ["de"] },
    });
    mockHeaders.mockResolvedValue({
      get: vi.fn((name: string) => (name === "x-pathname" ? "/" : null)),
    });

    const result = await detectLocaleFromRequest();

    expect(result.locale).toBe("en");
  });
});
