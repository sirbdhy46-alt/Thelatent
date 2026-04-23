import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../lib/command.js";
import { aestheticEmbed } from "../lib/embed.js";

const r = (max: number) => Math.floor(Math.random() * max);
const pick = <T>(arr: T[]) => arr[r(arr.length)]!;

export const coinflipCmd: SlashCommand = {
  data: new SlashCommandBuilder().setName("coinflip").setDescription("Flip a coin 🪙") as SlashCommandBuilder,
  async execute(i) {
    await i.reply({ embeds: [aestheticEmbed({ title: "🪙 coin", description: pick(["**heads**", "**tails**"]) })] });
  },
};

export const diceCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("dice")
    .setDescription("Roll a die 🎲")
    .addIntegerOption((o) => o.setName("sides").setDescription("Sides (default 6)").setMinValue(2).setMaxValue(1000)) as SlashCommandBuilder,
  async execute(i) {
    const sides = i.options.getInteger("sides") ?? 6;
    await i.reply({ embeds: [aestheticEmbed({ title: "🎲 dice", description: `you rolled **${1 + r(sides)}** (d${sides})` })] });
  },
};

export const eightballCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("8ball")
    .setDescription("Ask the magic 8-ball 🎱")
    .addStringOption((o) => o.setName("question").setDescription("Q").setRequired(true)) as SlashCommandBuilder,
  async execute(i) {
    const answers = ["yes ✿", "no ✗", "definitely ♡", "absolutely not", "maybe...", "ask again later", "without a doubt", "very doubtful", "outlook good", "signs point to yes", "concentrate and ask again", "my sources say no"];
    await i.reply({ embeds: [aestheticEmbed({ title: "🎱 8-ball", description: `**q:** ${i.options.getString("question", true)}\n**a:** ${pick(answers)}` })] });
  },
};

export const chooseCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("choose")
    .setDescription("Pick one for you")
    .addStringOption((o) => o.setName("options").setDescription("Comma-separated").setRequired(true)) as SlashCommandBuilder,
  async execute(i) {
    const opts = i.options.getString("options", true).split(",").map((s) => s.trim()).filter(Boolean);
    await i.reply({ embeds: [aestheticEmbed({ title: "✿ i choose", description: `**${pick(opts)}**` })] });
  },
};

export const rpsCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("rps")
    .setDescription("Rock paper scissors")
    .addStringOption((o) => o.setName("choice").setDescription("rock/paper/scissors").setRequired(true).addChoices({name:"rock",value:"rock"},{name:"paper",value:"paper"},{name:"scissors",value:"scissors"})) as SlashCommandBuilder,
  async execute(i) {
    const me = i.options.getString("choice", true);
    const bot = pick(["rock", "paper", "scissors"]);
    const win = (me === "rock" && bot === "scissors") || (me === "paper" && bot === "rock") || (me === "scissors" && bot === "paper");
    const tie = me === bot;
    await i.reply({ embeds: [aestheticEmbed({ title: "✿ rps", description: `you: **${me}**\nme: **${bot}**\n→ ${tie ? "tie!" : win ? "you win ♡" : "i win ✦"}` })] });
  },
};

const action = (name: string, verb: string) =>
  ({
    data: new SlashCommandBuilder()
      .setName(name)
      .setDescription(`${verb} someone`)
      .addUserOption((o) => o.setName("user").setDescription("User").setRequired(true)) as SlashCommandBuilder,
    async execute(i) {
      const u = i.options.getUser("user", true);
      await i.reply({ embeds: [aestheticEmbed({ description: `<@${i.user.id}> ${verb} <@${u.id}> ✿` })] });
    },
  }) as SlashCommand;

export const hugCmd = action("hug", "hugs");
export const patCmd = action("pat", "pats");
export const slapCmd = action("slap", "slaps");
export const kissCmd = action("kiss", "kisses");
export const cuddleCmd = action("cuddle", "cuddles");
export const waveCmd = action("wave", "waves at");
export const blushCmd = action("blush", "blushes at");

export const quoteCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("quote")
    .setDescription("Get a random aesthetic quote ✿") as SlashCommandBuilder,
  async execute(i) {
    const quotes = [
      "and still, i rise. — maya angelou",
      "stars can't shine without darkness ✦",
      "you are made of stardust ⋆˚࿔",
      "be soft. do not let the world make you hard ♡",
      "she remembered who she was, and the game changed.",
      "the universe is on your side ✿",
      "everything you can imagine is real. — picasso",
    ];
    await i.reply({ embeds: [aestheticEmbed({ title: "♡ quote", description: pick(quotes) })] });
  },
};

