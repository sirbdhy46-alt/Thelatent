import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../lib/command.js";
import { aestheticEmbed } from "../lib/embed.js";

const r = (max: number) => Math.floor(Math.random() * max);
const pick = <T>(arr: T[]) => arr[r(arr.length)]!;

export const funCmd: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("fun")
    .setDescription("✿ fun stuff")
    .addSubcommand((s) => s.setName("coinflip").setDescription("Flip a coin 🪙"))
    .addSubcommand((s) => s.setName("dice").setDescription("Roll a die 🎲").addIntegerOption((o) => o.setName("sides").setDescription("Sides").setMinValue(2).setMaxValue(1000)))
    .addSubcommand((s) => s.setName("8ball").setDescription("Magic 8-ball").addStringOption((o) => o.setName("q").setDescription("Question").setRequired(true)))
    .addSubcommand((s) => s.setName("choose").setDescription("Pick one for you").addStringOption((o) => o.setName("options").setDescription("Comma-separated").setRequired(true)))
    .addSubcommand((s) => s.setName("rps").setDescription("Rock paper scissors").addStringOption((o) => o.setName("choice").setDescription("rock/paper/scissors").setRequired(true).addChoices({name:"rock",value:"rock"},{name:"paper",value:"paper"},{name:"scissors",value:"scissors"})))
    .addSubcommand((s) => s.setName("hug").setDescription("hug someone").addUserOption((o) => o.setName("user").setDescription("User").setRequired(true)))
    .addSubcommand((s) => s.setName("pat").setDescription("pat someone").addUserOption((o) => o.setName("user").setDescription("User").setRequired(true)))
    .addSubcommand((s) => s.setName("slap").setDescription("slap someone").addUserOption((o) => o.setName("user").setDescription("User").setRequired(true)))
    .addSubcommand((s) => s.setName("kiss").setDescription("kiss someone").addUserOption((o) => o.setName("user").setDescription("User").setRequired(true)))
    .addSubcommand((s) => s.setName("cuddle").setDescription("cuddle someone").addUserOption((o) => o.setName("user").setDescription("User").setRequired(true)))
    .addSubcommand((s) => s.setName("wave").setDescription("wave at someone").addUserOption((o) => o.setName("user").setDescription("User").setRequired(true)))
    .addSubcommand((s) => s.setName("blush").setDescription("blush at someone").addUserOption((o) => o.setName("user").setDescription("User").setRequired(true)))
    .addSubcommand((s) => s.setName("bonk").setDescription("bonk someone").addUserOption((o) => o.setName("user").setDescription("User").setRequired(true)))
    .addSubcommand((s) => s.setName("poke").setDescription("poke someone").addUserOption((o) => o.setName("user").setDescription("User").setRequired(true)))
    .addSubcommand((s) => s.setName("highfive").setDescription("high-five someone").addUserOption((o) => o.setName("user").setDescription("User").setRequired(true)))
    .addSubcommand((s) => s.setName("quote").setDescription("Random aesthetic quote ✿"))
    .addSubcommand((s) => s.setName("compliment").setDescription("Compliment someone ♡").addUserOption((o) => o.setName("user").setDescription("User")))
    .addSubcommand((s) => s.setName("rate").setDescription("Rate something /10").addStringOption((o) => o.setName("thing").setDescription("Thing").setRequired(true)))
    .addSubcommand((s) => s.setName("ship").setDescription("Ship two users ♡").addUserOption((o) => o.setName("a").setDescription("Person 1").setRequired(true)).addUserOption((o) => o.setName("b").setDescription("Person 2").setRequired(true)))
    .addSubcommand((s) => s.setName("fact").setDescription("Random fact ✿"))
    .addSubcommand((s) => s.setName("joke").setDescription("Random joke 😆"))
    .addSubcommand((s) => s.setName("howcute").setDescription("How cute is someone?").addUserOption((o) => o.setName("user").setDescription("User")))
    .addSubcommand((s) => s.setName("howsmart").setDescription("How smart is someone?").addUserOption((o) => o.setName("user").setDescription("User")))
    .addSubcommand((s) => s.setName("howgay").setDescription("How gay /100").addUserOption((o) => o.setName("user").setDescription("User")))
    .addSubcommand((s) => s.setName("howrich").setDescription("How rich is someone?").addUserOption((o) => o.setName("user").setDescription("User"))),
  async execute(i) {
    const sub = i.options.getSubcommand();
    if (sub === "coinflip") return i.reply({ embeds: [aestheticEmbed({ title: "🪙 coin", description: pick(["**heads**", "**tails**"]) })] });
    if (sub === "dice") {
      const s = i.options.getInteger("sides") ?? 6;
      return i.reply({ embeds: [aestheticEmbed({ title: "🎲 dice", description: `you rolled **${1 + r(s)}** (d${s})` })] });
    }
    if (sub === "8ball") {
      const a = ["yes ✿", "no ✗", "definitely ♡", "absolutely not", "maybe...", "ask again later", "without a doubt", "very doubtful", "outlook good", "signs point to yes", "concentrate and ask again", "my sources say no"];
      return i.reply({ embeds: [aestheticEmbed({ title: "🎱 8-ball", description: `**q:** ${i.options.getString("q", true)}\n**a:** ${pick(a)}` })] });
    }
    if (sub === "choose") {
      const opts = i.options.getString("options", true).split(",").map((s) => s.trim()).filter(Boolean);
      return i.reply({ embeds: [aestheticEmbed({ title: "✿ i choose", description: `**${pick(opts)}**` })] });
    }
    if (sub === "rps") {
      const me = i.options.getString("choice", true);
      const bot = pick(["rock", "paper", "scissors"]);
      const win = (me === "rock" && bot === "scissors") || (me === "paper" && bot === "rock") || (me === "scissors" && bot === "paper");
      const tie = me === bot;
      return i.reply({ embeds: [aestheticEmbed({ title: "✿ rps", description: `you: **${me}**\nme: **${bot}**\n→ ${tie ? "tie!" : win ? "you win ♡" : "i win ✦"}` })] });
    }
    const verbs: Record<string, string> = { hug: "hugs", pat: "pats", slap: "slaps", kiss: "kisses", cuddle: "cuddles", wave: "waves at", blush: "blushes at", bonk: "bonks", poke: "pokes", highfive: "high-fives" };
    if (verbs[sub]) {
      const u = i.options.getUser("user", true);
      return i.reply({ embeds: [aestheticEmbed({ description: `<@${i.user.id}> ${verbs[sub]} <@${u.id}> ✿` })] });
    }
    if (sub === "quote") {
      const qs = ["and still, i rise. — maya angelou", "stars can't shine without darkness ✦", "you are made of stardust ⋆˚࿔", "be soft. do not let the world make you hard ♡", "she remembered who she was, and the game changed.", "the universe is on your side ✿", "everything you can imagine is real. — picasso"];
      return i.reply({ embeds: [aestheticEmbed({ title: "♡ quote", description: pick(qs) })] });
    }
    if (sub === "compliment") {
      const u = i.options.getUser("user") ?? i.user;
      const cs = ["you're a whole vibe ✿", "your aura is unmatched ♡", "you light up every room ✦", "the world is better with you in it ୨୧", "you are absolutely radiant ✧"];
      return i.reply({ embeds: [aestheticEmbed({ description: `<@${u.id}> — ${pick(cs)}` })] });
    }
    if (sub === "rate") {
      return i.reply({ embeds: [aestheticEmbed({ description: `**${i.options.getString("thing", true)}** is a **${(Math.random() * 11).toFixed(1)}/10** ✿` })] });
    }
    if (sub === "ship") {
      const a = i.options.getUser("a", true);
      const b = i.options.getUser("b", true);
      const score = Math.floor((parseInt((a.id + b.id).slice(-6), 10) % 100) + 1);
      const name = a.username.slice(0, Math.ceil(a.username.length / 2)) + b.username.slice(Math.floor(b.username.length / 2));
      return i.reply({ embeds: [aestheticEmbed({ title: `♡ ${name}`, description: `**${a.username}** + **${b.username}** = ${score}% ✦` })] });
    }
    if (sub === "fact") {
      const f = ["octopuses have three hearts ✿", "honey never spoils ♡", "a group of flamingos is called a flamboyance ✦", "bananas are berries, but strawberries aren't ୨୧", "sea otters hold hands while sleeping so they don't drift apart ♡", "a day on venus is longer than a year on venus ✦", "cows have best friends ୨୧"];
      return i.reply({ embeds: [aestheticEmbed({ title: "✿ fact", description: pick(f) })] });
    }
    if (sub === "joke") {
      const j = ["why don't skeletons fight each other? they don't have the guts.", "i told my wife she should embrace her mistakes. she gave me a hug.", "what do you call cheese that isn't yours? nacho cheese.", "i'm reading a book about anti-gravity. it's impossible to put down.", "why did the scarecrow win an award? he was outstanding in his field."];
      return i.reply({ embeds: [aestheticEmbed({ title: "😆", description: pick(j) })] });
    }
    if (["howcute", "howsmart", "howgay", "howrich"].includes(sub)) {
      const u = i.options.getUser("user") ?? i.user;
      const score = (parseInt(u.id.slice(-6), 10) + sub.length) % 101;
      const map: Record<string, string> = { howcute: "cute ✿", howsmart: "smart ✦", howgay: "gay 🌈", howrich: "rich 💎" };
      return i.reply({ embeds: [aestheticEmbed({ description: `<@${u.id}> is **${score}%** ${map[sub]}` })] });
    }
  },
};

export const commands = [funCmd];
