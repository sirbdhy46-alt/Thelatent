import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  Events,
  ModalBuilder,
  PermissionFlagsBits,
  StringSelectMenuInteraction,
  TextInputBuilder,
  TextInputStyle,
  type ButtonInteraction,
  type Client,
  type GuildMember,
  type Message,
  type MessageReaction,
  type ModalSubmitInteraction,
  type PartialMessage,
  type PartialMessageReaction,
  type PartialUser,
  type TextChannel,
  type User,
} from "discord.js";
import { aestheticEmbed, errorEmbed, successEmbed } from "../lib/embed.js";
import { config } from "../lib/config.js";
import { allGuildIds, getGuild, updateGuild } from "../lib/storage.js";
import { snipeCache, editSnipeCache } from "../lib/snipe.js";

const recentJoins = new Map<string, number[]>(); // antiraid
const spamTracker = new Map<string, number[]>(); // userId-channelId -> timestamps

export function registerEvents(client: Client) {
  client.on(Events.GuildMemberAdd, async (member: GuildMember) => {
    const g = getGuild(member.guild.id);

    if (g.antiraid.enabled) {
      const arr = recentJoins.get(member.guild.id) ?? [];
      const now = Date.now();
      const cutoff = now - g.antiraid.window * 1000;
      const recent = arr.filter((t) => t > cutoff);
      recent.push(now);
      recentJoins.set(member.guild.id, recent);
      if (recent.length >= g.antiraid.joinThreshold) {
        try { await member.kick("anti-raid"); } catch {}
        if (g.modLogChannelId) {
          const ch = member.guild.channels.cache.get(g.modLogChannelId) as TextChannel | undefined;
          await ch?.send({ embeds: [aestheticEmbed({ title: "🚨 anti-raid", description: `kicked **${member.user.tag}** (raid pattern detected)`, color: 0xf4a4a4 })] });
        }
        return;
      }
    }

    if (g.autoRoleId) {
      try { await member.roles.add(g.autoRoleId, "Auto-role on join"); } catch (e) { console.error("autorole err", e); }
    }
    if (g.welcomeChannelId) {
      const ch = member.guild.channels.cache.get(g.welcomeChannelId) as TextChannel | undefined;
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
                `head to ${g.selfRolePanelChannelId ? `<#${g.selfRolePanelChannelId}>` : "#self-roles"} to grab your roles`,
                `apply for staff in ${g.applicationChannelId ? `<#${g.applicationChannelId}>` : "#applications"}`,
                ``,
                `୨୧ visit our website: ${config.website}`,
              ].join("\n"),
              thumbnail: member.user.displayAvatarURL({ size: 256 }),
            }),
          ],
        });
      }
    }
    updateCounter(member.guild);
  });

  client.on(Events.GuildMemberRemove, async (member) => {
    const g = getGuild(member.guild.id);
    if (g.goodbyeChannelId) {
      const ch = member.guild.channels.cache.get(g.goodbyeChannelId) as TextChannel | undefined;
      if (ch) {
        await ch.send({
          embeds: [aestheticEmbed({ description: `**${member.user?.tag ?? "someone"}** left the server ࿔*:･ﾟ`, color: 0xc8a2c8 })],
        });
      }
    }
    updateCounter(member.guild);
  });

  client.on(Events.MessageDelete, async (message) => {
    if (!message.guild || message.author?.bot) return;
    snipeCache.set(message.channelId, {
      content: message.content ?? "",
      author: message.author?.tag ?? "unknown",
      at: Date.now(),
    });
    const g = getGuild(message.guild.id);
    if (!g.modLogChannelId) return;
    const ch = message.guild.channels.cache.get(g.modLogChannelId) as TextChannel | undefined;
    if (!ch) return;
    await ch.send({
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
    }).catch(() => {});
  });

  client.on(Events.MessageUpdate, async (oldMsg, newMsg) => {
    if (!newMsg.guild || newMsg.author?.bot) return;
    if (oldMsg.content === newMsg.content) return;
    editSnipeCache.set(newMsg.channelId, {
      before: oldMsg.content ?? "",
      after: newMsg.content ?? "",
      author: newMsg.author?.tag ?? "unknown",
      at: Date.now(),
    });
    const g = getGuild(newMsg.guild.id);
    if (!g.modLogChannelId) return;
    const ch = newMsg.guild.channels.cache.get(g.modLogChannelId) as TextChannel | undefined;
    if (!ch) return;
    await ch.send({
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
    }).catch(() => {});
  });

  // Sticky messages + AFK + automod
  const stickyDebounce = new Map<string, NodeJS.Timeout>();
  client.on(Events.MessageCreate, async (message: Message) => {
    if (!message.guild || message.author.bot) return;
    const g = getGuild(message.guild.id);

    // AFK back
    if (g.afk[message.author.id]) {
      delete g.afk[message.author.id];
      updateGuild(message.guild.id, () => {});
      await message.reply({ embeds: [successEmbed(`welcome back ♡ removed your afk`)] }).catch(() => {});
    }
    // AFK mention
    for (const u of message.mentions.users.values()) {
      if (g.afk[u.id]) {
        await message.reply({
          embeds: [aestheticEmbed({ description: `<@${u.id}> is afk: **${g.afk[u.id]!.reason}** — <t:${Math.floor(g.afk[u.id]!.at / 1000)}:R>` })],
        }).catch(() => {});
      }
    }

    // Automod
    const member = message.member;
    if (member && !member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      const a = g.automod;
      const content = message.content;
      let violation: string | null = null;
      if (a.blockLinks && /(https?:\/\/|www\.)\S+/i.test(content)) violation = "links not allowed";
      else if (a.blockInvites && /(discord\.gg|discord\.com\/invite)/i.test(content)) violation = "invites not allowed";
      else if (a.blockCaps && content.length > 8) {
        const letters = content.replace(/[^a-zA-Z]/g, "");
        if (letters.length > 0) {
          const caps = letters.replace(/[^A-Z]/g, "").length;
          if ((caps / letters.length) * 100 >= a.capsThreshold) violation = "too many caps";
        }
      } else if (a.blockMentions && message.mentions.users.size >= a.mentionThreshold) violation = "too many mentions";
      else if (a.badwords.length > 0) {
        const lower = content.toLowerCase();
        if (a.badwords.some((w) => lower.includes(w))) violation = "filtered word";
      } else if (a.blockSpam) {
        const key = `${message.author.id}-${message.channelId}`;
        const arr = spamTracker.get(key) ?? [];
        const now = Date.now();
        const recent = arr.filter((t) => t > now - 5000);
        recent.push(now);
        spamTracker.set(key, recent);
        if (recent.length >= a.spamThreshold) violation = "spam";
      }
      if (violation) {
        try { await message.delete(); } catch {}
        if ("send" in message.channel) {
          const r = await message.channel.send({ embeds: [errorEmbed(`<@${message.author.id}> — ${violation}`)] });
          setTimeout(() => r.delete().catch(() => {}), 4000);
        }
        if (g.modLogChannelId) {
          const ch = message.guild.channels.cache.get(g.modLogChannelId) as TextChannel | undefined;
          await ch?.send({ embeds: [aestheticEmbed({ title: "🛡 automod", description: `**${message.author.tag}** in <#${message.channelId}> — ${violation}\n${content.slice(0, 500)}` })] });
        }
        return;
      }
    }

    // Sticky
    const sticky = g.stickyMessages[message.channelId];
    if (!sticky) return;
    if (stickyDebounce.has(message.channelId)) clearTimeout(stickyDebounce.get(message.channelId)!);
    stickyDebounce.set(message.channelId, setTimeout(async () => {
      const ch = message.channel as TextChannel;
      try {
        if (sticky.lastMessageId) {
          const old = await ch.messages.fetch(sticky.lastMessageId).catch(() => null);
          if (old) await old.delete().catch(() => {});
        }
        const sent = await ch.send({ embeds: [aestheticEmbed({ title: "📌 sticky", description: sticky.content })] });
        updateGuild(message.guild!.id, (gg) => {
          if (gg.stickyMessages[message.channelId]) gg.stickyMessages[message.channelId]!.lastMessageId = sent.id;
        });
      } catch (e) { console.error("sticky err", e); }
    }, 3000));
  });

  // Reaction roles
  const handleReaction = async (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser, add: boolean) => {
    if (user.bot) return;
    if (reaction.partial) await reaction.fetch().catch(() => {});
    const guild = reaction.message.guild;
    if (!guild) return;
    const g = getGuild(guild.id);
    const map = g.reactionRoles[reaction.message.id];
    if (!map) return;
    const emojiKey = reaction.emoji.id ?? reaction.emoji.name ?? "";
    const roleId = map[emojiKey] ?? map[reaction.emoji.name ?? ""] ?? map[reaction.emoji.toString()];
    if (!roleId) return;
    try {
      const member = await guild.members.fetch(user.id);
      if (add) await member.roles.add(roleId);
      else await member.roles.remove(roleId);
    } catch (e) { console.error("reactionrole err", e); }
  };
  client.on(Events.MessageReactionAdd, (r, u) => handleReaction(r, u, true));
  client.on(Events.MessageReactionRemove, (r, u) => handleReaction(r, u, false));

  // Buttons + selects + modals
  client.on(Events.InteractionCreate, async (interaction) => {
    try {
      if (interaction.isButton()) await handleButton(interaction);
      else if (interaction.isStringSelectMenu()) await handleSelfrole(interaction);
      else if (interaction.isModalSubmit()) await handleModal(interaction);
    } catch (e) { console.error("component err", e); }
  });

  void ChannelType;
}

