import {
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type TextChannel,
} from "discord.js";
import type { SlashCommand } from "../lib/command.js";
import { aestheticEmbed, errorEmbed, successEmbed } from "../lib/embed.js";

export const channelCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("channel")
    .setDescription("Channel management ✿")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand((s) =>
      s.setName("create").setDescription("Create a text channel")
        .addStringOption((o) => o.setName("name").setDescription("Name").setRequired(true)),
    )
    .addSubcommand((s) =>
      s.setName("delete").setDescription("Delete this channel"),
    )
    .addSubcommand((s) =>
      s.setName("clone").setDescription("Clone this channel"),
    )
    .addSubcommand((s) =>
      s.setName("nuke").setDescription("Delete & re-create this channel (clears all messages)"),
    )
    .addSubcommand((s) =>
      s.setName("hide").setDescription("Hide channel from @everyone"),
    )
    .addSubcommand((s) =>
      s.setName("show").setDescription("Show channel to @everyone"),
    )
    .addSubcommand((s) =>
      s.setName("rename").setDescription("Rename channel")
        .addStringOption((o) => o.setName("name").setDescription("New name").setRequired(true)),
    )
    .addSubcommand((s) =>
      s.setName("topic").setDescription("Set channel topic")
        .addStringOption((o) => o.setName("topic").setDescription("Topic").setRequired(true)),
    )
    .addSubcommand((s) =>
      s.setName("info").setDescription("Channel info"),
    ),
  async execute(i) {
    if (!i.guild || !i.channel) return;
    const sub = i.options.getSubcommand();
    const ch = i.channel as TextChannel;
    if (sub === "create") {
      const name = i.options.getString("name", true);
      const c = await i.guild.channels.create({ name, type: ChannelType.GuildText });
      return i.reply({ embeds: [successEmbed(`created <#${c.id}>`)], ephemeral: true });
    }
    if (sub === "delete") {
      await i.reply({ embeds: [successEmbed("deleting...")], ephemeral: true });
      return ch.delete();
    }
    if (sub === "clone") {
      const c = await ch.clone();
      return i.reply({ embeds: [successEmbed(`cloned to <#${c.id}>`)], ephemeral: true });
    }
    if (sub === "nuke") {
      const pos = ch.position;
      const c = await ch.clone();
      await c.setPosition(pos);
      await ch.delete();
      await c.send({ embeds: [aestheticEmbed({ title: "💥 channel nuked", description: "all messages cleared ✿" })] });
      return;
    }
    if (sub === "hide") {
      await ch.permissionOverwrites.edit(i.guild.roles.everyone, { ViewChannel: false });
      return i.reply({ embeds: [successEmbed("channel hidden")], ephemeral: true });
    }
    if (sub === "show") {
      await ch.permissionOverwrites.edit(i.guild.roles.everyone, { ViewChannel: null });
      return i.reply({ embeds: [successEmbed("channel visible")], ephemeral: true });
    }
    if (sub === "rename") {
      const name = i.options.getString("name", true);
      await ch.setName(name);
      return i.reply({ embeds: [successEmbed(`renamed to ${name}`)], ephemeral: true });
    }
    if (sub === "topic") {
      const t = i.options.getString("topic", true);
      await ch.setTopic(t);
      return i.reply({ embeds: [successEmbed(`topic set`)], ephemeral: true });
    }
    if (sub === "info") {
      return i.reply({
        embeds: [
          aestheticEmbed({
            title: `# ${ch.name}`,
            fields: [
              { name: "id", value: ch.id, inline: true },
              { name: "type", value: ChannelType[ch.type], inline: true },
              { name: "created", value: `<t:${Math.floor(ch.createdTimestamp! / 1000)}:R>`, inline: true },
              { name: "topic", value: ch.topic ?? "none", inline: false },
              { name: "slowmode", value: `${ch.rateLimitPerUser}s`, inline: true },
              { name: "nsfw", value: ch.nsfw ? "yes" : "no", inline: true },
            ],
          }),
        ],
      });
    }
  },
};

export const serverCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("server")
    .setDescription("Server management ✿")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) =>
      s.setName("rename").setDescription("Rename the server")
        .addStringOption((o) => o.setName("name").setDescription("Name").setRequired(true)),
    )
    .addSubcommand((s) =>
      s.setName("icon").setDescription("Set server icon")
        .addStringOption((o) => o.setName("url").setDescription("Image URL").setRequired(true)),
    )
    .addSubcommand((s) =>
      s.setName("banner").setDescription("Set server banner")
        .addStringOption((o) => o.setName("url").setDescription("Image URL").setRequired(true)),
    ),
  async execute(i) {
    if (!i.guild) return;
    const sub = i.options.getSubcommand();
    try {
      if (sub === "rename") {
        const name = i.options.getString("name", true);
        await i.guild.setName(name);
      } else if (sub === "icon") {
        await i.guild.setIcon(i.options.getString("url", true));
      } else if (sub === "banner") {
        await i.guild.setBanner(i.options.getString("url", true));
      }
      await i.reply({ embeds: [successEmbed(`✿ ${sub} updated`)], ephemeral: true });
    } catch (e) {
      await i.reply({ embeds: [errorEmbed((e as Error).message)], ephemeral: true });
    }
  },
};

