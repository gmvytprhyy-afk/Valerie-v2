import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  version as djsVersion,
} from "discord.js";
import { Command } from "../types.js";

const info: Command = {
  data: new SlashCommandBuilder()
    .setName("info")
    .setDescription("Shows information about the bot"),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const client = interaction.client;
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    const uptimeStr = [
      hours > 0 ? `${hours}h` : null,
      minutes > 0 ? `${minutes}m` : null,
      `${seconds}s`,
    ]
      .filter(Boolean)
      .join(" ");

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("Bot Info")
      .setThumbnail(client.user?.displayAvatarURL() ?? null)
      .addFields(
        { name: "Bot Name", value: client.user?.tag ?? "Unknown", inline: true },
        { name: "Servers", value: `${client.guilds.cache.size}`, inline: true },
        { name: "Uptime", value: uptimeStr, inline: true },
        { name: "discord.js", value: `v${djsVersion}`, inline: true },
        {
          name: "Node.js",
          value: process.version,
          inline: true,
        },
        {
          name: "Memory",
          value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)} MB`,
          inline: true,
        }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};

export default info;
