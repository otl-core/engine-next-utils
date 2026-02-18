import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("../src/fetch-configs.utils", () => ({
  fetchConfigs: vi.fn(),
}));

vi.mock("@otl-core/cms-utils", () => ({
  getLocalizedString: vi.fn(
    (
      value: Record<string, string> | null,
      opts?: { preferredLocale?: string }
    ) => {
      if (!value) return "";
      if (opts?.preferredLocale && value[opts.preferredLocale]) {
        return value[opts.preferredLocale];
      }
      return value["en"] || Object.values(value)[0] || "";
    }
  ),
}));

import {
  getWebsiteConfig,
  clearConfigCache,
  getSiteName,
  getSiteDescription,
  getTimezone,
} from "../src/website-config.utils";
import { fetchConfigs } from "../src/fetch-configs.utils";
import type { DeploymentConfig } from "@otl-core/cms-types";

const mockFetchConfigs = fetchConfigs as ReturnType<typeof vi.fn>;

const mockWebsiteConfig = {
  site_name: { en: "Test Site", de: "Test Seite" },
  description: { en: "A test website", de: "Eine Testwebsite" },
  timezone: "Europe/Berlin",
  default_locale: "en",
  supported_locales: ["en", "de"],
};

const mockDeploymentConfig: DeploymentConfig = {
  website: mockWebsiteConfig,
} as DeploymentConfig;

describe("Website Config Helpers", () => {
  beforeEach(() => {
    clearConfigCache();
    mockFetchConfigs.mockReset();
  });

  describe("getWebsiteConfig", () => {
    it("should return website config from deployment config", async () => {
      mockFetchConfigs.mockResolvedValue(mockDeploymentConfig);
      const result = await getWebsiteConfig();
      expect(result).toEqual(mockWebsiteConfig);
    });

    it("should cache the result on subsequent calls", async () => {
      mockFetchConfigs.mockResolvedValue(mockDeploymentConfig);
      await getWebsiteConfig();
      await getWebsiteConfig();
      expect(mockFetchConfigs).toHaveBeenCalledTimes(1);
    });

    it("should return null when fetchConfigs returns null", async () => {
      mockFetchConfigs.mockResolvedValue(null);
      const result = await getWebsiteConfig();
      expect(result).toBeNull();
    });

    it("should return null when config has no website property", async () => {
      mockFetchConfigs.mockResolvedValue({} as DeploymentConfig);
      const result = await getWebsiteConfig();
      expect(result).toBeNull();
    });

    it("should re-fetch after clearConfigCache", async () => {
      mockFetchConfigs.mockResolvedValue(mockDeploymentConfig);
      await getWebsiteConfig();
      clearConfigCache();
      await getWebsiteConfig();
      expect(mockFetchConfigs).toHaveBeenCalledTimes(2);
    });
  });

  describe("clearConfigCache", () => {
    it("should clear the cached config", async () => {
      mockFetchConfigs.mockResolvedValue(mockDeploymentConfig);
      await getWebsiteConfig();

      clearConfigCache();

      // After clearing, the next call should re-fetch
      mockFetchConfigs.mockResolvedValue(null);
      const result = await getWebsiteConfig();
      expect(result).toBeNull();
    });
  });

  describe("getSiteName", () => {
    it("should return site name for given locale", async () => {
      mockFetchConfigs.mockResolvedValue(mockDeploymentConfig);
      const result = await getSiteName("en");
      expect(result).toBe("Test Site");
    });

    it("should return site name for non-default locale", async () => {
      mockFetchConfigs.mockResolvedValue(mockDeploymentConfig);
      const result = await getSiteName("de");
      expect(result).toBe("Test Seite");
    });

    it("should return empty string when no config", async () => {
      mockFetchConfigs.mockResolvedValue(null);
      const result = await getSiteName();
      expect(result).toBe("");
    });
  });

  describe("getSiteDescription", () => {
    it("should return site description for given locale", async () => {
      mockFetchConfigs.mockResolvedValue(mockDeploymentConfig);
      const result = await getSiteDescription("en");
      expect(result).toBe("A test website");
    });

    it("should return empty string when no config", async () => {
      mockFetchConfigs.mockResolvedValue(null);
      const result = await getSiteDescription();
      expect(result).toBe("");
    });
  });

  describe("getTimezone", () => {
    it("should return timezone from config", async () => {
      mockFetchConfigs.mockResolvedValue(mockDeploymentConfig);
      const result = await getTimezone();
      expect(result).toBe("Europe/Berlin");
    });

    it("should return UTC when no config", async () => {
      mockFetchConfigs.mockResolvedValue(null);
      const result = await getTimezone();
      expect(result).toBe("UTC");
    });
  });
});
