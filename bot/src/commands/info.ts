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
  data: new SlashCommandBuilder().setName("snipe").setDescription("Last deleted message ✿") as SlashCommandBuilder,
  async execute(i) {
    if (!i.channel) return;
    const s = snipeCache.get(i.channel.id);
    if (!s) return i.reply({ embeds: [errorEmbed("nothing to snipe")], ephemeral: true });
    await i.reply({ embeds: [aestheticEmbed({ title: "🗑 sniped", description: s.content || "*no content*", footer: `by ${s.author}` })] });
  },
};

export const editSnipeCmd: SlashCommand = {
  data: new SlashCommandBuilder().setName("editsnipe").setDescription("Last edited message ✿") as SlashCommandBuilder,
  async execute(i) {
    if (!i.channel) return;
    const s = editSnipeCache.get(i.channel.id);
    if (!s) return i.reply({ embeds: [errorEmbed("nothing to edit-snipe")], ephemeral: true });
    await i.reply({ embeds: [aestheticEmbed({ title: "✏ edit sniped", description: `**before:** ${s.before}\n**after:** ${s.after}`, footer: `by ${s.author}` })] });
  },
};

export const afkCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("afk")
    .setDescription("Set or clear AFK ✿")
    .addSubcommand((s) => s.setName("set").setDescription("Set AFK").addStringOption((o) => o.setName("reason").setDescription("Reason")))
    .addSubcommand((s) => s.setName("clear").setDescription("Clear AFK")),
  async execute(i) {
    if (!i.guild) return;
    const sub = i.options.getSubcommand();
    if (sub === "set") {
      const reason = i.options.getString("reason") ?? "afk";
      updateGuild(i.guild.id, (g) => { g.afk[i.user.id] = { reason, at: Date.now() }; });
      return i.reply({ embeds: [successEmbed(`you're now afk: ${reason} ✿`)] });
    }
    updateGuild(i.guild.id, (g) => delete g.afk[i.user.id]);
    return i.reply({ embeds: [successEmbed("welcome back ♡")] });
  },
};

