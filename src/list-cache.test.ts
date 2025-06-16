import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
  createTestCacheDir,
  createTestFile,
  deleteDir,
} from "../tests/helper/test-utils";
import * as ListCache from "./list-cache";
import { DEFAULT_CACHE_DIRECTORY_NAME } from "./models/constants";

describe("Cache System", () => {
  let testCacheDir: string;

  beforeEach(async () => {
    // Create a temporary directory for each test
    testCacheDir = createTestCacheDir();
    await mkdir(testCacheDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up temporary directory after each test
    await deleteDir(testCacheDir);
  });

  describe("when searching for cache files", () => {
    test("should return an empty array when directory is empty", async () => {
      // Arrange: Start with an empty directory
      // (testCacheDir is already empty)

      // Act: Search for cache files
      const files = await ListCache.findCacheFiles(testCacheDir);

      // Assert: No files should be found
      expect(files).toHaveLength(0);
    });

    test("should find a single response.json file when it exists", async () => {
      // Arrange: Create a single response.json file
      const expectedPath = join(testCacheDir, "test", "response.json");
      await createTestFile(expectedPath, { status: 200 });

      // Act: Search for cache files
      const files = await ListCache.findCacheFiles(testCacheDir);

      // Assert: Should find the created file
      expect(files).toHaveLength(1);
      expect(files[0]).toBe(expectedPath);
    });

    test("should find all response.json files when they exist in nested directories", async () => {
      // Arrange: Create response.json files at different directory depths
      const expectedPaths = [
        join(testCacheDir, "a/b/response.json"),
        join(testCacheDir, "a/c/d/response.json"),
      ];
      await Promise.all(
        expectedPaths.map((path) => createTestFile(path, { status: 200 })),
      );

      // Act: Search for cache files recursively
      const files = await ListCache.findCacheFiles(testCacheDir);

      // Assert: Should find all created files
      expect(files).toHaveLength(2);
      expect(files.sort()).toEqual(expectedPaths.sort());
    });
  });

  describe("when parsing cache files", () => {
    test("should successfully parse a valid cache file with all fields", async () => {
      // Arrange: Create a valid cache file with complete data
      const baseUrl = "https://api.example.com";
      const method = "GET";
      const path = "users";
      const status = 200;
      const fullPath = join(
        testCacheDir,
        DEFAULT_CACHE_DIRECTORY_NAME,
        encodeURIComponent(baseUrl),
        method,
        path,
        "response.json",
      );

      await createTestFile(fullPath, {
        status,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: 1 }),
      });

      // Act: Parse the cache file
      const result = await ListCache.parseCacheFile(fullPath);

      // Assert: All fields should be correctly parsed
      expect(result).not.toBe(null);
      expect(result?.method).toBe(method);
      expect(result?.fullUrl).toBe(`${baseUrl}/${path}`);
      expect(result?.status).toBe(status);
      expect(result?.cachedAt).toBeInstanceOf(Date);
    });

    test("should preserve query parameters in URL when present", async () => {
      // Arrange: Create a cache file with query parameters
      const baseUrl = "https://api.example.com";
      const method = "GET";
      const path = "users";
      const query = "page=1&limit=10";
      const fullPath = join(
        testCacheDir,
        DEFAULT_CACHE_DIRECTORY_NAME,
        encodeURIComponent(baseUrl),
        method,
        path,
        encodeURIComponent(query),
        "response.json",
      );

      await createTestFile(fullPath, {
        status: 200,
        headers: {},
        body: "[]",
      });

      // Act: Parse the cache file
      const result = await ListCache.parseCacheFile(fullPath);

      // Assert: URL should include query parameters
      expect(result).not.toBe(null);
      expect(result?.fullUrl).toBe(`${baseUrl}/${path}?${query}`);
    });

    test("should handle non-ASCII characters in URL correctly", async () => {
      // Arrange: Create a cache file with non-ASCII characters in path
      const baseUrl = "https://api.example.com";
      const method = "GET";
      const path = "users/名前";
      const fullPath = join(
        testCacheDir,
        DEFAULT_CACHE_DIRECTORY_NAME,
        encodeURIComponent(baseUrl),
        method,
        encodeURIComponent(path),
        "response.json",
      );

      await createTestFile(fullPath, {
        status: 200,
        headers: {},
        body: "{}",
      });

      // Act: Parse the cache file
      const result = await ListCache.parseCacheFile(fullPath);

      // Assert: Special characters should be correctly processed
      expect(result).not.toBe(null);
      expect(result?.fullUrl).toBe(`${baseUrl}/${path}`);
    });

    test("should return null when JSON content is invalid", async () => {
      // Arrange: Create a cache file with invalid JSON content
      const fullPath = join(
        testCacheDir,
        DEFAULT_CACHE_DIRECTORY_NAME,
        "test",
        "GET",
        "invalid",
        "response.json",
      );
      await createTestFile(fullPath, "invalid json");

      // Act: Attempt to parse invalid content
      const result = await ListCache.parseCacheFile(fullPath);

      // Assert: Parsing should fail and return null
      expect(result).toBe(null);
    });

    test("should return null when path structure is invalid", async () => {
      // Arrange: Create a cache file with invalid path structure
      const fullPath = join(testCacheDir, "invalid", "response.json");
      await createTestFile(fullPath, { status: 200 });

      // Act: Attempt to parse file with invalid path
      const result = await ListCache.parseCacheFile(fullPath);

      // Assert: Invalid path should result in null
      expect(result).toBe(null);
    });
  });

  describe("when handling concurrent access", () => {
    test("should process multiple files simultaneously without errors", async () => {
      // Arrange: Create multiple cache files
      const files = [
        {
          path: join(
            testCacheDir,
            DEFAULT_CACHE_DIRECTORY_NAME,
            encodeURIComponent("https://api1.example.com"),
            "GET",
            "users",
            "response.json",
          ),
          content: { status: 200, headers: {}, body: "[]" },
        },
        {
          path: join(
            testCacheDir,
            DEFAULT_CACHE_DIRECTORY_NAME,
            encodeURIComponent("https://api2.example.com"),
            "GET",
            "posts",
            "response.json",
          ),
          content: { status: 200, headers: {}, body: "[]" },
        },
      ];

      await Promise.all(files.map((f) => createTestFile(f.path, f.content)));

      // Act: Parse multiple files concurrently
      const results = await Promise.all(
        files.map((f) => ListCache.parseCacheFile(f.path)),
      );

      // Assert: All files should be successfully parsed
      expect(results).toHaveLength(2);
      for (const result of results) {
        expect(result).not.toBe(null);
      }
    });
  });
});
