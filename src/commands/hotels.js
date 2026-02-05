// src/commands/hotels.js
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getHotelOptions } from '../helpers/hotels.js';

export default {
    data: new SlashCommandBuilder()
        .setName('hotel')
        .setDescription('Check hotel availability and pricing')
        .addStringOption(option =>
            option.setName('city')
                .setDescription('The IATA city code (e.g., NYC, PAR, LON)')
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

        const cityCode = interaction.options.getString('city').toUpperCase();
        const checkIn = interaction.options.getString('check_in');
        const checkOut = interaction.options.getString('check_out');
        const adults = interaction.options.getInteger('adults');

        const result = await getHotelOptions({ cityCode, checkIn, checkOut, adults });

        if (!result.ok) {
            return interaction.editReply(result.message);
        }

        const embed = new EmbedBuilder()
            .setTitle(`🏨 Top Hotel Deals in ${cityCode}`)
            .setDescription(`From ${checkIn} to ${checkOut} for ${adults} adults`)
            .setColor(0x0099FF)
            .setTimestamp();

        result.hotels.forEach(hotel => {
            const stars = hotel.stars > 0 ? '⭐'.repeat(hotel.stars) : 'N/A';
            const searchLink = `https://www.google.com/search?q=${encodeURIComponent(hotel.name + ' ' + hotel.city + ' hotel')}`;

            embed.addFields({
                name: hotel.name,
                value: `**Rating:** ${stars}\n**Price:** ${hotel.price} ${hotel.currency}\n[View Details](${searchLink})`,
                inline: false
            });
        });

        await interaction.editReply({ embeds: [embed] });
    },
};