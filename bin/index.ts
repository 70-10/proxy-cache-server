#!/usr/bin/env node
import { defineCommand, runMain } from "citty";
import { cacheCommand } from "src/cli/commands/cache/command";
import { serveCommand } from "src/cli/commands/serve/command";
import packageJson from "../package.json";

// Define the main command
const main = defineCommand({
  meta: {
    name: "proxy-cache-server",
    version: packageJson.version,
    description: "A caching proxy server",
  },
  subCommands: {
    serve: serveCommand,
    cache: cacheCommand,
  },
});

runMain(main);
