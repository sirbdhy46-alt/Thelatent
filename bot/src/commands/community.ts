import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type TextChannel,
} from "discord.js";
import type { SlashCommand } from "../lib/command.js";
import { aestheticEmbed, errorEmbed, successEmbed } from "../lib/embed.js";
import { getGuild, updateGuild } from "../lib/storage.js";
import { parseDuration } from "../lib/parse.js";

export const suggestCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("suggest")
    .setDescription("Submit a suggestion ✿")
    .addStringOption((o) => o.setName("idea").setDescription("Your idea").setRequired(true)) as SlashCommandBuilder,
  async execute(i) {
    if (!i.guild) return;
    const g = getGuild(i.guild.id);
    if (!g.suggestionChannelId) return i.reply({ embeds: [errorEmbed("suggestion channel not set. ask staff to /config")], ephemeral: true });
    const ch = i.guild.channels.cache.get(g.suggestionChannelId) as TextChannel | undefined;
    if (!ch) return i.reply({ embeds: [errorEmbed("suggestion channel missing")], ephemeral: true });
    const idea = i.options.getString("idea", true);
    const msg = await ch.send({
      embeds: [
        aestheticEmbed({
          title: "💡 new suggestion",
          description: idea,
          footer: `from ${i.user.tag}`,
        }),
      ],
    });
    await msg.react("👍");
    await msg.react("👎");
    await i.reply({ embeds: [successEmbed("suggestion submitted ✿")], ephemeral: true });
  },
};

export const ticketCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Ticket controls")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand((s) => s.setName("close").setDescription("Close this ticket"))
    .addSubcommand((s) =>
      s.setName("add").setDescription("Add a user to this ticket")
        .addUserOption((o) => o.setName("user").setDescription("User").setRequired(true)),
    )
    .addSubcommand((s) =>
      s.setName("remove").setDescription("Remove a user from this ticket")
        .addUserOption((o) => o.setName("user").setDescription("User").setRequired(true)),
    )
    .addSubcommand((s) =>
      s.setName("panel").setDescription("Re-post the ticket panel here"),
    ),
  async execute(i) {
    if (!i.guild || !i.channel) return;
    const sub = i.options.getSubcommand();
    if (sub === "panel") {
      const ch = i.channel as TextChannel;
      await ch.send({
        embeds: [aestheticEmbed({ title: "🎫 support tickets ✿", description: "click below to open a ticket" })],
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId("ticket:open").setLabel("✿ open a ticket").setStyle(ButtonStyle.Primary),
          ),
        ],
      });
      return i.reply({ embeds: [successEmbed("panel posted")], ephemeral: true });
    }
    const ch = i.channel as TextChannel;
    if (!ch.name.startsWith("ticket-")) return i.reply({ embeds: [errorEmbed("not a ticket channel")], ephemeral: true });
    if (sub === "close") {
      await i.reply({ embeds: [successEmbed("closing in 5s...")] });
      setTimeout(() => ch.delete().catch(() => {}), 5000);
      return;
    }
    const u = i.options.getUser("user", true);
    if (sub === "add") {
      await ch.permissionOverwrites.edit(u.id, { ViewChannel: true, SendMessages: true });
      return i.reply({ embeds: [successEmbed(`added <@${u.id}>`)] });
    }
    if (sub === "remove") {
      await ch.permissionOverwrites.edit(u.id, { ViewChannel: false });
      return i.reply({ embeds: [successEmbed(`removed <@${u.id}>`)] });
    }
  },
};

