export interface CacheEntry {
  method: string;
  fullUrl: string;
  status: number;
  cachedAt: Date;
}
