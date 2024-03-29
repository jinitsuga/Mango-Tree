require("dotenv").config();
const fs = require("node:fs");

const path = require("node:path");

const { Collection } = require("discord.js");
const { client } = require("./client");
const { createGuild, deleteGuild } = require("./utility/guilds");
const { readGuildFile, writeGuildFile } = require("./utility/tipHandler");

client.commands = new Collection();

const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(
        `The command at ${filePath} is missing either data or execute property.`
      );
    }
  }
}

const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

const guildsPath = path.join(__dirname, "guilds");
client.on("guildCreate", (guild) => {
  console.log(`Joined ${guild.name} with id: ${guild.id}`);
  createGuild(guildsPath, guild.id);
});

client.on("guildDelete", (guild) => {
  console.log(
    `Kicked from guild ${guild.name} with id: ${guild.id} or guild was deleted.`
  );
  deleteGuild(guildsPath, guild.id);
});

setInterval(async () => {
  const guildsPath = path.join(__dirname, "./guilds");
  const guilds = fs.readdirSync(guildsPath);

  for (const guild of guilds) {
    const guildData = await readGuildFile(guild, true);
    if (guildData == []) continue;

    guildData.forEach((member) => (member.coins.usable = 4));
    console.log(guildData);
    await writeGuildFile(guild, guildData, true);
  }
  console.log(guilds);

  // Resetting the "usable" coins every 24 hrs // 86400000
}, 30000 * 60);
