const { SlashCommandBuilder } = require("discord.js");
const { getFlightOptions } = require("../helpers/flights");

// Format ISO datetime like "2026-02-20T09:18:00" → "Feb 20 • 9:18 AM"
function formatDateTime(isoString) {
  if (!isoString || isoString === "N/A") return "N/A";

  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return isoString;

  const date = d.toLocaleDateString([], { month: "short", day: "numeric" });
  const time = d.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${date} • ${time}`;
}

// Stops label
function formatStops(stops) {
  if (stops === 0) return "Nonstop";
  if (stops === 1) return "1 stop";
  return `${stops} stops`;
}

// Remove duplicate flights
function dedupeFlights(flights) {
  const seen = new Set();
  const unique = [];

  for (const f of flights) {
    const key = `${f.airline}|${f.price}|${f.departTime}|${f.arriveTime}|${f.stops}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(f);
  }

  return unique;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("flights")
    .setDescription("Get up to 5 flight options for a one-way trip.")
    .addStringOption((opt) =>
      opt
        .setName("origin")
        .setDescription("Origin airport IATA code (e.g., SEA)")
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("destination")
        .setDescription("Destination airport IATA code (e.g., LAX)")
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("date")
        .setDescription("Departure date (YYYY-MM-DD)")
        .setRequired(true)
    )
    .addIntegerOption((opt) =>
      opt.setName("adults").setDescription("Number of adults")
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const origin = interaction.options.getString("origin").toUpperCase();
    const destination = interaction.options
      .getString("destination")
      .toUpperCase();
    const departureDate = interaction.options.getString("date");
    const adults = interaction.options.getInteger("adults") || 1;

    const result = await getFlightOptions({
      origin,
      destination,
      departureDate,
      adults,
    });

    if (!result.ok) {
      return interaction.editReply(result.message);
    }

    const flights = dedupeFlights(result.flights).slice(0, 5);

    const header = `✈️ **Flights ${origin} → ${destination}** on **${departureDate}** (Adults: **${adults}**)`;

    const flightBlocks = flights.map((f, i) => {
      return (
        `**${i + 1}. ${f.airline}**\n` +
        `| **${f.price}** | **${formatStops(f.stops)}**\n` +
        `Depart: **${formatDateTime(f.departTime)}**\n` +
        `Arrive: **${formatDateTime(f.arriveTime)}**`
      );
    });

    return interaction.editReply(
      `${header}\n\n${flightBlocks.join("\n\n──────────────\n\n")}`
    );
  },
};
