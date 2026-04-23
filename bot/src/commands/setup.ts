import {
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type CategoryChannel,
  type Guild,
} from "discord.js";
import type { SlashCommand } from "../lib/command.js";
import { aestheticEmbed, errorEmbed, successEmbed } from "../lib/embed.js";
import { updateGuild } from "../lib/storage.js";
import { config } from "../lib/config.js";

const CATEGORIES: {
  name: string;
  text: string[];
  voice: string[];
}[] = [
  {
    name: "⋆｡˚ ☁︎ ︵ welcome ︵ ☁︎ ˚｡⋆",
    text: ["⋆˚࿔・welcome", "・♡・rules", "✦・announcements", "✿・roles"],
    voice: [],
  },
  {
    name: "˚ ༘ ೀ⋆｡˚ ・ chat ・ ˚｡⋆ ೀ ༘ ˚",
    text: ["💌・general", "𓂃 ࣪˖・media", "✧・selfies", "ᡣ𐭩・pets", "🍓・vent"],
    voice: [],
  },
  {
    name: "✦ ˚ · . voice channels . · ˚ ✦",
    text: ["🎀・vc-chat"],
    voice: [
      "˗ˏˋ ♡ general ♡ ˎˊ˗",
      "⋆ ˚｡⋆୨୧˚ chill ˚୨୧⋆｡˚ ⋆",
      "🎧・lofi lounge",
      "🌙・late night",
      "🎮・gaming",
      "🎬・movie night",
      "🍵・study",
      "afk ‧₊˚",
    ],
  },
  {
    name: "₊˚ʚ ᗢ・ staff・ᗢ ɞ˚₊",
    text: ["🛡・mod-chat", "📋・mod-logs", "📌・suggestions"],
    voice: ["staff vc 🎀"],
  },
];

