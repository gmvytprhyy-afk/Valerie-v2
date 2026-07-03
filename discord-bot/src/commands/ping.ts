import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../types.js";

const ping: Command = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with pong and shows the bot latency"),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const sent = await interaction.reply({
      content: "Pinging...",
      fetchReply: true,
    });

    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = Math.round(interaction.client.ws.ping);

    await interaction.editReply(
      `🏓 Pong!\n` +
        `> **Roundtrip latency:** ${latency}ms\n` +
        `> **API latency:** ${apiLatency}ms`
    );
  },
};

export default ping;
