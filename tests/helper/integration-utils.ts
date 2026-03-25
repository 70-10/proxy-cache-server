import { afterEach } from "vitest";
import { vi } from "vitest";
import { setupTestCacheDir } from "./test-utils";

// Type for mock fetch response configuration
interface MockFetchResponse {
  body: string;
  status?: number;
  headers?: Record<string, string>;
}

/**
 * Sets up the integration test environment with:
 * - Temporary cache directory (auto-created/cleaned per test)
 * - fetch mock management (auto-restored per test)
 * Returns a context object with `dir` property.
 */
export function setupIntegrationTest(): { dir: string } {
  const ctx = setupTestCacheDir();
  afterEach(() => {
    vi.restoreAllMocks();
  });
  return ctx;
}

/**
 * Creates a mock fetch function that returns the specified response.
 * Automatically stubs the global fetch with the created mock.
 */
export function createMockFetch(response: MockFetchResponse) {
  const mock = vi.fn(() =>
    Promise.resolve(
      new Response(response.body, {
        status: response.status ?? 200,
        headers: new Headers(response.headers ?? {}),
      }),
    ),
  );
  vi.stubGlobal("fetch", mock);
  return mock;
}

/**
 * Creates a mock fetch that rejects with an error.
 * Automatically stubs the global fetch with the created mock.
 */
export function createFailingFetch(error?: string) {
  const mock = vi.fn(() => Promise.reject(new Error(error ?? "Network error")));
  vi.stubGlobal("fetch", mock);
  return mock;
}
