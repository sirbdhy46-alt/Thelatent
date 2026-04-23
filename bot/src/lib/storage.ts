import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.resolve(process.cwd(), "bot/data");
const FILE = path.join(DATA_DIR, "guilds.json");

export type ModCase = {
  id: number;
  type: string;
  user: string;
  mod: string;
  reason: string;
  at: number;
  duration?: number;
};

export type GuildSettings = {
  autoRoleId?: string;
  welcomeChannelId?: string;
  goodbyeChannelId?: string;
  modLogChannelId?: string;
  staffLogChannelId?: string;
  applicationChannelId?: string;
  staffAppChannelId?: string;
  applicationLogChannelId?: string;
  modNotes?: Record<string, { mod: string; note: string; at: number }[]>;
  muteRoleId?: string;
  suggestionChannelId?: string;
  ticketCategoryId?: string;
  ticketLogChannelId?: string;
  selfRolePanelChannelId?: string;
  counterChannelId?: string;
  warns: Record<string, { reason: string; mod: string; at: number }[]>;
  cases: ModCase[];
  caseCounter: number;
  stickyMessages: Record<string, { content: string; lastMessageId?: string }>;
  reactionRoles: Record<string, Record<string, string>>;
  tempbans: { user: string; expires: number }[];
  temproles: { user: string; role: string; expires: number }[];
  reminders: { user: string; channel: string; text: string; at: number }[];
  giveaways: {
    id: string;
    channel: string;
    message: string;
    prize: string;
    winners: number;
    endsAt: number;
    host: string;
    ended?: boolean;
  }[];
  afk: Record<string, { reason: string; at: number }>;
  automod: {
    badwords: string[];
    blockLinks: boolean;
    blockInvites: boolean;
    blockCaps: boolean;
    capsThreshold: number;
    blockMentions: boolean;
    mentionThreshold: number;
    blockSpam: boolean;
    spamThreshold: number;
  };
  antiraid: { enabled: boolean; joinThreshold: number; window: number };
  lockdown: boolean;
  ticketCounter: number;
  customColorRoles: Record<string, string>; // userId -> roleId
};

type Store = Record<string, GuildSettings>;

function defaults(): GuildSettings {
  return {
    warns: {},
    cases: [],
    caseCounter: 0,
    stickyMessages: {},
    reactionRoles: {},
    tempbans: [],
    temproles: [],
    reminders: [],
    giveaways: [],
    afk: {},
    automod: {
      badwords: [],
      blockLinks: false,
      blockInvites: false,
      blockCaps: false,
      capsThreshold: 70,
      blockMentions: false,
      mentionThreshold: 5,
      blockSpam: false,
      spamThreshold: 5,
    },
    antiraid: { enabled: false, joinThreshold: 8, window: 10 },
    lockdown: false,
    ticketCounter: 0,
    customColorRoles: {},
  };
}

function load(): Store {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(FILE)) return {};
    const raw = JSON.parse(fs.readFileSync(FILE, "utf-8")) as Store;
    for (const k of Object.keys(raw)) {
      raw[k] = { ...defaults(), ...raw[k]! };
      raw[k]!.automod = { ...defaults().automod, ...raw[k]!.automod };
      raw[k]!.antiraid = { ...defaults().antiraid, ...raw[k]!.antiraid };
    }
    return raw;
  } catch {
    return {};
  }
}

let store: Store = load();
let saveTimer: NodeJS.Timeout | null = null;

export function getGuild(guildId: string): GuildSettings {
  if (!store[guildId]) {
    store[guildId] = defaults();
    save();
  }
  return store[guildId]!;
}

export function updateGuild(
  guildId: string,
  updater: (g: GuildSettings) => void,
) {
  const g = getGuild(guildId);
  updater(g);
  save();
}

export function allGuildIds() {
  return Object.keys(store);
}

export function addCase(
  guildId: string,
  c: Omit<ModCase, "id">,
): ModCase {
  const g = getGuild(guildId);
  g.caseCounter += 1;
  const full: ModCase = { ...c, id: g.caseCounter };
  g.cases.push(full);
  save();
  return full;
}

function save() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(store, null, 2));
  }, 200);
}
