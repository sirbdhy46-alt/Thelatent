import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type TextChannel,
  type VoiceChannel,
} from "discord.js";
import type { SlashCommand } from "../lib/command.js";
import { aestheticEmbed, errorEmbed, successEmbed } from "../lib/embed.js";
import { getGuild, updateGuild } from "../lib/storage.js";
import { config } from "../lib/config.js";

// /role hub: subcommand-rich role management
export const roleHubCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("rolemgr")
    .setDescription("Role management ✿")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand((s) => s.setName("create").setDescription("Create a role").addStringOption((o) => o.setName("name").setDescription("Name").setRequired(true)).addStringOption((o) => o.setName("color").setDescription("Hex color")).addBooleanOption((o) => o.setName("hoist").setDescription("Show separately")))
    .addSubcommand((s) => s.setName("delete").setDescription("Delete a role").addRoleOption((o) => o.setName("role").setDescription("Role").setRequired(true)))
    .addSubcommand((s) => s.setName("rename").setDescription("Rename a role").addRoleOption((o) => o.setName("role").setDescription("Role").setRequired(true)).addStringOption((o) => o.setName("name").setDescription("New name").setRequired(true)))
    .addSubcommand((s) => s.setName("color").setDescription("Change role color").addRoleOption((o) => o.setName("role").setDescription("Role").setRequired(true)).addStringOption((o) => o.setName("hex").setDescription("Hex").setRequired(true)))
    .addSubcommand((s) => s.setName("hoist").setDescription("Toggle hoist").addRoleOption((o) => o.setName("role").setDescription("Role").setRequired(true)).addBooleanOption((o) => o.setName("on").setDescription("On/off").setRequired(true)))
    .addSubcommand((s) => s.setName("mention").setDescription("Toggle mentionable").addRoleOption((o) => o.setName("role").setDescription("Role").setRequired(true)).addBooleanOption((o) => o.setName("on").setDescription("On/off").setRequired(true)))
    .addSubcommand((s) => s.setName("setmute").setDescription("Set the mute role").addRoleOption((o) => o.setName("role").setDescription("Role").setRequired(true))),
  async execute(i) {
    if (!i.guild) return;
    const sub = i.options.getSubcommand();
    if (sub === "create") {
      const name = i.options.getString("name", true);
      const color = i.options.getString("color");
      const hoist = i.options.getBoolean("hoist") ?? false;
      const r = await i.guild.roles.create({ name, color: color ? parseInt(color.replace("#", ""), 16) : undefined, hoist });
      return i.reply({ embeds: [successEmbed(`created <@&${r.id}>`)], ephemeral: true });
    }
    const r = i.options.getRole("role", true);
    const role = await i.guild.roles.fetch(r.id);
    if (!role) return i.reply({ embeds: [errorEmbed("not found")], ephemeral: true });
    try {
      if (sub === "delete") { await role.delete(); return i.reply({ embeds: [successEmbed("deleted")], ephemeral: true }); }
      if (sub === "rename") { await role.setName(i.options.getString("name", true)); return i.reply({ embeds: [successEmbed("renamed")], ephemeral: true }); }
      if (sub === "color") { await role.setColor(parseInt(i.options.getString("hex", true).replace("#", ""), 16)); return i.reply({ embeds: [successEmbed("color set")], ephemeral: true }); }
      if (sub === "hoist") { await role.setHoist(i.options.getBoolean("on", true)); return i.reply({ embeds: [successEmbed("hoist updated")], ephemeral: true }); }
      if (sub === "mention") { await role.setMentionable(i.options.getBoolean("on", true)); return i.reply({ embeds: [successEmbed("mentionable updated")], ephemeral: true }); }
      if (sub === "setmute") { updateGuild(i.guild.id, (g) => (g.muteRoleId = role.id)); return i.reply({ embeds: [successEmbed(`mute role set to <@&${role.id}>`)], ephemeral: true }); }
    } catch (e) { return i.reply({ embeds: [errorEmbed((e as Error).message)], ephemeral: true }); }
  },
};

export const reportCmd: SlashCommand = {
  data: new SlashCommandBuilder().setName("report").setDescription("Report a user to staff")
    .addUserOption((o) => o.setName("user").setDescription("User").setRequired(true))
    .addStringOption((o) => o.setName("reason").setDescription("Reason").setRequired(true)) as SlashCommandBuilder,
  async execute(i) {
    if (!i.guild) return;
    const g = getGuild(i.guild.id);
    const ch = g.staffLogChannelId ? (i.guild.channels.cache.get(g.staffLogChannelId) as TextChannel | undefined) : undefined;
    if (!ch) return i.reply({ embeds: [errorEmbed("staff log channel not set")], ephemeral: true });
    const u = i.options.getUser("user", true);
    const reason = i.options.getString("reason", true);
    await ch.send({ embeds: [aestheticEmbed({ title: "🚨 user report", description: `**reported:** <@${u.id}>\n**by:** <@${i.user.id}>\n**channel:** <#${i.channel?.id}>\n**reason:** ${reason}`, color: 0xf4a4a4 })] });
    return i.reply({ embeds: [successEmbed("reported. staff will review ♡")], ephemeral: true });
  },
};