async function updateCounter(guild: import("discord.js").Guild) {
  const g = getGuild(guild.id);
  if (!g.counterChannelId) return;
  try {
    const ch = await guild.channels.fetch(g.counterChannelId);
    if (ch) await ch.setName(`✿ members: ${guild.memberCount}`);
  } catch {}
}

async function handleSelfrole(interaction: StringSelectMenuInteraction) {
  if (!interaction.customId.startsWith("selfrole:")) return;
  if (!interaction.guild) return;
  await interaction.deferReply({ ephemeral: true });
  const member = await interaction.guild.members.fetch(interaction.user.id);
  // Get all roles in this menu
  const allOptions = (interaction.component.options ?? []).map((o) => o.value);
  const selected = new Set(interaction.values);
  const added: string[] = [];
  const removed: string[] = [];
  for (const rid of allOptions) {
    if (selected.has(rid) && !member.roles.cache.has(rid)) {
      try { await member.roles.add(rid); added.push(rid); } catch {}
    } else if (!selected.has(rid) && member.roles.cache.has(rid)) {
      try { await member.roles.remove(rid); removed.push(rid); } catch {}
    }
  }
  await interaction.editReply({
    embeds: [
      aestheticEmbed({
        description: [
          added.length ? `added: ${added.map((r) => `<@&${r}>`).join(" ")}` : "",
          removed.length ? `removed: ${removed.map((r) => `<@&${r}>`).join(" ")}` : "",
          !added.length && !removed.length ? "no changes ✿" : "",
        ].filter(Boolean).join("\n"),
      }),
    ],
  });
}

