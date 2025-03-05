import { defineCommand } from "citty";
import {
  existsDir,
  findCacheFiles,
  parseCacheFile,
} from "../../../../list-cache";
import type { CacheEntry } from "../../../../models";
import { DEFAULT_CACHE_DIRECTORY_NAME } from "../../../../models/constants";

export const listCommand = defineCommand({
  meta: {
    name: "list",
    description: "List all cached items",
  },
  async run() {
    const cacheDir = DEFAULT_CACHE_DIRECTORY_NAME;

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
  },
});
