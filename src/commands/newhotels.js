// src/commands/newhotels.js
import { SlashCommandBuilder } from 'discord.js';
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

        result.hotels.forEach(hotel => {
            const stars = hotel.stars > 0 ? '⭐'.repeat(hotel.stars) : 'N/A';
            const searchLink = `https://www.google.com/search?q=${encodeURIComponent(hotel.name + ' ' + hotel.city + ' hotel')}`;

            textMessage += `**${hotel.name}**\n`;
            textMessage += `> **Rating:** ${stars}\n`;
            textMessage += `> **Price Per Night:** $${hotel.price} ${hotel.currency}\n`;
            textMessage += `> **Total Price:** $${hotel.totalPrice} ${hotel.currency}\n`; // Added total price line
            textMessage += `> [View Details](<${searchLink}>)\n\n`; 
        });

        await interaction.editReply(textMessage);
    },
};