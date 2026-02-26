# TREMM 2.0

**Course:** CSS 360 (Winter 2026)  
**Project:** Travel Planning Discord Bot (Discord Slash Commands)

## Team Members
- Manraj Banga
- Kam Ekwueme
- Tanisha Thakare
- Raya Parsa
- Marco Chan

---

## Overview
TREMM is a Discord bot built for CSS 360 to help groups plan trips without leaving the chat. It provides travel tools like weather lookups, activities, restaurants, flights, and hotels — all through Discord slash commands.

---

## What's New in v2.0
- **New command:** `/tripbrief` — generates a complete trip plan in one run (weather + restaurants + activities + hotels + flights).
- **New command:** `/restaurants` — restaurant discovery for a destination (name, category, address, Google search link).
- **Cleaner architecture:** reduced duplication by consolidating multi-step trip planning into shared helpers and a single orchestrator flow.
- **Stronger validation:** stricter input checks (required fields, date format, date order, traveler counts).
- **More resilient behavior:** timeouts/retries + partial-failure handling so one API failure does not crash the entire response.
- **Cleaner output:** sections are formatted for readability and HTML is stripped from activity descriptions.
- **Supply chain transparency:** SBOM generated to document dependencies.
- **Faster dev updates:** guild command registration used for instant command refresh during development.

---

## Commands

### `/tripbrief` (NEW)
Generate a complete trip brief in one command.

**Usage**
- `/tripbrief destination:<place> depart:<YYYY-MM-DD> return:<YYYY-MM-DD> adults:<1-9> origin:<IATA>`
- Example:
  - `/tripbrief destination:"Los Angeles, CA" depart:2026-03-10 return:2026-03-14 adults:1 origin:SEA`

**Output**
- Summary (dates, trip length, resolved codes, section status)
- Weather snapshot
- Restaurants
- Activities (API results or fallback suggestions)
- Hotels (if IATA city code is available/resolved)
- Flights (round trip shown as outbound + return one-way)

**Notes / Limits**
- Weather is short-term (forecast window depends on the provider).
- Activities/hotels/flights coverage depends on API availability (sandbox coverage may be limited).
- Flights may require an origin IATA code. If not provided, set `DEFAULT_ORIGIN_IATA` in `.env`.
- Hotels/flights use IATA city/airport codes; the bot attempts to resolve these automatically when possible.

---

### `/restaurants` (NEW)
Find top restaurants in a location.

**Usage**
- `/restaurants location:<place>`
- Example:
  - `/restaurants location:"Seattle, WA"`

**Output**
- A list of restaurants including:
  - Name
  - Category/cuisine
  - Address
  - Google search link

**Notes / Limits**
- Results depend on API coverage and may vary by destination.

---

### `/weather`
Get current weather and a short-term forecast.

**Usage**
- `/weather place:<place>`
- Example:
  - `/weather place:"Paris, FR"`

**Output**
- Current conditions (temperature, feels-like, wind, humidity)
- Short-term daily forecast (shown as the next 7 days)

**Notes / Limits**
- Forecast window is provider-limited (short-term).

---

### `/plantrip`
Interactive flow to collect trip details in chat.

**Usage**
- `/plantrip`

**Output**
- Bot prompts the user for:
  1) destination  
  2) trip dates  
- Bot responds with a “Trip Plan Created” summary using the provided details.

**Notes / Limits**
- Only listens to the user who started the command.

---

### `/trip activities`
Find tours and activities for a destination.

**Usage**
- `/trip activities destination:<place>`
- Example:
  - `/trip activities destination:"Bali, Indonesia"`

**Output**
- A list of activities including:
  - Activity name
  - Price (when available)
  - Short description (HTML stripped)
  - Booking link (when available)

**Notes / Limits**
- If the provider returns limited/empty results for a destination, fallback suggestions may be shown.

---

### `/flights`
Get up to 5 flight options for a one-way trip.

**Usage**
- `/flights origin:<IATA> destination:<IATA> date:<YYYY-MM-DD> adults:<number>`
- Example:
  - `/flights origin:SEA destination:LAX date:2026-03-10 adults:1`

**Output**
- Up to 5 flight options including:
  - Airline
  - Price
  - Depart time
  - Arrive time
  - Number of stops

**Notes / Limits**
- Requires IATA airport codes (e.g., SEA, LAX).
- If no flights are found, the bot returns a clear message suggesting different dates/airports.

---

### `/hotel`
Check hotel availability and pricing.

**Usage**
- `/hotel city:<IATA_CITY> check_in:<YYYY-MM-DD> check_out:<YYYY-MM-DD> adults:<number>`
- Example:
  - `/hotel city:NYC check_in:2026-03-10 check_out:2026-03-14 adults:2`

**Output**
- A Discord embed showing top hotel options including:
  - Hotel name
  - Star rating
  - Price
  - External lookup link

**Notes / Limits**
- Requires an IATA city code (examples: NYC, PAR, LON).
- Date validation is enforced (check-out must be after check-in).
- Coverage varies by destination (sandbox limitations may apply).

---

### `/hoteldemo` (Developer/Demo)
Demonstrates hotel API retry behavior in Discord (for debugging/demo purposes).

**Usage**
- `/hoteldemo city:<IATA_CITY>`
- Example:
  - `/hoteldemo city:NYC`

**Output**
- Posts retry progress messages and a final summary message.

---

## Setup / Running Locally

### Install
```bash
npm install
```

### Build
```bash
npm run build
```

### Register Slash Commands
```bash
npm run register
```

### Start the Bot
```bash
npm start
```

---

## Environment Variables
Create a `.env` file (or set secrets in your deployment environment).

### Discord
- `TOKEN=...` (Discord bot token)
- `CLIENT_ID=...` (Discord application/client ID)
- `GUILD_ID=...` (recommended for instant updates during development)

### Travel APIs
- `AMADEUS_CLIENT_ID=...`
- `AMADEUS_CLIENT_SECRET=...`
- `AMADEUS_BASE_URL=https://test.api.amadeus.com` (sandbox)
- `DEFAULT_ORIGIN_IATA=SEA` (optional convenience for flights inside `/tripbrief`)

---

## SBOM (Software Bill of Materials)
Example regeneration command (Syft):
```bash
syft . -o spdx-json > sbom.spdx.json
```

---

## Release Notes (TREMM 2.0)
- Added `/tripbrief` (one-command trip planning with organized multi-section output)
- Added `/restaurants`
- Reduced complexity using an orchestrator + shared helpers
- Improved validation and resiliency (timeouts, retries, partial failure handling)
- Sanitized HTML from activity descriptions in Discord output
- Generated SBOM for dependency transparency
```


