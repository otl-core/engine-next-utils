import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

import { getABnBucket } from "../src/abn-resolver.utils";
import { headers } from "next/headers";

const mockHeaders = headers as ReturnType<typeof vi.fn>;

describe("getABnBucket", () => {
  beforeEach(() => {
    mockHeaders.mockReset();
  });

  it("returns parsed float from x-abn-bucket header", async () => {
    const mockGet = vi.fn().mockReturnValue("0.25");
    mockHeaders.mockResolvedValue({ get: mockGet });

    const result = await getABnBucket();

    expect(result).toBe(0.25);
    expect(mockGet).toHaveBeenCalledWith("x-abn-bucket");
  });

  it("returns random value when header is missing", async () => {
    const mockGet = vi.fn().mockReturnValue(null);
    mockHeaders.mockResolvedValue({ get: mockGet });

    const result = await getABnBucket();

    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThan(1);
  });

  it("returns random value when header is invalid (NaN)", async () => {
    const mockGet = vi.fn().mockReturnValue("not-a-number");
    mockHeaders.mockResolvedValue({ get: mockGet });

    const result = await getABnBucket();

    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThan(1);
  });

  it("returns random value when header is invalid (negative)", async () => {
    const mockGet = vi.fn().mockReturnValue("-0.5");
    mockHeaders.mockResolvedValue({ get: mockGet });

    const result = await getABnBucket();

    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThan(1);
  });

  it("returns random value when header is invalid (>= 1)", async () => {
    const mockGet = vi.fn().mockReturnValue("1.0");
    mockHeaders.mockResolvedValue({ get: mockGet });

    const result = await getABnBucket();

    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThan(1);
  });

  it("result is always in range [0, 1)", async () => {
    // Test valid header
    mockHeaders.mockResolvedValue({
      get: vi.fn().mockReturnValue("0.5"),
    });
    const resultValid = await getABnBucket();
    expect(resultValid).toBe(0.5);

    // Test invalid - should still be in range via Math.random
    mockHeaders.mockResolvedValue({ get: vi.fn().mockReturnValue("2") });
    const resultInvalid = await getABnBucket();
    expect(resultInvalid).toBeGreaterThanOrEqual(0);
    expect(resultInvalid).toBeLessThan(1);
  });
});
