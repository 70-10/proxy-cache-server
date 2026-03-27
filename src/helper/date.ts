/**
 * Format a date to YYYY/MM/DD HH:mm:ss format
 *
 * @param date - The date to format
 * @returns Formatted date string in YYYY/MM/DD HH:mm:ss format
 */
export function formatDateTime(date: Date): string {
  const formattedDate = date
    .toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\D/g, "/");

  const formattedTime = date.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return `${formattedDate} ${formattedTime}`;
}
