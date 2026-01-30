# TREMM 1.0

**Course:** CSS 360  
**Project:** Travel Planning Discord Bot (Discord Slash Commands)

## Team Members
- Manraj Banga
- Kam Ekwueme
- Tanisha Thakare
- Raya Parsa
- Marco Chan

---

## Overview
TREMM is a Discord bot built for CSS 360 to help groups plan trips without leaving the chat. It provides travel-friendly tools like checking destination weather, starting a shared trip plan, browsing activities, and quickly comparing flight and hotel options.

---

## Commands Included in v1.0

### ✅ `/weather <destination>`
**User story:** As a Discord server member, I want the bot to show the current weather and forecast for a location so I can decide whether it’s a good time to travel there.

**What it does:**
- Returns current conditions (temperature, feels-like, humidity, wind)
- Returns a short-term forecast summary (shown as the next 7 days)

**Notes:**
- Forecasts are limited by the weather data provider (short-term forecast window).

---

### ✅ `/plantrip <destination> <trip_length>`
**User story:** As a Discord server member, I want to start a trip plan by entering a destination and trip length so that my group can begin planning a vacation together.

**What it does:**
- Starts a trip plan for a destination and trip length
- Creates a shared starting point for the group to build on in Discord

---

### ✅ `/trip activities <destination>`
**User story:** As a Discord server member, I want the bot to suggest popular activities at a destination so that I don’t have to research attractions myself.

**What it does:**
- Suggests popular activities/attractions for the chosen destination
- Reduces the need for external searching during early planning

---

### ✅ `/flight <origin> <destination> <departureDate>`
**User story:** As a traveler, I want to receive flight options for my given trip so that I can compare prices, airlines, and schedules before choosing a flight.

**Acceptance Criteria**
- The system retrieves flight options based on provided trip details
- **Input:** `origin`, `destination`, `departureDate`
- **Output:** returns up to 5 flight options
- **Each option shows:** airline, price, depart time, arrive time, stops
- **If API has no results:** bot returns a clear fallback response (ex: “No flights found for those details. Try different dates or airports.”)

---

### ✅ `/hotel <city> <check_in_date> <check_out_date> <adults>`
**User story:** As a Trip Planner on Discord, I want to use the `/hotel` command to check availability and pricing for a specific city and date range so that I can quickly find options that fit our group's budget without leaving the chat.

**Acceptance Criteria**
- **Input:** accepts `destination (City)`, `check_in_date`, `check_out_date`, and `adults`
- **API:** successfully authenticates and queries the Amadeus Hotel Search API
- **Validation:** bot returns an error message if:
  - check-out date is before check-in date, **or**
  - the city cannot be found
- **Output:** displays a Discord Embed containing the **Top 3** available hotels
- **Data Points:** each hotel includes:
  - Name
  - Star Rating
  - Total Price
- **Links:** includes a clickable link for each hotel to view details externally

---

## Status
- ✅ Task 1 complete: project environment set up, Discord servers created, and GitHub project board created.
- ✅ v1.0 release scope complete: core travel commands implemented and ready for testing and deployment.
- ⏭️ Next steps: polish responses, expand destination support, improve error handling, and iterate on planning features.

---

## Development Notes

### Running Locally
After pulling the repo and installing dependencies:

- Build:
  - `npm run build`
- Register slash commands:
  - `npm run register`
- Start the bot:
  - `npm start`

### Deployment Notes
- After adding or updating commands, re-register slash commands to ensure Discord reflects the latest definitions.
- Tag releases with notes describing newly added commands and major behavior changes.

---

## Release Notes (TREMM 1.0)
- Added weather command with current conditions + short-term forecast output
- Added trip planning starter command for group planning
- Added activity suggestions for destinations
- Added flight lookup command (top results with airline/price/schedule/stops + fallback behavior)
- Added hotel lookup command using Amadeus Hotel Search (top 3 hotels, validation, links, and pricing)

