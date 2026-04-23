import { EmbedBuilder } from "discord.js";
import { config } from "./config.js";

export function aestheticEmbed(opts: {
  title?: string;
  description?: string;
  color?: number;
  footer?: string;
  thumbnail?: string;
  image?: string;
  fields?: { name: string; value: string; inline?: boolean }[];
}) {
  const e = new EmbedBuilder()
    .setColor(opts.color ?? config.brand.embedColor)
    .setTimestamp();
  if (opts.title) e.setTitle(opts.title);
  if (opts.description) e.setDescription(opts.description);
  if (opts.footer) e.setFooter({ text: opts.footer });
  else e.setFooter({ text: `⋆˚࿔ ${config.brand.name} ⊹` });
  if (opts.thumbnail) e.setThumbnail(opts.thumbnail);
  if (opts.image) e.setImage(opts.image);
  if (opts.fields) e.addFields(opts.fields);
  return e;
}

export function successEmbed(description: string) {
  return aestheticEmbed({
    description: `࿔*:･ﾟ ${description}`,
    color: 0xb5e8b0,
  });
}

export function errorEmbed(description: string) {
  return aestheticEmbed({
    description: `✗ ${description}`,
    color: 0xf4a4a4,
  });
}
