import {
  PermissionFlagsBits,
  SlashCommandBuilder,
  type GuildMember,
} from "discord.js";
import type { SlashCommand } from "../lib/command.js";
import { aestheticEmbed } from "../lib/embed.js";
import { config } from "../lib/config.js";

export const pingCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("check bot latency ✿") as SlashCommandBuilder,
  async execute(interaction) {
    const sent = await interaction.reply({
      embeds: [aestheticEmbed({ description: "pinging..." })],
      fetchReply: true,
    });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    await interaction.editReply({
      embeds: [
        aestheticEmbed({
          title: "✿ pong ✿",
          description: `latency: **${latency}ms**\napi: **${Math.round(interaction.client.ws.ping)}ms**`,
        }),
      ],
    });
  },
};

export const userinfoCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("info about a user")
    .addUserOption((o) =>
      o.setName("user").setDescription("user (defaults to you)"),
    ) as SlashCommandBuilder,
  async execute(interaction) {
    if (!interaction.guild) return;
    const user = interaction.options.getUser("user") ?? interaction.user;
    const member = (await interaction.guild.members
      .fetch(user.id)
      .catch(() => null)) as GuildMember | null;
    const fields = [
      { name: "id", value: user.id, inline: true },
      {
        name: "created",
        value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`,
        inline: true,
      },
    ];
    if (member) {
      fields.push({
        name: "joined",
        value: `<t:${Math.floor((member.joinedTimestamp ?? 0) / 1000)}:R>`,
        inline: true,
      });
      fields.push({
        name: `roles (${member.roles.cache.size - 1})`,
        value:
          member.roles.cache
            .filter((r) => r.name !== "@everyone")
            .map((r) => `<@&${r.id}>`)
            .slice(0, 20)
            .join(" ") || "none",
        inline: false,
      });
    }
    await interaction.reply({
      embeds: [
        aestheticEmbed({
          title: `✿ ${user.tag}`,
          thumbnail: user.displayAvatarURL({ size: 256 }),
          fields,
        }),
      ],
    });
  },
};

export const serverinfoCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("info about this server") as SlashCommandBuilder,
  async execute(interaction) {
    if (!interaction.guild) return;
    const g = interaction.guild;
    await g.fetch();
    await interaction.reply({
      embeds: [
        aestheticEmbed({
          title: `✿ ${g.name}`,
          thumbnail: g.iconURL({ size: 256 }) ?? undefined,
          fields: [
            { name: "members", value: `${g.memberCount}`, inline: true },
            { name: "channels", value: `${g.channels.cache.size}`, inline: true },
            { name: "roles", value: `${g.roles.cache.size}`, inline: true },
            { name: "owner", value: `<@${g.ownerId}>`, inline: true },
            {
              name: "created",
              value: `<t:${Math.floor(g.createdTimestamp / 1000)}:R>`,
              inline: true,
            },
            { name: "boosts", value: `${g.premiumSubscriptionCount ?? 0}`, inline: true },
          ],
        }),
      ],
    });
  },
};

export const avatarCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("get a user's avatar")
    .addUserOption((o) =>
      o.setName("user").setDescription("user (defaults to you)"),
    ) as SlashCommandBuilder,
  async execute(interaction) {
    const user = interaction.options.getUser("user") ?? interaction.user;
    await interaction.reply({
      embeds: [
        aestheticEmbed({
          title: `✿ ${user.tag}'s avatar`,
          image: user.displayAvatarURL({ size: 1024 }),
        }),
      ],
    });
  },
};

export const websiteCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("website")
    .setDescription("get our website link") as SlashCommandBuilder,
  async execute(interaction) {
    await interaction.reply({
      embeds: [
        aestheticEmbed({
          title: "♡ our website ♡",
          description: `୨୧ visit us here: ${config.website}`,
        }),
      ],
    });
  },
};

