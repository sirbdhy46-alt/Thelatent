import {
  PermissionFlagsBits,
  SlashCommandBuilder,
  type TextChannel,
} from "discord.js";
import type { SlashCommand } from "../lib/command.js";
import { aestheticEmbed, errorEmbed, successEmbed } from "../lib/embed.js";
import { addCase, getGuild, updateGuild } from "../lib/storage.js";
import { parseDuration } from "../lib/parse.js";

export const softbanCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("softban")
    .setDescription("Ban then immediately unban (clears messages)")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((o) => o.setName("user").setDescription("User").setRequired(true))
    .addStringOption((o) => o.setName("reason").setDescription("Reason")) as SlashCommandBuilder,
  async execute(i) {
    if (!i.guild) return;
    const u = i.options.getUser("user", true);
    const reason = i.options.getString("reason") ?? "No reason";
    try {
      await i.guild.members.ban(u.id, { deleteMessageSeconds: 86400, reason });
      await i.guild.members.unban(u.id, "softban");
      addCase(i.guild.id, { type: "softban", user: u.id, mod: i.user.id, reason, at: Date.now() });
      await i.reply({ embeds: [successEmbed(`softbanned **${u.tag}** — ${reason}`)] });
    } catch (e) {
      await i.reply({ embeds: [errorEmbed((e as Error).message)], ephemeral: true });
    }
  },
};

export const tempbanCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("tempban")
    .setDescription("Temporarily ban a member")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((o) => o.setName("user").setDescription("User").setRequired(true))
    .addStringOption((o) => o.setName("duration").setDescription("e.g. 1d, 1w").setRequired(true))
    .addStringOption((o) => o.setName("reason").setDescription("Reason")) as SlashCommandBuilder,
  async execute(i) {
    if (!i.guild) return;
    const u = i.options.getUser("user", true);
    const ms = parseDuration(i.options.getString("duration", true));
    if (!ms) return i.reply({ embeds: [errorEmbed("invalid duration")], ephemeral: true });
    const reason = i.options.getString("reason") ?? "No reason";
    try {
      await i.guild.members.ban(u.id, { reason });
      updateGuild(i.guild.id, (g) => g.tempbans.push({ user: u.id, expires: Date.now() + ms }));
      addCase(i.guild.id, { type: "tempban", user: u.id, mod: i.user.id, reason, at: Date.now(), duration: ms });
      await i.reply({ embeds: [successEmbed(`tempbanned **${u.tag}** for ${i.options.getString("duration", true)}`)] });
    } catch (e) {
      await i.reply({ embeds: [errorEmbed((e as Error).message)], ephemeral: true });
    }
  },
};

export const hackbanCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("hackban")
    .setDescription("Ban a user by ID (user not in server)")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption((o) => o.setName("user_id").setDescription("User ID").setRequired(true))
    .addStringOption((o) => o.setName("reason").setDescription("Reason")) as SlashCommandBuilder,
  async execute(i) {
    if (!i.guild) return;
    const id = i.options.getString("user_id", true);
    const reason = i.options.getString("reason") ?? "Hackban";
    try {
      await i.guild.members.ban(id, { reason });
      addCase(i.guild.id, { type: "hackban", user: id, mod: i.user.id, reason, at: Date.now() });
      await i.reply({ embeds: [successEmbed(`hackbanned <@${id}>`)] });
    } catch (e) {
      await i.reply({ embeds: [errorEmbed((e as Error).message)], ephemeral: true });
    }
  },
};

export const unmuteallCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("unmuteall")
    .setDescription("Remove timeout from every muted member")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers) as SlashCommandBuilder,
  async execute(i) {
    if (!i.guild) return;
    await i.deferReply({ ephemeral: true });
    let count = 0;
    const members = await i.guild.members.fetch();
    for (const m of members.values()) {
      if (m.communicationDisabledUntilTimestamp && m.communicationDisabledUntilTimestamp > Date.now()) {
        try {
          await m.timeout(null);
          count++;
        } catch {}
      }
    }
    await i.editReply({ embeds: [successEmbed(`unmuted ${count} members`)] });
  },
};

