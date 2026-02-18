import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock server-only (no-op in test environment)
vi.mock("server-only", () => ({}));

// Mock @otl-core/cms-api to avoid server-only import chain
vi.mock("@otl-core/cms-api", () => ({
  getAPIClient: vi.fn(),
}));

// Mock react cache (no-op passthrough)
vi.mock("react", () => ({
  cache: (fn: Function) => fn,
}));

import {
  handlePathResolution,
  resolvePath,
  resolvePaths,
  fetchAllPaths,
  pathExists,
  fetchPathContentType,
  generateSitemapData,
} from "../src/resolve-paths.utils";
import { getAPIClient } from "@otl-core/cms-api";
import type { PathResolutionResponse } from "@otl-core/cms-api";

describe("handlePathResolution", () => {
  describe("redirect type", () => {
    it("should return redirect action with to_path", () => {
      const resolution: PathResolutionResponse = {
        path: "/old-page",
        type: "redirect",
        locale: "en",
        cache_ttl: 3600,
        redirect: {
          to_path: "/new-page",
          status_code: 301,
          query_string_behavior: "preserve",
        },
        status_code: 301,
      };

      const result = handlePathResolution(resolution);
      expect(result).toEqual({
        type: "redirect",
        action: "redirect",
        redirectTo: "/new-page",
        statusCode: 301,
      });
    });

    it("should fall back to to_url when to_path is absent", () => {
      const resolution: PathResolutionResponse = {
        path: "/old-page",
        type: "redirect",
        locale: "en",
        cache_ttl: 3600,
        redirect: {
          to_url: "https://external.com",
          status_code: 302,
          query_string_behavior: "drop",
        },
        status_code: 302,
      };

      const result = handlePathResolution(resolution);
      expect(result).toEqual({
        type: "redirect",
        action: "redirect",
        redirectTo: "https://external.com",
        statusCode: 302,
      });
    });

    it("should fall back to / when no redirect target", () => {
      const resolution: PathResolutionResponse = {
        path: "/old-page",
        type: "redirect",
        locale: "en",
        cache_ttl: 3600,
        redirect: {
          status_code: 301,
          query_string_behavior: "preserve",
        },
        status_code: 301,
      };

      const result = handlePathResolution(resolution);
      expect(result.redirectTo).toBe("/");
    });

    it("should default to 301 when no status_code", () => {
      const resolution: PathResolutionResponse = {
        path: "/old-page",
        type: "redirect",
        locale: "en",
        cache_ttl: 3600,
      };

      const result = handlePathResolution(resolution);
      expect(result.statusCode).toBe(301);
    });
  });

  describe("not_found type", () => {
    it("should return notfound action", () => {
      const resolution: PathResolutionResponse = {
        path: "/nonexistent",
        type: "not_found",
        locale: "en",
        cache_ttl: 60,
      };

      const result = handlePathResolution(resolution);
      expect(result).toEqual({
        type: "not_found",
        action: "notfound",
      });
    });
  });

  describe("page type", () => {
    it("should return render action with content", () => {
      const resolution: PathResolutionResponse = {
        path: "/about",
        type: "page",
        locale: "en",
        cache_ttl: 300,
        content_id: "page-123",
        content: { title: "About Us", sections: [] },
      };

      const result = handlePathResolution(resolution);
      expect(result).toEqual({
        type: "page",
        action: "render",
        data: { title: "About Us", sections: [] },
      });
    });

    it("should fall back to content_id when no content", () => {
      const resolution: PathResolutionResponse = {
        path: "/about",
        type: "page",
        locale: "en",
        cache_ttl: 300,
        content_id: "page-123",
      };

      const result = handlePathResolution(resolution);
      expect(result).toEqual({
        type: "page",
        action: "render",
        data: { id: "page-123" },
      });
    });
  });

  describe("blog_post type", () => {
    it("should return render action", () => {
      const resolution: PathResolutionResponse = {
        path: "/blog/my-post",
        type: "blog_post",
        locale: "en",
        cache_ttl: 300,
        content_id: "post-456",
        content: { title: "My Post" },
      };

      const result = handlePathResolution(resolution);
      expect(result).toEqual({
        type: "blog_post",
        action: "render",
        data: { title: "My Post" },
      });
    });
  });

  describe("blog_category type", () => {
    it("should return render action", () => {
      const resolution: PathResolutionResponse = {
        path: "/blog/tech",
        type: "blog_category",
        locale: "en",
        cache_ttl: 300,
        content_id: "cat-789",
        content: { name: "Tech" },
      };

      const result = handlePathResolution(resolution);
      expect(result).toEqual({
        type: "blog_category",
        action: "render",
        data: { name: "Tech" },
      });
    });
  });

  describe("multiple type", () => {
    it("should handle redirect as primary match", () => {
      const resolution: PathResolutionResponse = {
        path: "/ambiguous",
        type: "multiple",
        locale: "en",
        cache_ttl: 300,
        all_matches: {
          primary_match: "redirect",
          redirect: { to_path: "/resolved", status_code: 302 },
          page: { id: "page-1" },
        },
      };

      const result = handlePathResolution(resolution);
      expect(result).toEqual({
        type: "redirect",
        action: "redirect",
        redirectTo: "/resolved",
        statusCode: 302,
      });
    });

    it("should fall back to / when redirect has no to_path", () => {
      const resolution: PathResolutionResponse = {
        path: "/ambiguous",
        type: "multiple",
        locale: "en",
        cache_ttl: 300,
        all_matches: {
          primary_match: "redirect",
          redirect: { status_code: 301 },
        },
      };

      const result = handlePathResolution(resolution);
      expect(result.redirectTo).toBe("/");
    });

    it("should render non-redirect primary match", () => {
      const resolution: PathResolutionResponse = {
        path: "/ambiguous",
        type: "multiple",
        locale: "en",
        cache_ttl: 300,
        all_matches: {
          primary_match: "page",
          page: { id: "page-1" },
          blog_post: { id: "post-1" },
        },
      };

      const result = handlePathResolution(resolution);
      expect(result).toEqual({
        type: "page",
        action: "render",
        data: resolution.all_matches,
      });
    });

    it("should default to page type when no primary_match", () => {
      const resolution: PathResolutionResponse = {
        path: "/ambiguous",
        type: "multiple",
        locale: "en",
        cache_ttl: 300,
        all_matches: {
          primary_match: "",
          page: { id: "page-1" },
        },
      };

      const result = handlePathResolution(resolution);
      expect(result.type).toBe("page");
      expect(result.action).toBe("render");
    });
  });

  describe("unknown type", () => {
    it("should return notfound action for unrecognized types", () => {
      const resolution = {
        path: "/unknown",
        type: "something_else" as PathResolutionResponse["type"],
        locale: "en",
        cache_ttl: 0,
      };

      const result = handlePathResolution(resolution);
      expect(result).toEqual({
        type: "unknown",
        action: "notfound",
      });
    });
  });
});

