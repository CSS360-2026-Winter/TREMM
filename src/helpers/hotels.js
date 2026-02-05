// src/helpers/hotels.js
import Amadeus from 'amadeus';

function validateDates(checkIn, checkOut) {
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    return d2 > d1;
}

export async function getHotelOptions({ cityCode, checkIn, checkOut, adults }) {
    if (!validateDates(checkIn, checkOut)) {
        return {
            ok: false,
            message: '❌ Error: Check-out date must be after check-in date.'
        };
    }

    if (!process.env.AMADEUS_CLIENT_ID || !process.env.AMADEUS_CLIENT_SECRET) {
        return {
            ok: false,
            message: '❌ Error: API credentials missing in .env file.'
        };
    }

    const amadeus = new Amadeus({
        clientId: process.env.AMADEUS_CLIENT_ID,
        clientSecret: process.env.AMADEUS_CLIENT_SECRET
    });

    try {
        const hotelListResponse = await amadeus.referenceData.locations.hotels.byCity.get({
            cityCode: cityCode
        });

        if (!hotelListResponse.data || hotelListResponse.data.length === 0) {
            return {
                ok: false,
                message: `❌ No hotels found in **${cityCode}**.`
            };
        }

        const hotelIds = hotelListResponse.data.slice(0, 5).map(hotel => hotel.hotelId).join(',');

        const offersResponse = await amadeus.shopping.hotelOffersSearch.get({
            hotelIds: hotelIds,
            checkInDate: checkIn,
            checkOutDate: checkOut,
            adults: adults
        });

        const data = offersResponse.data;

        if (!data || data.length === 0) {
            return {
                ok: false,
                message: `❌ Hotels found in ${cityCode}, but **no available offers** for these dates/guests. (Sandbox API has limited data).`
            };
        }

        const simplified = data.slice(0, 5).map(offer => {
            return {
                name: offer.hotel.name,
                stars: offer.hotel.rating ? Math.round(offer.hotel.rating) : 0,
                price: offer.offers?.[0]?.price?.total || 'N/A',
                currency: offer.offers?.[0]?.price?.currency || '',
                city: cityCode
            };
        });

        return { ok: true, hotels: simplified };

    } catch (error) {
        console.error("Amadeus API Error:", error.response ? error.response.result : error);
        
        if (error.response && error.response.statusCode === 400) {
            return { ok: false, message: `❌ Could not find valid hotel data for **${cityCode}**. Try a major hub like LON, NYC, or PAR.` };
        }
        
        return { ok: false, message: '❌ Error communicating with Amadeus API.' };
    }
}