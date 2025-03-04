import { defineCommand } from "citty";
import { listCommand } from "./list/command";

export const cashCommand = defineCommand({
  meta: {
    name: "cash",
    description: "Cache management commands",
  },
  subCommands: {
    list: listCommand,
  },
});
