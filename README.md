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
TREMM is a Discord bot built for CSS 360 to help groups plan trips without leaving the chat. It provides travel tools like checking destination weather, browsing activities, finding restaurants, and comparing flight and hotel options — all through Discord slash commands.

---

## What's New in v2.0
- **New command:** `/tripbrief` — generate a full trip plan in one run (weather + restaurants + activities + hotels + flights).
- **New command:** `/restaurants` — restaurant discovery for a destination (name, category, address, Google link).
- **Cleaner architecture:** reduced duplication by consolidating multi-step planning into shared helpers and a single orchestrator flow.
- **Stronger validation:** stricter input checks (destination required, dates formatted correctly, return after depart, valid traveler count).
- **More resilient behavior:** timeouts/retries + partial-failure handling so one API failure does not crash the whole response.
- **Cleaner output:** sections are formatted for readability and HTML is stripped from activity descriptions.
- **Supply chain transparency:** SBOM generated to document dependencies.

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
Find restaurants in a destination for quick meal planning.

---

### `/weather`
Show current conditions and a short-term forecast for a destination.

---

### `/plantrip`
Start an interactive trip plan setup in Discord.

---

### `/trip activities`
Suggest activities/attractions for a destination (with fallbacks if results are limited).

---

### `/flights`
Get one-way flight options (airline, price, depart/arrive time, stops).

---

### `/hotel`
Get hotel options for a destination and date range (name, star rating, price, external lookup link).

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
- `TOKEN=...`
- `CLIENT_ID=...`
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
