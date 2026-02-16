const BASE_URL = "https://test.api.amadeus.com";

let token = null;
let tokenExpiresAt = 0;

async function getToken() {
  if (!process.env.AMADEUS_CLIENT_ID || !process.env.AMADEUS_CLIENT_SECRET) {
  throw new Error(
    "Missing Amadeus credentials: set AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET"
  );
}

  if (token && Date.now() < tokenExpiresAt) return token;

  const res = await fetch(`${BASE_URL}/v1/security/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.AMADEUS_CLIENT_ID,
      client_secret: process.env.AMADEUS_CLIENT_SECRET,
    }),
  });

  const data = await res.json();
  token = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in || 0) * 1000;

  return token;
}

function simplifyActivities(raw) {
  return (raw || []).slice(0, 5).map((a) => ({
    name: a.name,
    price:
      a.price?.amount && a.price?.currencyCode
        ? `${a.price.amount} ${a.price.currencyCode}`
        : null,
    description: a.shortDescription || a.description || null,
    bookingLink: a.bookingLink || null,
  }));
}

async function fetchActivities(lat, lon, radius) {
  const accessToken = await getToken();
  const url = `${BASE_URL}/v1/shopping/activities?latitude=${lat}&longitude=${lon}&radius=${radius}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await res.json();
  return simplifyActivities(data.data);
}

export async function getActivitiesByLatLon(lat, lon) {
  const first = await fetchActivities(lat, lon, 20);
  if (first.length) return first;

  const second = await fetchActivities(lat, lon, 50);
  return second;
}
