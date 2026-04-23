import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../lib/command.js";
import { aestheticEmbed } from "../lib/embed.js";

const FULLWIDTH = (s: string) => [...s].map((c) => { const code = c.charCodeAt(0); if (code >= 33 && code <= 126) return String.fromCharCode(code + 0xfee0); if (code === 32) return "　"; return c; }).join("");
const SMALLCAPS = (s: string) => { const map: Record<string, string> = { a: "ᴀ", b: "ʙ", c: "ᴄ", d: "ᴅ", e: "ᴇ", f: "ꜰ", g: "ɢ", h: "ʜ", i: "ɪ", j: "ᴊ", k: "ᴋ", l: "ʟ", m: "ᴍ", n: "ɴ", o: "ᴏ", p: "ᴘ", q: "ǫ", r: "ʀ", s: "s", t: "ᴛ", u: "ᴜ", v: "ᴠ", w: "ᴡ", x: "x", y: "ʏ", z: "ᴢ" }; return s.toLowerCase().split("").map((c) => map[c] ?? c).join(""); };
const UPSIDEDOWN = (s: string) => { const map: Record<string, string> = { a: "ɐ", b: "q", c: "ɔ", d: "p", e: "ǝ", f: "ɟ", g: "ƃ", h: "ɥ", i: "ᴉ", j: "ɾ", k: "ʞ", l: "l", m: "ɯ", n: "u", o: "o", p: "d", q: "b", r: "ɹ", s: "s", t: "ʇ", u: "n", v: "ʌ", w: "ʍ", x: "x", y: "ʎ", z: "z", "?": "¿", ".": "˙", ",": "'" }; return [...s.toLowerCase()].map((c) => map[c] ?? c).reverse().join(""); };
const SPONGEBOB = (s: string) => [...s].map((c, i) => i % 2 ? c.toUpperCase() : c.toLowerCase()).join("");
const OWO = (s: string) => s.replace(/[rl]/g, "w").replace(/[RL]/g, "W").replace(/n([aeiou])/g, "ny$1").replace(/N([aeiou])/g, "Ny$1") + " owo";
const CLAP = (s: string) => s.split(/\s+/).join(" 👏 ");
const EMOJIFY = (s: string) => [...s.toLowerCase()].map((c) => /[a-z]/.test(c) ? `:regional_indicator_${c}:` : /[0-9]/.test(c) ? [":zero:", ":one:", ":two:", ":three:", ":four:", ":five:", ":six:", ":seven:", ":eight:", ":nine:"][parseInt(c, 10)]! + " " : c).join(" ");

