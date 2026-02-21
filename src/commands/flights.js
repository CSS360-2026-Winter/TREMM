// src/commands/flights.js
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

/* -------------------- NEW: validation helpers -------------------- */

function normalizeIata(code) {
  return (code || "").trim().toUpperCase();
}

function isValidIata(code) {
  return /^[A-Z]{3}$/.test(code);
}

function parseISODate(dateStr) {
  // Expected: YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;

  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));

  // Validate it didn't overflow (e.g., 2026-02-99)
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d
  ) {
    return null;
  }
  return dt;
}

function isPastDateUTC(dt) {
  const now = new Date();
  const todayUTC = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  return dt < todayUTC;
}

function validateInputs({ origin, destination, departureDate, adults }) {
  if (!isValidIata(origin)) {
    return "❌ Invalid origin airport code. Please use a 3-letter IATA code like SEA.";
  }
  if (!isValidIata(destination)) {
    return "❌ Invalid destination airport code. Please use a 3-letter IATA code like LAX.";
  }

  const dateObj = parseISODate(departureDate);
  if (!dateObj) {
    return "❌ Invalid date. Please use YYYY-MM-DD (example: 2026-03-10).";
  }
  if (isPastDateUTC(dateObj)) {
    return "❌ That date is in the past. Please choose today or a future date.";
  }

  if (!Number.isInteger(adults) || adults < 1 || adults > 9) {
    return "❌ Invalid adults value. Please choose a number from 1 to 9.";
  }

  return null;
}

/* -------------------- NEW: response formatting helper -------------------- */

function buildFlightsMessage({ origin, destination, departureDate, adults, flights }) {
  const header = `✈️ **Flights ${origin} → ${destination}** on **${departureDate}** (Adults: **${adults}**)`;

  if (!flights || flights.length === 0) {
    return `${header}\n\nNo flights found. Try a different date or route.`;
  }

  const flightBlocks = flights.map((f, i) => {
    return (
      `**${i + 1}. ${f.airline}**\n` +
      `| **${f.price}** | **${formatStops(f.stops)}**\n` +
      `Depart: **${formatDateTime(f.departTime)}**\n` +
      `Arrive: **${formatDateTime(f.arriveTime)}**`
    );
  });

  return `${header}\n\n${flightBlocks.join("\n\n──────────────\n\n")}`;
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
    // Read + normalize first (so we can validate before deferReply)
    const origin = normalizeIata(interaction.options.getString("origin"));
    const destination = normalizeIata(interaction.options.getString("destination"));
    const departureDate = (interaction.options.getString("date") || "").trim();
    const adults = interaction.options.getInteger("adults") ?? 1;

    // Validate BEFORE searching flights
    const validationError = validateInputs({
      origin,
      destination,
      departureDate,
      adults,
    });

    if (validationError) {
      return interaction.reply({ content: validationError, ephemeral: true });
    }

    // Now do the slower work
    await interaction.deferReply();

    try {
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

      const message = buildFlightsMessage({
        origin,
        destination,
        departureDate,
        adults,
        flights,
      });

      return interaction.editReply(message);
    } catch (err) {
      console.error("Flight command error:", err);
      return interaction.editReply(
        "⚠️ Something went wrong while searching flights. Please try again in a moment."
      );
    }
  },
};