export const compliment: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("compliment")
    .setDescription("Compliment someone ♡")
    .addUserOption((o) => o.setName("user").setDescription("User")) as SlashCommandBuilder,
  async execute(i) {
    const u = i.options.getUser("user") ?? i.user;
    const cs = ["you're a whole vibe ✿", "your aura is unmatched ♡", "you light up every room ✦", "the world is better with you in it ୨୧", "you are absolutely radiant ✧"];
    await i.reply({ embeds: [aestheticEmbed({ description: `<@${u.id}> — ${pick(cs)}` })] });
  },
};

export const ratCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("rate")
    .setDescription("Rate something /10")
    .addStringOption((o) => o.setName("thing").setDescription("Thing").setRequired(true)) as SlashCommandBuilder,
  async execute(i) {
    const t = i.options.getString("thing", true);
    const score = (Math.random() * 11).toFixed(1);
    await i.reply({ embeds: [aestheticEmbed({ description: `**${t}** is a **${score}/10** ✿` })] });
  },
};

export const shipCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("ship")
    .setDescription("Ship two users ♡")
    .addUserOption((o) => o.setName("a").setDescription("Person 1").setRequired(true))
    .addUserOption((o) => o.setName("b").setDescription("Person 2").setRequired(true)) as SlashCommandBuilder,
  async execute(i) {
    const a = i.options.getUser("a", true);
    const b = i.options.getUser("b", true);
    const score = Math.floor((parseInt((a.id + b.id).slice(-6), 10) % 100) + 1);
    const name = a.username.slice(0, Math.ceil(a.username.length / 2)) + b.username.slice(Math.floor(b.username.length / 2));
    await i.reply({ embeds: [aestheticEmbed({ title: `♡ ${name}`, description: `**${a.username}** + **${b.username}** = ${score}% ✦` })] });
  },
};

export const reverseCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("reverse")
    .setDescription("Reverse text")
    .addStringOption((o) => o.setName("text").setDescription("Text").setRequired(true)) as SlashCommandBuilder,
  async execute(i) {
    const text = i.options.getString("text", true);
    await i.reply({ embeds: [aestheticEmbed({ description: `\`\`\`${[...text].reverse().join("")}\`\`\`` })] });
  },
};

export const passwordCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("password")
    .setDescription("Generate a random password")
    .addIntegerOption((o) => o.setName("length").setDescription("Length").setMinValue(8).setMaxValue(64)) as SlashCommandBuilder,
  async execute(i) {
    const len = i.options.getInteger("length") ?? 16;
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    const p = Array.from({ length: len }, () => chars[r(chars.length)]).join("");
    await i.reply({ embeds: [aestheticEmbed({ title: "🔑 password", description: `\`${p}\`` })], ephemeral: true });
  },
};

export const base64Cmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("base64")
    .setDescription("Encode/decode base64")
    .addStringOption((o) => o.setName("mode").setDescription("encode/decode").setRequired(true).addChoices({name:"encode",value:"encode"},{name:"decode",value:"decode"}))
    .addStringOption((o) => o.setName("text").setDescription("Text").setRequired(true)) as SlashCommandBuilder,
  async execute(i) {
    const mode = i.options.getString("mode", true);
    const text = i.options.getString("text", true);
    const out = mode === "encode" ? Buffer.from(text).toString("base64") : Buffer.from(text, "base64").toString("utf-8");
    await i.reply({ embeds: [aestheticEmbed({ description: `\`\`\`${out.slice(0, 4000)}\`\`\`` })], ephemeral: true });
  },
};

export const factCmd: SlashCommand = {
  data: new SlashCommandBuilder().setName("fact").setDescription("Random fact ✿") as SlashCommandBuilder,
  async execute(i) {
    const facts = [
      "octopuses have three hearts ✿",
      "honey never spoils ♡",
      "a group of flamingos is called a flamboyance ✦",
      "bananas are berries, but strawberries aren't ୨୧",
      "sea otters hold hands while sleeping so they don't drift apart ♡",
      "a day on venus is longer than a year on venus ✦",
      "cows have best friends ୨୧",
    ];
    await i.reply({ embeds: [aestheticEmbed({ title: "✿ fact", description: pick(facts) })] });
  },
};

export const commands = [
  coinflipCmd,
  diceCmd,
  eightballCmd,
  chooseCmd,
  rpsCmd,
  hugCmd,
  patCmd,
  slapCmd,
  kissCmd,
  cuddleCmd,
  waveCmd,
  blushCmd,
  quoteCmd,
  compliment,
  ratCmd,
  shipCmd,
  reverseCmd,
  passwordCmd,
  base64Cmd,
  factCmd,
];