export const sayCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("say")
    .setDescription("send a message as the bot")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption((o) =>
      o.setName("text").setDescription("message").setRequired(true),
    )
    .addBooleanOption((o) =>
      o.setName("embed").setDescription("send as aesthetic embed"),
    ) as SlashCommandBuilder,
  async execute(interaction) {
    const text = interaction.options.getString("text", true);
    const asEmbed = interaction.options.getBoolean("embed") ?? false;
    if (!interaction.channel || !("send" in interaction.channel)) {
      await interaction.reply({ content: "no channel", ephemeral: true });
      return;
    }
    if (asEmbed) {
      await interaction.channel.send({
        embeds: [aestheticEmbed({ description: text })],
      });
    } else {
      await interaction.channel.send(text);
    }
    await interaction.reply({ content: "sent ✿", ephemeral: true });
  },
};

export const embedCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("embed")
    .setDescription("create a custom aesthetic embed")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption((o) =>
      o
        .setName("description")
        .setDescription("embed description (use \\n for newlines)")
        .setRequired(true),
    )
    .addStringOption((o) =>
      o.setName("title").setDescription("embed title"),
    )
    .addStringOption((o) =>
      o.setName("color").setDescription("hex color, e.g. #f4c2c2"),
    )
    .addStringOption((o) =>
      o.setName("image").setDescription("image url"),
    )
    .addStringOption((o) =>
      o.setName("thumbnail").setDescription("thumbnail url"),
    ) as SlashCommandBuilder,
  async execute(interaction) {
    const title = interaction.options.getString("title") ?? undefined;
    const description = interaction.options
      .getString("description", true)
      .replace(/\\n/g, "\n");
    const colorStr = interaction.options.getString("color");
    const image = interaction.options.getString("image") ?? undefined;
    const thumbnail = interaction.options.getString("thumbnail") ?? undefined;
    const color = colorStr
      ? parseInt(colorStr.replace("#", ""), 16)
      : undefined;
    if (!interaction.channel || !("send" in interaction.channel)) return;
    await interaction.channel.send({
      embeds: [aestheticEmbed({ title, description, color, image, thumbnail })],
    });
    await interaction.reply({ content: "embed sent ✿", ephemeral: true });
  },
};

export const roleCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("role")
    .setDescription("add or remove a role from a member")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption((o) =>
      o.setName("user").setDescription("user").setRequired(true),
    )
    .addRoleOption((o) =>
      o.setName("role").setDescription("role").setRequired(true),
    ) as SlashCommandBuilder,
  async execute(interaction) {
    if (!interaction.guild) return;
    const user = interaction.options.getUser("user", true);
    const role = interaction.options.getRole("role", true);
    const member = await interaction.guild.members.fetch(user.id);
    const has = member.roles.cache.has(role.id);
    if (has) {
      await member.roles.remove(role.id);
      await interaction.reply({
        embeds: [
          aestheticEmbed({
            description: `removed <@&${role.id}> from <@${user.id}>`,
          }),
        ],
      });
    } else {
      await member.roles.add(role.id);
      await interaction.reply({
        embeds: [
          aestheticEmbed({
            description: `gave <@&${role.id}> to <@${user.id}>`,
          }),
        ],
      });
    }
  },
};

export const helpCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("see all bot commands ✿") as SlashCommandBuilder,
  async execute(interaction) {
    await interaction.reply({
      embeds: [
        aestheticEmbed({
          title: "✿ latent bot — commands ✿",
          description: `୨୧ visit: ${config.website}`,
          fields: [
            {
              name: "˚ʚ setup ɞ˚",
              value:
                "`/setup` `/config autorole` `/config welcome` `/config goodbye` `/config modlog` `/config view`",
            },
            {
              name: "˚ʚ moderation ɞ˚",
              value:
                "`/ban` `/unban` `/kick` `/mute` `/unmute` `/warn` `/warns` `/clearwarns` `/purge` `/lock` `/unlock` `/slowmode` `/nick`",
            },
            {
              name: "˚ʚ utility ɞ˚",
              value:
                "`/ping` `/userinfo` `/serverinfo` `/avatar` `/role` `/website`",
            },
            {
              name: "˚ʚ fun ɞ˚",
              value:
                "`/say` `/embed` `/reactionrole add` `/reactionrole remove` `/sticky set` `/sticky remove`",
            },
          ],
        }),
      ],
      ephemeral: true,
    });
  },
};

export const commands = [
  pingCmd,
  userinfoCmd,
  serverinfoCmd,
  avatarCmd,
  websiteCmd,
  sayCmd,
  embedCmd,
  roleCmd,
  helpCmd,
];