// /info hub for everything else
export const infoCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("info")
    .setDescription("Server / channel / role / user info ✿")
    .addSubcommand((s) => s.setName("members").setDescription("Member count"))
    .addSubcommand((s) => s.setName("firstmessage").setDescription("First message in this channel"))
    .addSubcommand((s) => s.setName("timestamp").setDescription("Discord timestamp markdown").addStringOption((o) => o.setName("when").setDescription("e.g. 'in 2h' or ISO date").setRequired(true)))
    .addSubcommand((s) => s.setName("perms").setDescription("Show user permissions").addUserOption((o) => o.setName("user").setDescription("User")))
    .addSubcommand((s) => s.setName("id").setDescription("Get IDs").addUserOption((o) => o.setName("user").setDescription("User")).addChannelOption((o) => o.setName("channel").setDescription("Channel")).addRoleOption((o) => o.setName("role").setDescription("Role")))
    .addSubcommand((s) => s.setName("role").setDescription("Role info").addRoleOption((o) => o.setName("role").setDescription("Role").setRequired(true)))
    .addSubcommand((s) => s.setName("roles").setDescription("List all roles"))
    .addSubcommand((s) => s.setName("channel").setDescription("Channel info").addChannelOption((o) => o.setName("channel").setDescription("Channel")))
    .addSubcommand((s) => s.setName("invite").setDescription("Invite info").addStringOption((o) => o.setName("code").setDescription("Code").setRequired(true)))
    .addSubcommand((s) => s.setName("invites").setDescription("Top inviters"))
    .addSubcommand((s) => s.setName("servericon").setDescription("Get server icon"))
    .addSubcommand((s) => s.setName("banner").setDescription("Get a user's banner").addUserOption((o) => o.setName("user").setDescription("User")))
    .addSubcommand((s) => s.setName("boosters").setDescription("List boosters"))
    .addSubcommand((s) => s.setName("emojis").setDescription("List emojis"))
    .addSubcommand((s) => s.setName("stickers").setDescription("List stickers"))
    .addSubcommand((s) => s.setName("vc").setDescription("Show who's in a VC").addChannelOption((o) => o.setName("channel").setDescription("VC")))
    .addSubcommand((s) => s.setName("howmany").setDescription("Count members with a role").addRoleOption((o) => o.setName("role").setDescription("Role").setRequired(true))),
  async execute(i) {
    if (!i.guild) return;
    const sub = i.options.getSubcommand();
    if (sub === "members") {
      const total = i.guild.memberCount;
      const members = await i.guild.members.fetch();
      const humans = members.filter((m) => !m.user.bot).size;
      return i.reply({ embeds: [aestheticEmbed({ title: `✿ ${i.guild.name}`, fields: [{ name: "members", value: `${total}`, inline: true }, { name: "humans", value: `${humans}`, inline: true }, { name: "bots", value: `${total - humans}`, inline: true }] })] });
    }
    if (sub === "firstmessage") {
      const ch = i.channel as TextChannel;
      const msgs = await ch.messages.fetch({ after: "0", limit: 1 });
      const m = msgs.first();
      if (!m) return i.reply({ embeds: [errorEmbed("no messages")], ephemeral: true });
      return i.reply({ embeds: [aestheticEmbed({ title: "first message", description: `[jump](${m.url})\n\n${m.content || "*embed*"}` })] });
    }
    if (sub === "timestamp") {
      const w = i.options.getString("when", true);
      let date: Date;
      const m = w.match(/^in\s+(\d+)\s*(s|m|h|d|w)/i);
      if (m) {
        const mult = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000, w: 604_800_000 }[m[2]!.toLowerCase()]!;
        date = new Date(Date.now() + parseInt(m[1]!, 10) * mult);
      } else date = new Date(w);
      if (isNaN(date.getTime())) return i.reply({ embeds: [errorEmbed("invalid date")], ephemeral: true });
      const t = Math.floor(date.getTime() / 1000);
      return i.reply({ embeds: [aestheticEmbed({ title: `<t:${t}:F>`, description: ["F", "f", "D", "d", "T", "t", "R"].map((s) => `\`<t:${t}:${s}>\` → <t:${t}:${s}>`).join("\n") })], ephemeral: true });
    }
    if (sub === "perms") {
      const u = i.options.getUser("user") ?? i.user;
      const m = await i.guild.members.fetch(u.id);
      const perms = m.permissionsIn(i.channel!.id).toArray();
      return i.reply({ embeds: [aestheticEmbed({ title: `${u.tag} permissions`, description: perms.map((p) => `\`${p}\``).join(" ") || "none" })], ephemeral: true });
    }
    if (sub === "id") {
      const u = i.options.getUser("user");
      const c = i.options.getChannel("channel");
      const r = i.options.getRole("role");
      const lines = [];
      if (u) lines.push(`user **${u.tag}**: \`${u.id}\``);
      if (c) lines.push(`channel **${c.name}**: \`${c.id}\``);
      if (r) lines.push(`role **${r.name}**: \`${r.id}\``);
      if (!lines.length) lines.push(`your id: \`${i.user.id}\``);
      return i.reply({ embeds: [aestheticEmbed({ description: lines.join("\n") })], ephemeral: true });
    }
    if (sub === "role") {
      const r = i.options.getRole("role", true);
      const role = await i.guild.roles.fetch(r.id);
      if (!role) return;
      return i.reply({ embeds: [aestheticEmbed({ title: `✿ ${role.name}`, color: role.color || undefined, fields: [{ name: "id", value: role.id, inline: true }, { name: "members", value: `${role.members.size}`, inline: true }, { name: "color", value: `#${role.color.toString(16).padStart(6, "0")}`, inline: true }, { name: "hoisted", value: role.hoist ? "yes" : "no", inline: true }, { name: "mentionable", value: role.mentionable ? "yes" : "no", inline: true }, { name: "position", value: `${role.position}`, inline: true }] })] });
    }
    if (sub === "roles") {
      const roles = i.guild.roles.cache.filter((r) => r.name !== "@everyone").sort((a, b) => b.position - a.position).map((r) => `<@&${r.id}> — ${r.members.size}`).join("\n");
      return i.reply({ embeds: [aestheticEmbed({ title: `roles (${i.guild.roles.cache.size - 1})`, description: roles.slice(0, 4000) })], ephemeral: true });
    }
    if (sub === "channel") {
      const c = (i.options.getChannel("channel") ?? i.channel) as TextChannel | null;
      if (!c) return;
      return i.reply({ embeds: [aestheticEmbed({ title: `# ${c.name}`, fields: [{ name: "id", value: c.id, inline: true }, { name: "category", value: c.parent?.name ?? "none", inline: true }, { name: "created", value: `<t:${Math.floor(c.createdTimestamp! / 1000)}:R>`, inline: true }] })] });
    }
    if (sub === "invite") {
      const code = i.options.getString("code", true).replace(/.*\//, "");
      try {
        const inv = await i.client.fetchInvite(code);
        return i.reply({ embeds: [aestheticEmbed({ title: `invite ${code}`, fields: [{ name: "guild", value: inv.guild?.name ?? "?", inline: true }, { name: "channel", value: inv.channel?.name ?? "?", inline: true }, { name: "members", value: `${inv.memberCount ?? "?"}`, inline: true }, { name: "online", value: `${inv.presenceCount ?? "?"}`, inline: true }] })] });
      } catch { return i.reply({ embeds: [errorEmbed("invite not found")], ephemeral: true }); }
    }
    if (sub === "invites") {
      const invs = await i.guild.invites.fetch();
      const top: Record<string, number> = {};
      for (const inv of invs.values()) if (inv.inviter) top[inv.inviter.id] = (top[inv.inviter.id] ?? 0) + (inv.uses ?? 0);
      const sorted = Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 10);
      return i.reply({ embeds: [aestheticEmbed({ title: `🎀 invites (${invs.size})`, description: sorted.map(([id, n], idx) => `**${idx + 1}.** <@${id}> — ${n} uses`).join("\n") || "no invites" })] });
    }
    if (sub === "servericon") {
      const url = i.guild.iconURL({ size: 1024 });
      if (!url) return i.reply({ embeds: [errorEmbed("no icon")], ephemeral: true });
      return i.reply({ embeds: [aestheticEmbed({ title: i.guild.name, image: url })] });
    }
    if (sub === "banner") {
      const u = i.options.getUser("user") ?? i.user;
      const f = await i.client.users.fetch(u.id, { force: true });
      const url = f.bannerURL({ size: 1024 });
      if (!url) return i.reply({ embeds: [errorEmbed("no banner")], ephemeral: true });
      return i.reply({ embeds: [aestheticEmbed({ title: `${u.tag}'s banner`, image: url })] });
    }
    if (sub === "boosters") {
      const members = await i.guild.members.fetch();
      const b = members.filter((m) => m.premiumSince);
      return i.reply({ embeds: [aestheticEmbed({ title: `★ boosters (${b.size})`, description: b.map((m) => `<@${m.id}>`).join(" ").slice(0, 4000) || "none" })] });
    }
    if (sub === "emojis") {
      const list = i.guild.emojis.cache.map((e) => `${e}`).join(" ") || "none";
      return i.reply({ embeds: [aestheticEmbed({ title: `emojis (${i.guild.emojis.cache.size})`, description: list.slice(0, 4000) })] });
    }
    if (sub === "stickers") {
      const list = i.guild.stickers.cache.map((s) => s.name).join(", ") || "none";
      return i.reply({ embeds: [aestheticEmbed({ title: `stickers (${i.guild.stickers.cache.size})`, description: list })] });
    }
    if (sub === "vc") {
      const ch = (i.options.getChannel("channel") ?? (await i.guild.members.fetch(i.user.id)).voice.channel) as any;
      if (!ch || ch.type !== 2) return i.reply({ embeds: [errorEmbed("no vc")], ephemeral: true });
      const members = ch.members.map((m: any) => `<@${m.id}>`).join("\n") || "empty";
      return i.reply({ embeds: [aestheticEmbed({ title: `🔊 ${ch.name}`, description: members })] });
    }
    if (sub === "howmany") {
      const r = i.options.getRole("role", true);
      const role = await i.guild.roles.fetch(r.id);
      return i.reply({ embeds: [aestheticEmbed({ description: `<@&${r.id}> has **${role?.members.size ?? 0}** members ✿` })] });
    }
  },
};

export const counterCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("counter")
    .setDescription("Member-count voice channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand((s) => s.setName("setup").setDescription("Create"))
    .addSubcommand((s) => s.setName("remove").setDescription("Remove")),
  async execute(i) {
    if (!i.guild) return;
    const sub = i.options.getSubcommand();
    const g = getGuild(i.guild.id);
    if (sub === "setup") {
      const ch = await i.guild.channels.create({ name: `✿ members: ${i.guild.memberCount}`, type: 2 as const });
      updateGuild(i.guild.id, (gg) => (gg.counterChannelId = ch.id));
      return i.reply({ embeds: [successEmbed("counter created")], ephemeral: true });
    }
    if (g.counterChannelId) {
      try { const ch = await i.guild.channels.fetch(g.counterChannelId); await ch?.delete(); } catch {}
      updateGuild(i.guild.id, (gg) => (gg.counterChannelId = undefined));
    }
    return i.reply({ embeds: [successEmbed("counter removed")], ephemeral: true });
  },
};

export const commands = [snipeCmd, editSnipeCmd, afkCmd, infoCmd, counterCmd];
