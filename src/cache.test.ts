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

describe("cache", () => {
  const baseUrl = "https://api.example.com";
  const cacheDir = "cache";

  beforeEach(async () => {
    // Arrange: テスト前にキャッシュディレクトリを削除
    await deleteDir(cacheDir);
  });

  afterEach(async () => {
    // Cleanup: テスト後にキャッシュディレクトリを削除
    await deleteDir(cacheDir);
  });

  describe("getCache", () => {
    test("returns null when cache does not exist", async () => {
      // Arrange
      const path = "/users";
      const method = "GET";
      const query = {};

      // Act
      const result = await getCache(baseUrl, method, path, query);

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
      );

      // Act
      const result = await getCache(baseUrl, method, path, query);

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
      );

      await cacheResponse(
        response2,
        200,
        new Headers(),
        baseUrl,
        path,
        method,
        query2,
      );

      // Act
      const result1 = await getCache(baseUrl, method, path, query1);
      const result2 = await getCache(baseUrl, method, path, query2);

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
      );

      // Act
      const result = await getCache(baseUrl, method, path, query2);

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
      );

      // Assert
      const cacheFilePath = join(
        cacheDir,
        encodeURIComponent(baseUrl),
        method,
        path,
        "response.json",
      );
      expect(existsSync(cacheFilePath)).toBe(true);

      const result = await getCache(baseUrl, method, path, query);
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
      );

      // Assert
      const result = await getCache(baseUrl, method, path, query);
      expect(result?.body).toBe(responseBody);
    });
  });
});
