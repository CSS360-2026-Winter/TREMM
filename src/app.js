import "dotenv/config";
import { Client, GatewayIntentBits, Partials, Collection } from "discord.js";
import { loadEvents } from "./helpers";
import path from "path";
import { loadCommands } from "./helpers/loadCommands";

// --- Crash guards (prevents bot from dying on unhandled errors) ---
process.on("unhandledRejection", (err) => {
  console.error("UnhandledRejection:", err);
});

process.on("uncaughtException", (err) => {
  console.error("UncaughtException:", err);
});

const TOKEN = process.env.TOKEN;

if (!TOKEN) {
  console.error("Missing TOKEN in environment. Check your .env / secrets.");
  process.exit(1);
}

const { Guilds, GuildMembers, GuildMessages, MessageContent } =
  GatewayIntentBits;
const { User, Message, GuildMember, ThreadMember } = Partials;

const client = new Client({
  intents: [Guilds, GuildMembers, GuildMessages, MessageContent],
  partials: [User, Message, GuildMember, ThreadMember],
});

client.events = new Collection();

loadEvents(client, path.join(__dirname, "events"));

client.commands = new Collection();
loadCommands(client, path.join(__dirname, "commands"));


client.login(TOKEN);