export const partnerCmd: SlashCommand = {
  data: new SlashCommandBuilder().setName("partner").setDescription("Post a partner advertisement embed")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption((o) => o.setName("server").setDescription("Server name").setRequired(true))
    .addStringOption((o) => o.setName("invite").setDescription("Invite link").setRequired(true))
    .addStringOption((o) => o.setName("description").setDescription("Description").setRequired(true))
    .addStringOption((o) => o.setName("icon").setDescription("Icon URL")) as SlashCommandBuilder,
  async execute(i) {
    if (!i.channel) return;
    await (i.channel as TextChannel).send({
      embeds: [aestheticEmbed({ title: `🤝 partner: ${i.options.getString("server", true)}`, description: i.options.getString("description", true) + `\n\n**join:** ${i.options.getString("invite", true)}`, thumbnail: i.options.getString("icon") ?? undefined })],
    });
    return i.reply({ embeds: [successEmbed("posted ✿")], ephemeral: true });
  },
};

export const mathCmd: SlashCommand = {
  data: new SlashCommandBuilder().setName("math").setDescription("Calculate (basic math only)")
    .addStringOption((o) => o.setName("expression").setDescription("e.g. 2+3*4").setRequired(true)) as SlashCommandBuilder,
  async execute(i) {
    const expr = i.options.getString("expression", true);
    if (!/^[\d+\-*/().\s]+$/.test(expr)) return i.reply({ embeds: [errorEmbed("only numbers and + - * / ( ) allowed")], ephemeral: true });
    try {
      const out = Function(`"use strict"; return (${expr});`)();
      return i.reply({ embeds: [aestheticEmbed({ description: `\`${expr}\` = **${out}**` })] });
    } catch { return i.reply({ embeds: [errorEmbed("could not evaluate")], ephemeral: true }); }
  },
};

export const randomCmd: SlashCommand = {
  data: new SlashCommandBuilder().setName("random").setDescription("Random number")
    .addIntegerOption((o) => o.setName("min").setDescription("Min").setRequired(true))
    .addIntegerOption((o) => o.setName("max").setDescription("Max").setRequired(true)) as SlashCommandBuilder,
  async execute(i) {
    const min = i.options.getInteger("min", true);
    const max = i.options.getInteger("max", true);
    if (min >= max) return i.reply({ embeds: [errorEmbed("min must be < max")], ephemeral: true });
    return i.reply({ embeds: [aestheticEmbed({ description: `🎲 **${Math.floor(Math.random() * (max - min + 1)) + min}** (${min}-${max})` })] });
  },
};

export const quickpollCmd: SlashCommand = {
  data: new SlashCommandBuilder().setName("quickpoll").setDescription("Yes/no poll")
    .addStringOption((o) => o.setName("question").setDescription("Question").setRequired(true)) as SlashCommandBuilder,
  async execute(i) {
    if (!i.channel) return;
    const m = await (i.channel as TextChannel).send({ embeds: [aestheticEmbed({ title: `📊 ${i.options.getString("question", true)}`, footer: `by ${i.user.tag}` })] });
    await m.react("✅");
    await m.react("❌");
    return i.reply({ embeds: [successEmbed("posted ✿")], ephemeral: true });
  },
};

export const horoscopeCmd: SlashCommand = {
  data: new SlashCommandBuilder().setName("horoscope").setDescription("Today's horoscope ✦")
    .addStringOption((o) => o.setName("sign").setDescription("Sign").setRequired(true).addChoices(...["aries","taurus","gemini","cancer","leo","virgo","libra","scorpio","sagittarius","capricorn","aquarius","pisces"].map((s) => ({ name: s, value: s })))) as SlashCommandBuilder,
  async execute(i) {
    const sign = i.options.getString("sign", true);
    const seed = (sign.charCodeAt(0) + new Date().getDate()) % 7;
    const messages = [
      "today the universe is whispering — listen for opportunities ✿",
      "patience will serve you better than ambition today ♡",
      "love comes in unexpected forms today ✦",
      "your creative energy is at a peak — make something ୨୧",
      "trust your intuition over advice today ★",
      "a small risk leads to a big reward ✧",
      "rest is productive too. take care of yourself ♡",
    ];
    return i.reply({ embeds: [aestheticEmbed({ title: `✦ ${sign}'s horoscope`, description: messages[seed] })] });
  },
};

