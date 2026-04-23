import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../lib/command.js";
import { aestheticEmbed, successEmbed } from "../lib/embed.js";
import { getGuild, updateGuild } from "../lib/storage.js";

export const automodCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("automod")
    .setDescription("Configure automod ✿")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) =>
      s.setName("links").setDescription("Toggle link blocking")
        .addBooleanOption((o) => o.setName("enabled").setDescription("On/off").setRequired(true)),
    )
    .addSubcommand((s) =>
      s.setName("invites").setDescription("Toggle invite blocking")
        .addBooleanOption((o) => o.setName("enabled").setDescription("On/off").setRequired(true)),
    )
    .addSubcommand((s) =>
      s.setName("caps").setDescription("Toggle caps filter")
        .addBooleanOption((o) => o.setName("enabled").setDescription("On/off").setRequired(true))
        .addIntegerOption((o) => o.setName("threshold").setDescription("% caps (1-100)").setMinValue(1).setMaxValue(100)),
    )
    .addSubcommand((s) =>
      s.setName("mentions").setDescription("Block mass mentions")
        .addBooleanOption((o) => o.setName("enabled").setDescription("On/off").setRequired(true))
        .addIntegerOption((o) => o.setName("threshold").setDescription("Max mentions").setMinValue(2)),
    )
    .addSubcommand((s) =>
      s.setName("spam").setDescription("Block message spam")
        .addBooleanOption((o) => o.setName("enabled").setDescription("On/off").setRequired(true))
        .addIntegerOption((o) => o.setName("threshold").setDescription("Msgs / 5s").setMinValue(2)),
    )
    .addSubcommand((s) => s.setName("status").setDescription("View automod status")),
  async execute(i) {
    if (!i.guild) return;
    const sub = i.options.getSubcommand();
    if (sub === "status") {
      const a = getGuild(i.guild.id).automod;
      return i.reply({
        embeds: [
          aestheticEmbed({
            title: "🛡 automod status",
            description: [
              `links: **${a.blockLinks ? "on" : "off"}**`,
              `invites: **${a.blockInvites ? "on" : "off"}**`,
              `caps: **${a.blockCaps ? "on" : "off"}** (${a.capsThreshold}%)`,
              `mentions: **${a.blockMentions ? "on" : "off"}** (max ${a.mentionThreshold})`,
              `spam: **${a.blockSpam ? "on" : "off"}** (${a.spamThreshold}/5s)`,
              `badwords: **${a.badwords.length}** configured`,
            ].join("\n"),
          }),
        ],
        ephemeral: true,
      });
    }
    const enabled = i.options.getBoolean("enabled", true);
    const threshold = i.options.getInteger("threshold");
    updateGuild(i.guild.id, (g) => {
      if (sub === "links") g.automod.blockLinks = enabled;
      if (sub === "invites") g.automod.blockInvites = enabled;
      if (sub === "caps") {
        g.automod.blockCaps = enabled;
        if (threshold) g.automod.capsThreshold = threshold;
      }
      if (sub === "mentions") {
        g.automod.blockMentions = enabled;
        if (threshold) g.automod.mentionThreshold = threshold;
      }
      if (sub === "spam") {
        g.automod.blockSpam = enabled;
        if (threshold) g.automod.spamThreshold = threshold;
      }
    });
    await i.reply({ embeds: [successEmbed(`automod \`${sub}\` ${enabled ? "enabled" : "disabled"}`)], ephemeral: true });
  },
};

export const badwordsCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("badwords")
    .setDescription("Manage filtered words")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) =>
      s.setName("add").setDescription("Add a bad word")
        .addStringOption((o) => o.setName("word").setDescription("Word").setRequired(true)),
    )
    .addSubcommand((s) =>
      s.setName("remove").setDescription("Remove a bad word")
        .addStringOption((o) => o.setName("word").setDescription("Word").setRequired(true)),
    )
    .addSubcommand((s) => s.setName("list").setDescription("List bad words"))
    .addSubcommand((s) => s.setName("clear").setDescription("Clear all bad words")),
  async execute(i) {
    if (!i.guild) return;
    const sub = i.options.getSubcommand();
    if (sub === "list") {
      const w = getGuild(i.guild.id).automod.badwords;
      return i.reply({
        embeds: [aestheticEmbed({ title: "filtered words", description: w.length ? w.map((x) => `\`${x}\``).join(" ") : "none" })],
        ephemeral: true,
      });
    }
    if (sub === "clear") {
      updateGuild(i.guild.id, (g) => (g.automod.badwords = []));
      return i.reply({ embeds: [successEmbed("cleared")], ephemeral: true });
    }
    const word = i.options.getString("word", true).toLowerCase();
    updateGuild(i.guild.id, (g) => {
      if (sub === "add" && !g.automod.badwords.includes(word)) g.automod.badwords.push(word);
      if (sub === "remove") g.automod.badwords = g.automod.badwords.filter((w) => w !== word);
    });
    await i.reply({ embeds: [successEmbed(`${sub === "add" ? "added" : "removed"} \`${word}\``)], ephemeral: true });
  },
};

export const antiraidCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("antiraid")
    .setDescription("Anti-raid settings")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((s) =>
      s.setName("on").setDescription("Enable anti-raid")
        .addIntegerOption((o) => o.setName("joins").setDescription("Joins per window").setMinValue(2))
        .addIntegerOption((o) => o.setName("seconds").setDescription("Window in seconds").setMinValue(5)),
    )
    .addSubcommand((s) => s.setName("off").setDescription("Disable anti-raid"))
    .addSubcommand((s) => s.setName("status").setDescription("View anti-raid status")),
  async execute(i) {
    if (!i.guild) return;
    const sub = i.options.getSubcommand();
    const g = getGuild(i.guild.id);
    if (sub === "status") {
      return i.reply({
        embeds: [aestheticEmbed({ description: `anti-raid: **${g.antiraid.enabled ? "on" : "off"}**\nthreshold: **${g.antiraid.joinThreshold}** joins / **${g.antiraid.window}s**` })],
        ephemeral: true,
      });
    }
    updateGuild(i.guild.id, (gg) => {
      gg.antiraid.enabled = sub === "on";
      const j = i.options.getInteger("joins"); if (j) gg.antiraid.joinThreshold = j;
      const w = i.options.getInteger("seconds"); if (w) gg.antiraid.window = w;
    });
    await i.reply({ embeds: [successEmbed(`anti-raid ${sub}`)], ephemeral: true });
  },
};

export const lockdownCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("lockdown")
    .setDescription("Lockdown the entire server")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((s) => s.setName("on").setDescription("Lock all channels"))
    .addSubcommand((s) => s.setName("off").setDescription("Unlock all channels")),
  async execute(i) {
    if (!i.guild) return;
    const sub = i.options.getSubcommand();
    await i.deferReply({ ephemeral: true });
    let n = 0;
    for (const ch of i.guild.channels.cache.values()) {
      if (ch.type !== 0) continue;
      try {
        await ch.permissionOverwrites.edit(i.guild.roles.everyone, { SendMessages: sub === "on" ? false : null });
        n++;
      } catch {}
    }
    updateGuild(i.guild.id, (g) => (g.lockdown = sub === "on"));
    await i.editReply({ embeds: [successEmbed(`lockdown ${sub} on ${n} channels`)] });
  },
};

export const commands = [automodCmd, badwordsCmd, antiraidCmd, lockdownCmd];
