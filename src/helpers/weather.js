// src/helpers/weather.js
// Open-Meteo (FREE, no key) + US-friendly geocoding + retries + 10-min cache
// Adds better daily "desc" using weather_code + rain chance from daily precip probability

// -------------------- Simple in-memory cache --------------------
const CACHE = new Map(); // key -> { expiresAt, value }
const TTL_MS = 10 * 60 * 1000; // 10 minutes

function cacheGet(key) {
  const hit = CACHE.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    CACHE.delete(key);
    return null;
  }
  return hit.value;
}

function cacheSet(key, value) {
  CACHE.set(key, { expiresAt: Date.now() + TTL_MS, value });
}

// -------------------- Network helpers --------------------
async function fetchJson(url, { timeoutMs = 8000, retries = 2 } = {}) {
  let lastErr;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(t);

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} calling Open-Meteo. ${text?.slice(0, 200) || ""}`);
      }

      return await res.json();
    } catch (err) {
      clearTimeout(t);
      lastErr = err;
      await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
    }
  }

  throw lastErr;
}

// -------------------- Formatting helpers --------------------
function normalizePlace(input) {
  return input
    .trim()
    .replace(/\s*,\s*/g, ", ")
    .replace(/\s+/g, " ");
}

function cToF(c) {
  return (c * 9) / 5 + 32;
}

function kmhToMph(kmh) {
  return kmh * 0.621371;
}

function formatDayLabel(dateYYYYMMDD) {
  return new Date(dateYYYYMMDD + "T00:00:00Z").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

// -------------------- US parsing helpers --------------------
const US_STATE = {
  AL:"Alabama", AK:"Alaska", AZ:"Arizona", AR:"Arkansas", CA:"California", CO:"Colorado",
  CT:"Connecticut", DE:"Delaware", FL:"Florida", GA:"Georgia", HI:"Hawaii", ID:"Idaho",
  IL:"Illinois", IN:"Indiana", IA:"Iowa", KS:"Kansas", KY:"Kentucky", LA:"Louisiana",
  ME:"Maine", MD:"Maryland", MA:"Massachusetts", MI:"Michigan", MN:"Minnesota",
  MS:"Mississippi", MO:"Missouri", MT:"Montana", NE:"Nebraska", NV:"Nevada",
  NH:"New Hampshire", NJ:"New Jersey", NM:"New Mexico", NY:"New York",
  NC:"North Carolina", ND:"North Dakota", OH:"Ohio", OK:"Oklahoma", OR:"Oregon",
  PA:"Pennsylvania", RI:"Rhode Island", SC:"South Carolina", SD:"South Dakota",
  TN:"Tennessee", TX:"Texas", UT:"Utah", VT:"Vermont", VA:"Virginia", WA:"Washington",
  WV:"West Virginia", WI:"Wisconsin", WY:"Wyoming", DC:"District of Columbia",
};

function parsePlaceParts(input) {
  const parts = normalizePlace(input).split(",").map((p) => p.trim()).filter(Boolean);
  return {
    city: parts[0] ?? "",
    regionOrState: parts[1] ?? "",
    country: parts[2] ?? "",
  };
}

function isTwoLetterCode(s) {
  return /^[A-Za-z]{2}$/.test(s);
}

// -------------------- Weather code -> description --------------------
// Open-Meteo weather codes: https://open-meteo.com/en/docs
const WEATHER_CODE_DESC = new Map([
  [0, "clear sky"],
  [1, "mainly clear"],
  [2, "partly cloudy"],
  [3, "overcast"],
  [45, "fog"], [48, "fog"],
  [51, "drizzle"], [53, "drizzle"], [55, "drizzle"],
  [56, "freezing drizzle"], [57, "freezing drizzle"],
  [61, "rain"], [63, "rain"], [65, "rain"],
  [66, "freezing rain"], [67, "freezing rain"],
  [71, "snow"], [73, "snow"], [75, "snow"],
  [77, "snow grains"],
  [80, "rain showers"], [81, "rain showers"], [82, "rain showers"],
  [85, "snow showers"], [86, "snow showers"],
  [95, "thunderstorm"],
  [96, "thunderstorm w/ hail"], [99, "thunderstorm w/ hail"],
]);

function weatherCodeToDesc(code) {
  if (code == null) return "forecast";
  const c = Number(code);
  return WEATHER_CODE_DESC.get(c) ?? "mixed";
}

// -------------------- Forecast summarization --------------------
function summarizeNextDays(daily, days = 7) {
  const times = daily?.time ?? [];
  const mins = daily?.temperature_2m_min ?? [];
  const maxs = daily?.temperature_2m_max ?? [];
  const pops = daily?.precipitation_probability_max ?? [];
  const wcodes = daily?.weather_code ?? [];

  const count = Math.min(days, times.length, mins.length, maxs.length);
  const out = [];

  for (let i = 0; i < count; i++) {
    const date = times[i];
    const label = formatDayLabel(date);

    const minF = cToF(mins[i]);
    const maxF = cToF(maxs[i]);

    const popPct = Array.isArray(pops) && pops[i] != null ? pops[i] : 0;
    const pop = popPct / 100;

    const code = Array.isArray(wcodes) ? wcodes[i] : null;
    const desc = weatherCodeToDesc(code);

    out.push({
      label,
      min: minF,
      max: maxF,
      desc,
      pop,
    });
  }

  return out;
}

// -------------------- Geocoding (Open-Meteo) --------------------
function validateCity(city) {
  if (!city || city.length < 2) {
    return {
      ok: false,
      message: `Type a real place name (ex: "Seattle" or "Seattle, WA").`,
    };
  }
  return { ok: true };
}

function deriveGeoHints({ regionOrState, country }) {
  let countryCode = "";
  let stateFull = "";

  if (country && isTwoLetterCode(country)) {
    countryCode = country.toUpperCase();
    return { countryCode, stateFull };
  }

  if (regionOrState && isTwoLetterCode(regionOrState)) {
    const st = regionOrState.toUpperCase();
    if (US_STATE[st]) {
      countryCode = "US";
      stateFull = US_STATE[st];
    }
  }

  return { countryCode, stateFull };
}

function buildGeocodeUrl(city, countryCode) {
  return (
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}` +
    `&count=10&language=en&format=json` +
    (countryCode ? `&countryCode=${encodeURIComponent(countryCode)}` : "")
  );
}

