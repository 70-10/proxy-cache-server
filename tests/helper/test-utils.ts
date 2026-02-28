import { afterEach, beforeEach } from "vitest";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

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
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(content));
}

/**
 * Recursively deletes a directory and all its contents.
 * Safely handles non-existent directories.
 *
 * @param dir - The directory path to delete
 */
export async function deleteDir(dir: string): Promise<void> {
  await rm(dir, { recursive: true, force: true });
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

/**
 * Sets up a temporary test cache directory with automatic beforeEach/afterEach lifecycle.
 * Returns a context object whose `dir` property is updated before each test.
 *
 * @returns Context object with `dir` property pointing to the current test directory
 */
export function setupTestCacheDir(): { dir: string } {
  const ctx = { dir: "" };

  beforeEach(async () => {
    ctx.dir = createTestCacheDir();
    await mkdir(ctx.dir, { recursive: true });
  });

  afterEach(async () => {
    await deleteDir(ctx.dir);
  });

  return ctx;
}
