import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@otl-core/cms-api", () => ({
  getAPIClient: vi.fn(),
}));

import {
  fetchBlogs,
  fetchBlogPosts,
  fetchBlogPost,
  fetchBlogCategories,
} from "../src/fetch-blogs.utils";
import { getAPIClient } from "@otl-core/cms-api";

const mockBlogService = {
  fetchBlogs: vi.fn(),
  fetchBlogPosts: vi.fn(),
  fetchBlogPost: vi.fn(),
  fetchBlogCategories: vi.fn(),
};

const mockApiClient = {
  getDeploymentId: vi.fn().mockReturnValue("test-deploy"),
  blog: mockBlogService,
};

const mockGetAPIClient = getAPIClient as ReturnType<typeof vi.fn>;

describe("fetchBlogs", () => {
  beforeEach(() => {
    mockGetAPIClient.mockReturnValue(mockApiClient);
    mockBlogService.fetchBlogs.mockReset();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("returns data on success", async () => {
    const mockBlogs = [{ id: "blog-1", name: "Blog 1" }];
    mockBlogService.fetchBlogs.mockResolvedValue({
      success: true,
      data: mockBlogs,
    });

    const result = await fetchBlogs();

    expect(result).toEqual(mockBlogs);
    expect(mockBlogService.fetchBlogs).toHaveBeenCalledWith("test-deploy");
  });

  it("returns null on API error (response.success = false)", async () => {
    mockBlogService.fetchBlogs.mockResolvedValue({
      success: false,
    });

    const result = await fetchBlogs();

    expect(result).toBeNull();
  });

  it("returns null on exception (catches and warns)", async () => {
    mockBlogService.fetchBlogs.mockRejectedValue(new Error("API error"));

    const result = await fetchBlogs();

    expect(result).toBeNull();
    expect(console.warn).toHaveBeenCalledWith(
      "Failed to fetch blogs:",
      expect.any(Error)
    );
  });
});

describe("fetchBlogPosts", () => {
  beforeEach(() => {
    mockGetAPIClient.mockReturnValue(mockApiClient);
    mockBlogService.fetchBlogPosts.mockReset();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("returns data on success", async () => {
    const mockPosts = [{ id: "post-1", title: "Post 1" }];
    mockBlogService.fetchBlogPosts.mockResolvedValue({
      success: true,
      data: mockPosts,
    });

    const result = await fetchBlogPosts("blog-1");

    expect(result).toEqual(mockPosts);
    expect(mockBlogService.fetchBlogPosts).toHaveBeenCalledWith(
      "blog-1",
      undefined
    );
  });

  it("passes params to API", async () => {
    mockBlogService.fetchBlogPosts.mockResolvedValue({
      success: true,
      data: [],
    });

    await fetchBlogPosts("blog-1", {
      page: 2,
      limit: 10,
      category: "tech",
    });

    expect(mockBlogService.fetchBlogPosts).toHaveBeenCalledWith("blog-1", {
      page: 2,
      limit: 10,
      category: "tech",
    });
  });

  it("returns null on API error (response.success = false)", async () => {
    mockBlogService.fetchBlogPosts.mockResolvedValue({ success: false });

    const result = await fetchBlogPosts("blog-1");

    expect(result).toBeNull();
  });

  it("returns null on exception (catches and warns)", async () => {
    mockBlogService.fetchBlogPosts.mockRejectedValue(new Error("API error"));

    const result = await fetchBlogPosts("blog-1");

    expect(result).toBeNull();
    expect(console.warn).toHaveBeenCalledWith(
      "Failed to fetch blog posts:",
      expect.any(Error)
    );
  });
});

describe("fetchBlogPost", () => {
  beforeEach(() => {
    mockGetAPIClient.mockReturnValue(mockApiClient);
    mockBlogService.fetchBlogPost.mockReset();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("returns data on success", async () => {
    const mockPost = { id: "post-1", title: "My Post", slug: "my-post" };
    mockBlogService.fetchBlogPost.mockResolvedValue({
      success: true,
      data: mockPost,
    });

    const result = await fetchBlogPost("blog-1", "my-post");

    expect(result).toEqual(mockPost);
    expect(mockBlogService.fetchBlogPost).toHaveBeenCalledWith(
      "blog-1",
      "my-post"
    );
  });

  it("returns null on API error (response.success = false)", async () => {
    mockBlogService.fetchBlogPost.mockResolvedValue({ success: false });

    const result = await fetchBlogPost("blog-1", "my-post");

    expect(result).toBeNull();
  });

  it("returns null on exception (catches and warns)", async () => {
    mockBlogService.fetchBlogPost.mockRejectedValue(new Error("API error"));

    const result = await fetchBlogPost("blog-1", "my-post");

    expect(result).toBeNull();
    expect(console.warn).toHaveBeenCalledWith(
      "Failed to fetch blog post:",
      expect.any(Error)
    );
  });
});

describe("fetchBlogCategories", () => {
  beforeEach(() => {
    mockGetAPIClient.mockReturnValue(mockApiClient);
    mockBlogService.fetchBlogCategories.mockReset();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("returns data on success", async () => {
    const mockCategories = [{ id: "cat-1", name: "Tech" }];
    mockBlogService.fetchBlogCategories.mockResolvedValue({
      success: true,
      data: mockCategories,
    });

    const result = await fetchBlogCategories("blog-1");

    expect(result).toEqual(mockCategories);
    expect(mockBlogService.fetchBlogCategories).toHaveBeenCalledWith("blog-1");
  });

  it("returns null on API error (response.success = false)", async () => {
    mockBlogService.fetchBlogCategories.mockResolvedValue({ success: false });

    const result = await fetchBlogCategories("blog-1");

    expect(result).toBeNull();
  });

  it("returns null on exception (catches and warns)", async () => {
    mockBlogService.fetchBlogCategories.mockRejectedValue(
      new Error("API error")
    );

    const result = await fetchBlogCategories("blog-1");

    expect(result).toBeNull();
    expect(console.warn).toHaveBeenCalledWith(
      "Failed to fetch blog categories:",
      expect.any(Error)
    );
  });
});
