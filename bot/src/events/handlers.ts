import {
  ChannelType,
  Events,
  type Client,
  type GuildMember,
  type Message,
  type MessageReaction,
  type PartialMessageReaction,
  type PartialUser,
  type TextChannel,
  type User,
} from "discord.js";
import { aestheticEmbed } from "../lib/embed.js";
import { config } from "../lib/config.js";
import { getGuild, updateGuild } from "../lib/storage.js";

export function registerEvents(client: Client) {
  client.on(Events.GuildMemberAdd, async (member: GuildMember) => {
    const g = getGuild(member.guild.id);
    if (g.autoRoleId) {
      try {
        await member.roles.add(g.autoRoleId, "Auto-role on join");
      } catch (e) {
        console.error("autorole err", e);
      }
    }
    if (g.welcomeChannelId) {
      const ch = member.guild.channels.cache.get(
        g.welcomeChannelId,
      ) as TextChannel | undefined;
      if (ch) {
        await ch.send({
          content: `<@${member.id}>`,
          embeds: [
            aestheticEmbed({
              title: `୨୧ welcome to ${member.guild.name} ୨୧`,
              description: [
                `hi <@${member.id}> ✿`,
                ``,
                `you're member **#${member.guild.memberCount}** ♡`,
                `make sure to read the rules & grab your roles`,
                ``,
                `୨୧ ${config.website}`,
              ].join("\n"),
              thumbnail: member.user.displayAvatarURL({ size: 256 }),
            }),
          ],
        });
      }
    }
  });

  client.on(Events.GuildMemberRemove, async (member) => {
    const g = getGuild(member.guild.id);
    if (g.goodbyeChannelId) {
      const ch = member.guild.channels.cache.get(
        g.goodbyeChannelId,
      ) as TextChannel | undefined;
      if (ch) {
        await ch.send({
          embeds: [
            aestheticEmbed({
              description: `**${member.user?.tag ?? "someone"}** left the server ࿔*:･ﾟ`,
              color: 0xc8a2c8,
            }),
          ],
        });
      }
    }
  });

  client.on(Events.MessageDelete, async (message) => {
    if (!message.guild || message.author?.bot) return;
    const g = getGuild(message.guild.id);
    if (!g.modLogChannelId) return;
    const ch = message.guild.channels.cache.get(
      g.modLogChannelId,
    ) as TextChannel | undefined;
    if (!ch) return;
    await ch
      .send({
        embeds: [
          aestheticEmbed({
            title: "🗑 message deleted",
            description: [
              `author: <@${message.author?.id ?? "unknown"}>`,
              `channel: <#${message.channelId}>`,
              `content: ${message.content ? message.content.slice(0, 1000) : "*no content*"}`,
            ].join("\n"),
            color: 0xf4a4a4,
          }),
        ],
      })
      .catch(() => {});
  });

  client.on(Events.MessageUpdate, async (oldMsg, newMsg) => {
    if (!newMsg.guild || newMsg.author?.bot) return;
    if (oldMsg.content === newMsg.content) return;
    const g = getGuild(newMsg.guild.id);
    if (!g.modLogChannelId) return;
    const ch = newMsg.guild.channels.cache.get(
      g.modLogChannelId,
    ) as TextChannel | undefined;
    if (!ch) return;
    await ch
      .send({
        embeds: [
          aestheticEmbed({
            title: "✏ message edited",
            description: [
              `author: <@${newMsg.author?.id ?? "unknown"}>`,
              `channel: <#${newMsg.channelId}>`,
              `before: ${oldMsg.content?.slice(0, 500) ?? "*unknown*"}`,
              `after: ${newMsg.content?.slice(0, 500) ?? "*unknown*"}`,
            ].join("\n"),
            color: 0xfff5b1,
          }),
        ],
      })
      .catch(() => {});
  });

  // Sticky messages
  const stickyDebounce = new Map<string, NodeJS.Timeout>();
  client.on(Events.MessageCreate, async (message: Message) => {
    if (!message.guild || message.author.bot) return;
    const g = getGuild(message.guild.id);
    const sticky = g.stickyMessages[message.channelId];
    if (!sticky) return;
    if (stickyDebounce.has(message.channelId)) {
      clearTimeout(stickyDebounce.get(message.channelId)!);
    }
    stickyDebounce.set(
      message.channelId,
      setTimeout(async () => {
        const ch = message.channel as TextChannel;
        try {
          if (sticky.lastMessageId) {
            const old = await ch.messages
              .fetch(sticky.lastMessageId)
              .catch(() => null);
            if (old) await old.delete().catch(() => {});
          }
          const sent = await ch.send({
            embeds: [
              aestheticEmbed({
                title: "📌 sticky",
                description: sticky.content,
              }),
            ],
          });
          updateGuild(message.guild!.id, (gg) => {
            if (gg.stickyMessages[message.channelId])
              gg.stickyMessages[message.channelId]!.lastMessageId = sent.id;
          });
        } catch (e) {
          console.error("sticky err", e);
        }
      }, 3000),
    );
  });

  // Reaction roles
  const handleReaction = async (
    reaction: MessageReaction | PartialMessageReaction,
    user: User | PartialUser,
    add: boolean,
  ) => {
    if (user.bot) return;
    if (reaction.partial) await reaction.fetch().catch(() => {});
    const guild = reaction.message.guild;
    if (!guild) return;
    const g = getGuild(guild.id);
    const map = g.reactionRoles[reaction.message.id];
    if (!map) return;
    const emojiKey = reaction.emoji.id ?? reaction.emoji.name ?? "";
    const roleId =
      map[emojiKey] ?? map[reaction.emoji.name ?? ""] ?? map[reaction.emoji.toString()];
    if (!roleId) return;
    try {
      const member = await guild.members.fetch(user.id);
      if (add) await member.roles.add(roleId);
      else await member.roles.remove(roleId);
    } catch (e) {
      console.error("reactionrole err", e);
    }
  };
  client.on(Events.MessageReactionAdd, (r, u) => handleReaction(r, u, true));
  client.on(Events.MessageReactionRemove, (r, u) => handleReaction(r, u, false));

  void ({} as ChannelType);
}
