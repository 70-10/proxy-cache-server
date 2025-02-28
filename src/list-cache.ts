import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";

interface CacheContent {
  status: number;
  headers: Record<string, string>;
  body: string;
}

interface CacheEntry {
  method: string;
  fullUrl: string;
  status: number;
  cachedAt: Date;
}

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
    const methodIndex = pathParts.indexOf("cache") + 2;
    if (methodIndex >= pathParts.length) return null;

    const baseUrl = decodeURIComponent(pathParts[methodIndex - 1]);
    const method = pathParts[methodIndex];

    // パス部分の抽出（methodIndex以降からresponse.jsonの前まで）
    const pathSegments = pathParts.slice(methodIndex + 1, -1);
    // cache ディレクトリの存在確認
    const cacheIndex = pathParts.indexOf("cache");
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

async function existsDir(dir: string): Promise<boolean> {
  try {
    await stat(dir);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const cacheDir = "cache";

  if (!(await existsDir(cacheDir))) {
    console.log("No cache entries found.");
    return;
  }

  try {
    const cacheFiles = await findCacheFiles(cacheDir);
    const entries = await Promise.all(
      cacheFiles.map((file) => parseCacheFile(file)),
    );

    // nullを除外して有効なエントリのみを取得
    const validEntries = entries.filter(
      (entry): entry is CacheEntry => entry !== null,
    );

    if (validEntries.length === 0) {
      console.log("No cache entries found.");
      return;
    }

    // 日時でソート（新しい順）
    validEntries.sort((a, b) => b.cachedAt.getTime() - a.cachedAt.getTime());

    // 結果を表示
    for (const entry of validEntries) {
      const timestamp = entry.cachedAt.toLocaleString();
      console.log(
        `${entry.method} ${entry.fullUrl} (${entry.status}) - Cached at ${timestamp}`,
      );
    }
  } catch (error) {
    console.error("Failed to list cache entries:", error);
    process.exit(1);
  }
}

main();
