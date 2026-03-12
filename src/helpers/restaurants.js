import axios from "axios";

const API_KEY = process.env.GEOAPIFY_API_KEY;
const MAX_RETRIES = 2;
const BASE_DELAY = 500;

// Geocode city to lat/lon
async function geocodeCity(city) {
  const cityTrimmed = city?.trim();
  if (!cityTrimmed) throw new Error("Invalid Location Provided. Please Enter a City or Place Name.");

  const url = "https://api.geoapify.com/v1/geocode/search";
  const params = { text: cityTrimmed, limit: 1, apiKey: API_KEY };

  const response = await axios.get(url, { params });
  if (!response.data?.features?.length) {
    throw new Error(`Could Not Find Location For: "${cityTrimmed}".`);
  }

  const feature = response.data.features[0];
  const lat = parseFloat(feature.properties.lat);
  const lon = parseFloat(feature.properties.lon);

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    throw new Error(`Invalid Coordinates Returned For: "${cityTrimmed}".`);
  }

  return { lat, lon };
}

function prettyCategory(categories) {
  const list = Array.isArray(categories) ? categories : categories ? [categories] : [];
  const restaurantCats = list.filter((c) => typeof c === "string" && c.startsWith("catering.restaurant"));
  if (!restaurantCats.length) return "restaurant";

  const best = restaurantCats.find((c) => c.startsWith("catering.restaurant.")) || restaurantCats[0];

  const cleaned = best
    .replace("catering.restaurant.", "")
    .replace("catering.restaurant", "restaurant")
    .replaceAll(".", " ")
    .trim();

  return cleaned || "restaurant";
}

// Truncate description and provide fallback
function formatDescription(desc, category) {
  if (desc && desc.trim()) return desc.length > 150 ? desc.slice(0, 147) + "…" : desc;
  return `A popular ${category} restaurant in the area.`;
}

async function fetchPlaceDescription(placeId) {
  if (!placeId) return null;

  const params = { id: placeId, features: "details", apiKey: API_KEY };
  const res = await axios.get("https://api.geoapify.com/v2/place-details", { params });

  const props = res.data?.features?.[0]?.properties;
  const desc = props?.description;

  return typeof desc === "string" && desc.trim() ? desc.trim() : null;
}

// Calculate distance between two points in meters
function calcDistance(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371e3; // meters
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function getTopRestaurants({ location }) {
  if (!API_KEY) {
    return { ok: false, message: "Error: Geoapify API key missing in .env file." };
  }

  try {
    const { lat: cityLat, lon: cityLon } = await geocodeCity(location);

    let lastError;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const params = {
          categories: "catering.restaurant",
          filter: `circle:${cityLon},${cityLat},5000`,
          text: "restaurant",
          limit: 5,
          apiKey: API_KEY,
        };

        const response = await axios.get("https://api.geoapify.com/v2/places", { params });
        const features = response.data?.features || [];
        if (!features.length) return { ok: false, message: "No Restaurants Found Nearby. Try a Different Location." };

        const baseRestaurants = features.map((r) => ({
          name: r.properties?.name || "Unnamed Restaurant",
          category: prettyCategory(r.properties?.categories),
          address: r.properties?.formatted || "Address Not Available",
          url:
            r.properties?.url ||
            `https://www.google.com/search?q=${encodeURIComponent((r.properties?.name || "restaurant") + " " + location)}`,
          placeId: r.properties?.place_id || null,
          distance: calcDistance(cityLat, cityLon, r.properties?.lat, r.properties?.lon), // meters
        }));

        const restaurants = await Promise.all(
          baseRestaurants.map(async (r) => {
            try {
              const description = await fetchPlaceDescription(r.placeId);
              return { ...r, description: formatDescription(description, r.category) };
            } catch {
              return { ...r, description: formatDescription(null, r.category) };
            }
          })
        );

        return { ok: true, restaurants };
      } catch (error) {
        lastError = error;
        if (attempt === MAX_RETRIES) break;
        await new Promise((res) => setTimeout(res, BASE_DELAY * (attempt + 1)));
      }
    }

    return {
      ok: false,
      message: lastError?.response?.data?.message || "No Restaurants Found Nearby. Try a Different Location.",
    };
  } catch (err) {
    return { ok: false, message: err.message };
  }
}