
//THIS FILE IS JUST A DEMO FOR PHYICALLY SHOWING THE API RETRIES IN DISCORD!!

import { SlashCommandBuilder } from 'discord.js';
import { getHotelOptionsRetryDemo } from '../helpers/hotels.js'; 

export default {
    data: new SlashCommandBuilder()
        .setName('hoteldemo')
        .setDescription('Demo: Show API retry logic in action')
        .addStringOption(option =>
            option.setName('city')
                  .setDescription('City code for demo')
                  .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();

        const cityCode = interaction.options.getString('city').toUpperCase();

        try {
            const result = await getHotelOptionsRetryDemo({
                cityCode,
                retryCallback: async msg => await interaction.followUp(`${msg}`)
            });

            await interaction.editReply(`${result.message}`);
        } catch (err) {
            console.error('Hotel demo error:', err);
            await interaction.editReply('Something went wrong in the demo.');
        }
    },
};