// src/helpers/flights.js (CommonJS + dynamic import for ESM utils)

const Amadeus = require("amadeus");

const AIRLINES = {
  F9: "Frontier Airlines",
  AS: "Alaska Airlines",
  HA: "Hawaiian Airlines",
  AA: "American Airlines",
  DL: "Delta Air Lines",
  UA: "United Airlines",
  WN: "Southwest Airlines",
};

// Lazy-load ESM util safely from CommonJS
let _formatPrice = null;
async function getFormatPrice() {
  if (_formatPrice) return _formatPrice;

  // IMPORTANT: include the .js extension
  const mod = await import("./utils.js");
  _formatPrice = mod.formatPrice || (mod.default && mod.default.formatPrice);

  if (typeof _formatPrice !== "function") {
    throw new Error("formatPrice was not found in ./utils.js");
  }
  return _formatPrice;
}

async function getFlightOptions({ origin, destination, departureDate, adults = 1 }) {
  if (!origin || !destination || !departureDate) {
    return {
      ok: false,
      message:
        "Missing required fields. Need origin, destination, and departureDate (YYYY-MM-DD).",
    };
  }

  const amadeusClientId = process.env.AMADEUS_CLIENT_ID;
  const amadeusClientSecret = process.env.AMADEUS_CLIENT_SECRET;

  if (!amadeusClientId || !amadeusClientSecret) {
    return {
      ok: false,
      message:
        "Amadeus credentials not found. Set AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET in your deployment env vars.",
    };
  }

  const amadeus = new Amadeus({
    clientId: amadeusClientId,
    clientSecret: amadeusClientSecret,
  });

  const MAX_RETRIES = 2;
  const BASE_DELAY = 500;

  try {
    let response;
    let lastError;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        response = await amadeus.shopping.flightOffersSearch.get({
          originLocationCode: origin.toUpperCase(),
          destinationLocationCode: destination.toUpperCase(),
          departureDate,
          adults,
          max: 5,
        });
        break;
      } catch (err) {
        lastError = err;
        const status = err?.response?.statusCode;

        if (status && status >= 400 && status < 500) throw err;
        if (attempt === MAX_RETRIES) throw lastError;

        await new Promise((r) => setTimeout(r, BASE_DELAY * (attempt + 1)));
      }
    }

    const offers = response?.data || [];

    // Sandbox often returns empty; treat as OK so the bot doesn't look broken
    if (offers.length === 0) {
      return {
        ok: true,
        flights: [],
        note:
          "Amadeus sandbox often returns empty results for many routes/dates. Try major hubs and nearer dates (SEA→LAX, LAX→JFK).",
      };
    }

    const formatPrice = await getFormatPrice();

    const simplified = offers.slice(0, 5).map((offer) => {
      const itinerary = offer.itineraries?.[0];
      const segments = itinerary?.segments || [];

      const firstSeg = segments[0];
      const lastSeg = segments[segments.length - 1];

      const stops = Math.max(0, segments.length - 1);
      const price = offer.price?.total;

      const code = firstSeg?.carrierCode;
      const airline = AIRLINES[code] ? `${AIRLINES[code]} (${code})` : code || "N/A";

      return {
        airline,
        price: formatPrice(price, "USD"),
        departTime: firstSeg?.departure?.at || "N/A",
        arriveTime: lastSeg?.arrival?.at || "N/A",
        stops,
      };
    });

    return { ok: true, flights: simplified };
  } catch (err) {
    const status = err?.response?.statusCode;
    const msg = err?.description || err?.message || "Unknown error";

    return {
      ok: false,
      message: `Flight API error${status ? ` (${status})` : ""}: ${msg}`,
    };
  }
}

module.exports = { getFlightOptions };