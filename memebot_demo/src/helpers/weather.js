// helpers/weather.js
const API_KEY = process.env.OPENWEATHER_KEY;

function assertApiKey() {
  if (!API_KEY) {
    throw new Error("Missing OPENWEATHER_KEY env var. Add it to GitHub Secrets (Codespaces).");
  }
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} calling OpenWeather. ${text?.slice(0, 200) || ""}`);
  }
  return res.json();
}

function fmtTempF(n) {
  return `${Math.round(n)}°F`;
}

function dayKeyFromUtcWithOffset(dtSeconds, tzOffsetSeconds) {
  // Use the city's local day by applying tz offset first
  const localMs = (dtSeconds + tzOffsetSeconds) * 1000;
  const d = new Date(localMs);
  // YYYY-MM-DD key using UTC fields since we've already applied offset
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function labelFromKey(key) {
  // key is YYYY-MM-DD
  const [y, m, d] = key.split("-").map(Number);
  // Create date in local-ish form for display (use UTC to avoid timezone weirdness)
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function summarizeForecast(list, tzOffsetSeconds, days = 3) {
  // list is 3-hour forecast entries for next 5 days
  const byDay = new Map();

  for (const item of list) {
    const key = dayKeyFromUtcWithOffset(item.dt, tzOffsetSeconds);

    const min = item.main?.temp_min ?? item.main?.temp ?? null;
    const max = item.main?.temp_max ?? item.main?.temp ?? null;
    if (min == null || max == null) continue;

    if (!byDay.has(key)) {
      byDay.set(key, {
        min,
        max,
        descCounts: new Map(),
        popMax: 0, // precipitation probability 0..1 (forecast endpoint provides pop)
      });
    }

    const agg = byDay.get(key);
    agg.min = Math.min(agg.min, min);
    agg.max = Math.max(agg.max, max);

    const desc = item.weather?.[0]?.description ?? "unknown";
    agg.descCounts.set(desc, (agg.descCounts.get(desc) ?? 0) + 1);

    const pop = typeof item.pop === "number" ? item.pop : 0;
    agg.popMax = Math.max(agg.popMax, pop);
  }

  // Choose next N days (skip "today" to keep it simple)
  const nowKey = dayKeyFromUtcWithOffset(Math.floor(Date.now() / 1000), tzOffsetSeconds);

  const keys = [...byDay.keys()].sort();
  const futureKeys = keys.filter(k => k !== nowKey);
  const chosen = (futureKeys.length ? futureKeys : keys).slice(0, days);

  return chosen.map(k => {
    const agg = byDay.get(k);

    // most common description
    let topDesc = "mixed conditions";
    let topCount = 0;
    for (const [desc, count] of agg.descCounts.entries()) {
      if (count > topCount) {
        topDesc = desc;
        topCount = count;
      }
    }

    return {
      label: labelFromKey(k),
      min: agg.min,
      max: agg.max,
      desc: topDesc,
      pop: agg.popMax,
    };
  });
}

export async function getWeather(place) {
  assertApiKey();

  // 1) Geocode the place to lat/lon (limit 3 so we can detect ambiguity)
  const geoUrl =
    `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(place)}` +
    `&limit=3&appid=${encodeURIComponent(API_KEY)}`;

  const geo = await fetchJson(geoUrl);

  if (!Array.isArray(geo) || geo.length === 0) {
    return {
      ok: false,
      message: `Couldn't find **${place}**. Try something like "Seattle, WA" or "Paris, FR".`,
    };
  }

  if (geo.length > 1) {
    const options = geo
      .map((g, i) => `**${i + 1}.** ${g.name}${g.state ? `, ${g.state}` : ""}, ${g.country}`)
      .join("\n");

    return {
      ok: false,
      message: `I found multiple matches for **${place}**:\n${options}\n\nTry being more specific (add state/country).`,
    };
  }

  const loc = geo[0];
  const locName = `${loc.name}${loc.state ? `, ${loc.state}` : ""}, ${loc.country}`;

  // 2) Current weather
  const currentUrl =
    `https://api.openweathermap.org/data/2.5/weather?lat=${loc.lat}&lon=${loc.lon}` +
    `&units=imperial&appid=${encodeURIComponent(API_KEY)}`;

  const cur = await fetchJson(currentUrl);

  // 3) Forecast (5 days, 3-hour steps)
  const forecastUrl =
    `https://api.openweathermap.org/data/2.5/forecast?lat=${loc.lat}&lon=${loc.lon}` +
    `&units=imperial&appid=${encodeURIComponent(API_KEY)}`;

  const forecast = await fetchJson(forecastUrl);

  const tzOffsetSeconds = cur.timezone ?? 0;

  const current = {
    temp: cur.main?.temp,
    feels: cur.main?.feels_like,
    humidity: cur.main?.humidity,
    wind: cur.wind?.speed,
    desc: cur.weather?.[0]?.description ?? "unknown",
  };

  const nextDays = summarizeForecast(forecast.list ?? [], tzOffsetSeconds, 3);

  return {
    ok: true,
    location: locName,
    current,
    nextDays,
  };
}
