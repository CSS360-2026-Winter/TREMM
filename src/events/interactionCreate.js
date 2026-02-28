// src/events/interactionCreate.js
import { Events } from "discord.js";

export default {
  name: Events.InteractionCreate,
  async execute(interaction) {
    try {
      if (!interaction.isChatInputCommand()) return;

      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) return;

      // IMPORTANT: don't defer/reply here. Commands handle it.
      await command.execute(interaction);
    } catch (error) {
      console.error("Failed to handle interaction:", error);

      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply("⚠️ Something went wrong. Please try again.");
        } else {
          await interaction.reply({
            content: "⚠️ Something went wrong. Please try again.",
            ephemeral: true,
          });
        }
      } catch (e) {
        console.error("Failed to send error response:", e);
      }
    }
  },
};