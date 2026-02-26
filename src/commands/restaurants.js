import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getTopRestaurants } from "../helpers/restaurants.js";

export default {
  data: new SlashCommandBuilder()
    .setName("restaurants")
    .setDescription("Find Top Restaurants in a Location")
    .addStringOption(opt =>
      opt
        .setName("location")
        .setDescription("City or Place Name to Search Restaurants in (e.g. Seattle, Paris)")
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const location = interaction.options.getString("location")?.trim();
    if (!location) return interaction.editReply("Invalid Location Provided. Please Enter a City or Place Name.");

    try {
      const result = await getTopRestaurants({ location });
      if (!result.ok) return interaction.editReply(result.message);

      const embed = new EmbedBuilder()
        .setTitle(`Top Restaurants in ${location}`)
        .setColor(0x663399); 

      result.restaurants.forEach((r, index) => {
        embed.addFields({
          name: `${index + 1}. ${r.name}`,
          value: `**Category:** ${r.category}
**Address:** ${r.address}
[View on Google](${r.url})`,
          inline: false
        });
      });

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error("restaurants command error:", err);
      await interaction.editReply("Something Went Wrong With Getting Restaurants.");
    }
  }
};