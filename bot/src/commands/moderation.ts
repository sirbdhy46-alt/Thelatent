import {
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type GuildMember,
  type TextChannel,
} from "discord.js";
import type { SlashCommand } from "../lib/command.js";
import { aestheticEmbed, errorEmbed, successEmbed } from "../lib/embed.js";
import { getGuild, updateGuild } from "../lib/storage.js";

function parseDuration(input: string): number | null {
  const m = input.match(/^(\d+)\s*(s|m|h|d|w)$/i);
  if (!m) return null;
  const n = parseInt(m[1]!, 10);
  const u = m[2]!.toLowerCase();
  const mult = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000, w: 604_800_000 }[u]!;
  return n * mult;
}

export const banCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a member")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((o) =>
      o.setName("user").setDescription("User to ban").setRequired(true),
    )
    .addStringOption((o) =>
      o.setName("reason").setDescription("Reason").setRequired(false),
    )
    .addIntegerOption((o) =>
      o
        .setName("delete_days")
        .setDescription("Delete messages from past N days (0-7)")
        .setMinValue(0)
        .setMaxValue(7),
    ) as SlashCommandBuilder,
  async execute(interaction) {
    if (!interaction.guild) return;
    const user = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason") ?? "No reason";
    const days = interaction.options.getInteger("delete_days") ?? 0;
    try {
      await interaction.guild.members.ban(user.id, {
        reason: `${reason} | by ${interaction.user.tag}`,
        deleteMessageSeconds: days * 86400,
      });
      await interaction.reply({
        embeds: [successEmbed(`banned **${user.tag}** — ${reason}`)],
      });
    } catch (e) {
      await interaction.reply({
        embeds: [errorEmbed(`failed to ban: ${(e as Error).message}`)],
        ephemeral: true,
      });
    }
  },
};

export const unbanCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Unban a user by ID")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption((o) =>
      o.setName("user_id").setDescription("User ID").setRequired(true),
    ) as SlashCommandBuilder,
  async execute(interaction) {
    if (!interaction.guild) return;
    const id = interaction.options.getString("user_id", true);
    try {
      await interaction.guild.members.unban(id);
      await interaction.reply({ embeds: [successEmbed(`unbanned <@${id}>`)] });
    } catch (e) {
      await interaction.reply({
        embeds: [errorEmbed(`failed: ${(e as Error).message}`)],
        ephemeral: true,
      });
    }
  },
};

export const kickCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a member")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption((o) =>
      o.setName("user").setDescription("User to kick").setRequired(true),
    )
    .addStringOption((o) => o.setName("reason").setDescription("Reason")) as SlashCommandBuilder,
  async execute(interaction) {
    if (!interaction.guild) return;
    const user = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason") ?? "No reason";
    try {
      const member = await interaction.guild.members.fetch(user.id);
      await member.kick(`${reason} | by ${interaction.user.tag}`);
      await interaction.reply({
        embeds: [successEmbed(`kicked **${user.tag}** — ${reason}`)],
      });
    } catch (e) {
      await interaction.reply({
        embeds: [errorEmbed(`failed: ${(e as Error).message}`)],
        ephemeral: true,
      });
    }
  },
};

export const muteCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Timeout a member (e.g. 10m, 2h, 1d)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((o) =>
      o.setName("user").setDescription("User to mute").setRequired(true),
    )
    .addStringOption((o) =>
      o.setName("duration").setDescription("e.g. 10m, 1h, 1d").setRequired(true),
    )
    .addStringOption((o) => o.setName("reason").setDescription("Reason")) as SlashCommandBuilder,
  async execute(interaction) {
    if (!interaction.guild) return;
    const user = interaction.options.getUser("user", true);
    const dur = interaction.options.getString("duration", true);
    const reason = interaction.options.getString("reason") ?? "No reason";
    const ms = parseDuration(dur);
    if (!ms || ms > 28 * 86_400_000) {
      await interaction.reply({
        embeds: [errorEmbed("invalid duration. use s/m/h/d/w, max 28d")],
        ephemeral: true,
      });
      return;
    }
    try {
      const member = await interaction.guild.members.fetch(user.id);
      await member.timeout(ms, `${reason} | by ${interaction.user.tag}`);
      await interaction.reply({
        embeds: [successEmbed(`muted **${user.tag}** for ${dur} — ${reason}`)],
      });
    } catch (e) {
      await interaction.reply({
        embeds: [errorEmbed(`failed: ${(e as Error).message}`)],
        ephemeral: true,
      });
    }
  },
};

