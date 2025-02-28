import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { StatusCode } from "hono/utils/http-status";

interface CacheContent {
  status: number;
  headers: Record<string, string>;
  body: string;
}

export async function getCache(
  baseUrl: string,
  method: string,
  path: string,
  query: Record<string, string>,
  cacheDir = "cache",
) {
  // ファイルキャッシュのパスを組み立てる
  const relativePath = path.replace(/^\//, ""); // 先頭の / を除去
  const cacheFilePath = createCacheFilePath(
    baseUrl,
    method,
    relativePath,
    query,
    cacheDir,
  );

  try {
    const cachedContent = await readFile(cacheFilePath, "utf-8");
    const cached = JSON.parse(cachedContent) satisfies CacheContent;

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
  headers: Headers,
  baseUrl: string,
  path: string,
  method: string,
  query: Record<string, string>,
  cacheDir = "cache",
) {
  const relativePath = path.replace(/^\//, "");
  const cacheFilePath = createCacheFilePath(
    baseUrl,
    method,
    relativePath,
    query,
    cacheDir,
  );

  const cacheData = {
    body,
    status,
    headers: (() => {
      const headersObj: Record<string, string> = {};
      headers.forEach((value, key) => {
        headersObj[key] = value;
      });
      return headersObj;
    })(),
  } satisfies CacheContent;

  try {
    await mkdir(dirname(cacheFilePath), { recursive: true });
    await writeFile(cacheFilePath, JSON.stringify(cacheData));
    console.log("Saved response to cache:", cacheFilePath);
  } catch (err) {
    console.error("Failed to write cache file", cacheFilePath, err);
  }
}

function createCacheFilePath(
  baseUrl: string,
  method: string,
  path: string,
  query: Record<string, string>,
  cacheDir = "cache",
) {
  // クエリパラメーターをソートしてキー=値の形式に変換
  const queryString = Object.entries(query)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  // クエリがある場合はそれもパスに含める
  const pathWithQuery = queryString
    ? `${path}/${encodeURIComponent(queryString)}`
    : path;

  return join(
    cacheDir,
    encodeURIComponent(baseUrl),
    method,
    pathWithQuery,
    "response.json",
  );
}