const ROLES: {
  name: string;
  color: number;
  hoist?: boolean;
  permissions?: bigint[];
}[] = [
  {
    name: "✿ owner",
    color: 0xff9ec7,
    hoist: true,
    permissions: [PermissionFlagsBits.Administrator],
  },
  {
    name: "♡ admin",
    color: 0xc8a2c8,
    hoist: true,
    permissions: [PermissionFlagsBits.Administrator],
  },
  {
    name: "✦ mod",
    color: 0xb5b9ff,
    hoist: true,
    permissions: [
      PermissionFlagsBits.KickMembers,
      PermissionFlagsBits.BanMembers,
      PermissionFlagsBits.ManageMessages,
      PermissionFlagsBits.ModerateMembers,
      PermissionFlagsBits.MuteMembers,
      PermissionFlagsBits.MoveMembers,
    ],
  },
  { name: "✧ trial mod", color: 0xa0d8f1, hoist: true },
  { name: "˚ʚ ᗢ helper ᗢ ɞ˚", color: 0xc1f0c1, hoist: true },
  { name: "★ booster", color: 0xff73fa, hoist: true },
  { name: "♡ vip", color: 0xffd700, hoist: true },
  { name: "✿ active", color: 0xffb6c1 },
  { name: "─── ⋆ pronouns ⋆ ───", color: 0x99aab5 },
  { name: "she/her", color: 0xfddde6 },
  { name: "he/him", color: 0xc6e2ff },
  { name: "they/them", color: 0xd8bfd8 },
  { name: "any/all", color: 0xfffacd },
  { name: "─── ⋆ colors ⋆ ───", color: 0x99aab5 },
  { name: "౨ৎ pink", color: 0xffb3c6 },
  { name: "₊˚ʚ purple", color: 0xc8a2c8 },
  { name: "✦ blue", color: 0xa0d8f1 },
  { name: "✿ green", color: 0xb5e8b0 },
  { name: "♡ yellow", color: 0xfff5b1 },
  { name: "─── ⋆ ping roles ⋆ ───", color: 0x99aab5 },
  { name: "🎀 announcements", color: 0xfddde6 },
  { name: "🎬 movie night", color: 0xd1c4e9 },
  { name: "🎮 gaming", color: 0xb3e5fc },
  { name: "🌙 events", color: 0xffe0b2 },
  { name: "✿ member", color: 0xe8b4d8, hoist: true },
];

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Auto-setup aesthetic categories, channels, and roles ✿")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addBooleanOption((o) =>
      o
        .setName("wipe")
        .setDescription("Delete existing channels first (DANGEROUS)")
        .setRequired(false),
    ) as SlashCommandBuilder,

  async execute(interaction) {
    if (!interaction.guild) return;
    const member = await interaction.guild.members.fetch(interaction.user.id);
    if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        embeds: [errorEmbed("You need Administrator to run this.")],
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });
    const guild = interaction.guild;
    const wipe = interaction.options.getBoolean("wipe") ?? false;

    if (wipe) {
      for (const ch of guild.channels.cache.values()) {
        try {
          await ch.delete("Server setup wipe");
        } catch {}
      }
    }

    const created: string[] = [];
    let memberRoleId: string | undefined;
    let modLogChannelId: string | undefined;
    let welcomeChannelId: string | undefined;

    for (const r of [...ROLES].reverse()) {
      try {
        const existing = guild.roles.cache.find((x) => x.name === r.name);
        let role = existing;
        if (!role) {
          role = await guild.roles.create({
            name: r.name,
            color: r.color,
            hoist: r.hoist ?? false,
            permissions: r.permissions ?? [],
            mentionable: false,
            reason: "Server setup",
          });
          created.push(`role: ${r.name}`);
        }
        if (r.name === "✿ member") memberRoleId = role.id;
      } catch (e) {
        console.error("role err", r.name, e);
      }
    }

    for (const cat of CATEGORIES) {
      let category = guild.channels.cache.find(
        (c) => c.type === ChannelType.GuildCategory && c.name === cat.name,
      ) as CategoryChannel | undefined;
      if (!category) {
        category = await guild.channels.create({
          name: cat.name,
          type: ChannelType.GuildCategory,
        });
        created.push(`category: ${cat.name}`);
      }
      for (const t of cat.text) {
        const exists = guild.channels.cache.find(
          (c) =>
            c.type === ChannelType.GuildText &&
            c.name === slug(t) &&
            c.parentId === category!.id,
        );
        if (!exists) {
          const ch = await guild.channels.create({
            name: t,
            type: ChannelType.GuildText,
            parent: category.id,
          });
          created.push(`text: ${t}`);
          if (t.includes("welcome")) welcomeChannelId = ch.id;
          if (t.includes("mod-logs")) modLogChannelId = ch.id;
        }
      }
      for (const v of cat.voice) {
        const exists = guild.channels.cache.find(
          (c) =>
            c.type === ChannelType.GuildVoice &&
            c.name === v &&
            c.parentId === category!.id,
        );
        if (!exists) {
          await guild.channels.create({
            name: v,
            type: ChannelType.GuildVoice,
            parent: category.id,
          });
          created.push(`voice: ${v}`);
        }
      }
    }

    updateGuild(guild.id, (g) => {
      if (memberRoleId && !g.autoRoleId) g.autoRoleId = memberRoleId;
      if (welcomeChannelId && !g.welcomeChannelId)
        g.welcomeChannelId = welcomeChannelId;
      if (welcomeChannelId && !g.goodbyeChannelId)
        g.goodbyeChannelId = welcomeChannelId;
      if (modLogChannelId && !g.modLogChannelId)
        g.modLogChannelId = modLogChannelId;
    });

    await interaction.editReply({
      embeds: [
        aestheticEmbed({
          title: "✿ server setup complete ✿",
          description: [
            `created **${created.length}** new items.`,
            ``,
            `auto-role: <@&${memberRoleId ?? "none"}>`,
            `welcome channel: ${welcomeChannelId ? `<#${welcomeChannelId}>` : "none"}`,
            `mod-logs: ${modLogChannelId ? `<#${modLogChannelId}>` : "none"}`,
            ``,
            `୨୧ visit us: ${config.website}`,
          ].join("\n"),
        }),
      ],
    });
  },
};

function slug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}・·-]/gu, "")
    .slice(0, 100);
}

void ({} as Guild);
export default command;
