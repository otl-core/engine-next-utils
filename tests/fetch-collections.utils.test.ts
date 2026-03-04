import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@otl-core/cms-api", () => ({
  getAPIClient: vi.fn(),
}));

import {
  fetchCollections,
  fetchEntries,
  fetchEntry,
  fetchCategories,
} from "../src/fetch-collections.utils";
import { getAPIClient } from "@otl-core/cms-api";

const mockCollectionService = {
  fetchCollections: vi.fn(),
  fetchEntries: vi.fn(),
  fetchEntry: vi.fn(),
  fetchCategories: vi.fn(),
};

const mockApiClient = {
  getSiteId: vi.fn().mockReturnValue("test-deploy"),
  collection: mockCollectionService,
};

const mockGetAPIClient = getAPIClient as ReturnType<typeof vi.fn>;

describe("fetchCollections", () => {
  beforeEach(() => {
    mockGetAPIClient.mockReturnValue(mockApiClient);
    mockCollectionService.fetchCollections.mockReset();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("returns data on success", async () => {
    const mockCollections = [{ id: "collection-1", name: "Collection 1" }];
    mockCollectionService.fetchCollections.mockResolvedValue({
      success: true,
      data: mockCollections,
    });

    const result = await fetchCollections();

    expect(result).toEqual(mockCollections);
    expect(mockCollectionService.fetchCollections).toHaveBeenCalledWith(
      "test-deploy",
    );
  });

  it("returns null on API error (response.success = false)", async () => {
    mockCollectionService.fetchCollections.mockResolvedValue({
      success: false,
    });

    const result = await fetchCollections();

    expect(result).toBeNull();
  });

  it("returns null on exception (catches and warns)", async () => {
    mockCollectionService.fetchCollections.mockRejectedValue(
      new Error("API error"),
    );

    const result = await fetchCollections();

    expect(result).toBeNull();
    expect(console.warn).toHaveBeenCalledWith(
      "Failed to fetch collections:",
      expect.any(Error),
    );
  });
});

describe("fetchEntries", () => {
  beforeEach(() => {
    mockGetAPIClient.mockReturnValue(mockApiClient);
    mockCollectionService.fetchEntries.mockReset();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("returns data on success", async () => {
    const mockEntries = [{ id: "entry-1", title: "Entry 1" }];
    mockCollectionService.fetchEntries.mockResolvedValue({
      success: true,
      data: mockEntries,
    });

    const result = await fetchEntries("collection-1");

    expect(result).toEqual(mockEntries);
    expect(mockCollectionService.fetchEntries).toHaveBeenCalledWith(
      "collection-1",
      undefined,
    );
  });

  it("passes params to API", async () => {
    mockCollectionService.fetchEntries.mockResolvedValue({
      success: true,
      data: [],
    });

    await fetchEntries("collection-1", {
      page: 2,
      limit: 10,
      category: "tech",
    });

    expect(mockCollectionService.fetchEntries).toHaveBeenCalledWith(
      "collection-1",
      {
        page: 2,
        limit: 10,
        category: "tech",
      },
    );
  });

  it("returns null on API error (response.success = false)", async () => {
    mockCollectionService.fetchEntries.mockResolvedValue({ success: false });

    const result = await fetchEntries("collection-1");

    expect(result).toBeNull();
  });

  it("returns null on exception (catches and warns)", async () => {
    mockCollectionService.fetchEntries.mockRejectedValue(
      new Error("API error"),
    );

    const result = await fetchEntries("collection-1");

    expect(result).toBeNull();
    expect(console.warn).toHaveBeenCalledWith(
      "Failed to fetch entries:",
      expect.any(Error),
    );
  });
});

describe("fetchEntry", () => {
  beforeEach(() => {
    mockGetAPIClient.mockReturnValue(mockApiClient);
    mockCollectionService.fetchEntry.mockReset();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("returns data on success", async () => {
    const mockEntry = { id: "entry-1", title: "My Entry", slug: "my-entry" };
    mockCollectionService.fetchEntry.mockResolvedValue({
      success: true,
      data: mockEntry,
    });

    const result = await fetchEntry("collection-1", "my-entry");

    expect(result).toEqual(mockEntry);
    expect(mockCollectionService.fetchEntry).toHaveBeenCalledWith(
      "collection-1",
      "my-entry",
    );
  });

  it("returns null on API error (response.success = false)", async () => {
    mockCollectionService.fetchEntry.mockResolvedValue({ success: false });

    const result = await fetchEntry("collection-1", "my-entry");

    expect(result).toBeNull();
  });

  it("returns null on exception (catches and warns)", async () => {
    mockCollectionService.fetchEntry.mockRejectedValue(new Error("API error"));

    const result = await fetchEntry("collection-1", "my-entry");

    expect(result).toBeNull();
    expect(console.warn).toHaveBeenCalledWith(
      "Failed to fetch entry:",
      expect.any(Error),
    );
  });
});

describe("fetchCategories", () => {
  beforeEach(() => {
    mockGetAPIClient.mockReturnValue(mockApiClient);
    mockCollectionService.fetchCategories.mockReset();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("returns data on success", async () => {
    const mockCategories = [{ id: "cat-1", name: "Tech" }];
    mockCollectionService.fetchCategories.mockResolvedValue({
      success: true,
      data: mockCategories,
    });

    const result = await fetchCategories("collection-1");

    expect(result).toEqual(mockCategories);
    expect(mockCollectionService.fetchCategories).toHaveBeenCalledWith(
      "collection-1",
    );
  });

  it("returns null on API error (response.success = false)", async () => {
    mockCollectionService.fetchCategories.mockResolvedValue({ success: false });

    const result = await fetchCategories("collection-1");

    expect(result).toBeNull();
  });

  it("returns null on exception (catches and warns)", async () => {
    mockCollectionService.fetchCategories.mockRejectedValue(
      new Error("API error"),
    );

    const result = await fetchCategories("collection-1");

    expect(result).toBeNull();
    expect(console.warn).toHaveBeenCalledWith(
      "Failed to fetch categories:",
      expect.any(Error),
    );
  });
});
