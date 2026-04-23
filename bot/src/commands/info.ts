import {
  PermissionFlagsBits,
  SlashCommandBuilder,
  type TextChannel,
} from "discord.js";
import type { SlashCommand } from "../lib/command.js";
import { aestheticEmbed, errorEmbed, successEmbed } from "../lib/embed.js";
import { getGuild, updateGuild } from "../lib/storage.js";
import { snipeCache, editSnipeCache } from "../lib/snipe.js";

export const snipeCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("snipe")
    .setDescription("See the last deleted message in this channel ✿") as SlashCommandBuilder,
  async execute(i) {
    if (!i.channel) return;
    const s = snipeCache.get(i.channel.id);
    if (!s) return i.reply({ embeds: [errorEmbed("nothing to snipe")], ephemeral: true });
    await i.reply({
      embeds: [
        aestheticEmbed({
          title: "🗑 sniped",
          description: s.content || "*no content*",
          footer: `by ${s.author} — ${new Date(s.at).toLocaleString()}`,
        }),
      ],
    });
  },
};

export const editSnipeCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("editsnipe")
    .setDescription("See the last edited message ✿") as SlashCommandBuilder,
  async execute(i) {
    if (!i.channel) return;
    const s = editSnipeCache.get(i.channel.id);
    if (!s) return i.reply({ embeds: [errorEmbed("nothing to edit-snipe")], ephemeral: true });
    await i.reply({
      embeds: [
        aestheticEmbed({
          title: "✏ edit sniped",
          description: `**before:** ${s.before}\n**after:** ${s.after}`,
          footer: `by ${s.author}`,
        }),
      ],
    });
  },
};

export const afkCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("afk")
    .setDescription("Set or clear your AFK status ✿")
    .addSubcommand((s) =>
      s.setName("set").setDescription("Set yourself AFK")
        .addStringOption((o) => o.setName("reason").setDescription("Reason")),
    )
    .addSubcommand((s) => s.setName("clear").setDescription("Clear your AFK")),
  async execute(i) {
    if (!i.guild) return;
    const sub = i.options.getSubcommand();
    if (sub === "set") {
      const reason = i.options.getString("reason") ?? "afk";
      updateGuild(i.guild.id, (g) => {
        g.afk[i.user.id] = { reason, at: Date.now() };
      });
      await i.reply({ embeds: [successEmbed(`you're now afk: ${reason} ✿`)] });
    } else {
      updateGuild(i.guild.id, (g) => delete g.afk[i.user.id]);
      await i.reply({ embeds: [successEmbed("welcome back ♡")] });
    }
  },
};

export const membercountCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("membercount")
    .setDescription("Show member count ✿") as SlashCommandBuilder,
  async execute(i) {
    if (!i.guild) return;
    const total = i.guild.memberCount;
    const members = await i.guild.members.fetch();
    const humans = members.filter((m) => !m.user.bot).size;
    const bots = total - humans;
    await i.reply({
      embeds: [
        aestheticEmbed({
          title: `✿ ${i.guild.name}`,
          fields: [
            { name: "members", value: `${total}`, inline: true },
            { name: "humans", value: `${humans}`, inline: true },
            { name: "bots", value: `${bots}`, inline: true },
          ],
        }),
      ],
    });
  },
};

export const firstMessageCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("firstmessage")
    .setDescription("Get the first message in this channel ✿") as SlashCommandBuilder,
  async execute(i) {
    if (!i.channel || !("messages" in i.channel)) return;
    const ch = i.channel as TextChannel;
    const msgs = await ch.messages.fetch({ after: "0", limit: 1 });
    const m = msgs.first();
    if (!m) return i.reply({ embeds: [errorEmbed("no messages")], ephemeral: true });
    await i.reply({
      embeds: [aestheticEmbed({ title: "first message", description: `[jump](${m.url})\n\n${m.content || "*embed/file*"}` })],
    });
  },
};

export const timestampCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("timestamp")
    .setDescription("Discord timestamp markdown")
    .addStringOption((o) =>
      o.setName("when").setDescription("e.g. 'in 2h', '2026-01-01' (ISO)").setRequired(true),
    ) as SlashCommandBuilder,
  async execute(i) {
    const when = i.options.getString("when", true);
    let date: Date;
    const inMatch = when.match(/^in\s+(\d+)\s*(s|m|h|d|w)/i);
    if (inMatch) {
      const n = parseInt(inMatch[1]!, 10);
      const u = inMatch[2]!.toLowerCase();
      const mult = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000, w: 604_800_000 }[u]!;
      date = new Date(Date.now() + n * mult);
    } else {
      date = new Date(when);
    }
    if (isNaN(date.getTime())) return i.reply({ embeds: [errorEmbed("invalid date")], ephemeral: true });
    const t = Math.floor(date.getTime() / 1000);
    await i.reply({
      embeds: [
        aestheticEmbed({
          title: `<t:${t}:F>`,
          description: ["F", "f", "D", "d", "T", "t", "R"].map((s) => `\`<t:${t}:${s}>\` → <t:${t}:${s}>`).join("\n"),
        }),
      ],
      ephemeral: true,
    });
  },
};

