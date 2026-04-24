// Prefix `!` command system. A pragmatic dispatcher for the most-used
// commands so members can type `!hug @user` etc. without slash commands.

import {
  type Client,
  type Message,
  type TextChannel,
  type GuildMember,
  PermissionFlagsBits,
  ChannelType,
} from "discord.js";
import { aestheticEmbed, errorEmbed, successEmbed } from "./embed.js";
import { askJimmy, clearJimmyMemory } from "./jimmy.js";
import { getActionGif } from "./gifs.js";
import { addCase, updateGuild } from "./storage.js";
import { config } from "./config.js";

export const PREFIX = "!";

const r = (n: number) => Math.floor(Math.random() * n);
const pick = <T>(a: T[]) => a[r(a.length)]!;

type Ctx = {
  msg: Message;
  args: string[];
  raw: string; // args joined
  client: Client;
};

type Handler = (c: Ctx) => Promise<unknown> | unknown;

const handlers: Record<string, Handler> = {};
const aliases: Record<string, string> = {};

function cmd(name: string, fn: Handler, alias: string[] = []) {
  handlers[name] = fn;
  for (const a of alias) aliases[a] = name;
}

function userFromMention(msg: Message, token?: string): GuildMember | null {
  if (!token || !msg.guild) return null;
  const m = token.match(/^<@!?(\d+)>$/) ?? token.match(/^(\d{17,20})$/);
  if (!m) return null;
  return msg.guild.members.cache.get(m[1]!) ?? null;
}

function aestheticReply(msg: Message, opts: Parameters<typeof aestheticEmbed>[0]) {
  return msg.reply({ embeds: [aestheticEmbed(opts)], allowedMentions: { repliedUser: false } });
}

// ─── action commands (with GIFs) ───────────────────────────────────────
const VERBS: Record<string, string> = {
  hug: "hugs", kiss: "kisses", pat: "pats", cuddle: "cuddles", slap: "slaps",
  poke: "pokes", bonk: "bonks", highfive: "high-fives", wave: "waves at",
  blush: "blushes at", bite: "bites", lick: "licks", tickle: "tickles",
  punch: "punches", kick: "kicks", handhold: "holds hands with", glomp: "glomps",
};
for (const [verb, action] of Object.entries(VERBS)) {
  cmd(verb, async ({ msg, args }) => {
    const target = userFromMention(msg, args[0]);
    if (!target) return msg.reply({ embeds: [errorEmbed(`mention someone: \`!${verb} @user\``)] });
    const gif = await getActionGif(verb).catch(() => "");
    if (!("send" in msg.channel)) return;
    return msg.channel.send({
      embeds: [
        aestheticEmbed({
          description: `<@${msg.author.id}> ${action} <@${target.id}> ✿`,
          image: gif || undefined,
        }),
      ],
    });
  });
}
const SOLO: Record<string, string> = {
  dance: "dances ♡", cry: "is crying ࿔", laugh: "laughs out loud ✿",
  smile: "smiles softly ୨୧", smug: "looks smug ✦", happy: "is happy ♡",
  wink: "winks ;)", nom: "noms ♡", yeet: "yeets themself ✦",
};
for (const [verb, action] of Object.entries(SOLO)) {
  cmd(verb, async ({ msg }) => {
    const gif = await getActionGif(verb).catch(() => "");
    if (!("send" in msg.channel)) return;
    return msg.channel.send({
      embeds: [aestheticEmbed({ description: `<@${msg.author.id}> ${action}`, image: gif || undefined })],
    });
  });
}

// ─── chat with jimmy ───────────────────────────────────────────────────
cmd("ask", async ({ msg, raw }) => {
  if (!raw) return msg.reply({ embeds: [errorEmbed("ask jimmy something! `!ask why is the sky blue?`")] });
  if ("sendTyping" in msg.channel) await msg.channel.sendTyping().catch(() => {});
  const reply = await askJimmy(msg.author.id, msg.member?.displayName ?? msg.author.username, raw);
  return msg.reply({
    embeds: [aestheticEmbed({ description: reply, footer: "✿ jimmy · ai host of latent show s2" })],
    allowedMentions: { repliedUser: false },
  });
}, ["jimmy", "ai", "chat"]);