export const qrCmd: SlashCommand = {
  data: new SlashCommandBuilder().setName("qr").setDescription("Generate a QR code")
    .addStringOption((o) => o.setName("text").setDescription("Text/URL").setRequired(true)) as SlashCommandBuilder,
  async execute(i) {
    const text = encodeURIComponent(i.options.getString("text", true));
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${text}`;
    return i.reply({ embeds: [aestheticEmbed({ title: "📱 qr code", image: url })] });
  },
};

export const afkmoveCmd: SlashCommand = {
  data: new SlashCommandBuilder().setName("afkmove").setDescription("Move everyone in your VC to AFK channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers) as SlashCommandBuilder,
  async execute(i) {
    if (!i.guild) return;
    const member = await i.guild.members.fetch(i.user.id);
    if (!member.voice.channel) return i.reply({ embeds: [errorEmbed("you must be in a vc")], ephemeral: true });
    const afk = i.guild.channels.cache.find((c) => c.type === ChannelType.GuildVoice && c.name.includes("afk")) as VoiceChannel | undefined;
    if (!afk) return i.reply({ embeds: [errorEmbed("no afk channel found")], ephemeral: true });
    let n = 0;
    for (const m of member.voice.channel.members.values()) {
      try { await m.voice.setChannel(afk.id); n++; } catch {}
    }
    return i.reply({ embeds: [successEmbed(`moved ${n} to afk`)] });
  },
};

export const pinCmd: SlashCommand = {
  data: new SlashCommandBuilder().setName("pin").setDescription("Pin a message")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption((o) => o.setName("id").setDescription("Message ID").setRequired(true)) as SlashCommandBuilder,
  async execute(i) {
    try {
      const m = await (i.channel as TextChannel).messages.fetch(i.options.getString("id", true));
      await m.pin();
      return i.reply({ embeds: [successEmbed("pinned ✿")], ephemeral: true });
    } catch (e) { return i.reply({ embeds: [errorEmbed((e as Error).message)], ephemeral: true }); }
  },
};

export const unpinCmd: SlashCommand = {
  data: new SlashCommandBuilder().setName("unpin").setDescription("Unpin a message")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption((o) => o.setName("id").setDescription("Message ID").setRequired(true)) as SlashCommandBuilder,
  async execute(i) {
    try {
      const m = await (i.channel as TextChannel).messages.fetch(i.options.getString("id", true));
      await m.unpin();
      return i.reply({ embeds: [successEmbed("unpinned ✿")], ephemeral: true });
    } catch (e) { return i.reply({ embeds: [errorEmbed((e as Error).message)], ephemeral: true }); }
  },
};

export const pinsCmd: SlashCommand = {
  data: new SlashCommandBuilder().setName("pins").setDescription("Show pinned messages") as SlashCommandBuilder,
  async execute(i) {
    const pins = await (i.channel as TextChannel).messages.fetchPinned();
    if (pins.size === 0) return i.reply({ embeds: [aestheticEmbed({ description: "no pins ✿" })], ephemeral: true });
    const list = pins.map((m) => `[${m.author?.tag ?? "unknown"}](${m.url}): ${(m.content ?? "*embed*").slice(0, 80)}`).join("\n");
    return i.reply({ embeds: [aestheticEmbed({ title: `📌 pinned (${pins.size})`, description: list.slice(0, 4000) })], ephemeral: true });
  },
};

export const apphereCmd: SlashCommand = {
  data: new SlashCommandBuilder().setName("apphere").setDescription("Re-post the latent show contestant application panel here")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild) as SlashCommandBuilder,
  async execute(i) {
    if (!i.channel) return;
    await (i.channel as TextChannel).send({
      embeds: [aestheticEmbed({
        title: "˚｡⋆୨୧˚ latent show s2 ˚୨୧⋆｡˚",
        description: [
          `୨୧ apply to be a contestant! ✦`,
          ``,
          `singers, dancers, comedians, artists & every hidden talent ♡`,
          `tap below to fill in your story and your dream ✿`,
          ``,
          `୨୧ ${config.website}`,
        ].join("\n"),
      })],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId("apply:contestant").setLabel("🎤 apply as contestant").setStyle(ButtonStyle.Primary),
        ),
      ],
    });
    return i.reply({ embeds: [successEmbed("panel posted ✿")], ephemeral: true });
  },
};

export const stickyremoveCmd: SlashCommand = {
  data: new SlashCommandBuilder().setName("vcinfo").setDescription("Show who's in your VC right now") as SlashCommandBuilder,
  async execute(i) {
    if (!i.guild) return;
    const m = await i.guild.members.fetch(i.user.id);
    const vc = m.voice.channel;
    if (!vc) return i.reply({ embeds: [errorEmbed("you're not in a vc")], ephemeral: true });
    return i.reply({ embeds: [aestheticEmbed({ title: `🔊 ${vc.name}`, description: vc.members.map((mm) => `<@${mm.id}>`).join("\n") || "empty" })] });
  },
};

export const commands = [
  roleHubCmd,
  reportCmd,
  partnerCmd,
  mathCmd,
  randomCmd,
  quickpollCmd,
  horoscopeCmd,
  qrCmd,
  afkmoveCmd,
  pinCmd,
  unpinCmd,
  pinsCmd,
  apphereCmd,
  stickyremoveCmd,
];