export const permsCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("perms")
    .setDescription("Show a user's permissions in this channel")
    .addUserOption((o) => o.setName("user").setDescription("User")) as SlashCommandBuilder,
  async execute(i) {
    if (!i.guild || !i.channel) return;
    const u = i.options.getUser("user") ?? i.user;
    const m = await i.guild.members.fetch(u.id);
    const perms = m.permissionsIn(i.channel.id).toArray();
    await i.reply({
      embeds: [
        aestheticEmbed({
          title: `${u.tag} permissions`,
          description: perms.map((p) => `\`${p}\``).join(" ") || "none",
        }),
      ],
      ephemeral: true,
    });
  },
};

export const idCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("id")
    .setDescription("Get a user/channel/role's ID")
    .addUserOption((o) => o.setName("user").setDescription("User"))
    .addChannelOption((o) => o.setName("channel").setDescription("Channel"))
    .addRoleOption((o) => o.setName("role").setDescription("Role")) as SlashCommandBuilder,
  async execute(i) {
    const u = i.options.getUser("user");
    const c = i.options.getChannel("channel");
    const r = i.options.getRole("role");
    const lines: string[] = [];
    if (u) lines.push(`user **${u.tag}**: \`${u.id}\``);
    if (c) lines.push(`channel **${c.name}**: \`${c.id}\``);
    if (r) lines.push(`role **${r.name}**: \`${r.id}\``);
    if (lines.length === 0) lines.push(`your id: \`${i.user.id}\``);
    await i.reply({ embeds: [aestheticEmbed({ description: lines.join("\n") })], ephemeral: true });
  },
};

export const roleinfoCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("roleinfo")
    .setDescription("Info about a role")
    .addRoleOption((o) => o.setName("role").setDescription("Role").setRequired(true)) as SlashCommandBuilder,
  async execute(i) {
    if (!i.guild) return;
    const r = i.options.getRole("role", true);
    const role = await i.guild.roles.fetch(r.id);
    if (!role) return;
    await i.reply({
      embeds: [
        aestheticEmbed({
          title: `✿ ${role.name}`,
          color: role.color || undefined,
          fields: [
            { name: "id", value: role.id, inline: true },
            { name: "members", value: `${role.members.size}`, inline: true },
            { name: "color", value: `#${role.color.toString(16).padStart(6, "0")}`, inline: true },
            { name: "hoisted", value: role.hoist ? "yes" : "no", inline: true },
            { name: "mentionable", value: role.mentionable ? "yes" : "no", inline: true },
            { name: "position", value: `${role.position}`, inline: true },
            { name: "created", value: `<t:${Math.floor(role.createdTimestamp / 1000)}:R>`, inline: false },
          ],
        }),
      ],
    });
  },
};

export const rolesListCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("roleslist")
    .setDescription("List all server roles") as SlashCommandBuilder,
  async execute(i) {
    if (!i.guild) return;
    const roles = i.guild.roles.cache
      .filter((r) => r.name !== "@everyone")
      .sort((a, b) => b.position - a.position)
      .map((r) => `<@&${r.id}> — ${r.members.size}`)
      .join("\n");
    await i.reply({
      embeds: [aestheticEmbed({ title: `roles (${i.guild.roles.cache.size - 1})`, description: roles.slice(0, 4000) })],
      ephemeral: true,
    });
  },
};

export const channelinfoCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("channelinfo")
    .setDescription("Info about a channel")
    .addChannelOption((o) => o.setName("channel").setDescription("Channel")) as SlashCommandBuilder,
  async execute(i) {
    if (!i.guild) return;
    const c = (i.options.getChannel("channel") ?? i.channel) as TextChannel | null;
    if (!c) return;
    await i.reply({
      embeds: [
        aestheticEmbed({
          title: `# ${c.name}`,
          fields: [
            { name: "id", value: c.id, inline: true },
            { name: "category", value: c.parent?.name ?? "none", inline: true },
            { name: "created", value: `<t:${Math.floor(c.createdTimestamp! / 1000)}:R>`, inline: true },
          ],
        }),
      ],
    });
  },
};

