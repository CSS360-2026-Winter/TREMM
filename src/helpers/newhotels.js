// src/helpers/newhotels.js

export const getNewHotelOptions = async ({ cityCode, checkIn, checkOut, adults }) => {
    const apiKey = process.env.SERPAPI_KEY; 

    if (!apiKey) {
        return { ok: false, message: 'Server configuration error: API key is missing.' };
    }

    // Calculate the number of nights between check-in and check-out
    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);
    // Math.max ensures we always calculate for at least 1 night
    const nights = Math.max(1, Math.round((outDate - inDate) / (1000 * 60 * 60 * 24)));

    const url = new URL('https://serpapi.com/search');
    url.searchParams.append('engine', 'google_hotels');
    url.searchParams.append('q', `Hotels in ${cityCode}`); 
    url.searchParams.append('check_in_date', checkIn);
    url.searchParams.append('check_out_date', checkOut);
    url.searchParams.append('adults', adults.toString());
    url.searchParams.append('currency', 'USD');
    url.searchParams.append('api_key', apiKey);

    try {
        const response = await fetch(url.toString());
        const data = await response.json();

        if (!response.ok || data.error) {
            console.error('SerpApi Error:', data.error || response.statusText);
            return { ok: false, message: 'Failed to fetch hotel data. Please try again later.' };
        }

        if (!data.properties || data.properties.length === 0) {
            return { ok: false, message: `No hotels found for ${cityCode} on those dates.` };
        }

        const hotels = data.properties.slice(0, 5).map(hotel => {
            const nightlyRate = hotel.rate_per_night?.extracted_lowest ?? 0;
            
            return {
                name: hotel.name,
                city: cityCode,
                stars: hotel.extracted_hotel_class || 0,
                price: nightlyRate > 0 ? nightlyRate : 'N/A',
                // Manually calculate the total so the math is always flawless
                totalPrice: nightlyRate > 0 ? nightlyRate * nights : 'N/A',
                currency: 'USD'
            };
        });

        return { ok: true, hotels };

    } catch (error) {
        console.error('API Fetch Error:', error);
        return { ok: false, message: 'An unexpected network error occurred while searching.' };
    }
};