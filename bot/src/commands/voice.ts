import {
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type VoiceChannel,
} from "discord.js";
import type { SlashCommand } from "../lib/command.js";
import { errorEmbed, successEmbed } from "../lib/embed.js";

export const voiceCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("voice")
    .setDescription("Voice channel moderation ✿")
    .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers)
    .addSubcommand((s) =>
      s.setName("mute").setDescription("Server-mute a member in voice")
        .addUserOption((o) => o.setName("user").setDescription("User").setRequired(true)),
    )
    .addSubcommand((s) =>
      s.setName("unmute").setDescription("Server-unmute a member")
        .addUserOption((o) => o.setName("user").setDescription("User").setRequired(true)),
    )
    .addSubcommand((s) =>
      s.setName("deafen").setDescription("Server-deafen a member")
        .addUserOption((o) => o.setName("user").setDescription("User").setRequired(true)),
    )
    .addSubcommand((s) =>
      s.setName("undeafen").setDescription("Server-undeafen a member")
        .addUserOption((o) => o.setName("user").setDescription("User").setRequired(true)),
    )
    .addSubcommand((s) =>
      s.setName("kick").setDescription("Disconnect a member from voice")
        .addUserOption((o) => o.setName("user").setDescription("User").setRequired(true)),
    )
    .addSubcommand((s) =>
      s.setName("move").setDescription("Move a member to another voice channel")
        .addUserOption((o) => o.setName("user").setDescription("User").setRequired(true))
        .addChannelOption((o) =>
          o.setName("channel").setDescription("Voice channel").addChannelTypes(ChannelType.GuildVoice).setRequired(true),
        ),
    )
    .addSubcommand((s) =>
      s.setName("moveall").setDescription("Move everyone in your VC to another VC")
        .addChannelOption((o) =>
          o.setName("channel").setDescription("Target VC").addChannelTypes(ChannelType.GuildVoice).setRequired(true),
        ),
    )
    .addSubcommand((s) =>
      s.setName("disconnectall").setDescription("Disconnect everyone in a voice channel")
        .addChannelOption((o) =>
          o.setName("channel").setDescription("Voice channel").addChannelTypes(ChannelType.GuildVoice).setRequired(true),
        ),
    ),
  async execute(i) {
    if (!i.guild) return;
    const sub = i.options.getSubcommand();
    if (sub === "moveall") {
      const member = await i.guild.members.fetch(i.user.id);
      const ch = i.options.getChannel("channel", true) as unknown as VoiceChannel;
      const src = member.voice.channel;
      if (!src) return i.reply({ embeds: [errorEmbed("you must be in a vc")], ephemeral: true });
      let n = 0;
      for (const m of src.members.values()) {
        try { await m.voice.setChannel(ch.id); n++; } catch {}
      }
      return i.reply({ embeds: [successEmbed(`moved ${n} members`)] });
    }
    if (sub === "disconnectall") {
      const ch = i.options.getChannel("channel", true) as unknown as VoiceChannel;
      const real = i.guild.channels.cache.get(ch.id);
      if (!real || real.type !== ChannelType.GuildVoice) return;
      let n = 0;
      for (const m of real.members.values()) {
        try { await m.voice.disconnect(); n++; } catch {}
      }
      return i.reply({ embeds: [successEmbed(`disconnected ${n} members`)] });
    }
    const u = i.options.getUser("user", true);
    const m = await i.guild.members.fetch(u.id);
    if (!m.voice.channel && (sub === "mute" || sub === "unmute" || sub === "deafen" || sub === "undeafen" || sub === "kick" || sub === "move")) {
      return i.reply({ embeds: [errorEmbed("user is not in a voice channel")], ephemeral: true });
    }
    try {
      if (sub === "mute") await m.voice.setMute(true);
      else if (sub === "unmute") await m.voice.setMute(false);
      else if (sub === "deafen") await m.voice.setDeaf(true);
      else if (sub === "undeafen") await m.voice.setDeaf(false);
      else if (sub === "kick") await m.voice.disconnect();
      else if (sub === "move") {
        const ch = i.options.getChannel("channel", true) as unknown as VoiceChannel;
        await m.voice.setChannel(ch.id);
      }
      await i.reply({ embeds: [successEmbed(`✿ done — \`${sub}\` on **${u.tag}**`)] });
    } catch (e) {
      await i.reply({ embeds: [errorEmbed((e as Error).message)], ephemeral: true });
    }
  },
};

export const commands = [voiceCmd];
