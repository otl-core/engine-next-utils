import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@otl-core/cms-api", () => ({
  getAPIClient: vi.fn(),
}));
vi.mock("react", () => ({
  cache: (fn: Function) => fn,
}));

import { fetchConfigs } from "../src/fetch-configs.utils";
import { getAPIClient } from "@otl-core/cms-api";

const mockWebsiteService = {
  fetchConfigs: vi.fn(),
};

const mockApiClient = {
  getDeploymentId: vi.fn().mockReturnValue("test-deploy"),
  website: mockWebsiteService,
};

const mockGetAPIClient = getAPIClient as ReturnType<typeof vi.fn>;

describe("fetchConfigs", () => {
  beforeEach(() => {
    mockGetAPIClient.mockReturnValue(mockApiClient);
    mockWebsiteService.fetchConfigs.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("returns config data on success", async () => {
    const mockConfig = {
      deployment: { default_locale: "en" },
      website: { site_name: { en: "Test" } },
    };
    mockWebsiteService.fetchConfigs.mockResolvedValue({
      success: true,
      data: mockConfig,
    });

    const result = await fetchConfigs();

    expect(result).toEqual(mockConfig);
    expect(mockWebsiteService.fetchConfigs).toHaveBeenCalledWith(
      "test-deploy",
      undefined,
      undefined,
      undefined
    );
  });

  it("returns null on failure", async () => {
    mockWebsiteService.fetchConfigs.mockResolvedValue({
      success: false,
    });

    const result = await fetchConfigs();

    expect(result).toBeNull();
  });

  it("returns null on 403 errors (without logging)", async () => {
    mockWebsiteService.fetchConfigs.mockRejectedValue(
      new Error("Request failed with status 403")
    );

    const result = await fetchConfigs();

    expect(result).toBeNull();
    expect(console.error).not.toHaveBeenCalled();
  });

  it("returns null on 404 errors (without logging)", async () => {
    mockWebsiteService.fetchConfigs.mockRejectedValue(
      new Error("Request failed with status 404")
    );

    const result = await fetchConfigs();

    expect(result).toBeNull();
    expect(console.error).not.toHaveBeenCalled();
  });

  it("logs unexpected errors", async () => {
    const unexpectedError = new Error("Internal server error");
    mockWebsiteService.fetchConfigs.mockRejectedValue(unexpectedError);

    const result = await fetchConfigs();

    expect(result).toBeNull();
    expect(console.error).toHaveBeenCalledWith(
      "[fetchConfigs] Unexpected error:",
      unexpectedError
    );
  });

  it("passes optional parameters", async () => {
    mockWebsiteService.fetchConfigs.mockResolvedValue({
      success: true,
      data: {},
    });

    await fetchConfigs("de", "header-1", "footer-1");

    expect(mockWebsiteService.fetchConfigs).toHaveBeenCalledWith(
      "test-deploy",
      "de",
      "header-1",
      "footer-1"
    );
  });
});
