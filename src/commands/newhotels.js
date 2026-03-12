// src/commands/newhotels.js
import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getNewHotelOptions } from '../helpers/newhotels.js';

export default {
    data: new SlashCommandBuilder()
        .setName('newhotel')
        .setDescription('Check hotel availability using SerpApi (Google Hotels)')
        .addStringOption(option =>
            option.setName('city')
                .setDescription('City name or IATA code (e.g., Seattle, NYC)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('check_in')
                .setDescription('YYYY-MM-DD')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('check_out')
                .setDescription('YYYY-MM-DD')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('adults')
                .setDescription('Number of guests')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();

        const cityCode = interaction.options.getString('city');
        const checkIn = interaction.options.getString('check_in');
        const checkOut = interaction.options.getString('check_out');
        const adults = interaction.options.getInteger('adults');

        const result = await getNewHotelOptions({ cityCode, checkIn, checkOut, adults });

        if (!result.ok) {
            return interaction.editReply(result.message);
        }

        let textMessage = `🏨 **Top Hotel Deals in ${cityCode.toUpperCase()}**\n`;
        textMessage += `*From ${checkIn} to ${checkOut} for ${adults} adults*\n\n`;

        const rows = [];
        let currentRow = new ActionRowBuilder();

        result.hotels.forEach((hotel, index) => {
            const stars = hotel.stars > 0 ? '⭐'.repeat(hotel.stars) : 'N/A';
            const searchLink = `https://www.google.com/search?q=${encodeURIComponent(hotel.name + ' ' + hotel.city + ' hotel')}`;

            textMessage += `**${index + 1}. ${hotel.name}**\n`;
            textMessage += `> **Rating:** ${stars}\n`;
            textMessage += `> **Price Per Night:** $${hotel.price} ${hotel.currency}\n`;
            textMessage += `> **Total Price:** $${hotel.totalPrice} ${hotel.currency}\n`; 
            textMessage += `> [View Details](<${searchLink}>)\n\n`; 

            const safeName = encodeURIComponent(hotel.name.substring(0, 60));
            const button = new ButtonBuilder()
                .setCustomId(`watchlist_${safeName}`)
                .setLabel(`⭐ Save #${index + 1}`)
                .setStyle(ButtonStyle.Primary);

            currentRow.addComponents(button);

            if (currentRow.components.length === 5) {
                rows.push(currentRow);
                currentRow = new ActionRowBuilder();
            }
        });

        if (currentRow.components.length > 0) {
            rows.push(currentRow);
        }

        await interaction.editReply({ content: textMessage, components: rows });
    },
};