// --- API-dependent functions ---

const mockWebsiteService = {
  resolvePath: vi.fn(),
  resolvePaths: vi.fn(),
  fetchAllPaths: vi.fn(),
};

const mockApiClient = {
  getDeploymentId: vi.fn().mockReturnValue("test-deploy"),
  website: mockWebsiteService,
};

const mockGetAPIClient = getAPIClient as ReturnType<typeof vi.fn>;

describe("resolvePath", () => {
  beforeEach(() => {
    mockGetAPIClient.mockReturnValue(mockApiClient);
    mockWebsiteService.resolvePath.mockReset();
  });

  it("returns data on success", async () => {
    const mockResolution: PathResolutionResponse = {
      path: "/about",
      type: "page",
      locale: "en",
      cache_ttl: 300,
      content_id: "page-123",
      content: { title: "About" },
    };
    mockWebsiteService.resolvePath.mockResolvedValue({
      success: true,
      data: mockResolution,
    });

    const result = await resolvePath("/about", "en");

    expect(result).toEqual(mockResolution);
    expect(mockWebsiteService.resolvePath).toHaveBeenCalledWith(
      "test-deploy",
      "/about",
      "en",
      undefined
    );
  });

  it("throws on failure", async () => {
    mockWebsiteService.resolvePath.mockResolvedValue({
      success: false,
    });

    await expect(resolvePath("/missing", "en")).rejects.toThrow(
      "Failed to resolve path: /missing"
    );
  });
});

describe("resolvePaths", () => {
  beforeEach(() => {
    mockGetAPIClient.mockReturnValue(mockApiClient);
    mockWebsiteService.resolvePaths.mockReset();
  });

  it("returns results on success", async () => {
    const mockResults: PathResolutionResponse[] = [
      {
        path: "/a",
        type: "page",
        locale: "en",
        cache_ttl: 300,
      },
      {
        path: "/b",
        type: "page",
        locale: "en",
        cache_ttl: 300,
      },
    ];
    mockWebsiteService.resolvePaths.mockResolvedValue({
      success: true,
      data: { results: mockResults },
    });

    const result = await resolvePaths(["/a", "/b"], "en", false);

    expect(result).toEqual(mockResults);
    expect(mockWebsiteService.resolvePaths).toHaveBeenCalledWith(
      "test-deploy",
      ["/a", "/b"],
      "en",
      false
    );
  });

  it("throws on failure", async () => {
    mockWebsiteService.resolvePaths.mockResolvedValue({
      success: false,
    });

    await expect(resolvePaths(["/a"], "en")).rejects.toThrow(
      "Failed to resolve paths"
    );
  });
});

