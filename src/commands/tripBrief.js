// src/commands/tripbrief.js
import { SlashCommandBuilder } from "discord.js";
import { getTripBrief } from "../helpers/tripBrief.js";
import { buildTripMessages } from "../helpers/tripmessage.js";

function chunk(text, max = 1900) {
  const lines = String(text ?? "").split("\n");
  const out = [];
  let cur = "";
  for (const line of lines) {
    if ((cur + line + "\n").length > max) {
      out.push(cur.trimEnd());
      cur = "";
    }
    cur += line + "\n";
  }
  if (cur.trim()) out.push(cur.trimEnd());
  return out;
}

export default {
  data: new SlashCommandBuilder()
    .setName("tripbrief")
    .setDescription("Plan a trip: weather + hotels + flights + restaurants + activities")
    .addStringOption((opt) =>
      opt.setName("destination").setDescription('Example: "Paris, FR" or "Los Angeles, CA"').setRequired(true)
    )
    .addStringOption((opt) => opt.setName("depart").setDescription("YYYY-MM-DD").setRequired(true))
    .addStringOption((opt) => opt.setName("return").setDescription("YYYY-MM-DD").setRequired(true))
    .addIntegerOption((opt) => opt.setName("adults").setDescription("Number of adults (default 1)"))
    .addStringOption((opt) => opt.setName("origin").setDescription("Origin airport IATA (optional). Example: SEA")),

  async execute(interaction) {
    await interaction.deferReply();

    const destination = interaction.options.getString("destination", true).trim();
    const departDate = interaction.options.getString("depart", true);
    const returnDate = interaction.options.getString("return", true);
    const adults = interaction.options.getInteger("adults") ?? 1;
    const originAirport = interaction.options.getString("origin")?.trim();

    const brief = await getTripBrief({ destination, departDate, returnDate, adults, originAirport });
    if (!brief.ok) return interaction.editReply(`❌ ${brief.message}`);

    const messages = buildTripMessages(brief); // array of strings

    // First message
    const firstChunks = chunk(messages[0]);
    await interaction.editReply({ content: firstChunks[0] });

    // If summary needed more chunks, send them
    for (let i = 1; i < firstChunks.length; i++) {
      await interaction.followUp({ content: firstChunks[i] });
    }

    // Remaining sections
    for (let i = 1; i < messages.length; i++) {
      const chunks = chunk(messages[i]);
      for (const c of chunks) {
        await interaction.followUp({ content: c });
      }
    }
  },
};