function extractResults(data) {
  const results = data?.results ?? [];
  return Array.isArray(results) ? results : [];
}

function errorNoResults(place) {
  return {
    ok: false,
    message: `Couldn't find **${place}**. Try adding a country like "Seattle, US" or "Paris, FR".`,
  };
}

function dedupeByLatLon(results) {
  const seen = new Set();
  const out = [];

  for (const r of results) {
    const key = `${r?.latitude},${r?.longitude}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(r);
    }
  }

  return out;
}

function filterByAdmin1Exact(results, admin1Full) {
  const target = (admin1Full ?? "").toLowerCase();
  if (!target) return results;

  const filtered = results.filter((r) => (r.admin1 ?? "").toLowerCase() === target);
  return filtered.length ? filtered : results;
}

function filterByAdmin1Includes(results, regionOrState) {
  const q = (regionOrState ?? "").trim();
  if (!q || q.length <= 2) return results;

  const ql = q.toLowerCase();
  const filtered = results.filter((r) => (r.admin1 ?? "").toLowerCase().includes(ql));
  return filtered.length ? filtered : results;
}

function chooseMostPopulated(results) {
  const sorted = [...results].sort((a, b) => (b.population ?? 0) - (a.population ?? 0));
  return sorted[0] ?? null;
}

function formatChosenLocation(chosen) {
  return (
    `${chosen.name}${chosen.admin1 ? `, ${chosen.admin1}` : ""}, ` +
    `${chosen.country} (${chosen.country_code})`
  );
}

async function geocodePlace(place) {
  const normalized = normalizePlace(place);
  const { city, regionOrState, country } = parsePlaceParts(normalized);

  const valid = validateCity(city);
  if (!valid.ok) return valid;

  const { countryCode, stateFull } = deriveGeoHints({ regionOrState, country });
  const url = buildGeocodeUrl(city, countryCode);

  const data = await fetchJson(url);
  let results = extractResults(data);

  if (results.length === 0) return errorNoResults(place);

  results = dedupeByLatLon(results);
  results = filterByAdmin1Exact(results, stateFull);

  if (!stateFull) {
    results = filterByAdmin1Includes(results, regionOrState);
  }

  const chosen = chooseMostPopulated(results);
  if (!chosen) return errorNoResults(place);

  return {
    ok: true,
    latitude: chosen.latitude,
    longitude: chosen.longitude,
    location: formatChosenLocation(chosen),
    timezone: chosen.timezone ?? "auto",
  };
}

async function fetchForecast(lat, lon, timezone = "auto") {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code` +
    `&forecast_days=16&timezone=${encodeURIComponent(timezone)}`;

  return fetchJson(url);
}

// -------------------- Current extraction helpers (reduce getWeather complexity) --------------------
function toFOrNull(c) {
  return c == null ? null : cToF(c);
}

function toMphOrNull(kmh) {
  return kmh == null ? null : kmhToMph(kmh);
}

function extractCurrent(data) {
  const cur = data?.current ?? {};
  return {
    temp: toFOrNull(cur.temperature_2m),
    feels: toFOrNull(cur.temperature_2m), // Open-Meteo doesn't provide "feels like" here
    humidity: cur.relative_humidity_2m ?? null,
    wind: toMphOrNull(cur.wind_speed_10m),
    desc: weatherCodeToDesc(cur.weather_code),
  };
}

function hasDailyForecast(data) {
  return Boolean(data?.daily?.time?.length);
}

// -------------------- Public API --------------------
async function getWeather(place) {
  const cacheKey = normalizePlace(place).toLowerCase();
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const geo = await geocodePlace(place);
  if (!geo.ok) {
    cacheSet(cacheKey, geo);
    return geo;
  }

  const data = await fetchForecast(geo.latitude, geo.longitude, geo.timezone);
  if (!hasDailyForecast(data)) {
    const fail = { ok: false, message: `Forecast unavailable for **${place}** right now.` };
    cacheSet(cacheKey, fail);
    return fail;
  }

  const result = {
    ok: true,
    location: geo.location,
    current: extractCurrent(data),
    nextDays: summarizeNextDays(data.daily, 7),
  };

  cacheSet(cacheKey, result);
  return result;
}

module.exports = { getWeather };

