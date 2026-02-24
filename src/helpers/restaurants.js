// src/helpers/restaurants.js
import axios from 'axios';

const API_KEY = process.env.GEOAPIFY_API_KEY;
const MAX_RETRIES = 2;
const BASE_DELAY = 500; // ms

// Geocode city name -> lat/lon
async function geocodeCity(city) {
    const cityTrimmed = city?.trim();
    if (!cityTrimmed) throw new Error('Invalid Location Provided. Please Enter a City or Place Name.');

    const url = 'https://api.geoapify.com/v1/geocode/search';
    const params = { text: cityTrimmed, limit: 1, apiKey: API_KEY };

    const response = await axios.get(url, { params });

    if (!response.data?.features?.length) {
        throw new Error(`Could Not Find Location For: "${cityTrimmed}".`);
    }

    const feature = response.data.features[0];
    const lat = parseFloat(feature.properties.lat);
    const lon = parseFloat(feature.properties.lon);

    if (isNaN(lat) || isNaN(lon)) {
        throw new Error(`Invalid Coordinates Returned For: "${cityTrimmed}".`);
    }

    return { lat, lon };
}

// Get top restaurants near a location
export async function getTopRestaurants({ location }) {
    if (!API_KEY) {
        return { ok: false, message: 'Error: Geoapify API key missing in .env file.' };
    }

    try {
        const { lat, lon } = await geocodeCity(location);

        console.log(`Searching restaurants near ${location}: lat=${lat}, lon=${lon}`);

        let lastError;

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                const params = {
                    categories: 'catering.restaurant',
                    filter: `circle:${lon},${lat},5000`, // 5km radius
                    text: 'restaurant',
                    limit: 5,
                    apiKey: API_KEY
                };

                console.log('Geoapify request params:', params);

                const response = await axios.get('https://api.geoapify.com/v2/places', { params });

                if (response.data?.features?.length > 0) {
                    const restaurants = response.data.features.map(r => ({
                        name: r.properties.name,
                        category: r.properties.categories || 'Restaurant',
                        address: r.properties.formatted || 'Address Not Available',
                        url: r.properties.url || `https://www.google.com/search?q=${encodeURIComponent(r.properties.name + ' ' + location)}`
                    }));

                    return { ok: true, restaurants };
                }
            } catch (error) {
                lastError = error;
                console.warn(`Attempt ${attempt + 1} failed:`, error.response?.data || error.message);
                if (attempt === MAX_RETRIES) break;
                await new Promise(res => setTimeout(res, BASE_DELAY * (attempt + 1)));
            }
        }

        console.error('Geoapify API Error:', lastError?.response?.data || lastError);
        return { ok: false, message: 'No Restaurants Found Nearby. Try a Different Location.' };
    } catch (err) {
        console.error('Restaurants helper error:', err.message);
        return { ok: false, message: err.message };
    }
}