export const unmuteCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("unmute")
    .setDescription("Remove timeout from member")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((o) =>
      o.setName("user").setDescription("User to unmute").setRequired(true),
    ) as SlashCommandBuilder,
  async execute(interaction) {
    if (!interaction.guild) return;
    const user = interaction.options.getUser("user", true);
    try {
      const member = await interaction.guild.members.fetch(user.id);
      await member.timeout(null);
      await interaction.reply({ embeds: [successEmbed(`unmuted **${user.tag}**`)] });
    } catch (e) {
      await interaction.reply({
        embeds: [errorEmbed(`failed: ${(e as Error).message}`)],
        ephemeral: true,
      });
    }
  },
};

export const purgeCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("purge")
    .setDescription("Bulk delete messages (1-100)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption((o) =>
      o
        .setName("amount")
        .setDescription("How many")
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true),
    )
    .addUserOption((o) =>
      o.setName("user").setDescription("Only from this user"),
    ) as SlashCommandBuilder,
  async execute(interaction) {
    if (!interaction.channel || interaction.channel.type !== ChannelType.GuildText) {
      await interaction.reply({
        embeds: [errorEmbed("must be used in a text channel")],
        ephemeral: true,
      });
      return;
    }
    const amount = interaction.options.getInteger("amount", true);
    const user = interaction.options.getUser("user");
    const ch = interaction.channel as TextChannel;
    await interaction.deferReply({ ephemeral: true });
    const messages = await ch.messages.fetch({ limit: 100 });
    let toDelete = [...messages.values()];
    if (user) toDelete = toDelete.filter((m) => m.author.id === user.id);
    toDelete = toDelete.slice(0, amount);
    const deleted = await ch.bulkDelete(toDelete, true);
    await interaction.editReply({
      embeds: [successEmbed(`deleted **${deleted.size}** messages`)],
    });
  },
};

export const lockCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("lock")
    .setDescription("Lock the current channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels) as SlashCommandBuilder,
  async execute(interaction) {
    if (!interaction.guild || !interaction.channel) return;
    const ch = interaction.channel as TextChannel;
    await ch.permissionOverwrites.edit(interaction.guild.roles.everyone, {
      SendMessages: false,
    });
    await interaction.reply({ embeds: [successEmbed("channel locked 🔒")] });
  },
};

export const unlockCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("unlock")
    .setDescription("Unlock the current channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels) as SlashCommandBuilder,
  async execute(interaction) {
    if (!interaction.guild || !interaction.channel) return;
    const ch = interaction.channel as TextChannel;
    await ch.permissionOverwrites.edit(interaction.guild.roles.everyone, {
      SendMessages: null,
    });
    await interaction.reply({ embeds: [successEmbed("channel unlocked 🔓")] });
  },
};

export const slowmodeCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("slowmode")
    .setDescription("Set channel slowmode in seconds (0-21600)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addIntegerOption((o) =>
      o
        .setName("seconds")
        .setDescription("0 to disable")
        .setMinValue(0)
        .setMaxValue(21600)
        .setRequired(true),
    ) as SlashCommandBuilder,
  async execute(interaction) {
    if (!interaction.channel || interaction.channel.type !== ChannelType.GuildText) return;
    const seconds = interaction.options.getInteger("seconds", true);
    await (interaction.channel as TextChannel).setRateLimitPerUser(seconds);
    await interaction.reply({
      embeds: [successEmbed(`slowmode set to ${seconds}s`)],
    });
  },
};

