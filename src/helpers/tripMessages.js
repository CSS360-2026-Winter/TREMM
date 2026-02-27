// src/helpers/tripMessages.js

function stripHtml(s) {
  return String(s ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function truncate(s, max = 1800) {
  const t = String(s ?? "");
  return t.length > max ? t.slice(0, max - 1) + "…" : t;
}

function statusDot(section) {
  return section?.ok ? "✅" : "⚠️";
}

function sectionLine(name, section) {
  if (!section?.ok) return `${statusDot(section)} ${name}: ${section?.error ?? "failed"}`;
  const innerOk = section.data?.ok !== false;
  return innerOk ? `✅ ${name}` : `⚠️ ${name}: ${section.data?.message ?? "unavailable"}`;
}

function formatRestaurants(result) {
  if (!result?.ok) return result?.message ?? "Restaurants unavailable.";
  const list = (result.restaurants ?? []).slice(0, 7);
  if (!list.length) return "No restaurants found.";
  return list
    .map((r, i) => `${i + 1}. **${r.name}** — ${r.category}\n${r.address}\n${r.url}`)
    .join("\n\n");
}

function formatHotels(result) {
  if (!result?.ok) return result?.message ?? "Hotels unavailable.";
  const list = (result.hotels ?? []).slice(0, 6);
  if (!list.length) return "No hotels found.";
  return list
    .map((h, i) => {
      const stars = h.stars > 0 ? "⭐".repeat(h.stars) : "N/A";
      const price = h.price != null ? `${h.price} ${h.currency ?? ""}`.trim() : "N/A";
      const link = `https://www.google.com/search?q=${encodeURIComponent(h.name + " " + h.city + " hotel")}`;
      return `${i + 1}. **${h.name}** (${stars})\nPrice: **${price}**\n${link}`;
    })
    .join("\n\n");
}

function formatActivities(result) {
  if (!result?.ok) return result?.message ?? "Activities unavailable.";
  const list = (result.activities ?? []).slice(0, 6);
  if (!list.length) return "No activities found.";
  return list
    .map((a, i) => {
      const price = a.price ? `Price: ${a.price}` : null;
      const desc = a.description ? truncate(stripHtml(a.description), 140) : null;
      const link = a.bookingLink ? a.bookingLink : null;
      return [`${i + 1}. **${a.name}**`, price, desc, link].filter(Boolean).join("\n");
    })
    .join("\n\n");
}

function formatWeather(result) {
  if (!result?.ok) return result?.message ?? "Weather unavailable.";
  const loc = result.location ?? "destination";
  const cur = result.current;
  const nextDays = (result.nextDays ?? []).slice(0, 5);

  const headline =
    cur?.temp != null
      ? `Now: **${Math.round(cur.temp)}°F** (feels **${Math.round(cur.feels ?? cur.temp)}°F**) — ${cur.desc ?? "forecast"}`
      : `Weather for **${loc}**`;

  const days = nextDays.length
    ? "\n\n" + nextDays.map((d) => `• **${d.label}:** ${Math.round(d.min)}°F–${Math.round(d.max)}°F — ${d.desc}`).join("\n")
    : "";

  return `${headline}${days}`;
}

function formatFlights(result) {
  if (!result?.ok) return result?.message ?? "Flights unavailable.";

  const pickTop = (oneWay) => {
    if (!oneWay?.ok) return null;
    const flights = (oneWay.flights ?? []).slice(0, 3);
    if (!flights.length) return null;
    return flights
      .map((f, i) => `${i + 1}. **${f.airline}** — **${f.price}** — stops: ${f.stops}\nDepart: ${f.departTime}\nArrive: ${f.arriveTime}`)
      .join("\n\n");
  };

  const outTxt = pickTop(result.outbound) ?? "No outbound flights found.";
  const retTxt = pickTop(result.inbound) ?? "No return flights found.";

  return `**Outbound (${result.origin} → ${result.destAirport})**\n${truncate(outTxt, 850)}\n\n**Return (${result.destAirport} → ${result.origin})**\n${truncate(retTxt, 850)}`;
}

export function buildTripMessages(brief) {
  const { destination, dates, adults, resolved, sections } = brief;

  const statusLines = [
    sectionLine("Weather", sections.weather),
    sectionLine("Restaurants", sections.restaurants),
    sectionLine("Activities", sections.activities),
    sectionLine("Hotels", sections.hotels),
    sectionLine("Flights", sections.flights),
  ].join("\n");

  const summary =
    `🧳 **Trip Plan: ${destination}**\n` +
    `Dates: ${dates.departDate} → ${dates.returnDate} (**${dates.tripLenDays} nights**) • Adults: ${adults}\n\n` +
    `**Status**\n${statusLines}\n\n` +
    `**Resolved codes**\n` +
    `City: ${resolved.cityCode ?? "N/A"}\n` +
    `Origin airport: ${resolved.originAirport ?? "N/A"}\n` +
    `Dest airport: ${resolved.destAirport ?? "N/A"}\n\n` +
    `**Limits & notes**\n` +
    `• Weather is short-term (Open-Meteo limited ~16 days).\n` +
    `• Activities may be limited (Amadeus sandbox + fallbacks).\n` +
    `• Hotels need IATA city codes; Flights need IATA airport codes.`;

  const weather = `☁️ **Weather snapshot**\n${formatWeather(sections.weather.data)}`;
  const restaurants = `🍽️ **Top restaurants**\n${formatRestaurants(sections.restaurants.data)}`;
  const activities = `🎟️ **Activities**\n${formatActivities(sections.activities.data)}`;
  const hotels = `🏨 **Hotels**\n${formatHotels(sections.hotels.data)}`;
  const flights = `✈️ **Flights (round trip = 2 one-ways)**\n${formatFlights(sections.flights.data)}`;

  return [summary, weather, restaurants, activities, hotels, flights];
}
