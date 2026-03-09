import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import { getTripBrief } from "../helpers/tripBrief.js";
import { buildTripMessages } from "../helpers/tripmessage.js";
import { saveTripPlan } from "../helpers/saveTripPlan.js";

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
    .addStringOption((opt) =>
      opt
        .setName("origin")
        .setDescription("Origin airport IATA (optional). Example: SEA")
    )
    .addBooleanOption((opt) =>
      opt
        .setName("save")
        .setDescription("Save this trip brief as a text file")
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply();
    } catch (e) {
      console.error("tripbrief deferReply failed:", e);
      return;
    }

    const destination = interaction.options
      .getString("destination", true)
      .trim();
    const departDate = interaction.options.getString("depart", true);
    const returnDate = interaction.options.getString("return", true);
    const adults = interaction.options.getInteger("adults") ?? 1;
    const originAirport = interaction.options.getString("origin")?.trim();
    const shouldSave = interaction.options.getBoolean("save") ?? false;

    const brief = await getTripBrief({
      destination,
      departDate,
      returnDate,
      adults,
      originAirport,
    });

    if (!brief.ok) {
      return interaction.editReply(`❌ ${brief.message}`);
    }

    const messages = buildTripMessages(brief);

    let saveResult = null;
    let saveFailed = false;

    if (shouldSave) {
      try {
        saveResult = await saveTripPlan({
          userId: interaction.user.id,
          destination,
          departDate,
          returnDate,
          adults,
          originAirport,
          messages,
          brief,
        });
      } catch (err) {
        saveFailed = true;
        console.error("saveTripPlan failed:", err);
      }
    }

    // First message
    const firstChunks = chunk(messages[0]);
    await interaction.editReply({ content: firstChunks[0] });

    // Remaining chunks from first section
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

    // Save confirmation / attachment
    if (saveResult) {
      await interaction.followUp({
        content: `💾 Trip saved successfully.\nTrip ID: \`${saveResult.tripId}\``,
        files: [
          new AttachmentBuilder(saveResult.txtPath, {
            name: saveResult.fileName,
          }),
        ],
      });
    } else if (shouldSave && saveFailed) {
      await interaction.followUp({
        content: "⚠️ Trip was generated, but saving the file failed.",
      });
    }
  },
};
