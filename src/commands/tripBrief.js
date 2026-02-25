// src/commands/tripbrief.js
import { SlashCommandBuilder } from "discord.js";
import { getTripBrief } from "../helpers/tripBrief.js";
import { buildTripEmbeds } from "../helpers/tripEmbeds.js";

export default {
  data: new SlashCommandBuilder()
    .setName("tripbrief")
    .setDescription("Plan a trip: weather + hotels + flights + restaurants + activities")
    .addStringOption((opt) =>
      opt
        .setName("destination")
        .setDescription('Example: "Paris, FR" or "Los Angeles, CA"')
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("depart").setDescription("YYYY-MM-DD").setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("return").setDescription("YYYY-MM-DD").setRequired(true)
    )
    .addIntegerOption((opt) =>
      opt.setName("adults").setDescription("Number of adults (default 1)")
    )
    // Optional, but makes flights actually usable if auto-resolve fails.
    // Your current /flights command requires origin airport IATA :contentReference[oaicite:9]{index=9}
    .addStringOption((opt) =>
      opt
        .setName("origin")
        .setDescription("Origin airport IATA (optional). Example: SEA")
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const destination = interaction.options.getString("destination", true).trim();
    const departDate = interaction.options.getString("depart", true);
    const returnDate = interaction.options.getString("return", true);
    const adults = interaction.options.getInteger("adults") ?? 1;
    const originAirport = interaction.options.getString("origin")?.trim();

    const brief = await getTripBrief({
      destination,
      departDate,
      returnDate,
      adults,
      originAirport,
    });

    if (!brief.ok) return interaction.editReply(`❌ ${brief.message}`);

    const embeds = buildTripEmbeds(brief);

    // Discord allows multiple embeds per message; keep it tidy
    await interaction.editReply({ embeds: [embeds[0]] });

    // Follow-up in small batches (safer if embeds get big)
    const rest = embeds.slice(1);
    for (let i = 0; i < rest.length; i += 2) {
      await interaction.followUp({ embeds: rest.slice(i, i + 2) });
    }
  },
};
