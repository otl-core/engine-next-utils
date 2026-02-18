import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

import { hasValidPasswordCookie } from "../src/password-check.utils";
import { cookies } from "next/headers";

const mockCookies = cookies as ReturnType<typeof vi.fn>;

describe("hasValidPasswordCookie", () => {
  beforeEach(() => {
    mockCookies.mockReset();
  });

  it("returns true when cookie exists with value", async () => {
    mockCookies.mockResolvedValue({
      get: vi.fn((name: string) =>
        name === "__pp_entity-123" ? { value: "verified" } : undefined
      ),
    });

    const result = await hasValidPasswordCookie("entity-123");

    expect(result).toBe(true);
  });

  it("returns false when cookie doesn't exist", async () => {
    mockCookies.mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    });

    const result = await hasValidPasswordCookie("entity-123");

    expect(result).toBe(false);
  });

  it("returns false when cookie value is empty", async () => {
    mockCookies.mockResolvedValue({
      get: vi.fn((name: string) =>
        name === "__pp_entity-123" ? { value: "" } : undefined
      ),
    });

    const result = await hasValidPasswordCookie("entity-123");

    expect(result).toBe(false);
  });

  it("uses correct cookie name pattern (__pp_ + entityId)", async () => {
    const mockGet = vi.fn().mockReturnValue(undefined);
    mockCookies.mockResolvedValue({ get: mockGet });

    await hasValidPasswordCookie("my-entity");

    expect(mockGet).toHaveBeenCalledWith("__pp_my-entity");
  });
});
