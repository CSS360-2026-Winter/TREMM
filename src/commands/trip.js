import { SlashCommandBuilder } from "discord.js";
import { geocodePlace } from "../helpers/geocode.js";
import { getActivitiesByLatLon } from "../helpers/amadeus.js";

export default {
  data: new SlashCommandBuilder()
    .setName("trip")
    .setDescription("Trip planning commands")
    .addSubcommand((sub) =>
      sub
        .setName("activities")
        .setDescription("Get tours and activities for any destination city")
        .addStringOption((opt) =>
          opt
            .setName("destination")
            .setDescription('Example: "Los Angeles, CA" or "Bali, Indonesia"')
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const destination = interaction.options.getString("destination");

    const stripHtml = (s) =>
      (s || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

    const shorten = (s, n = 160) => {
      const t = stripHtml(s);
      return t.length > n ? t.slice(0, n - 1) + "…" : t;
    };

    const geo = await geocodePlace(destination);
    if (!geo) {
      await interaction.editReply(
        `❌ I couldn’t find **${destination}**. Try a more specific format like "City, Country".`
      );
      return;
    }

    let activities = [];
    let source = "Amadeus (sandbox)";

    try {
      activities = await getActivitiesByLatLon(geo.lat, geo.lon);
    } catch {
      activities = [];
    }

    if (!activities.length) {
      source = "Fallback suggestions (limited sandbox coverage)";
      activities = [
        { name: `City highlights tour in ${destination}` },
        { name: `Food tasting / local cuisine in ${destination}` },
        { name: `Top museum or cultural site in ${destination}` },
        { name: `Nature walk or scenic viewpoint in ${destination}` },
        { name: `Popular neighborhood exploration in ${destination}` },
      ];
    }

    // ---- Plain text output with correct spacing ----
    let message = `**Activities Near ${destination}**\n`;
    message += `Source: ${source}\n\n`;
    
    activities.slice(0, 5).forEach((a, i) => {
        const price = a.price ? a.price : "N/A";
        const desc = a.description ? shorten(a.description, 160) : "";
        const link = a.bookingLink ? `\nBook: ${a.bookingLink}` : "";
      
        // Title
        message += `**${i + 1}. ${a.name}**\n`;
      
        // Text immediately under title
        message += `Price: ${price}`;
        if (desc) message += ` — ${desc}`;
      
        // Booking link (only shows if API provides it)
        message += link;
      
        // ONE blank line before next title
        message += `\n\n`;
      });


    await interaction.editReply(message);
  },
};
