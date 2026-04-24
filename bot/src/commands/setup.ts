import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  type CategoryChannel,
  type TextChannel,
} from "discord.js";
import type { SlashCommand } from "../lib/command.js";
import { aestheticEmbed, errorEmbed } from "../lib/embed.js";
import { updateGuild } from "../lib/storage.js";
import { config } from "../lib/config.js";

const CATEGORIES: {
  name: string;
  text: string[];
  voice: string[];
}[] = [
  {
    name: "⋆｡˚ ☁︎ ︵ welcome ︵ ☁︎ ˚｡⋆",
    text: [
      "⋆˚࿔・welcome",
      "・♡・rules",
      "✦・announcements",
      "🎀・updates",
      "🌟・featured-contestants",
      "✿・self-roles",
      "🎤・contestant-applications",
      "📋・staff-applications",
      "💌・suggestions",
      "🎫・support",
    ],
    voice: [],
  },
  {
    name: "˚ ༘ ೀ⋆｡˚ ・ chat ・ ˚｡⋆ ೀ ༘ ˚",
    text: [
      "💌・general",
      "🌸・chat-2",
      "𓂃 ࣪˖・media",
      "✧・selfies",
      "ᡣ𐭩・pets",
      "🍓・vent",
      "🎨・art",
      "🌙・dreams",
      "📚・books",
      "🎵・music",
      "🍰・food",
      "🌈・positivity",
      "🎮・gaming-chat",
      "🎬・movies-tv",
      "🤖・bot-spam",
      "🏷・counting",
      "💭・confessions",
    ],
    voice: [],
  },
  {
    name: "✦ ˚ · . voice channels . · ˚ ✦",
    text: ["🎀・vc-chat", "🎤・vc-music"],
    voice: [
      "˗ˏˋ ♡ general ♡ ˎˊ˗",
      "⋆ ˚｡⋆୨୧˚ chill ˚୨୧⋆｡˚ ⋆",
      "🎧・lofi lounge",
      "🌙・late night",
      "✦・hangout",
      "🎮・gaming 1",
      "🎮・gaming 2",
      "🎬・movie night",
      "🍵・study room",
      "📚・library (silent)",
      "🎀・girls only",
      "👥・duo",
      "👥・trio",
      "🎤・karaoke",
      "🎵・music room",
      "🌸・private 1",
      "🌸・private 2",
      "🌸・private 3",
      "afk ‧₊˚",
    ],
  },
  {
    name: "₊˚ʚ ᗢ・ staff・ᗢ ɞ˚₊",
    text: [
      "🛡・mod-chat",
      "📋・mod-logs",
      "📊・staff-logs",
      "📥・application-logs",
      "💡・staff-suggestions",
      "📝・mod-commands",
      "🎫・ticket-logs",
    ],
    voice: ["staff vc 🎀", "mod meeting 🛡"],
  },
];

