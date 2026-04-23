import "dotenv/config";

export const config = {
  token: process.env.DISCORD_BOT_TOKEN ?? "",
  clientId: process.env.DISCORD_CLIENT_ID ?? "",
  website: "https://latentshows2.netlify.app/",
  brand: {
    name: "latent",
    primaryColor: 0xf4c2c2,
    accentColor: 0xc8a2c8,
    embedColor: 0xe8b4d8,
  },
};

if (!config.token || !config.clientId) {
  throw new Error("DISCORD_BOT_TOKEN and DISCORD_CLIENT_ID must be set");
}
