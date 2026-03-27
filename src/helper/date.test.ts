import { describe, test, expect } from "bun:test";
import { formatDateTime } from "./date";

describe("formatDateTime", () => {
  test("formats regular date and time correctly", () => {
    const date = new Date("2024-03-15T14:30:45");
    expect(formatDateTime(date)).toBe("2024/03/15 14:30:45");
  });

  test("formats single digit month and day with leading zeros", () => {
    const date = new Date("2024-01-05T09:05:08");
    expect(formatDateTime(date)).toBe("2024/01/05 09:05:08");
  });

  test("formats time after noon correctly in 24-hour format", () => {
    const date = new Date("2024-12-31T23:59:59");
    expect(formatDateTime(date)).toBe("2024/12/31 23:59:59");
  });

  test("formats time before noon correctly in 24-hour format", () => {
    const date = new Date("2024-12-31T00:00:00");
    expect(formatDateTime(date)).toBe("2024/12/31 00:00:00");
  });
});
