import {
  PermissionFlagsBits,
  SlashCommandBuilder,
  type TextChannel,
} from "discord.js";
import type { SlashCommand } from "../lib/command.js";
import { aestheticEmbed, errorEmbed, successEmbed } from "../lib/embed.js";
import { addCase, getGuild, updateGuild } from "../lib/storage.js";
import { parseDuration } from "../lib/parse.js";

// /mod hub command
export const modHubCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("mod")
    .setDescription("Extended moderation ✿")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand((s) => s.setName("softban").setDescription("Ban+unban (clears msgs)").addUserOption((o) => o.setName("user").setDescription("User").setRequired(true)).addStringOption((o) => o.setName("reason").setDescription("Reason")))
    .addSubcommand((s) => s.setName("tempban").setDescription("Temp ban").addUserOption((o) => o.setName("user").setDescription("User").setRequired(true)).addStringOption((o) => o.setName("duration").setDescription("e.g. 1d").setRequired(true)).addStringOption((o) => o.setName("reason").setDescription("Reason")))
    .addSubcommand((s) => s.setName("hackban").setDescription("Ban by ID").addStringOption((o) => o.setName("user_id").setDescription("ID").setRequired(true)).addStringOption((o) => o.setName("reason").setDescription("Reason")))
    .addSubcommand((s) => s.setName("unmuteall").setDescription("Unmute everyone"))
    .addSubcommand((s) => s.setName("banlist").setDescription("List banned users"))
    .addSubcommand((s) => s.setName("modlogs").setDescription("View user's mod history").addUserOption((o) => o.setName("user").setDescription("User").setRequired(true)))
    .addSubcommand((s) => s.setName("case").setDescription("View a case").addIntegerOption((o) => o.setName("id").setDescription("ID").setRequired(true)))
    .addSubcommand((s) => s.setName("reason").setDescription("Edit case reason").addIntegerOption((o) => o.setName("id").setDescription("ID").setRequired(true)).addStringOption((o) => o.setName("reason").setDescription("New reason").setRequired(true)))
    .addSubcommand((s) => s.setName("note").setDescription("Add a private mod note").addUserOption((o) => o.setName("user").setDescription("User").setRequired(true)).addStringOption((o) => o.setName("note").setDescription("Note").setRequired(true)))
    .addSubcommand((s) => s.setName("notes").setDescription("View notes for a user").addUserOption((o) => o.setName("user").setDescription("User").setRequired(true)))
    .addSubcommand((s) => s.setName("clearnotes").setDescription("Clear notes for a user").addUserOption((o) => o.setName("user").setDescription("User").setRequired(true)))
    .addSubcommand((s) => s.setName("dm").setDescription("DM a user as the bot").addUserOption((o) => o.setName("user").setDescription("User").setRequired(true)).addStringOption((o) => o.setName("message").setDescription("Message").setRequired(true)))
    .addSubcommand((s) => s.setName("announce").setDescription("Send announcement embed").addStringOption((o) => o.setName("message").setDescription("Message").setRequired(true)).addChannelOption((o) => o.setName("channel").setDescription("Channel")).addStringOption((o) => o.setName("title").setDescription("Title")).addBooleanOption((o) => o.setName("ping").setDescription("@everyone")))
    .addSubcommand((s) => s.setName("masskick").setDescription("Kick all in role").addRoleOption((o) => o.setName("role").setDescription("Role").setRequired(true)).addStringOption((o) => o.setName("reason").setDescription("Reason")))
    .addSubcommand((s) => s.setName("massrole-add").setDescription("Add role to everyone").addRoleOption((o) => o.setName("role").setDescription("Role").setRequired(true)))
    .addSubcommand((s) => s.setName("massrole-remove").setDescription("Remove role from everyone").addRoleOption((o) => o.setName("role").setDescription("Role").setRequired(true)))
    .addSubcommand((s) => s.setName("raidkick").setDescription("Kick members joined recently").addStringOption((o) => o.setName("within").setDescription("e.g. 10m").setRequired(true)))
    .addSubcommand((s) => s.setName("verify").setDescription("Manually verify a member").addUserOption((o) => o.setName("user").setDescription("User").setRequired(true)))
    .addSubcommand((s) => s.setName("unverify").setDescription("Remove verified role").addUserOption((o) => o.setName("user").setDescription("User").setRequired(true)))
    .addSubcommand((s) => s.setName("modping").setDescription("Ping the mod team here")),
  async execute(i) {
    if (!i.guild) return;
    const sub = i.options.getSubcommand();
    if (sub === "softban") {
      const u = i.options.getUser("user", true);
      const reason = i.options.getString("reason") ?? "softban";
      try {
        await i.guild.members.ban(u.id, { deleteMessageSeconds: 86400, reason });
        await i.guild.members.unban(u.id, "softban");
        addCase(i.guild.id, { type: "softban", user: u.id, mod: i.user.id, reason, at: Date.now() });
        return i.reply({ embeds: [successEmbed(`softbanned **${u.tag}**`)] });
      } catch (e) { return i.reply({ embeds: [errorEmbed((e as Error).message)], ephemeral: true }); }
    }
    if (sub === "tempban") {
      const u = i.options.getUser("user", true);
      const ms = parseDuration(i.options.getString("duration", true));
      if (!ms) return i.reply({ embeds: [errorEmbed("invalid duration")], ephemeral: true });
      const reason = i.options.getString("reason") ?? "tempban";
      try {
        await i.guild.members.ban(u.id, { reason });
        updateGuild(i.guild.id, (g) => g.tempbans.push({ user: u.id, expires: Date.now() + ms }));
        addCase(i.guild.id, { type: "tempban", user: u.id, mod: i.user.id, reason, at: Date.now(), duration: ms });
        return i.reply({ embeds: [successEmbed(`tempbanned **${u.tag}**`)] });
      } catch (e) { return i.reply({ embeds: [errorEmbed((e as Error).message)], ephemeral: true }); }
    }
    if (sub === "hackban") {
      const id = i.options.getString("user_id", true);
      const reason = i.options.getString("reason") ?? "hackban";
      try {
        await i.guild.members.ban(id, { reason });
        addCase(i.guild.id, { type: "hackban", user: id, mod: i.user.id, reason, at: Date.now() });
        return i.reply({ embeds: [successEmbed(`hackbanned <@${id}>`)] });
      } catch (e) { return i.reply({ embeds: [errorEmbed((e as Error).message)], ephemeral: true }); }
    }
    if (sub === "unmuteall") {
      await i.deferReply({ ephemeral: true });
      let n = 0;
      const members = await i.guild.members.fetch();
      for (const m of members.values()) {
        if (m.communicationDisabledUntilTimestamp && m.communicationDisabledUntilTimestamp > Date.now()) {
          try { await m.timeout(null); n++; } catch {}
        }
      }
      return i.editReply({ embeds: [successEmbed(`unmuted ${n} members`)] });
    }
    if (sub === "banlist") {
      const bans = await i.guild.bans.fetch();
      if (bans.size === 0) return i.reply({ embeds: [aestheticEmbed({ description: "no bans ✿" })], ephemeral: true });
      return i.reply({ embeds: [aestheticEmbed({ title: `🚫 bans (${bans.size})`, description: bans.first(25).map((b) => `**${b.user.tag}** — ${b.reason ?? "no reason"}`).join("\n") })], ephemeral: true });
    }
    if (sub === "modlogs") {
      const u = i.options.getUser("user", true);
      const cases = getGuild(i.guild.id).cases.filter((c) => c.user === u.id);
      if (!cases.length) return i.reply({ embeds: [aestheticEmbed({ description: `no cases for **${u.tag}** ✿` })] });
      return i.reply({ embeds: [aestheticEmbed({ title: `📋 cases for ${u.tag}`, description: cases.slice(-15).map((c) => `**#${c.id}** \`${c.type}\` — ${c.reason} — by <@${c.mod}>`).join("\n") })] });
    }
    if (sub === "case") {
      const id = i.options.getInteger("id", true);
      const c = getGuild(i.guild.id).cases.find((x) => x.id === id);
      if (!c) return i.reply({ embeds: [errorEmbed("not found")], ephemeral: true });
      return i.reply({ embeds: [aestheticEmbed({ title: `case #${c.id}`, description: `type: \`${c.type}\`\nuser: <@${c.user}>\nmod: <@${c.mod}>\nreason: ${c.reason}\n<t:${Math.floor(c.at / 1000)}:R>` })] });
    }
    if (sub === "reason") {
      const id = i.options.getInteger("id", true);
      const reason = i.options.getString("reason", true);
      updateGuild(i.guild.id, (g) => { const c = g.cases.find((x) => x.id === id); if (c) c.reason = reason; });
      return i.reply({ embeds: [successEmbed(`case #${id} updated`)] });
    }
    if (sub === "note") {
      const u = i.options.getUser("user", true);
      const note = i.options.getString("note", true);
      updateGuild(i.guild.id, (g) => {
        if (!g.modNotes) g.modNotes = {};
        if (!g.modNotes[u.id]) g.modNotes[u.id] = [];
        g.modNotes[u.id]!.push({ mod: i.user.id, note, at: Date.now() });
      });
      return i.reply({ embeds: [successEmbed("note added")], ephemeral: true });
    }
    if (sub === "notes") {
      const u = i.options.getUser("user", true);
      const notes = getGuild(i.guild.id).modNotes?.[u.id] ?? [];
      return i.reply({ embeds: [aestheticEmbed({ title: `notes for ${u.tag}`, description: notes.map((n) => `\`${new Date(n.at).toLocaleDateString()}\` <@${n.mod}>: ${n.note}`).join("\n") || "no notes" })], ephemeral: true });
    }
    if (sub === "clearnotes") {
      const u = i.options.getUser("user", true);
      updateGuild(i.guild.id, (g) => { if (g.modNotes) delete g.modNotes[u.id]; });
      return i.reply({ embeds: [successEmbed("notes cleared")], ephemeral: true });
    }
    if (sub === "dm") {
      const u = i.options.getUser("user", true);
      const text = i.options.getString("message", true).replace(/\\n/g, "\n");
      try {
        await u.send({ embeds: [aestheticEmbed({ title: `message from ${i.guild.name}`, description: text })] });
        return i.reply({ embeds: [successEmbed(`dm sent to **${u.tag}**`)], ephemeral: true });
      } catch { return i.reply({ embeds: [errorEmbed("could not dm")], ephemeral: true }); }
    }
    if (sub === "announce") {
      const text = i.options.getString("message", true).replace(/\\n/g, "\n");
      const title = i.options.getString("title") ?? "📢 announcement";
      const ping = i.options.getBoolean("ping") ?? false;
      const ch = (i.options.getChannel("channel") ?? i.channel) as TextChannel;
      await ch.send({ content: ping ? "@everyone" : undefined, embeds: [aestheticEmbed({ title, description: text })], allowedMentions: ping ? { parse: ["everyone"] } : undefined });
      return i.reply({ embeds: [successEmbed("sent ✿")], ephemeral: true });
    }
    if (sub === "masskick") {
      const r = i.options.getRole("role", true);
      const reason = i.options.getString("reason") ?? "mass kick";
      await i.deferReply({ ephemeral: true });
      let n = 0;
      const role = await i.guild.roles.fetch(r.id);
      if (!role) return i.editReply({ embeds: [errorEmbed("role not found")] });
      for (const m of role.members.values()) { try { await m.kick(reason); n++; } catch {} }
      return i.editReply({ embeds: [successEmbed(`kicked ${n}`)] });
    }
    if (sub === "massrole-add" || sub === "massrole-remove") {
      const r = i.options.getRole("role", true);
      await i.deferReply({ ephemeral: true });
      const members = await i.guild.members.fetch();
      let n = 0;
      for (const m of members.values()) {
        if (m.user.bot) continue;
        try {
          if (sub === "massrole-add" && !m.roles.cache.has(r.id)) { await m.roles.add(r.id); n++; }
          if (sub === "massrole-remove" && m.roles.cache.has(r.id)) { await m.roles.remove(r.id); n++; }
        } catch {}
      }
      return i.editReply({ embeds: [successEmbed(`updated ${n}`)] });
    }
    if (sub === "raidkick") {
      const ms = parseDuration(i.options.getString("within", true));
      if (!ms) return i.reply({ embeds: [errorEmbed("invalid duration")], ephemeral: true });
      await i.deferReply({ ephemeral: true });
      const cutoff = Date.now() - ms;
      const members = await i.guild.members.fetch();
      let n = 0;
      for (const m of members.values()) {
        if (m.joinedTimestamp && m.joinedTimestamp > cutoff && !m.user.bot) {
          try { await m.kick("raid cleanup"); n++; } catch {}
        }
      }
      return i.editReply({ embeds: [successEmbed(`kicked ${n} recent joins`)] });
    }
    if (sub === "verify" || sub === "unverify") {
      const u = i.options.getUser("user", true);
      const m = await i.guild.members.fetch(u.id);
      const role = i.guild.roles.cache.find((r) => r.name.includes("verified"));
      if (!role) return i.reply({ embeds: [errorEmbed("no verified role")], ephemeral: true });
      try {
        if (sub === "verify") await m.roles.add(role.id);
        else await m.roles.remove(role.id);
        return i.reply({ embeds: [successEmbed(`${sub === "verify" ? "verified" : "unverified"} **${u.tag}**`)] });
      } catch (e) { return i.reply({ embeds: [errorEmbed((e as Error).message)], ephemeral: true }); }
    }
    if (sub === "modping") {
      const role = i.guild.roles.cache.find((r) => r.name.includes("mod") && !r.name.includes("head"));
      if (!role) return i.reply({ embeds: [errorEmbed("no mod role")], ephemeral: true });
      return i.reply({ content: `<@&${role.id}> — pinged by <@${i.user.id}>`, allowedMentions: { roles: [role.id] } });
    }
  },
};

export const commands = [modHubCmd];
