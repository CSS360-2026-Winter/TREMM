// src/commands/weather.js
const { SlashCommandBuilder } = require("discord.js");
const { getWeather } = require("../helpers/weather.js");

function round(n) {
  return n == null ? null : Math.round(n);
}

function pct01ToPct(pop01) {
  const p = Math.round((pop01 ?? 0) * 100);
  return Number.isFinite(p) ? p : 0;
}

function safeFiniteList(values) {
  return (values ?? []).filter((v) => Number.isFinite(v));
}

function computeWeekStats(days) {
  const mins = safeFiniteList(days.map((d) => d.min));
  const maxs = safeFiniteList(days.map((d) => d.max));

  const weekMin = mins.length ? Math.min(...mins) : null;
  const weekMax = maxs.length ? Math.max(...maxs) : null;

  const peakRainPct = days.length
    ? Math.max(...days.map((d) => pct01ToPct(d.pop)))
    : 0;

  return { weekMin, weekMax, peakRainPct };
}

function buildWeekSummaryLine(days) {
  const { weekMin, weekMax, peakRainPct } = computeWeekStats(days);

  if (weekMin != null && weekMax != null) {
    return `Next 7 days: **${round(weekMin)}°F–${round(weekMax)}°F** • Peak rain chance: **${peakRainPct}%**`;
  }

  return `Next 7 days forecast available`;
}

function formatTempF(value) {
  return value != null ? `${round(value)}°F` : "N/A";
}

function labeledMetric(label, value, suffix) {
  return value != null
    ? `${label}: **${round(value)}${suffix}**`
    : `${label}: **N/A**`;
}

function buildCurrentLines(current) {
  const tempStr = formatTempF(current?.temp);
  const feelsStr = formatTempF(current?.feels);
  const descStr = current?.desc ?? "forecast";

  const humidityText = labeledMetric("Humidity", current?.humidity, "%");
  const windText = labeledMetric("Wind", current?.wind, " mph");

  return {
    headline: `**${tempStr} (feels like ${feelsStr}) — ${descStr}**`,
    metrics: `${humidityText} • ${windText}`,
  };
}

function formatDayLine(d) {
  const popPct = pct01ToPct(d.pop);
  const popText = popPct > 0 ? ` • Rain chance: **${popPct}%**` : "";
  return `• **${d.label}:** ${round(d.min)}°F–${round(d.max)}°F — ${d.desc}${popText}`;
}

function buildWeatherMessage({ location, current, nextDays }) {
  const days = (nextDays ?? []).slice(0, 7);

  const summaryLine = buildWeekSummaryLine(days);
  const { headline, metrics } = buildCurrentLines(current);

  const lines = [
    `**Weather for ${location}**`,
    summaryLine,
    headline,
    metrics,
    ``,
    `**Next 7 days**`,
    ...days.map(formatDayLine),
    ``,
    `_Open-Meteo provides forecasts up to ~16 days (we show 7 here)._`,
  ];

  return lines.join("\n");
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("weather")
    .setDescription("Get current weather + 7-day forecast for a place (short-term)")
    .addStringOption((opt) =>
      opt
        .setName("place")
        .setDescription('Example: "Seattle, WA" or "Paris, FR"')
        .setRequired(true)
    ),

  async execute(interaction) {
    const place = interaction.options.getString("place", true);
    await interaction.deferReply();

    try {
      const result = await getWeather(place);
      if (!result.ok) return interaction.editReply(result.message);

      return interaction.editReply(buildWeatherMessage(result));
    } catch (err) {
      console.error(err);
      return interaction.editReply("Something went wrong fetching weather. Try again in a bit.");
    }
  },
};