export const banlistCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("banlist")
    .setDescription("List banned users")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers) as SlashCommandBuilder,
  async execute(i) {
    if (!i.guild) return;
    const bans = await i.guild.bans.fetch();
    if (bans.size === 0) return i.reply({ embeds: [aestheticEmbed({ description: "no bans ✿" })], ephemeral: true });
    const lines = bans
      .first(25)
      .map((b) => `**${b.user.tag}** — ${b.reason ?? "no reason"}`)
      .join("\n");
    await i.reply({
      embeds: [aestheticEmbed({ title: `🚫 bans (${bans.size})`, description: lines })],
      ephemeral: true,
    });
  },
};

export const modlogsCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("modlogs")
    .setDescription("View mod history for a user")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((o) => o.setName("user").setDescription("User").setRequired(true)) as SlashCommandBuilder,
  async execute(i) {
    if (!i.guild) return;
    const u = i.options.getUser("user", true);
    const cases = getGuild(i.guild.id).cases.filter((c) => c.user === u.id);
    if (cases.length === 0)
      return i.reply({ embeds: [aestheticEmbed({ description: `no cases for **${u.tag}** ✿` })] });
    await i.reply({
      embeds: [
        aestheticEmbed({
          title: `📋 cases for ${u.tag}`,
          description: cases
            .slice(-15)
            .map(
              (c) =>
                `**#${c.id}** \`${c.type}\` — ${c.reason} — by <@${c.mod}> — <t:${Math.floor(c.at / 1000)}:R>`,
            )
            .join("\n"),
        }),
      ],
    });
  },
};

export const caseCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("case")
    .setDescription("View or edit a mod case")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand((s) =>
      s.setName("view").setDescription("View a case")
        .addIntegerOption((o) => o.setName("id").setDescription("Case ID").setRequired(true)),
    )
    .addSubcommand((s) =>
      s.setName("reason").setDescription("Edit case reason")
        .addIntegerOption((o) => o.setName("id").setDescription("Case ID").setRequired(true))
        .addStringOption((o) => o.setName("reason").setDescription("New reason").setRequired(true)),
    ),
  async execute(i) {
    if (!i.guild) return;
    const sub = i.options.getSubcommand();
    const id = i.options.getInteger("id", true);
    const g = getGuild(i.guild.id);
    const c = g.cases.find((x) => x.id === id);
    if (!c) return i.reply({ embeds: [errorEmbed("case not found")], ephemeral: true });
    if (sub === "view") {
      await i.reply({
        embeds: [
          aestheticEmbed({
            title: `case #${c.id}`,
            description: [
              `type: \`${c.type}\``,
              `user: <@${c.user}>`,
              `mod: <@${c.mod}>`,
              `reason: ${c.reason}`,
              `when: <t:${Math.floor(c.at / 1000)}:R>`,
            ].join("\n"),
          }),
        ],
      });
    } else {
      const reason = i.options.getString("reason", true);
      updateGuild(i.guild.id, (gg) => {
        const cc = gg.cases.find((x) => x.id === id);
        if (cc) cc.reason = reason;
      });
      await i.reply({ embeds: [successEmbed(`case #${id} reason updated`)] });
    }
  },
};

export const announceCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("announce")
    .setDescription("Send an aesthetic announcement embed")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption((o) => o.setName("message").setDescription("Message").setRequired(true))
    .addChannelOption((o) => o.setName("channel").setDescription("Channel"))
    .addStringOption((o) => o.setName("title").setDescription("Title"))
    .addBooleanOption((o) => o.setName("ping_everyone").setDescription("@everyone")) as SlashCommandBuilder,
  async execute(i) {
    if (!i.guild) return;
    const text = i.options.getString("message", true).replace(/\\n/g, "\n");
    const title = i.options.getString("title") ?? "📢 announcement";
    const ping = i.options.getBoolean("ping_everyone") ?? false;
    const ch = (i.options.getChannel("channel") ?? i.channel) as TextChannel;
    if (!ch || !("send" in ch)) return i.reply({ embeds: [errorEmbed("bad channel")], ephemeral: true });
    await ch.send({
      content: ping ? "@everyone" : undefined,
      embeds: [aestheticEmbed({ title, description: text })],
      allowedMentions: ping ? { parse: ["everyone"] } : undefined,
    });
    await i.reply({ embeds: [successEmbed("announcement sent ✿")], ephemeral: true });
  },
};

