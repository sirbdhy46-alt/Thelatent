import setupCmd from "./setup.js";
import configCmd from "./config.js";
import { commands as modCommands } from "./moderation.js";
import { commands as utilCommands } from "./utility.js";
import { commands as extraCommands } from "./extras.js";
import { commands as modExtraCommands } from "./mod-extra.js";
import { commands as voiceCommands } from "./voice.js";
import { commands as serverMgmtCommands } from "./server-mgmt.js";
import { commands as infoCommands } from "./info.js";
import { commands as automodCommands } from "./automod.js";
import { commands as communityCommands } from "./community.js";
import { commands as funCommands } from "./fun.js";
import { commands as textCommands } from "./text.js";
import { commands as adminExtraCommands } from "./admin-extra.js";
import type { SlashCommand } from "../lib/command.js";

export const allCommands: SlashCommand[] = [
  setupCmd,
  configCmd,
  ...modCommands,
  ...utilCommands,
  ...extraCommands,
  ...modExtraCommands,
  ...voiceCommands,
  ...serverMgmtCommands,
  ...infoCommands,
  ...automodCommands,
  ...communityCommands,
  ...funCommands,
  ...textCommands,
  ...adminExtraCommands,
];
