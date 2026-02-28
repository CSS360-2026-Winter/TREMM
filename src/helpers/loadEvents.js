import loadFiles from "./loadFiles";
import ascii from "ascii-table";
import path from "path";

export default function loadEvents(client, dirName) {
  client.events.clear();

  const files = loadFiles(dirName, ".js");
  const table = new ascii("Events").setHeading("Event", "Status");

  for (const file of files) {
    const mod = require(path.join(dirName, file));
    const event = mod?.default ?? mod;

    if (!event || !event.name || typeof event.execute !== "function") {
      table.addRow(file, "❌");
      console.warn(`[loadEvents] Invalid event module: ${file}`);
      continue;
    }

    const execute = (...args) => event.execute(...args, client);
    client.events.set(event.name, execute);

    if (event.rest) {
      if (event.once) client.rest.once(event.name, execute);
      else client.rest.on(event.name, execute);
    } else {
      if (event.once) client.once(event.name, execute);
      else client.on(event.name, execute);
    }

    table.addRow(file, "✅");
  }

  console.log(table.toString());
}
