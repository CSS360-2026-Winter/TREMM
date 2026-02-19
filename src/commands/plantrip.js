// src/commands/plantrip.js
const { SlashCommandBuilder } = require('discord.js');
const { geocodePlace } = require('../helpers/geocode.js'); // your helper

// -------------------- Date validation helper --------------------
function validateDates(input) {
  const parts = input.split('to').map(p => p.trim());
  if (parts.length !== 2) return { ok: false, message: 'Dates must be in format YYYY-MM-DD to YYYY-MM-DD.' };

  const start = new Date(parts[0]);
  const end = new Date(parts[1]);

  if (isNaN(start) || isNaN(end)) return { ok: false, message: 'Invalid date(s). Use YYYY-MM-DD.' };
  if (end < start) return { ok: false, message: 'End date cannot be before start date.' };

  return { ok: true, start, end };
}

// -------------------- Destination validation helper --------------------
async function validateDestination(place) {
  const geo = await geocodePlace(place);
  if (!geo) return { ok: false, message: `Could not find "${place}". Try a real place, like "Seattle, WA"` };
  return { ok: true, geo };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('plantrip')
    .setDescription('Start Planning a Trip!'),

  async execute(interaction) {
    // Must defer reply first in Discord.js v14
    await interaction.deferReply();

    const tripDetails = { destination: '', dates: '' };
    const filter = m => m.author.id === interaction.user.id;

    // -------------------- STEP 1: Destination --------------------
    let destinationValid = false;
    while (!destinationValid) {
      await interaction.followUp('Where Do You Want to Go For the Trip?');

      let collected;
      try {
        collected = await interaction.channel.awaitMessages({
          filter,
          max: 1,
          time: 60000,
          errors: ['time'],
        });
      } catch {
        return interaction.followUp('You took too long to provide a destination. Trip planning cancelled.');
      }

      const destInput = collected.first().content;
      const destCheck = await validateDestination(destInput);

      if (!destCheck.ok) {
        await interaction.followUp(destCheck.message + ' Please try again.');
      } else {
        tripDetails.destination = destCheck.geo.displayName;
        destinationValid = true;
      }
    }

    // -------------------- STEP 2: Dates --------------------
    let datesValid = false;
    while (!datesValid) {
      await interaction.followUp('What are the trip dates? (YYYY-MM-DD to YYYY-MM-DD)');

      let collected;
      try {
        collected = await interaction.channel.awaitMessages({
          filter,
          max: 1,
          time: 60000,
          errors: ['time'],
        });
      } catch {
        return interaction.followUp('You took too long to provide dates. Trip planning cancelled.');
      }

      const dateInput = collected.first().content;
      const dateCheck = validateDates(dateInput);

      if (!dateCheck.ok) {
        await interaction.followUp(dateCheck.message + ' Please try again.');
      } else {
        tripDetails.dates = `${dateCheck.start.toISOString().split('T')[0]} to ${dateCheck.end.toISOString().split('T')[0]}`;
        datesValid = true;
      }
    }

    await interaction.followUp(
      `**Trip Plan Created:**\n**Destination:** ${tripDetails.destination}\n**Dates:** ${tripDetails.dates}`
    );
  },
};