async function handleButton(interaction: ButtonInteraction) {
  if (!interaction.guild) return;
  const id = interaction.customId;

  if (id === "apply:staff" || id === "apply:partner") {
    const kind = id.split(":")[1]!;
    const modal = new ModalBuilder()
      .setCustomId(`appmodal:${kind}`)
      .setTitle(`${kind} application ✿`)
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder().setCustomId("age").setLabel("how old are you?").setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(50),
        ),
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder().setCustomId("timezone").setLabel("timezone & how active are you?").setStyle(TextInputStyle.Short).setRequired(true),
        ),
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder().setCustomId("experience").setLabel("relevant experience").setStyle(TextInputStyle.Paragraph).setRequired(true),
        ),
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder().setCustomId("why").setLabel(`why do you want to be ${kind}?`).setStyle(TextInputStyle.Paragraph).setRequired(true),
        ),
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder().setCustomId("extra").setLabel("anything else? (optional)").setStyle(TextInputStyle.Paragraph).setRequired(false),
        ),
      );
    await interaction.showModal(modal);
    return;
  }

  if (id.startsWith("app:accept:") || id.startsWith("app:deny:")) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ embeds: [errorEmbed("staff only")], ephemeral: true });
    }
    const [, action, userId] = id.split(":");
    const user = await interaction.client.users.fetch(userId!);
    try {
      await user.send({
        embeds: [aestheticEmbed({ title: action === "accept" ? "✿ application accepted ♡" : "application update", description: action === "accept" ? `congrats! your application in **${interaction.guild.name}** was accepted ✦` : `your application in **${interaction.guild.name}** was not accepted this time. thanks for applying ♡` })],
      });
    } catch {}
    await interaction.update({
      embeds: [
        aestheticEmbed({
          title: `application ${action}ed`,
          description: (interaction.message.embeds[0]?.description ?? "") + `\n\n**${action}ed by <@${interaction.user.id}>**`,
          color: action === "accept" ? 0xb5e8b0 : 0xf4a4a4,
        }),
      ],
      components: [],
    });
    return;
  }

  if (id === "ticket:open") {
    const g = getGuild(interaction.guild.id);
    if (!g.ticketCategoryId) return interaction.reply({ embeds: [errorEmbed("ticket system not setup")], ephemeral: true });
    const num = (g.ticketCounter ?? 0) + 1;
    const ch = await interaction.guild.channels.create({
      name: `ticket-${num.toString().padStart(4, "0")}`,
      type: ChannelType.GuildText,
      parent: g.ticketCategoryId,
      permissionOverwrites: [
        { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
      ],
    });
    updateGuild(interaction.guild.id, (gg) => (gg.ticketCounter = num));
    await ch.send({
      content: `<@${interaction.user.id}>`,
      embeds: [aestheticEmbed({ title: "🎫 ticket opened ✿", description: "staff will be with you shortly. describe your issue ♡\n\nuse `/ticket close` to close." })],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId("ticket:close").setLabel("close ticket").setStyle(ButtonStyle.Danger),
        ),
      ],
    });
    await interaction.reply({ embeds: [successEmbed(`ticket created: <#${ch.id}>`)], ephemeral: true });
    return;
  }

  if (id === "ticket:close") {
    const ch = interaction.channel as TextChannel;
    if (!ch.name.startsWith("ticket-")) return;
    await interaction.reply({ embeds: [successEmbed("closing in 5s...")] });
    setTimeout(() => ch.delete().catch(() => {}), 5000);
    return;
  }
}

