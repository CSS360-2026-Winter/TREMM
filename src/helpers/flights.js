// src/helpers/flights.js
import Amadeus from "amadeus";

// Small airline code → name map (easy to extend)
const AIRLINES = {
  F9: "Frontier Airlines",
  AS: "Alaska Airlines",
  HA: "Hawaiian Airlines",
  AA: "American Airlines",
  DL: "Delta Air Lines",
  UA: "United Airlines",
  WN: "Southwest Airlines",
};

async function getFlightOptions({ origin, destination, departureDate, adults = 1 }) {
  if (!origin || !destination || !departureDate) {
    return {
      ok: false,
      message: "Missing required fields. Need origin, destination, and departureDate (YYYY-MM-DD).",
    };
  }

  const amadeusClientId = process.env.AMADEUS_CLIENT_ID;
  const amadeusClientSecret = process.env.AMADEUS_CLIENT_SECRET;

  if (!amadeusClientId || !amadeusClientSecret) {
    return {
      ok: false,
      message:
        "Amadeus credentials not found. Set AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET in Codespaces secrets.",
    };
  }

  const amadeus = new Amadeus({
    clientId: amadeusClientId,
    clientSecret: amadeusClientSecret,
  });

  try {
    const response = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: origin.toUpperCase(),
      destinationLocationCode: destination.toUpperCase(),
      departureDate,
      adults,
      max: 5,
    });

    const offers = response?.data || [];

    if (offers.length === 0) {
      return {
        ok: false,
        message: `No flights found for ${origin.toUpperCase()} → ${destination.toUpperCase()} on ${departureDate}.`,
      };
    }

    const simplified = offers.slice(0, 5).map((offer) => {
      const itinerary = offer.itineraries?.[0];
      const segments = itinerary?.segments || [];

      const firstSeg = segments[0];
      const lastSeg = segments[segments.length - 1];

      const stops = Math.max(0, segments.length - 1);
      const price = offer.price?.total;

      const code = firstSeg?.carrierCode;
      const airline = AIRLINES[code]
        ? `${AIRLINES[code]} (${code})`
        : code || "N/A";

      return {
        airline,
        price: price ? `$${price}` : "N/A",
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

export { getFlightOptions };
