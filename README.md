# Proxy Cache Server

A proxy server that caches API responses, useful for development and testing environments.

## Features

- Supports all HTTP methods (GET, POST, etc.)
- Caches response body, status code, and headers
- Handles query parameters (different query parameters are cached separately)
- Automatic header cleaning (removes unnecessary proxy-related headers)
- Hot-reloading support during development

## Setup

1. Install dependencies:
```bash
bun install
```

2. Set the required environment variable:
```bash
export PROXY_CACHE_SERVER_BASE_URL=https://api.example.com
```

## Usage

Start the development server (with hot-reloading):
```bash
bun run dev
```

## How it Works

1. When a request is received:
   - First checks if a cached response exists
   - If cache exists, returns the cached response
   - If no cache exists:
     1. Forwards the request to the configured base URL
     2. Caches the response
     3. Returns the response to the client

2. Cache Storage:
   ```
   cache/
   ├── [encoded-base-url]/
   │   ├── [http-method]/
   │   │   ├── [path]/
   │   │   │   ├── [encoded-query-params]/
   │   │   │   │   └── response.json
   ```

3. Query Parameter Handling:
   - Requests with different query parameters are cached separately
   - Example:
     - `GET /users/?foo=bar`
     - `GET /users/?foo=baz`
   - These are treated as different requests and cached separately
   - Query parameters are sorted before caching
     - `foo=1&bar=2` and `bar=2&foo=1` use the same cache

## Use Cases

- Reduce API calls during development
- Create a mock server for testing
- Cache slow API responses
- Work offline with previously cached responses

## Cache Management

### Listing Cache Entries

The cache-list functionality allows you to view all cached API responses in your system.

```bash
bun run src/list-cache.ts
```

#### Output Format

Each cache entry is displayed in the following format:
```
[HTTP_METHOD] [FULL_URL] (STATUS_CODE) - Cached at [TIMESTAMP]
```

Example output:
```
GET https://api.example.com/users (200) - Cached at 2024-02-28 13:45:30
GET https://api.example.com/users?page=1 (200) - Cached at 2024-02-28 13:46:15
POST https://api.example.com/users/123/update (201) - Cached at 2024-02-28 13:47:00
```

#### Features

- Lists all cached API responses with their HTTP method, URL, status code, and cache timestamp
- Sorts entries by cache time (newest first)
- Handles encoded URLs and query parameters correctly
- Displays UTF-8 encoded paths properly
- Shows both successful and error responses

#### Notes

- If no cache entries exist or the cache directory is not found, displays "No cache entries found."
- Query parameters in URLs are preserved exactly as they were cached
- Cache entries are displayed in chronological order with the most recent entries first
- Special characters in URLs (including non-ASCII characters) are properly decoded for display

#### Common Use Cases

1. **Audit Cache Contents**
   ```bash
   bun run src/list-cache.ts
   ```
   View all cached responses to understand what's available locally.

2. **Debug Cache Issues**
   ```bash
   bun run src/list-cache.ts | grep "users"
   ```
   Find specific cached endpoints by filtering the output.

3. **Monitor Cache Growth**
   ```bash
   bun run src/list-cache.ts | wc -l
   ```
   Count the number of cached responses.

#### Performance Considerations

- The list operation reads metadata from each cache file
- For large cache directories with many entries, listing may take longer
- Consider cleaning old cache entries periodically if performance becomes an issue