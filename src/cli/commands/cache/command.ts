import { defineCommand } from "citty";
import { listCommand } from "./list/command";

export const cacheCommand = defineCommand({
  meta: {
    name: "cache",
    description: "Cache management commands",
  },
  subCommands: {
    list: listCommand,
  },
});
