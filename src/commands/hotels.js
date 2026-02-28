// src/commands/hotels.js
import { SlashCommandBuilder } from "discord.js";
import { getHotelOptions } from "../helpers/hotels.js";
import { formatPrice } from "../helpers/utils.js";

export default {
  data: new SlashCommandBuilder()
    .setName("hotel")
    .setDescription("Check hotel availability and pricing")
    .addStringOption((option) =>
      option
        .setName("city")
        .setDescription("The IATA city code (e.g., NYC, PAR, LON)")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("check_in").setDescription("YYYY-MM-DD").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("check_out").setDescription("YYYY-MM-DD").setRequired(true)
    )
    .addIntegerOption((option) =>
      option.setName("adults").setDescription("Number of guests").setRequired(true)
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const cityCode = interaction.options.getString("city").toUpperCase();
      const checkIn = interaction.options.getString("check_in");
      const checkOut = interaction.options.getString("check_out");
      const adults = interaction.options.getInteger("adults");

      const result = await getHotelOptions({ cityCode, checkIn, checkOut, adults });

      if (!result.ok) {
        return await interaction.editReply(result.message);
      }

      const lines = [];
      lines.push(`**Top Hotel Deals in ${cityCode}**`);
      lines.push(`**Dates:** ${checkIn} → ${checkOut}`);
      lines.push(`**Guests:** ${adults} adult(s)`);
      lines.push("");

      result.hotels.forEach((hotel, i) => {
        const stars = hotel.stars > 0 ? "⭐".repeat(hotel.stars) : "N/A";
        const searchLink = `https://www.google.com/search?q=${encodeURIComponent(
          `${hotel.name} ${hotel.city} hotel`
        )}`;

        lines.push(`**${i + 1}. ${hotel.name}**`);
        lines.push(`• **Rating:** ${stars}`);
        lines.push(`• **Price:** ${formatPrice(hotel.price, hotel.currency)}`);
        lines.push(`• **Details:** ${searchLink}`);
        lines.push("");
      });

      const message = lines.join("\n").trim();

      await interaction.editReply(message);
    } catch (err) {
      console.error("Hotels command error:", err);
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply("❌ Something went wrong :(");
      } else {
        await interaction.reply("❌ Something went wrong :(");
      }
    }
  },
};
