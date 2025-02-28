import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { getCache, cacheResponse } from "./cache";
import { rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

async function deleteDir(dir: string) {
  if (existsSync(dir)) {
    await rm(dir, { recursive: true });
  }
}

function createTestCacheDir() {
  const timestamp = new Date().getTime();
  const random = Math.random().toString(36).substring(2, 15);
  return join(".test-cache", `${timestamp}-${random}`);
}

describe("cache", () => {
  const baseUrl = "https://api.example.com";
  let testCacheDir: string;

  beforeEach(async () => {
    // Arrange: 新しいテスト用キャッシュディレクトリを作成
    testCacheDir = createTestCacheDir();
  });

  afterEach(async () => {
    // Cleanup: テスト後にキャッシュディレクトリを削除
    await deleteDir(testCacheDir);
  });

  describe("getCache", () => {
    test("returns null when cache does not exist", async () => {
      // Arrange
      const path = "/users";
      const method = "GET";
      const query = {};

      // Act
      const result = await getCache(baseUrl, method, path, query, testCacheDir);

      // Assert
      expect(result).toBeNull();
    });

    test("returns cached response when cache exists", async () => {
      // Arrange
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

      // Act
      const result = await getCache(baseUrl, method, path, query, testCacheDir);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.body).toBe(responseBody);
      expect(result?.status).toBe(status);
      expect(result?.headers.get("content-type")).toBe("application/json");
    });

    test("handles different query parameters separately", async () => {
      // Arrange
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

      // Act
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

      // Assert
      expect(result1?.body).toBe(response1);
      expect(result2?.body).toBe(response2);
    });

    test("query parameter order does not affect caching", async () => {
      // Arrange
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

      // Act
      const result = await getCache(
        baseUrl,
        method,
        path,
        query2,
        testCacheDir,
      );

      // Assert
      expect(result?.body).toBe(responseBody);
    });
  });

  describe("cacheResponse", () => {
    test("creates cache file with correct content", async () => {
      // Arrange
      const path = "/users";
      const method = "GET";
      const query = {};
      const responseBody = JSON.stringify({ id: 1 });
      const status = 200;
      const headers = new Headers({ "content-type": "application/json" });

      // Act
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

      // Assert
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

    test("handles paths with leading slash", async () => {
      // Arrange
      const path = "/users/123";
      const method = "GET";
      const query = {};
      const responseBody = JSON.stringify({ id: 123 });

      // Act
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

      // Assert
      const result = await getCache(baseUrl, method, path, query, testCacheDir);
      expect(result?.body).toBe(responseBody);
    });
  });
});
