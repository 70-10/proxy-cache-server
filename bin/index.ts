#!/usr/bin/env bun
import { defineCommand, runMain } from "citty";
import { serveCommand } from "../src/cli/commands/serve-command";
import { cashCommand } from "../src/cli/commands/cash/command";

const main = defineCommand({
  meta: {
    name: "proxy-cache-server",
    version: "0.1.0",
    description: "A caching proxy server",
  },
  subCommands: {
    serve: serveCommand,
    cash: cashCommand,
  },
});

runMain(main);
