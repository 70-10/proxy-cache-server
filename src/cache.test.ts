import { describe, it, expect, beforeEach, jest, spyOn } from "bun:test";
import { getCache, cacheResponse } from "./cache";
import * as fs from "node:fs/promises";

describe("getCache", () => {
  it("returns null when cache file not found", async () => {
    // Arrange
    const readFileSpy = spyOn(fs, "readFile").mockRejectedValue(
      new Error("File not found"),
    );

    // Act
    const actual = await getCache("http://example.com", "GET", "/foo");

    // Assert
    expect(actual).toBeNull();
    expect(readFileSpy).toHaveBeenCalledTimes(1);
  });
});
