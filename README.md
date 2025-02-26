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