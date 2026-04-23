import {
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import type { SlashCommand } from "../lib/command.js";
import { successEmbed } from "../lib/embed.js";
import { updateGuild, getGuild } from "../lib/storage.js";

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("config")
    .setDescription("Configure bot settings ✿")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) =>
      s
        .setName("autorole")
        .setDescription("Set the role new members get automatically")
        .addRoleOption((o) =>
          o.setName("role").setDescription("Role to assign").setRequired(true),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName("welcome")
        .setDescription("Set the welcome channel")
        .addChannelOption((o) =>
          o
            .setName("channel")
            .setDescription("Channel for welcomes")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName("goodbye")
        .setDescription("Set the goodbye channel")
        .addChannelOption((o) =>
          o
            .setName("channel")
            .setDescription("Channel for goodbyes")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName("modlog")
        .setDescription("Set the moderation log channel")
        .addChannelOption((o) =>
          o
            .setName("channel")
            .setDescription("Channel for mod logs")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true),
        ),
    )
    .addSubcommand((s) => s.setName("view").setDescription("View current config")),

  async execute(interaction) {
    if (!interaction.guild) return;
    const sub = interaction.options.getSubcommand();
    const gid = interaction.guild.id;

    if (sub === "view") {
      const g = getGuild(gid);
      await interaction.reply({
        embeds: [
          successEmbed(
            [
              `auto-role: ${g.autoRoleId ? `<@&${g.autoRoleId}>` : "not set"}`,
              `welcome: ${g.welcomeChannelId ? `<#${g.welcomeChannelId}>` : "not set"}`,
              `goodbye: ${g.goodbyeChannelId ? `<#${g.goodbyeChannelId}>` : "not set"}`,
              `mod-log: ${g.modLogChannelId ? `<#${g.modLogChannelId}>` : "not set"}`,
            ].join("\n"),
          ),
        ],
        ephemeral: true,
      });
      return;
    }

    if (sub === "autorole") {
      const role = interaction.options.getRole("role", true);
      updateGuild(gid, (g) => (g.autoRoleId = role.id));
      await interaction.reply({
        embeds: [successEmbed(`auto-role set to <@&${role.id}>`)],
        ephemeral: true,
      });
    } else if (sub === "welcome") {
      const ch = interaction.options.getChannel("channel", true);
      updateGuild(gid, (g) => (g.welcomeChannelId = ch.id));
      await interaction.reply({
        embeds: [successEmbed(`welcome channel set to <#${ch.id}>`)],
        ephemeral: true,
      });
    } else if (sub === "goodbye") {
      const ch = interaction.options.getChannel("channel", true);
      updateGuild(gid, (g) => (g.goodbyeChannelId = ch.id));
      await interaction.reply({
        embeds: [successEmbed(`goodbye channel set to <#${ch.id}>`)],
        ephemeral: true,
      });
    } else if (sub === "modlog") {
      const ch = interaction.options.getChannel("channel", true);
      updateGuild(gid, (g) => (g.modLogChannelId = ch.id));
      await interaction.reply({
        embeds: [successEmbed(`mod-log channel set to <#${ch.id}>`)],
        ephemeral: true,
      });
    }
  },
};

export default command;
