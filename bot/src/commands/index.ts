import setupCmd from "./setup.js";
import configCmd from "./config.js";
import { commands as modCommands } from "./moderation.js";
import { commands as utilCommands } from "./utility.js";
import { commands as extraCommands } from "./extras.js";
import type { SlashCommand } from "../lib/command.js";

export const allCommands: SlashCommand[] = [
  setupCmd,
  configCmd,
  ...modCommands,
  ...utilCommands,
  ...extraCommands,
];
