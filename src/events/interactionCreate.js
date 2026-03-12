// src/events/interactionCreate.js
import { Events, MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { addHotelToWatchlist, removeHotelFromWatchlist, getWatchlist, clearWatchlist } from '../helpers/dbHelper.js';

export default {
  name: Events.InteractionCreate,
  async execute(interaction) {
    try {
      if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) return;
        await command.execute(interaction);
      } 
      else if (interaction.isButton()) {
        
        if (interaction.customId.startsWith('watchlist_')) {
          const encodedName = interaction.customId.replace('watchlist_', '');
          const hotelName = decodeURIComponent(encodedName);
          const userId = interaction.user.id;

          try {
            await addHotelToWatchlist(userId, hotelName, hotelName);
            
            await interaction.reply({ 
              content: `✅ **${hotelName}** has been saved!`, 
              flags: MessageFlags.Ephemeral 
            });
          } catch (err) {
            console.error("Database save error:", err);
            await interaction.reply({ 
              content: "⚠️ Something went wrong saving this hotel, or it's already on your list.", 
              flags: MessageFlags.Ephemeral  
            });
          }
        }
        
        else if (interaction.customId.startsWith('removehotel_')) {
          const encodedName = interaction.customId.replace('removehotel_', '');
          const hotelName = decodeURIComponent(encodedName);
          const userId = interaction.user.id;

          try {
            await removeHotelFromWatchlist(userId, hotelName);
            
            const savedHotels = await getWatchlist(userId);

            if (!savedHotels || savedHotels.length === 0) {
                return interaction.update({ 
                    content: `❌ **${hotelName}** removed. \n\n🧳 Your watchlist is now empty!`,
                    embeds: [], 
                    components: [] 
                });
            }

            const embed = new EmbedBuilder()
                .setTitle('⭐ Your Hotel Watchlist')
                .setColor(0x00ae86)
                .setDescription('Here are the hotels you have saved for later:');

            const rows = [];
            let currentRow = new ActionRowBuilder();

            savedHotels.forEach((hotel, index) => {
                embed.addFields({ name: `${index + 1}. ${hotel.hotel_name}`, value: '\u200B' });

                const safeName = encodeURIComponent(hotel.hotel_name.substring(0, 50));
                const removeButton = new ButtonBuilder()
                    .setCustomId(`removehotel_${safeName}`)
                    .setLabel(`❌ Remove #${index + 1}`)
                    .setStyle(ButtonStyle.Danger);

                currentRow.addComponents(removeButton);

                if (currentRow.components.length === 5) {
                    rows.push(currentRow);
                    currentRow = new ActionRowBuilder();
                }
            });

            if (currentRow.components.length > 0) {
                rows.push(currentRow);
            }
            const clearRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('clearwatchlist')
                    .setLabel('🗑️ Clear All')
                    .setStyle(ButtonStyle.Secondary)
            );
            rows.push(clearRow);

            await interaction.update({ embeds: [embed], components: rows });

          } catch (err) {
            console.error("Database delete error:", err);
            await interaction.reply({ 
              content: "⚠️ Something went wrong removing this hotel.", 
              flags: MessageFlags.Ephemeral 
            });
          }
        }
        else if (interaction.customId === 'clearwatchlist') {
          const userId = interaction.user.id;
          try {
            await clearWatchlist(userId);
            await interaction.update({ 
                content: "🧹 **Your watchlist has been completely cleared!**",
                embeds: [], 
                components: [] 
            });
          } catch (err) {
            console.error("Database clear error:", err);
            await interaction.reply({ 
              content: "⚠️ Something went wrong clearing your watchlist.", 
              flags: MessageFlags.Ephemeral 
            });
          }
        }
      }

    } catch (error) {
      console.error("Failed to handle interaction:", error);

      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply("⚠️ Something went wrong. Please try again.");
        } else {
          await interaction.reply({
            content: "⚠️ Something went wrong. Please try again.",
            flags: MessageFlags.Ephemeral,
          });
        }
      } catch (e) {
        console.error("Failed to send error response:", e);
      }
    }
  },
};