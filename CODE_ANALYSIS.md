
**Tanisha Thakare ~ Bot Project Task #5: Examine Code for Technical Debt and Code Smells**

Examined Code for Technical Debt and Code Smells in the following files:
  - flights.js
  - hotels.js
  - plantrip.js
  - trip.js
  - weather.js
  - Their corresponding helper files

**Technical Debt:** The flaws that make code prone to problems when you want to make changes to the system (e.g. inconsistencies in formatting).


**Code Smells:** Code structure that can cause potential problems with design and maintenance (e.g. duplicated code, long methods, etc.).

**Efforts:**
  - I went through all lines of code for each of the command files that control the slash commands in the discord bot as well as their helper files.
  - Utilizing Command F to easily look for specific elements in the code.
  - Writing up the technical debts, code smells, and potential solutions to those issues.

**Code Smells:**	
1. The first code smell I immediately noticed in the files were the use of emojis. Emojis are a great way to make messages from the discord bot engaging to the user, but it is considered a code smell in the long run. Emojis are Unicode characters, which means that different systems, apps, and machines (Linux vs Windows) can replace them with bitmaps. This is problematic because it can result in different display views, making the code more complicated than it needs to be. Although, it is okay to use emojis in messages sent to the user, like in Discord.

2. The next code risk I found was the use of repeated code in multiple files. For example, our bot takes in dates for the trip among different categories, such as flights, hotels, weather, etc. The formatting in which the date is handled is different in flights.js (YYYY-MM-DD), plantrip.js (MM-DD-YYYY), and hotels.js (YYYY-MM-DD). Another example of this repeating code logic is in converting data to user readable output. The file weather.js uses pct01ToPct() method to convert decimals to percentages for rain chance, while flight.js uses formatStops() method to show 0 layovers for a direct flight and 1 layover to show one stop layover. Since the implementations are similar for these files, repeating the same logic in multiple places make it hard to keep track of. A way to solve this problem is to have a specific file just for tracking the formatting and other things for repeated code. This way, everything is all in one place so if you do need to change something, you can just change it in the one file.

3. The last code smell I’ll talk about is having multiple actions happen in one, long method. For example, in the weather.js file, there is a method called execute(interaction), which gets the weather data for a 7-day forecast at a location, gets weekly mins, maxes, and peak rain percentages, does the formatting for all that, and then sends the whole message into the Discord channel. Having all these steps crammed into one method can make it easily prone to errors and is hard to keep track of. A way to solve this problem is to have each functionality part in a different method, then just call those methods into the execute(interaction) method. This way, it is easier to understand and test without any problems.

**Technical Debt:**
1. The first technical debt I have observed in the main files is how errors are being handled in the files. For example, the helper files for flights.js, hotels.js, and weather.js errors are handled with the return ({ok: false, message) command. But, in the weather.js command file, the execute method puts all this information into a try/catch block, allowing for multiple types of errors to be taken into consideration. This difference in error handling makes a huge difference in the problems that can arise, making it difficult to maintain it. A solution to this problem is to coordinate error handling so that all of the helper files handle errors in the same format, helping with consistency and easy readability.

2. The next technical debt I have observed in the files is that there is inconsistent price formatting for the flights.js file and the hotels.js file. For example, flight prices are displayed as “$123.45” and hotel prices are displayed as “1234.56 USD.” This is important because we eventually want to implement a summary command, where it shows the summary of trip (which will show the total cost of the planned trip). This inconsistency makes it difficult to total costs up or have other functions with the cost variable. The solution that would make sense for this problem is to include a method in the files where it formats the costs a specific way in all files the same way.

3. The last technical debt I’ll talk about is how the helper file weather.js includes a network helper section, while the helper files hotels.js and flights.js do not have retry logic. This means that if the API has a network problem or fails, the weather.js file reloads it while hotel.js and flights.js will fail and return an error after the first try. This is important to consider because it would be a usability flaw if it just failed immediately. The best solution for this would be to implement a similar network help section, just like the weather.js helper file.


## **Manraj Banga: Unit testing 3 diffrent files with 8 tests**  
   
A total of **8 unit tests** were added covering validation and error-handling logic.

### Files Tested

### 1. src/helpers/hotels.js

**Function tested:** getHotelOptions()

#### Tests Added:
- Check-out date before check-in → returns error
- Check-out date equals check-in → returns error
- Invalid date strings → returns error

#### Findings:
- Invalid date strings fail indirectly rather than through explicit validation.
- There is no validation for:
  - adults <= 0

### 2. src/helpers/flights.js

**Function tested:** getFlightOptions()

#### Tests Added:
- Missing Amadeus credentials → returns clear error
- Missing required fields → returns clear error
- Missing only departureDate → returns error

#### Findings:
- Early-return validation is implemented for missing fields.
- Credentials are validated only when the function is called.
- No validation exists for:
  - adults <= 0
  - invalid date format
  - invalid IATA airport code format

### 3. src/helpers/geocode.js

**Function tested:** geocodePlace()

Tests were implemented using a mocked fetch call.

#### Tests Added:
- API returns empty array → function returns null
- API returns valid lat/lon → numeric conversion works correctly

#### Findings:
- Proper handling of empty API results.
- Lat/lon values are converted using Number(), but:
  - There is no validation for malformed numeric values.

#### Weakness Identified:
If the external API returned malformed coordinates, the function would return `NaN` values without validation.


### Basic Comments 
Core helpers depend heavily on live API responses.

Implications:
- Harder to test success paths without mocking
- Greater risk of runtime failures due to API changes or rate limits

**Some Recommendation:**
use Separation for:
- Input validation
- Data transformation
- External API calls

This would improve testability and maintainability.



## Raya Parsa — Threat Modeling (Bot Project Task #5)

### Overview
This threat model analyzes potential security risks in the TREMM Discord Trip Bot, focusing on user input handling, API calls, environment variables, and message output.

### Assets to Protect
- API keys stored in environment variables
- User-provided trip data
- Discord bot token
- External API responses

### Entry Points
- Slash command inputs (origin, destination, date, adults)
- Discord user messages
- External API responses (flights, hotels, weather)

### Threats Identified

1. Input Validation Bypass  
Users could input malformed airport codes or invalid dates to break logic or cause unexpected API errors.

Mitigation:
- Strict validation of IATA codes
- Date format enforcement
- Reject past dates

2. API Failure / Network Dependency  
If external APIs fail, the bot may crash or expose error details.

Mitigation:
- Consistent error handling pattern (`{ ok: false, message }`)
- Retry logic similar to weather helper
- Graceful fallback responses

3. Sensitive Data Exposure  
If environment variables or API keys are logged or committed accidentally, credentials could be leaked.

Mitigation:
- Use `.env` files
- Ensure `.env` is in `.gitignore`
- Never log tokens or secrets

4. Denial of Service (Spam Commands)  
Users could repeatedly spam slash commands causing excessive API calls.

Mitigation:
- Implement rate limiting
- Add cooldown per user
- Cache repeated results temporarily

### Risk Severity Assessment

| Threat | Likelihood | Impact | Severity |
|--------|------------|--------|----------|
| Invalid input | High | Medium | Medium |
| API failure | Medium | Medium | Medium |
| Credential leak | Low | High | High |
| Spam abuse | Medium | Medium | Medium |

### Conclusion
The bot currently handles input validation partially but could improve consistency in error handling, retry logic, and rate limiting. Addressing these areas would reduce technical risk and improve reliability.

