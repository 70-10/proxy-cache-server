import { serve } from "@hono/node-server";
import { defineCommand } from "citty";
import { Hono } from "hono";
import type { StatusCode } from "hono/utils/http-status";
import { cacheResponse, getCache } from "src/cache";
import { DEFAULT_CACHE_DIRECTORY_NAME } from "src/models/constants";

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
  headers.delete("Set-Cookie");

  return headers;
}

export function createProxyApp(baseUrl: string, cacheDir: string): Hono {
  const app = new Hono();

  app.all("*", async (c) => {
    const query = c.req.query();
    const path = c.req.path;
    const method = c.req.method;
    const url = createRequestUrl(baseUrl, path, query);
    const cache = await getCache(baseUrl, method, path, query, cacheDir);

    if (cache) {
      return c.body(cache.body, {
        status: cache.status,
        headers: cache.headers,
      });
    }

    try {
      const res = await fetch(url.toString(), {
        method,
        headers: cleanRequestHeaders(new Headers(c.req.header())),
        body:
          method !== "GET" && method !== "HEAD"
            ? await c.req.text()
            : undefined,
      });

      const text = await res.text();
      const responseHeaders = createResponseHeaders(res.headers);

      await cacheResponse(
        {
          body: text,
          status: res.status,
          headers: responseHeaders,
        },
        {
          baseUrl,
          path,
          method,
          query,
          cacheDir,
        },
      );

      return c.body(text, {
        status: res.status as StatusCode,
        headers: responseHeaders,
      });
    } catch (error) {
      console.error("Proxy request failed:", error);
      return c.body("Proxy request failed", { status: 502 });
    }
  });

  return app;
}

export const serveCommand = defineCommand({
  meta: {
    name: "serve",
    description: "Start the proxy server",
  },
  args: {
    target: {
      type: "positional",
      description: "Target URL to proxy",
      required: true,
    },
    cache: {
      type: "string",
      description: "Cache directory path",
      default: DEFAULT_CACHE_DIRECTORY_NAME,
    },
    port: {
      type: "string",
      description: "Port number to listen on",
      default: "3000",
    },
  },
  async run({ args }) {
    const proxyBaseUrl = args.target;
    const port = Number.parseInt(args.port, 10);
    const cacheDir = args.cache;

    if (!proxyBaseUrl) {
      console.error("Target URL is required");
      process.exit(1);
    }

    const app = createProxyApp(proxyBaseUrl, cacheDir);

    try {
      console.log(`Starting proxy server on http://localhost:${port}`);
      console.log(`Proxying requests to: ${proxyBaseUrl}`);
      console.log(`Cache directory: ${cacheDir}`);

      serve({
        fetch: app.fetch,
        port: port,
      });

      console.log(`Server is running at http://localhost:${port}`);
    } catch (error) {
      console.error("Failed to start server:", error);
      process.exit(1);
    }
  },
});
