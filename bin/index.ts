#!/usr/bin/env node
import { defineCommand, runMain } from "citty";
import { cacheCommand } from "src/cli/commands/cache/command";
import { serveCommand } from "src/cli/commands/serve/command";

// Define the main command
const main = defineCommand({
  meta: {
    name: "proxy-cache-server",
    version: "0.1.0",
    description: "A caching proxy server",
  },
  subCommands: {
    serve: serveCommand,
    cache: cacheCommand,
  },
});

runMain(main);
