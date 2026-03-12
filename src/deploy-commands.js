// Load the .env file variables into process.env
require("dotenv").config(); 

const { REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");

const commands = [];

const commandsPath = path.join(__dirname, "commands"); 
const files = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));

/*for (const file of files) {
  const imported = require(path.join(commandsPath, file));
  const command = imported.default ?? imported;

  commands.push(command.data.toJSON());
}*/
for (const file of files) {
  const imported = require(path.join(commandsPath, file));
  const command = imported.default ?? imported;

  // Temporary check to find the broken file
  if (command && command.data) {
    commands.push(command.data.toJSON());
  } else {
    console.log(`🚨 CRASH AVERTED: The file ${file} is missing its data export!`);
  }
}

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );
    
    console.log("Successfully reloaded application (/) commands!");
  } catch (error) {
    console.error(error);
  }
})();
