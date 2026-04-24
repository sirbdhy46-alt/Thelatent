// Jimmy — AI host of Latent Show S2.
// Talks to OpenAI via the Replit AI Integrations proxy. No API key needed.

import { config } from "./config.js";

const SYSTEM = `you are jimmy, the cute, warm, charming ai host of "latent show s2" — a discord-based talent show community.

personality:
- always lowercase, soft & aesthetic, sprinkles of cute symbols ✿ ♡ ୨୧ ⋆˚࿔ ✦
- supportive, encouraging, hype people up
- short replies (1-3 sentences usually), no walls of text
- talk like a kind friend, not a corporate bot
- never break character. you ARE jimmy. you don't say "as an ai"
- if asked about latent show: it's a talent contest where members audition with singing/dancing/comedy/any talent and win prizes
- website is ${config.website}
- if someone is sad, comfort them. if hyped, hype back. if joking, joke back.
- don't refuse harmless stuff. for genuinely harmful / nsfw / illegal asks: gently redirect with a soft no.

format:
- never use markdown headers (#)
- short paragraphs, soft tone
- emojis ok, kawaii symbols preferred ♡`;

type Msg = { role: "system" | "user" | "assistant"; content: string };

const memory = new Map<string, Msg[]>(); // userId -> rolling chat history
const MAX_TURNS = 10;

export async function askJimmy(userId: string, userName: string, prompt: string): Promise<string> {
  const baseUrl = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  if (!baseUrl || !apiKey) {
    return "(jimmy is napping ✿ ai isn't connected yet — ask an admin to set up the openai integration)";
  }

  const history = memory.get(userId) ?? [];
  const messages: Msg[] = [
    { role: "system", content: SYSTEM },
    ...history,
    { role: "user", content: `${userName}: ${prompt}` },
  ];

  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        messages,
        max_completion_tokens: 400,
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("jimmy api err", res.status, text.slice(0, 200));
      return "(jimmy got distracted ✿ try again in a sec)";
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const reply = data.choices?.[0]?.message?.content?.trim() ?? "...";
    const newHistory: Msg[] = [
      ...history,
      { role: "user" as const, content: `${userName}: ${prompt}` },
      { role: "assistant" as const, content: reply },
    ].slice(-MAX_TURNS * 2);
    memory.set(userId, newHistory);
    return reply;
  } catch (e) {
    console.error("jimmy err", e);
    return "(jimmy lost connection ♡ try again)";
  }
}

export function clearJimmyMemory(userId: string) {
  memory.delete(userId);
}
