// Custom emoji replacer ("nitro-style").
// When a non-bot user types `:name:` in a message, we look across
// every guild the bot is in for a matching custom emoji, then re-post
// their message via a webhook so it appears as them — but with the
// custom emoji rendered.

import {
  type Client,
  type Message,
  type Webhook,
  ChannelType,
  PermissionFlagsBits,
} from "discord.js";

const EMOJI_RE = /(?<!<a?):([a-zA-Z0-9_]{2,32}):(?!\d+>)/g;

export function findEmoji(client: Client, name: string) {
  const lower = name.toLowerCase();
  for (const guild of client.guilds.cache.values()) {
    const e = guild.emojis.cache.find((x) => x.name?.toLowerCase() === lower);
    if (e && e.available) return e;
  }
  return null;
}

const webhookCache = new Map<string, Webhook>();

async function getWebhook(message: Message): Promise<Webhook | null> {
  if (!message.guild) return null;
  const channel = message.channel;
  if (channel.type !== ChannelType.GuildText) return null;
  const me = await message.guild.members.fetchMe();
  if (!channel.permissionsFor(me).has(PermissionFlagsBits.ManageWebhooks)) return null;

  const cached = webhookCache.get(channel.id);
  if (cached) return cached;

  const hooks = await channel.fetchWebhooks().catch(() => null);
  let hook = hooks?.find((h) => h.name === "✿ latent emoji" && h.owner?.id === message.client.user.id) ?? null;
  if (!hook) {
    hook = await channel
      .createWebhook({ name: "✿ latent emoji", reason: "custom emoji replacer" })
      .catch(() => null);
  }
  if (hook) webhookCache.set(channel.id, hook);
  return hook;
}

export async function tryReplaceEmojis(message: Message): Promise<boolean> {
  if (message.author.bot || !message.guild || !message.content) return false;
  if (message.webhookId) return false;
  // Skip command-looking messages (prefix `!` etc.)
  if (message.content.startsWith("!")) return false;
  // Need at least one matching :name: that resolves
  const matches = [...message.content.matchAll(EMOJI_RE)];
  if (matches.length === 0) return false;

  let replaced = message.content;
  let didReplace = false;
  for (const m of matches) {
    const name = m[1]!;
    const emoji = findEmoji(message.client, name);
    if (!emoji) continue;
    const tag = emoji.animated ? `<a:${emoji.name}:${emoji.id}>` : `<:${emoji.name}:${emoji.id}>`;
    replaced = replaced.split(`:${name}:`).join(tag);
    didReplace = true;
  }
  if (!didReplace) return false;

  const hook = await getWebhook(message);
  if (!hook) return false;

  const member = message.member;
  const username = member?.displayName ?? message.author.username;
  const avatarURL = member?.displayAvatarURL({ size: 256 }) ?? message.author.displayAvatarURL({ size: 256 });

  try {
    await hook.send({
      content: replaced.slice(0, 2000),
      username,
      avatarURL,
      allowedMentions: { parse: ["users"] },
    });
    await message.delete().catch(() => {});
    return true;
  } catch (e) {
    console.error("emoji replace err", e);
    return false;
  }
}
