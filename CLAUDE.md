# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build and Development
- `bun run dev` - Run the CLI in development mode (for local development)
- `bun run fix` - Run Biome linting and formatting with automatic fixes
- `bun run build` - Build the project for production (targets Node.js runtime)
- `bun run compile` - Build for Bun runtime (development)
- `bun run compile:node` - Build for Node.js runtime (production)

### Testing
- `bun test` - Run all tests using Bun's built-in test runner
- Tests are located in `src/**/*.test.ts` files
- Test utilities are in `tests/helper/test-utils.ts`

### Linting and Formatting
- `biome check --write ./src` - Check and fix code formatting/linting
- Configuration is in `biome.json` with recommended rules enabled

## CLI Usage

The project builds a CLI tool that can be used via npx:
- `npx -y 70-10/proxy-cache-server serve https://api.example.com --port 3000` - Start proxy server
- `npx -y 70-10/proxy-cache-server cache list` - List cached entries

## Architecture

### Core Components

**CLI Framework**: Uses `citty` for command-line interface with subcommands
- Main entry point: `bin/index.ts`
- Commands organized in `src/cli/commands/`
- Two main commands: `serve` and `cache`

**Proxy Server**: Built with Hono web framework
- Handles all HTTP methods (GET, POST, PUT, DELETE, etc.)
- Caches responses based on URL, method, and query parameters
- Removes proxy-specific headers for clean responses

**Caching System**: File-based caching with hierarchical directory structure
- Cache path: `[cache-dir]/[encoded-base-url]/[method]/[path]/[encoded-query]/response.json`
- Query parameters are sorted for consistent caching
- Cache entries store body, status code, and headers

### Key Files

- `src/cache.ts` - Core caching logic (getCache, cacheResponse, createCacheFilePath)
- `src/list-cache.ts` - Cache listing and parsing functionality
- `src/cli/commands/serve/command.ts` - Proxy server implementation
- `src/models/` - Type definitions and constants
- `bin/index.ts` - CLI entry point

### Environment Variables

- `PROXY_CACHE_SERVER_CACHE_DIR` - Custom cache directory (optional, defaults to `.proxy-cache`)

### Development Setup

The project uses Bun for development but targets Node.js 20+ for production. The build process compiles TypeScript to JavaScript and creates an executable CLI tool distributed via npm/GitHub.

Cache files are JSON objects containing:
- `body`: Response body as string
- `status`: HTTP status code
- `headers`: Response headers as key-value pairs

The proxy server automatically handles header cleaning (removes proxy-specific headers) and preserves the original API response structure for transparent caching.