export const textCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("text")
    .setDescription("✿ text manipulation")
    .addSubcommand((s) => s.setName("emojify").setDescription("Letters → emoji").addStringOption((o) => o.setName("text").setDescription("Text").setRequired(true)))
    .addSubcommand((s) => s.setName("clap").setDescription("Add 👏 between words").addStringOption((o) => o.setName("text").setDescription("Text").setRequired(true)))
    .addSubcommand((s) => s.setName("spongebob").setDescription("Mocking text").addStringOption((o) => o.setName("text").setDescription("Text").setRequired(true)))
    .addSubcommand((s) => s.setName("owo").setDescription("OwO-fy text").addStringOption((o) => o.setName("text").setDescription("Text").setRequired(true)))
    .addSubcommand((s) => s.setName("smallcaps").setDescription("ꜱᴍᴀʟʟ ᴄᴀᴘs").addStringOption((o) => o.setName("text").setDescription("Text").setRequired(true)))
    .addSubcommand((s) => s.setName("upside").setDescription("uʍop ǝpᴉsdn").addStringOption((o) => o.setName("text").setDescription("Text").setRequired(true)))
    .addSubcommand((s) => s.setName("vaporwave").setDescription("ｖａｐｏｒｗａｖｅ").addStringOption((o) => o.setName("text").setDescription("Text").setRequired(true)))
    .addSubcommand((s) => s.setName("reverse").setDescription("Reverse text").addStringOption((o) => o.setName("text").setDescription("Text").setRequired(true)))
    .addSubcommand((s) => s.setName("caps").setDescription("Uppercase").addStringOption((o) => o.setName("text").setDescription("Text").setRequired(true)))
    .addSubcommand((s) => s.setName("lower").setDescription("Lowercase").addStringOption((o) => o.setName("text").setDescription("Text").setRequired(true)))
    .addSubcommand((s) => s.setName("count").setDescription("Char & word count").addStringOption((o) => o.setName("text").setDescription("Text").setRequired(true)))
    .addSubcommand((s) => s.setName("base64").setDescription("Base64 encode/decode").addStringOption((o) => o.setName("mode").setDescription("encode/decode").setRequired(true).addChoices({name:"encode",value:"encode"},{name:"decode",value:"decode"})).addStringOption((o) => o.setName("text").setDescription("Text").setRequired(true)))
    .addSubcommand((s) => s.setName("password").setDescription("Generate password").addIntegerOption((o) => o.setName("length").setDescription("Length").setMinValue(8).setMaxValue(64)))
    .addSubcommand((s) => s.setName("hash").setDescription("MD5/SHA hash").addStringOption((o) => o.setName("text").setDescription("Text").setRequired(true)))
    .addSubcommand((s) => s.setName("morse").setDescription("Text → morse").addStringOption((o) => o.setName("text").setDescription("Text").setRequired(true))),
  async execute(i) {
    const sub = i.options.getSubcommand();
    const text = i.options.getString("text") ?? "";
    if (sub === "emojify") return i.reply({ embeds: [aestheticEmbed({ description: EMOJIFY(text).slice(0, 4000) })] });
    if (sub === "clap") return i.reply({ embeds: [aestheticEmbed({ description: CLAP(text) })] });
    if (sub === "spongebob") return i.reply({ embeds: [aestheticEmbed({ description: SPONGEBOB(text) })] });
    if (sub === "owo") return i.reply({ embeds: [aestheticEmbed({ description: OWO(text) })] });
    if (sub === "smallcaps") return i.reply({ embeds: [aestheticEmbed({ description: SMALLCAPS(text) })] });
    if (sub === "upside") return i.reply({ embeds: [aestheticEmbed({ description: UPSIDEDOWN(text) })] });
    if (sub === "vaporwave") return i.reply({ embeds: [aestheticEmbed({ description: FULLWIDTH(text) })] });
    if (sub === "reverse") return i.reply({ embeds: [aestheticEmbed({ description: `\`\`\`${[...text].reverse().join("")}\`\`\`` })] });
    if (sub === "caps") return i.reply({ embeds: [aestheticEmbed({ description: text.toUpperCase() })] });
    if (sub === "lower") return i.reply({ embeds: [aestheticEmbed({ description: text.toLowerCase() })] });
    if (sub === "count") return i.reply({ embeds: [aestheticEmbed({ description: `chars: **${text.length}**\nwords: **${text.split(/\s+/).filter(Boolean).length}**` })] });
    if (sub === "base64") {
      const mode = i.options.getString("mode", true);
      const out = mode === "encode" ? Buffer.from(text).toString("base64") : Buffer.from(text, "base64").toString("utf-8");
      return i.reply({ embeds: [aestheticEmbed({ description: `\`\`\`${out.slice(0, 4000)}\`\`\`` })], ephemeral: true });
    }
    if (sub === "password") {
      const len = i.options.getInteger("length") ?? 16;
      const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
      const p = Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
      return i.reply({ embeds: [aestheticEmbed({ title: "🔑 password", description: `\`${p}\`` })], ephemeral: true });
    }
    if (sub === "hash") {
      const { createHash } = await import("node:crypto");
      const md5 = createHash("md5").update(text).digest("hex");
      const sha1 = createHash("sha1").update(text).digest("hex");
      const sha256 = createHash("sha256").update(text).digest("hex");
      return i.reply({ embeds: [aestheticEmbed({ description: `**md5:** \`${md5}\`\n**sha1:** \`${sha1}\`\n**sha256:** \`${sha256}\`` })], ephemeral: true });
    }
    if (sub === "morse") {
      const morse: Record<string, string> = { a: ".-", b: "-...", c: "-.-.", d: "-..", e: ".", f: "..-.", g: "--.", h: "....", i: "..", j: ".---", k: "-.-", l: ".-..", m: "--", n: "-.", o: "---", p: ".--.", q: "--.-", r: ".-.", s: "...", t: "-", u: "..-", v: "...-", w: ".--", x: "-..-", y: "-.--", z: "--..", "0": "-----", "1": ".----", "2": "..---", "3": "...--", "4": "....-", "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----.", " ": "/" };
      return i.reply({ embeds: [aestheticEmbed({ description: `\`${[...text.toLowerCase()].map((c) => morse[c] ?? c).join(" ")}\`` })] });
    }
  },
};

export const commands = [textCmd];