async function handleModal(interaction: ModalSubmitInteraction) {
  if (!interaction.guild) return;
  if (interaction.customId.startsWith("appmodal:")) {
    const kind = interaction.customId.split(":")[1]!;
    const g = getGuild(interaction.guild.id);
    const ch = g.applicationLogChannelId
      ? (interaction.guild.channels.cache.get(g.applicationLogChannelId) as TextChannel | undefined)
      : undefined;
    if (!ch) return interaction.reply({ embeds: [errorEmbed("application log channel not found")], ephemeral: true });
    const fields = ["age", "timezone", "experience", "why", "extra"].map((f) => {
      let val = "";
      try { val = interaction.fields.getTextInputValue(f); } catch {}
      return val ? { name: f, value: val.slice(0, 1024), inline: false } : null;
    }).filter((x): x is { name: string; value: string; inline: boolean } => !!x);
    await ch.send({
      embeds: [
        aestheticEmbed({
          title: `📥 new ${kind} application`,
          description: `from <@${interaction.user.id}> (${interaction.user.tag})`,
          fields,
          thumbnail: interaction.user.displayAvatarURL({ size: 128 }),
        }),
      ],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId(`app:accept:${interaction.user.id}`).setLabel("✿ accept").setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId(`app:deny:${interaction.user.id}`).setLabel("deny").setStyle(ButtonStyle.Danger),
        ),
      ],
    });
    await interaction.reply({ embeds: [successEmbed("application submitted ♡ staff will review it soon")], ephemeral: true });
  }
}

// Periodic tasks: tempbans, reminders, giveaways
export function startPeriodicTasks(client: Client) {
  setInterval(async () => {
    const now = Date.now();
    for (const [guildId, g] of Object.entries(getAll())) {
      const guild = client.guilds.cache.get(guildId);
      if (!guild) continue;
      // tempbans
      const expiredBans = g.tempbans.filter((b) => b.expires <= now);
      for (const b of expiredBans) {
        try { await guild.members.unban(b.user, "tempban expired"); } catch {}
      }
      if (expiredBans.length) updateGuild(guildId, (gg) => (gg.tempbans = gg.tempbans.filter((x) => x.expires > now)));
      // reminders
      const expiredR = g.reminders.filter((r) => r.at <= now);
      for (const r of expiredR) {
        try {
          const ch = (await guild.channels.fetch(r.channel)) as TextChannel;
          await ch.send({ content: `<@${r.user}>`, embeds: [aestheticEmbed({ title: "⏰ reminder", description: r.text })] });
        } catch {}
      }
      if (expiredR.length) updateGuild(guildId, (gg) => (gg.reminders = gg.reminders.filter((x) => x.at > now)));
      // giveaways
      const expiredG = g.giveaways.filter((x) => !x.ended && x.endsAt <= now);
      for (const gv of expiredG) {
        try {
          const ch = (await guild.channels.fetch(gv.channel)) as TextChannel;
          const m = await ch.messages.fetch(gv.message);
          const reaction = m.reactions.cache.get("🎉");
          if (!reaction) continue;
          const users = await reaction.users.fetch();
          const entries = users.filter((u) => !u.bot);
          if (entries.size === 0) {
            await ch.send({ embeds: [aestheticEmbed({ description: `no entries for **${gv.prize}** ✿` })] });
          } else {
            const winners = [...entries.values()].sort(() => Math.random() - 0.5).slice(0, gv.winners);
            await ch.send({
              embeds: [aestheticEmbed({ title: `🎉 winner${winners.length > 1 ? "s" : ""}!`, description: `**${gv.prize}** → ${winners.map((w) => `<@${w.id}>`).join(", ")}` })],
            });
          }
          updateGuild(guildId, (gg) => { const x = gg.giveaways.find((y) => y.message === gv.message); if (x) x.ended = true; });
        } catch {}
      }
    }
  }, 30_000);
}

function getAll() {
  const out: Record<string, ReturnType<typeof getGuild>> = {};
  for (const id of allGuildIds()) out[id] = getGuild(id);
  return out;
}

