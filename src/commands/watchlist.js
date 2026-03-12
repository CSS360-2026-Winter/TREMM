// src/commands/watchlist.js
import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import { getWatchlist } from '../helpers/dbHelper.js';

export default {
    data: new SlashCommandBuilder()
        .setName('watchlist')
        .setDescription('View your saved hotels'),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral }); 

        const userId = interaction.user.id;
        let savedHotels;
        
        try {
            savedHotels = await getWatchlist(userId);
        } catch (error) {
            console.error("Error fetching watchlist:", error);
            return interaction.editReply("⚠️ There was an error fetching your watchlist.");
        }

        if (!savedHotels || savedHotels.length === 0) {
            return interaction.editReply("🧳 Your watchlist is currently empty! Use `/newhotel` or `/tripbrief` to find and save some places.");
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

        await interaction.editReply({ embeds: [embed], components: rows });
    },
};