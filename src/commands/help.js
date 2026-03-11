import { SlashCommandBuilder } from "discord.js";

function splitMessage(text, maxLength = 1800) {
  const lines = text.trim().split("\n");
  const chunks = [];
  let current = "";

  for (const line of lines) {
    const candidate = current ? `${current}\n${line}` : line;

    if (candidate.length > maxLength) {
      if (current) chunks.push(current);

      if (line.length > maxLength) {
        for (let i = 0; i < line.length; i += maxLength) {
          chunks.push(line.slice(i, i + maxLength));
        }
        current = "";
      } else {
        current = line;
      }
    } else {
      current = candidate;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

export default {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Shows a detailed guide for using the TREMM travel bot"),

  async execute(interaction) {
    await interaction.deferReply();

    const part1 = `
# TREMM Help Guide
## What TREMM Does
TREMM is a travel planning Discord bot built to help users organize a trip from start to finish without leaving Discord. By using slash commands, users can quickly access different parts of trip planning, such as starting a trip plan, finding activities, searching for restaurants, checking weather, looking up flights, viewing hotel options, and generating a combined trip summary. The main goal of TREMM is to make travel planning more convenient by putting useful travel tools into one bot and giving users a simple command-based experience.
## How To Use Commands
- Type \`/\` in Discord
- Discord will show a list of available commands
- Click the command you want
- Fill in the required inputs
- Press enter to run the command
## /plantrip
### What it does
The plantrip command serves as the main starting point for TREMM. It is designed to help users begin the travel-planning process and understand how to use the bot effectively.
### Inputs
- City you are traveling to (Press enter after) 
- Date in  \`YYYY-MM-DD\` format (When it askes you for the planed dates)
### Output
- Confirmation of the city and the dates
### Important notes
- Good starting command for first-time users
- Required to use an actual city and \`YYYY-MM-DD\` 
- Must be followed by other commands for specific travel details
- Doesnt store the data inputed, only readable if you scroll up to the message
`;

    const part2 = `
# TREMM Help Guide
## /trip activties 
### What it does
- The /trip activities command helps users find things to do in a destination. It is used to search for activities, attractions, tours, and experiences in a city so the user can explore options for their trip.
### Inputs
- \`destination\`
- The destination should be a real city or recognizable place name
- Best input format: clear locations such as \`Seattle, WA\`, \`Los Angeles, CA\`, or \`Paris, FR\`
### Output
- A list of activities, attractions, or tours for the destination
- Results that help the user decide what to do during their trip
### Restrictions
- Dependent on API availability
- The destination must be specific enough to be recognized correctly
- Misspelled, vague, or invalid locations may return weak results or no results
- Results depend on what the API has available for that destination
- Larger or more popular destinations may return more detailed results than smaller places
## /resturant
### What it does
- The /restaurants command helps users find places to eat in a destination. It is used to search for restaurants in a city or location so users can explore dining options while planning their trip.
### Inputs
- \`location\`
- The location should be a real city or recognizable place name
- Example: \`Chicago\` or \`Los Angeles, CA\`
### Output
- A list of restaurants in the destination
- May include restaurant names, categories, addresses, or search links depending on how the command is implemented
- Gives users food and dining options related to the location they entered
### Restrictions
- The location must be valid and specific enough to be recognized correctly for the API
- Misspelled, vague, or invalid locations may return weak results or no results
- Restaurant results depend on the API data available for that destination
- Larger or more popular cities may return better and more complete results than smaller places
## /weather
### What it does
- The /weather command helps users check the weather for a destination. It is used to give weather information for a place so users can better prepare for their trip and understand the conditions they may experience.
### Inputs
- \`place\'
- The place should be a real city or recognizable location
- Example: \`Seattle, WA\` or \`Miami, FL\`
### Output
- Weather information for the destination
- Include current weather with it being extened to th next 7 days offorecast details 
- Gives users weather-related information to help with trip planning
### Restrictions
- The place must be valid and specific enough to be recognized correctly
- Weather shows the next 7 days and not designed to show the weather during date of going on the trip at this moment.
`;
    const part3 = `
    # TREMM Help Guide
## /flights
### What it does
- The /flights command helps users search for flight options between two airports. It is used to find possible flight routes for a trip by taking an origin airport, destination airport, departure date, and optional traveler count.
### Inputs
- \`origin\`
- \`destination\`
- \`date\`
- sometimes \`adults\`
### Input format
- Origin and destination should use IATA airport codes
- Example: \`SEA\`, \`LAX\`, \`JFK\`
- Date should be in \`YYYY-MM-DD\` format
- Adults defaut to 1, so change if the plan is diffrent
### Output
- A list of possible flight options
- Include airline, departure time, arrival time, duration, or price depending on how the command is implemented
### Restrictions
- \`origin\` and \`destination\` must be real 3-letter IATA airport codes
- Invalid airport codes will cause the search to fail or return no results
- \`date\` must be in the correct \`YYYY-MM-DD\` format
- Invalid or unrealistic dates may return errors or no results
- Flight results depend on API availability, route availability, and trip date
- The command may return fewer results if there are limited flights for that route
## /hotel
### What it does
- The /newhotel command helps users search for hotel options in a destination for specific travel dates. It is used to check hotel availability by taking a city, check-in date, check-out date, and number of adults.

### Inputs
- \`city\`
- \`check_in\`
- \`check_out\`
- \`adults\`
### Input Format
- \`city\` should be a real and recognizable destination
- \`check_in\` must be in \`YYYY-MM-DD\` format
- \`check_out\` must be in \`YYYY-MM-DD\` format
- \`adults\` should be a whole number
### Output
- A list of hotel options for the destination and dates entered
- Include hotel names, prices, ratings and booking links
- Gives users  results that match their trip details
### Restrictions
- \`city\` must be a valid destination the API can recognize
- \`check_in\` and \`check_out\` must be in the correct \`YYYY-MM-DD\` format
- \`check_out\` must be after \`check_in\`
- Invalid dates may cause the search to fail or return no results
- \`adults\` must be a valid whole number
- Hotel results depend on API availability, destination coverage, and the dates entered
- Some locations may return fewer hotel results than others
`;
    const part4 = `
    # TREMM Help Guide
## /tripbrief
### What it does
- The /tripbrief command helps users create a more complete trip summary by combining multiple parts of travel planning into one command.
- It gathers important trip details such as destination, travel dates, number of adults, optional origin airport, and now whether the user wants to save the trip.
- It can return a broader overview that may include flights, hotels, weather, restaurants, and activities.
- If save:true is selected, it also saves the trip as TXT and JSON files.

### Inputs
- \`destination\`
- \`depart\`
- \`return\`
- optional \`adults\`
- optional \`origin\`
- optional \`save\`

### Input format
- \`destination\` should be a real and recognizable location
- Best format: \`Seattle, WA\`, \`Los Angeles, CA\`, or \`Paris, FR\`
- \`depart\` must be in \`YYYY-MM-DD\` format
- \`return\` must be in \`YYYY-MM-DD\` format
- \`adults\` should be a whole number
- \`origin\`, if used, should be a valid IATA airport code such as SEA, LAX, or JFK
- \`save\` must be either \`true\` or \`false\`

### Output
- A broader trip-planning summary based on the inputs entered
- May include combined travel information such as flights, hotels, weather, restaurants, and activities depending on API availability
- If save:true is used, the bot also confirms the trip was saved and gives the user a tripId
- If saving works, the bot sends the saved TXT file as an attachment

### Restrictions
- \`destination\` must be valid and specific enough to be recognized correctly
- \`depart\` and \`return\` must be in the correct \`YYYY-MM-DD\` format
- \`return\` must be after \`depart\`
- \`adults\` must be a valid whole number if included
- \`origin\` must be a valid IATA airport code if included
- \`save\` only works if the trip generates successfully first
- Results depend on API availability, destination coverage, and whether each part of the trip data is available
- If one part of the trip data is weak or unavailable, some sections of the trip brief may be less detailed, but the command should still avoid crashing
## /help
### What it does
- Shows this help guide
### Inputs
- No extra input required
## Final Tips
- Use real and specific destinations
- Use valid IATA airport codes when needed
- Use correct date formatting
- More complete inputs give better results
`;

    const part5 = `
    ## /savedtrips
### What it does
- The /savedtrips command shows the trips a user has previously saved from /tripbrief.
- It helps users review their saved trip briefs without having to generate them again.
- It displays saved trip information such as destination, trip ID, dates, adults, origin, saved time, and file names.
### Inputs
- optional \`limit\`
### Input format
- \`limit\` should be a whole number
- Default is 10
- Maximum is 20
### Output
- A list of the user's saved trip briefs
- Includes:
  - destination
  - tripId
  - trip dates
  - number of adults
  - origin airport
  - time saved
  - saved TXT and JSON file names
### Restrictions
- Only shows trips saved by that Discord user
- If no trips are saved, it will tell the user they do not have any saved trips yet
- To create a saved trip, the user must use tripbrief with save:true
- The command is sent as an ephemeral response, so only the user can see it
## /deletetrip
### What it does
- The /deletetrip command deletes one of the user's previously saved trip briefs.
- It removes the saved trip files using the trip ID provided by the user.
- It is useful for cleaning up old or unwanted saved trip plans.
### Inputs
- \`tripid\`
### Input format
- tripid must match a valid saved trip ID
- The user should copy the trip ID from savedtrips
### Output
- Confirmation that the saved trip was deleted
- Shows the deleted \`tripId\`
- Shows the files that were removed
### Restrictions
- The trip ID must belong to a trip saved by that Discord user
- If the trip ID is invalid or does not exist, the command will return a warning or error
- The command is sent as an ephemeral response, so only the user can see it
- This command only deletes saved trip files and does not generate a new trip
`


    const chunks = [
      ...splitMessage(part1),
      ...splitMessage(part2),
      ...splitMessage(part3),
      ...splitMessage(part4),
      ...splitMessage(part5),
    ];

    await interaction.editReply({ content: chunks[0] });

    for (const chunk of chunks.slice(1)) {
      await interaction.followUp({ content: chunk });
    }
  },
};