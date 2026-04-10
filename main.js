require("dotenv").config()

const { Client } = require("@fluxerjs/core")
const loadEvents = require("./handlers/loadEvents")
const loadCommands = require("./handlers/loadCommands")

const client = new Client({ 
    intents: 0,
    presence: {
        status: "online",
        custom_status: {
            text: "Counting in communities!"
        }
    }
})

client.commands = new Map()

loadCommands(client)
loadEvents(client)


// BOT SHUTDOWN MESSAGE
const shutdown = async () => {
    console.log("Shutting down, waiting for all messages to be sent!");

    try {
      const [rows] = await client.db.query(
          "SELECT * FROM community_settings"
      );

      if (rows && rows.length > 0) {
        for (const row of rows) {
          try {
            await client.channels.send(row.channel_id, "⚠️ **The bot will be offline for maintenance/updates. Halt counting!**")
            const guild = client.guilds.cache.get(row.community_id);
            console.log(`Sent message for: ${guild ? guild.name : row.community_id}`);
          } catch (err) {
            console.log(err)
          }
        }
      }
    } catch (err) {
      console.log(err);
    } 

    await client.db.end();
    console.log("Database closed. Goodbye!");
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('stopProcessId', shutdown)


client.login(process.env.FLUXER_BOT_TOKEN)