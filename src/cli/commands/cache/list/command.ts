import { defineCommand } from "citty";
import {
  existsDir,
  findCacheFiles,
  parseCacheFile,
} from "../../../../list-cache";
import type { CacheEntry } from "../../../../models";
import { DEFAULT_CACHE_DIRECTORY_NAME } from "../../../../models/constants";
import { formatDateTime } from "../../../../helper/date";

export const listCommand = defineCommand({
  meta: {
    name: "list",
    description: "List all cached items",
  },
  args: {
    cache: {
      type: "string",
      description: "Cache directory path",
      default: DEFAULT_CACHE_DIRECTORY_NAME,
    },
  },
  async run({ args }) {
    const cacheDir = args.cache;

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

      // URLで昇順ソート
      validEntries.sort((a, b) => a.fullUrl.localeCompare(b.fullUrl));

      // 最も長いURLの長さを取得してパディングの基準とする
      const maxUrlLength = Math.max(
        ...validEntries.map((entry) => entry.fullUrl.length),
      );

      // 結果を表示
      for (const entry of validEntries) {
        const timestamp = formatDateTime(entry.cachedAt);
        console.log(
          // Payment Control Format Specification requires consistent field widths and formatting:
          // - HTTP method: 7 characters wide
          // - URL: full URL with padding aligned to the longest URL
          // - Status: enclosed in parentheses
          // - Timestamp: fixed position alignment after status
          `${entry.method.padEnd(7)} ${entry.fullUrl.padEnd(maxUrlLength)} (${entry.status})    Cached at: ${timestamp}`,
        );
      }
    } catch (error) {
      console.error("Failed to list cache entries:", error);
      process.exit(1);
    }
  },
});
