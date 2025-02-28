import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { getCache, cacheResponse } from "./cache";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { deleteDir, createTestCacheDir } from "../tests/helper/test-utils";

describe("Cache Operations", () => {
  const baseUrl = "https://api.example.com";
  let testCacheDir: string;

  beforeEach(async () => {
    // Create a new test cache directory
    testCacheDir = createTestCacheDir();
    await mkdir(testCacheDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    await deleteDir(testCacheDir);
  });

  describe("when retrieving cache", () => {
    test("should return null when cache does not exist", async () => {
      // Arrange: Set up test path and method
      const path = "/users";
      const method = "GET";
      const query = {};

      // Act: Attempt to retrieve non-existent cache
      const result = await getCache(baseUrl, method, path, query, testCacheDir);

      // Assert: Should return null
      expect(result).toBeNull();
    });

    test("should return cached response when cache exists", async () => {
      // Arrange: Create a cache entry
      const path = "/users";
      const method = "GET";
      const query = {};
      const responseBody = JSON.stringify({ id: 1, name: "Test User" });
      const status = 200;
      const headers = new Headers({ "content-type": "application/json" });

      await cacheResponse(
        responseBody,
        status,
        headers,
        baseUrl,
        path,
        method,
        query,
        testCacheDir,
      );

      // Act: Retrieve the cached response
      const result = await getCache(baseUrl, method, path, query, testCacheDir);

      // Assert: Should match the cached content
      expect(result).not.toBeNull();
      expect(result?.body).toBe(responseBody);
      expect(result?.status).toBe(status);
      expect(result?.headers.get("content-type")).toBe("application/json");
    });

    test("should handle different query parameters as separate caches", async () => {
      // Arrange: Create two cache entries with different query params
      const path = "/users";
      const method = "GET";
      const query1 = { foo: "bar" };
      const query2 = { foo: "zoo" };
      const response1 = JSON.stringify({ id: 1 });
      const response2 = JSON.stringify({ id: 2 });

      await cacheResponse(
        response1,
        200,
        new Headers(),
        baseUrl,
        path,
        method,
        query1,
        testCacheDir,
      );

      await cacheResponse(
        response2,
        200,
        new Headers(),
        baseUrl,
        path,
        method,
        query2,
        testCacheDir,
      );

      // Act: Retrieve both cached responses
      const result1 = await getCache(
        baseUrl,
        method,
        path,
        query1,
        testCacheDir,
      );
      const result2 = await getCache(
        baseUrl,
        method,
        path,
        query2,
        testCacheDir,
      );

      // Assert: Should return correct response for each query
      expect(result1?.body).toBe(response1);
      expect(result2?.body).toBe(response2);
    });

    test("should treat query parameters as order-independent", async () => {
      // Arrange: Create cache with one query parameter order
      const path = "/users";
      const method = "GET";
      const responseBody = JSON.stringify({ id: 1 });
      const query1 = { foo: "1", bar: "2" };
      const query2 = { bar: "2", foo: "1" };

      await cacheResponse(
        responseBody,
        200,
        new Headers(),
        baseUrl,
        path,
        method,
        query1,
        testCacheDir,
      );

      // Act: Retrieve with different parameter order
      const result = await getCache(
        baseUrl,
        method,
        path,
        query2,
        testCacheDir,
      );

      // Assert: Should return same response regardless of parameter order
      expect(result?.body).toBe(responseBody);
    });
  });

  describe("when storing cache", () => {
    test("should create cache file with correct content and structure", async () => {
      // Arrange: Prepare cache content
      const path = "/users";
      const method = "GET";
      const query = {};
      const responseBody = JSON.stringify({ id: 1 });
      const status = 200;
      const headers = new Headers({ "content-type": "application/json" });

      // Act: Store the cache
      await cacheResponse(
        responseBody,
        status,
        headers,
        baseUrl,
        path,
        method,
        query,
        testCacheDir,
      );

      // Assert: Cache file should exist and contain correct content
      const cacheFilePath = join(
        testCacheDir,
        encodeURIComponent(baseUrl),
        method,
        path,
        "response.json",
      );
      expect(existsSync(cacheFilePath)).toBe(true);

      const result = await getCache(baseUrl, method, path, query, testCacheDir);
      expect(result?.body).toBe(responseBody);
      expect(result?.status).toBe(status);
      expect(result?.headers.get("content-type")).toBe("application/json");
    });

    test("should handle paths with leading slash correctly", async () => {
      // Arrange: Prepare path with leading slash
      const path = "/users/123";
      const method = "GET";
      const query = {};
      const responseBody = JSON.stringify({ id: 123 });

      // Act: Store cache with leading slash path
      await cacheResponse(
        responseBody,
        200,
        new Headers(),
        baseUrl,
        path,
        method,
        query,
        testCacheDir,
      );

      // Assert: Should retrieve cache correctly
      const result = await getCache(baseUrl, method, path, query, testCacheDir);
      expect(result?.body).toBe(responseBody);
    });
  });
});