cmd("forgetme", async ({ msg }) => {
  clearJimmyMemory(msg.author.id);
  return msg.reply({ embeds: [successEmbed("jimmy forgot your conversation ♡")] });
}, ["resetjimmy"]);

// ─── fun + utility ─────────────────────────────────────────────────────
cmd("ping", async ({ msg, client }) => {
  return aestheticReply(msg, { title: "♡ pong", description: `**${client.ws.ping}ms** ✿` });
});

cmd("coinflip", ({ msg }) =>
  aestheticReply(msg, { title: "🪙 coin", description: `**${pick(["heads", "tails"])}**` }),
  ["flip", "cf"],
);

cmd("dice", ({ msg, args }) => {
  const sides = Math.min(1000, Math.max(2, parseInt(args[0] ?? "6", 10) || 6));
  return aestheticReply(msg, { title: "🎲 dice", description: `you rolled **${1 + r(sides)}** (d${sides})` });
}, ["roll", "d"]);

cmd("8ball", ({ msg, raw }) => {
  if (!raw) return msg.reply({ embeds: [errorEmbed("ask a question: `!8ball will i win?`")] });
  const a = ["yes ✿", "no ✗", "definitely ♡", "absolutely not", "maybe...", "ask again later", "without a doubt", "very doubtful", "outlook good", "signs point to yes", "concentrate and ask again", "my sources say no"];
  return aestheticReply(msg, { title: "🎱 8-ball", description: `**q:** ${raw}\n**a:** ${pick(a)}` });
});

cmd("choose", ({ msg, raw }) => {
  const opts = raw.split(",").map((s) => s.trim()).filter(Boolean);
  if (opts.length < 2) return msg.reply({ embeds: [errorEmbed("give 2+ options: `!choose pizza, sushi, ramen`")] });
  return aestheticReply(msg, { title: "✿ i choose", description: `**${pick(opts)}**` });
}, ["pick"]);

cmd("rps", ({ msg, args }) => {
  const me = (args[0] ?? "").toLowerCase();
  if (!["rock", "paper", "scissors"].includes(me))
    return msg.reply({ embeds: [errorEmbed("usage: `!rps rock|paper|scissors`")] });
  const bot = pick(["rock", "paper", "scissors"]);
  const win = (me === "rock" && bot === "scissors") || (me === "paper" && bot === "rock") || (me === "scissors" && bot === "paper");
  const tie = me === bot;
  return aestheticReply(msg, { title: "✿ rps", description: `you: **${me}**\nme: **${bot}**\n→ ${tie ? "tie!" : win ? "you win ♡" : "i win ✦"}` });
});

cmd("ship", ({ msg }) => {
  const mentions = [...msg.mentions.users.values()];
  const a = mentions[0] ?? msg.author;
  const b = mentions[1] ?? msg.author;
  const score = (parseInt((a.id + b.id).slice(-6), 10) % 100) + 1;
  const name = a.username.slice(0, Math.ceil(a.username.length / 2)) + b.username.slice(Math.floor(b.username.length / 2));
  return aestheticReply(msg, { title: `♡ ${name}`, description: `**${a.username}** + **${b.username}** = ${score}% ✦` });
});

cmd("rate", ({ msg, raw }) => {
  if (!raw) return msg.reply({ embeds: [errorEmbed("usage: `!rate <thing>`")] });
  return aestheticReply(msg, { description: `**${raw}** is a **${(Math.random() * 11).toFixed(1)}/10** ✿` });
});

cmd("howcute", ({ msg }) => {
  const u = msg.mentions.users.first() ?? msg.author;
  const score = (parseInt(u.id.slice(-6), 10) + 7) % 101;
  return aestheticReply(msg, { description: `<@${u.id}> is **${score}%** cute ✿` });
});
cmd("howsmart", ({ msg }) => {
  const u = msg.mentions.users.first() ?? msg.author;
  const score = (parseInt(u.id.slice(-6), 10) + 11) % 101;
  return aestheticReply(msg, { description: `<@${u.id}> is **${score}%** smart ✦` });
});
cmd("howrich", ({ msg }) => {
  const u = msg.mentions.users.first() ?? msg.author;
  const score = (parseInt(u.id.slice(-6), 10) + 17) % 101;
  return aestheticReply(msg, { description: `<@${u.id}> is **${score}%** rich 💎` });
});

