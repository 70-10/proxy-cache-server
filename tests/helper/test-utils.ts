import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Type definition for JSON-serializable values
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

/**
 * Creates a test file with the specified content.
 * Automatically creates parent directories if they don't exist.
 *
 * @param path - The file path where the content should be written
 * @param content - The content to write (will be JSON stringified)
 */
export async function createTestFile(
  path: string,
  content: JsonValue,
): Promise<void> {
  const dir = path.split("/").slice(0, -1).join("/");
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
  await writeFile(path, JSON.stringify(content));
}

/**
 * Recursively deletes a directory and all its contents.
 * Safely handles non-existent directories.
 *
 * @param dir - The directory path to delete
 */
export async function deleteDir(dir: string): Promise<void> {
  if (existsSync(dir)) {
    await import("node:fs/promises").then((fs) =>
      fs.rm(dir, { recursive: true }),
    );
  }
}

/**
 * Creates a unique temporary test directory.
 * Uses timestamp and random string to ensure uniqueness.
 *
 * @returns The path to the created test directory
 */
export function createTestCacheDir(): string {
  const timestamp = new Date().getTime();
  const random = Math.random().toString(36).substring(2, 15);
  return join(".test-cache", `${timestamp}-${random}`);
}
