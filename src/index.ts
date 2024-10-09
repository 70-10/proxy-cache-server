import { Hono } from 'hono'
import { StatusCode } from 'hono/utils/http-status'

if (!Bun.env.PROXY_CACHE_SERVER_BASE_URL) {
  throw new Error("PROXY_CACHE_SERVER_BASE_URL is required")
}
const proxyBaseUrl = Bun.env.PROXY_CACHE_SERVER_BASE_URL;

const app = new Hono()

app.all("*", async c => {
  const url = createRequestUrl(proxyBaseUrl, c.req.path, c.req.query())

  const res = await fetch(url.toString(), {
    method: c.req.method,
    body: c.req.method !== "GET" && c.req.method !== "HEAD"
      ? await c.req.text()
      : undefined,
  })

  return c.body(await res.text(), {
    status: res.status as StatusCode,
    headers: createResponseHeaders(res.headers)
  });
})

export default app

function createRequestUrl(baseUrl: string, path: string, query: Record<string, string>) {
  const url = new URL(path, baseUrl);
  for (const key in query) {
    url.searchParams.append(key, query[key]);
  }
  return url;
}


function createResponseHeaders(proxyResponseHeaders: Headers) {
  const headers = new Headers(proxyResponseHeaders);
  headers.delete('Content-Encoding');
  headers.delete('Content-Length');
  headers.delete('Transfer-Encoding');
  headers.delete('Connection');
  headers.delete('Proxy-Authenticate');
  headers.delete('Proxy-Authorization');
  headers.delete('Via');
  headers.delete('Server');
  headers.delete('X-Powered-By');

  // TODO: check
  headers.delete('Set-Cookie');

  return headers
}