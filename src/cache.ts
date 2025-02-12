import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { HonoRequest } from "hono";
import type { StatusCode } from "hono/utils/http-status";

export async function getCache(baseUrl: string, req: HonoRequest) {
  const method = req.method;
  // ファイルキャッシュのパスを組み立てる
  const relativePath = req.path.replace(/^\//, ""); // 先頭の / を除去
  const cacheFilePath = createCacheFilePath(baseUrl, method, relativePath);

  try {
    const cachedContent = await readFile(cacheFilePath, "utf-8");
    const cached = JSON.parse(cachedContent) as {
      body: string;
      status: number;
      headers: Record<string, string>;
    };

    console.log("Return response from cache:", cacheFilePath);
    return {
      body: cached.body,
      status: cached.status as StatusCode,
      headers: new Headers(cached.headers),
    };
  } catch (e) {
    console.log("Cache not found, fetch from API:", cacheFilePath);
    return null;
  }
}

export async function cacheResponse(
  body: string,
  status: number,
  responseHeaders: Headers,
  baseUrl: string,
  path: string,
  method: string,
) {
  const relativePath = path.replace(/^\//, "");
  const cacheFilePath = createCacheFilePath(baseUrl, method, relativePath);

  const cacheData = {
    body,
    status,
    headers: (() => {
      const headersObj: Record<string, string> = {};
      responseHeaders.forEach((value, key) => {
        headersObj[key] = value;
      });
      return headersObj;
    })(),
  };
  try {
    await mkdir(dirname(cacheFilePath), { recursive: true });
    await writeFile(cacheFilePath, JSON.stringify(cacheData));
    console.log("Saved response to cache:", cacheFilePath);
  } catch (err) {
    console.error("Failed to write cache file", cacheFilePath, err);
  }
}

function createCacheFilePath(baseUrl: string, method: string, path: string) {
  return join(
    "cache",
    encodeURIComponent(baseUrl),
    method,
    path,
    "response.json",
  );
}
