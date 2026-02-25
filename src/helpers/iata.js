// src/helpers/iata.js
// Requires env vars:
// AMADEUS_CLIENT_ID, AMADEUS_CLIENT_SECRET
// Optional: AMADEUS_BASE_URL (defaults to sandbox)

let cachedToken = null; // { access_token, expires_at_ms }

async function getAmadeusToken() {
  const baseUrl = process.env.AMADEUS_BASE_URL || "https://test.api.amadeus.com";
  const clientId = process.env.AMADEUS_CLIENT_ID;
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET;

  if (!clientId || !clientSecret) return null;

  const now = Date.now();
  if (cachedToken && cachedToken.expires_at_ms - 30_000 > now) return cachedToken.access_token;

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(`${baseUrl}/v1/security/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) return null;

  const json = await res.json();
  const expiresInSec = Number(json.expires_in ?? 0);

  cachedToken = {
    access_token: json.access_token,
    expires_at_ms: now + Math.max(60, expiresInSec) * 1000,
  };

  return cachedToken.access_token;
}

async function amadeusLocationsSearch({ keyword, subType }) {
  const token = await getAmadeusToken();
  if (!token) return [];

  const baseUrl = process.env.AMADEUS_BASE_URL || "https://test.api.amadeus.com";
  const url = new URL(`${baseUrl}/v1/reference-data/locations`);
  url.searchParams.set("keyword", keyword);
  url.searchParams.set("subType", subType);

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return [];
  const json = await res.json();
  return Array.isArray(json?.data) ? json.data : [];
}

function looksLikeIata3(s) {
  return typeof s === "string" && /^[A-Za-z]{3}$/.test(s.trim());
}

export async function resolveIataCityCode(place) {
  if (!place) return null;
  if (looksLikeIata3(place)) return place.trim().toUpperCase();

  const data = await amadeusLocationsSearch({ keyword: place, subType: "CITY" });
  const first = data.find((x) => looksLikeIata3(x?.iataCode));
  return first?.iataCode?.toUpperCase() ?? null;
}

export async function resolveIataAirportCode(place) {
  if (!place) return null;
  if (looksLikeIata3(place)) return place.trim().toUpperCase();

  const data = await amadeusLocationsSearch({ keyword: place, subType: "AIRPORT" });
  const first = data.find((x) => looksLikeIata3(x?.iataCode));
  return first?.iataCode?.toUpperCase() ?? null;
}