const ROLES: {
  name: string;
  color: number;
  hoist?: boolean;
  permissions?: bigint[];
}[] = [
  { name: "✿ owner", color: 0xff9ec7, hoist: true, permissions: [PermissionFlagsBits.Administrator] },
  { name: "♡ co-owner", color: 0xffb3c6, hoist: true, permissions: [PermissionFlagsBits.Administrator] },
  { name: "♡ admin", color: 0xc8a2c8, hoist: true, permissions: [PermissionFlagsBits.Administrator] },
  {
    name: "✦ head mod",
    color: 0x9bb5ff,
    hoist: true,
    permissions: [
      PermissionFlagsBits.KickMembers,
      PermissionFlagsBits.BanMembers,
      PermissionFlagsBits.ManageMessages,
      PermissionFlagsBits.ModerateMembers,
      PermissionFlagsBits.MuteMembers,
      PermissionFlagsBits.MoveMembers,
      PermissionFlagsBits.ManageChannels,
      PermissionFlagsBits.ManageRoles,
    ],
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
  { name: "✧ trial mod", color: 0xa0d8f1, hoist: true, permissions: [PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ModerateMembers] },
  { name: "˚ʚ ᗢ helper ᗢ ɞ˚", color: 0xc1f0c1, hoist: true },
  { name: "★ partner", color: 0xffc6ff, hoist: true },
  { name: "★ booster", color: 0xff73fa, hoist: true },
  { name: "♡ vip", color: 0xffd700, hoist: true },
  { name: "✿ active", color: 0xffb6c1, hoist: true },
  { name: "✿ verified", color: 0xb5e8b0, hoist: true },

  { name: "─── ⋆ gender ⋆ ───", color: 0x99aab5 },
  { name: "♀ female", color: 0xffb3c6 },
  { name: "♂ male", color: 0xa0d8f1 },
  { name: "⚥ non-binary", color: 0xfff5b1 },
  { name: "⚧ transgender", color: 0xfddde6 },
  { name: "⚣ genderfluid", color: 0xc8a2c8 },
  { name: "⚪ agender", color: 0xd3d3d3 },
  { name: "❔ other gender", color: 0xc6a4d3 },
  { name: "🤐 prefer not to say", color: 0xb0b0b0 },

  { name: "─── ⋆ pronouns ⋆ ───", color: 0x99aab5 },
  { name: "she/her", color: 0xfddde6 },
  { name: "he/him", color: 0xc6e2ff },
  { name: "they/them", color: 0xd8bfd8 },
  { name: "she/they", color: 0xfddde6 },
  { name: "he/they", color: 0xc6e2ff },
  { name: "any/all", color: 0xfffacd },
  { name: "ask my pronouns", color: 0xe0e0e0 },

  { name: "─── ⋆ age ⋆ ───", color: 0x99aab5 },
  { name: "🍼 13-15", color: 0xffe0b2 },
  { name: "🌙 16-17", color: 0xffd1a4 },
  { name: "✿ 18+", color: 0xffb3c6 },
  { name: "♡ 21+", color: 0xc8a2c8 },
  { name: "★ 25+", color: 0xb5b9ff },

  { name: "─── ⋆ orientation ⋆ ───", color: 0x99aab5 },
  { name: "🌈 lgbtq+", color: 0xff9ec7 },
  { name: "💜 bisexual", color: 0xc8a2c8 },
  { name: "💛 pansexual", color: 0xfff5b1 },
  { name: "🤍 asexual", color: 0xe0e0e0 },
  { name: "💖 lesbian", color: 0xffb3c6 },
  { name: "💙 gay", color: 0xa0d8f1 },
  { name: "💚 queer", color: 0xb5e8b0 },
  { name: "♡ straight", color: 0xfddde6 },

  { name: "─── ⋆ region ⋆ ───", color: 0x99aab5 },
  { name: "🌎 north america", color: 0xb5e8b0 },
  { name: "🌍 europe", color: 0xa0d8f1 },
  { name: "🌏 asia", color: 0xfddde6 },
  { name: "🌎 south america", color: 0xfff5b1 },
  { name: "🌍 africa", color: 0xffd1a4 },
  { name: "🌏 oceania", color: 0xc8a2c8 },

  { name: "─── ⋆ colors ⋆ ───", color: 0x99aab5 },
  { name: "౨ৎ pink", color: 0xffb3c6 },
  { name: "₊˚ʚ purple", color: 0xc8a2c8 },
  { name: "✦ blue", color: 0xa0d8f1 },
  { name: "✿ green", color: 0xb5e8b0 },
  { name: "♡ yellow", color: 0xfff5b1 },
  { name: "★ red", color: 0xff9999 },
  { name: "✧ peach", color: 0xffd1a4 },
  { name: "❀ lavender", color: 0xd1c4e9 },
  { name: "₊˚ white", color: 0xfafafa },
  { name: "ᡣ𐭩 black", color: 0x2c2f33 },

  { name: "─── ⋆ interests ⋆ ───", color: 0x99aab5 },
  { name: "🎮 gamer", color: 0xb3e5fc },
  { name: "🎨 artist", color: 0xffd1a4 },
  { name: "📚 reader", color: 0xb5e8b0 },
  { name: "🎵 music lover", color: 0xc8a2c8 },
  { name: "🎬 movie buff", color: 0xfddde6 },
  { name: "🍰 foodie", color: 0xfff5b1 },
  { name: "📷 photographer", color: 0xa0d8f1 },
  { name: "✍ writer", color: 0xc1f0c1 },
  { name: "💻 coder", color: 0x9bb5ff },
  { name: "🌱 plant lover", color: 0xb5e8b0 },
  { name: "🐾 pet lover", color: 0xffd1a4 },

  { name: "─── ⋆ ping roles ⋆ ───", color: 0x99aab5 },
  { name: "🎀 announcements", color: 0xfddde6 },
  { name: "🎬 movie night", color: 0xd1c4e9 },
  { name: "🎮 game night", color: 0xb3e5fc },
  { name: "🌙 events", color: 0xffe0b2 },
  { name: "🎁 giveaways", color: 0xfff5b1 },
  { name: "📊 polls", color: 0xa0d8f1 },
  { name: "🤝 partnerships", color: 0xc8a2c8 },

  { name: "✿ member", color: 0xe8b4d8, hoist: true },
];

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("✿ wipe & rebuild the entire server with aesthetic channels & roles")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addBooleanOption((o) =>
      o
        .setName("keep_channels")
        .setDescription("Keep existing channels (default: wipe everything)"),
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
    const wipe = !(interaction.options.getBoolean("keep_channels") ?? false);

    if (wipe) {
      // delete EVERY channel including the one the command was run in.
      // ephemeral defer survives because it uses the interaction webhook, not the channel.
      const sorted = [...guild.channels.cache.values()].sort((a, b) => {
        // delete non-categories first, then categories
        const aIsCat = a.type === ChannelType.GuildCategory ? 1 : 0;
        const bIsCat = b.type === ChannelType.GuildCategory ? 1 : 0;
        return aIsCat - bIsCat;
      });
      for (const ch of sorted) {
        try {
          await ch.delete("Server setup wipe");
        } catch (e) {
          console.error("wipe err", ch.name, (e as Error).message);
        }
      }
    }

    const created: string[] = [];
    let memberRoleId: string | undefined;
    let modLogChannelId: string | undefined;
    let staffLogChannelId: string | undefined;
    let appChannelId: string | undefined;
    let appLogChannelId: string | undefined;
    let suggestionChannelId: string | undefined;
    let welcomeChannelId: string | undefined;
    let selfRoleChannelId: string | undefined;
    let ticketCategoryId: string | undefined;
    let ticketLogChannelId: string | undefined;
    let staffAppChannelId: string | undefined;

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

    let supportCat: CategoryChannel | undefined;
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
      if (cat.name.includes("staff")) {
        ticketCategoryId = category.id;
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
          if (t.includes("self-roles")) selfRoleChannelId = ch.id;
          if (t.includes("contestant-applications")) appChannelId = ch.id;
          if (t.includes("staff-applications")) staffAppChannelId = ch.id;
          if (t.includes("application-logs")) appLogChannelId = ch.id;
          if (t.includes("suggestions") && !t.includes("staff")) suggestionChannelId = ch.id;
          if (t.includes("mod-logs")) modLogChannelId = ch.id;
          if (t.includes("staff-logs")) staffLogChannelId = ch.id;
          if (t.includes("ticket-logs")) ticketLogChannelId = ch.id;
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
    void supportCat;

    updateGuild(guild.id, (g) => {
      if (memberRoleId) g.autoRoleId = memberRoleId;
      if (welcomeChannelId) g.welcomeChannelId = welcomeChannelId;
      if (welcomeChannelId) g.goodbyeChannelId = welcomeChannelId;
      if (modLogChannelId) g.modLogChannelId = modLogChannelId;
      if (staffLogChannelId) g.staffLogChannelId = staffLogChannelId;
      if (appChannelId) g.applicationChannelId = appChannelId;
      if (appLogChannelId) g.applicationLogChannelId = appLogChannelId;
      if (suggestionChannelId) g.suggestionChannelId = suggestionChannelId;
      if (selfRoleChannelId) g.selfRolePanelChannelId = selfRoleChannelId;
      if (ticketCategoryId) g.ticketCategoryId = ticketCategoryId;
      if (ticketLogChannelId) g.ticketLogChannelId = ticketLogChannelId;
      if (staffAppChannelId) g.staffAppChannelId = staffAppChannelId;
    });

    // Post CONTESTANT application panel
    if (appChannelId) {
      const ch = guild.channels.cache.get(appChannelId) as TextChannel | undefined;
      if (ch) {
        await ch.send({
          embeds: [
            aestheticEmbed({
              title: "˚｡⋆୨୧˚ latent show s2 ˚୨୧⋆｡˚",
              description: [
                `୨୧ ✦ ࣪ ⋆ ࣪ ˖ ⊹ apply for the show ⊹ ˖ ࣪ ⋆ ࣪ ✦ ୨୧`,
                ``,
                `dreamers, performers, the talented & the bold ♡`,
                `this is your stage ✿`,
                ``,
                `**☆ what we're looking for:**`,
                `⋆˚࿔ singers, dancers, rappers, musicians`,
                `⋆˚࿔ comedians, actors, magicians`,
                `⋆˚࿔ visual artists, content creators`,
                `⋆˚࿔ ANY hidden talent ✦`,
                ``,
                `**˗ˏˋ how to apply ˎˊ˗**`,
                `tap the **🎤 apply as contestant** button below`,
                `fill in your story, your talent, and why you should win ♡`,
                ``,
                `୨୧ official site: **${config.website}**`,
                ``,
                `*good luck darling — the spotlight is waiting* ✿`,
              ].join("\n"),
              thumbnail: guild.iconURL({ size: 256 }) ?? undefined,
            }),
          ],
          components: [
            new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setCustomId("apply:contestant")
                .setLabel("🎤 apply as contestant")
                .setStyle(ButtonStyle.Primary)
                .setEmoji("✿"),
            ),
          ],
        });
      }
    }

    // Post STAFF application panel
    if (staffAppChannelId) {
      const ch = guild.channels.cache.get(staffAppChannelId) as TextChannel | undefined;
      if (ch) {
        await ch.send({
          embeds: [
            aestheticEmbed({
              title: "✿ join the team ✿",
              description: [
                `୨୧ want to help run the show?`,
                ``,
                `apply for **staff** to help moderate, organize events & welcome new members.`,
                `apply for **partner** if you have a server / community to swap with us ♡`,
                ``,
                `୨୧ ${config.website}`,
              ].join("\n"),
            }),
          ],
          components: [
            new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder().setCustomId("apply:staff").setLabel("✿ apply for staff").setStyle(ButtonStyle.Primary),
              new ButtonBuilder().setCustomId("apply:partner").setLabel("★ apply for partner").setStyle(ButtonStyle.Secondary),
            ),
          ],
        });
      }
    }

    // Post self-role panel
    if (selfRoleChannelId) {
      const ch = guild.channels.cache.get(selfRoleChannelId) as TextChannel | undefined;
      if (ch) {
        await postSelfRolePanel(ch, guild);
      }
    }

    // Post ticket panel in support channel
    const supportCh = guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildText && c.name === slug("🎫・support"),
    ) as TextChannel | undefined;
    if (supportCh) {
      await supportCh.send({
        embeds: [
          aestheticEmbed({
            title: "🎫 support tickets ✿",
            description:
              "need help? click below to open a private ticket with the staff team ♡",
          }),
        ],
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId("ticket:open")
              .setLabel("✿ open a ticket")
              .setStyle(ButtonStyle.Primary),
          ),
        ],
      });
    }

    // Post welcome embed in welcome channel
    if (welcomeChannelId) {
      const ch = guild.channels.cache.get(welcomeChannelId) as TextChannel | undefined;
      if (ch) {
        await ch.send({
          embeds: [
            aestheticEmbed({
              title: `୨୧ welcome to ${guild.name} ୨୧`,
              description: [
                `⋆˚࿔ ✦ ୨୧ welcome darling ୨୧ ✦ ࿔˚⋆`,
                ``,
                `you've just stepped into **the most aesthetic talent show ever** ✿`,
                `home of dreamers, performers, artists and everyone in between ♡`,
                ``,
                `**˗ˏˋ start here ˎˊ˗**`,
                `୨୧ read the rules → <#${findCh(guild, "rules")}>`,
                `୨୧ pick your roles → <#${selfRoleChannelId ?? "0"}>`,
                `୨୧ apply as contestant → <#${appChannelId ?? "0"}>`,
                `୨୧ open a ticket → <#${findCh(guild, "support")}>`,
                ``,
                `୨୧ official site: **${config.website}**`,
                ``,
                `*the spotlight is waiting for you* ✦`,
              ].join("\n"),
              thumbnail: guild.iconURL({ size: 256 }) ?? undefined,
            }),
          ],
        });
      }
    }

    // Auto-fill RULES channel
    const rulesCh = findChannel(guild, "rules");
    if (rulesCh) {
      await rulesCh.send({
        embeds: [
          aestheticEmbed({
            title: "♡ ✿ ⋆ ୨୧ server rules ୨୧ ⋆ ✿ ♡",
            description: [
              `୨୧ ─── ⋆ ✦ ⋆ ─── ୨୧`,
              ``,
              `**1. ✿ be kind & respectful**`,
              `no hate, racism, sexism, homophobia, transphobia or bullying. zero tolerance ♡`,
              ``,
              `**2. ♡ no nsfw**`,
              `keep all content sfw — no explicit, gore, or disturbing media of any kind.`,
              ``,
              `**3. ✦ no spam or self-promo**`,
              `don't flood channels, don't dm-advertise. self promo only in designated channels.`,
              ``,
              `**4. ୨୧ no drama / vent-bait**`,
              `keep drama out — use the vent channel or open a ticket if you need support ♡`,
              ``,
              `**5. ★ stay in topic**`,
              `use the right channels for the right vibe. read the channel topics before posting.`,
              ``,
              `**6. ⋆ no impersonation**`,
              `don't pretend to be staff, contestants, or other members.`,
              ``,
              `**7. ✿ follow discord tos**`,
              `you must be **13+** per discord's terms of service.`,
              ``,
              `**8. ♡ listen to staff**`,
              `staff decisions are final. dm a mod or open a ticket to appeal calmly.`,
              ``,
              `**9. ✦ keep your tag clean**`,
              `no offensive nicknames, pfps, or status messages.`,
              ``,
              `**10. ୨୧ have fun ♡**`,
              `this is your space too — make it magical ✿`,
              ``,
              `୨୧ ─── ⋆ ✦ ⋆ ─── ୨୧`,
              `*by being here, you agree to all of the above*`,
              `**${config.website}**`,
            ].join("\n"),
            thumbnail: guild.iconURL({ size: 256 }) ?? undefined,
          }),
        ],
      });
    }

    // Auto-fill ANNOUNCEMENTS channel
    const annCh = findChannel(guild, "announcements");
    if (annCh) {
      await annCh.send({
        embeds: [
          aestheticEmbed({
            title: "✦ ୨୧ announcements ୨୧ ✦",
            description: [
              `୨୧ this channel is for official server-wide updates ♡`,
              ``,
              `grab the **🎀 announcements** ping role in <#${selfRoleChannelId ?? "0"}> to never miss anything ✿`,
              ``,
              `**stay tuned for:**`,
              `⋆˚࿔ contestant reveals`,
              `⋆˚࿔ event schedules`,
              `⋆˚࿔ live show dates`,
              `⋆˚࿔ winner announcements ★`,
              ``,
              `୨୧ ${config.website}`,
            ].join("\n"),
          }),
        ],
      });
    }

    // Auto-fill SUGGESTIONS channel intro
    const sugCh = findChannel(guild, "suggestions");
    if (sugCh) {
      await sugCh.send({
        embeds: [
          aestheticEmbed({
            title: "💌 ୨୧ suggestions ୨୧ 💌",
            description: [
              `୨୧ have an idea to make the server better?`,
              ``,
              `use **/suggest** to submit your idea — it'll be posted with vote reactions ♡`,
              `the team reviews suggestions every week ✿`,
              ``,
              `*every great show was once just an idea ✦*`,
            ].join("\n"),
          }),
        ],
      });
    }

    // Auto-fill FEATURED CONTESTANTS channel
    const featCh = findChannel(guild, "featured-contestants");
    if (featCh) {
      await featCh.send({
        embeds: [
          aestheticEmbed({
            title: "🌟 ୨୧ featured contestants ୨୧ 🌟",
            description: [
              `୨୧ ─── ⋆ ✦ ⋆ ─── ୨୧`,
              ``,
              `meet the talented dreamers competing this season ♡`,
              `their stories, their performances, their journeys — all here ✿`,
              ``,
              `**˗ˏˋ how to get featured ˎˊ˗**`,
              `apply in <#${appChannelId ?? "0"}> — accepted contestants get spotlighted here ✦`,
              ``,
              `୨୧ ${config.website}`,
            ].join("\n"),
            thumbnail: guild.iconURL({ size: 256 }) ?? undefined,
          }),
        ],
      });
    }

    await interaction.editReply({
      embeds: [
        aestheticEmbed({
          title: "✿ server setup complete ✿",
          description: [
            `created **${created.length}** new items`,
            ``,
            `auto-role: ${memberRoleId ? `<@&${memberRoleId}>` : "none"}`,
            `welcome: ${welcomeChannelId ? `<#${welcomeChannelId}>` : "none"}`,
            `self-roles: ${selfRoleChannelId ? `<#${selfRoleChannelId}>` : "none"}`,
            `applications: ${appChannelId ? `<#${appChannelId}>` : "none"}`,
            `mod-logs: ${modLogChannelId ? `<#${modLogChannelId}>` : "none"}`,
            `staff-logs: ${staffLogChannelId ? `<#${staffLogChannelId}>` : "none"}`,
            ``,
            `୨୧ ${config.website}`,
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

function findChannel(guild: import("discord.js").Guild, contains: string): TextChannel | undefined {
  return guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildText && c.name.includes(contains),
  ) as TextChannel | undefined;
}

function findCh(guild: import("discord.js").Guild, contains: string): string {
  const ch = findChannel(guild, contains);
  return ch?.id ?? "0";
}

async function postSelfRolePanel(ch: TextChannel, guild: import("discord.js").Guild) {
  const cats = [
    { id: "gender", title: "♡ gender", roles: ["♀ female", "♂ male", "⚥ non-binary", "⚧ transgender", "⚣ genderfluid", "⚪ agender", "❔ other gender", "🤐 prefer not to say"] },
    { id: "pronouns", title: "✿ pronouns", roles: ["she/her", "he/him", "they/them", "she/they", "he/they", "any/all", "ask my pronouns"] },
    { id: "age", title: "🌙 age", roles: ["🍼 13-15", "🌙 16-17", "✿ 18+", "♡ 21+", "★ 25+"] },
    { id: "orientation", title: "🌈 orientation", roles: ["🌈 lgbtq+", "💜 bisexual", "💛 pansexual", "🤍 asexual", "💖 lesbian", "💙 gay", "💚 queer", "♡ straight"] },
    { id: "region", title: "🌍 region", roles: ["🌎 north america", "🌍 europe", "🌏 asia", "🌎 south america", "🌍 africa", "🌏 oceania"] },
    { id: "colors", title: "🎨 colors", roles: ["౨ৎ pink", "₊˚ʚ purple", "✦ blue", "✿ green", "♡ yellow", "★ red", "✧ peach", "❀ lavender", "₊˚ white", "ᡣ𐭩 black"] },
    { id: "interests", title: "✦ interests", roles: ["🎮 gamer", "🎨 artist", "📚 reader", "🎵 music lover", "🎬 movie buff", "🍰 foodie", "📷 photographer", "✍ writer", "💻 coder", "🌱 plant lover", "🐾 pet lover"] },
    { id: "ping", title: "🔔 ping roles", roles: ["🎀 announcements", "🎬 movie night", "🎮 game night", "🌙 events", "🎁 giveaways", "📊 polls", "🤝 partnerships"] },
  ];

  await ch.send({
    embeds: [
      aestheticEmbed({
        title: "✿ self-roles ✿",
        description: [
          `pick your roles from the menus below ♡`,
          ``,
          `୨୧ choose your gender, pronouns, age, orientation, region, color, interests & ping roles`,
          `you can pick **multiple** in each category ✦`,
        ].join("\n"),
      }),
    ],
  });

  for (const cat of cats) {
    const opts = cat.roles
      .map((rn) => guild.roles.cache.find((r) => r.name === rn))
      .filter((r): r is NonNullable<typeof r> => !!r)
      .slice(0, 25)
      .map((r) => ({ label: r.name, value: r.id }));
    if (opts.length === 0) continue;
    const select = new StringSelectMenuBuilder()
      .setCustomId(`selfrole:${cat.id}`)
      .setPlaceholder(cat.title)
      .setMinValues(0)
      .setMaxValues(opts.length)
      .addOptions(opts);
    await ch.send({
      embeds: [aestheticEmbed({ description: `**${cat.title}**` })],
      components: [
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select),
      ],
    });
  }
}

export default command;