export const warnCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Warn a member")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((o) =>
      o.setName("user").setDescription("User").setRequired(true),
    )
    .addStringOption((o) =>
      o.setName("reason").setDescription("Reason").setRequired(true),
    ) as SlashCommandBuilder,
  async execute(interaction) {
    if (!interaction.guild) return;
    const user = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason", true);
    updateGuild(interaction.guild.id, (g) => {
      if (!g.warns[user.id]) g.warns[user.id] = [];
      g.warns[user.id]!.push({ reason, mod: interaction.user.id, at: Date.now() });
    });
    const count = getGuild(interaction.guild.id).warns[user.id]?.length ?? 0;
    await interaction.reply({
      embeds: [
        successEmbed(`warned **${user.tag}** — ${reason}\ntotal warns: **${count}**`),
      ],
    });
    try {
      await user.send({
        embeds: [
          aestheticEmbed({
            title: `you were warned in ${interaction.guild.name}`,
            description: `reason: ${reason}\ntotal warns: ${count}`,
          }),
        ],
      });
    } catch {}
  },
};

export const warnsCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("warns")
    .setDescription("View warns for a user")
    .addUserOption((o) =>
      o.setName("user").setDescription("User").setRequired(true),
    ) as SlashCommandBuilder,
  async execute(interaction) {
    if (!interaction.guild) return;
    const user = interaction.options.getUser("user", true);
    const warns = getGuild(interaction.guild.id).warns[user.id] ?? [];
    if (warns.length === 0) {
      await interaction.reply({
        embeds: [successEmbed(`**${user.tag}** has no warns ✿`)],
      });
      return;
    }
    await interaction.reply({
      embeds: [
        aestheticEmbed({
          title: `warns for ${user.tag}`,
          description: warns
            .map(
              (w, i) =>
                `**${i + 1}.** ${w.reason} — by <@${w.mod}> — <t:${Math.floor(w.at / 1000)}:R>`,
            )
            .join("\n"),
        }),
      ],
    });
  },
};

export const clearwarnsCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("clearwarns")
    .setDescription("Clear all warns for a user")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((o) =>
      o.setName("user").setDescription("User").setRequired(true),
    ) as SlashCommandBuilder,
  async execute(interaction) {
    if (!interaction.guild) return;
    const user = interaction.options.getUser("user", true);
    updateGuild(interaction.guild.id, (g) => {
      delete g.warns[user.id];
    });
    await interaction.reply({
      embeds: [successEmbed(`cleared warns for **${user.tag}**`)],
    });
  },
};

export const nickCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("nick")
    .setDescription("Change a member's nickname")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames)
    .addUserOption((o) =>
      o.setName("user").setDescription("User").setRequired(true),
    )
    .addStringOption((o) =>
      o.setName("nickname").setDescription("New nick (empty to reset)"),
    ) as SlashCommandBuilder,
  async execute(interaction) {
    if (!interaction.guild) return;
    const user = interaction.options.getUser("user", true);
    const nick = interaction.options.getString("nickname");
    try {
      const m = (await interaction.guild.members.fetch(user.id)) as GuildMember;
      await m.setNickname(nick);
      await interaction.reply({
        embeds: [successEmbed(`nickname updated for **${user.tag}**`)],
      });
    } catch (e) {
      await interaction.reply({
        embeds: [errorEmbed((e as Error).message)],
        ephemeral: true,
      });
    }
  },
};

export const commands = [
  banCmd,
  unbanCmd,
  kickCmd,
  muteCmd,
  unmuteCmd,
  purgeCmd,
  lockCmd,
  unlockCmd,
  slowmodeCmd,
  warnCmd,
  warnsCmd,
  clearwarnsCmd,
  nickCmd,
];
