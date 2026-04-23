import { REST, Routes } from "discord.js";
import { config } from "./lib/config.js";
import { allCommands } from "./commands/index.js";

const body = allCommands.map((c) => c.data.toJSON());
const rest = new REST({ version: "10" }).setToken(config.token);

console.log(`Deploying ${body.length} global commands...`);
const data = (await rest.put(Routes.applicationCommands(config.clientId), {
  body,
})) as unknown[];
console.log(`✓ Deployed ${data.length} commands globally.`);