export const emojiCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("emoji")
    .setDescription("Emoji management ✿")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuildExpressions)
    .addSubcommand((s) =>
      s.setName("add").setDescription("Add an emoji")
        .addStringOption((o) => o.setName("name").setDescription("Name").setRequired(true))
        .addStringOption((o) => o.setName("url").setDescription("Image URL").setRequired(true)),
    )
    .addSubcommand((s) =>
      s.setName("remove").setDescription("Remove an emoji")
        .addStringOption((o) => o.setName("name").setDescription("Name").setRequired(true)),
    )
    .addSubcommand((s) =>
      s.setName("list").setDescription("List server emojis"),
    )
    .addSubcommand((s) =>
      s.setName("steal").setDescription("Steal an emoji from another message")
        .addStringOption((o) => o.setName("emoji").setDescription("Custom emoji").setRequired(true))
        .addStringOption((o) => o.setName("name").setDescription("Save as name").setRequired(true)),
    )
    .addSubcommand((s) =>
      s.setName("enlarge").setDescription("Enlarge a custom emoji")
        .addStringOption((o) => o.setName("emoji").setDescription("Emoji").setRequired(true)),
    ),
  async execute(i) {
    if (!i.guild) return;
    const sub = i.options.getSubcommand();
    if (sub === "list") {
      const list = i.guild.emojis.cache.map((e) => `${e}`).join(" ") || "none";
      return i.reply({
        embeds: [aestheticEmbed({ title: `emojis (${i.guild.emojis.cache.size})`, description: list.slice(0, 4000) })],
      });
    }
    if (sub === "add") {
      try {
        const e = await i.guild.emojis.create({
          attachment: i.options.getString("url", true),
          name: i.options.getString("name", true),
        });
        return i.reply({ embeds: [successEmbed(`added ${e}`)] });
      } catch (e) {
        return i.reply({ embeds: [errorEmbed((e as Error).message)], ephemeral: true });
      }
    }
    if (sub === "remove") {
      const name = i.options.getString("name", true);
      const e = i.guild.emojis.cache.find((x) => x.name === name);
      if (!e) return i.reply({ embeds: [errorEmbed("not found")], ephemeral: true });
      await e.delete();
      return i.reply({ embeds: [successEmbed(`removed :${name}:`)] });
    }
    if (sub === "steal" || sub === "enlarge") {
      const raw = i.options.getString("emoji", true);
      const m = raw.match(/<a?:([^:]+):(\d+)>/);
      if (!m) return i.reply({ embeds: [errorEmbed("not a custom emoji")], ephemeral: true });
      const id = m[2]!;
      const ext = raw.startsWith("<a:") ? "gif" : "png";
      const url = `https://cdn.discordapp.com/emojis/${id}.${ext}`;
      if (sub === "enlarge") {
        return i.reply({ embeds: [aestheticEmbed({ image: url })] });
      }
      try {
        const e = await i.guild.emojis.create({ attachment: url, name: i.options.getString("name", true) });
        return i.reply({ embeds: [successEmbed(`stole ${e}`)] });
      } catch (e) {
        return i.reply({ embeds: [errorEmbed((e as Error).message)], ephemeral: true });
      }
    }
  },
};

export const msgCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("msg")
    .setDescription("Message utilities")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand((s) =>
      s.setName("pin").setDescription("Pin a message").addStringOption((o) => o.setName("id").setDescription("Message ID").setRequired(true)),
    )
    .addSubcommand((s) =>
      s.setName("unpin").setDescription("Unpin a message").addStringOption((o) => o.setName("id").setDescription("Message ID").setRequired(true)),
    )
    .addSubcommand((s) =>
      s.setName("react").setDescription("React to a message")
        .addStringOption((o) => o.setName("id").setDescription("Message ID").setRequired(true))
        .addStringOption((o) => o.setName("emoji").setDescription("Emoji").setRequired(true)),
    ),
  async execute(i) {
    if (!i.channel || i.channel.type !== ChannelType.GuildText) return;
    const ch = i.channel as TextChannel;
    const id = i.options.getString("id", true);
    const sub = i.options.getSubcommand();
    try {
      const m = await ch.messages.fetch(id);
      if (sub === "pin") await m.pin();
      else if (sub === "unpin") await m.unpin();
      else if (sub === "react") await m.react(i.options.getString("emoji", true));
      await i.reply({ embeds: [successEmbed("✿ done")], ephemeral: true });
    } catch (e) {
      await i.reply({ embeds: [errorEmbed((e as Error).message)], ephemeral: true });
    }
  },
};

export const commands = [channelCmd, serverCmd, emojiCmd, msgCmd];