export const giveawayCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("giveaway")
    .setDescription("Run a giveaway 🎁")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand((s) =>
      s.setName("start").setDescription("Start a giveaway")
        .addStringOption((o) => o.setName("prize").setDescription("Prize").setRequired(true))
        .addStringOption((o) => o.setName("duration").setDescription("e.g. 1h, 1d").setRequired(true))
        .addIntegerOption((o) => o.setName("winners").setDescription("Winner count").setMinValue(1).setMaxValue(20)),
    )
    .addSubcommand((s) =>
      s.setName("end").setDescription("End a giveaway early")
        .addStringOption((o) => o.setName("message_id").setDescription("Message ID").setRequired(true)),
    )
    .addSubcommand((s) =>
      s.setName("reroll").setDescription("Reroll a giveaway")
        .addStringOption((o) => o.setName("message_id").setDescription("Message ID").setRequired(true)),
    )
    .addSubcommand((s) => s.setName("list").setDescription("List active giveaways")),
  async execute(i) {
    if (!i.guild || !i.channel) return;
    const sub = i.options.getSubcommand();
    if (sub === "start") {
      const prize = i.options.getString("prize", true);
      const dur = i.options.getString("duration", true);
      const winners = i.options.getInteger("winners") ?? 1;
      const ms = parseDuration(dur);
      if (!ms) return i.reply({ embeds: [errorEmbed("invalid duration")], ephemeral: true });
      const ch = i.channel as TextChannel;
      const ends = Date.now() + ms;
      const msg = await ch.send({
        embeds: [
          aestheticEmbed({
            title: `🎁 ${prize}`,
            description: [
              `react with 🎉 to enter!`,
              ``,
              `winners: **${winners}**`,
              `ends: <t:${Math.floor(ends / 1000)}:R>`,
              `host: <@${i.user.id}>`,
            ].join("\n"),
          }),
        ],
      });
      await msg.react("🎉");
      updateGuild(i.guild.id, (g) =>
        g.giveaways.push({ id: msg.id, channel: ch.id, message: msg.id, prize, winners, endsAt: ends, host: i.user.id }),
      );
      return i.reply({ embeds: [successEmbed(`giveaway started ✿`)], ephemeral: true });
    }
    if (sub === "list") {
      const gs = getGuild(i.guild.id).giveaways.filter((g) => !g.ended);
      return i.reply({
        embeds: [aestheticEmbed({ title: "active giveaways", description: gs.map((g) => `**${g.prize}** in <#${g.channel}> — ends <t:${Math.floor(g.endsAt / 1000)}:R>`).join("\n") || "none" })],
        ephemeral: true,
      });
    }
    if (sub === "end" || sub === "reroll") {
      const id = i.options.getString("message_id", true);
      const g = getGuild(i.guild.id).giveaways.find((x) => x.message === id);
      if (!g) return i.reply({ embeds: [errorEmbed("giveaway not found")], ephemeral: true });
      const ch = (await i.guild.channels.fetch(g.channel)) as TextChannel;
      const m = await ch.messages.fetch(g.message);
      const reaction = m.reactions.cache.get("🎉");
      if (!reaction) return i.reply({ embeds: [errorEmbed("no entries")], ephemeral: true });
      const users = await reaction.users.fetch();
      const entries = users.filter((u) => !u.bot);
      if (entries.size === 0) return i.reply({ embeds: [errorEmbed("no entries")], ephemeral: true });
      const winners = [...entries.values()].sort(() => Math.random() - 0.5).slice(0, g.winners);
      await ch.send({
        embeds: [aestheticEmbed({ title: `🎉 winner${winners.length > 1 ? "s" : ""}!`, description: `**${g.prize}** → ${winners.map((w) => `<@${w.id}>`).join(", ")}` })],
      });
      if (sub === "end") updateGuild(i.guild.id, (gg) => { const x = gg.giveaways.find((y) => y.message === id); if (x) x.ended = true; });
      return i.reply({ embeds: [successEmbed("done ✿")], ephemeral: true });
    }
  },
};

export const pollCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("poll")
    .setDescription("Create a poll 📊")
    .addStringOption((o) => o.setName("question").setDescription("Question").setRequired(true))
    .addStringOption((o) => o.setName("options").setDescription("Options separated by |").setRequired(true)) as SlashCommandBuilder,
  async execute(i) {
    if (!i.channel) return;
    const q = i.options.getString("question", true);
    const opts = i.options.getString("options", true).split("|").map((s) => s.trim()).slice(0, 10);
    if (opts.length < 2) return i.reply({ embeds: [errorEmbed("need at least 2 options separated by |")], ephemeral: true });
    const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
    const msg = await (i.channel as TextChannel).send({
      embeds: [
        aestheticEmbed({
          title: `📊 ${q}`,
          description: opts.map((o, idx) => `${emojis[idx]} ${o}`).join("\n"),
          footer: `poll by ${i.user.tag}`,
        }),
      ],
    });
    for (let idx = 0; idx < opts.length; idx++) await msg.react(emojis[idx]!);
    await i.reply({ embeds: [successEmbed("poll created ✿")], ephemeral: true });
  },
};

