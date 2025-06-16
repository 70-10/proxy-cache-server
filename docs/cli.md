# Proxy Cache Server CLI Documentation

## Requirements

- Node.js >=20.0.0

## Installation

Execute the following commands to install:

```bash
# Clone the repository
git clone <repository-url>
cd proxy-cache-server

# Install dependencies with npm
npm install

# Build the project
npm run build
```

## Basic Usage

proxy-cache-server provides the following main commands:

```bash
proxy-cache-server <command> [options]
```

Available commands:
- `serve`: Start the proxy server
- `cache`: Cache management commands
  - `list`: Display list of cached items

## Command Details

### Starting the Server

```bash
proxy-cache-server serve <target-url> [options]
```

#### Required Parameters
- `target-url`: Target URL to proxy

#### Options
- `--port <number>`: Port number to listen on (default: 3000)
- `--cache <path>`: Cache directory path (default: .proxy-cache, defined in DEFAULT_CACHE_DIRECTORY_NAME constant)

#### Example Usage
```bash
# Basic usage
proxy-cache-server serve https://api.example.com

# With custom port and cache directory
proxy-cache-server serve https://api.example.com --port 8080 --cache ./my-cache
```

### Cache Management

#### Listing Cached Items
```bash
proxy-cache-server cache list
```

This command displays the following information:
- HTTP method
- Full URL
- Status code
- Cache timestamp

## Error Handling and Troubleshooting

### Common Errors

1. **Server Start Failure**
   ```
   Error: Failed to start server
   ```
   - Check if the port is already in use
   - Verify if the specified port number is valid

2. **Missing Target URL**
   ```
   Error: Target URL is required
   ```
   - Ensure target URL is provided when using the `serve` command

3. **Proxy Request Failure**
   ```
   Error: Proxy request failed
   ```
   - Verify the target URL is correct
   - Check if the target server is accessible
   - Verify network connectivity

4. **Cache Directory Access Failure**
   ```
   Error: Failed to list cache entries
   ```
   - Check cache directory path and permissions
   - Verify sufficient disk space

### Troubleshooting Tips

1. Check Server Logs
   - Review startup logs for port and target URL
   - Examine error messages for issue identification

2. Verify Cache Status
   - Use `cache list` command to inspect cache contents
   - Check cache directory permissions and capacity

3. Network Connectivity
   - Test connection to target server
   - Check firewall settings

## Configuration Examples

### Development Environment

```bash
# Proxy to development server
proxy-cache-server serve http://localhost:8000 --port 3000

# With development cache directory
proxy-cache-server serve http://localhost:8000 --cache ./dev-cache
```

### Production Environment

```bash
# Proxy to API server
proxy-cache-server serve https://api.production.com --port 80 --cache /var/cache/proxy

# Check cache status
proxy-cache-server cache list
```

## Environment Setup

Ensure you have the correct version of Node.js installed:

```bash
# Check Node.js version
node --version  # Should be >=20.0.0

# Update Node.js if needed (using nvm)
nvm install 20
nvm use 20
```

For development work, it's recommended to use Node.js 20+ to ensure compatibility with all features.