describe("fetchAllPaths", () => {
  beforeEach(() => {
    mockGetAPIClient.mockReturnValue(mockApiClient);
    mockWebsiteService.fetchAllPaths.mockReset();
  });

  it("returns data on success", async () => {
    const mockResponse = {
      paths: [
        { path: "/about", content_type: "page", locale: "en" },
        { path: "/blog", content_type: "blog", locale: "en" },
      ],
      pagination: {
        page: 1,
        limit: 1000,
        total: 2,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      },
    };
    mockWebsiteService.fetchAllPaths.mockResolvedValue({
      success: true,
      data: mockResponse,
    });

    const result = await fetchAllPaths("en");

    expect(result).toEqual(mockResponse);
    expect(mockWebsiteService.fetchAllPaths).toHaveBeenCalledWith(
      "test-deploy",
      "en",
      undefined
    );
  });

  it("throws on failure", async () => {
    mockWebsiteService.fetchAllPaths.mockResolvedValue({
      success: false,
    });

    await expect(fetchAllPaths("en")).rejects.toThrow(
      "Failed to get all paths"
    );
  });
});

describe("pathExists", () => {
  beforeEach(() => {
    mockGetAPIClient.mockReturnValue(mockApiClient);
    mockWebsiteService.resolvePath.mockReset();
  });

  it("returns true for found path", async () => {
    mockWebsiteService.resolvePath.mockResolvedValue({
      success: true,
      data: {
        path: "/about",
        type: "page",
        locale: "en",
        cache_ttl: 300,
      },
    });

    const result = await pathExists("/about", "en");

    expect(result).toBe(true);
  });

  it("returns false for not_found", async () => {
    mockWebsiteService.resolvePath.mockResolvedValue({
      success: true,
      data: {
        path: "/missing",
        type: "not_found",
        locale: "en",
        cache_ttl: 60,
      },
    });

    const result = await pathExists("/missing", "en");

    expect(result).toBe(false);
  });

  it("returns false on error", async () => {
    mockWebsiteService.resolvePath.mockResolvedValue({
      success: false,
    });

    const result = await pathExists("/broken", "en");

    expect(result).toBe(false);
  });
});

describe("fetchPathContentType", () => {
  beforeEach(() => {
    mockGetAPIClient.mockReturnValue(mockApiClient);
    mockWebsiteService.resolvePath.mockReset();
  });

  it("returns type for found path", async () => {
    mockWebsiteService.resolvePath.mockResolvedValue({
      success: true,
      data: {
        path: "/blog/my-post",
        type: "blog_post",
        locale: "en",
        cache_ttl: 300,
      },
    });

    const result = await fetchPathContentType("/blog/my-post", "en");

    expect(result).toBe("blog_post");
  });

  it("returns null for not_found", async () => {
    mockWebsiteService.resolvePath.mockResolvedValue({
      success: true,
      data: {
        path: "/missing",
        type: "not_found",
        locale: "en",
        cache_ttl: 60,
      },
    });

    const result = await fetchPathContentType("/missing", "en");

    expect(result).toBeNull();
  });

  it("returns null on error", async () => {
    mockWebsiteService.resolvePath.mockResolvedValue({
      success: false,
    });

    const result = await fetchPathContentType("/broken", "en");

    expect(result).toBeNull();
  });
});

describe("generateSitemapData", () => {
  beforeEach(() => {
    mockGetAPIClient.mockReturnValue(mockApiClient);
    mockWebsiteService.fetchAllPaths.mockReset();
  });

  it("collects paths across pages", async () => {
    mockWebsiteService.fetchAllPaths
      .mockResolvedValueOnce({
        success: true,
        data: {
          paths: [
            { path: "/page1", content_type: "page", locale: "en" },
            { path: "/page2", content_type: "page", locale: "en" },
          ],
          pagination: {
            page: 1,
            limit: 2,
            total: 4,
            total_pages: 2,
            has_next: true,
            has_prev: false,
          },
        },
      })
      .mockResolvedValueOnce({
        success: true,
        data: {
          paths: [
            { path: "/page3", content_type: "page", locale: "en" },
            { path: "/page4", content_type: "blog_post", locale: "en" },
          ],
          pagination: {
            page: 2,
            limit: 2,
            total: 4,
            total_pages: 2,
            has_next: false,
            has_prev: true,
          },
        },
      });

    const result = await generateSitemapData("en", 2);

    expect(result).toEqual([
      { path: "/page1", type: "page" },
      { path: "/page2", type: "page" },
      { path: "/page3", type: "page" },
      { path: "/page4", type: "blog_post" },
    ]);
    expect(mockWebsiteService.fetchAllPaths).toHaveBeenCalledTimes(2);
  });

  it("filters out redirects", async () => {
    mockWebsiteService.fetchAllPaths.mockResolvedValue({
      success: true,
      data: {
        paths: [
          { path: "/about", content_type: "page", locale: "en" },
          { path: "/old-url", content_type: "redirect", locale: "en" },
          { path: "/blog/post", content_type: "blog_post", locale: "en" },
        ],
        pagination: {
          page: 1,
          limit: 1000,
          total: 3,
          total_pages: 1,
          has_next: false,
          has_prev: false,
        },
      },
    });

    const result = await generateSitemapData("en");

    expect(result).toEqual([
      { path: "/about", type: "page" },
      { path: "/blog/post", type: "blog_post" },
    ]);
  });
});