export const remindCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("remind")
    .setDescription("Set a reminder ⏰")
    .addSubcommand((s) =>
      s.setName("set").setDescription("Set a reminder")
        .addStringOption((o) => o.setName("when").setDescription("e.g. 1h, 1d").setRequired(true))
        .addStringOption((o) => o.setName("text").setDescription("What to remind").setRequired(true)),
    )
    .addSubcommand((s) => s.setName("list").setDescription("List your reminders"))
    .addSubcommand((s) => s.setName("clear").setDescription("Clear your reminders")),
  async execute(i) {
    if (!i.guild || !i.channel) return;
    const sub = i.options.getSubcommand();
    if (sub === "set") {
      const ms = parseDuration(i.options.getString("when", true));
      if (!ms) return i.reply({ embeds: [errorEmbed("invalid duration")], ephemeral: true });
      const text = i.options.getString("text", true);
      updateGuild(i.guild.id, (g) =>
        g.reminders.push({ user: i.user.id, channel: i.channel!.id, text, at: Date.now() + ms }),
      );
      return i.reply({ embeds: [successEmbed(`i'll remind you <t:${Math.floor((Date.now() + ms) / 1000)}:R>`)], ephemeral: true });
    }
    if (sub === "list") {
      const r = getGuild(i.guild.id).reminders.filter((x) => x.user === i.user.id);
      return i.reply({
        embeds: [aestheticEmbed({ title: "your reminders", description: r.map((x) => `<t:${Math.floor(x.at / 1000)}:R> — ${x.text}`).join("\n") || "none" })],
        ephemeral: true,
      });
    }
    if (sub === "clear") {
      updateGuild(i.guild.id, (g) => (g.reminders = g.reminders.filter((x) => x.user !== i.user.id)));
      return i.reply({ embeds: [successEmbed("reminders cleared")], ephemeral: true });
    }
  },
};

export const colorCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("color")
    .setDescription("Custom color role just for you ✿")
    .addSubcommand((s) =>
      s.setName("set").setDescription("Set your custom color")
        .addStringOption((o) => o.setName("hex").setDescription("e.g. #ffb3c6").setRequired(true)),
    )
    .addSubcommand((s) => s.setName("remove").setDescription("Remove your custom color")),
  async execute(i) {
    if (!i.guild) return;
    const sub = i.options.getSubcommand();
    const g = getGuild(i.guild.id);
    const member = await i.guild.members.fetch(i.user.id);
    if (sub === "remove") {
      const rid = g.customColorRoles[i.user.id];
      if (rid) {
        try { const r = await i.guild.roles.fetch(rid); if (r) await r.delete(); } catch {}
        updateGuild(i.guild.id, (gg) => delete gg.customColorRoles[i.user.id]);
      }
      return i.reply({ embeds: [successEmbed("color removed")], ephemeral: true });
    }
    const hex = i.options.getString("hex", true).replace("#", "");
    const color = parseInt(hex, 16);
    if (isNaN(color)) return i.reply({ embeds: [errorEmbed("invalid hex")], ephemeral: true });
    let rid = g.customColorRoles[i.user.id];
    let role = rid ? await i.guild.roles.fetch(rid).catch(() => null) : null;
    if (!role) {
      role = await i.guild.roles.create({ name: `♡ ${i.user.username}`, color, reason: "custom color" });
      updateGuild(i.guild.id, (gg) => (gg.customColorRoles[i.user.id] = role!.id));
    } else {
      await role.setColor(color);
    }
    if (!member.roles.cache.has(role.id)) await member.roles.add(role.id);
    await i.reply({ embeds: [successEmbed(`color set to **#${hex}** ✿`)], ephemeral: true });
  },
};

export const commands = [suggestCmd, ticketCmd, giveawayCmd, pollCmd, remindCmd, colorCmd];
