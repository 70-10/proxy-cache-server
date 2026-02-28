import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { setupTestCacheDir } from "../tests/helper/test-utils";
import { cacheResponse, getCache } from "./cache";

const BASE_URL = "https://api.example.com";

describe("getCache", () => {
  const cache = setupTestCacheDir();

  describe("Positive Cases", () => {
    test("should return null when cache does not exist", async () => {
      // Arrange: Set up test path and method
      const path = "/users";
      const method = "GET";
      const query = {};

      // Act: Attempt to retrieve non-existent cache
      const result = await getCache(BASE_URL, method, path, query, cache.dir);

      // Assert: Should return null
      expect(result).toBe(null);
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
        {
          body: responseBody,
          status,
          headers,
        },
        {
          baseUrl: BASE_URL,
          path,
          method,
          query,
          cacheDir: cache.dir,
        },
      );

      // Act: Retrieve the cached response
      const result = await getCache(BASE_URL, method, path, query, cache.dir);

      // Assert: Should match the cached content
      expect(result).not.toBe(null);
      expect(result?.body).toBe(responseBody);
      expect(result?.status).toBe(status);
      expect(result?.headers.get("content-type")).toBe("application/json");
    });
  });

  describe("Edge Cases", () => {
    test("should handle different query parameters as separate caches", async () => {
      // Arrange: Create two cache entries with different query params
      const path = "/users";
      const method = "GET";
      const query1 = { foo: "bar" };
      const query2 = { foo: "zoo" };
      const response1 = JSON.stringify({ id: 1 });
      const response2 = JSON.stringify({ id: 2 });

      await cacheResponse(
        {
          body: response1,
          status: 200,
          headers: new Headers(),
        },
        {
          baseUrl: BASE_URL,
          path,
          method,
          query: query1,
          cacheDir: cache.dir,
        },
      );

      await cacheResponse(
        {
          body: response2,
          status: 200,
          headers: new Headers(),
        },
        {
          baseUrl: BASE_URL,
          path,
          method,
          query: query2,
          cacheDir: cache.dir,
        },
      );

      // Act: Retrieve both cached responses
      const result1 = await getCache(BASE_URL, method, path, query1, cache.dir);
      const result2 = await getCache(BASE_URL, method, path, query2, cache.dir);

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
        {
          body: responseBody,
          status: 200,
          headers: new Headers(),
        },
        {
          baseUrl: BASE_URL,
          path,
          method,
          query: query1,
          cacheDir: cache.dir,
        },
      );

      // Act: Retrieve with different parameter order
      const result = await getCache(BASE_URL, method, path, query2, cache.dir);

      // Assert: Should return same response regardless of parameter order
      expect(result?.body).toBe(responseBody);
    });
  });
});

describe("cacheResponse", () => {
  const cache = setupTestCacheDir();

  describe("Positive Cases", () => {
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
        {
          body: responseBody,
          status,
          headers,
        },
        {
          baseUrl: BASE_URL,
          path,
          method,
          query,
          cacheDir: cache.dir,
        },
      );

      // Assert: Cache file should exist and contain correct content
      const cacheFilePath = join(
        cache.dir,
        encodeURIComponent(BASE_URL),
        method,
        path,
        "response.json",
      );
      expect(existsSync(cacheFilePath)).toBe(true);

      const result = await getCache(BASE_URL, method, path, query, cache.dir);
      expect(result?.body).toBe(responseBody);
      expect(result?.status).toBe(status);
      expect(result?.headers.get("content-type")).toBe("application/json");
    });
  });

  describe("Edge Cases", () => {
    test("should handle paths with leading slash correctly", async () => {
      // Arrange: Prepare path with leading slash
      const path = "/users/123";
      const method = "GET";
      const query = {};
      const responseBody = JSON.stringify({ id: 123 });

      // Act: Store cache with leading slash path
      await cacheResponse(
        {
          body: responseBody,
          status: 200,
          headers: new Headers(),
        },
        {
          baseUrl: BASE_URL,
          path,
          method,
          query,
          cacheDir: cache.dir,
        },
      );

      // Assert: Should retrieve cache correctly
      const result = await getCache(BASE_URL, method, path, query, cache.dir);
      expect(result?.body).toBe(responseBody);
    });
  });
});