export const dmCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("dm")
    .setDescription("DM a user as the bot")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addUserOption((o) => o.setName("user").setDescription("User").setRequired(true))
    .addStringOption((o) => o.setName("message").setDescription("Message").setRequired(true)) as SlashCommandBuilder,
  async execute(i) {
    const u = i.options.getUser("user", true);
    const text = i.options.getString("message", true).replace(/\\n/g, "\n");
    try {
      await u.send({ embeds: [aestheticEmbed({ title: `message from ${i.guild?.name ?? "staff"}`, description: text })] });
      await i.reply({ embeds: [successEmbed(`dm sent to **${u.tag}**`)], ephemeral: true });
    } catch (e) {
      await i.reply({ embeds: [errorEmbed("could not dm user")], ephemeral: true });
    }
  },
};

export const masskickCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("masskick")
    .setDescription("Kick all members with a specific role")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addRoleOption((o) => o.setName("role").setDescription("Role").setRequired(true))
    .addStringOption((o) => o.setName("reason").setDescription("Reason")) as SlashCommandBuilder,
  async execute(i) {
    if (!i.guild) return;
    const r = i.options.getRole("role", true);
    const reason = i.options.getString("reason") ?? "Mass kick";
    await i.deferReply({ ephemeral: true });
    let n = 0;
    const role = await i.guild.roles.fetch(r.id);
    if (!role) return i.editReply({ embeds: [errorEmbed("role not found")] });
    for (const m of role.members.values()) {
      try {
        await m.kick(reason);
        n++;
      } catch {}
    }
    await i.editReply({ embeds: [successEmbed(`kicked ${n} members`)] });
  },
};

export const massroleCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("massrole")
    .setDescription("Add or remove a role from all members")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand((s) =>
      s.setName("add").setDescription("Give role to all humans")
        .addRoleOption((o) => o.setName("role").setDescription("Role").setRequired(true)),
    )
    .addSubcommand((s) =>
      s.setName("remove").setDescription("Remove role from all members")
        .addRoleOption((o) => o.setName("role").setDescription("Role").setRequired(true)),
    )
    .addSubcommand((s) =>
      s.setName("bots").setDescription("Give role to all bots")
        .addRoleOption((o) => o.setName("role").setDescription("Role").setRequired(true)),
    ),
  async execute(i) {
    if (!i.guild) return;
    const sub = i.options.getSubcommand();
    const r = i.options.getRole("role", true);
    await i.deferReply({ ephemeral: true });
    const members = await i.guild.members.fetch();
    let n = 0;
    for (const m of members.values()) {
      try {
        if (sub === "add" && !m.user.bot && !m.roles.cache.has(r.id)) {
          await m.roles.add(r.id);
          n++;
        } else if (sub === "remove" && m.roles.cache.has(r.id)) {
          await m.roles.remove(r.id);
          n++;
        } else if (sub === "bots" && m.user.bot && !m.roles.cache.has(r.id)) {
          await m.roles.add(r.id);
          n++;
        }
      } catch {}
    }
    await i.editReply({ embeds: [successEmbed(`updated ${n} members`)] });
  },
};

export const commands = [
  softbanCmd,
  tempbanCmd,
  hackbanCmd,
  unmuteallCmd,
  banlistCmd,
  modlogsCmd,
  caseCmd,
  announceCmd,
  dmCmd,
  masskickCmd,
  massroleCmd,
];
