# Proxy Cache Server

A caching proxy server for API responses, perfect for development and testing environments.

## ✨ Features

- **Zero Installation**: Use directly with `npx` - no global installation required
- **Universal Compatibility**: Works with Node.js 20+, no additional runtime dependencies
- **Smart Caching**: Automatically caches API responses by URL, method, and query parameters
- **All HTTP Methods**: Full support for GET, POST, PUT, DELETE, PATCH, etc.
- **Header Preservation**: Maintains response headers and status codes
- **Query Parameter Handling**: Different query parameters are cached separately
- **Clean Output**: Removes unnecessary proxy-related headers automatically

## 🚀 Quick Start

The fastest way to get started is with `npx` - no installation required:

```bash
# Start the proxy server on port 3000
npx -y 70-10/proxy-cache-server serve https://api.example.com --port 3000
```

Now make requests to `http://localhost:3000` and they'll be cached automatically!

## 📋 Requirements

- Node.js 20.0.0 or higher

## 🔧 Usage

### Basic Commands

```bash
# Show help
npx -y 70-10/proxy-cache-server --help

# Start proxy server (default port: 3000)
npx -y 70-10/proxy-cache-server serve https://api.example.com

# Start proxy server on specific port
npx -y 70-10/proxy-cache-server serve https://api.example.com --port 8080

# List all cached entries
npx -y 70-10/proxy-cache-server cache list
```

### Environment Configuration

```bash
# Optional: Set custom cache directory (default: .proxy-cache)
export PROXY_CACHE_SERVER_CACHE_DIR=./my-cache
```

## 🎯 Use Cases

- **Development Speed**: Reduce API calls during frontend development
- **Offline Development**: Work with cached responses when API is unavailable  
- **API Testing**: Create reproducible test scenarios with cached responses
- **Slow API Mitigation**: Cache responses from slow third-party APIs
- **Rate Limit Avoidance**: Avoid hitting API rate limits during development

## 🗂️ How Caching Works

### Request Flow

1. **Incoming Request**: Client makes request to proxy server
2. **Cache Check**: Server checks if response is already cached
3. **Cache Hit**: If cached, returns stored response immediately
4. **Cache Miss**: If not cached:
   - Forwards request to target API
   - Stores the response in cache
   - Returns response to client

### Cache Structure

```
cache/
├── [encoded-base-url]/
│   ├── [http-method]/
│   │   ├── [path]/
│   │   │   ├── [encoded-query-params]/
│   │   │   │   └── response.json
```

### Query Parameter Handling

- **Separate Caching**: Different query parameters create separate cache entries
- **Parameter Sorting**: `?foo=1&bar=2` and `?bar=2&foo=1` use the same cache
- **Example**:
  - `GET /users?page=1` → cached separately from
  - `GET /users?page=2` → cached separately from  
  - `GET /users` (no params)

## 📊 Cache Management

### List Cache Entries

View all cached API responses:

```bash
npx -y 70-10/proxy-cache-server cache list
```

**Example Output:**
```
GET https://api.example.com/users (200) - Cached at 2024-02-28 13:45:30
GET https://api.example.com/users?page=1 (200) - Cached at 2024-02-28 13:46:15
POST https://api.example.com/users/123/update (201) - Cached at 2024-02-28 13:47:00
```

### Cache Operations

```bash
# Count cached entries
npx -y 70-10/proxy-cache-server cache list | wc -l

# Find specific endpoints
npx -y 70-10/proxy-cache-server cache list | grep "users"

# Clear cache (manual)
rm -rf .proxy-cache/
```

## 🛠️ Development Setup

For local development of this tool:

```bash
# Clone repository
git clone https://github.com/70-10/proxy-cache-server.git
cd proxy-cache-server

# Install dependencies (requires Bun for development)
bun install

# Run in development mode
bun run dev

# Build for production
bun run build
```

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Issues and pull requests are welcome! Please see [GitHub Issues](https://github.com/70-10/proxy-cache-server/issues) for current roadmap and known issues.