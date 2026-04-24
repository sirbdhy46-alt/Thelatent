// Free public GIF endpoints (no API key needed)
const WAIFU_PICS = "https://api.waifu.pics/sfw";

const FALLBACK: Record<string, string[]> = {
  hug: ["https://media.tenor.com/qN5z3jq0BTcAAAAC/anime-hug.gif"],
  kiss: ["https://media.tenor.com/uqi0K6_PcwIAAAAC/anime-kiss.gif"],
  pat: ["https://media.tenor.com/E3y3LKqOjtcAAAAC/anime-pat.gif"],
  cuddle: ["https://media.tenor.com/y0Yt4cAjL2wAAAAC/anime-cuddle.gif"],
  slap: ["https://media.tenor.com/Ws6Dm1ZW_vMAAAAC/anime-slap.gif"],
  poke: ["https://media.tenor.com/jjJI5SJ2X14AAAAC/anime-poke.gif"],
  bonk: ["https://media.tenor.com/Mlj-rs51EzMAAAAC/anime-bonk.gif"],
  highfive: ["https://media.tenor.com/mvTk2Ym3hjQAAAAC/anime-high-five.gif"],
  wave: ["https://media.tenor.com/zZj0TM6bUFkAAAAC/anime-wave.gif"],
  blush: ["https://media.tenor.com/mNiUQfFq3K4AAAAC/anime-blush.gif"],
  dance: ["https://media.tenor.com/eR4f1IahHM0AAAAC/anime-dance.gif"],
  cry: ["https://media.tenor.com/8a0kqNYHIDIAAAAC/anime-cry.gif"],
  laugh: ["https://media.tenor.com/0qXmnfGcPo8AAAAC/anime-laugh.gif"],
  smile: ["https://media.tenor.com/I7sBb-AIdYUAAAAC/anime-smile.gif"],
  smug: ["https://media.tenor.com/-d1eFxK2p7MAAAAC/anime-smug.gif"],
  bite: ["https://media.tenor.com/BsHLk6dC3jcAAAAC/anime-bite.gif"],
  nom: ["https://media.tenor.com/yX2ehNKJTAYAAAAC/anime-nom.gif"],
  yeet: ["https://media.tenor.com/3o6q-ngcTHsAAAAC/anime-yeet.gif"],
  happy: ["https://media.tenor.com/rJxRUUfjMTYAAAAC/anime-happy.gif"],
  wink: ["https://media.tenor.com/ESDfdxqPcVUAAAAC/anime-wink.gif"],
};

// waifu.pics-supported categories (sfw)
const WAIFU_CATS = new Set([
  "hug", "kiss", "pat", "cuddle", "slap", "poke", "bonk", "highfive",
  "wave", "blush", "dance", "cry", "laugh", "smile", "smug", "bite",
  "nom", "yeet", "happy", "wink", "kill", "lick", "bully", "cringe",
  "handhold", "kick", "glomp", "awoo", "neko", "waifu", "shinobu",
  "megumin",
]);

export async function getActionGif(action: string): Promise<string> {
  if (WAIFU_CATS.has(action)) {
    try {
      const res = await fetch(`${WAIFU_PICS}/${action}`, {
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const j = (await res.json()) as { url?: string };
        if (j.url) return j.url;
      }
    } catch {}
  }
  const list = FALLBACK[action] ?? FALLBACK.hug!;
  return list[Math.floor(Math.random() * list.length)]!;
}