cmd("compliment", ({ msg }) => {
  const u = msg.mentions.users.first() ?? msg.author;
  const cs = ["you're a whole vibe ✿", "your aura is unmatched ♡", "you light up every room ✦", "the world is better with you in it ୨୧", "you are absolutely radiant ✧"];
  return aestheticReply(msg, { description: `<@${u.id}> — ${pick(cs)}` });
});

cmd("quote", ({ msg }) => {
  const qs = ["and still, i rise. — maya angelou", "stars can't shine without darkness ✦", "you are made of stardust ⋆˚࿔", "be soft. do not let the world make you hard ♡", "she remembered who she was, and the game changed.", "the universe is on your side ✿"];
  return aestheticReply(msg, { title: "♡ quote", description: pick(qs) });
});

cmd("fact", ({ msg }) => {
  const f = ["octopuses have three hearts ✿", "honey never spoils ♡", "a group of flamingos is called a flamboyance ✦", "bananas are berries, but strawberries aren't ୨୧", "sea otters hold hands while sleeping ♡", "cows have best friends ୨୧"];
  return aestheticReply(msg, { title: "✿ fact", description: pick(f) });
});

cmd("joke", ({ msg }) => {
  const j = ["why don't skeletons fight? they don't have the guts.", "i'm reading a book about anti-gravity. impossible to put down.", "why did the scarecrow win an award? he was outstanding in his field.", "what do you call cheese that isn't yours? nacho cheese."];
  return aestheticReply(msg, { title: "😆", description: pick(j) });
});

cmd("avatar", ({ msg }) => {
  const u = msg.mentions.users.first() ?? msg.author;
  return msg.reply({
    embeds: [aestheticEmbed({ title: `✿ ${u.username}`, image: u.displayAvatarURL({ size: 1024 }) })],
    allowedMentions: { repliedUser: false },
  });
}, ["av", "pfp"]);

cmd("banner", async ({ msg }) => {
  const u = msg.mentions.users.first() ?? msg.author;
  const fetched = await msg.client.users.fetch(u.id, { force: true });
  const url = fetched.bannerURL({ size: 1024 });
  if (!url) return msg.reply({ embeds: [errorEmbed("no banner ✿")] });
  return msg.reply({ embeds: [aestheticEmbed({ title: `✿ ${u.username}`, image: url })], allowedMentions: { repliedUser: false } });
});

cmd("userinfo", ({ msg }) => {
  const u = msg.mentions.users.first() ?? msg.author;
  const m = msg.guild?.members.cache.get(u.id);
  return msg.reply({
    embeds: [
      aestheticEmbed({
        title: `✿ ${u.username}`,
        thumbnail: u.displayAvatarURL({ size: 256 }),
        fields: [
          { name: "id", value: u.id, inline: true },
          { name: "joined", value: m ? `<t:${Math.floor((m.joinedTimestamp ?? 0) / 1000)}:R>` : "—", inline: true },
          { name: "created", value: `<t:${Math.floor(u.createdTimestamp / 1000)}:R>`, inline: true },
        ],
      }),
    ],
    allowedMentions: { repliedUser: false },
  });
}, ["whois", "ui"]);

cmd("serverinfo", ({ msg }) => {
  if (!msg.guild) return;
  return msg.reply({
    embeds: [
      aestheticEmbed({
        title: `୨୧ ${msg.guild.name}`,
        thumbnail: msg.guild.iconURL({ size: 256 }) ?? undefined,
        fields: [
          { name: "members", value: `${msg.guild.memberCount}`, inline: true },
          { name: "channels", value: `${msg.guild.channels.cache.size}`, inline: true },
          { name: "roles", value: `${msg.guild.roles.cache.size}`, inline: true },
          { name: "created", value: `<t:${Math.floor(msg.guild.createdTimestamp / 1000)}:R>`, inline: true },
        ],
      }),
    ],
    allowedMentions: { repliedUser: false },
  });
}, ["si", "guild"]);

