// src/events/interactionCreate.js
module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (err) {
      console.error("Command error:", err);

      const msg = "Something went wrong :( Try again in a moment.";

      // ✅ Never reply twice; use editReply if already deferred/replied
      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply(msg);
        } else {
          await interaction.reply({ content: msg, ephemeral: true });
        }
      } catch (e) {
        // If the interaction is already dead, don’t crash the bot
        console.error("Failed to respond to interaction:", e);
      }
    }
  },
};
