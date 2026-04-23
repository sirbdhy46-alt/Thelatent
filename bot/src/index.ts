import {
  Client,
  Events,
  GatewayIntentBits,
  Partials,
  ActivityType,
} from "discord.js";
import { config } from "./lib/config.js";
import { allCommands } from "./commands/index.js";
import { registerEvents } from "./events/handlers.js";
import { errorEmbed } from "./lib/embed.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.GuildMember],
});

const commandMap = new Map(allCommands.map((c) => [c.data.name, c]));

client.once(Events.ClientReady, async (c) => {
  console.log(`✿ logged in as ${c.user.tag}`);
  c.user.setPresence({
    activities: [{ name: "✿ /help · latentshows", type: ActivityType.Watching }],
    status: "online",
  });

  // Auto-deploy commands on startup so the user doesn't need a separate step
  try {
    const { REST, Routes } = await import("discord.js");
    const rest = new REST({ version: "10" }).setToken(config.token);
    const body = allCommands.map((cmd) => cmd.data.toJSON());
    await rest.put(Routes.applicationCommands(config.clientId), { body });
    console.log(`✓ deployed ${body.length} commands globally`);
  } catch (e) {
    console.error("command deploy err", e);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const cmd = commandMap.get(interaction.commandName);
  if (!cmd) return;
  try {
    await cmd.execute(interaction);
  } catch (e) {
    console.error(`error in /${interaction.commandName}`, e);
    const payload = {
      embeds: [errorEmbed(`something went wrong: ${(e as Error).message}`)],
      ephemeral: true as const,
    };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(payload).catch(() => {});
    } else {
      await interaction.reply(payload).catch(() => {});
    }
  }
});

registerEvents(client);

client.on(Events.Error, (e) => console.error("client err", e));
process.on("unhandledRejection", (e) => console.error("unhandled", e));

await client.login(config.token);
