import { describe, expect, test } from "vitest";
import {
  createFailingFetch,
  createMockFetch,
  setupIntegrationTest,
} from "../../../../tests/helper/integration-utils";
import { createProxyApp } from "./command";

const BASE_URL = "https://api.example.com";

describe("Proxy Server Integration", () => {
  const ctx = setupIntegrationTest();

  describe("Positive Cases", () => {
    test("should forward GET request and cache the response", async () => {
      const mockFetch = createMockFetch({
        body: '{"id":1}',
        status: 200,
        headers: { "content-type": "application/json" },
      });

      const app = createProxyApp(BASE_URL, ctx.dir);
      const res = await app.request("/users");

      expect(res.status).toBe(200);
      expect(await res.text()).toBe('{"id":1}');
      expect(mockFetch).toHaveBeenCalledOnce();

      // Second request should return cached response
      const res2 = await app.request("/users");
      expect(res2.status).toBe(200);
      expect(await res2.text()).toBe('{"id":1}');
      expect(mockFetch).toHaveBeenCalledOnce(); // fetch not called again
    });

    test("should forward POST request with body", async () => {
      const mockFetch = createMockFetch({
        body: '{"created":true}',
        status: 201,
      });

      const app = createProxyApp(BASE_URL, ctx.dir);
      const res = await app.request("/users", {
        method: "POST",
        body: '{"name":"test"}',
        headers: { "content-type": "application/json" },
      });

      expect(res.status).toBe(201);
      expect(await res.text()).toBe('{"created":true}');
      expect(mockFetch).toHaveBeenCalledOnce();

      const [, options] = mockFetch.mock.calls[0];
      expect(options.method).toBe("POST");
      expect(options.body).toBe('{"name":"test"}');
    });

    test("should forward PUT request with body", async () => {
      const mockFetch = createMockFetch({
        body: '{"updated":true}',
        status: 200,
      });

      const app = createProxyApp(BASE_URL, ctx.dir);
      const res = await app.request("/users/1", {
        method: "PUT",
        body: '{"name":"updated"}',
      });

      expect(res.status).toBe(200);
      expect(await res.text()).toBe('{"updated":true}');

      const [, options] = mockFetch.mock.calls[0];
      expect(options.method).toBe("PUT");
      expect(options.body).toBe('{"name":"updated"}');
    });

    test("should forward DELETE request", async () => {
      const mockFetch = createMockFetch({
        body: '{"deleted":true}',
        status: 200,
      });

      const app = createProxyApp(BASE_URL, ctx.dir);
      const res = await app.request("/users/1", { method: "DELETE" });

      expect(res.status).toBe(200);
      expect(await res.text()).toBe('{"deleted":true}');
      expect(mockFetch).toHaveBeenCalledOnce();

      const [, options] = mockFetch.mock.calls[0];
      expect(options.method).toBe("DELETE");
    });
  });

  describe("Edge Cases", () => {
    test("should remove proxy-specific headers from request", async () => {
      const mockFetch = createMockFetch({ body: "ok" });

      const app = createProxyApp(BASE_URL, ctx.dir);
      await app.request("/test", {
        headers: {
          Host: "malicious.com",
          Connection: "keep-alive",
          "Proxy-Authorization": "Basic abc",
          Upgrade: "websocket",
          Referer: "http://evil.com",
          "X-Custom": "keep-this",
        },
      });

      const [, options] = mockFetch.mock.calls[0];
      const sentHeaders = options.headers as Headers;
      expect(sentHeaders.get("Host")).toBeNull();
      expect(sentHeaders.get("Connection")).toBeNull();
      expect(sentHeaders.get("Proxy-Authorization")).toBeNull();
      expect(sentHeaders.get("Upgrade")).toBeNull();
      expect(sentHeaders.get("Referer")).toBeNull();
      expect(sentHeaders.get("X-Custom")).toBe("keep-this");
    });

    test("should remove proxy-specific headers from response", async () => {
      createMockFetch({
        body: "ok",
        headers: {
          "content-type": "text/plain",
          "x-custom": "keep-this",
        },
      });

      const app = createProxyApp(BASE_URL, ctx.dir);
      const res = await app.request("/test");

      expect(res.headers.get("content-type")).toBe("text/plain");
      expect(res.headers.get("x-custom")).toBe("keep-this");
      // These should be removed by createResponseHeaders
      expect(res.headers.get("Content-Encoding")).toBeNull();
      expect(res.headers.get("Set-Cookie")).toBeNull();
      expect(res.headers.get("Server")).toBeNull();
    });

    test("should handle query parameters correctly", async () => {
      const mockFetch = createMockFetch({ body: "ok" });

      const app = createProxyApp(BASE_URL, ctx.dir);
      await app.request("/search?q=hello&page=1");

      const [url] = mockFetch.mock.calls[0];
      const parsedUrl = new URL(url as string);
      expect(parsedUrl.searchParams.get("q")).toBe("hello");
      expect(parsedUrl.searchParams.get("page")).toBe("1");
    });

    test("should treat query parameter order as independent for caching", async () => {
      const mockFetch = createMockFetch({ body: '{"result":"cached"}' });

      const app = createProxyApp(BASE_URL, ctx.dir);

      // First request with one order
      const res1 = await app.request("/search?a=1&b=2");
      expect(await res1.text()).toBe('{"result":"cached"}');
      expect(mockFetch).toHaveBeenCalledOnce();

      // Second request with reversed order should hit cache
      const res2 = await app.request("/search?b=2&a=1");
      expect(await res2.text()).toBe('{"result":"cached"}');
      expect(mockFetch).toHaveBeenCalledOnce(); // fetch not called again
    });
  });

  describe("Negative Cases", () => {
    test("should return 502 when fetch fails", async () => {
      createFailingFetch("Connection refused");

      const app = createProxyApp(BASE_URL, ctx.dir);
      const res = await app.request("/fail");

      expect(res.status).toBe(502);
      expect(await res.text()).toBe("Proxy request failed");
    });
  });
});
