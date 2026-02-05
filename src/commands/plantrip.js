const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('plantrip')
    .setDescription('Start planning a group trip!'),

  async execute(interaction) {
    // 1. Create a storage object to 'hold' the data during this command run
    const tripDetails = {
      destination: '',
      dates: ''
    };

    await interaction.reply('Where do you want to go for the trip?');

    // Only listen to the person who started the command
    const filter = m => m.author.id === interaction.user.id;

    // --- STEP 1: Collect Destination ---
    const destinationCollector = interaction.channel.createMessageCollector({ 
        filter, 
        max: 1, 
        time: 60000 
    });

    destinationCollector.on('collect', m1 => {
      tripDetails.destination = m1.content; // Save to our object

      interaction.followUp('What are the trip dates? (MM/DD/YYYY to MM/DD/YYYY)');

      // --- STEP 2: Collect Dates (Nested inside the first) ---
      const datesCollector = interaction.channel.createMessageCollector({ 
          filter, 
          max: 1, 
          time: 60000 
      });

      datesCollector.on('collect', m2 => {
        tripDetails.dates = m2.content; // Save to our object
        
        // --- STEP 3: Final Output ---
        // Now we can use both tripDetails.destination and tripDetails.dates
        interaction.followUp(
            `**Trip Plan Created:**\n` +
            `**Destination:** ${tripDetails.destination}\n` +
            `**Dates:** ${tripDetails.dates}`
        );
      });

      datesCollector.on('end', collected => {
        if (collected.size === 0) {
          interaction.followUp('You took too long to provide dates. Trip planning cancelled.');
        }
      });
    });

    destinationCollector.on('end', collected => {
      if (collected.size === 0) {
        interaction.followUp('You took too long to provide a destination. Trip planning cancelled.');
      }
    });
  },
};
