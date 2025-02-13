import { Hono } from "hono";
import type { StatusCode } from "hono/utils/http-status";
import { cacheResponse, getCache } from "./cache";

if (!Bun.env.PROXY_CACHE_SERVER_BASE_URL) {
  throw new Error("PROXY_CACHE_SERVER_BASE_URL is required");
}
const proxyBaseUrl = Bun.env.PROXY_CACHE_SERVER_BASE_URL;

const app = new Hono();

app.all("*", async (c) => {
  const url = createRequestUrl(proxyBaseUrl, c.req.path, c.req.query());
  const method = c.req.method;
  const cache = await getCache(proxyBaseUrl, c.req.method, c.req.path);
  if (cache) {
    return c.body(cache.body, {
      status: cache.status,
      headers: cache.headers,
    });
  }

  const res = await fetch(url.toString(), {
    method,
    headers: cleanRequestHeaders(new Headers(c.req.header())),
    body:
      method !== "GET" && method !== "HEAD" ? await c.req.text() : undefined,
  });
  const text = await res.text();
  const responseHeaders = createResponseHeaders(res.headers);

  await cacheResponse(
    text,
    res.status,
    responseHeaders,
    proxyBaseUrl,
    c.req.path,
    c.req.method,
  );

  return c.body(text, {
    status: res.status as StatusCode,
    headers: responseHeaders,
  });
});

export default app;

function createRequestUrl(
  baseUrl: string,
  path: string,
  query: Record<string, string>,
) {
  const url = new URL(path, baseUrl);
  for (const key in query) {
    url.searchParams.append(key, query[key]);
  }
  return url;
}

function cleanRequestHeaders(originalHeaders: Headers): Headers {
  const headers = new Headers(originalHeaders);

  headers.delete("Host");
  headers.delete("Connection");
  headers.delete("Proxy-Authorization");
  headers.delete("Upgrade");
  headers.delete("Referer");

  return headers;
}

function createResponseHeaders(proxyResponseHeaders: Headers): Headers {
  const headers = new Headers(proxyResponseHeaders);
  headers.delete("Content-Encoding");
  headers.delete("Content-Length");
  headers.delete("Transfer-Encoding");
  headers.delete("Connection");
  headers.delete("Proxy-Authenticate");
  headers.delete("Proxy-Authorization");
  headers.delete("Via");
  headers.delete("Server");
  headers.delete("X-Powered-By");

  // TODO: check
  headers.delete("Set-Cookie");

  return headers;
}
