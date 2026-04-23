import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.resolve(process.cwd(), "bot/data");
const FILE = path.join(DATA_DIR, "guilds.json");

export type GuildSettings = {
  autoRoleId?: string;
  welcomeChannelId?: string;
  goodbyeChannelId?: string;
  modLogChannelId?: string;
  warns: Record<string, { reason: string; mod: string; at: number }[]>;
  stickyMessages: Record<string, { content: string; lastMessageId?: string }>;
  reactionRoles: Record<string, Record<string, string>>; // messageId -> emoji -> roleId
};

type Store = Record<string, GuildSettings>;

function load(): Store {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(FILE)) return {};
    return JSON.parse(fs.readFileSync(FILE, "utf-8")) as Store;
  } catch {
    return {};
  }
}

let store: Store = load();

function save() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(store, null, 2));
}

export function getGuild(guildId: string): GuildSettings {
  if (!store[guildId]) {
    store[guildId] = { warns: {}, stickyMessages: {}, reactionRoles: {} };
    save();
  }
  return store[guildId];
}

export function updateGuild(
  guildId: string,
  updater: (g: GuildSettings) => void,
) {
  const g = getGuild(guildId);
  updater(g);
  save();
}

export function reload() {
  store = load();
}