cmd("say", ({ msg, raw }) => {
  if (!raw) return;
  if (!msg.member?.permissions.has(PermissionFlagsBits.ManageMessages))
    return msg.reply({ embeds: [errorEmbed("no perms ✗")] });
  msg.delete().catch(() => {});
  if ("send" in msg.channel) return msg.channel.send({ content: raw, allowedMentions: { parse: [] } });
});

cmd("embed", ({ msg, raw }) => {
  if (!raw) return msg.reply({ embeds: [errorEmbed("usage: `!embed your message`")] });
  if (!("send" in msg.channel)) return;
  return msg.channel.send({ embeds: [aestheticEmbed({ description: raw })] });
});

cmd("afk", ({ msg, raw }) => {
  if (!msg.guild) return;
  updateGuild(msg.guild.id, (g) => {
    g.afk[msg.author.id] = { reason: raw || "afk", at: Date.now() };
  });
  return msg.reply({ embeds: [successEmbed(`set you afk: **${raw || "afk"}** ♡`)] });
});

// ─── moderation prefix ─────────────────────────────────────────────────
async function modGuard(msg: Message, perm: bigint): Promise<boolean> {
  if (!msg.member?.permissions.has(perm)) {
    await msg.reply({ embeds: [errorEmbed("you don't have perms ✗")] });
    return false;
  }
  return true;
}

cmd("kick", async ({ msg, args, raw }) => {
  if (!await modGuard(msg, PermissionFlagsBits.KickMembers)) return;
  const target = userFromMention(msg, args[0]);
  if (!target) return msg.reply({ embeds: [errorEmbed("usage: `!kick @user [reason]`")] });
  const reason = args.slice(1).join(" ") || "no reason";
  try {
    await target.kick(reason);
    addCase(msg.guild!.id, { type: "kick", user: target.id, mod: msg.author.id, reason, at: Date.now() });
    return msg.reply({ embeds: [successEmbed(`kicked **${target.user.tag}** — ${reason}`)] });
  } catch { return msg.reply({ embeds: [errorEmbed("can't kick that user")] }); }
});

cmd("ban", async ({ msg, args }) => {
  if (!await modGuard(msg, PermissionFlagsBits.BanMembers)) return;
  const target = userFromMention(msg, args[0]);
  if (!target) return msg.reply({ embeds: [errorEmbed("usage: `!ban @user [reason]`")] });
  const reason = args.slice(1).join(" ") || "no reason";
  try {
    await target.ban({ reason });
    addCase(msg.guild!.id, { type: "ban", user: target.id, mod: msg.author.id, reason, at: Date.now() });
    return msg.reply({ embeds: [successEmbed(`banned **${target.user.tag}** — ${reason}`)] });
  } catch { return msg.reply({ embeds: [errorEmbed("can't ban that user")] }); }
});

cmd("warn", async ({ msg, args }) => {
  if (!await modGuard(msg, PermissionFlagsBits.ManageMessages)) return;
  const target = userFromMention(msg, args[0]);
  if (!target) return msg.reply({ embeds: [errorEmbed("usage: `!warn @user [reason]`")] });
  const reason = args.slice(1).join(" ") || "no reason";
  updateGuild(msg.guild!.id, (g) => {
    if (!g.warns[target.id]) g.warns[target.id] = [];
    g.warns[target.id]!.push({ reason, mod: msg.author.id, at: Date.now() });
  });
  return msg.reply({ embeds: [successEmbed(`warned **${target.user.tag}** — ${reason}`)] });
});

cmd("purge", async ({ msg, args }) => {
  if (!await modGuard(msg, PermissionFlagsBits.ManageMessages)) return;
  const n = Math.min(100, Math.max(1, parseInt(args[0] ?? "10", 10) || 10));
  if (msg.channel.type !== ChannelType.GuildText) return;
  const ch = msg.channel as TextChannel;
  await msg.delete().catch(() => {});
  const deleted = await ch.bulkDelete(n, true).catch(() => null);
  const r = await ch.send({ embeds: [successEmbed(`deleted ${deleted?.size ?? 0} messages ✿`)] });
  setTimeout(() => r.delete().catch(() => {}), 3000);
}, ["clear"]);

