// src/fuzz/fuzz-bot.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. Setup paths for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const foldersPath = path.join(__dirname, '../commands');

// 2. Define "Garbage" Inputs (The Fuzz)
const fuzzInputs = [
    null, 
    undefined, 
    12345, 
    {}, 
    "   ", 
    "SELECT * FROM users", 
    "A".repeat(2000), // Max Discord message length
    "👋 🌍",
    
];

// 3. Mock Interaction Object
const createMockInteraction = (commandName, input) => {
    return {
        commandName: commandName,
        options: {
            getString: () => String(input),
            getInteger: () => (typeof input === 'number' ? input : 0),
            getUser: () => ({ id: '12345', username: 'FuzzUser' }),
            getMember: () => ({ id: '12345', user: { username: 'FuzzUser' } }),
        },
        reply: async (msg) => { /* console.log(`[Bot Reply]: ${JSON.stringify(msg)}`); */ },
        deferReply: async () => {},
        editReply: async () => {},
        followUp: async () => {},
        user: { id: 'fuzzer-id', username: 'FuzzBot' }
    };
};

// 4. Run the Fuzzer
async function runBotFuzzer() {
    console.log("Loading commands for Fuzzing...");
    const commands = new Map();

    // Check if commands folder exists
    if (!fs.existsSync(foldersPath)) {
        console.error(`❌ Error: Could not find commands folder at ${foldersPath}`);
        return;
    }

    const commandFolders = fs.readdirSync(foldersPath);

    for (const folder of commandFolders) {
        const commandsPath = path.join(foldersPath, folder);
        
        // Check if it's a file or folder
        if (fs.statSync(commandsPath).isFile()) {
            if (folder.endsWith('.js')) {
                // DYNAMIC IMPORT 
                const command = await import(commandsPath);
                if (command.default && 'data' in command.default && 'execute' in command.default) {
                    commands.set(command.default.data.name, command.default);
                    console.log(`✅ Loaded: ${command.default.data.name}`);
                }
            }
        } else {
            // It's a folder (e.g., /commands/utility/)
            const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
            for (const file of commandFiles) {
                const filePath = path.join(commandsPath, file);
                const command = await import(filePath);
                if (command.default && 'data' in command.default && 'execute' in command.default) {
                    commands.set(command.default.data.name, command.default);
                    console.log(`✅ Loaded: ${command.default.data.name}`);
                }
            }
        }
    }

    console.log("\n🚀 Starting General Bot Fuzzing...\n");
    let crashCount = 0;

    for (const [name, command] of commands) {
        console.log(`👉 Fuzzing Command: /${name}`);
        
        for (const input of fuzzInputs) {
            const interaction = createMockInteraction(name, input);
            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(`❌ CRASH on /${name} with input: ${input}`);
                console.error(`   Error: ${error.message}`);
                crashCount++;
            }
        }
    }

    console.log(`\n--- Fuzzing Complete ---`);
    console.log(`Total Crashes Found: ${crashCount}`);
}

runBotFuzzer();