export const inviteinfoCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("inviteinfo")
    .setDescription("Info about an invite")
    .addStringOption((o) => o.setName("code").setDescription("Invite code").setRequired(true)) as SlashCommandBuilder,
  async execute(i) {
    const code = i.options.getString("code", true).replace(/.*\//, "");
    try {
      const inv = await i.client.fetchInvite(code);
      await i.reply({
        embeds: [
          aestheticEmbed({
            title: `invite ${code}`,
            fields: [
              { name: "guild", value: inv.guild?.name ?? "?", inline: true },
              { name: "channel", value: inv.channel?.name ?? "?", inline: true },
              { name: "members", value: `${inv.memberCount ?? "?"}`, inline: true },
              { name: "online", value: `${inv.presenceCount ?? "?"}`, inline: true },
            ],
          }),
        ],
      });
    } catch {
      await i.reply({ embeds: [errorEmbed("invite not found")], ephemeral: true });
    }
  },
};

export const invitesCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("invites")
    .setDescription("List server invites & top inviters")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild) as SlashCommandBuilder,
  async execute(i) {
    if (!i.guild) return;
    const invs = await i.guild.invites.fetch();
    const top: Record<string, number> = {};
    for (const inv of invs.values()) {
      if (inv.inviter) top[inv.inviter.id] = (top[inv.inviter.id] ?? 0) + (inv.uses ?? 0);
    }
    const sorted = Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 10);
    await i.reply({
      embeds: [
        aestheticEmbed({
          title: `🎀 invites (${invs.size})`,
          description:
            sorted.map(([id, n], idx) => `**${idx + 1}.** <@${id}> — ${n} uses`).join("\n") || "no invites yet",
        }),
      ],
    });
  },
};

export const serverAvatarCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("serveravatar")
    .setDescription("Get this server's icon ✿") as SlashCommandBuilder,
  async execute(i) {
    if (!i.guild) return;
    const url = i.guild.iconURL({ size: 1024 });
    if (!url) return i.reply({ embeds: [errorEmbed("no icon set")], ephemeral: true });
    await i.reply({ embeds: [aestheticEmbed({ title: i.guild.name, image: url })] });
  },
};

export const bannerCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("banner")
    .setDescription("Get a user's banner")
    .addUserOption((o) => o.setName("user").setDescription("User")) as SlashCommandBuilder,
  async execute(i) {
    const u = i.options.getUser("user") ?? i.user;
    const fetched = await i.client.users.fetch(u.id, { force: true });
    const url = fetched.bannerURL({ size: 1024 });
    if (!url) return i.reply({ embeds: [errorEmbed("no banner")], ephemeral: true });
    await i.reply({ embeds: [aestheticEmbed({ title: `${u.tag}'s banner`, image: url })] });
  },
};

export const boostersCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("boosters")
    .setDescription("List server boosters ★") as SlashCommandBuilder,
  async execute(i) {
    if (!i.guild) return;
    const members = await i.guild.members.fetch();
    const boosters = members.filter((m) => m.premiumSince);
    await i.reply({
      embeds: [
        aestheticEmbed({
          title: `★ boosters (${boosters.size})`,
          description: boosters.map((m) => `<@${m.id}>`).join(" ").slice(0, 4000) || "no boosters yet",
        }),
      ],
    });
  },
};

export const counterCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("counter")
    .setDescription("Setup a member-count voice channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand((s) => s.setName("setup").setDescription("Create the counter VC"))
    .addSubcommand((s) => s.setName("remove").setDescription("Remove the counter VC")),
  async execute(i) {
    if (!i.guild) return;
    const sub = i.options.getSubcommand();
    const g = getGuild(i.guild.id);
    if (sub === "setup") {
      const ch = await i.guild.channels.create({
        name: `✿ members: ${i.guild.memberCount}`,
        type: 2 as const,
      });
      updateGuild(i.guild.id, (gg) => (gg.counterChannelId = ch.id));
      await i.reply({ embeds: [successEmbed(`counter created`)], ephemeral: true });
    } else {
      if (g.counterChannelId) {
        try {
          const ch = await i.guild.channels.fetch(g.counterChannelId);
          await ch?.delete();
        } catch {}
        updateGuild(i.guild.id, (gg) => (gg.counterChannelId = undefined));
      }
      await i.reply({ embeds: [successEmbed("counter removed")], ephemeral: true });
    }
  },
};

export const commands = [
  snipeCmd,
  editSnipeCmd,
  afkCmd,
  membercountCmd,
  firstMessageCmd,
  timestampCmd,
  permsCmd,
  idCmd,
  roleinfoCmd,
  rolesListCmd,
  channelinfoCmd,
  inviteinfoCmd,
  invitesCmd,
  serverAvatarCmd,
  bannerCmd,
  boostersCmd,
  counterCmd,
];