cmd("mute", async ({ msg, args }) => {
  if (!await modGuard(msg, PermissionFlagsBits.ModerateMembers)) return;
  const target = userFromMention(msg, args[0]);
  if (!target) return msg.reply({ embeds: [errorEmbed("usage: `!mute @user [minutes] [reason]`")] });
  const mins = parseInt(args[1] ?? "10", 10) || 10;
  const reason = args.slice(2).join(" ") || "muted";
  try {
    await target.timeout(mins * 60_000, reason);
    return msg.reply({ embeds: [successEmbed(`muted **${target.user.tag}** for ${mins}m — ${reason}`)] });
  } catch { return msg.reply({ embeds: [errorEmbed("can't mute that user")] }); }
});

cmd("unmute", async ({ msg, args }) => {
  if (!await modGuard(msg, PermissionFlagsBits.ModerateMembers)) return;
  const target = userFromMention(msg, args[0]);
  if (!target) return msg.reply({ embeds: [errorEmbed("usage: `!unmute @user`")] });
  try {
    await target.timeout(null);
    return msg.reply({ embeds: [successEmbed(`unmuted **${target.user.tag}** ♡`)] });
  } catch { return msg.reply({ embeds: [errorEmbed("can't unmute")] }); }
});

// ─── help ──────────────────────────────────────────────────────────────
cmd("help", ({ msg }) => {
  return msg.reply({
    embeds: [
      aestheticEmbed({
        title: "✿ ⋆˚࿔ latent show bot — help ⋆˚࿔ ✿",
        description: [
          `୨୧ **chat with jimmy ai** ୨୧`,
          `\`!ask <question>\` — chat with jimmy ♡`,
          `\`!forgetme\` — clear jimmy's memory of you`,
          `or just type in **#jimmy-chat** ✿`,
          ``,
          `୨୧ **fun (with gifs)** ୨୧`,
          `\`!hug !kiss !pat !cuddle !slap !poke !bonk !highfive !wave !blush !bite !lick !tickle !punch !kick !handhold !glomp\``,
          `\`!dance !cry !laugh !smile !smug !happy !wink !nom !yeet\``,
          ``,
          `୨୧ **utility** ୨୧`,
          `\`!ping !coinflip !dice !8ball !choose !rps !ship !rate\``,
          `\`!howcute !howsmart !howrich !compliment !quote !fact !joke\``,
          `\`!avatar !banner !userinfo !serverinfo !afk\``,
          ``,
          `୨୧ **mod** (perm-gated) ୨୧`,
          `\`!kick !ban !warn !mute !unmute !purge !say !embed\``,
          ``,
          `୨୧ **custom emojis** ୨୧`,
          `type \`:emojiname:\` in any message — bot reposts it as you with the emoji ✿`,
          ``,
          `୨୧ **150+ slash commands too!** ୨୧`,
          `type \`/\` in any channel to see them all — full feature set ♡`,
        ].join("\n"),
        footer: `⋆˚࿔ ${config.brand.name} ⊹  prefix: ${PREFIX}`,
      }),
    ],
    allowedMentions: { repliedUser: false },
  });
}, ["h", "commands", "cmds"]);

// ─── dispatcher ────────────────────────────────────────────────────────
export async function handlePrefix(msg: Message): Promise<boolean> {
  if (!msg.content.startsWith(PREFIX)) return false;
  const body = msg.content.slice(PREFIX.length).trimStart();
  if (!body) return false;
  const parts = body.split(/\s+/);
  const name = (parts[0] ?? "").toLowerCase();
  const resolved = handlers[name] ?? handlers[aliases[name] ?? ""];
  if (!resolved) return false;
  const args = parts.slice(1);
  const raw = body.slice(name.length).trimStart();
  try {
    await resolved({ msg, args, raw, client: msg.client });
  } catch (e) {
    console.error(`prefix !${name} err`, e);
    msg.reply({ embeds: [errorEmbed(`oops: ${(e as Error).message}`)] }).catch(() => {});
  }
  return true;
}
