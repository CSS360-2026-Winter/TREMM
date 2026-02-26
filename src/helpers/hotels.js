// src/helpers/hotels.js
import Amadeus from 'amadeus';
import { formatPrice } from './utils.js';

function validateDates(checkIn, checkOut) {
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    return d2 > d1;
}

export async function getHotelOptions({ cityCode, checkIn, checkOut, adults }) {
    if (!validateDates(checkIn, checkOut)) {
        return {
            ok: false,
            message: 'Error: Check-out date must be after check-in date.'
        };
    }

    if (!process.env.AMADEUS_CLIENT_ID || !process.env.AMADEUS_CLIENT_SECRET) {
        return {
            ok: false,
            message: 'Error: API credentials missing in .env file.'
        };
    }

    const amadeus = new Amadeus({
        clientId: process.env.AMADEUS_CLIENT_ID,
        clientSecret: process.env.AMADEUS_CLIENT_SECRET
    });

    const MAX_RETRIES = 2;
    const BASE_DELAY = 500; // ms

    try {
        // -------------------- Get Hotels By City with retry --------------------
        let hotelListResponse;
        let lastError;

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                hotelListResponse = await amadeus.referenceData.locations.hotels.byCity.get({ cityCode });
                break; // success
            } catch (error) {
                lastError = error;
                const status = error?.response?.statusCode;
                if (status && status >= 400 && status < 500) throw error; // don't retry client errors
                if (attempt === MAX_RETRIES) throw lastError;
                await new Promise(resolve => setTimeout(resolve, BASE_DELAY * (attempt + 1)));
            }
        }

        if (!hotelListResponse.data || hotelListResponse.data.length === 0) {
            return {
                ok: false,
                message: `No hotels found in **${cityCode}**.`
            };
        }

        const hotelIds = hotelListResponse.data.slice(0, 5).map(hotel => hotel.hotelId).join(',');

        // -------------------- Get Hotel Offers with retry --------------------
        let offersResponse;

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                offersResponse = await amadeus.shopping.hotelOffersSearch.get({
                    hotelIds,
                    checkInDate: checkIn,
                    checkOutDate: checkOut,
                    adults
                });
                break; // success
            } catch (error) {
                lastError = error;
                const status = error?.response?.statusCode;
                if (status && status >= 400 && status < 500) throw error; // don't retry client errors
                if (attempt === MAX_RETRIES) throw lastError;
                await new Promise(resolve => setTimeout(resolve, BASE_DELAY * (attempt + 1)));
            }
        }

        const data = offersResponse.data;
        if (!data || data.length === 0) {
            return {
                ok: false,
                message: `Hotels found in ${cityCode}, but **no available offers** for these dates/guests. (Sandbox API has limited data).`
            };
        }

        const simplified = data.slice(0, 5).map(offer => {
            const firstValidOffer = offer.offers?.find(o => o.price?.total != null);
            return {
                name: offer.hotel.name,
                stars: offer.hotel.rating ? Math.round(offer.hotel.rating) : 0,
                price: firstValidOffer?.price?.total ?? 'N/A',
                currency: firstValidOffer?.price?.currency ?? 'USD',
                city: cityCode
            };
        });

        return { ok: true, hotels: simplified };

    } catch (error) {
        console.error("Amadeus API Error:", error.response ? error.response.result : error);
        const status = error?.response?.statusCode;
        if (status === 400) {
            return { ok: false, message: `Could not find valid hotel data for **${cityCode}**. Try a major hub like LON, NYC, or PAR.` };
        }
        if (status === 429) {
            return { ok: false, message: 'Amadeus rate limit reached. Please try again shortly.' };
        }
        return { ok: false, message: 'Error communicating with Amadeus API.' };
    }
}

//THIS FUNCTION IS JUST FOR DEMO PURPOSES FOR BOT PROJECT TASK #6
export async function getHotelOptionsRetryDemo({ cityCode, retryCallback }) {
    const MAX_RETRIES = 2;
    const BASE_DELAY = 500; // ms
    let lastError;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            // force a fake API error to simulate retries
            throw { response: { statusCode: 500 } };
        } catch (err) {
            lastError = err;
            if (retryCallback) await retryCallback(`Retry attempt ${attempt + 1} failed for ${cityCode}`);
            if (attempt === MAX_RETRIES) return { ok: false, message: `Demo finished: failed after ${MAX_RETRIES + 1} attempts` };
            await new Promise(resolve => setTimeout(resolve, BASE_DELAY * (attempt + 1)));
        }
    }
}