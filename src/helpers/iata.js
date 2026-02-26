// src/helpers/iata.js

const BASE_URL = process.env.AMADEUS_BASE_URL || "https://test.api.amadeus.com";

// Support multiple env naming styles (in case your repo uses different names)
const CLIENT_ID =
  process.env.AMADEUS_CLIENT_ID ||
  process.env.AMADEUS_API_KEY ||
  process.env.AMADEUS_KEY;

const CLIENT_SECRET =
  process.env.AMADEUS_CLIENT_SECRET ||
  process.env.AMADEUS_API_SECRET ||
  process.env.AMADEUS_SECRET;

let cachedToken = null; // { token: string, expiresAt: number }
const cache = new Map(); // placeKey -> { cityCode, airportCode }

function looksLikeIata3(s) {
  return typeof s === "string" && /^[A-Za-z]{3}$/.test(s.trim());
}

function normalizePlace(s) {
  return String(s ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s,.-]/g, "");
}

function buildKeywordAttempts(place) {
  const p = normalizePlace(place);
  const attempts = new Set();

  // full string
  attempts.add(p);

  // before comma ("Seattle, WA" -> "Seattle")
  const beforeComma = p.split(",")[0]?.trim();
  if (beforeComma) attempts.add(beforeComma);

  // remove common state/country codes at end ("Dallas TX" -> "Dallas")
  const tokens = beforeComma.split(" ");
  if (tokens.length >= 2) {
    const last = tokens[tokens.length - 1];
    if (/^[A-Za-z]{2}$/.test(last)) attempts.add(tokens.slice(0, -1).join(" "));
  }

  // only first word (helps weird inputs)
  attempts.add(beforeComma.split(" ")[0]);

  return [...attempts].filter(Boolean);
}

async function getAmadeusToken() {
  if (!CLIENT_ID || !CLIENT_SECRET) return null;

  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt - 30_000 > now) return cachedToken.token;

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  });

  const res = await fetch(`${BASE_URL}/v1/security/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) return null;

  const json = await res.json();
  const expiresInSec = Number(json.expires_in ?? 0);

  cachedToken = {
    token: json.access_token,
    expiresAt: now + Math.max(60, expiresInSec) * 1000,
  };

  return cachedToken.token;
}

async function searchLocations(keyword, subType) {
  const token = await getAmadeusToken();
  if (!token) return [];

  const url = new URL(`${BASE_URL}/v1/reference-data/locations`);
  url.searchParams.set("keyword", keyword);
  url.searchParams.set("subType", subType);        // "CITY" or "AIRPORT"
  url.searchParams.set("page[limit]", "10");

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return [];
  const json = await res.json();
  return Array.isArray(json?.data) ? json.data : [];
}

function pickFirstIata(data) {
  for (const item of data) {
    if (looksLikeIata3(item?.iataCode)) return item.iataCode.toUpperCase();
  }
  return null;
}

async function resolveCity(place) {
  for (const kw of buildKeywordAttempts(place)) {
    const data = await searchLocations(kw, "CITY");
    const code = pickFirstIata(data);
    if (code) return code;
  }
  return null;
}

async function resolveAirport(place) {
  // Try airports first (best for flights)
  for (const kw of buildKeywordAttempts(place)) {
    const data = await searchLocations(kw, "AIRPORT");
    const code = pickFirstIata(data);
    if (code) return code;
  }
  // Fallback: city code often works for flight search too
  return await resolveCity(place);
}

export async function resolveIataCityCode(place) {
  if (!place) return null;
  if (looksLikeIata3(place)) return place.trim().toUpperCase();

  const key = `CITY::${normalizePlace(place).toLowerCase()}`;
  if (cache.has(key)) return cache.get(key);

  const cityCode = await resolveCity(place);
  cache.set(key, cityCode);
  return cityCode;
}

export async function resolveIataAirportCode(place) {
  if (!place) return null;
  if (looksLikeIata3(place)) return place.trim().toUpperCase();

  const key = `AIRPORT::${normalizePlace(place).toLowerCase()}`;
  if (cache.has(key)) return cache.get(key);

  const airportCode = await resolveAirport(place);
  cache.set(key, airportCode);
  return airportCode;
}
