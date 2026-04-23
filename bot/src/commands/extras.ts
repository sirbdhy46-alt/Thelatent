import {
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type TextChannel,
} from "discord.js";
import type { SlashCommand } from "../lib/command.js";
import { aestheticEmbed, errorEmbed, successEmbed } from "../lib/embed.js";
import { getGuild, updateGuild } from "../lib/storage.js";

export const reactionRoleCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("reactionrole")
    .setDescription("manage reaction roles ✿")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand((s) =>
      s
        .setName("add")
        .setDescription("add a reaction role to an existing message")
        .addStringOption((o) =>
          o
            .setName("message_id")
            .setDescription("message id (right-click → copy id)")
            .setRequired(true),
        )
        .addStringOption((o) =>
          o.setName("emoji").setDescription("emoji").setRequired(true),
        )
        .addRoleOption((o) =>
          o.setName("role").setDescription("role to assign").setRequired(true),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName("remove")
        .setDescription("remove a reaction role from a message")
        .addStringOption((o) =>
          o.setName("message_id").setDescription("message id").setRequired(true),
        )
        .addStringOption((o) =>
          o.setName("emoji").setDescription("emoji").setRequired(true),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName("create")
        .setDescription("create a new reaction-role embed message")
        .addStringOption((o) =>
          o.setName("title").setDescription("embed title").setRequired(true),
        )
        .addStringOption((o) =>
          o.setName("description").setDescription("text").setRequired(true),
        ),
    ),
  async execute(interaction) {
    if (!interaction.guild || !interaction.channel) return;
    const sub = interaction.options.getSubcommand();
    const gid = interaction.guild.id;

    if (sub === "create") {
      const title = interaction.options.getString("title", true);
      const description = interaction.options
        .getString("description", true)
        .replace(/\\n/g, "\n");
      const ch = interaction.channel as TextChannel;
      const msg = await ch.send({
        embeds: [aestheticEmbed({ title, description })],
      });
      await interaction.reply({
        embeds: [
          successEmbed(
            `embed created. id: \`${msg.id}\`\nuse \`/reactionrole add\` with this id`,
          ),
        ],
        ephemeral: true,
      });
      return;
    }

    const messageId = interaction.options.getString("message_id", true);
    const emoji = interaction.options.getString("emoji", true);
    const ch = interaction.channel as TextChannel;
    const msg = await ch.messages.fetch(messageId).catch(() => null);
    if (!msg) {
      await interaction.reply({
        embeds: [errorEmbed("message not found in this channel")],
        ephemeral: true,
      });
      return;
    }

    if (sub === "add") {
      const role = interaction.options.getRole("role", true);
      try {
        await msg.react(emoji);
      } catch {
        await interaction.reply({
          embeds: [errorEmbed("invalid emoji")],
          ephemeral: true,
        });
        return;
      }
      updateGuild(gid, (g) => {
        if (!g.reactionRoles[messageId]) g.reactionRoles[messageId] = {};
        g.reactionRoles[messageId]![emoji] = role.id;
      });
      await interaction.reply({
        embeds: [successEmbed(`reaction role added: ${emoji} → <@&${role.id}>`)],
        ephemeral: true,
      });
    } else if (sub === "remove") {
      updateGuild(gid, (g) => {
        if (g.reactionRoles[messageId]) delete g.reactionRoles[messageId]![emoji];
      });
      await interaction.reply({
        embeds: [successEmbed(`reaction role removed for ${emoji}`)],
        ephemeral: true,
      });
    }
  },
};

export const stickyCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("sticky")
    .setDescription("sticky messages that re-post when chat moves ✿")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand((s) =>
      s
        .setName("set")
        .setDescription("set a sticky message in this channel")
        .addStringOption((o) =>
          o.setName("text").setDescription("message").setRequired(true),
        ),
    )
    .addSubcommand((s) =>
      s.setName("remove").setDescription("remove sticky from this channel"),
    ),
  async execute(interaction) {
    if (!interaction.guild || !interaction.channel) return;
    if (interaction.channel.type !== ChannelType.GuildText) {
      await interaction.reply({
        embeds: [errorEmbed("must be a text channel")],
        ephemeral: true,
      });
      return;
    }
    const sub = interaction.options.getSubcommand();
    const chId = interaction.channel.id;

    if (sub === "set") {
      const text = interaction.options
        .getString("text", true)
        .replace(/\\n/g, "\n");
      updateGuild(interaction.guild.id, (g) => {
        g.stickyMessages[chId] = { content: text };
      });
      await interaction.reply({
        embeds: [successEmbed("sticky message set ✿")],
        ephemeral: true,
      });
    } else if (sub === "remove") {
      updateGuild(interaction.guild.id, (g) => {
        delete g.stickyMessages[chId];
      });
      await interaction.reply({
        embeds: [successEmbed("sticky removed")],
        ephemeral: true,
      });
    }
  },
};

export const commands = [reactionRoleCmd, stickyCmd];
