import { readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import type { CacheContent, CacheEntry } from "./models";

export async function findCacheFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await findCacheFiles(fullPath)));
    } else if (entry.name === "response.json") {
      files.push(fullPath);
    }
  }

  return files;
}

export async function parseCacheFile(
  filePath: string,
): Promise<CacheEntry | null> {
  try {
    // キャッシュファイルのパスから情報を抽出
    const pathParts = filePath.split("/");
    const methodIndex = pathParts.indexOf(".proxy-cache") + 2;
    if (methodIndex >= pathParts.length) return null;

    const baseUrl = decodeURIComponent(pathParts[methodIndex - 1]);
    const method = pathParts[methodIndex];

    // パス部分の抽出（methodIndex以降からresponse.jsonの前まで）
    const pathSegments = pathParts.slice(methodIndex + 1, -1);
    // cache ディレクトリの存在確認
    const cacheIndex = pathParts.indexOf(".proxy-cache");
    if (cacheIndex === -1) return null;

    let path = "";
    let query = "";

    if (pathSegments.length > 0) {
      // パスセグメントをデコード
      const decodedSegments = pathSegments.map((segment) => {
        try {
          return decodeURIComponent(segment);
        } catch {
          return segment;
        }
      });

      const lastSegment = decodedSegments[decodedSegments.length - 1];
      if (lastSegment?.includes("=")) {
        // クエリパラメータを分離
        path = decodedSegments.slice(0, -1).join("/");
        query = `?${lastSegment}`;
      } else {
        path = decodedSegments.join("/");
      }
    }

    const fullUrl = `${baseUrl}${path ? `/${path}` : ""}${query}`;

    // キャッシュファイルの内容を読み込み
    const content = await readFile(filePath, "utf-8");
    let cacheData: CacheContent;
    try {
      cacheData = JSON.parse(content) as CacheContent;
      if (!cacheData?.status) return null;
    } catch {
      return null;
    }

    const stats = await stat(filePath);

    return {
      method,
      fullUrl,
      status: cacheData.status,
      cachedAt: new Date(stats.mtime),
    };
  } catch (error) {
    console.error("Failed to parse cache file:", filePath, error);
    return null;
  }
}

export async function existsDir(dir: string): Promise<boolean> {
  try {
    await stat(dir);
    return true;
  } catch {
    return false;
  }
}
